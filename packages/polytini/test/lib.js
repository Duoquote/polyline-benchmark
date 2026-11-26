// A very small test harness that runs the same on Node, Bun and Deno.
//   import { test, eq, near, throws, entries } from './lib.js';
//   test('name', async () => { eq(actual, expected) });
// test/run.js imports every test/*.test.js file and runs what they register.
export const tests = [];
export const test = (name, fn) => tests.push({ name, fn });

export class AssertionError extends Error {}
const show = (v) => {
  try {
    const s = JSON.stringify(v, (k, x) => (typeof x == 'number' && !Number.isFinite(x) ? String(x) : ArrayBuffer.isView(x) ? Array.from(x) : x));
    return s && s.length > 200 ? s.slice(0, 200) + '...' : s;
  } catch {
    return String(v);
  }
};
export function ok(cond, message = 'expected true') {
  if (!cond) throw new AssertionError(message);
}
/** Deep equality; numbers must be identical (Object.is, except 0 == -0). */
export function eq(actual, expected, message = '') {
  const same = (a, b) => {
    if (typeof a == 'number' && typeof b == 'number') return a === b || (a !== a && b !== b);
    if (ArrayBuffer.isView(a)) a = Array.from(a);
    if (ArrayBuffer.isView(b)) b = Array.from(b);
    if (Array.isArray(a) && Array.isArray(b)) return a.length == b.length && a.every((x, i) => same(x, b[i]));
    if (a && b && typeof a == 'object' && typeof b == 'object') {
      const ka = Object.keys(a), kb = Object.keys(b);
      return ka.length == kb.length && ka.every((k) => same(a[k], b[k]));
    }
    return a === b;
  };
  if (!same(actual, expected)) throw new AssertionError(`${message ? message + ': ' : ''}got ${show(actual)}, expected ${show(expected)}`);
}
/** Like eq, but numbers may differ by `tol`. */
export function near(actual, expected, tol = 1e-9, message = '') {
  const close = (a, b) => {
    if (typeof a == 'number') return Math.abs(a - b) <= tol || a === b;
    if (ArrayBuffer.isView(a)) a = Array.from(a);
    if (ArrayBuffer.isView(b)) b = Array.from(b);
    if (Array.isArray(a)) return Array.isArray(b) && a.length == b.length && a.every((x, i) => close(x, b[i]));
    if (a && typeof a == 'object') return b && typeof b == 'object' && Object.keys(b).every((k) => close(a[k], b[k]));
    return a === b;
  };
  if (!close(actual, expected)) throw new AssertionError(`${message ? message + ': ' : ''}got ${show(actual)}, expected ${show(expected)} (within ${tol})`);
}
/** Expects fn to throw. `code` checks PolylineError#code when given. */
export function throws(fn, code, message = '') {
  let err;
  try {
    fn();
  } catch (e) {
    err = e;
  }
  if (!err) throw new AssertionError(`${message ? message + ': ' : ''}expected a throw`);
  if (code && err.code !== code) throw new AssertionError(`${message ? message + ': ' : ''}expected code ${code}, got ${err.code} (${err.message})`);
  return err;
}

const here = (p) => new URL(p, import.meta.url).href;
let cached;
/**
 * Every Google-format entry point that can load on this runtime, each with
 * the same API: web, browser, node, bun, deno and wasm (after init).
 */
export async function entries() {
  if (cached) return cached;
  const list = [];
  for (const name of ['web', 'browser', 'node', 'bun', 'deno']) list.push({ name, api: await import(here(`../src/${name}.js`)) });
  // The node entry's appending decode, which only V8 12 uses on its own.
  const { Buffer } = await import('node:buffer');
  const { fast } = await import(here('../src/fast.js'));
  list.push({ name: 'node (appending)', api: { ...list.find((e) => e.name == 'node').api, ...fast(Buffer, 0) } });
  const wasm = await import(here('../src/wasm.js'));
  await wasm.init();
  list.push({ name: 'wasm', api: wasm });
  return (cached = list);
}

/** Reads a JSON file relative to test/. */
export async function json(path) {
  const url = new URL(path, import.meta.url);
  if (globalThis.Deno) return JSON.parse(await Deno.readTextFile(url));
  const { readFile } = await import('node:fs/promises');
  return JSON.parse(await readFile(url, 'utf8'));
}
