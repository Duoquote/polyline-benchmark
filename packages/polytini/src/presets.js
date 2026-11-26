// Option presets for routing engines and APIs that use the Google encoded
// polyline format. Each preset is a plain options object for encode, decode,
// encodeFlat, decodeFlat, toGeoJSON and fromGeoJSON:
//
//   import { decode } from '@duoquote/polytini';
//   import { osrm6 } from '@duoquote/polytini/presets';
//   decode(route.geometry, osrm6); // [[lng, lat], ...]
//
// This module imports nothing, so it adds no bytes to the codec, and a
// bundler keeps only the presets you import.
//
// How the values were chosen:
//
// - precision: the engine's documented precision, checked against its
//   encoder source where the source is public. Presets use `precision`
//   rather than `factor`, so spreading a preset and adding `factor` (for
//   example GraphHopper's points_encoded_multiplier) still works, because
//   factor takes priority over precision.
// - order: the order of the engine's own unencoded coordinates (GeoJSON or
//   coordinate arrays), so decoded output can be compared with, or used in
//   place of, what the engine returns when you ask it for plain coordinates.
//   The encoded string always stores latitude first; order only changes the
//   tuples you pass in and get back. Override it with a spread, for example
//   { ...valhalla, order: 'latlng' }.
// - dimensions and zFactor: only for engines that put a third value in the
//   string. Those engines only add it when asked, so each has a 2D preset
//   for the default response and a "3d" preset for the elevation response.
//   A 3D preset on a 2D string throws in strict mode when the value count is
//   not a multiple of 3, and gives wrong points when it is, so pick the
//   preset that matches the request.
//
// Rounding: polytini rounds half away from zero, like Google's description
// and like OSRM and Valhalla (C++ std::round / round). Java's Math.round,
// used by GraphHopper and openrouteservice, rounds halves toward positive
// infinity, and some engines floor. This only matters when encoding:
// decoding gives the engine's exact values for every preset. The core has
// no rounding option, so where an engine rounds differently, encoding a
// point with its preset can give a string that differs from the engine's
// own output by one unit in the last place for some inputs. Each preset
// below says when that happens.
//
// Not covered here, because they are not the Google algorithm:
// - HERE flexible polyline (a header with precision and a third dimension
//   type, and a different character table). Use '@duoquote/polytini/flexible'.
// - Bing Maps point compression (each latitude and longitude pair is
//   combined into one value, and it uses a different character table):
//   https://learn.microsoft.com/en-us/bingmaps/rest-services/elevations/point-compression-algorithm
//
// Sources were read on 2026-11-26. Commits are the default branch heads on
// that date.
/* @ts-self-types="../types/presets.d.ts" */

/**
 * Google Maps Platform: the format's own definition, precision 5.
 * https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 *
 * order 'latlng': Google's decoders return latitude first:
 * google.maps.geometry.encoding.decodePath returns Array<LatLng>
 * (https://developers.google.com/maps/documentation/javascript/reference/geometry),
 * and Directions API locations are {lat, lng}. The Routes API can also
 * return GeoJSON ([lng, lat]) with polylineEncoding: GEO_JSON_LINESTRING
 * (https://developers.google.com/maps/documentation/routes/traffic_on_polylines);
 * use { ...google, order: 'lnglat' } to compare with that.
 */
export const google = { precision: 5, order: 'latlng' };

/**
 * OSRM, geometries=polyline (the default), precision 5.
 * Docs: https://github.com/Project-OSRM/osrm-backend/blob/578a12065917e02bf14bb4568f12a2d3c388ba15/docs/http.md
 * ("polyline with precision 5 in [latitude,longitude] encoding"; also
 * http://project-osrm.org/docs/v5.24.0/api/).
 * Encoder: include/engine/polyline_compressor.hpp at the same commit.
 * OSRM stores coordinates as integers at 1e6 and encodes
 * std::round(fixed * 0.1), which rounds half away from zero, as polytini
 * does.
 *
 * order 'lnglat': geometries=geojson returns a GeoJSON LineString, and
 * waypoint, maneuver and intersection locations are [longitude, latitude].
 * The tests check the public demo server's polyline against its GeoJSON.
 */
