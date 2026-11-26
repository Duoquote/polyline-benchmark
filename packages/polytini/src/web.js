// Default and browser entry: the portable core and nothing else, so it has
// no Node, Bun or Deno globals and bundles small.
/* @ts-self-types="../types/index.d.ts" */
import { decode, encode, latLngs, toGeo, fromGeo } from './core.js';

export { decode, encode, decodeFlat, encodeFlat, PolylineError } from './core.js';
export const decodeLatLng = /* @__PURE__ */ latLngs(decode);
export const toGeoJSON = /* @__PURE__ */ toGeo(decode);
export const fromGeoJSON = /* @__PURE__ */ fromGeo(encode);
