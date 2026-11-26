// Types for every Google-format entry point of @duoquote/polytini: the
// default (web), node, bun, deno and wasm entries share this API.

/** A point as [lat, lng], or [lng, lat] with `order: 'lnglat'`. More values with `dimensions`. */
export type Point = [number, number, ...number[]];

/** Objects encode reads by name: lat or latitude, lng, lon or longitude, alt or altitude. */
export interface LatLngLike {
  lat?: number;
  latitude?: number;
  lng?: number;
  lon?: number;
  longitude?: number;
  alt?: number;
  altitude?: number;
}

export interface Options {
  /** Decimal places, an integer from 0 to 15. Default 5. Google uses 5, OSRM's polyline6 and Valhalla 6. */
  precision?: number;
  /** Multiply by this instead of 10 ** precision. */
  factor?: number;
  /**
   * The order of the tuples you pass in and get back. The encoded string
   * always stores latitude first. Default 'latlng'; GeoJSON uses 'lnglat'.
   */
  order?: 'latlng' | 'lnglat';
  /**
   * Throw a PolylineError on malformed input. Default true. With false,
   * decode skips invalid characters and drops an incomplete last point, and
   * encode treats missing or non-finite coordinates as 0.
   */
  strict?: boolean;
  /** Values per point, 1 to 16. Default 2. The third can be elevation, like GraphHopper's. */
  dimensions?: number;
  /** Factor for the third and later values. Defaults to the main factor. */
  zFactor?: number;
}

/** Options, or just the precision. */
export type OptionsArg = number | Options;

export type ErrorCode = 'char' | 'truncated' | 'overflow' | 'coordinate' | 'input' | 'option' | 'init';

export class PolylineError extends Error {
  readonly name: 'PolylineError';
  /** What went wrong. */
  readonly code: ErrorCode;
  /** Character index (decode) or point index (encode), when there is one. */
  readonly index: number | undefined;
  constructor(code: ErrorCode, message: string, index?: number);
}

export interface LineString {
  type: 'LineString';
  coordinates: number[][];
  bbox?: number[];
}

export interface LineStringFeature {
  type: 'Feature';
  geometry: LineString;
  properties: Record<string, unknown> | null;
  id?: string | number;
  bbox?: number[];
}

/** Encodes points: tuples (or any array-like) or lat/lng objects. */
export function encode(points: ArrayLike<ArrayLike<number> | LatLngLike>, options?: OptionsArg): string;

/** Decodes to tuples, [lat, lng] by default. */
export function decode(str: string, options?: OptionsArg): Point[];

/** Encodes a flat array of numbers: [lat0, lng0, lat1, lng1, ...] (or lng first with order 'lnglat'). */
export function encodeFlat(values: ArrayLike<number>, options?: OptionsArg): string;

/** Decodes to one flat Float64Array, without an array per point. */
export function decodeFlat(str: string, options?: OptionsArg): Float64Array;

/** Decodes to {lat, lng} objects, the shape Google Maps and Leaflet take. */
export function decodeLatLng(str: string, options?: OptionsArg): { lat: number; lng: number }[];

/** Decodes to a GeoJSON LineString, [lng, lat] order. */
export function toGeoJSON(str: string, options?: OptionsArg): LineString;

/** Encodes a GeoJSON LineString, or a Feature with one. */
export function fromGeoJSON(geojson: LineString | LineStringFeature, options?: OptionsArg): string;
