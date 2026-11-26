// deck.gl: encoded polylines straight into deck.gl's binary data format, one
// typed array for all lines and no array per point.
//
//   import { PathLayer } from '@deck.gl/layers';
//   import { binaryPaths } from '@duoquote/polytini/deckgl';
//   const data = binaryPaths(routes.map((r) => r.geometry), { precision: 6 });
//   new PathLayer({ id: 'routes', data, _pathType: 'open', getWidth: 3 });
//
// The result has the shape deck.gl 9 documents for PathLayer, TripsLayer and
// SolidPolygonLayer:
//   { length, startIndices, attributes: { getPath: { value, size } } }
// where startIndices has length + 1 entries, the last one the vertex count,
// and value holds [lng, lat] or [lng, lat, z] per vertex. Positions always
// come out as [lng, lat], whatever `order` the options or a preset say,
// because that is what deck.gl reads.
//
// Each string is decoded twice over its characters: a first pass over all
// strings counts the values (every value ends with exactly one character
// below code 95), so one buffer of the right size is allocated, and a second
// pass decodes into it. Strings the fast loop does not take (bad characters,
// a cut-off value, values of more than 30 bits) go through polytini's exact
// decoder, which throws a PolylineError in strict mode, the default.
//
// PolygonLayer, the composite layer, does not take binary data in deck.gl
// 9.4: it calls getPolygon on every row to build its outlines, and binary
// data has no rows (it fails with "Cannot read properties of undefined").
// For filled polygons with outlines, use a SolidPolygonLayer with
// binaryPolygons data plus a PathLayer with the same buffer as getPath:
//   new PathLayer({ data: { ...polys, attributes: { getPath: polys.attributes.getPolygon } }, _pathType: 'open' })
//
// No deck.gl code is imported.
/* @ts-self-types="../types/deckgl.d.ts" */
import { decodeFlat } from './web.js';
import { opts, st, fail } from './core.js';

// Decodes a 2D string into out[2k], out[2k + 1] as [lng, lat] from vertex k.
// Returns the number of vertices, or -1 when the string needs the exact
// decoder. Writes past the end of a typed array are dropped, and anything
// written for a bad string is overwritten afterwards.
function fill2(str, out, k, f) {
  const len = str.length, start = k;
  let i = 0, lat = 0, lng = 0, bad = 0, c, v, s;
  k *= 2;
  while (i < len) {
    c = str.charCodeAt(i++) - 63;
    bad |= c;
    v = c & 31;
    for (s = 5; c >= 32; s += 5) {
      c = str.charCodeAt(i++) - 63;
      bad |= c;
      v |= (c & 31) << s;
    }
    bad |= 30 - s;
    lat += (v >>> 1) ^ -(v & 1);
    c = str.charCodeAt(i++) - 63;
    bad |= c;
    v = c & 31;
    for (s = 5; c >= 32; s += 5) {
      c = str.charCodeAt(i++) - 63;
      bad |= c;
      v |= (c & 31) << s;
    }
    bad |= 30 - s;
    lng += (v >>> 1) ^ -(v & 1);
    out[k++] = lng / f;
    out[k++] = lat / f;
  }
  return bad & ~63 || i != len ? -1 : k / 2 - start;
}

// The same for d values per point (3 or 4): [lng, lat] plus z when size is
// 3, and the last value into ts when ts is given.
function fillN(str, out, ts, k, d, size, f, zf) {
  const len = str.length, start = k, sum = [0, 0, 0, 0];
  let i = 0, bad = 0, a, c, v, s, j;
  while (i < len) {
    for (a = 0; a < d; a++) {
      c = str.charCodeAt(i++) - 63;
      bad |= c;
      v = c & 31;
      for (s = 5; c >= 32; s += 5) {
        c = str.charCodeAt(i++) - 63;
        bad |= c;
        v |= (c & 31) << s;
      }
      bad |= 30 - s;
      sum[a] += (v >>> 1) ^ -(v & 1);
    }
    j = k * size;
    out[j] = sum[1] / f;
    out[j + 1] = sum[0] / f;
    if (size == 3) out[j + 2] = sum[2] / zf;
    if (ts) ts[k] = sum[d - 1] / zf;
    k++;
  }
  return bad & ~63 || i != len ? -1 : k - start;
}

