// Node entry: the core plus the Buffer fast paths in fast.js.
/* @ts-self-types="../types/index.d.ts" */
import { Buffer } from 'node:buffer';
import { fast } from './fast.js';
import { latLngs, toGeo, fromGeo } from './core.js';

export { PolylineError } from './core.js';
export const { decode, decodeFlat, encode, encodeFlat } = fast(Buffer);
export const decodeLatLng = latLngs(decode);
export const toGeoJSON = toGeo(decode);
export const fromGeoJSON = fromGeo(encode);
