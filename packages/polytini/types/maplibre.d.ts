// Types for @duoquote/polytini/maplibre, built from maplibre-gl's own types
// (type-only imports, so nothing is loaded at runtime). The source and layer
// types are taken from Map#addSource and Map#addLayer, so they follow the
// installed maplibre-gl version.
import type { Map, GeoJSONSource } from 'maplibre-gl';
import type { FeatureCollection, LineString, GeoJsonProperties } from 'geojson';
import type { Options } from './index.d.ts';

/** MapLibre's GeoJSON source specification. */
export type GeoJSONSourceSpecification = Extract<Parameters<Map['addSource']>[1], { type: 'geojson' }>;

/** MapLibre's line layer specification. */
export type LineLayerSpecification = Extract<Parameters<Map['addLayer']>[0], { type: 'line' }>;

export type FeatureId = string | number;

export interface DataOptions<P = GeoJsonProperties> extends Options {
  /** Properties for every line, or an array with one object per line. Default {}. */
  properties?: P | P[];
  /** Feature id for every line, or an array with one per line. MapLibre's feature state needs numeric ids or promoteId. */
  id?: FeatureId | FeatureId[];
  /** Add a [west, south, east, north] bbox to each feature. Default false. */
  bbox?: boolean;
}

export interface SourceOptions<P = GeoJsonProperties> extends DataOptions<P> {
  /** Other source options: lineMetrics, tolerance, promoteId, generateId, attribution, and so on. */
  source?: Partial<Omit<GeoJSONSourceSpecification, 'type' | 'data'>>;
}

export interface LayerOptions<P = GeoJsonProperties> extends SourceOptions<P> {
  /** Merged into the line layer: paint, layout, filter, minzoom, maxzoom, metadata, or another id. */
  layer?: Partial<Omit<LineLayerSpecification, 'type' | 'source'>>;
  /** The id of an existing layer to insert the new layer before. */
  beforeId?: string;
}

/** A GeoJSON source specification whose data is a FeatureCollection of LineStrings. */
export type PolylineSource<P = GeoJsonProperties> = GeoJSONSourceSpecification & {
  type: 'geojson';
  data: FeatureCollection<LineString, P>;
};

/** A FeatureCollection<LineString> ([lng, lat]) with one Feature per encoded string. */
export function polylineData<P = GeoJsonProperties>(encoded: string | string[], options?: number | DataOptions<P>): FeatureCollection<LineString, P>;

/** `{ type: 'geojson', data }` for map.addSource or a style's sources. */
export function polylineSource<P = GeoJsonProperties>(encoded: string | string[], options?: number | SourceOptions<P>): PolylineSource<P>;

/** Adds a GeoJSON source and a line layer, both named `id`. Returns the map. */
export function addPolylineLayer<M extends Map, P = GeoJsonProperties>(map: M, id: string, encoded: string | string[], options?: number | LayerOptions<P>): M;

/** Replaces the data of the GeoJSON source `id`. Returns setData's Promise. Throws a PolylineError if there is no such GeoJSON source. */
export function setPolylineData<P = GeoJsonProperties>(map: Map, id: string, encoded: string | string[], options?: number | DataOptions<P>): ReturnType<GeoJSONSource['setData']>;
