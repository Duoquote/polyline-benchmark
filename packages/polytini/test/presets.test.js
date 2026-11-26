// Routing engine presets, checked against real engine output on every entry
// point. Fixtures and their sources: test/fixtures/presets/SOURCE.md.
import { test, eq, near, ok, throws, entries, json } from './lib.js';
import * as mod from '../src/presets.js';
import { presets, google, osrm, osrm6, valhalla, stadia, graphhopper, graphhopper3d, openrouteservice, openrouteservice3d, mapbox, mapbox6, strava, otp } from '../src/presets.js';

const list = await entries();
const fx = (name) => json('fixtures/presets/' + name);
const swap = (points) => points.map(([a, b, ...rest]) => [b, a, ...rest]);
// Half a step at precision 5, plus room for the float division.
const HALF5 = 5e-6 + 1e-12;

// Encoders written from the engines' Java sources, used to check where
// polytini's half-away-from-zero rounding agrees with them and where not.
// JS Math.round rounds halves toward positive infinity, like Java's.
// Points are [lat, lng] or [lat, lng, z].
const zig = (n) => String.fromCharCode(...chunks(n < 0 ? -n * 2 - 1 : n * 2));
function chunks(v) {
  const out = [];
  for (; v >= 32; v = Math.floor(v / 32)) out.push((v % 32) + 95);
  out.push(v + 63);
  return out;
}
function javaEncode(points, factor, roundLL, zFactor, roundZ) {
  const last = [0, 0, 0];
  let s = '';
  for (const p of points)
    for (let a = 0; a < p.length; a++) {
      const v = a < 2 ? roundLL(p[a] * factor) : roundZ(p[a] * zFactor);
      s += zig(v - last[a]);
      last[a] = v;
    }
  return s;
}
// ResponsePathSerializer.encodePolyline (GraphHopper 9.0 and later).
const ghEncode = (points, factor = 1e5) => javaEncode(points, factor, Math.round, 100, Math.round);
// ors-engine PolylineEncoder.encode.
const orsEncode = (points) => javaEncode(points, 1e5, Math.round, 100, Math.floor);
// OpenTripPlanner PolylineEncoder.encodeCoordinates.
const otpEncode = (points) => javaEncode(points, 1e5, Math.floor);

// True when Math.round and half away from zero disagree on v * f: a
// negative value exactly halfway between two steps.
const negativeHalf = (v, f) => Math.round(v * f) !== Math.sign(v * f) * Math.floor(Math.abs(v * f) + 0.5);

// Random points from a fixed seed, [lat, lng] or [lat, lng, z]. The values
// are multiples of 2^-31 times a constant, so exact halves can occur.
function randomPoints(n, dims, seed = 1) {
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  return Array.from({ length: n }, () => {
    const p = [rnd() * 170 - 85, rnd() * 360 - 180];
    if (dims == 3) p.push(rnd() * 9000 - 500);
    return p;
  });
}

test('presets: the presets object holds every named export', () => {
  const named = Object.keys(mod).filter((k) => k != 'presets').sort();
  eq(Object.keys(presets).sort(), named);
  for (const k of named) ok(presets[k] === mod[k], k);
});

test('presets: only known option keys, with valid values', () => {
  for (const [name, p] of Object.entries(presets)) {
    for (const k of Object.keys(p)) ok(['precision', 'order', 'dimensions', 'zFactor'].includes(k), `${name}.${k}`);
    ok(p.precision == 5 || p.precision == 6, name);
    ok(p.order == 'latlng' || p.order == 'lnglat', name);
    if (p.dimensions != null) eq([p.dimensions, p.zFactor], [3, 100], name);
  }
});

test('presets: every entry accepts every preset and round trips', () => {
  for (const { name, api } of list)
    for (const [key, p] of Object.entries(presets)) {
      const pts = randomPoints(20, p.dimensions ?? 2, key.length).map((q) => q.map((v) => Math.round(v * 100) / 100));
      const input = p.order == 'lnglat' ? swap(pts) : pts;
      const s = api.encode(input, p);
      near(api.decode(s, p), input, 1e-9, `${name} ${key}`);
      near(Array.from(api.decodeFlat(s, p)), input.flat(), 1e-9, `${name} ${key} flat`);
      eq(api.encodeFlat(input.flat(), p), s, `${name} ${key} encodeFlat`);
    }
});

