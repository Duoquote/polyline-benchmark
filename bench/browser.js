// The same benchmark in headless Chrome. Every library runs in a fresh
// browser process per round, through the same measure() loop as
// bench/run.js, on the same fixtures.
//
//   node bench/browser.js [--precision 5] [--time 120] [--rounds 5] [--only x] [--no-write]
//
// Uses the locally installed Chrome through playwright-core (no browser
// download). Bundles src/adapters.js with esbuild for the browser, so
// @duoquote/polytini resolves through its "browser" condition, like a real
// web app would. Pages are served from http://127.0.0.1, not file://.
//
// Optional: with GOOGLE_MAPS_API_KEY set, it also times
// google.maps.geometry.encoding.decodePath/encodePath. Google's terms need a
// key for the Maps JavaScript API, so without one that row is skipped. The
// key is only ever put into the HTML of that one page, in memory: it is
// never written to disk or printed, and the run fails if it shows up in any
// result file. The Maps script is loaded once per run (not per round), so
// that row runs its rounds in one page instead of one page per round.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import { createRequire } from 'node:module';

import { realWorldLines } from '../src/fixtures.js';
import { defs } from '../src/adapters.js';
import { version } from '../src/implementations.js';
import { summarize, tables, roundOrder } from './measure.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const precision = Number(opt('precision', 5));
const time = Number(opt('time', 120));
const rounds = Number(opt('rounds', 5));
const only = opt('only', '');
const write = !args.includes('--no-write');
const KEY = process.env.GOOGLE_MAPS_API_KEY || '';
const scrub = (s) => (KEY ? String(s).split(KEY).join('[key]') : String(s));
const root = fileURLToPath(new URL('..', import.meta.url));

const versions = Object.fromEntries([...new Set(defs.map((d) => d.pkg))].map((p) => [p, version(p)]));

// The page script: the adapters, fixtures and measure loop, bundled.
const entry = `
import { Bench } from 'tinybench';
import { defs, withShapes } from './src/adapters.js';
import { makeFixtures } from './src/fixtures-core.js';
import { measure } from './bench/measure.js';
import realWorld from 'virtual:real-world';
const q = new URLSearchParams(location.search);
const versions = ${JSON.stringify(versions)};
const precision = Number(q.get('precision')), time = Number(q.get('time')), rounds = Number(q.get('rounds') || 1);
const name = q.get('impl');
const fixtures = makeFixtures(precision, precision === 5 ? realWorld : []);
const gc = globalThis.gc ?? (() => {});
async function googleImpl() {
  await window.__mapsReady;
  const g = google.maps, enc = g.geometry.encoding;
  return {
    name, shape: 'googleLatLng',
    toNative: (points) => points.map(([lat, lng]) => new g.LatLng(lat, lng)),
    fromNative: (path) => path.map((p) => [p.lat(), p.lng()]),
    encode: (path) => enc.encodePath(path),
    decode: (str) => enc.decodePath(str),
  };
}
window.__run = (async () => {
  if (!crossOriginIsolated) throw new Error('page is not cross-origin isolated; timer resolution would be coarse');
  const impl = name === 'google.maps.geometry.encoding'
    ? await googleImpl()
    : defs.map((d) => withShapes(d, versions[d.pkg])).find((d) => d.name === name);
  if (!impl) throw new Error('no such implementation: ' + name);
  const out = [];
  for (let r = 1; r <= rounds; r++) out.push(...(await measure(impl, fixtures, { Bench, precision, time, gc })).map((x) => ({ ...x, round: r })));
  return out;
})();
`;

const bundle = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'js' },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  write: false,
  metafile: true,
  logLevel: 'warning',
  plugins: [
    {
      name: 'real-world',
      setup(b) {
        b.onResolve({ filter: /^virtual:real-world$/ }, () => ({ path: 'real-world', namespace: 'v' }));
        b.onLoad({ filter: /.*/, namespace: 'v' }, () => ({ contents: JSON.stringify(realWorldLines()), loader: 'json' }));
      },
    },
  ],
});
const js = bundle.outputFiles[0].contents;
// Which polytini file the browser build picked.
const polytiniFiles = Object.keys(bundle.metafile.inputs).filter((f) => f.includes('polytini/src/')).map((f) => f.slice(f.indexOf('src/')));
const polytiniEntry = ['src/web.js', 'src/node.js', 'src/bun.js', 'src/deno.js'].find((f) => polytiniFiles.includes(f));

const html = (impl) =>
  `<!doctype html><meta charset="utf-8"><title>bench</title>` +
  (impl === 'google.maps.geometry.encoding'
    ? `<script>window.__mapsReady = new Promise((r) => (window.__mapsLoaded = r));</script>` +
      `<script async src="https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&libraries=geometry&loading=async&callback=__mapsLoaded"></script>`
    : '') +
  `<script type="module" src="/bench.js"></script>`;

