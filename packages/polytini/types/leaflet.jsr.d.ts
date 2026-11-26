// Types for @duoquote/polytini/leaflet on JSR. JSR doesn't allow module
// augmentation, so this has the plugin's own exports but not the methods it
// adds to Leaflet's classes. The npm package's leaflet.d.ts has those.
import type * as P from './index.d.ts';

/** One encoded line or ring, or nested arrays of them (multi-polylines, holes, multi-polygons). */
export type Encoded = string | Encoded[];

/** Adds fromEncoded, toEncoded, encodePath and the polylineEncoded/polygonEncoded factories. Returns L. */
export function install<T>(L: T): T;

export declare const encode: typeof P.encode;
export declare const decode: typeof P.decode;
