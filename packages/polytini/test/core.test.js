// Every entry point against the reference codec, plus strict mode, options
// and input shapes. The same checks run for web, node, bun, deno and wasm.
import { test, eq, near, ok, throws, entries } from './lib.js';
import * as ref from './reference.js';

const all = await entries();
const google = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const pts = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]];

// mulberry32, the same generator the benchmark fixtures use.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const q = (v, p) => Math.round(v * 10 ** p) / 10 ** p;
function cases(p) {
  const u = 10 ** -p, rand = rng(42 + p);
  const raw = [[0, -179.9832104]];
  while (raw.length < 300) raw.push([(rand() * 180 - 90).toFixed(9) * 1, (rand() * 360 - 180).toFixed(9) * 1]);
  const walk = [];
  for (let i = 0, lat = 0, lng = 0; i < 2000; i++) walk.push([q((lat += (rand() - 0.5) * 0.01), p), q((lng += (rand() - 0.5) * 0.01), p)]);
  return {
    empty: [],
    'single point at 0,0': [[0, 0]],
    negatives: [[-33.86882, 151.20929], [-22.90685, -43.1729], [-0.00001, -0.00001], [-54.80191, -68.30295]],
    'extremes (+-90, +-180)': [[90, 180], [-90, -180], [0, 0], [-90, 180], [90, -180]],
    antimeridian: [[10, 179.99999], [10, -179.99999], [10.00001, 179.99999]],
    'repeated points': Array.from({ length: 6 }, () => [52.52, 13.405]),
    'one-unit steps': [[0, 0], [u, u], [0, 0], [-u, -u], [q(-u * 2, p), q(u * 3, p)]],
    'unquantized input': raw,
    'random walk (2000 points, long enough for every fast path)': walk,
  };
}

