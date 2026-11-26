// Benchmark every implementation on every fixture, for decode and encode.
//
//   node --expose-gc bench/run.js [--precision 5|6] [--time 1000] [--rounds 5] [--only mapbox] [--no-write]
//
// Each implementation runs in its own child process, so the JIT and GC state
// one library leaves behind can't change the numbers of the next one.
// Prints markdown and writes results/<runtime>.md plus results/<runtime>.json
// (Node results are per major version: results/node-24.md and so on).
import { Bench } from 'tinybench';
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { implementations as googleImpls, flexImplementations, polytiniEntry } from '../src/implementations.js';
import { benchFixtures, flexFixtures } from '../src/fixtures.js';
import { encodeFlexible } from '../src/adapters.js';
import { environment, environmentMarkdown } from '../src/environment.js';
import { measure, summarize, tables, roundOrder } from './measure.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const precision = Number(opt('precision', 5));
const time = Number(opt('time', 1000));
const only = opt('only', '');
const write = !args.includes('--no-write');
const rounds = Number(opt('rounds', 5));
const worker = opt('worker', null); // internal: benchmark one implementation and print JSON
// google (default) or flexible: HERE's Flexible Polyline, a different format.
const format = opt('format', 'google');
const implementations = format === 'flexible' ? flexImplementations : googleImpls;
const fixturesFor = (p) => (format === 'flexible' ? flexFixtures(p, encodeFlexible) : benchFixtures(p));

const env = environment();

if (worker) {
  const impl = implementations.find((i) => i.name === worker);
  const gc = globalThis.gc ?? (globalThis.Bun ? () => globalThis.Bun.gc(true) : () => {});
  const results = await measure(impl, fixturesFor(precision), { Bench, precision, time, gc });
  process.stdout.write(`RESULTS ${JSON.stringify(results)}\n`);
} else {
  await main();
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
  const runs = []; // one array of worker results per (round, implementation)
  // Rounds are interleaved, and each round runs the libraries in a
  // different order, so a slow minute on the machine hits every library a
  // little instead of one library a lot.
  for (let round = 1; round <= rounds; round++) {
    for (const impl of roundOrder(impls, round)) {
      process.stderr.write(`round ${round}/${rounds} ${impl.name} ... `);
      const child = spawnSync(cmd, [...baseArgs, '--worker', impl.name, '--format', format, '--precision', String(precision), '--time', String(time)], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
      const line = child.stdout?.split('\n').find((l) => l.startsWith('RESULTS '));
      if (child.status !== 0 || !line) {
        throw new Error(`worker for ${impl.name} failed (status ${child.status}):\n${child.stderr}`);
      }
      runs.push(...JSON.parse(line.slice('RESULTS '.length)).map((r) => ({ ...r, round })));
      process.stderr.write('done\n');
    }
  }

  const { results, medianSpread, worstSpread } = summarize(runs);
  const entry = polytiniEntry();
  const fixtures = fixturesFor(precision).map((f) => f.name);
  const flatNames = new Set(impls.filter((i) => i.group === 'flat').map((i) => i.name));
  const md = [
    `## ${env.runtimeLabel}, ${format === 'flexible' ? 'HERE Flexible Polyline, ' : ''}precision ${precision}`,
    '',
    environmentMarkdown(env),
    `- \`@duoquote/polytini\` resolved to \`${entry}\``,
    '',
    `Million points per second. Each cell is the median of ${rounds} rounds, and each round is the median sample of a ${time} ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.`,
    '',
    `Spread between the fastest and slowest round of a cell: median ${(medianSpread * 100).toFixed(0)}%, worst ${(worstSpread * 100).toFixed(0)}%.`,
    '',
    tables(results, fixtures, flatNames),
    '',
  ].join('\n');

  console.log('\n' + md);

  if (write) {
    const dir = fileURLToPath(new URL('../results/', import.meta.url));
    mkdirSync(dir, { recursive: true });
    const name = env.runtime === 'node' ? `node-${env.runtimeVersion.slice(1).split('.')[0]}` : env.runtime;
    const base = `${dir}${name}${format === 'flexible' ? '-flexible' : ''}${precision === 5 ? '' : `-p${precision}`}`;
    writeFileSync(`${base}.md`, md);
    writeFileSync(`${base}.json`, JSON.stringify({ env, precision, time, rounds, polytiniEntry: entry, groups: { flat: [...flatNames] }, results, runs }, null, 2) + '\n');
    console.error(`wrote ${base}.md and .json`);
  }
}
