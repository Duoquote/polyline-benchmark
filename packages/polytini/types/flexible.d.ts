// Types for @duoquote/polytini/flexible, HERE's Flexible Polyline format
// (version 1). Separate from the Google-format entry points.
import type { ErrorCode } from './index.d.ts';

/** Third dimension types, as stored in the header. */
export const ABSENT: 0;
export const LEVEL: 1;
export const ALTITUDE: 2;
export const ELEVATION: 3;
/** Reserved by the spec: decode accepts it, encode refuses it. */
export const RESERVED1: 4;
/** Reserved by the spec: decode accepts it, encode refuses it. */
export const RESERVED2: 5;
export const CUSTOM1: 6;
export const CUSTOM2: 7;

/** Any type a header can hold. */
export type ThirdDimension = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** The types encode accepts. */
export type EncodableThirdDimension = 0 | 1 | 2 | 3 | 6 | 7;

export interface Header {
  /** Decimal places of latitude and longitude, 0 to 15. */
  precision: number;
  /** What the third value means. ABSENT (0) for 2D lines. */
  thirdDim: ThirdDimension;
  /** Decimal places of the third value, 0 to 15. */
  thirdDimPrecision: number;
}

export interface DecodedResult extends Header {
  /** [lat, lng] points, or [lat, lng, z] when thirdDim is not ABSENT. */
  polyline: number[][];
}

export interface EncodeOptions {
  /** Decimal places of latitude and longitude, an integer from 0 to 15. Default 5. */
  precision?: number;
  /** Type of the third value. Default ABSENT, which ignores any third value. */
  thirdDim?: EncodableThirdDimension;
  /** Decimal places of the third value, an integer from 0 to 15. Default 0. */
  thirdDimPrecision?: number;
}

/** [lat, lng] or [lat, lng, z] points, or one flat array of numbers: [lat0, lng0, lat1, lng1, ...]. */
export type Points = ArrayLike<ArrayLike<number>> | ArrayLike<number>;

/** The argument of @here/flexpolyline's encode. */
export interface EncodeInput extends EncodeOptions {
  polyline: Points;
}

/**
 * Codes of a PolylineError from this entry: the main entry's, plus 'version'
 * for a format version other than 1 or a header with bits set above bit 10.
 */
export type FlexibleErrorCode = Exclude<ErrorCode, 'init'> | 'version';

/** The same class as the main entry's PolylineError. */
export class PolylineError extends Error {
  readonly name: 'PolylineError';
  /** What went wrong. */
  readonly code: FlexibleErrorCode;
  /** Character index (decode) or point index (encode), when there is one. */
  readonly index: number | undefined;
  constructor(code: FlexibleErrorCode, message: string, index?: number);
}

/**
 * Encodes a line. Takes @here/flexpolyline's argument, or the points with
 * the header fields in `options`, which win over the input object's.
 * Rounds half away from zero.
 */
export function encode(input: EncodeInput | Points, options?: EncodeOptions): string;

/** Decodes a line, with its header. The same result shape as @here/flexpolyline. */
export function decode(str: string): DecodedResult;

/** Reads only the header. */
export function header(str: string): Header;
