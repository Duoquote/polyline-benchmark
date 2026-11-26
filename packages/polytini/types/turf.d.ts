// Types for @duoquote/polytini/turf, using Turf's and GeoJSON's own types.
import type { Feature, FeatureCollection, LineString, Polygon, GeoJsonProperties } from 'geojson';
import type { AllGeoJSON, Id } from '@turf/helpers';
import type { Options } from './index.d.ts';

export interface FeatureOptions<P = GeoJsonProperties> extends Options {
  /** Feature properties. Default {}. */
  properties?: P;
  /** Feature id. */
  id?: Id;
  /** Add a [west, south, east, north] bbox. Default false. */
  bbox?: boolean;
}

export interface CollectionOptions<P = GeoJsonProperties> extends Options {
  /** Shared properties, or one object per line. */
  properties?: P | P[];
  /** One id per line, or the same for all. */
  id?: Id | Id[];
  bbox?: boolean;
}

/** A Feature<LineString> ([lng, lat], like Turf) from one encoded line. */
export function toFeature<P = GeoJsonProperties>(encoded: string, options?: number | FeatureOptions<P>): Feature<LineString, P>;

/** A FeatureCollection<LineString>, one Feature per string. */
export function toFeatureCollection<P = GeoJsonProperties>(encoded: string[], options?: number | CollectionOptions<P>): FeatureCollection<LineString, P>;

/** A Feature<Polygon> from encoded rings: outer first, then holes. */
export function toPolygonFeature<P = GeoJsonProperties>(rings: string[], options?: number | FeatureOptions<P>): Feature<Polygon, P>;

/** Every line in any GeoJSON: LineStrings, MultiLineString parts and polygon rings, in document order. Points are skipped. */
export function fromGeoJSON(geojson: AllGeoJSON, options?: number | Options): string[];
