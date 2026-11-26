// Minified and gzipped size of every library, measured the same way for all:
// esbuild bundles what the import pulls in (browser conditions, minified,
// ESM), then zlib gzip level 9.
//
//   node bench/size.js            print the table
//   node bench/size.js --write    also write results/size.md and .json
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { version } from '../src/implementations.js';

const root = fileURLToPath(new URL('..', import.meta.url));

// What a user imports to get encode and decode. Keeping every export
// observable (globalThis.x = m) stops tree shaking from dropping anything
// the package exports.
const all = (pkg) => `import * as m from '${pkg}'; globalThis.x = m;`;
const rows = [
  ['@mapbox/polyline', all('@mapbox/polyline')],
  ['@googlemaps/polyline-codec', all('@googlemaps/polyline-codec')],
  ['google-polyline', all('google-polyline')],
  ['@pirxpilot/google-polyline', all('@pirxpilot/google-polyline')],
  ['@placemarkio/polyline', all('@placemarkio/polyline')],
  ['polyline-encoded', all('polyline-encoded')],
  ['decode-google-map-polyline', all('decode-google-map-polyline')],
  ['@lp-labs/polyline-codec', all('@lp-labs/polyline-codec')],
  ['@duoquote/polytini', all('@duoquote/polytini'), 'browser entry, every export'],
  ['@duoquote/polytini', all('@duoquote/polytini/web'), 'web entry, every export'],
  ['@duoquote/polytini', "import { encode, decode } from '@duoquote/polytini'; globalThis.x = [encode, decode];", 'encode and decode only'],
  ['@duoquote/polytini', all('@duoquote/polytini/node'), 'node entry', 'node'],
  ['@duoquote/polytini', all('@duoquote/polytini/wasm'), 'wasm, JS glue plus inlined .wasm'],
  ['ol', "import { encodeDeltas, decodeDeltas } from 'ol/format/Polyline.js'; globalThis.x = [encodeDeltas, decodeDeltas];", 'encodeDeltas/decodeDeltas'],
  ['ol', "import Polyline from 'ol/format/Polyline.js'; globalThis.x = Polyline;", 'ol/format/Polyline'],
  ['@here/flexpolyline', all('@here/flexpolyline'), 'HERE Flexible Polyline'],
  ['@duoquote/polytini', all('@duoquote/polytini/flexible'), 'flexible'],
];

const out = [];
for (const [pkg, code, note, platform = 'browser'] of rows) {
  const r = await build({ stdin: { contents: code, resolveDir: root, loader: 'js' }, bundle: true, minify: true, format: 'esm', platform, external: ['node:*'], write: false, logLevel: 'silent' });
  const bytes = r.outputFiles[0].contents;
  out.push({ name: `${pkg}@${version(pkg)}${note ? ` (${note})` : ''}`, min: bytes.length, gzip: gzipSync(bytes, { level: 9 }).length });
}

const kb = (n) => (n >= 1024 ? `${(n / 1024).toFixed(1)} KB` : `${n} B`);
const md = ['| Package | Minified | Gzipped |', '|---|--:|--:|', ...out.map((r) => `| ${r.name} | ${kb(r.min)} | ${kb(r.gzip)} |`)].join('\n');
console.log(md);
if (process.argv.includes('--write')) {
  writeFileSync(`${root}results/size.md`, `## Bundle size\n\nesbuild ${(await import('esbuild')).version}, browser conditions (node entry: node), minified ESM, gzip level 9. Measured ${new Date().toISOString().slice(0, 10)}.\n\n${md}\n`);
  writeFileSync(`${root}results/size.json`, JSON.stringify(out, null, 2) + '\n');
}
