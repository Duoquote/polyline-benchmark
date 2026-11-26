// OpenLayers: a faster drop-in for ol/format/Polyline.
//
//   import Polyline from '@duoquote/polytini/openlayers'; // instead of 'ol/format/Polyline.js'
//   const format = new Polyline({ factor: 1e6 });
//   const line = format.readGeometry(encoded, { featureProjection: 'EPSG:3857' });
//   const str = format.writeGeometry(line, { featureProjection: 'EPSG:3857' });
//
// It subclasses ol's own Polyline format and replaces only the two text-level
// methods, readGeometryFromText and writeGeometryText. Everything else is
// ol's: the constructor options (factor, geometryLayout), projections,
// readFeature, readFeatures, writeFeature, writeFeatures and the `decimals`
// write option. This is the one polytini subpath with a runtime import of
// the map library, because it extends ol's class.
//
// The output is the same as ol's for every input, with one exception: ol's
// writeGeometry flips XY and writes the deltas into the geometry's own flat
// coordinates when there is no projection transform (and no `decimals`), so
// a second writeGeometry of the same geometry gives a wrong string. This
// class never changes the geometry.
//
// What "the same" means in detail:
// - Coordinates come out as [x, y] = [lng, lat], then Z and M, as plain
//   arrays, and every value, M included, is divided by the factor. A factor
//   of 0 or no factor means 1e5, like ol.
// - Rounding is ol's, not Google's. ol rounds with
//   `value < 0 ? Math.ceil(value - 0.5) : Math.round(value)`. That is half
//   away from zero for every value except -0.49999999999999994 (the largest
//   double below 0.5, negated), where `value - 0.5` rounds to -1 in floating
//   point, so ol writes -1 where Google's algorithm, and polytini's own
//   encode, write 0. (Values of 2^52 and more differ too, but those are past
//   ol's 32-bit limit anyway.) A drop-in should give the same strings as the
//   format it replaces, so this class rounds like ol.
// - ol never throws on bad input. Strings that are not plain valid polylines
//   (characters outside '?' to '~', a value cut off at the end, a point with
//   fewer values than the layout has, or a value of more than 30 bits) and
//   geometries with values that do not fit 32-bit deltas (NaN, Infinity, or
//   deltas of 2^29 units or more) are handed to ol's own code, so they give
//   exactly what ol gives, odd results included: a NaN for a missing value,
//   and 32-bit wrap-around for very large values.
/* @ts-self-types="../types/openlayers.d.ts" */
import OlPolyline, { encodeDeltas } from 'ol/format/Polyline.js';
import LineString from 'ol/geom/LineString.js';
import { getStrideForLayout } from 'ol/geom/SimpleGeometry.js';
import { transformGeometryWithOptions } from 'ol/format/Feature.js';
import { flipXY } from 'ol/geom/flat/flip.js';
import { chars, LIMIT } from './core.js';

// Encoded characters for zigzag values below 1024.
const CHARS = [];
for (let z = 0; z < 1024; z++) CHARS[z] = chars(z);

/**
 * Decodes to ol's flat coordinates ([lng, lat, ...rest] per point), or
 * returns null when the string is anything but a plain valid polyline with
 * a whole number of points and values of at most 6 characters. On those
 * strings ol's 32-bit math is exact, so the result is identical to ol's.
 */
function decodeFlat(str, stride, f) {
  if (!(stride >= 2 && stride <= 4)) return null;
  const len = str.length, sum = [0, 0, 0, 0];
  let i = 0, n = 0, bad = 0, d, c, v, s;
  // Long lines are counted first (every value ends with exactly one
  // character below code 95) and get one array of the right size: growing
  // an array of a few hundred thousand doubles was slower than the extra
  // pass. Short ones grow by appending, which was faster for them.
  if (len > 50000) for (; i < len; i++) n += (str.charCodeAt(i) - 95) >>> 31;
  const out = n ? new Array(n) : [];
  i = n = 0;
  while (i < len) {
    for (d = 0; d < stride; d++) {
      // Past the end, charCodeAt gives NaN: the value ends and i passes len.
      c = str.charCodeAt(i++) - 63;
      bad |= c;
      v = c & 31;
      for (s = 5; c >= 32; s += 5) {
        c = str.charCodeAt(i++) - 63;
        bad |= c;
        v |= (c & 31) << s;
      }
      bad |= 30 - s;
      sum[d] += (v >>> 1) ^ -(v & 1);
    }
    out[n++] = sum[1] / f;
    out[n++] = sum[0] / f;
    if (stride > 2) out[n++] = sum[2] / f;
    if (stride > 3) out[n++] = sum[3] / f;
  }
  return bad & ~63 || i != len ? null : out;
}

/**
 * Encodes ol flat coordinates without changing them, rounding like ol.
 * Returns null when a delta is not finite or too large for 32-bit math, or
 * the length is not a whole number of points.
 */
function encodeFlat(flat, stride, f) {
  const n = flat.length, last = [0, 0, 0, 0];
  if (n % stride) return null;
  let s = '', k = 0, d, v, z;
  for (; k < n; k += stride) {
    for (d = 0; d < stride; d++) {
      v = flat[k + (d < 2 ? 1 - d : d)] * f;
      v = v < 0 ? Math.ceil(v - 0.5) : Math.round(v);
      z = v - last[d];
      last[d] = v;
      if (!(z < LIMIT && z > -LIMIT)) return null;
      z = (z << 1) ^ (z >> 31);
      s += z < 1024 ? CHARS[z] : chars(z);
    }
  }
  return s;
}

/** Drop-in for ol/format/Polyline: same options and output, faster, and it never changes the geometry it writes. */
export default class Polyline extends OlPolyline {
  constructor(options) {
    super(options);
    options = options || {};
    // ol keeps these as private fields; keep our own copies.
    this.polyFactor_ = options.factor ? options.factor : 1e5;
    this.polyLayout_ = options.geometryLayout ? options.geometryLayout : 'XY';
  }

  readGeometryFromText(text, options) {
    const layout = this.polyLayout_, flat = decodeFlat(text, getStrideForLayout(layout), this.polyFactor_);
    if (!flat) return super.readGeometryFromText(text, options);
    return transformGeometryWithOptions(new LineString(flat, layout), false, this.adaptOptions(options));
  }

  writeGeometryText(geometry, options) {
    geometry = transformGeometryWithOptions(geometry, true, this.adaptOptions(options));
    const flat = geometry.getFlatCoordinates(), stride = geometry.getStride(), f = this.polyFactor_;
    // flipXY without a destination writes a new array, so ol's encodeDeltas
    // only changes that copy.
    return encodeFlat(flat, stride, f) ?? encodeDeltas(flipXY(flat, 0, flat.length, stride), stride, f);
  }
}

export { Polyline };
