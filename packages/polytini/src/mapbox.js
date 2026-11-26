// Mapbox GL JS 3: the same functions as the MapLibre module. The calls they
// make (addSource with a GeoJSON source specification, addLayer with a line
// layer and a beforeId, getSource(id).setData) take the same arguments in
// both libraries, so only the types differ: types/mapbox.d.ts uses
// mapbox-gl's.
//
//   import { addPolylineLayer } from '@duoquote/polytini/mapbox';
//   map.on('load', () => addPolylineLayer(map, 'route', encoded, { layer: { paint: { 'line-color': '#c00' } } }));
/* @ts-self-types="../types/mapbox.d.ts" */
export { polylineData, polylineSource, addPolylineLayer, setPolylineData } from './maplibre.js';
