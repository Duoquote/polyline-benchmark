// Leaflet plugin: encoded polylines in and out of L.Polyline and L.Polygon.
//
//   import L from 'leaflet';
//   import { install } from '@duoquote/polytini/leaflet';
//   install(L);
//   L.Polyline.fromEncoded('_p~iF~ps|U_ulLnnqC_mqNvxq`@', { color: 'red' }).addTo(map);
//
// Works with Leaflet 1.9 (the global L, the UMD build or ESM imports) and the
// Leaflet 2 betas, where L is a frozen module namespace of ES classes: there
// the static and prototype methods are added, and the lower-case factories
// are skipped because the namespace can't take new properties.
//
// It also covers the API of the old Polyline.encoded.js plugin (npm
// polyline-encoded): L.Polyline.fromEncoded, L.Polygon.fromEncoded,
// encodePath() and L.PolylineUtil, so it can replace it.
/* @ts-self-types="../types/leaflet.jsr.d.ts" */
import { encode, decode } from './web.js';

// One string decodes to one line or ring, arrays nest: string[] is a
// multi-polyline or a polygon with holes, string[][] a multi-polygon.
const toLatLngs = (s, o) => (typeof s == 'string' ? decode(s, o) : s.map((x) => toLatLngs(x, o)));

// The reverse, from getLatLngs(): LatLng[] encodes to a string, nested arrays
// to nested arrays of strings.
const toStrings = (l, o) => (Array.isArray(l[0]) ? l.map((x) => toStrings(x, o)) : encode(l.map((p) => [p.lat, p.lng]), o));

export function install(L) {
  const { Polyline, Polygon } = L;
  const add = (C, name) => {
    C.fromEncoded = (s, o) => new C(toLatLngs(s, o), o);
    C.prototype.toEncoded = function (o) {
      return toStrings(this.getLatLngs(), o);
    };
    // Polyline.encoded.js name.
    C.prototype.encodePath = C.prototype.toEncoded;
    if (Object.isExtensible(L)) L[name] = C.fromEncoded;
  };
  add(Polyline, 'polylineEncoded');
  add(Polygon, 'polygonEncoded');
  if (Object.isExtensible(L)) L.PolylineUtil ??= { encode, decode };
  return L;
}

export { encode, decode };
