// Byte-buffer paths through TextEncoder/TextDecoder, for runtimes without
// Node's Buffer where those are fast: Deno. Measured on Deno 2.5 with the
// benchmark fixtures (see "Platform notes" in the README):
//
// - Decode: encodeInto copies the string into a reused Uint8Array, then the
//   loop reads bytes instead of calling charCodeAt. 20 to 35% faster from 100
//   points up. Any non-ASCII character makes `written` differ from the
//   length, and those strings go to the exact slow path, so strict mode stays
//   exact. Under 64 characters the copy costs more than it saves.
// - Encode: bytes into a reused buffer, then one TextDecoder call. 30 to 60%
//   faster from 1,000 points up, but the call has a fixed cost that made
//   lines of a few hundred points slower than the core's string building, so
//   it starts at 512 points.
import { opts, st, LIMIT, slowDecode, slowEncode, decodeLoop, flip, encode as coreEncode, encodeFlat as coreEncodeFlat } from './core.js';

const te = new TextEncoder(), td = new TextDecoder('latin1');
// Reused up to 1 MB, like the Buffer paths.
let kept = new Uint8Array(1 << 14);
const scratch = (n) => (n <= kept.length ? kept : n <= 1 << 20 ? (kept = new Uint8Array(n)) : new Uint8Array(n));

function big(str, f, sw, flat) {
  const len = str.length, b = scratch(len + 8);
  if (te.encodeInto(str, b).written != len) return null;
  // '?' padding: a truncated string stops inside the buffer, past len.
  b[len] = b[len + 1] = 63;
  let t = 0;
  for (let k = 0; k < len; k++) t += (b[k] - 95) >>> 31;
  const out = flat ? new Float64Array(t & ~1) : Array(t >> 1), a = +sw;
  let i = 0, n = 0, lat = 0, lng = 0, bad = 0, c, v, s;
  while (i < len) {
    c = b[i++] - 63;
    bad |= c;
    v = c & 31;
    for (s = 5; c >= 32; s += 5) {
      c = b[i++] - 63;
      bad |= c | (25 - s);
      v |= (c & 31) << s;
    }
    lat += (v >>> 1) ^ -(v & 1);
    c = b[i++] - 63;
    bad |= c;
    v = c & 31;
    for (s = 5; c >= 32; s += 5) {
      c = b[i++] - 63;
      bad |= c | (25 - s);
      v |= (c & 31) << s;
    }
    lng += (v >>> 1) ^ -(v & 1);
    if (flat) {
      out[n + a] = lat / f;
      out[n + 1 - a] = lng / f;
      n += 2;
    } else out[n++] = [lat / f, lng / f];
  }
  return bad & ~63 || i != len ? null : out;
}

const decodeWith = (str, o, flat) => {
  const f = opts(o);
  if (st.dims != 2 || typeof str != 'string') return slowDecode(str, f, flat);
  const out = (str.length < 64 ? decodeLoop : big)(str, f, st.swap, flat);
  return out ? (st.swap && !flat ? flip(out) : out) : slowDecode(str, f, flat);
};

function encodeLoop(src, f, a, flat) {
  const n = flat ? src.length >> 1 : src.length, b = scratch(n * 14 + 8);
  let i = 0, k = 0, la = 0, lb = 0, x, y, p, q, z, pt;
  try {
    for (; i < n; i++) {
      if (flat) {
        x = src[i * 2 + a];
        y = src[i * 2 + 1 - a];
      } else {
        pt = src[i];
        x = pt[a];
        y = pt[1 - a];
      }
      if (typeof x != 'number' || typeof y != 'number' || !((x *= f) < LIMIT && x > -LIMIT && (y *= f) < LIMIT && y > -LIMIT)) return null;
      // Half away from zero, the same way as core.js.
      p = x < 0 ? -((0.5 - x) | 0) : (x + 0.5) | 0;
      q = y < 0 ? -((0.5 - y) | 0) : (y + 0.5) | 0;
      if (x < 0.5 && x > -0.5) p = 0;
      if (y < 0.5 && y > -0.5) q = 0;
      z = p - la;
      z = (z << 1) ^ (z >> 31);
      for (; z >= 32; z >>>= 5) b[k++] = (z & 31) + 95;
      b[k++] = z + 63;
      z = q - lb;
      z = (z << 1) ^ (z >> 31);
      for (; z >= 32; z >>>= 5) b[k++] = (z & 31) + 95;
      b[k++] = z + 63;
      la = p;
      lb = q;
    }
  } catch {
    return null;
  }
  return td.decode(b.subarray(0, k));
}

const encodeWith = (src, o, flat, core) => {
  // Short lines: the core's string building is faster than a TextDecoder call.
  if (!(src?.length >= (flat ? 1024 : 512))) return core(src, o);
  const f = opts(o);
  return (st.dims == 2 && f <= 1e6 && (flat ? !(src.length % 2) : Array.isArray(src)) ? encodeLoop(src, f, +st.swap, flat) : null) ?? slowEncode(src, f, flat);
};

export const decode = (str, o) => decodeWith(str, o, 0);
export const decodeFlat = (str, o) => decodeWith(str, o, 1);
export const encode = (src, o) => encodeWith(src, o, 0, coreEncode);
export const encodeFlat = (src, o) => encodeWith(src, o, 1, coreEncodeFlat);