test('presets: lnglat presets give the same string as latlng input with the default options', () => {
  const pts = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]];
  for (const { name, api } of list) {
    eq(api.encode(swap(pts), osrm), api.encode(pts), name);
    eq(api.encode(pts, google), api.encode(pts), name);
    eq(api.encode(pts, strava), api.encode(pts), name);
    eq(api.encode(pts, otp), api.encode(pts), name);
  }
});

test('google: the example from the algorithm page', () => {
  const s = '_p~iF~ps|U_ulLnnqC_mqNvxq`@', pts = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]];
  for (const { name, api } of list) {
    eq(api.decode(s, google), pts, name);
    eq(api.encode(pts, google), s, name);
  }
  // The page's single value: -179.9832104 encodes to `~oia@ at precision 5.
  for (const { name, api } of list) eq(api.encode([[-179.9832104]], { ...google, dimensions: 1 }), '`~oia@', name);
});

test('osrm6: the demo server polyline6 decodes to its GeoJSON coordinates', async () => {
  const geo = (await fx('osrm-geojson.json')).routes[0].geometry;
  const s = (await fx('osrm-polyline6.json')).routes[0].geometry;
  ok(geo.coordinates.length > 100);
  for (const { name, api } of list) {
    eq(api.decode(s, osrm6), geo.coordinates, name);
    eq(Array.from(api.decodeFlat(s, osrm6)), geo.coordinates.flat(), name);
    eq(api.toGeoJSON(s, osrm6), geo, name);
    eq(api.encode(geo.coordinates, osrm6), s, name);
    eq(api.fromGeoJSON(geo, osrm6), s, name);
  }
});

test('osrm: the demo server polyline is its GeoJSON rounded to 5 digits', async () => {
  const coords = (await fx('osrm-geojson.json')).routes[0].geometry.coordinates;
  const s = (await fx('osrm-polyline.json')).routes[0].geometry;
  for (const { name, api } of list) {
    near(api.decode(s, osrm), coords, HALF5, name);
    // OSRM rounds its 1e6 integers half away from zero, as polytini does.
    eq(api.encode(coords, osrm), s, name);
  }
});

test('osrm: legs and waypoints line up with the decoded geometry', async () => {
  const r = await fx('osrm-polyline6.json');
  const line = list[0].api.decode(r.routes[0].geometry, osrm6);
  // The demo server snaps the first and last waypoints onto the geometry.
  eq(line[0], r.waypoints[0].location);
  eq(line.at(-1), r.waypoints.at(-1).location);
});

test('valhalla: the native leg shape decodes to the format=osrm GeoJSON', async () => {
  const shape = (await fx('valhalla-route.json')).trip.legs[0].shape;
  const coords = (await fx('valhalla-osrm-geojson.json')).routes[0].geometry.coordinates;
  ok(coords.length > 100);
  for (const { name, api } of list) {
    eq(api.decode(shape, valhalla), coords, name);
    eq(api.decode(shape, stadia), coords, name);
    eq(api.encode(coords, valhalla), shape, name);
  }
});

test('valhalla: format=osrm geometries match the presets', async () => {
  const shape = (await fx('valhalla-route.json')).trip.legs[0].shape;
  const p6 = (await fx('valhalla-osrm-polyline6.json')).routes[0].geometry;
  const p5 = (await fx('valhalla-osrm-polyline5.json')).routes[0].geometry;
  const coords = (await fx('valhalla-osrm-geojson.json')).routes[0].geometry.coordinates;
  // format=osrm defaults to polyline6, the same string as the native shape.
  eq(p6, shape);
  for (const { name, api } of list) {
    eq(api.decode(p6, osrm6), coords, name);
    // Valhalla rounds its own points, which have more digits than the 6 in
    // the GeoJSON, so only the distance is checked here.
    near(api.decode(p5, osrm), coords, HALF5, name);
  }
});

test('mapbox6: step geometries start at the maneuver and pass every intersection', async () => {
  const r = await fx('mapbox-directions_v5_precision_6.json');
  const route = r.routes[0];
  for (const { name, api } of list) {
    const line = api.decode(route.geometry, mapbox6);
    eq(line[0], r.waypoints[0].location, name);
    eq(line.at(-1), r.waypoints.at(-1).location, name);
    let n = 0;
    for (const step of route.legs[0].steps) {
      const pts = api.decode(step.geometry, mapbox6);
      eq(pts[0], step.maneuver.location, name);
      const keys = new Set(pts.map((p) => p.join()));
      for (const x of step.intersections) ok(keys.has(x.location.join()), `${name}: ${x.location} not on the step line`), n++;
    }
    ok(n > 100);
  }
});

