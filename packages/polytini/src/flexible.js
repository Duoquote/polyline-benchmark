// HERE's Flexible Polyline format, version 1:
// https://github.com/heremaps/flexible-polyline
//
// A string is [version][header][data], each part made of varints written
// with a URL-safe 64 character alphabet: 5 data bits per character, and a
// sixth bit that says another character follows. The header holds the
// precision (bits 0 to 3), the third dimension type (bits 4 to 6) and its
// precision (bits 7 to 10). The data is zigzag encoded deltas, 2 or 3 values
// per point, the first point relative to 0.
//
// Like the Google-format core, decode and encode have a fast loop for the
// common case and an exact `slow*` function for the rest, which also reports
// every kind of bad input. Precision 15 needs up to 64 bits, more than a
// Number holds exactly, so the slow functions switch to BigInt where Number
// math would lose bits.
//
// Errors are PolylineError with one of these codes:
//   'input'      decode got a non-string, or encode got no array of points
//   'option'     precision or thirdDimPrecision not an integer from 0 to 15,
//                or thirdDim not 0, 1, 2, 3, 6 or 7
//   'char'       a character outside the alphabet (index = its position)
//   'truncated'  the string ends inside the header, a value or a point
//   'version'    the format version is not 1, or the header has bits set
//                above bit 10, which version 1 doesn't define
//   'overflow'   a value needs more than 64 bits, the limit of the other
//                implementations
//   'coordinate' encode got a missing or non-finite value (index = point)
/* @ts-self-types="../types/flexible.d.ts" */
import { PolylineError, fail } from './error.js';

export { PolylineError };

// Third dimension types, as stored in the header. 4 and 5 are reserved:
// decode accepts them and encode refuses them, like the official code.
export const ABSENT = 0;
export const LEVEL = 1;
export const ALTITUDE = 2;
export const ELEVATION = 3;
export const RESERVED1 = 4;
export const RESERVED2 = 5;
export const CUSTOM1 = 6;
export const CUSTOM2 = 7;
const TYPES = [0, 1, 2, 3, 6, 7];

const E = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Character code to 6-bit value. 64 marks a character outside the alphabet,
// so OR-ing every value together and testing for > 63 finds them all.
const T = new Uint8Array(128).fill(64);
for (let i = 0; i < 64; i++) T[E.charCodeAt(i)] = i;

// The characters of every value below 1024, so one or two characters cost
// one concatenation instead of a loop.
const C = [];
for (let z = 0; z < 1024; z++) C[z] = z < 32 ? E[z] : E[(z & 31) | 32] + E[z >> 5];

// 10 ** p from parsed literals, so every factor is exact.
const P = [];
for (let p = 0; p < 16; p++) P[p] = +('1e' + p);

// The characters of an unsigned value below 2^53. Float math, because the
// bit operators would cut it to 32 bits.
const chars = (z) => {
  let s = '';
  for (; z > 31; z = Math.floor(z / 32)) s += E[(z % 32) | 32];
  return s + E[z];
};

const range = (p, name) => (typeof p == 'number' && p >= 0 && p <= 15 && p % 1 == 0 ? p : fail('option', name + ' must be an integer from 0 to 15'));

/**
 * Reads the version and the header. Returns the header bits plus 2048 times
 * the index where the data starts, so decode allocates nothing for it.
 */
function head(str) {
  if (typeof str != 'string') fail('input', 'Expected a string');
  let i = 0, k = 0, v, m, c;
  for (; k < 2; k++) {
    // Both are varints. The version is always 'B' in practice, and the
    // header takes 1 to 3 characters.
    for (v = 0, m = 1, c = 32; c & 32; m *= 32, i++) {
      if (i >= str.length) fail('truncated', 'Polyline ends inside the header', i);
      c = T[str.charCodeAt(i)];
      if (!(c < 64)) fail('char', 'Invalid character ' + JSON.stringify(str[i]), i);
      v += (c & 31) * m;
    }
    if (!k && v != 1) fail('version', 'Unsupported format version ' + v, 0);
  }
  // Also false for NaN, from a long run of continuation characters.
  return v < 2048 ? v + i * 2048 : fail('version', 'Invalid header', i);
}

/** Reads the header without decoding the points. */
export function header(str) {
  const h = head(str) % 2048;
  return { precision: h & 15, thirdDim: (h >> 4) & 7, thirdDimPrecision: h >> 7 };
}

/**
 * Decodes to { precision, thirdDim, thirdDimPrecision, polyline }, the same
 * object @here/flexpolyline returns. Points are [lat, lng], or [lat, lng, z]
 * when the header has a third dimension.
 */
