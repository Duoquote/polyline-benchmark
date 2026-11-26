// Benchmarks polytini's deck.gl module (src/deckgl.js): decoding many
// encoded lines into deck.gl's binary path format, against decoding to
// arrays with decode() and then building the same typed arrays, and against
// decoding to arrays for deck.gl's plain getPath accessor.
//
//   node --expose-gc bench/deckgl.js [--time 1000] [--rounds 3] [--only binary]
//   bun bench/deckgl.js
//   deno run -A --v8-flags=--expose-gc bench/deckgl.js
//
// Inputs: the 1000 real-world lines of the polyline-benchmark repo
// (precision 5), and a synthetic set of 10,000 GPS-like lines of 50 to 150
// points each. Run it from inside that repo, at packages/polytini.
//
// Two numbers per variant and input:
// - "data": the time to produce what is passed to the layer as `data`.
// - "+ tesselator": that plus deck.gl's own CPU work on it, through the
//   PathTesselator a PathLayer runs when its data changes (binary data with
//   _pathType 'open', accessor data normalized as deck.gl does by default).
//   No GPU upload is included.
//
// Each variant runs in its own child process, so the JIT and GC state one
// leaves behind can't change the numbers of the next. Prints million points
// per second, the median of the rounds. Higher is better.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../../../', import.meta.url);
const { Bench } = await import(new URL('node_modules/tinybench/dist/index.js', root).href);
const { realWorldLines, gpsTrack, ANCHORS } = await import(new URL('src/fixtures.js', root).href);
const { binaryPaths } = await import(new URL('../src/deckgl.js', import.meta.url).href);
const { decode, encode } = await import(new URL('../src/web.js', import.meta.url).href);

const args = globalThis.Deno ? Deno.args : process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i == -1 ? fallback : args[i + 1];
};
const time = Number(opt('time', 1000));
const rounds = Number(opt('rounds', 3));
const only = opt('only', '');
const worker = opt('worker', null);

function inputs() {
  const synthetic = [];
  for (let i = 0; i < 10_000; i++) {
    const points = 50 + ((i * 7919) % 101);
    synthetic.push(encode(gpsTrack({ points, seed: 20_000 + i, anchor: ANCHORS[i % 4], precision: 5 }), 5));
  }
  return [
    { name: 'real-world (1000 lines)', lines: realWorldLines() },
    { name: 'synthetic (10,000 lines)', lines: synthetic },
  ].map((f) => ({ ...f, points: f.lines.reduce((n, s) => n + decode(s).length, 0) }));
}

const lngLat = { order: 'lnglat' };

// decode() to [lng, lat] arrays, then the same binary object binaryPaths makes.
function viaDecode(lines) {
  const paths = lines.map((s) => decode(s, lngLat));
  let n = 0;
  for (const p of paths) n += p.length;
  const value = new Float64Array(n * 2), startIndices = new Uint32Array(paths.length + 1);
  let k = 0;
  for (let i = 0; i < paths.length; i++) {
    startIndices[i] = k / 2;
    for (const [x, y] of paths[i]) {
      value[k++] = x;
      value[k++] = y;
    }
  }
  startIndices[paths.length] = k / 2;
  return { length: paths.length, startIndices, attributes: { getPath: { value, size: 2 } } };
}

const variants = {
  'polytini binaryPaths': { make: (lines) => binaryPaths(lines), binary: true },
  'polytini binaryPaths float32': { make: (lines) => binaryPaths(lines, { float32: true }), binary: true },
  'decode() + typed arrays': { make: viaDecode, binary: true },
  'decode() + getPath accessor': { make: (lines) => lines.map((s) => ({ path: decode(s, lngLat) })), binary: false },
};