// Cross-origin isolation: without it Chrome rounds performance.now() to
// 100 microseconds, which is coarse next to one timed call (20,000 points,
// a few hundred microseconds). Isolated pages get 5 microseconds.
// credentialless still lets the Maps script load.
const isolation = { 'cross-origin-opener-policy': 'same-origin', 'cross-origin-embedder-policy': 'credentialless' };
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/bench.js') {
    res.writeHead(200, { 'content-type': 'text/javascript', ...isolation });
    res.end(js);
  } else if (url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'no-store', ...isolation });
    res.end(html(url.searchParams.get('impl')));
  } else {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

// One Chrome for the whole run, and a fresh browser context for every page,
// so each library still starts in a new renderer process with a cold JIT.
// Launching Chrome every time took a minute and a half of the run.
let browser;
async function runPage(impl, roundsInPage) {
  browser ??= await chromium.launch({ channel: 'chrome', headless: true, args: ['--js-flags=--expose-gc'] });
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(scrub(e.message)));
    const qs = new URLSearchParams({ impl, precision, time, rounds: roundsInPage });
    await page.goto(`http://127.0.0.1:${port}/?${qs}`);
    await page.waitForFunction(() => window.__run, null, { timeout: 60_000 });
    const out = await page.evaluate(() => window.__run).catch((e) => {
      throw new Error(scrub(`${impl}: ${e.message}\n${errors.join('\n')}`));
    });
    return { results: out, version: browser.version() };
  } finally {
    await context.close();
  }
}

const names = defs
  .filter((d) => d.precisions.includes(precision) && !d.skipIn?.includes('browser'))
  .map((d) => (d.variant ? `${d.pkg}@${versions[d.pkg]} (${d.variant})` : `${d.pkg}@${versions[d.pkg]}`))
  .filter((n) => n.includes(only));
const runs = [];
let chrome = '';
try {
  for (let round = 1; round <= rounds; round++) {
    for (const name of roundOrder(names, round)) {
      process.stderr.write(`round ${round}/${rounds} ${name} ... `);
      const { results, version } = await runPage(name, 1);
      chrome = version;
      runs.push(...results.map((r) => ({ ...r, round })));
      process.stderr.write('done\n');
    }
  }
  if (KEY && 'google.maps.geometry.encoding'.includes(only)) {
    process.stderr.write(`google.maps.geometry.encoding, ${rounds} rounds in one page ... `);
    const { results } = await runPage('google.maps.geometry.encoding', rounds);
    runs.push(...results);
    process.stderr.write('done\n');
  } else if (!KEY) process.stderr.write('GOOGLE_MAPS_API_KEY not set: skipping google.maps.geometry.encoding\n');
} finally {
  await browser?.close();
  server.close();
}

const { results, medianSpread, worstSpread } = summarize(runs);
const env = {
  runtime: 'browser',
  runtimeLabel: `Chrome ${chrome} (headless)`,
  engine: 'V8',
  cpu: os.cpus()[0]?.model?.trim(),
  threads: os.cpus().length,
  memoryGiB: Math.round(os.totalmem() / 2 ** 30),
  os: `${os.type()} ${os.release()} ${os.arch()}`,
  date: new Date().toISOString().slice(0, 10),
};
const flatNames = new Set(defs.filter((d) => d.group === 'flat').map((d) => `${d.pkg}@${versions[d.pkg]} (${d.variant})`));
const cols = ['10 pts', '100 pts', '1,000 pts', '10,000 pts', '100,000 pts', ...(precision === 5 ? ['real-world'] : [])];
const md = [
  `## ${env.runtimeLabel}, precision ${precision}`,
  '',
  `- Browser: ${env.runtimeLabel}, through playwright-core with the installed Chrome`,
  `- CPU: ${env.cpu}, ${env.threads} threads, ${env.memoryGiB} GiB RAM`,
  `- OS: ${env.os}`,
  `- Date: ${env.date}`,
  `- \`@duoquote/polytini\` resolved to \`${polytiniEntry}\` (esbuild, browser conditions)`,
  `- google.maps.geometry.encoding: ${KEY ? `included, Maps JavaScript API loaded once, its ${rounds} rounds ran in one page` : 'not included (needs GOOGLE_MAPS_API_KEY)'}`,
  '',
  `Million points per second. Each cell is the median of ${rounds} rounds, and each round is the median sample of a ${time} ms tinybench run in a fresh browser process. Higher is better. Rows are sorted by the 10,000 point column.`,
  '',
  `Spread between the fastest and slowest round of a cell: median ${(medianSpread * 100).toFixed(0)}%, worst ${(worstSpread * 100).toFixed(0)}%.`,
  '',
  tables(results, cols, flatNames),
  '',
].join('\n');
console.log('\n' + scrub(md));

if (write) {
  const dir = `${root}results/`;
  mkdirSync(dir, { recursive: true });
  const base = `${dir}browser${precision === 5 ? '' : `-p${precision}`}`;
  writeFileSync(`${base}.md`, md);
  writeFileSync(`${base}.json`, JSON.stringify({ env, precision, time, rounds, polytiniEntry, googleMaps: !!KEY, results, runs }, null, 2) + '\n');
  // The key must never end up in a result file.
  for (const f of [`${base}.md`, `${base}.json`]) {
    if (KEY && readFileSync(f, 'utf8').includes(KEY)) {
      rmSync(f);
      throw new Error(`the API key appeared in ${f}; the file was deleted`);
    }
  }
  console.error(`wrote ${base}.md and .json`);
}
