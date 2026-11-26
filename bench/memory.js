// Memory per call, per library: how much each encode() or decode() call
// allocates, and how much of that its result keeps alive.
//
//   node --expose-gc --max-semi-space-size=128 bench/memory.js [--rounds 3] [--no-write]
//   deno run -A --v8-flags=--expose-gc,--max-semi-space-size=128 bench/memory.js
//
// For every library, operation and size (100, 10,000 and 100,000 points,
// plus the 1000 real-world lines for the batch rows), in a fresh process:
// - allocated: heap + external memory growth over N calls whose results are
//   thrown away, with a young generation big enough (128 MB) that no
//   garbage collection runs in between, divided by N
// - retained: the growth over N calls whose results are kept, with a full
//   GC before and after, divided by N. That's the size of the result.
// External memory counts typed-array results and WebAssembly memory, so the
// WASM rows include the memory the module grows to; it grows once and is
// reused, so the per-call numbers don't repeat it.
//
// Only V8 runtimes: JavaScriptCore (Bun) doesn't count young allocations
// until a collection runs, and its heap figures counted typed arrays twice
// when I checked, so Bun numbers would be wrong.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { implementations, polytiniEntry } from '../src/implementations.js';
import { benchFixtures } from '../src/fixtures.js';
import { environment } from '../src/environment.js';
import { roundOrder } from './measure.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const isDeno = !!globalThis.Deno;
const usage = isDeno ? () => Deno.memoryUsage() : () => process.memoryUsage();
const bytes = () => {
  const u = usage();
  return u.heapUsed + u.external;
};
const SIZES = ['100 pts', '10,000 pts', '100,000 pts', 'real-world'];
// About this many points per measured loop: enough to average out object
// headers, small enough to stay inside the 128 MB young generation.
const POINTS = 200_000;

function cell(impl, op, fixture) {
  const gc = globalThis.gc;
  const batch = !!impl.batch, all = op === 'encode' ? fixture.coords.map((c) => impl.toNative(c)) : fixture.encoded;
  // Per-line rows get one line per call (the real-world set: each of its
  // lines once); batch rows get all the lines in one call.
  const calls = batch ? [all] : all;
  const fn = (x) => impl[op](x, 5);
  const per = batch ? fixture.points : fixture.points / fixture.encoded.length;
  const n = Math.max(1, Math.round(POINTS / per / calls.length)) * calls.length;
  for (let i = 0; i < 5; i++) for (const x of calls) fn(x); // warm up, and grow WASM memory
  let sink = 0;
  gc();
  gc();
  let before = bytes();
  for (let i = 0; i < n; i++) sink += fn(calls[i % calls.length]).length ?? 1;
  const allocated = (bytes() - before) / n;
  const keep = new Array(n);
  gc();
  gc();
  before = bytes();
  for (let i = 0; i < n; i++) keep[i] = fn(calls[i % calls.length]);
  gc();
  gc();
  const retained = (bytes() - before) / n;
  if (!(keep.length && sink >= 0)) throw new Error('unreachable');
  // Per point, so a batch call over 1000 lines compares with a single line.
  const pts = batch ? fixture.points : per;
  return { op, fixture: fixture.name, impl: impl.name, allocated, retained, allocatedPerPoint: allocated / pts, retainedPerPoint: retained / pts };
}

const worker = opt('worker', null);
if (worker) {
  if (!globalThis.gc) throw new Error('run with --expose-gc');
  const impl = implementations.find((i) => i.name === worker);
  const fixtures = benchFixtures(5).filter((f) => SIZES.includes(f.name));
  const out = [];
  for (const op of ['decode', 'encode']) {
    if (!impl[op]) continue;
    for (const f of fixtures) {
      if (impl.batch ? f.encoded.length < 2 : f.name === 'real-world') continue;
      out.push(cell(impl, op, f));
    }
  }
  console.log('RESULTS ' + JSON.stringify(out));
} else {
  const rounds = Number(opt('rounds', 3)), write = !args.includes('--no-write');
  const env = environment();
  const flags = ['--expose-gc', '--max-semi-space-size=128'];
  const self = fileURLToPath(import.meta.url);
  const cmd = isDeno ? [Deno.execPath(), ['run', '-A', `--v8-flags=${flags.join(',')}`, self]] : [process.execPath, [...flags, self]];
  const impls = implementations.filter((i) => i.precisions.includes(5));
  const runs = [];
  for (let round = 1; round <= rounds; round++) {
    for (const impl of roundOrder(impls, round)) {
      process.stderr.write(`memory round ${round}/${rounds} ${impl.name} ... `);
      const r = spawnSync(cmd[0], [...cmd[1], '--worker', impl.name], { encoding: 'utf8', maxBuffer: 1 << 26 });
      const line = r.stdout?.split('\n').find((l) => l.startsWith('RESULTS '));
      if (r.status !== 0 || !line) throw new Error(`memory worker for ${impl.name} failed:\n${r.stderr}`);
      runs.push(...JSON.parse(line.slice(8)).map((x) => ({ ...x, round })));
      process.stderr.write('done\n');
    }
  }
  const median = (xs) => [...xs].sort((a, b) => a - b)[(xs.length - 1) >> 1];
  const results = [];
  for (const r of runs.filter((x) => x.round === 1)) {
    const same = runs.filter((x) => x.impl === r.impl && x.op === r.op && x.fixture === r.fixture);
    const pick = (k) => median(same.map((x) => x[k]));
    const spread = (k) => {
      const xs = same.map((x) => x[k]), m = median(xs);
      return m > 0 ? (Math.max(...xs) - Math.min(...xs)) / m : 0;
    };
    results.push({
      op: r.op, fixture: r.fixture, impl: r.impl,
      allocated: pick('allocated'), retained: pick('retained'),
      allocatedPerPoint: pick('allocatedPerPoint'), retainedPerPoint: pick('retainedPerPoint'),
      spread: Math.max(spread('allocated'), spread('retained')),
    });
  }
  const data = { env, rounds, polytiniEntry: polytiniEntry(), results, runs };
  console.log(JSON.stringify(results.map((r) => [r.impl, r.op, r.fixture, Math.round(r.allocated), Math.round(r.retained), r.spread.toFixed(2)])));
  if (write) {
    const dir = fileURLToPath(new URL('../results/', import.meta.url));
    mkdirSync(dir, { recursive: true });
    const name = env.runtime === 'node' ? `node-${env.runtimeVersion.slice(1).split('.')[0]}` : env.runtime;
    writeFileSync(`${dir}memory-${name}.json`, JSON.stringify(data, null, 2) + '\n');
    console.error(`wrote results/memory-${name}.json`);
  }
}
