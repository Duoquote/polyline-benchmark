// Runs the whole benchmark matrix, one runtime after another, so runs never
// overlap:
//
//   node bench/matrix.js [--time 1000] [--rounds 3] [--skip node22,browser]
//
// - Bun, then Node 22, 23, 24, 25 and 26, then Deno: bench/run.js
// - HERE Flexible Polyline (bench/run.js --format flexible) on Bun, Node 24 and Deno
// - headless Chrome: bench/browser.js (with google.maps.geometry if
//   GOOGLE_MAPS_API_KEY is set)
// - bundle sizes: bench/size.js
//
// Node versions other than the one running this script come from
// `npx -p node@<major>`, so the global Node install is never changed. Set
// BUN or DENO to pick a binary: a machine can have more than one Bun on
// PATH, and Node's child_process doesn't always find the one your shell
// does. Each step logs the version it actually ran.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const time = opt('time', '1000');
const rounds = opt('rounds', '3');
const skip = new Set(opt('skip', '').split(',').filter(Boolean));
const root = fileURLToPath(new URL('..', import.meta.url));
const common = ['--time', time, '--rounds', rounds];
const mine = process.versions.node.split('.')[0];

const node = (major) => (major === mine ? [process.execPath] : ['npx', '-y', '-p', `node@${major}`, 'node']);
const bun = [process.env.BUN || 'bun'];
const deno = [process.env.DENO || 'deno'];
const denoRun = [...deno, 'run', '--allow-read', '--allow-write', '--allow-sys', '--allow-env', '--allow-run', '--v8-flags=--expose-gc'];
// [name, the runtime's own command, its arguments]
const steps = [
  ['bun', bun, ['bench/run.js', ...common]],
  ...['22', '23', '24', '25', '26'].map((v) => [`node${v}`, node(v), ['--expose-gc', 'bench/run.js', ...common]]),
  ['deno', deno, [...denoRun.slice(1), 'bench/run.js', ...common]],
  ['flexible-bun', bun, ['bench/run.js', '--format', 'flexible', ...common]],
  ['flexible-node24', node('24'), ['--expose-gc', 'bench/run.js', '--format', 'flexible', ...common]],
  ['flexible-deno', deno, [...denoRun.slice(1), 'bench/run.js', '--format', 'flexible', ...common]],
  ['browser', [process.execPath], ['bench/browser.js', ...common]],
  ['size', [process.execPath], ['bench/size.js', '--write']],
];

const run = ([cmd, ...pre], rest, stdio) =>
  spawnSync(cmd, [...pre, ...rest], { cwd: root, stdio, encoding: 'utf8', shell: process.platform === 'win32' && cmd === 'npx' });

for (const [name, runtime, rest] of steps) {
  if (skip.has(name)) continue;
  const start = Date.now();
  const version = run(runtime, ['--version'], 'pipe').stdout?.split('\n')[0].trim();
  console.error(`\n=== ${name}:${[...runtime, ...rest].join(' ')} (${version})`);
  const r = run(runtime, rest, ['ignore', 'inherit', 'inherit']);
  console.error(`=== ${name}: exit ${r.status}, ${((Date.now() - start) / 60000).toFixed(1)} min`);
  if (r.status !== 0) process.exitCode = 1;
}
