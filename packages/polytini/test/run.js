// Runs every test/*.test.js on the current runtime: node test/run.js,
// bun test/run.js or deno run -A test/run.js. Optional filter: a substring
// of the file name, e.g. `node test/run.js leaflet`.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tests, AssertionError } from './lib.js';

const dir = fileURLToPath(new URL('.', import.meta.url));
const filter = (globalThis.Deno ? Deno.args : process.argv.slice(2))[0] ?? '';
const files = readdirSync(dir).filter((f) => f.endsWith('.test.js') && f.includes(filter)).sort();
const runtime = globalThis.Bun ? `Bun ${Bun.version}` : globalThis.Deno ? `Deno ${Deno.version.deno}` : `Node ${process.version}`;
let passed = 0, failed = 0;
for (const file of files) {
  const start = tests.length;
  await import(new URL(file, import.meta.url).href);
  for (const t of tests.slice(start)) {
    try {
      await t.fn();
      passed++;
    } catch (err) {
      failed++;
      console.error(`FAIL ${file} > ${t.name}\n  ${err instanceof AssertionError ? err.message : err?.stack ?? err}`);
    }
  }
}
console.log(`${runtime}: ${passed} passed, ${failed} failed, ${files.length} files`);
if (failed) (globalThis.Deno ? Deno.exit(1) : (process.exitCode = 1));
