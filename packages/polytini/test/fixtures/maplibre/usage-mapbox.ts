// Type check of @duoquote/polytini/mapbox against mapbox-gl's types.
import mapboxgl, { type GeoJSONSource } from 'mapbox-gl';
import { addPolylineLayer, setPolylineData, polylineSource, polylineData, type LayerOptions } from '@duoquote/polytini/mapbox';

declare const map: mapboxgl.Map;
const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

map.addSource('route', polylineSource([encoded], { properties: [{ n: 1 }], source: { lineMetrics: true } }));
const options: LayerOptions = { layer: { paint: { 'line-width': 4 }, slot: 'top' }, beforeId: 'labels' };
const same: mapboxgl.Map = addPolylineLayer(map, 'route2', encoded, options);
const result: GeoJSONSource = setPolylineData(map, 'route', [encoded, encoded]);
(map.getSource('route') as GeoJSONSource).setData(polylineData(encoded));

// @ts-expect-error a paint property of another layer type
addPolylineLayer(map, 'x', encoded, { layer: { paint: { 'fill-color': '#000' } } });

export { same, result };
