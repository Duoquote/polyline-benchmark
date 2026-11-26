// Deno entry: the core plus the TextEncoder/TextDecoder byte paths in
// text.js. Deno has no global Buffer, and node:buffer measured slower than
// the portable core there (see the README), so this doesn't use it.
/* @ts-self-types="../types/index.d.ts" */
import { decode, encode } from './text.js';
import { latLngs, toGeo, fromGeo } from './core.js';

export { PolylineError } from './core.js';
export { decode, decodeFlat, encode, encodeFlat } from './text.js';
export const decodeLatLng = /* @__PURE__ */ latLngs(decode);
export const toGeoJSON = /* @__PURE__ */ toGeo(decode);
export const fromGeoJSON = /* @__PURE__ */ fromGeo(encode);
