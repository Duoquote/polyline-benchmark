// MapLibre GL JS (and Mapbox GL JS, see mapbox.js): encoded polylines as
// GeoJSON sources and line layers.
//
//   import { addPolylineLayer, setPolylineData } from '@duoquote/polytini/maplibre';
//   map.on('load', () => {
//     addPolylineLayer(map, 'route', route.geometry, { precision: 6, layer: { paint: { 'line-width': 4 } } });
//   });
//   setPolylineData(map, 'route', newRoute.geometry, { precision: 6 });
//
// No map library code is imported: the functions only call addSource,
// addLayer and getSource(id).setData on the map they are given, which
// MapLibre GL 4 to 6 and Mapbox GL 3 all have with the same arguments.
// Coordinates come out as [lng, lat] like all GeoJSON, whatever `order` the
// options or a preset say.
/* @ts-self-types="../types/maplibre.d.ts" */
import { toFeatureCollection } from './turf.js';
import { fail } from './core.js';

const list = (encoded) => (typeof encoded == 'string' ? [encoded] : encoded);

/**
 * The FeatureCollection<LineString> for one encoded string or many.
 * Options: polytini options or a preset, plus `properties` and `id` (one
 * value for all lines or an array with one per line) and `bbox`.
 */
export const polylineData = (encoded, options) => toFeatureCollection(list(encoded), options);

/**
 * A GeoJSON source specification, `{ type: 'geojson', data }`, for addSource
 * or a style's `sources`. `options.source` adds source options such as
 * lineMetrics, tolerance or promoteId.
 */
export const polylineSource = (encoded, options) => ({ ...options?.source, type: 'geojson', data: polylineData(encoded, options) });

/**
 * Adds a GeoJSON source and a line layer that draws it, both named `id`.
 * `options.layer` is merged into the layer (paint, layout, filter, minzoom,
 * a different id, and so on), and `options.beforeId` is passed to addLayer.
 * Returns the map.
 */
export function addPolylineLayer(map, id, encoded, options) {
  map.addSource(id, polylineSource(encoded, options));
  map.addLayer({ id, type: 'line', source: id, ...options?.layer }, options?.beforeId);
  return map;
}

/**
 * Replaces the data of the GeoJSON source `id` with new lines and returns
 * what the source's setData returns (a Promise in MapLibre, the source in
 * Mapbox). Throws a PolylineError with code 'input' if there is no such
 * GeoJSON source.
 */
export function setPolylineData(map, id, encoded, options) {
  const source = map.getSource(id);
  if (typeof source?.setData != 'function') fail('input', 'No GeoJSON source named ' + id);
  return source.setData(polylineData(encoded, options));
}
