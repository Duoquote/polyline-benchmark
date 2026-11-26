# Preset fixtures

Responses used by test/presets.test.js, saved so the tests never need the
network. All were fetched or copied on 2026-11-26. Files are stored as
received, unchanged.

## OSRM public demo server

- `osrm-polyline.json`, `osrm-polyline6.json`, `osrm-geojson.json`
- URL: `https://router.project-osrm.org/route/v1/driving/13.388860,52.517037;13.397634,52.529407;13.428555,52.523219?overview=full&steps=false&geometries=G`
  with `G` set to `polyline`, `polyline6` and `geojson`.
- The same route in the three geometry formats.
- Software: OSRM (BSD-2-Clause). Route data: OpenStreetMap contributors,
  ODbL 1.0 (https://www.openstreetmap.org/copyright). Server use policy:
  https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server

## Valhalla public server (FOSSGIS)

- Server: `https://valhalla1.openstreetmap.de`, `/status` reported version
  `3.9.3-999bbcc`.
- `valhalla-route.json`: native JSON.
  `GET /route?json={"locations":[{"lat":52.517037,"lon":13.388860},{"lat":52.529407,"lon":13.397634}],"costing":"auto","directions_type":"none"}`
- `valhalla-osrm-polyline6.json`, `valhalla-osrm-polyline5.json`,
  `valhalla-osrm-geojson.json`: the same request with
  `"format":"osrm","shape_format":"S"`, `S` set to `polyline6`, `polyline5`
  and `geojson`.
- Software: Valhalla (MIT). Route data: OpenStreetMap contributors,
  ODbL 1.0. Server terms: https://valhalla1.openstreetmap.de

## Mapbox Directions (mapbox/mapbox-java test suite)

- `mapbox-directions_v5.json` (geometries=polyline) and
  `mapbox-directions_v5_precision_6.json` (geometries=polyline6): the same
  route.
- From https://github.com/mapbox/mapbox-java at
  8d0d324b1afac7c6ee2844366bae5061e572835d:
  `services-directions-models/src/test/resources/directions_v5.json` and
  `services-directions-models/src/test/resources/directions_v5_precision_6.json`.
- License: MIT (mapbox-java).

## GraphHopper

- `graphhopper.json`: values copied by hand into one JSON file, from
  https://github.com/graphhopper/graphhopper at
  ce72e96197eb16fcc3ab4f18fdd543fa270be9d5:
  - `tests`: the polylines and points in
    `web-api/src/test/java/com/graphhopper/jackson/ResponsePathRepresentationTest.java`.
  - `docsExample`: `points` and `bbox` of the example response in
    `docs/web/api-doc.md`.
- License: Apache-2.0.

## Not saved

- openrouteservice (GPL-3.0) and OpenTripPlanner (LGPL-3.0): no files were
  copied. The tests use small encoders written from the behavior of their
  encoder sources instead (see src/presets.js for the files and commits).
- GraphHopper Directions API, openrouteservice API, Mapbox, Stadia and
  Google need an API key, so no live responses were fetched from them.
- Strava: the test writes its own points.
