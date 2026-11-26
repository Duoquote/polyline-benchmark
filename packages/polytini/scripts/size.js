// Minified and gzipped size of every entry point, checked against budgets.
//   node scripts/size.js           print the table, exit 1 over budget
//   node scripts/size.js --json    machine-readable
// Sizes come from esbuild (bundle, minify, ESM) and zlib gzip level 9, the
// same way for the competitors in the benchmark repo (bench/size.js there).
import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const external = ['node:*', 'ol', 'ol/*', 'maplibre-gl', 'mapbox-gl', '@deck.gl/*', 'leaflet'];

// Budgets in gzipped bytes, about 4% over the size when they were set, so
// CI catches real growth. Raise them on purpose, in the same commit.
export const entries = [
  { name: 'default / web (everything)', file: 'src/web.js', platform: 'browser', budget: 2050 },
  { name: 'web, encode + decode only', code: "export { encode, decode } from './src/web.js'", platform: 'browser', budget: 1830 },
  { name: 'browser (the "browser" condition)', file: 'src/browser.js', platform: 'browser', budget: 2330 },
  { name: 'node', file: 'src/node.js', platform: 'node', budget: 2700 },
  { name: 'bun', file: 'src/bun.js', platform: 'node', budget: 2700 },
  { name: 'deno', file: 'src/deno.js', platform: 'browser', budget: 2570 },
  { name: 'wasm (JS glue + inlined .wasm)', file: 'src/wasm.js', platform: 'browser', budget: 2920 },
  { name: 'leaflet', file: 'src/leaflet.js', platform: 'browser', budget: 2060 },
  { name: 'turf', file: 'src/turf.js', platform: 'browser', budget: 2320 },
  { name: 'presets', file: 'src/presets.js', platform: 'browser', budget: 300 },
  { name: 'flexible', file: 'src/flexible.js', platform: 'browser', budget: 2120 },
  { name: 'google', file: 'src/google.js', platform: 'browser', budget: 2070 },
  { name: 'openlayers', file: 'src/openlayers.js', platform: 'browser', budget: 910 },
  { name: 'maplibre', file: 'src/maplibre.js', platform: 'browser', budget: 1690 },
  { name: 'mapbox', file: 'src/mapbox.js', platform: 'browser', budget: 1690 },
  { name: 'deckgl', file: 'src/deckgl.js', platform: 'browser', budget: 2110 },
  { name: 'cli', file: 'src/cli.js', platform: 'node', budget: 3990 },
];

export async function measure(e) {
  const r = await build({
    ...(e.code ? { stdin: { contents: e.code, resolveDir: root, loader: 'js' } } : { entryPoints: [root + e.file] }),
    bundle: true,
    minify: true,
    format: 'esm',
    platform: e.platform,
    external,
    write: false,
    logLevel: 'silent',
  });
  const out = r.outputFiles[0].contents;
  return { min: out.length, gzip: gzipSync(out, { level: 9 }).length };
}

if (import.meta.url == `file:///${process.argv[1].replace(/\\/g, '/').replace(/^\//, '')}` || process.argv[1]?.endsWith('size.js')) {
  const json = process.argv.includes('--json');
  const rows = [];
  let over = 0;
  for (const e of entries) {
    if (e.file && !existsSync(root + e.file)) continue;
    const s = await measure(e);
    const ok = s.gzip <= e.budget;
    if (!ok) over++;
    rows.push({ name: e.name, ...s, budget: e.budget, ok });
  }
  if (json) console.log(JSON.stringify(rows, null, 2));
  else {
    console.log('| entry | minified | gzipped | budget |\n|---|--:|--:|--:|');
    for (const r of rows) console.log(`| ${r.name} | ${r.min} B | ${r.gzip} B | ${r.budget} B${r.ok ? '' : ' OVER'} |`);
  }
  if (over) {
    console.error(`${over} entr${over == 1 ? 'y is' : 'ies are'} over budget`);
    process.exitCode = 1;
  }
}
