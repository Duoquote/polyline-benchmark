// Benchmark every implementation on every fixture, for decode and encode.
//
//   node --expose-gc bench/run.js [--precision 5|6] [--time 1000] [--only mapbox] [--no-write]
//
// Each implementation runs in its own child process, so the JIT and GC state
// one library leaves behind can't change the numbers of the next one.
// Prints markdown and writes results/<runtime>.md plus results/<runtime>.json.
import { Bench } from 'tinybench';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { implementations } from '../src/implementations.js';
import { benchFixtures } from '../src/fixtures.js';
import { environment, environmentMarkdown } from '../src/environment.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const precision = Number(opt('precision', 5));
const time = Number(opt('time', 1000));
const only = opt('only', '');
const write = !args.includes('--no-write');
const worker = opt('worker', null); // internal: benchmark one implementation and print JSON

// Each timed call processes at least this many points, so short lines are not
// dominated by timer overhead. 10 pts -> 2000 repetitions per timed call.
const MIN_POINTS_PER_CALL = 20_000;

const env = environment();

if (worker) {
  const impl = implementations.find((i) => i.name === worker);
  const results = await benchmark(impl);
  process.stdout.write(`RESULTS ${JSON.stringify(results)}\n`);
} else {
  await main();
}

async function benchmark(impl) {
  const collectGarbage = globalThis.gc ?? (globalThis.Bun ? () => globalThis.Bun.gc(true) : () => {});
  let sink = 0; // results feed into this so the work can't be optimised away
  const results = [];
  for (const op of ['decode', 'encode']) {
    if (!impl[op]) continue;
    for (const fixture of benchFixtures(precision)) {
      const reps = Math.max(1, Math.ceil(MIN_POINTS_PER_CALL / fixture.points));
      const lines = fixture.encoded;
      const inputs = op === 'encode' ? fixture.coords.map((c) => impl.toNative(c)) : lines;

      // Check once outside the timed loop: the numbers mean nothing for an
      // implementation that returns the wrong answer.
      inputs.forEach((input, i) => {
        const out = impl[op](input, precision);
        const ok = op === 'encode' ? out === lines[i] : out.length === fixture.coords[i].length;
        if (!ok) throw new Error(`${impl.name} ${op} gives a wrong result on ${fixture.name}, line ${i}`);
      });

      const fn = impl[op];
      const bench = new Bench({ time, warmupTime: Math.min(250, time), throws: true });
      bench.add(impl.name, () => {
        for (let r = 0; r < reps; r++) {
          for (let i = 0; i < inputs.length; i++) sink += fn(inputs[i], precision).length;
        }
      });
      collectGarbage();
      await bench.run();

      const { latency } = bench.tasks[0].result;
      results.push({
        op,
        fixture: fixture.name,
        impl: impl.name,
        points: fixture.points,
        reps,
        samples: latency.samplesCount,
        medianMs: latency.p50,
        meanMs: latency.mean,
        rme: latency.rme,
        mptsPerSec: (reps * fixture.points) / (latency.p50 / 1000) / 1e6,
      });
    }
  }
  if (sink === 42) console.error(''); // keep `sink` observable
  return results;
}

// The command that starts this same script on the current runtime.
function selfCommand() {
  const script = fileURLToPath(import.meta.url);
  if (globalThis.Deno) {
    return [globalThis.Deno.execPath(), ['run', '--allow-read', '--allow-sys', '--allow-env', '--v8-flags=--expose-gc', script]];
  }
  if (globalThis.Bun) return [process.execPath, [script]];
  return [process.execPath, [...process.execArgv, script]];
}

async function main() {
  const impls = implementations.filter((i) => i.precisions.includes(precision) && i.name.includes(only));
  const [cmd, baseArgs] = selfCommand();
  const results = [];
  for (const impl of impls) {
    process.stderr.write(`${impl.name} ... `);
    const child = spawnSync(cmd, [...baseArgs, '--worker', impl.name, '--precision', String(precision), '--time', String(time)], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    const line = child.stdout?.split('\n').find((l) => l.startsWith('RESULTS '));
    if (child.status !== 0 || !line) {
      throw new Error(`worker for ${impl.name} failed (status ${child.status}):\n${child.stderr}`);
    }
    results.push(...JSON.parse(line.slice('RESULTS '.length)));
    process.stderr.write('done\n');
  }

  const fixtures = benchFixtures(precision).map((f) => f.name);
  const md = [
    `## ${env.runtimeLabel}, precision ${precision}`,
    '',
    environmentMarkdown(env),
    '',
    'Million points per second, from the median sample. Higher is better. Rows are sorted by the 10,000 point column.',
    '',
    table(results, fixtures, 'decode'),
    '',
    table(results, fixtures, 'encode'),
    '',
  ].join('\n');

  console.log('\n' + md);

  if (write) {
    const dir = fileURLToPath(new URL('../results/', import.meta.url));
    mkdirSync(dir, { recursive: true });
    const base = `${dir}${env.runtime}${precision === 5 ? '' : `-p${precision}`}`;
    writeFileSync(`${base}.md`, md);
    writeFileSync(`${base}.json`, JSON.stringify({ env, precision, time, results }, null, 2) + '\n');
    console.error(`wrote ${base}.md and .json`);
  }
}

function table(results, cols, op) {
  const fmt = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  const rows = results.filter((r) => r.op === op);
  const names = [...new Set(rows.map((r) => r.impl))];
  const get = (impl, col) => rows.find((r) => r.impl === impl && r.fixture === col);
  // Sort by the 10,000 point column.
  const key = cols.find((c) => c.startsWith('10,000')) ?? cols[0];
  names.sort((a, b) => get(b, key).mptsPerSec - get(a, key).mptsPerSec);

  const lines = [`| ${op} | ${cols.join(' | ')} |`, `|---|${cols.map(() => '--:').join('|')}|`];
  for (const name of names) {
    const cells = cols.map((c) => fmt(get(name, c).mptsPerSec));
    lines.push(`| ${name} | ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}
