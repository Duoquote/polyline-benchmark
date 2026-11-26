// Types for @duoquote/polytini/google, using the google.maps types from
// @types/google.maps. Those are global declarations, not a module, so they
// are pulled in with a reference directive: types only, nothing at runtime.
/// <reference types="google.maps" />
import type * as P from './index.d.ts';
import type { Options, Point } from './index.d.ts';

export declare const PolylineError: typeof P.PolylineError;
export type PolylineError = P.PolylineError;

/** A LatLng constructor: google.maps.LatLng or anything built the same way. */
export type LatLngConstructor = new (lat: number, lng: number, noClampNoWrap?: boolean) => google.maps.LatLng;

export interface DecodePathOptions extends Omit<Options, 'order'> {
  /**
   * The class to build points with. Default: globalThis.google.maps.LatLng
   * when it exists. false or null returns LatLngLiteral objects.
   */
  LatLng?: LatLngConstructor | false | null;
  /** Passed to the LatLng constructor. Without it, LatLng clamps latitude and wraps longitude into [-180, 180). */
  noClampNoWrap?: boolean;
}

/** A point encodePath takes: google.maps.LatLng, LatLngLiteral or a [lat, lng] tuple. */
export type PathPoint = google.maps.LatLng | google.maps.LatLngLiteral | Point;

/**
 * Decodes an encoded path to LatLngLiteral objects (`LatLng: false`).
 */
export function decodePath(encodedPath: string, options: DecodePathOptions & { LatLng: false | null }): google.maps.LatLngLiteral[];
/**
 * Decodes an encoded path, like google.maps.geometry.encoding.decodePath,
 * to google.maps.LatLng objects. Without a `LatLng` option this uses
 * globalThis.google.maps.LatLng; when the Maps JavaScript API isn't loaded
 * the result is LatLngLiteral objects at runtime, so pass `LatLng: false`
 * there to get that type. Strict by default: a malformed string throws a
 * PolylineError unless `strict: false`.
 */
export function decodePath(encodedPath: string, options?: number | (DecodePathOptions & { LatLng?: LatLngConstructor })): google.maps.LatLng[];
export function decodePath(encodedPath: string, options?: number | DecodePathOptions): google.maps.LatLng[] | google.maps.LatLngLiteral[];

/**
 * Encodes a path, like google.maps.geometry.encoding.encodePath: an array or
 * MVCArray of google.maps.LatLng, LatLngLiteral or [lat, lng] tuples, mixed
 * or not. Precision 5 by default. `order: 'lnglat'` applies to tuples and
 * LatLng objects; literals are read by name. Strict by default.
 */
export function encodePath(path: readonly PathPoint[] | google.maps.MVCArray<PathPoint>, options?: number | Options): string;
