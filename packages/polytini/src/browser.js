// Browser entry (the "browser" export condition): the portable core, except
// that long lines encode through TextDecoder (text.js). In headless Chrome
// that was about 50% faster from 1,000 points up and the same below 512,
// where it falls back to the core. Decoding stays on the core's charCodeAt
// loop: TextEncoder.encodeInto made it slower in Chrome. No Node, Bun or
// Deno globals.
/* @ts-self-types="../types/index.d.ts" */
import { decode, latLngs, toGeo, fromGeo } from './core.js';
import { encode } from './text.js';

export { decode, decodeFlat, PolylineError } from './core.js';
export { encode, encodeFlat } from './text.js';
export const decodeLatLng = /* @__PURE__ */ latLngs(decode);
export const toGeoJSON = /* @__PURE__ */ toGeo(decode);
export const fromGeoJSON = /* @__PURE__ */ fromGeo(encode);