export const osrm = { precision: 5, order: 'lnglat' };

/** OSRM, geometries=polyline6: as `osrm`, precision 6. */
export const osrm6 = { precision: 6, order: 'lnglat' };

/**
 * Valhalla, precision 6. The native JSON response has trip.legs[].shape;
 * trace_attributes, height and linear_cost_factors also use precision 6.
 * Docs: https://github.com/valhalla/valhalla/blob/4d8b2061b566412ce61eb8a2001b7cfa2392356a/docs/docs/api/decoding.md
 * ("Valhalla APIs use six digits of decimal precision") and
 * docs/docs/api/route/api-reference.md at the same commit.
 * Encoder: valhalla/midgard/encoded.h at the same commit,
 * round(value * 1e6), half away from zero, latitude first.
 *
 * order 'lnglat': Valhalla's only plain coordinate line output is
 * format=osrm with shape_format=geojson, which is [lng, lat]. Request
 * coordinates are {lat, lon} objects, and the JavaScript example in
 * decoding.md returns [lat, lng]; use { ...valhalla, order: 'latlng' } to
 * match that example.
 *
 * With format=osrm the geometry is polyline6 by default (use this preset or
 * osrm6), or polyline5 with shape_format=polyline5 (use `osrm`).
 */
export const valhalla = { precision: 6, order: 'lnglat' };

/**
 * Stadia Maps routing, which runs Valhalla: precision 6, legs[].shape.
 * https://docs.stadiamaps.com/tutorials/getting-directions-in-javascript-from-geospatial-apis-maplibre
 * ("Our polylines have 6 digits of precision, not 5"; the example decodes
 * leg.shape with polyline.toGeoJSON(shape, 6)). Same values as `valhalla`.
 */
export const stadia = { precision: 6, order: 'lnglat' };

/**
 * GraphHopper, points_encoded=true (the default) and elevation=false (the
 * default): paths[].points and paths[].snapped_waypoints.
 * Docs: https://github.com/graphhopper/graphhopper/blob/ce72e96197eb16fcc3ab4f18fdd543fa270be9d5/docs/web/api-doc.md
 * Encoder: ResponsePathSerializer.encodePolyline in
 * web-api/src/main/java/com/graphhopper/jackson/ResponsePathSerializer.java
 * at the same commit.
 *
 * Latitude and longitude use the points_encoded_multiplier parameter,
 * default 1e5 (web-bundle/.../RouteResource.java), which any value of 1 or
 * more can change. The response echoes it as paths[].points_encoded_multiplier
 * since GraphHopper 9.0 (commit 322be2aa43, "polyline multiplier"). For a
 * response with another multiplier use
 * { ...graphhopper, factor: path.points_encoded_multiplier }.
 * GraphHopper's /navigate endpoint (Mapbox compatible) always uses
 * polyline6; use `mapbox6` there.
 *
 * Rounding: Math.round since GraphHopper 9.0 (commit 4a5dbeb3ff, "encoded
 * polyline algorithm: closer to Google spec"); 8.0 and earlier used
 * Math.floor. Math.round rounds halves toward positive infinity, so a
 * scaled value of exactly -2.5 becomes -2 in GraphHopper and -3 in
 * polytini. Only negative values exactly halfway between two steps differ.
 * The floor of older versions differs from rounding about half the time.
 * Decoding is exact for all versions.
 *
 * order 'lnglat': with points_encoded=false, points is a GeoJSON
 * LineString with [lon, lat, elevation] order.
 */
export const graphhopper = { precision: 5, order: 'lnglat' };

/**
 * GraphHopper with elevation=true: a third value per point, elevation in
 * meters times 100 (hard coded, it does not follow
 * points_encoded_multiplier), so centimeters. Decodes to
 * [lng, lat, elevation]. Same encoder and rounding notes as `graphhopper`:
 * a negative elevation exactly halfway between two centimeters (such as
 * -0.125 m) encodes one centimeter higher in GraphHopper than in polytini.
 */
export const graphhopper3d = { precision: 5, dimensions: 3, zFactor: 100, order: 'lnglat' };

