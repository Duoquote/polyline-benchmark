// Benchmarks polytini's OpenLayers format (src/openlayers.js) against
// ol/format/Polyline, readGeometry and writeGeometry, on the same inputs.
//
//   node --expose-gc bench/openlayers.js [--precision 5|6] [--time 1000] [--rounds 3] [--only ol]
//   bun bench/openlayers.js
//   deno run -A --v8-flags=--expose-gc bench/openlayers.js
//
// Inputs are the fixtures of the polyline-benchmark repo (src/fixtures.js):
// GPS-like tracks of 10 to 100,000 points and, at precision 5, its 1000
// real-world lines. Run it from inside that repo, at packages/polytini.
//
// ol's writeGeometry overwrites the geometry it is given, so every
// writeGeometry call, for both libraries, gets a fresh clone of the
// geometry and the clone is part of the measured time.
//
// Each library runs in its own child process, so the JIT and GC state one
// leaves behind can't change the numbers of the other. Prints million
// points per second, the median of the rounds. Higher is better.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../../../', import.meta.url);
const { Bench } = await import(new URL('node_modules/tinybench/dist/index.js', root).href);
const { benchFixtures } = await import(new URL('src/fixtures.js', root).href);

const args = globalThis.Deno ? Deno.args : process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i == -1 ? fallback : args[i + 1];
};
const precision = Number(opt('precision', 5));
const time = Number(opt('time', 1000));
const rounds = Number(opt('rounds', 3));
const only = opt('only', '');
const worker = opt('worker', null);

// Each timed call handles at least this many points, so short lines are not
// dominated by timer overhead.
const MIN_POINTS_PER_CALL = 20_000;

const libraries = {
  'ol/format/Polyline': async () => (await import('ol/format/Polyline.js')).default,
  'polytini/openlayers': async () => (await import(new URL('../src/openlayers.js', import.meta.url).href)).default,
};

async function benchmark(name) {
  const Format = await libraries[name]();
  const Official = (await import('ol/format/Polyline.js')).default;
  const format = new Format({ factor: 10 ** precision }), official = new Official({ factor: 10 ** precision });
  const collectGarbage = globalThis.gc ?? (globalThis.Bun ? () => globalThis.Bun.gc(true) : () => {});
  let sink = 0;
  const results = [];
  for (const f of benchFixtures(precision)) {
    const geoms = f.encoded.map((s) => official.readGeometry(s));
    // A wrong answer makes the numbers meaningless, so check once first.
    f.encoded.forEach((s, i) => {
      const read = format.readGeometry(s).getFlatCoordinates(), want = geoms[i].getFlatCoordinates();
      if (read.length != want.length || read.some((v, j) => v !== want[j])) throw new Error(`${name} readGeometry is wrong on ${f.name}, line ${i}`);
      if (format.writeGeometry(geoms[i].clone()) !== s) throw new Error(`${name} writeGeometry is wrong on ${f.name}, line ${i}`);
    });
    const ops = {
      readGeometry: (i) => format.readGeometry(f.encoded[i]).getStride(),
      writeGeometry: (i) => format.writeGeometry(geoms[i].clone()).length,
    };
    for (const [op, fn] of Object.entries(ops)) {
      const reps = Math.max(1, Math.ceil(MIN_POINTS_PER_CALL / f.points)), n = f.encoded.length;
      const bench = new Bench({ time, warmupTime: Math.min(250, time), throws: true });
      bench.add(name, () => {
        for (let r = 0; r < reps; r++) for (let i = 0; i < n; i++) sink += fn(i);
      });
      collectGarbage();
      await bench.run();
      const { latency } = bench.tasks[0].result;
      results.push({ op, fixture: f.name, lib: name, mpts: (reps * f.points) / (latency.p50 / 1000) / 1e6 });
    }
  }
  if (sink == 42) console.error('');
  return results;
}

function selfCommand() {
  const script = fileURLToPath(import.meta.url);
  if (globalThis.Deno) return [Deno.execPath(), ['run', '-A', '--v8-flags=--expose-gc', script]];
  if (globalThis.Bun) return [process.execPath, [script]];
  return [process.execPath, [...process.execArgv, script]];
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const fmt = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));

async function main() {
  const names = Object.keys(libraries).filter((n) => n.includes(only));
  const [cmd, base] = selfCommand();
  const runs = [];
  // Rounds are interleaved, so a slow moment on the machine hits both
  // libraries a little instead of one a lot.
  for (let round = 1; round <= rounds; round++) {
    for (const name of names) {
      process.stderr.write(`round ${round}/${rounds} ${name} ... `);
      const child = spawnSync(cmd, [...base, '--worker', name, '--precision', String(precision), '--time', String(time)], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      const line = child.stdout?.split('\n').find((l) => l.startsWith('RESULTS '));
      if (child.status !== 0 || !line) throw new Error(`worker for ${name} failed (status ${child.status}):\n${child.stderr}`);
      runs.push(...JSON.parse(line.slice(8)));
      process.stderr.write('done\n');
    }
  }
  const runtime = globalThis.Bun ? `Bun ${Bun.version}` : globalThis.Deno ? `Deno ${Deno.version.deno}` : `Node ${process.version}`;
  const cols = [...new Set(runs.map((r) => r.fixture))];
  const out = [
    `## OpenLayers Polyline format, ${runtime}, precision ${precision}`,
    '',
    `Million points per second, median of ${rounds} rounds of ${time} ms. Higher is better. writeGeometry includes a geometry clone per call for both libraries.`,
  ];
  for (const op of ['readGeometry', 'writeGeometry']) {
    out.push('', `| ${op} | ${cols.join(' | ')} |`, `|---|${cols.map(() => '--:').join('|')}|`);
    for (const name of names) {
      const cell = (c) => fmt(median(runs.filter((r) => r.op == op && r.fixture == c && r.lib == name).map((r) => r.mpts)));
      out.push(`| ${name} | ${cols.map(cell).join(' | ')} |`);
    }
  }
  console.log(out.join('\n'));
}

if (worker) {
  const results = await benchmark(worker);
  process.stdout.write(`RESULTS ${JSON.stringify(results)}\n`);
} else {
  await main();
}
