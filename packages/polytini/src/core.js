// The portable codec. Every entry point builds on this file, and the web
// entry is only this file. It uses no Node, Bun or Deno globals.
//
// Each public function has a fast loop for the common case (2D points,
// precision up to 6, valid input) and falls back to the exact `slow*`
// functions for anything else: other dimensions, huge values, objects,
// and every kind of bad input. The slow functions do the same Number math
// as Google's algorithm description, so both paths give identical output.

import { PolylineError, fail } from './error.js';

export { PolylineError, fail };

// Options of the current call, set by opts() and read right after it, so the
// hot paths never allocate. A plain object on purpose: writing exported
// module-level `let` bindings cost about 30 ns per call on V8, this costs
// nothing measurable.
export const st = { swap: false, strict: true, dims: 2, zf: 1e5 };

/**
 * Parses options, fills `st` and returns the factor. Kept tiny so V8 inlines
 * it into every caller; with the object branch in the same function it
 * wasn't inlined, and decoding 10 points got about 25% slower.
 */
export function opts(o) {
  st.swap = false;
  st.strict = true;
  st.dims = 2;
  return o && typeof o == 'object' ? objOpts(o) : (st.zf = o == null ? 1e5 : pow(o));
}

function objOpts(o) {
  const { order, dimensions: d } = o;
  if (order == 'lnglat') st.swap = true;
  else if (order != null && order != 'latlng') bad('order');
  if (o.strict === false) st.strict = false;
  if (d != null) st.dims = d >= 1 && d <= 16 && d % 1 == 0 ? d : bad('dimensions');
  const f = o.factor != null ? num(o.factor) : pow(o.precision ?? 5);
  st.zf = o.zFactor != null ? num(o.zFactor) : f;
  return f;
}

const bad = (name) => fail('option', 'Invalid ' + name);
const num = (f) => (f > 0 && f < 1 / 0 ? f : bad('factor'));
const pow = (p) => (typeof p == 'number' && p >= 0 && p <= 15 && p % 1 == 0 ? 10 ** p : bad('precision'));

// Scaled values below this fit the 32-bit math of the fast loops, deltas and
// zigzag included. It covers every valid coordinate up to precision 6.
export const LIMIT = 2 ** 29;

/**
 * Exact decoder for any input. Returns points, or a flat Float64Array.
 * Strict mode throws on invalid characters, on a string that ends inside a
 * value or a point, and on values past 2^53. Otherwise it skips invalid
 * characters and drops an incomplete last point.
 */
export function slowDecode(str, f, flat) {
  if (typeof str != 'string') fail('input', 'Expected a string');
  const { dims: d, strict, zf } = st, sw = st.swap && d > 1, values = [];
  let v = 0, scale = 1, i = 0, c;
  for (; i < str.length; i++) {
    c = str.charCodeAt(i) - 63;
    if (c < 0 || c > 63) {
      if (strict) fail('char', 'Invalid character', i);
      continue;
    }
    v += (c & 31) * scale;
    scale *= 32;
    if (v > 2 ** 53 && strict) fail('overflow', 'Value too large', i);
    if (c < 32) {
      values.push(v % 2 ? -(v + 1) / 2 : v / 2);
      v = 0;
      scale = 1;
    }
  }
  if (strict && (scale > 1 || values.length % d)) fail('truncated', 'Truncated', i);
  const n = (values.length / d) | 0, sum = Array(d).fill(0), out = flat ? new Float64Array(n * d) : Array(n);
  for (let j = 0, k = 0; j < n; j++) {
    const p = flat ? out : Array(d);
    for (let a = 0; a < d; a++, k++) {
      sum[a] += values[k];
      p[(flat ? k - a : 0) + (sw && a < 2 ? 1 - a : a)] = sum[a] / (a < 2 ? f : zf);
    }
    if (!flat) out[j] = p;
  }
  return out;
}

