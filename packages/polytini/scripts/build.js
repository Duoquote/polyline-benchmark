// Builds the CommonJS files in dist/ for `require()` consumers. The ESM
// sources in src/ are what import, Bun, Deno and bundlers use directly.
//   node scripts/build.js
// Each dist file is a separate bundle with its own copy of the core, so a
// PolylineError from dist/turf.cjs isn't instanceof the one in dist/node.cjs.
// Check `err.name == 'PolylineError'` or `err.code` across subpaths.
import { build } from 'esbuild';
import { existsSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const node = ['node', 'leaflet-auto'];
const names = ['node', 'web', 'turf', 'leaflet', 'leaflet-auto', 'presets', 'flexible', 'google', 'maplibre', 'mapbox', 'deckgl'];

rmSync(root + 'dist', { recursive: true, force: true });
for (const name of names) {
  if (!existsSync(`${root}src/${name}.js`)) continue;
  await build({
    entryPoints: [`${root}src/${name}.js`],
    outfile: `${root}dist/${name}.cjs`,
    bundle: true,
    format: 'cjs',
    platform: node.includes(name) ? 'node' : 'neutral',
    target: 'es2022',
    external: ['node:*', 'ol', 'ol/*', 'maplibre-gl', 'mapbox-gl', '@deck.gl/*', 'leaflet'],
    logLevel: 'warning',
  });
}
// CommonJS type declarations: the same .d.ts files as .d.cts, so
// TypeScript under node16/nodenext doesn't read the ESM types for require().
mkdirSync(root + 'dist/types', { recursive: true });
for (const f of readdirSync(root + 'types').filter((f) => f.endsWith('.d.ts'))) {
  const src = readFileSync(`${root}types/${f}`, 'utf8').replace(/\.\/([\w-]+)\.d\.ts/g, './$1.d.cts');
  writeFileSync(`${root}dist/types/${f.replace(/\.d\.ts$/, '.d.cts')}`, src);
}
console.log('built dist/*.cjs and dist/types/*.d.cts');
