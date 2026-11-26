// Types for @duoquote/polytini/leaflet. Leaflet's own types come from
// @types/leaflet (1.9) or leaflet's bundled types (2.x); this only adds the
// plugin's methods.
import type * as P from './index.d.ts';
import type { OptionsArg } from './index.d.ts';
import type { Polyline as LeafletPolyline, Polygon as LeafletPolygon } from 'leaflet';

/** One encoded line or ring, or nested arrays of them (multi-polylines, holes, multi-polygons). */
export type Encoded = string | Encoded[];

/** Leaflet path options plus polytini's precision, factor, strict and dimensions. */
export type EncodedOptions = Record<string, unknown> & Exclude<OptionsArg, number>;

/** Adds fromEncoded, toEncoded, encodePath and the polylineEncoded/polygonEncoded factories. Returns L. */
export function install<T>(L: T): T;

export declare const encode: typeof P.encode;
export declare const decode: typeof P.decode;

declare module 'leaflet' {
  namespace Polyline {
    /** A polyline from an encoded string, or a multi-polyline from an array of strings. */
    // Generic with a default so Polygon's static side still extends Polyline's.
    function fromEncoded<T = LeafletPolyline>(encoded: Encoded, options?: EncodedOptions): T;
  }
  namespace Polygon {
    /** A polygon from one string, rings (outer, then holes) from string[], a multi-polygon from string[][]. */
    function fromEncoded<T = LeafletPolygon>(encoded: Encoded, options?: EncodedOptions): T;
  }
  interface Polyline {
    /** A string for a simple line, string[] for a multi-polyline. Polygons give string[] (rings) or string[][]. */
    toEncoded(options?: OptionsArg): Encoded;
    /** Alias of toEncoded, the Polyline.encoded.js name. */
    encodePath(options?: OptionsArg): Encoded;
  }
  function polylineEncoded(encoded: Encoded, options?: EncodedOptions): LeafletPolyline;
  function polygonEncoded(encoded: Encoded, options?: EncodedOptions): LeafletPolygon;
  const PolylineUtil: { encode: typeof P.encode; decode: typeof P.decode };
}