/**
 * Exact encoder for any input: [a, b] tuples (or any array-like), objects
 * with lat/latitude and lng/lon/longitude, or a flat array of numbers.
 * Rounds half away from zero, like Google's reference implementation.
 */
export function slowEncode(points, f, flat) {
  if (points == null || !(points.length >= 0)) fail('input', 'Expected an array');
  const { dims: d, strict, zf } = st, sw = st.swap && d > 1, last = Array(d).fill(0), n = flat ? points.length / d : points.length;
  if (n % 1 && strict) fail('input', 'Length not a multiple of ' + d);
  let s = '';
  for (let i = 0; i < (n | 0); i++) {
    const p = flat ? 0 : points[i];
    for (let a = 0; a < d; a++) {
      const b = sw && a < 2 ? 1 - a : a;
      let x = flat ? points[i * d + b] : p == null ? p : p.length >= 0 ? p[b] : a ? (a > 1 ? p.alt ?? p.altitude : p.lng ?? p.lon ?? p.longitude) : p.lat ?? p.latitude;
      // null and undefined are missing, not 0. Numeric strings are numbers.
      x = x == null ? NaN : +x * (a < 2 ? f : zf);
      if (!(x - x == 0)) {
        if (strict) fail('coordinate', 'Invalid coordinate', i);
        x = 0;
      }
      x = Math.sign(x) * Math.round(Math.abs(x));
      let z = x - last[a];
      last[a] = x;
      z = z < 0 ? -z * 2 - 1 : z * 2;
      if (z > 2 ** 53 && strict) fail('overflow', 'Value too large', i);
      for (; z >= 32; z = Math.floor(z / 32)) s += String.fromCharCode((z % 32) + 95);
      s += String.fromCharCode(z + 63);
    }
  }
  return s;
}

const decodeWith = (str, o, flat) => {
  const f = opts(o), out = st.dims == 2 && typeof str == 'string' && decodeLoop(str, f, st.swap, flat);
  return out ? (st.swap && !flat ? flip(out) : out) : slowDecode(str, f, flat);
};

// The fast loops always build [lat, lng]; lnglat output is flipped in place
// afterwards. A per-point `swap ? [b, a] : [a, b]` cost the default order
// about 5%, and the extra pass is small next to allocating the points.
export const flip = (out) => {
  for (const p of out) {
    const t = p[0];
    p[0] = p[1];
    p[1] = t;
  }
  return out;
};

/** Decodes to [lat, lng] tuples. */
export const decode = (str, o) => decodeWith(str, o, 0);

/** Decodes to a flat Float64Array: [lat0, lng0, lat1, lng1, ...]. */
export const decodeFlat = (str, o) => decodeWith(str, o, 1);

