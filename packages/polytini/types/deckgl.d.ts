// Types for @duoquote/polytini/deckgl. The results are plain objects in
// deck.gl's binary data shape, so they need no deck.gl types: they can be
// passed as `data` to PathLayer, TripsLayer and SolidPolygonLayer.
import type { Options } from './index.d.ts';

export interface BinaryOptions extends Options {
  /** Float32Array instead of Float64Array. Smaller, and enough for most maps; deck.gl uses 64-bit positions only when given them. Default false. */
  float32?: boolean;
}

export interface PathOptions extends BinaryOptions {
  /**
   * For TripsLayer: the last value of each point (with dimensions 3 or 4) goes
   * to attributes.getTimestamps instead of the positions. The values are
   * divided by zFactor, like any value after the second, and always come out
   * as a Float32Array, because TripsLayer's timestamp attribute is 32-bit
   * (deck.gl 9.4 drew nothing given Float64Array timestamps). Default false.
   */
  timestamps?: boolean;
}

/** A deck.gl binary attribute. */
export interface BinaryAttribute<T extends Float32Array | Float64Array = Float32Array | Float64Array, S extends number = number> {
  value: T;
  size: S;
}

export interface BinaryPaths<T extends Float32Array | Float64Array = Float32Array | Float64Array> {
  /** The number of paths, one per string. */
  length: number;
  /** The first vertex of each path, plus the vertex count at the end (length + 1 entries). */
  startIndices: Uint32Array;
  attributes: {
    /** [lng, lat] (size 2) or [lng, lat, z] (size 3) per vertex. */
    getPath: BinaryAttribute<T, 2 | 3>;
    /** One value per vertex, with the timestamps option. Always 32-bit. */
    getTimestamps?: BinaryAttribute<Float32Array, 1>;
  };
}

export interface BinaryPolygons<T extends Float32Array | Float64Array = Float32Array | Float64Array> {
  /** The number of polygons, one ring per string. */
  length: number;
  /** The first vertex of each ring, plus the vertex count at the end (length + 1 entries). */
  startIndices: Uint32Array;
  attributes: {
    /** [lng, lat] (size 2) or [lng, lat, z] (size 3) per vertex, every ring closed. */
    getPolygon: BinaryAttribute<T, 2 | 3>;
  };
}

/** Binary data for PathLayer and TripsLayer, one path per string. Pass _pathType: 'open' to skip deck.gl's normalization. */
export function binaryPaths(encoded: string | string[], options: PathOptions & { float32: true }): BinaryPaths<Float32Array>;
export function binaryPaths(encoded: string | string[], options?: number | (PathOptions & { float32?: false })): BinaryPaths<Float64Array>;
export function binaryPaths(encoded: string | string[], options?: number | PathOptions): BinaryPaths;

/** Binary data for SolidPolygonLayer, one closed ring per string (no holes). */
export function binaryPolygons(encoded: string | string[], options: BinaryOptions & { float32: true }): BinaryPolygons<Float32Array>;
export function binaryPolygons(encoded: string | string[], options?: number | (BinaryOptions & { float32?: false })): BinaryPolygons<Float64Array>;
export function binaryPolygons(encoded: string | string[], options?: number | BinaryOptions): BinaryPolygons;
