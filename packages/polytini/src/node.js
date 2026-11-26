// Node entry: the core plus the Buffer fast paths in fast.js.
/* @ts-self-types="../types/index.d.ts" */
import { Buffer } from 'node:buffer';
import { fast } from './fast.js';
import { latLngs, toGeo, fromGeo } from './core.js';

export { PolylineError } from './core.js';
// On V8 12 (Node 22 and 23), a pre-sized array of 100,000 points made decode
// about 40% slower than appending. Probably because the big array lands in
// old space and every young point stored into it goes through the write
// barrier, but I haven't profiled the GC to confirm it. V8 13
// and 14 (Node 24 on, and what Bun reports) were 25% faster pre-sized, so
// only V8 12 appends, from 32,768 points.
export const { decode, decodeFlat, encode, encodeFlat } = fast(Buffer, process.versions.v8?.startsWith('12.') ? 32768 : Infinity);
export const decodeLatLng = latLngs(decode);
export const toGeoJSON = toGeo(decode);
export const fromGeoJSON = fromGeo(encode);
