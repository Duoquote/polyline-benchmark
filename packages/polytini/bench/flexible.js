// Benchmarks polytini's Flexible Polyline codec (src/flexible.js) against
// the official @here/flexpolyline, on the same inputs.
//
//   node --expose-gc bench/flexible.js [--precision 5] [--time 1000] [--rounds 3] [--only here] [--dims 2,3]
//   bun bench/flexible.js
//   deno run -A --v8-flags=--expose-gc bench/flexible.js
//
// Inputs are the GPS-like tracks of the polyline-benchmark repo
// (src/fixtures.js), plus its real-world lines at precision 5. The 3D runs
// add an elevation to every point: a seeded random walk in meters, stored
// with one decimal as ELEVATION. Run it from inside that repo, at
// packages/polytini, where both fixtures and tinybench are found.
//
// Each library runs in its own child process, so the JIT and GC state one
// leaves behind can't change the numbers of the other. Prints million
// points per second, the median of the rounds. Higher is better.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = new URL('../../../', import.meta.url);
const { Bench } = await import(new URL('node_modules/tinybench/dist/index.js', root).href);
const { benchFixtures, rng } = await import(new URL('src/fixtures.js', root).href);

const args = globalThis.Deno ? Deno.args : process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i == -1 ? fallback : args[i + 1];
};
const precision = Number(opt('precision', 5));
const time = Number(opt('time', 1000));
const rounds = Number(opt('rounds', 3));
const only = opt('only', '');
const dimsList = opt('dims', '2,3').split(',').map(Number);
const worker = opt('worker', null);

// Each timed call handles at least this many points, so short lines are not
// dominated by timer overhead.
const MIN_POINTS_PER_CALL = 20_000;

const libraries = {
  polytini: async () => import(new URL('../src/flexible.js', import.meta.url).href),
  '@here/flexpolyline': async () => createRequire(import.meta.url)('@here/flexpolyline'),
};

// The same lines for both libraries: [lat, lng] or [lat, lng, elevation].
function fixtures(dims) {
  return benchFixtures(precision).map((f, n) => {
    const rand = rng(7000 + n);
    const lines = f.coords.map((line) => {
      let z = Math.floor(rand() * 20000); // decimeters, 0 to 2000 m
      return line.map(([lat, lng]) => {
        z = Math.max(-4000, z + Math.floor(rand() * 21) - 10);
        return dims == 3 ? [lat, lng, z / 10] : [lat, lng];
      });
    });
    const header = { precision, thirdDim: dims == 3 ? 3 : 0, thirdDimPrecision: dims == 3 ? 1 : 0 };
    return { name: f.name, points: f.points, inputs: lines.map((polyline) => ({ ...header, polyline })) };
  });
}

async function benchmark(name) {
  const lib = await libraries[name]();
  const collectGarbage = globalThis.gc ?? (globalThis.Bun ? () => globalThis.Bun.gc(true) : () => {});
  const official = createRequire(import.meta.url)('@here/flexpolyline');
  let sink = 0;
  const results = [];
  for (const dims of dimsList) {
    for (const f of fixtures(dims)) {
      const encoded = f.inputs.map((input) => official.encode(input));
      for (const op of ['decode', 'encode']) {
        const inputs = op == 'encode' ? f.inputs : encoded;
        const fn = op == 'encode' ? (x) => lib.encode(x).length : (x) => lib.decode(x).polyline.length;
        // A wrong answer makes the numbers meaningless, so check once first.
        inputs.forEach((input, i) => {
          const out = op == 'encode' ? lib.encode(input) : lib.decode(input).polyline;
          const good = op == 'encode' ? out === encoded[i] : out.length === f.inputs[i].polyline.length && out[0].length === dims;
          if (!good) throw new Error(`${name} ${op} gives a wrong result on ${f.name} ${dims}D, line ${i}`);
        });
        const reps = Math.max(1, Math.ceil(MIN_POINTS_PER_CALL / f.points));
        const bench = new Bench({ time, warmupTime: Math.min(250, time), throws: true });
        bench.add(name, () => {
          for (let r = 0; r < reps; r++) for (let i = 0; i < inputs.length; i++) sink += fn(inputs[i]);
        });
        collectGarbage();
        await bench.run();
        const { latency } = bench.tasks[0].result;
        results.push({ op, dims, fixture: f.name, lib: name, mpts: (reps * f.points) / (latency.p50 / 1000) / 1e6 });
      }
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
      const child = spawnSync(cmd, [...base, '--worker', name, '--precision', String(precision), '--time', String(time), '--dims', dimsList.join(',')], {
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
  const out = [`## Flexible Polyline, ${runtime}, precision ${precision}`, '', `Million points per second, median of ${rounds} rounds of ${time} ms. Higher is better.`];
  for (const dims of dimsList) {
    for (const op of ['decode', 'encode']) {
      out.push('', `| ${op} ${dims}D | ${cols.join(' | ')} |`, `|---|${cols.map(() => '--:').join('|')}|`);
      for (const name of names) {
        const cell = (c) => fmt(median(runs.filter((r) => r.op == op && r.dims == dims && r.fixture == c && r.lib == name).map((r) => r.mpts)));
        out.push(`| ${name} | ${cols.map(cell).join(' | ')} |`);
      }
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