for (const { name, api } of all) {
  test(`${name}: Google's documented example`, () => {
    eq(api.encode(pts), google);
    eq(api.decode(google), pts);
    eq(api.encode([[0, -179.9832104]]), '?`~oia@');
  });

  for (const p of [0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 13]) {
    test(`${name}: matches the reference at precision ${p}`, () => {
      for (const [label, line] of Object.entries(cases(p))) {
        const s = ref.encode(line, p);
        eq(api.encode(line, p), s, `${label} encode`);
        eq(api.encode(line, { precision: p }), s, `${label} encode (options object)`);
        eq(api.decode(s, p), ref.decode(s, p), `${label} decode`);
        eq(api.decodeFlat(s, p), ref.decode(s, p).flat(), `${label} decodeFlat`);
        eq(api.encodeFlat(line.flat(), p), s, `${label} encodeFlat`);
        eq(api.encodeFlat(new Float64Array(line.flat()), p), s, `${label} encodeFlat Float64Array`);
      }
    });
  }

  test(`${name}: lnglat order`, () => {
    const flipped = pts.map(([a, b]) => [b, a]);
    eq(api.encode(flipped, { order: 'lnglat' }), google);
    eq(api.decode(google, { order: 'lnglat' }), flipped);
    eq(api.decodeFlat(google, { order: 'lnglat' }), flipped.flat());
    eq(api.encodeFlat(flipped.flat(), { order: 'lnglat' }), google);
    const long = cases(5)['random walk (2000 points, long enough for every fast path)'];
    eq(api.decode(ref.encode(long, 5), { order: 'lnglat' }), long.map(([a, b]) => [b, a]));
  });

  test(`${name}: objects, typed points and mixed input`, () => {
    eq(api.encode(pts.map(([lat, lng]) => ({ lat, lng }))), google);
    eq(api.encode(pts.map(([latitude, longitude]) => ({ latitude, longitude }))), google);
    eq(api.encode(pts.map(([lat, lon]) => ({ lat, lon }))), google);
    eq(api.encode([pts[0], { lat: 40.7, lng: -120.95 }, new Float64Array(pts[2])]), google);
    // Objects ignore order: they're named.
    eq(api.encode(pts.map(([lat, lng]) => ({ lat, lng })), { order: 'lnglat' }), google);
    eq(api.decodeLatLng(google), pts.map(([lat, lng]) => ({ lat, lng })));
    // A 0 in an object must not be treated as missing (polyline-encoded's bug).
    eq(api.encode([{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }]), ref.encode([[0, 0], [0, 1]]));
  });

  test(`${name}: GeoJSON`, () => {
    const line = { type: 'LineString', coordinates: pts.map(([a, b]) => [b, a]) };
    eq(api.toGeoJSON(google), line);
    eq(api.fromGeoJSON(line), google);
    eq(api.fromGeoJSON({ type: 'Feature', properties: {}, geometry: line }), google);
    eq(api.toGeoJSON(ref.encode(pts, 6), 6), line);
    eq(api.fromGeoJSON(line, { precision: 6 }), ref.encode(pts, 6));
    // [lng, lat, alt] positions encode as 2D unless dimensions says otherwise.
    eq(api.fromGeoJSON({ type: 'LineString', coordinates: line.coordinates.map((c) => [...c, 100]) }), google);
    throws(() => api.fromGeoJSON({ type: 'Point', coordinates: [1, 2] }), 'input');
    throws(() => api.fromGeoJSON(null), 'input');
  });

  test(`${name}: strict decode errors`, () => {
    let e = throws(() => api.decode(google.slice(0, -1)), 'truncated');
    eq(e.name, 'PolylineError');
    ok(e instanceof api.PolylineError && e instanceof Error);
    // Every truncation of a valid string throws (a cut on a point boundary
    // is a valid shorter line).
    const ends = new Set([0]);
    for (let i = 0, k = 0; i < google.length; i++) if (google.charCodeAt(i) < 95 && ++k % 2 == 0) ends.add(i + 1);
    for (let n = 1; n < google.length; n++) {
      if (ends.has(n)) eq(api.decode(google.slice(0, n)).length, [...ends].filter((x) => x && x <= n).length);
      else throws(() => api.decode(google.slice(0, n)), 'truncated', `length ${n}`);
    }
    e = throws(() => api.decode('_p~iF~ps|U _ulLnnqC'), 'char');
    eq(e.index, 10);
    throws(() => api.decode('_p~iF~ps|Uő'), 'char');
    throws(() => api.decode('_p~iF~ps|U\u007f'), 'char');
    throws(() => api.decode('_p~iF~ps|U>'), 'char');
    // A long string, so the buffer paths see it too.
    throws(() => api.decode(ref.encode(cases(5)['unquantized input'], 5) + 'ő?'), 'char');
    throws(() => api.decode(ref.encode(cases(5)['unquantized input'], 5) + '_'), 'truncated');
    throws(() => api.decode(ref.encode(cases(5)['unquantized input'], 5) + '?'), 'truncated');
    // More than 53 bits.
    throws(() => api.decode('~'.repeat(11) + '??'), 'overflow');
    throws(() => api.decode(42), 'input');
    throws(() => api.decodeFlat(google.slice(0, -1)), 'truncated');
  });

  test(`${name}: lenient decode`, () => {
    const o = { strict: false };
    eq(api.decode(google.slice(0, -1), o), pts.slice(0, 2));
    eq(api.decode(google + '?', o), pts);
    eq(api.decode('_p~iF ~ps|U\n', o), pts.slice(0, 1));
    eq(api.decodeFlat(google.slice(0, -1), o), pts.slice(0, 2).flat());
    eq(api.decode('', o), []);
  });

  test(`${name}: values past 32 bits decode exactly`, () => {
    // 7+ chunk values: precision 10 coordinates and huge deltas.
    for (const p of [7, 9, 10, 13]) {
      const line = [[89.9999999999, 179.9999999999], [-89.9999999999, -179.9999999999], [0, 0]].map(([a, b]) => [q(a, p), q(b, p)]);
      const s = ref.encode(line, p);
      eq(api.decode(s, p), ref.decode(s, p));
      eq(api.encode(line, p), s);
    }
    // Coordinates far out of range still round-trip (some people encode
    // projected or pixel coordinates).
    const big = [[123456.78901, -987654.32109], [0, 0]];
    eq(api.encode(big), ref.encode(big, 5));
    eq(api.decode(ref.encode(big, 5)), ref.decode(ref.encode(big, 5), 5));
  });

  test(`${name}: strict encode errors`, () => {
    for (const bad of [NaN, Infinity, -Infinity, undefined, null, 'abc']) {
      const e = throws(() => api.encode([[1, 2], [bad, 3]]), 'coordinate', String(bad));
      eq(e.index, 1);
    }
    throws(() => api.encode([[1, 2], null]), 'coordinate');
    throws(() => api.encode([[1, 2], {}]), 'coordinate');
    throws(() => api.encode([[1, 2], [3]]), 'coordinate');
    throws(() => api.encode(null), 'input');
    throws(() => api.encode(42), 'input');
    throws(() => api.encodeFlat([1, 2, 3]), 'input');
    throws(() => api.encodeFlat([1, NaN]), 'coordinate');
    throws(() => api.encode([[1e300, 0]]), 'overflow');
    // Long lines take the byte-buffer paths, which have their own bailouts.
    const long = Array.from({ length: 1000 }, (_, i) => [i / 1e3, -i / 1e3]);
    for (const bad of [null, [NaN, 1], ['1', 2]]) {
      const pts = long.slice();
      pts[700] = bad;
      if (typeof bad?.[0] == 'string') eq(api.encode(pts), ref.encode(pts.map((p) => p.map(Number)), 5));
      else eq(throws(() => api.encode(pts), 'coordinate').index, 700);
    }
    // Numeric strings are numbers, like in every other library.
    eq(api.encode([['38.5', '-120.2']]), ref.encode([[38.5, -120.2]], 5));
  });

  test(`${name}: lenient encode`, () => {
    const o = { strict: false };
    eq(api.encode([[1, 2], [NaN, 3]], o), ref.encode([[1, 2], [0, 3]], 5));
    eq(api.encode([[1, 2], null], o), ref.encode([[1, 2], [0, 0]], 5));
    eq(api.encodeFlat([1, 2, 3], o), ref.encode([[1, 2]], 5));
  });

  test(`${name}: options`, () => {
    for (const bad of [-1, 16, 5.5, NaN, '5']) throws(() => api.decode(google, bad), 'option', String(bad));
    throws(() => api.decode(google, { precision: 99 }), 'option');
    throws(() => api.decode(google, { order: 'xy' }), 'option');
    throws(() => api.decode(google, { factor: 0 }), 'option');
    throws(() => api.decode(google, { dimensions: 0 }), 'option');
    throws(() => api.encode(pts, { zFactor: -1 }), 'option');
    eq(api.decode(google, null), pts);
    eq(api.decode(google, {}), pts);
    eq(api.decode(google, { precision: undefined }), pts);
    // factor instead of precision, like @pirxpilot/google-polyline.
    eq(api.encode(pts, { factor: 1e5 }), google);
    eq(api.decode(google, { factor: 1e5 }), pts);
    eq(api.decode(api.encode([[1.5, 2.25]], { factor: 4 }), { factor: 4 }), [[1.5, 2.25]]);
  });

  test(`${name}: dimensions and zFactor`, () => {
    const line = [[38.5, -120.2, 120.5], [40.7, -120.95, 98], [43.252, -126.453, 1500.25]];
    // Every value is a delta of the same value of the previous point.
    const s = ref.encode(line.map(([a, b]) => [a, b]), 5);
    const s3 = api.encode(line, { dimensions: 3, zFactor: 100 });
    eq(api.decode(s3, { dimensions: 3, zFactor: 100 }), line);
    eq(api.decodeFlat(s3, { dimensions: 3, zFactor: 100 }), line.flat());
    eq(api.encodeFlat(line.flat(), { dimensions: 3, zFactor: 100 }), s3);
    eq(api.decode(s3, { dimensions: 3, zFactor: 100, order: 'lnglat' }), line.map(([a, b, c]) => [b, a, c]));
    eq(api.encode(line.map(([lat, lng, alt]) => ({ lat, lng, alt })), { dimensions: 3, zFactor: 100 }), s3);
    eq(api.encode(line.map(([latitude, longitude, altitude]) => ({ latitude, longitude, altitude })), { dimensions: 3, zFactor: 100 }), s3);
    ok(s3 != s);
    eq(api.decode(api.encode([[1], [2], [-3]], { dimensions: 1 }), { dimensions: 1 }), [[1], [2], [-3]]);
    throws(() => api.decode(s3), 'truncated', '3D string read as 2D');
  });

  test(`${name}: -0 and rounding ties`, () => {
    // Half away from zero, like Google's reference implementation.
    eq(api.encode([[0.000005, 0], [-0.000005, 0], [0.000015, 0], [-0.000015, 0]]), ref.encode([[0.000005, 0], [-0.000005, 0], [0.000015, 0], [-0.000015, 0]], 5));
    eq(ref.decode(api.encode([[-0.000005, 0]]), 5)[0][0], -0.00001);
    eq(ref.decode(api.encode([[-0.000015, 0]]), 5)[0][0], -0.00002);
    // The largest double below 0.5 rounds to 0. floor(x + 0.5) gets 1,
    // because the addition rounds up (PostGIS, which uses C round(), agrees).
    eq(api.encode([[0.49999999999999994, -0.49999999999999994]], 0), '??');
    eq(api.encode([[0.0000049999999999999996, -0.0000049999999999999996]], 5), '??');
    eq(api.encode([[0.49999999999999994, 0], [1e7, 0]], { precision: 0, dimensions: 2 }), ref.encode([[0, 0], [1e7, 0]], 0));
    eq(api.encode([[-0, -0]]), '??');
    eq(api.decode('??'), [[0, 0]]);
  });

  test(`${name}: big inputs go through every buffer size`, () => {
    for (const n of [1, 15, 16, 31, 32, 33, 100, 5000, 70000]) {
      const rand = rng(n), line = [];
      for (let i = 0; i < n; i++) line.push([q(rand() * 180 - 90, 5), q(rand() * 360 - 180, 5)]);
      const s = ref.encode(line, 5);
      eq(api.encode(line), s, `encode ${n}`);
      eq(api.decode(s), ref.decode(s, 5), `decode ${n}`);
    }
  });
}

test('every entry has the same exports', () => {
  const names = (api) => Object.keys(api).filter((k) => k != 'init' && k != 'initSync').sort();
  for (const { name, api } of all) eq(names(api), names(all[0].api), name);
});

test('wasm: initSync after init is a no-op, and works on its own', async () => {
  const wasm = all.find((e) => e.name == 'wasm').api;
  wasm.initSync();
  eq(wasm.decode(google), pts);
});
