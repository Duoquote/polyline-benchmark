// Minified and gzipped size of every library, for the imports people write:
// decode only, encode only, both, and the whole entry. Built the same way
// for every library with three bundlers in production mode, then zlib gzip
// level 9:
// - esbuild: bundle, minify, ESM, browser platform. The chart uses these.
// - Rollup with @rollup/plugin-node-resolve (browser), @rollup/plugin-commonjs
//   and @rollup/plugin-terser, ESM output.
// - webpack 5, mode production, target web, ESM output.
// Each entry keeps what it imports observable (globalThis.x = [...]), so
// nothing it asked for is dropped. "whole entry" is `import * as m`, which
// keeps every export plus the namespace object the bundler builds for it.
// Tree shaking only helps ES modules: the CommonJS packages
// (@mapbox/polyline, polyline-encoded, decode-google-map-polyline) come out
// the same size whatever is imported.
//
//   node bench/size.js            print the tables
//   node bench/size.js --write    also write results/size.md and .json
import { build, version as esbuildVersion } from 'esbuild';
import { rollup, VERSION as rollupVersion } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import webpack from 'webpack';
import { gzipSync } from 'node:zlib';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { version } from '../src/implementations.js';

const root = fileURLToPath(new URL('..', import.meta.url));
export const IMPORTS = ['decode', 'encode', 'both', 'whole'];
export const IMPORT_LABELS = { decode: 'decode only', encode: 'encode only', both: 'decode and encode', whole: 'whole entry' };

const keep = (names) => `globalThis.x = [${names.join(', ')}];`;
const whole = (pkg) => `import * as m from '${pkg}'; globalThis.x = m;`;
// Named imports for ES modules, the default export for CommonJS packages
// (what their READMEs show).
const named = (pkg, d = 'decode', e = 'encode') => ({
  decode: `import { ${d} } from '${pkg}'; ${keep([d])}`,
  encode: `import { ${e} } from '${pkg}'; ${keep([e])}`,
  both: `import { ${d}, ${e} } from '${pkg}'; ${keep([d, e])}`,
  whole: whole(pkg),
});
const viaDefault = (pkg) => ({
  decode: `import m from '${pkg}'; ${keep(['m.decode'])}`,
  encode: `import m from '${pkg}'; ${keep(['m.encode'])}`,
  both: `import m from '${pkg}'; ${keep(['m.decode', 'm.encode'])}`,
  whole: whole(pkg),
});

// [package, note, imports, platform]. The first row per package is its
// default import; the chart shows those.
const rows = [
  ['@duoquote/polytini', '', named('@duoquote/polytini')],
  ['@mapbox/polyline', '', viaDefault('@mapbox/polyline')],
  ['@googlemaps/polyline-codec', '', named('@googlemaps/polyline-codec')],
  ['google-polyline', '', viaDefault('google-polyline')],
  ['@pirxpilot/google-polyline', '', named('@pirxpilot/google-polyline')],
  ['@placemarkio/polyline', '', named('@placemarkio/polyline')],
  ['polyline-encoded', '', viaDefault('polyline-encoded')],
  ['decode-google-map-polyline', 'decodes only', { decode: `import d from 'decode-google-map-polyline'; ${keep(['d'])}`, whole: whole('decode-google-map-polyline') }],
  ['@lp-labs/polyline-codec', '', named('@lp-labs/polyline-codec', 'decodePolyline', 'encodePolyline')],
  ['ol', 'encodeDeltas/decodeDeltas', { ...named('ol/format/Polyline.js', 'decodeDeltas', 'encodeDeltas'), whole: undefined }],
  ['@duoquote/polytini/lite', '', named('@duoquote/polytini/lite')],
  ['@duoquote/polytini', '/web entry', named('@duoquote/polytini/web')],
  ['@duoquote/polytini', 'node entry', named('@duoquote/polytini/node'), 'node'],
  ['@duoquote/polytini', '/wasm, JS glue plus inlined .wasm', { decode: `import { init, decode } from '@duoquote/polytini/wasm'; ${keep(['init', 'decode'])}`, encode: `import { init, encode } from '@duoquote/polytini/wasm'; ${keep(['init', 'encode'])}`, both: `import { init, decode, encode } from '@duoquote/polytini/wasm'; ${keep(['init', 'decode', 'encode'])}`, whole: whole('@duoquote/polytini/wasm') }],
  ['ol', 'ol/format/Polyline', { whole: "import Polyline from 'ol/format/Polyline.js'; globalThis.x = Polyline;" }],
  ['@here/flexpolyline', 'HERE Flexible Polyline', viaDefault('@here/flexpolyline')],
  ['@duoquote/polytini', '/flexible', named('@duoquote/polytini/flexible')],
];

