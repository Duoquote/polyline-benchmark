// The /wasm entry: the same API as the main entry, after init.
import type * as P from './index.d.ts';

export type { Point, LatLngLike, Options, OptionsArg, ErrorCode, LineString, LineStringFeature } from './index.d.ts';
export declare const encode: typeof P.encode;
export declare const decode: typeof P.decode;
export declare const encodeFlat: typeof P.encodeFlat;
export declare const decodeFlat: typeof P.decodeFlat;
export declare const decodeLatLng: typeof P.decodeLatLng;
export declare const toGeoJSON: typeof P.toGeoJSON;
export declare const fromGeoJSON: typeof P.fromGeoJSON;
export declare const PolylineError: typeof P.PolylineError;
export type PolylineError = P.PolylineError;

/** Compiles and instantiates the WASM module. Call once before anything else; repeat calls are free. */
export function init(): Promise<void>;

/** The same, synchronously. Fine here because the module is a few hundred bytes. */
export function initSync(): void;