export function decode(str) {
  const r = head(str), h = r % 2048, i = (r - h) / 2048, t = (h >> 4) & 7, f = P[h & 15], fz = P[h >> 7];
  return { precision: h & 15, thirdDim: t, thirdDimPrecision: h >> 7, polyline: decodeLoop(str, i, f, fz, t) || slowDecode(str, i, f, fz, t ? 3 : 2) };
}

// The fast loop, or null when the input needs slowDecode: an invalid
// character, a truncated string, or a value of more than 10 characters.
// The value reader is written out three times: a shared helper or one
// generic loop over the axes measured 15 to 25% slower on V8.
function decodeLoop(str, i, f, fz, three) {
  const len = str.length, out = [];
  let n = 0, a = 0, b = 0, z = 0, bad = 0, w = 0, k, c, v, s;
  // A code above 127 keeps its high bits in c, which marks it bad without
  // changing the 6 value bits. Past the end, NaN reads as T[0], also bad,
  // and ends the value. The first 6 characters (30 bits) use 32-bit math,
  // later ones float math, exact up to 10 characters (50 bits). Float
  // values then need float zigzag, as the bit operators cut to 32 bits.
  // The sums stay exact below 2^53: w bounds what the large values add up
  // to, and small ones would need a string of over 64 million characters.
  while (i < len) {
    k = str.charCodeAt(i++);
    bad |= c = T[k & 127] | (k & -128);
    for (v = c & 31, s = 5; c & 32; s += 5) {
      k = str.charCodeAt(i++);
      bad |= c = T[k & 127] | (k & -128);
      if (s < 30) v |= (c & 31) << s;
      else if (s < 50) w += v += (c & 31) * 2 ** s;
      else bad = 64;
    }
    a += s > 30 ? (v % 2 ? -(v + 1) / 2 : v / 2) : (v >>> 1) ^ -(v & 1);
    k = str.charCodeAt(i++);
    bad |= c = T[k & 127] | (k & -128);
    for (v = c & 31, s = 5; c & 32; s += 5) {
      k = str.charCodeAt(i++);
      bad |= c = T[k & 127] | (k & -128);
      if (s < 30) v |= (c & 31) << s;
      else if (s < 50) w += v += (c & 31) * 2 ** s;
      else bad = 64;
    }
    b += s > 30 ? (v % 2 ? -(v + 1) / 2 : v / 2) : (v >>> 1) ^ -(v & 1);
    if (three) {
      k = str.charCodeAt(i++);
      bad |= c = T[k & 127] | (k & -128);
      for (v = c & 31, s = 5; c & 32; s += 5) {
        k = str.charCodeAt(i++);
        bad |= c = T[k & 127] | (k & -128);
        if (s < 30) v |= (c & 31) << s;
        else if (s < 50) w += v += (c & 31) * 2 ** s;
        else bad = 64;
      }
      z += s > 30 ? (v % 2 ? -(v + 1) / 2 : v / 2) : (v >>> 1) ^ -(v & 1);
      out[n++] = [a / f, b / f, z / fz];
    } else out[n++] = [a / f, b / f];
  }
  return bad > 63 || i > len || w > 2 ** 52 ? null : out;
}

/** Exact decoder with BigInt sums, which also reports errors. */
function slowDecode(str, i, f, fz, d) {
  const out = [], sum = [0n, 0n, 0n];
  let pt = [], j = 0, v = 0n, s = 0n, k, c;
  for (; i < str.length; i++) {
    k = str.charCodeAt(i);
    c = k < 128 ? T[k] : 64;
    if (c > 63) fail('char', 'Invalid character ' + JSON.stringify(str[i]), i);
    v |= BigInt(c & 31) << s;
    if (c & 32) {
      if ((s += 5n) > 60n) fail('overflow', 'Value too large', i);
      continue;
    }
    if (v >> 64n) fail('overflow', 'Value too large', i);
    sum[j] += v & 1n ? ~(v >> 1n) : v >> 1n;
    pt[j] = Number(sum[j]) / (j < 2 ? f : fz);
    if (++j == d) {
      out.push(pt);
      pt = [];
      j = 0;
    }
    v = s = 0n;
  }
  if (s || j) fail('truncated', 'Polyline ends inside a ' + (s ? 'value' : 'point'), i);
  return out;
}