const gz = (b) => ({ min: b.length, gzip: gzipSync(b, { level: 9 }).length });

async function viaEsbuild(file, platform) {
  const r = await build({ entryPoints: [file], bundle: true, minify: true, format: 'esm', platform, external: ['node:*'], write: false, logLevel: 'silent' });
  return gz(r.outputFiles[0].contents);
}

async function viaRollup(file, platform) {
  const b = await rollup({
    input: file,
    external: (id) => id.startsWith('node:'),
    plugins: [nodeResolve({ browser: platform == 'browser', exportConditions: platform == 'node' ? ['node'] : [] }), commonjs(), terser()],
    onwarn: () => {},
  });
  const { output } = await b.generate({ format: 'es' });
  await b.close();
  return gz(Buffer.from(output[0].code));
}

function viaWebpack(file, platform, dir) {
  return new Promise((ok, fail) => {
    webpack({
      mode: 'production',
      target: platform == 'node' ? 'node' : 'web',
      entry: file,
      output: { path: dir, filename: 'out.js', module: true },
      experiments: { outputModule: true },
      externalsType: 'module',
      externals: [({ request }, cb) => (request.startsWith('node:') ? cb(null, 'module ' + request) : cb())],
      performance: { hints: false },
      devtool: false,
    }, (err, stats) => {
      if (err || stats.hasErrors()) return fail(err ?? new Error(stats.toString('errors-only')));
      ok(gz(readFileSync(join(dir, 'out.js'))));
    });
  });
}

const tmp = mkdtempSync(join(tmpdir(), 'polyline-size-'));
const out = [];
let n = 0;
try {
  for (const [pkg, note, imports, platform = 'browser'] of rows) {
    const row = { pkg, version: version(pkg.replace(/\/format\/.*$|\/lite$/, '')), note, platform, imports: {} };
    for (const k of IMPORTS) {
      if (!imports[k]) continue;
      // Entries in the repo, so packages resolve from its node_modules.
      const file = join(root, 'bench', `.size-entry-${n++}.mjs`);
      writeFileSync(file, imports[k] + '\n');
      try {
        row.imports[k] = { esbuild: await viaEsbuild(file, platform), rollup: await viaRollup(file, platform), webpack: await viaWebpack(file, platform, join(tmp, String(n))) };
      } finally {
        rmSync(file);
      }
    }
    out.push(row);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

const webpackVersion = webpack.version;
const kb = (v) => `${v.toLocaleString('en-US')} B`;
const name = (r) => `${r.pkg}@${r.version}${r.note ? ` (${r.note})` : ''}`;
const cell = (r, k, b) => (r.imports[k] ? kb(r.imports[k][b].gzip) : '');
const tables = [
  `Gzipped, esbuild ${esbuildVersion}. Each column is one import; "whole entry" is \`import * as m\`. Minified sizes are in results/size.json.`,
  '',
  `| Package | ${IMPORTS.map((k) => IMPORT_LABELS[k]).join(' | ')} |`,
  `|---|${IMPORTS.map(() => '--:').join('|')}|`,
  ...out.map((r) => `| ${name(r)} | ${IMPORTS.map((k) => cell(r, k, 'esbuild')).join(' | ')} |`),
  '',
  `The same imports with Rollup ${rollupVersion} and webpack ${webpackVersion}, gzipped. Rollup / webpack in each cell.`,
  '',
  `| Package | ${IMPORTS.map((k) => IMPORT_LABELS[k]).join(' | ')} |`,
  `|---|${IMPORTS.map(() => '--:').join('|')}|`,
  ...out.map((r) => `| ${name(r)} | ${IMPORTS.map((k) => (r.imports[k] ? `${cell(r, k, 'rollup')} / ${cell(r, k, 'webpack')}` : '')).join(' | ')} |`),
].join('\n');
console.log(tables);
if (process.argv.includes('--write')) {
  const date = new Date().toISOString().slice(0, 10);
  writeFileSync(`${root}results/size.md`, `## Bundle size\n\nesbuild ${esbuildVersion}, Rollup ${rollupVersion} and webpack ${webpackVersion}, production builds for the browser (the node entry for Node), minified ESM, gzip level 9. Measured ${date}.\n\n${tables}\n`);
  writeFileSync(`${root}results/size.json`, JSON.stringify({ date, bundlers: { esbuild: esbuildVersion, rollup: rollupVersion, webpack: webpackVersion }, rows: out }, null, 2) + '\n');
}
