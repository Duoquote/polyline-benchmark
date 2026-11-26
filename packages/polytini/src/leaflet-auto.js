// Side-effect import: patches the global L (Leaflet's UMD build sets it).
//   import 'leaflet';
//   import '@duoquote/polytini/leaflet/auto';
// For ES module imports of Leaflet, and Leaflet 2, call install(L) from
// @duoquote/polytini/leaflet instead.
/* @ts-self-types="../types/leaflet-auto.jsr.d.ts" */
import { install } from './leaflet.js';

const L = globalThis.L;
if (!L?.Polyline) throw new Error('@duoquote/polytini/leaflet/auto: load Leaflet first, or call install(L) from @duoquote/polytini/leaflet');
install(L);
