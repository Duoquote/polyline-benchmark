// Every adapter from src/adapters.js, with the installed package version.
// Node, Bun and Deno only; the browser benchmark passes versions in.
import { readFileSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defs, flexDefs, withShapes } from './adapters.js';

export function version(pkg) {
  const file = fileURLToPath(new URL(`../node_modules/${pkg}/package.json`, import.meta.url));
  return JSON.parse(readFileSync(realpathSync(file), 'utf8')).version;
}

const runtime = globalThis.Bun ? 'bun' : globalThis.Deno ? 'deno' : 'node';

export const implementations = defs.filter((d) => !d.skipIn?.includes(runtime)).map((d) => withShapes(d, version(d.pkg)));

/** HERE Flexible Polyline implementations (a different format). */
export const flexImplementations = flexDefs.map((d) => withShapes(d, version(d.pkg)));

/** The file the bare `@duoquote/polytini` import resolved to on this runtime. */
export function polytiniEntry() {
  const url = import.meta.resolve('@duoquote/polytini');
  return url.slice(url.indexOf('/src/') + 1);
}
