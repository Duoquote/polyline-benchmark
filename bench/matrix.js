// Runs the whole benchmark matrix: about 10 minutes with the default 3
// jobs, about 30 with --jobs 1.
//
//   node bench/matrix.js [--time 120] [--rounds 5] [--jobs 3] [--skip node22,browser]
//   node bench/matrix.js --quick     about 2 minutes, for development
//
// --quick is 50 ms cells and one round, writes nothing to results/ and
// leaves out google.maps.geometry.encoding, so it doesn't use up the Maps
// API quota. Only the full run produces the published numbers.
//
// - Bun, Node 22, 23, 24, 25 and 26, and Deno: bench/run.js
// - HERE Flexible Polyline (bench/run.js --format flexible) on Bun, Node 24 and Deno
// - headless Chrome: bench/browser.js (with google.maps.geometry if
//   GOOGLE_MAPS_API_KEY is set)
// - memory per call on Node 24 and Deno: bench/memory.js
// - bundle sizes: bench/size.js
//
// Up to --jobs steps run at once, each a single-threaded process on its own
// core. Libraries are only compared within one step, where they share the
// same conditions, so parallel steps add noise but no bias. Use --jobs 1 for
// the quietest numbers. Each step's output goes to results/logs/<step>.log.
//
//   node bench/matrix.js --jobs 1 --prio high --affinity 0xF000
//
// is what the published runs use on Windows, the same as polytini's
// bench/ab.js: one step at a time, high priority, pinned to logical CPUs
// 12 to 15. `--affinity` pins this process, and Windows passes the mask on
// to every child, Chrome included (Chrome's own processes stay at normal
// priority). `--prio high` sets BENCH_PRIORITY=high,
// and run.js, memory.js and browser.js raise their own priority from it,
// because a child doesn't inherit a high priority class. Both are Windows
// only; elsewhere they're ignored. results/logs/matrix.log has the time of
// every step. `npm run bench:clean` runs exactly this.
//
// Node versions other than the one running this script come from
// `npx -p node@<major>`, so the global Node install is never changed. Set
// BUN or DENO to pick a binary: a machine can have more than one Bun on
// PATH, and Node's child_process doesn't always find the one your shell
// does. Each step logs the version it actually ran.
import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const quick = args.includes('--quick');
const time = opt('time', quick ? '50' : '120');
const rounds = opt('rounds', quick ? '1' : '5');
const jobs = Number(opt('jobs', quick ? '4' : '3'));
const skip = new Set(opt('skip', '').split(',').filter(Boolean));
const root = fileURLToPath(new URL('..', import.meta.url));
const logs = `${root}results/logs/`;
mkdirSync(logs, { recursive: true });
const prio = opt('prio', 'normal'), affinity = opt('affinity', null);
if (affinity && process.platform === 'win32') {
  spawnSync('powershell', ['-NoProfile', '-Command', `(Get-Process -Id ${process.pid}).ProcessorAffinity = ${Number(affinity)}`], { stdio: 'inherit' });
}
if (prio === 'high') process.env.BENCH_PRIORITY = 'high';
const common = ['--time', time, '--rounds', rounds, ...(quick ? ['--no-write'] : [])];
if (quick) delete process.env.GOOGLE_MAPS_API_KEY;
const mine = process.versions.node.split('.')[0];

const node = (major) => (major === mine ? [process.execPath] : ['npx', '-y', '-p', `node@${major}`, 'node']);
const bun = [process.env.BUN || 'bun'];
const deno = [process.env.DENO || 'deno'];
const denoFlags = ['run', '--allow-read', '--allow-write', '--allow-sys', '--allow-env', '--allow-run', '--v8-flags=--expose-gc'];
// [name, the runtime's own command, its arguments], longest first so the
// last job doesn't start late.
const steps = [
  ['browser', [process.execPath], ['bench/browser.js', ...common]],
  ['bun', bun, ['bench/run.js', ...common]],
  ...['22', '23', '24', '25', '26'].map((v) => [`node${v}`, node(v), ['--expose-gc', 'bench/run.js', ...common]]),
  ['deno', deno, [...denoFlags, 'bench/run.js', ...common]],
  ['flexible-bun', bun, ['bench/run.js', '--format', 'flexible', ...common]],
  ['flexible-node24', node('24'), ['--expose-gc', 'bench/run.js', '--format', 'flexible', ...common]],
  ['flexible-deno', deno, [...denoFlags, 'bench/run.js', '--format', 'flexible', ...common]],
  // Memory: V8 only (see bench/memory.js), one Node is enough.
  ['memory-node24', node('24'), ['--expose-gc', '--max-semi-space-size=128', 'bench/memory.js', ...(quick ? ['--rounds', '1', '--no-write'] : [])]],
  ['memory-deno', deno, ['run', '-A', '--v8-flags=--expose-gc,--max-semi-space-size=128', 'bench/memory.js', ...(quick ? ['--rounds', '1', '--no-write'] : [])]],
  ['size', [process.execPath], ['bench/size.js', ...(quick ? [] : ['--write'])]],
].filter(([name]) => !skip.has(name));

const shell = (cmd) => process.platform === 'win32' && cmd === 'npx';
const started = Date.now();
const mins = (t) => ((Date.now() - t) / 60000).toFixed(1);
const matrixLog = createWriteStream(`${logs}matrix.log`);
const say = (line) => {
  console.error(line);
  matrixLog.write(`${new Date().toISOString()} ${line}
`);
};
say(`jobs ${jobs}, time ${time} ms, rounds ${rounds}, priority ${prio}${affinity ? `, affinity ${affinity}` : ''}`);

function runStep([name, [cmd, ...pre], rest]) {
  // --version doesn't need the deno subcommand flags.
  const version = spawnSync(cmd, [...pre, '--version'], { encoding: 'utf8', shell: shell(cmd) }).stdout?.split('\n')[0].trim();
  say(`start ${name} (${version})`);
  const log = createWriteStream(`${logs}${name}.log`);
  log.write(`${[cmd, ...pre, ...rest].join(' ')}\n${version}\n`);
  const t = Date.now();
  return new Promise((done) => {
    const child = spawn(cmd, [...pre, ...rest], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], shell: shell(cmd) });
    child.stdout.pipe(log, { end: false });
    child.stderr.pipe(log, { end: false });
    child.on('close', (code) => {
      log.end();
      say(`${code === 0 ? 'done ' : 'FAIL '} ${name}: exit ${code}, ${mins(t)} min${code === 0 ? '' : `, see results/logs/${name}.log`}`);
      if (code !== 0) process.exitCode = 1;
      done();
    });
  });
}

const queue = [...steps];
await Promise.all(Array.from({ length: Math.min(jobs, queue.length) }, async () => {
  while (queue.length) await runStep(queue.shift());
}));
say(`all steps finished in ${mins(started)} min`);
matrixLog.end();