test('mapbox: precision 5 fixture, the same route rounded to 5 digits', async () => {
  const r = await fx('mapbox-directions_v5.json');
  const route = r.routes[0];
  for (const { name, api } of list) {
    const line = api.decode(route.geometry, mapbox);
    near(line[0], r.waypoints[0].location, HALF5, name);
    near(line.at(-1), r.waypoints.at(-1).location, HALF5, name);
    for (const step of route.legs[0].steps) {
      // The first point is stored as is, so encoding the maneuver location
      // must give the start of the step geometry.
      const first = api.encode([step.maneuver.location], mapbox);
      ok(step.geometry.startsWith(first), `${name}: ${step.maneuver.location}`);
      const pts = api.decode(step.geometry, mapbox);
      for (const x of step.intersections) {
        const d = Math.min(...pts.map((p) => Math.max(Math.abs(p[0] - x.location[0]), Math.abs(p[1] - x.location[1]))));
        ok(d <= HALF5, `${name}: ${x.location} is ${d} away`);
      }
    }
  }
});

test('mapbox: precision 6 and 5 fixtures describe the same route', async () => {
  const s5 = (await fx('mapbox-directions_v5.json')).routes[0].geometry;
  const s6 = (await fx('mapbox-directions_v5_precision_6.json')).routes[0].geometry;
  for (const { name, api } of list) near(api.decode(s5, mapbox), api.decode(s6, mapbox6), HALF5, name);
});

test('graphhopper: the vectors from ResponsePathRepresentationTest', async () => {
  const t = (await fx('graphhopper.json')).tests;
  for (const { name, api } of list) {
    for (const c of t.decode2d) {
      eq(api.decode(c.points, graphhopper), swap(c.latLng), name);
      eq(api.encode(swap(c.latLng), graphhopper), c.points, name);
    }
    for (const c of t.decode3d) {
      eq(api.decode(c.points, graphhopper3d), swap(c.latLng), name);
      eq(api.encode(swap(c.latLng), graphhopper3d), c.points, name);
    }
    const e = t.encode1e6;
    eq(api.encode(swap(e.latLng), { ...graphhopper, factor: e.multiplier }), e.points, name);
    eq(api.decode(e.points, { ...graphhopper, factor: e.multiplier }), swap(e.latLng), name);
    eq(api.decode(e.points, { ...graphhopper, precision: 6 }), swap(e.latLng), name);
    for (const pts of t.roundTrip) eq(api.decode(api.encode(swap(pts), graphhopper), graphhopper), swap(pts), name);
  }
});

test('graphhopper: the docs example decodes to [lng, lat] inside its bbox', async () => {
  const { points, bbox } = (await fx('graphhopper.json')).docsExample;
  for (const { name, api } of list) {
    const line = api.decode(points, graphhopper);
    ok(line.length == 17, name);
    // The example predates the switch from floor to round, so allow a full step.
    for (const [lng, lat] of line) ok(lng >= bbox[0] - 1e-5 && lng <= bbox[2] + 1e-5 && lat >= bbox[1] - 1e-5 && lat <= bbox[3] + 1e-5, `${name}: ${lng},${lat}`);
  }
});

test('graphhopper: encoding matches the Java encoder except negative halves', () => {
  for (const { name, api } of list) {
    for (const [dims, factor] of [[2, 1e5], [3, 1e5], [2, 1e6]]) {
      const all = randomPoints(300, dims, dims + factor);
      const pts = all.filter((p) => !p.some((v, a) => negativeHalf(v, a < 2 ? factor : 100)));
      const preset = { ...(dims == 3 ? graphhopper3d : graphhopper), factor };
      eq(api.encode(swap(pts), preset), ghEncode(pts, factor), `${name} ${dims}D ${factor}`);
      eq(api.decode(ghEncode(all, factor), preset), swap(all).map((p) => p.map((v, a) => Math.round(v * (a < 2 ? factor : 100)) / (a < 2 ? factor : 100))), name);
    }
    // -0.125 m is -12.5 cm: Math.round gives -12, polytini gives -13.
    const tie = [[52.5, 13.4, -0.125]];
    eq(api.decode(ghEncode(tie), graphhopper3d), [[13.4, 52.5, -0.12]], name);
    eq(api.decode(api.encode(swap(tie), graphhopper3d), graphhopper3d), [[13.4, 52.5, -0.13]], name);
    // -38.515625 is exact in binary, so -3851562.5 is a true half.
    eq(ghEncode([[-38.515625, 0]]), api.encode([[-38.515625 + 0.000005, 0]], google), name);
    ok(api.encode([[-38.515625, 0]], google) != ghEncode([[-38.515625, 0]]), name);
  }
});

