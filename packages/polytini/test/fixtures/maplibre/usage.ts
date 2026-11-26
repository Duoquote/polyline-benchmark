// Type check of @duoquote/polytini/maplibre against maplibre-gl's types. Not
// run, only compiled: npx tsc -p test/fixtures/maplibre
import { Map, type GeoJSONSource } from 'maplibre-gl';
import { addPolylineLayer, setPolylineData, polylineSource, polylineData, type PolylineSource, type LayerOptions } from '@duoquote/polytini/maplibre';
import { osrm6 } from '@duoquote/polytini/presets';
import type { FeatureCollection, LineString } from 'geojson';

declare const map: Map;
const encoded = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';

const src: PolylineSource<{ name: string }> = polylineSource([encoded, encoded], { ...osrm6, properties: [{ name: 'a' }, { name: 'b' }], id: [1, 2], source: { lineMetrics: true, promoteId: 'name' } });
map.addSource('route', src);
map.addSource('route2', polylineSource(encoded, 6));
const fc: FeatureCollection<LineString, { name: string }> = polylineData(encoded, { properties: { name: 'x' } });
fc.features[0].properties.name.toUpperCase();

const options: LayerOptions = {
  precision: 6,
  layer: { paint: { 'line-width': 4, 'line-color': '#c00' }, layout: { 'line-cap': 'round' }, minzoom: 2 },
  beforeId: 'labels',
};
const same: Map = addPolylineLayer(map, 'route3', [encoded], options);
const done: Promise<void> = setPolylineData(map, 'route', encoded, { precision: 5 });

// The style spec type of maplibre-gl accepts the source.
const style = { version: 8 as const, sources: { route: src }, layers: [{ id: 'route', type: 'line' as const, source: 'route' }] };
new Map({ container: 'map', style });
(map.getSource('route') as GeoJSONSource).setData(polylineData(encoded));

// @ts-expect-error a paint property of another layer type
addPolylineLayer(map, 'x', encoded, { layer: { paint: { 'fill-color': '#000' } } });
// @ts-expect-error the layer type is always line
addPolylineLayer(map, 'x', encoded, { layer: { type: 'fill' } });

export { same, done };
