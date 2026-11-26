// Option presets for routing engines that use the Google encoded polyline
// format. Each one is a plain options object for encode, decode,
// encodeFlat, decodeFlat, toGeoJSON and fromGeoJSON. See src/presets.js for
// the sources behind every value.

/** A 2D preset: precision and the order of the tuples you pass and get back. */
export interface Preset2D<P extends number = number, O extends 'latlng' | 'lnglat' = 'latlng' | 'lnglat'> {
  readonly precision: P;
  readonly order: O;
}

/** A preset with a third value per point, scaled by `zFactor`. */
export interface Preset3D<P extends number = number, O extends 'latlng' | 'lnglat' = 'latlng' | 'lnglat'> extends Preset2D<P, O> {
  readonly dimensions: 3;
  readonly zFactor: number;
}

/** Google Maps Platform: precision 5, [lat, lng]. */
export declare const google: Preset2D<5, 'latlng'>;
/** OSRM geometries=polyline: precision 5, [lng, lat] like its GeoJSON. */
export declare const osrm: Preset2D<5, 'lnglat'>;
/** OSRM geometries=polyline6: precision 6, [lng, lat]. */
export declare const osrm6: Preset2D<6, 'lnglat'>;
/** Valhalla shapes: precision 6, [lng, lat] like its format=osrm GeoJSON. */
export declare const valhalla: Preset2D<6, 'lnglat'>;
/** Stadia Maps routing (Valhalla): precision 6, [lng, lat]. */
export declare const stadia: Preset2D<6, 'lnglat'>;
/**
 * GraphHopper points_encoded=true: precision 5 (the default
 * points_encoded_multiplier), [lng, lat] like points_encoded=false.
 */
export declare const graphhopper: Preset2D<5, 'lnglat'>;
/** GraphHopper with elevation=true: [lng, lat, elevation in meters], elevation stored in centimeters. */
export declare const graphhopper3d: Preset3D<5, 'lnglat'>;
/** openrouteservice JSON geometry: precision 5, [lng, lat] like its GeoJSON. */
export declare const openrouteservice: Preset2D<5, 'lnglat'>;
/** openrouteservice with elevation=true: [lng, lat, elevation in meters], elevation stored in centimeters. */
export declare const openrouteservice3d: Preset3D<5, 'lnglat'>;
/** Mapbox Directions geometries=polyline: precision 5, [lng, lat]. */
export declare const mapbox: Preset2D<5, 'lnglat'>;
/** Mapbox Directions geometries=polyline6: precision 6, [lng, lat]. */
export declare const mapbox6: Preset2D<6, 'lnglat'>;
/** Strava map.polyline and summary_polyline: precision 5, [lat, lng] like its latlng stream. */
export declare const strava: Preset2D<5, 'latlng'>;
/** OpenTripPlanner legGeometry.points: precision 5, [lat, lng]. */
export declare const otp: Preset2D<5, 'latlng'>;

/** Every preset, keyed by its export name. */
export declare const presets: {
  readonly google: typeof google;
  readonly osrm: typeof osrm;
  readonly osrm6: typeof osrm6;
  readonly valhalla: typeof valhalla;
  readonly stadia: typeof stadia;
  readonly graphhopper: typeof graphhopper;
  readonly graphhopper3d: typeof graphhopper3d;
  readonly openrouteservice: typeof openrouteservice;
  readonly openrouteservice3d: typeof openrouteservice3d;
  readonly mapbox: typeof mapbox;
  readonly mapbox6: typeof mapbox6;
  readonly strava: typeof strava;
  readonly otp: typeof otp;
};

/** The name of a preset in `presets`. */
export type PresetName = keyof typeof presets;