/**
 * openrouteservice, /v2/directions/{profile}/json: routes[].geometry,
 * precision 5. ORS uses its own encoder, not GraphHopper's, and the
 * multiplier is fixed.
 * Docs: https://github.com/GIScience/openrouteservice/blob/65fb57b1d6716ef5147af5d62909402eb51a85f4/docs/api-reference/endpoints/directions/geometry-decoding.md
 * and requests-and-return-types.md in the same folder.
 * Encoder: ors-engine/src/main/java/org/heigit/ors/util/PolylineEncoder.java
 * at the same commit: Math.round(lat * 1e5) and Math.round(lng * 1e5), with
 * the same negative halfway difference as `graphhopper`.
 *
 * order 'lnglat': the geojson endpoint returns a LineString, and request
 * coordinates are longitude/latitude pairs.
 */
export const openrouteservice = { precision: 5, order: 'lnglat' };

/**
 * openrouteservice with elevation=true ("elevation also gets encoded for
 * json response encoded polyline", RouteRequest.java): a third value,
 * elevation in meters times 100. Decodes to [lng, lat, elevation].
 *
 * Rounding: ORS floors the elevation, (long) Math.floor(z * 100), where
 * polytini rounds, so polytini can encode one centimeter more than ORS.
 * That includes some whole-centimeter values, because the multiplication
 * is not exact: 1027.1 * 100 is 102709.99999999999, which ORS stores as
 * 1027.09 m. Latitude and longitude follow the `openrouteservice` notes.
 * Decoding is exact.
 */
export const openrouteservice3d = { precision: 5, dimensions: 3, zFactor: 100, order: 'lnglat' };

/**
 * Mapbox Directions, geometries=polyline (the default), precision 5.
 * Docs: https://docs.mapbox.com/api/navigation/directions/
 * ("polyline (default, a polyline with a precision of five decimal
 * places)"). The encoder is not public; the tests check the response
 * fixtures in mapbox/mapbox-java (MIT).
 *
 * order 'lnglat': geometries=geojson returns a LineString, and waypoint,
 * maneuver and intersection locations are [longitude, latitude].
 */
export const mapbox = { precision: 5, order: 'lnglat' };

/** Mapbox Directions, geometries=polyline6: as `mapbox`, precision 6. */
export const mapbox6 = { precision: 6, order: 'lnglat' };

/**
 * Strava API v3: map.polyline and map.summary_polyline on activities,
 * routes and segments, precision 5.
 * Docs: https://developers.strava.com/docs/reference/ (PolylineMap). The
 * docs do not state the precision; the example summary_polyline there
 * starts at 37.82822, -122.26348 at precision 5, next to the example's
 * start_latlng [37.83, -122.26]. The encoder is not public.
 *
 * order 'latlng': Strava's own coordinates (LatLng, start_latlng, the
 * latlng stream) are [latitude, longitude] arrays.
 */
export const strava = { precision: 5, order: 'latlng' };

/**
 * OpenTripPlanner 2: legGeometry.points in the GraphQL APIs, precision 5.
 * Encoder: street/src/main/java/org/opentripplanner/street/geometry/PolylineEncoder.java
 * and application/src/main/java/org/opentripplanner/api/model/geometry/EncodedPolyline.java
 * in opentripplanner/OpenTripPlanner at 14bcee2a04d0c4a012f524b84b0814595130bf99.
 *
 * Rounding: OTP floors, (int) Math.floor(coordinate * 1e5), so encoding
 * with this preset can give a value one step (1e-5 degrees) higher than
 * OTP's for any point that is not on the 1e-5 grid. Decoding is exact.
 *
 * order 'latlng': OTP has no plain coordinate line output; places and
 * steps give lat and lon as separate fields. The preset keeps the string's
 * own latitude first order.
 */
export const otp = { precision: 5, order: 'latlng' };

/** Every preset, keyed by its export name. */
export const presets = {
  google,
  osrm,
  osrm6,
  valhalla,
  stadia,
  graphhopper,
  graphhopper3d,
  openrouteservice,
  openrouteservice3d,
  mapbox,
  mapbox6,
  strava,
  otp,
};