// The exact decoder, for strings the fast loops gave up on. It returns at
// most as many points as the first pass counted, so they fit.
function slow(str, o, out, ts, k, d, size) {
  const flat = decodeFlat(str, o), n = flat.length / d;
  for (let p = 0; p < n; p++, k++) {
    for (let a = 0; a < size; a++) out[k * size + a] = flat[p * d + a];
    if (ts) ts[k] = flat[p * d + d - 1];
  }
  return n;
}

function build(encoded, o, polygons) {
  const list = typeof encoded == 'string' ? [encoded] : encoded;
  if (!Array.isArray(list)) fail('input', 'Expected a string or an array of strings');
  const f = opts(o), { dims: d, zf } = st, time = !polygons && o != null && typeof o == 'object' && !!o.timestamps;
  const size = time ? d - 1 : d;
  if (size < 2 || size > 3) fail('option', time ? 'timestamps need dimensions 3 or 4' : 'Invalid dimensions for deck.gl: use 2 or 3, or 4 with timestamps');
  const Type = o?.float32 ? Float32Array : Float64Array;
  const n = list.length;
  // Pass 1: an upper bound of the vertex count, exact for valid strings.
  // Polygons get room for one more vertex per ring to close it.
  let max = 0;
  for (let i = 0; i < n; i++) {
    const s = list[i];
    if (typeof s != 'string') fail('input', 'Expected a string', i);
    let values = 0;
    for (let j = 0; j < s.length; j++) values += (s.charCodeAt(j) - 95) >>> 31;
    max += ((values / d) | 0) + (polygons ? 1 : 0);
  }
  const out = new Type(max * size), ts = time ? new Float32Array(max) : null, starts = new Uint32Array(n + 1);
  const exact = { ...(typeof o == 'number' ? { precision: o } : o), order: 'lnglat' };
  // Pass 2: decode each string at the running vertex offset.
  let k = 0;
  for (let i = 0; i < n; i++) {
    const s = list[i];
    starts[i] = k;
    let m = d == 2 ? fill2(s, out, k, f) : fillN(s, out, ts, k, d, size, f, zf);
    if (m < 0) m = slow(s, exact, out, ts, k, d, size);
    if (polygons && m > 0) {
      // Close the ring if the last vertex is not the first.
      const a = k * size, b = (k + m - 1) * size;
      let open = false;
      for (let c = 0; c < size; c++) open ||= out[a + c] !== out[b + c];
      if (open) {
        for (let c = 0; c < size; c++) out[b + size + c] = out[a + c];
        m++;
      }
    }
    k += m;
  }
  starts[n] = k;
  const value = k * size < out.length ? out.subarray(0, k * size) : out;
  const attributes = polygons ? { getPolygon: { value, size } } : { getPath: { value, size } };
  if (ts) attributes.getTimestamps = { value: k < ts.length ? ts.subarray(0, k) : ts, size: 1 };
  return { length: n, startIndices: starts, attributes };
}

/**
 * Binary data for PathLayer and TripsLayer: one path per string. Options:
 * polytini options or a preset, plus `float32` (Float32Array instead of
 * Float64Array) and, for TripsLayer, `timestamps`: the last value of each
 * point (dimensions 3 or 4) goes to attributes.getTimestamps instead of the
 * positions. Timestamps are always a Float32Array: TripsLayer's timestamp
 * attribute is 32-bit, and deck.gl 9.4 drew nothing for a TripsLayer given
 * Float64Array timestamps (checked in test/deckgl.test.js). Keep them small,
 * for example seconds since the start of the trip.
 */
export const binaryPaths = (encoded, options) => build(encoded, options, false);

/**
 * Binary data for SolidPolygonLayer: one ring per string, closed (the first
 * vertex is repeated at the end when it is not there already). The binary
 * format has no holes. With _normalize: false deck.gl uses the rings as
 * they are, so for extruded polygons they must also be in the layer's
 * _windingOrder; leave _normalize on when the winding is unknown.
 * Options: polytini options or a preset, plus float32.
 */
export const binaryPolygons = (encoded, options) => build(encoded, options, true);
