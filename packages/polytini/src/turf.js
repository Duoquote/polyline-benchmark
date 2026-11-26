// Turf.js interop: decode straight to GeoJSON Features in Turf's shape, and
// encode whatever Turf hands back. No Turf code is imported; the types come
// from @turf/helpers and geojson.
//
//   import { toFeature, fromGeoJSON } from '@duoquote/polytini/turf';
//   const km = turf.length(toFeature(route.geometry, { precision: 6 }));
//   const [simplified] = fromGeoJSON(turf.simplify(toFeature(str), { tolerance: 0.001 }));
/* @ts-self-types="../types/turf.d.ts" */
import { decode, encode } from './web.js';
import { fail } from './error.js';

const lngLat = (o) => ({ ...(typeof o == 'number' ? { precision: o } : o), order: 'lnglat' });

// [west, south, east, north] over every position of nested arrays.
function bbox(c) {
  const b = [1 / 0, 1 / 0, -1 / 0, -1 / 0];
  const walk = (a) => {
    if (typeof a[0] == 'number') {
      b[0] = Math.min(b[0], a[0]);
      b[1] = Math.min(b[1], a[1]);
      b[2] = Math.max(b[2], a[0]);
      b[3] = Math.max(b[3], a[1]);
    } else a.forEach(walk);
  };
  walk(c);
  return b;
}

// Turf's feature() shape: type, id, bbox, properties, geometry.
function feature(geometry, o, i) {
  const f = { type: 'Feature' }, p = o?.properties;
  if (o?.id != null) f.id = Array.isArray(o.id) ? o.id[i] : o.id;
  if (o?.bbox && geometry.coordinates.length) f.bbox = bbox(geometry.coordinates);
  f.properties = (Array.isArray(p) ? p[i] : p) ?? {};
  f.geometry = geometry;
  return f;
}

/** A Feature<LineString> from one encoded line. Options: polytini options plus properties, id and bbox. */
export const toFeature = (str, o, i) => feature({ type: 'LineString', coordinates: decode(str, lngLat(o)) }, o, i);

/** A FeatureCollection<LineString>, one Feature per string. properties and id may be arrays, one per line. */
export const toFeatureCollection = (strs, o) => ({ type: 'FeatureCollection', features: strs.map((s, i) => toFeature(s, o, i)) });

/** A Feature<Polygon> from encoded rings: the outer ring first, then holes, like Google's encoded polygons. */
export const toPolygonFeature = (rings, o) => feature({ type: 'Polygon', coordinates: rings.map((s) => decode(s, lngLat(o))) }, o, 0);

/**
 * Encodes every line in any GeoJSON object: a LineString, each part of a
 * MultiLineString, each ring of a Polygon or MultiPolygon, recursing into
 * Features, FeatureCollections and GeometryCollections. Points are skipped.
 * Always returns an array of strings, in document order.
 */
export function fromGeoJSON(g, o) {
  const out = [], ll = lngLat(o);
  const walk = (g) => {
    switch (g?.type) {
      case 'Feature':
        return g.geometry && walk(g.geometry);
      case 'FeatureCollection':
        return g.features.forEach(walk);
      case 'GeometryCollection':
        return g.geometries.forEach(walk);
      case 'LineString':
        return out.push(encode(g.coordinates, ll));
      case 'MultiLineString':
      case 'Polygon':
        return g.coordinates.forEach((c) => out.push(encode(c, ll)));
      case 'MultiPolygon':
        return g.coordinates.forEach((p) => p.forEach((c) => out.push(encode(c, ll))));
      case 'Point':
      case 'MultiPoint':
        return;
      default:
        fail('input', 'Expected GeoJSON');
    }
  };
  walk(g);
  return out;
}