// The 2D fast loop, or null when the input needs slowDecode. A separate,
// self-contained function because V8 optimized it better that way: with the
// option and type checks in the same function, 10 point lines decoded about
// 15% slower.
export function decodeLoop(str, f, sw, flat) {
  const len = str.length, a = +sw;
  let i = 0, n = 0, lat = 0, lng = 0, bad = 0, c, v, s, out;
  if (flat) {
    // Every value ends with exactly one character below code 95.
    for (; i < len; i++) n += (str.charCodeAt(i) - 95) >>> 31;
    out = new Float64Array(n & ~1);
    i = n = 0;
  } else out = len < 64 ? [] : Array(len >> 1);
  // One value is one or more 5-bit chunks. `bad` collects every character
  // code: anything outside 0..63 after the -63 shift sets a high bit, and
  // so does a 7th chunk in one value (25 - s < 0). NaN past the end of
  // a truncated string ends the value and leaves i past len.
  while (i < len) {
    c = str.charCodeAt(i++) - 63;
    bad |= c;
    v = c & 31;
    for (s = 5; c >= 32; s += 5) {
      c = str.charCodeAt(i++) - 63;
      bad |= c | (25 - s);
      v |= (c & 31) << s;
    }
    lat += (v >>> 1) ^ -(v & 1);
    c = str.charCodeAt(i++) - 63;
    bad |= c;
    v = c & 31;
    for (s = 5; c >= 32; s += 5) {
      c = str.charCodeAt(i++) - 63;
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
  if (bad & ~63 || i != len) return null;
  if (out.length != n) out.length = n;
  return out;
}

// Encoded characters for every zigzag value below 1024, so one or two
// characters cost one string concatenation instead of a loop. Built by a
// pure call, so bundles that never encode can drop it.
const CHARS = /* @__PURE__ */ Array.from({ length: 1024 }, (_, z) => chars(z));

export function chars(z) {
  let s = '';
  for (; z >= 32; z >>>= 5) s += String.fromCharCode((z & 31) + 95);
  return s + String.fromCharCode(z + 63);
}

const encodeWith = (src, o, flat) => {
  const f = opts(o);
  return (st.dims == 2 && f <= 1e6 && (flat ? src != null && !(src.length % 2) : Array.isArray(src)) ? encodeLoop(src, f, +st.swap, flat) : null) ?? slowEncode(src, f, flat);
};

/** Encodes [lat, lng] tuples, or objects with lat and lng. */
export const encode = (points, o) => encodeWith(points, o, 0);

/** Encodes a flat array of numbers: [lat0, lng0, lat1, lng1, ...]. */
export const encodeFlat = (values, o) => encodeWith(values, o, 1);

// The 2D fast loop, or null when the input needs slowEncode.
function encodeLoop(src, f, a, flat) {
  const n = flat ? src.length >> 1 : src.length;
  let s = '', i = 0, la = 0, lb = 0, x, y, p, q, z, pt;
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
      // Anything but numbers goes the slow way, which coerces numeric
      // strings and rejects null. The range check is also false for NaN.
      if (typeof x != 'number' || typeof y != 'number' || !((x *= f) < LIMIT && x > -LIMIT && (y *= f) < LIMIT && y > -LIMIT)) return null;
      // Round half away from zero. floor(|x| + 0.5) is exact here except for
      // |x| = 0.49999999999999994, where the addition rounds up to 1, so any
      // |x| < 0.5 is set to 0 afterwards. Math.round would be exact on its own,
      // but it measured 40% slower on JavaScriptCore.
      p = x < 0 ? -((0.5 - x) | 0) : (x + 0.5) | 0;
      q = y < 0 ? -((0.5 - y) | 0) : (y + 0.5) | 0;
      if (x < 0.5 && x > -0.5) p = 0;
      if (y < 0.5 && y > -0.5) q = 0;
      z = p - la;
      z = (z << 1) ^ (z >> 31);
      s += z < 1024 ? CHARS[z] : chars(z);
      z = q - lb;
      z = (z << 1) ^ (z >> 31);
      s += z < 1024 ? CHARS[z] : chars(z);
      la = p;
      lb = q;
    }
  } catch {
    // A null point: let slowEncode report it.
    return null;
  }
  return s;
}

// Helpers built on top of an entry point's own decode and encode, so every
// entry uses its fastest paths. Entries call these with /* @__PURE__ */, so
// bundlers drop the ones nobody imports.
const lngLat = (o) => ({ ...(typeof o == 'number' ? { precision: o } : o), order: 'lnglat' });

/** {lat, lng} objects, the shape Google Maps and Leaflet take. */
export const latLngs = (decode) => (str, o) => decode(str, o).map(([lat, lng]) => ({ lat, lng }));

export const toGeo = (decode) => (str, o) => ({ type: 'LineString', coordinates: decode(str, lngLat(o)) });

export const fromGeo = (encode) => (g, o) => {
  if (g?.type == 'Feature') g = g.geometry;
  return g?.type == 'LineString' ? encode(g.coordinates, lngLat(o)) : fail('input', 'Expected a LineString');
};
