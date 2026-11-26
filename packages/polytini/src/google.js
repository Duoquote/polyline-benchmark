// Google Maps JavaScript API helpers: decodePath and encodePath with the
// signatures of google.maps.geometry.encoding, without loading the geometry
// library.
//
//   import { decodePath, encodePath } from '@duoquote/polytini/google';
//   const path = decodePath(route.polyline.encodedPolyline);
//   new google.maps.Polyline({ path, map });
//   encodePath(polyline.getPath()); // an MVCArray<LatLng>
//
// Differences from google.maps.geometry.encoding:
// - Both take an optional second argument: polytini's precision (a number)
//   or options object. Precision defaults to 5, Google's fixed value.
// - decodePath returns google.maps.LatLng objects when a LatLng constructor
//   is available (the LatLng option, else globalThis.google.maps.LatLng),
//   and plain { lat, lng } literals otherwise, so it also works in Node or
//   before the Maps API has loaded. Pass `LatLng: false` for literals even
//   when the API is loaded. Polyline, Polygon and most Maps API methods
//   take literals as well as LatLng, and literals are cheaper to create.
// - Strict by default: malformed strings and invalid coordinates throw a
//   PolylineError. Google documents no error behavior for decodePath or
//   encodePath, so what they return for such input can't be matched; a
//   thrown error is easier to find than a wrong line on the map, and valid
//   input gives the same result either way. Pass `strict: false` to never
//   throw on bad characters or truncated strings (invalid characters are
//   skipped and an incomplete last point is dropped) or on invalid
//   coordinates (encoded as 0).
// - encodePath also takes polytini's [lat, lng] tuples and encodes
//   LatLngLiteral values as given, without clamping or wrapping them.
/* @ts-self-types="../types/google.jsr.d.ts" */
import { decode, encode } from './web.js';

export { PolylineError } from './web.js';

// decodePath reads the tuples as [lat, lng], so it ignores order 'lnglat'.
const latFirst = (o) => (o?.order == 'lnglat' ? { ...o, order: 'latlng' } : o);

/**
 * Decodes an encoded path to google.maps.LatLng objects, or to LatLngLiteral
 * objects when no LatLng constructor is available. Options: polytini's
 * (precision, strict, factor, dimensions), plus `LatLng` (a constructor, or
 * false for literals) and `noClampNoWrap` (passed to the LatLng constructor;
 * without it, Google's LatLng clamps latitude and wraps longitude 180 to -180).
 */
export function decodePath(encodedPath, o) {
  // o is a number, an options object or undefined; o?.x reads all three.
  const C = o?.LatLng !== undefined ? o.LatLng : globalThis.google?.maps?.LatLng;
  const pts = decode(encodedPath, latFirst(o)), nw = o?.noClampNoWrap;
  for (let i = 0; i < pts.length; i++) {
    const [lat, lng] = pts[i];
    pts[i] = C ? new C(lat, lng, nw) : { lat, lng };
  }
  return pts;
}

/**
 * Encodes an array or MVCArray of google.maps.LatLng objects, LatLngLiteral
 * objects or [lat, lng] tuples (mixed is fine). Options: polytini's
 * (precision, strict, factor, dimensions, and order for tuples and LatLng
 * objects; literals are read by name).
 */
export function encodePath(path, o) {
  if (path && typeof path.getArray == 'function') path = path.getArray();
  if (Array.isArray(path)) {
    const sw = o?.order == 'lnglat';
    // LatLng objects have lat() and lng() methods; the core reads literals
    // and tuples directly.
    path = path.map((p) => (p && typeof p.lat == 'function' ? (sw ? [p.lng(), p.lat()] : [p.lat(), p.lng()]) : p));
  }
  return encode(path, o);
}
