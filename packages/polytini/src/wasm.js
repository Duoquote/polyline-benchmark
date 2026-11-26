// Opt-in WebAssembly build. Call `await init()` once, then the functions are
// synchronous and take the same arguments as the main entry.
//
// The WASM module only does the number crunching. Moving data in and out is
// JS work and is part of every call: the string is copied into WASM memory
// (ucs2Write where Buffer exists, otherwise encodeInto), and decoded points
// are read back out of a Float64Array into new [lat, lng] arrays. Anything
// unusual (objects, other dimensions, bad input) goes to the JS core, so the
// results and errors are the same as the main entry's.
/* @ts-self-types="../types/wasm.d.ts" */
import bytes from './wasm-bytes.js';
import { opts, st, slowDecode, slowEncode, fail, latLngs, toGeo, fromGeo } from './core.js';

export { PolylineError } from './core.js';

let ex, mem, u8, f64;
const B = globalThis.Buffer;
const ucs2Write = B?.prototype.ucs2Write, latin1Slice = B?.prototype.latin1Slice;
const te = new TextEncoder(), td = new TextDecoder('latin1');

const bin = () => Uint8Array.from(atob(bytes), (c) => c.charCodeAt(0));
const ready = (instance) => {
  ex = instance.exports;
  mem = ex.memory;
  views();
};
const views = () => {
  u8 = new Uint8Array(mem.buffer);
  f64 = new Float64Array(mem.buffer);
};

/** Compiles and instantiates the module. Safe to call more than once. */
export async function init() {
  if (!ex) ready((await WebAssembly.instantiate(bin())).instance);
}

/** Synchronous init, for small modules where that's allowed (it is here). */
export function initSync() {
  if (!ex) ready(new WebAssembly.Instance(new WebAssembly.Module(bin())));
}

// Makes sure `bytes` of memory exist and returns them.
function room(n) {
  if (!ex) fail('init', 'Call init() before using polytini/wasm');
  const need = n - mem.buffer.byteLength;
  if (need > 0) {
    mem.grow(Math.ceil(need / 65536));
    views();
  }
}

// Copies str into memory at 0 and calls decode. Returns the number of f64
// values at `out`, or -1 when the JS core has to handle it.
function run(str, f, len, out) {
  let wide = 1;
  if (ucs2Write) ucs2Write.call(u8, str, 0);
  else {
    // UTF-8 bytes: any non-ASCII character makes written != len, and those
    // strings go to the JS core, which reports the character.
    if (te.encodeInto(str, u8).written != len) return -1;
    wide = 0;
  }
  return ex.decode(0, len, wide, out, f, +st.swap);
}

const outAt = (len) => (len * 2 + 15) & ~7;

export function decode(str, o) {
  const f = opts(o);
  if (typeof str != 'string') fail('input', 'Expected a string');
  if (st.dims != 2) return slowDecode(str, f);
  const len = str.length, at = outAt(len);
  room(at + len * 8 + 16);
  const k = run(str, f, len, at);
  if (k < 0) return slowDecode(str, f);
  const out = new Array(k >> 1), a = f64;
  for (let i = 0, j = at >> 3; i < out.length; i++, j += 2) out[i] = [a[j], a[j + 1]];
  return out;
}

export function decodeFlat(str, o) {
  const f = opts(o);
  if (typeof str != 'string') fail('input', 'Expected a string');
  if (st.dims != 2) return slowDecode(str, f, 1);
  const len = str.length, at = outAt(len);
  room(at + len * 8 + 16);
  const k = run(str, f, len, at);
  return k < 0 ? slowDecode(str, f, 1) : f64.slice(at >> 3, (at >> 3) + k);
}

// Bytes at `at` to a string.
const text = (at, k) => (latin1Slice ? latin1Slice.call(u8, at, at + k) : td.decode(u8.subarray(at, at + k)));

export function encode(points, o) {
  const f = opts(o);
  if (st.dims != 2 || !Array.isArray(points)) return slowEncode(points, f);
  const n = points.length, a = +st.swap, b = 1 - a, at = n * 16;
  room(at + n * 22 + 16);
  const m = f64;
  try {
    for (let i = 0, j = 0; i < n; i++, j += 2) {
      const p = points[i], x = p[a], y = p[b];
      // A Float64Array store would turn null into 0 and '1' into 1.
      if (typeof x != 'number' || typeof y != 'number') return slowEncode(points, f);
      m[j] = x;
      m[j + 1] = y;
    }
  } catch {
    return slowEncode(points, f);
  }
  const k = ex.encode(0, n * 2, f, at);
  return k < 0 ? slowEncode(points, f) : text(at, k);
}

export function encodeFlat(values, o) {
  const f = opts(o);
  if (st.dims != 2 || values == null || values.length % 2) return slowEncode(values, f, 1);
  const n = values.length, at = n * 8;
  room(at + n * 11 + 16);
  if (!(values instanceof Float64Array || values instanceof Float32Array)) {
    for (let i = 0; i < n; i++) if (typeof values[i] != 'number') return slowEncode(values, f, 1);
  }
  if (st.swap) for (let i = 0; i < n; i += 2) (f64[i] = values[i + 1]), (f64[i + 1] = values[i]);
  else f64.set(values);
  const k = ex.encode(0, n, f, at);
  return k < 0 ? slowEncode(values, f, 1) : text(at, k);
}

export const decodeLatLng = /* @__PURE__ */ latLngs(decode);
export const toGeoJSON = /* @__PURE__ */ toGeo(decode);
export const fromGeoJSON = /* @__PURE__ */ fromGeo(encode);