/**
 * Encodes points. Takes the @here/flexpolyline argument,
 * { polyline, precision, thirdDim, thirdDimPrecision }, or the points with
 * those fields in `options`, which win over the object's. Points are
 * [lat, lng] or [lat, lng, z] arrays, or one flat array of numbers. Rounds
 * half away from zero.
 */
export function encode(input, options) {
  const obj = input != null && typeof input == 'object' && !(input.length >= 0), a = obj ? input : {}, o = options || {};
  const pts = obj ? input.polyline : input;
  const p = range(o.precision ?? a.precision ?? 5, 'precision');
  const q = range(o.thirdDimPrecision ?? a.thirdDimPrecision ?? 0, 'thirdDimPrecision');
  const t = o.thirdDim ?? a.thirdDim ?? 0;
  if (!TYPES.includes(t)) fail('option', 'thirdDim must be 0, 1, 2, 3, 6 or 7');
  if (pts == null || !(pts.length >= 0)) fail('input', 'Expected an array of points');
  const s = 'B' + chars((q << 7) | (t << 4) | p), d = t ? 3 : 2, flat = typeof pts[0] == 'number';
  if (flat && pts.length % d) fail('input', 'Flat array length is not a multiple of ' + d);
  return (!flat && encodeLoop(pts, P[p], P[q], t, s)) || slowEncode(pts, P[p], P[q], d, flat, s);
}

// Scaled values below this keep deltas and zigzag values in 32-bit math.
// It covers coordinates up to precision 6.
const LIMIT = 2 ** 29;

// Rounded values below this keep deltas and zigzag values below 2^53.
const WIDE = 2 ** 51;

// The fast loop for arrays of points, or undefined when the input needs
// slowEncode: a value that is missing, not finite or too large.
function encodeLoop(pts, f, fz, three, s) {
  const n = pts.length;
  let i = 0, la = 0, lb = 0, lz = 0, x, y, w, p, q, r, z, pt;
  try {
    for (; i < n; i++) {
      pt = pts[i];
      x = pt[0] * f;
      y = pt[1] * f;
      w = three ? pt[2] * fz : 0;
      // Also false for NaN, so missing values go the slow way.
      if (!(x < LIMIT && x > -LIMIT && y < LIMIT && y > -LIMIT && w < LIMIT && w > -LIMIT)) return;
      // Round half away from zero. Below LIMIT, adding 0.5 and truncating
      // gives the exact result.
      p = x < 0 ? -((0.5 - x) | 0) : (x + 0.5) | 0;
      q = y < 0 ? -((0.5 - y) | 0) : (y + 0.5) | 0;
      z = p - la;
      z = (z << 1) ^ (z >> 31);
      s += z < 1024 ? C[z] : chars(z);
      z = q - lb;
      z = (z << 1) ^ (z >> 31);
      s += z < 1024 ? C[z] : chars(z);
      la = p;
      lb = q;
      if (three) {
        r = w < 0 ? -((0.5 - w) | 0) : (w + 0.5) | 0;
        z = r - lz;
        z = (z << 1) ^ (z >> 31);
        s += z < 1024 ? C[z] : chars(z);
        lz = r;
      }
    }
  } catch {
    return;
  }
  return s;
}

/**
 * Exact encoder for any input. Rounded values are whole doubles, exact at
 * any size, so they stay Numbers. Their deltas and zigzag values use float
 * math below WIDE, where it is exact, and BigInt above.
 */
function slowEncode(pts, f, fz, d, flat, s) {
  const n = flat ? pts.length / d : pts.length, last = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const pt = flat ? null : pts[i];
    if (!flat && pt == null) fail('coordinate', 'Invalid point', i);
    for (let a = 0; a < d; a++) {
      const x = (flat ? pts[i * d + a] : pt[a]) * (a < 2 ? f : fz);
      if (!(x - x == 0)) fail('coordinate', 'Invalid coordinate', i);
      // Math.round of the magnitude is exact at any size. Adding 0.5 and
      // flooring would round 2^52 + 1 up to 2^52 + 2.
      const r = x < 0 ? -Math.round(-x) : Math.round(x), l = last[a];
      let z = r - l;
      last[a] = r;
      if (r < WIDE && r > -WIDE && l < WIDE && l > -WIDE) s += chars(z < 0 ? -2 * z - 1 : 2 * z);
      else {
        z = BigInt(r) - BigInt(l);
        z = z < 0n ? ~(z << 1n) : z << 1n;
        if (z >> 64n) fail('overflow', 'Value too large', i);
        for (; z > 31n; z >>= 5n) s += E[Number(z & 31n) | 32];
        s += E[Number(z)];
      }
    }
  }
  return s;
}