async function benchmark(name) {
  const { default: PathTesselator } = await import(new URL('./path-layer/path-tesselator.js', import.meta.resolve('@deck.gl/layers')).href);
  const v = variants[name];
  const collectGarbage = globalThis.gc ?? (globalThis.Bun ? () => globalThis.Bun.gc(true) : () => {});
  let sink = 0;
  const results = [];
  for (const f of inputs()) {
    // A wrong answer makes the numbers meaningless, so check once first.
    const want = binaryPaths(f.lines);
    if (v.binary) {
      const got = v.make(f.lines), gv = got.attributes.getPath.value, wv = want.attributes.getPath.value;
      const close = name.includes('float32') ? (a, b) => a === Math.fround(b) : (a, b) => a === b;
      if (gv.length != wv.length || !gv.every((x, i) => close(x, wv[i])) || got.startIndices.join() != want.startIndices.join()) throw new Error(`${name} is wrong on ${f.name}`);
    }
    const tess = new PathTesselator({ fp64: !name.includes('float32'), positionFormat: 'XY' });
    const update = (data) =>
      v.binary
        ? tess.updateGeometry({ data, geometryBuffer: data.attributes.getPath, buffers: { ...data.attributes }, normalize: false })
        : tess.updateGeometry({ data, getGeometry: (o) => o.path, normalize: true });
    update(v.make(f.lines));
    if (tess.instanceCount < f.points) throw new Error(`${name}: the tesselator saw ${tess.instanceCount} of ${f.points} vertices on ${f.name}`);
    const ops = {
      data: () => (sink += v.make(f.lines).length),
      '+ tesselator': () => {
        update(v.make(f.lines));
        sink += tess.instanceCount;
      },
    };
    for (const [op, fn] of Object.entries(ops)) {
      const bench = new Bench({ time, warmupTime: Math.min(250, time), throws: true });
      bench.add(name, fn);
      collectGarbage();
      await bench.run();
      const { latency } = bench.tasks[0].result;
      results.push({ op, fixture: f.name, lib: name, mpts: f.points / (latency.p50 / 1000) / 1e6 });
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
  const names = Object.keys(variants).filter((n) => n.includes(only));
  const [cmd, base] = selfCommand();
  const runs = [];
  // Rounds are interleaved, so a slow moment on the machine hits every
  // variant a little instead of one a lot.
  for (let round = 1; round <= rounds; round++) {
    for (const name of names) {
      process.stderr.write(`round ${round}/${rounds} ${name} ... `);
      const child = spawnSync(cmd, [...base, '--worker', name, '--time', String(time)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
      const line = child.stdout?.split('\n').find((l) => l.startsWith('RESULTS '));
      if (child.status !== 0 || !line) throw new Error(`worker for ${name} failed (status ${child.status}):\n${child.stderr}`);
      runs.push(...JSON.parse(line.slice(8)));
      process.stderr.write('done\n');
    }
  }
  const runtime = globalThis.Bun ? `Bun ${Bun.version}` : globalThis.Deno ? `Deno ${Deno.version.deno}` : `Node ${process.version}`;
  const fixtures = [...new Set(runs.map((r) => r.fixture))];
  const cols = fixtures.flatMap((f) => ['data', '+ tesselator'].map((op) => [f, op]));
  const out = [
    `## deck.gl binary paths, ${runtime}, precision 5`,
    '',
    `Million points per second, median of ${rounds} rounds of ${time} ms. Higher is better. "+ tesselator" adds deck.gl's PathTesselator update (CPU only).`,
    '',
    `| variant | ${cols.map(([f, op]) => `${f} ${op}`).join(' | ')} |`,
    `|---|${cols.map(() => '--:').join('|')}|`,
  ];
  for (const name of names) {
    const cell = ([f, op]) => fmt(median(runs.filter((r) => r.op == op && r.fixture == f && r.lib == name).map((r) => r.mpts)));
    out.push(`| ${name} | ${cols.map(cell).join(' | ')} |`);
  }
  console.log(out.join('\n'));
}

if (worker) {
  const results = await benchmark(worker);
  process.stdout.write(`RESULTS ${JSON.stringify(results)}\n`);
} else {
  await main();
}