test('graphhopper3d: a 2D string is rejected when the value count does not fit', () => {
  for (const { name, api } of list) throws(() => api.decode('_p~iF~ps|U', graphhopper3d), 'truncated', name);
});

test('openrouteservice: matches the ORS encoder', () => {
  for (const { name, api } of list) {
    const pts = randomPoints(300, 2, 3).filter((p) => !p.some((v) => negativeHalf(v, 1e5)));
    eq(api.encode(swap(pts), openrouteservice), orsEncode(pts), name);
    eq(api.decode(orsEncode(pts), openrouteservice), swap(pts).map((p) => p.map((v) => Math.round(v * 1e5) / 1e5)), name);
  }
});

test('openrouteservice3d: elevation matches where floor and round agree', () => {
  const all = randomPoints(300, 3, 5);
  const ll = (v) => Math.round(v * 1e5) / 1e5;
  const same = all.filter(([a, b, z]) => !negativeHalf(a, 1e5) && !negativeHalf(b, 1e5) && Math.floor(z * 100) == Math.round(z * 100));
  ok(same.length > 100 && same.length < all.length);
  for (const { name, api } of list) {
    eq(api.encode(swap(same), openrouteservice3d), orsEncode(same), name);
    // Decoding ORS output is exact: floored centimeters, rounded lat/lng.
    eq(api.decode(orsEncode(all), openrouteservice3d), all.map(([a, b, z]) => [ll(b), ll(a), Math.floor(z * 100) / 100]), name);
    eq(api.toGeoJSON(orsEncode(all.slice(0, 2)), openrouteservice3d).coordinates[1].length, 3, name);
    // 0.556 m: ORS stores 55 cm, polytini 56. 1027.1 m: 1027.1 * 100 is
    // 102709.99999999999 in floating point, so ORS stores 102709 cm.
    const p = [[49.41461, 8.681495, 0.556], [49.41943, 8.686507, 1027.1]];
    eq(api.decode(orsEncode(p), openrouteservice3d), [[8.6815, 49.41461, 0.55], [8.68651, 49.41943, 1027.09]], name);
    eq(api.decode(api.encode(swap(p), openrouteservice3d), openrouteservice3d), [[8.6815, 49.41461, 0.56], [8.68651, 49.41943, 1027.1]], name);
  }
});

test('strava: precision 5, [lat, lng] like its latlng stream', () => {
  // A point near the start_latlng [37.83, -122.26] of Strava's examples.
  for (const { name, api } of list) {
    const s = api.encode([[37.82822, -122.26348]], strava);
    eq(s, api.encode([[37.82822, -122.26348]], google), name);
    eq(api.decode(s, strava), [[37.82822, -122.26348]], name);
  }
});

test('otp: decodes the floored encoder exactly, encoding differs by at most one step', () => {
  const pts = randomPoints(300, 2, 9);
  const floor = (v) => Math.floor(v * 1e5) / 1e5;
  for (const { name, api } of list) {
    eq(api.decode(otpEncode(pts), otp), pts.map((p) => p.map(floor)), name);
    const mine = api.decode(api.encode(pts, otp), otp), theirs = api.decode(otpEncode(pts), otp);
    near(mine, theirs, 1e-5 + 1e-9, name);
    ok(api.encode(pts, otp) != otpEncode(pts), name);
  }
});

test('presets: toGeoJSON with any preset gives [lng, lat]', () => {
  for (const { name, api } of list) {
    const s = api.encode([[38.5, -120.2]], google);
    for (const p of [google, strava, otp, osrm, graphhopper]) eq(api.toGeoJSON(s, p).coordinates, [[-120.2, 38.5]], name);
    const s6 = api.encode([[38.5, -120.2]], { precision: 6 });
    for (const p of [osrm6, valhalla, mapbox6]) eq(api.toGeoJSON(s6, p).coordinates, [[-120.2, 38.5]], name);
  }
});
