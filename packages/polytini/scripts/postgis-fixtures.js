// Generates test/fixtures/postgis.json: what PostGIS's ST_AsEncodedPolyline
// and ST_LineFromEncodedPolyline return for a set of lines and strings, so
// test/postgis.test.js can check polytini against PostGIS without Docker.
//
//   node scripts/postgis-fixtures.js          regenerate the fixture
//   node scripts/postgis-fixtures.js --check  exit 1 if the fixture would change
//   node scripts/postgis-fixtures.js --keep   leave the container running
//
// Environment:
//   POSTGIS_IMAGE      image to run (default postgis/postgis:18-3.7)
//   POSTGIS_CONTAINER  use this running container (name or id) instead of
//                      starting one, for example a CI service container
//   POSTGIS_USER       database user (default postgres)
//
// It talks to PostgreSQL only through `docker exec ... psql`, so it needs
// Docker and nothing else. Every case is classified against an independent
// implementation of Google's algorithm (exact Number math, round half away
// from zero) and against a model of the PostGIS C code. The script fails if
// PostGIS does something the model does not predict, so every difference in
// the fixture comes with a reason that was checked, not guessed. See
// test/fixtures/POSTGIS.md.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as polytini from '../src/web.js';

const IMAGE = process.env.POSTGIS_IMAGE || 'postgis/postgis:18-3.7';
const USER = process.env.POSTGIS_USER || 'postgres';
const NAME = 'polytini-postgis-fixtures';
const OUT = fileURLToPath(new URL('../test/fixtures/postgis.json', import.meta.url));
const args = process.argv.slice(2);
const CHECK = args.includes('--check'), KEEP = args.includes('--keep');

// ---------------------------------------------------------------- Docker

function docker(argv, input) {
  const r = spawnSync('docker', argv, { input, encoding: 'utf8', maxBuffer: 1 << 30 });
  if (r.error) throw r.error;
  return r;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Returns { id, cleanup } for a container that accepts TCP connections. The
// image's init scripts run a temporary server on the Unix socket only, so
// waiting for TCP skips that phase.
async function container() {
  let id = process.env.POSTGIS_CONTAINER, cleanup = () => {};
  if (!id) {
    id = NAME;
    const found = docker(['inspect', '-f', '{{.State.Running}}|{{.Config.Image}}', NAME]);
    let state = found.status == 0 ? found.stdout.trim().split('|') : null;
    if (state && state[1] != IMAGE) {
      console.log(`Removing ${NAME}, it runs ${state[1]}, not ${IMAGE}`);
      docker(['rm', '-f', NAME]);
      state = null;
    }
    if (!state) {
      console.log(`Starting ${NAME} from ${IMAGE}`);
      const r = docker(['run', '-d', '--name', NAME, '-e', 'POSTGRES_PASSWORD=polytini', IMAGE]);
      if (r.status) throw new Error('docker run failed: ' + r.stderr);
      if (!KEEP) cleanup = () => docker(['rm', '-f', NAME]);
    } else if (state[0] != 'true') {
      console.log(`Starting the existing ${NAME}`);
      docker(['start', NAME]);
      if (!KEEP) cleanup = () => docker(['stop', NAME]);
    } else console.log(`Reusing the running ${NAME}`);
  }
  for (let i = 0; ; i++) {
    if (docker(['exec', id, 'pg_isready', '-q', '-h', '127.0.0.1', '-U', USER]).status == 0) break;
    if (i > 180) throw new Error('PostgreSQL did not start');
    await sleep(1000);
  }
  // The tag the container was created from, which for POSTGIS_CONTAINER may
  // not be POSTGIS_IMAGE.
  const image = docker(['inspect', '-f', '{{.Config.Image}}', id]).stdout.trim() || IMAGE;
  return { id, image, cleanup };
}

// Runs SQL that prints one JSON value and returns it parsed.
function psql(id, sql) {
  const r = docker(['exec', '-i', id, 'psql', '-U', USER, '-d', 'postgres', '-X', '-q', '-At', '-v', 'ON_ERROR_STOP=1', '-f', '-'], sql);
  if (r.status) throw new Error('psql failed: ' + r.stderr);
  return JSON.parse(r.stdout);
}

const PRELUDE = `
SET client_min_messages = warning;
SET client_encoding = 'UTF8';
-- float8 to text then prints the shortest string that reads back as the
-- same double (PostgreSQL 12 and later), like JavaScript's String(number).
SET extra_float_digits = 3;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE FUNCTION pg_temp.pts(g geometry) RETURNS json LANGUAGE sql AS $f$
  SELECT coalesce(json_agg(json_build_array(ST_Y(d.geom)::text, ST_X(d.geom)::text) ORDER BY d.path), '[]')
  FROM ST_DumpPoints(g) d
$f$;
-- One encode case: {wkt} or {points: [[lat, lng], ...] as text}, precision.
CREATE FUNCTION pg_temp.enc(c json) RETURNS json LANGUAGE plpgsql AS $f$
DECLARE g geometry;
BEGIN
  IF c->>'wkt' IS NOT NULL THEN g := ST_GeomFromEWKT(c->>'wkt');
  ELSE g := ST_SetSRID(ST_MakeLine(ARRAY(
    SELECT ST_MakePoint((e->>1)::float8, (e->>0)::float8)
    FROM json_array_elements(c->'points') WITH ORDINALITY t(e, i) ORDER BY i)), 4326);
  END IF;
  BEGIN
    RETURN json_build_object('input', pg_temp.pts(g), 'encoded', ST_AsEncodedPolyline(g, (c->>'precision')::int));
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('input', pg_temp.pts(g), 'error', SQLERRM);
  END;
END $f$;
CREATE FUNCTION pg_temp.dec(c json) RETURNS json LANGUAGE plpgsql AS $f$
DECLARE g geometry;
BEGIN
  g := ST_LineFromEncodedPolyline(c->>'encoded', (c->>'precision')::int);
  RETURN json_build_object('type', GeometryType(g), 'srid', ST_SRID(g), 'points', pg_temp.pts(g));
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END $f$;
`;

const TAG = '$polytini_cases$';
function runCases(id, fn, cases) {
  const body = JSON.stringify(cases);
  if (body.includes(TAG)) throw new Error('dollar quote tag in the input');
  const out = psql(id, `${PRELUDE}SELECT coalesce(json_agg(pg_temp.${fn}(e) ORDER BY i), '[]') FROM json_array_elements(${TAG}${body}${TAG}::json) WITH ORDINALITY t(e, i);\n`);
  if (out.length != cases.length) throw new Error('psql returned the wrong number of rows');
  return out;
}

// ------------------------------------------------- numbers and references

// Doubles as text for PostgreSQL's float8 input, which reads them exactly.
const sqlNum = (x) => (Object.is(x, -0) ? '-0' : Number.isNaN(x) ? 'NaN' : x == Infinity ? 'Infinity' : x == -Infinity ? '-Infinity' : String(x));
// JSON can't hold -0, NaN or Infinity, so the fixture keeps those as strings.
const jsonNum = (x) => (Object.is(x, -0) || !Number.isFinite(x) ? sqlNum(x) : x);
const same = (a, b) => a.length == b.length && a.every((p, i) => p.length == b[i].length && p.every((x, j) => Object.is(x, b[i][j])));
// 10^p as the correctly rounded double, the same as C's pow(10, p) on glibc.
const pow10 = (p) => Number('1e' + p);
// C's round(): half away from zero, exact for every double.
const cround = (v) => {
  const a = Math.abs(v), f = Math.floor(a);
  return Math.sign(v) * (a - f >= 0.5 ? f + 1 : f);
};

/**
 * Google's algorithm with exact Number math up to 2^53. Returns {encoded},
 * {error: 'overflow'} for values past 2^53 (where a strict encoder has to
 * stop), or null where the algorithm has no defined answer (precision
 * outside 0..22, NaN or infinite input).
 */
function googleEncode(points, p) {
  if (!(Number.isInteger(p) && p >= 0 && p <= 22)) return null;
  const f = pow10(p), last = [0, 0];
  let s = '';
  for (const pt of points)
    for (let a = 0; a < 2; a++) {
      if (!Number.isFinite(pt[a])) return null;
      const v = cround(pt[a] * f);
      let z = v - last[a];
      last[a] = v;
      z = z < 0 ? -2 * z - 1 : 2 * z;
      if (z > 2 ** 53) return { error: 'overflow' };
      for (; z >= 32; z = Math.floor(z / 32)) s += String.fromCharCode((z % 32) + 95);
      s += String.fromCharCode(z + 63);
    }
  return { encoded: s };
}

/**
 * Google's decoding with exact Number math. Returns {points} or {error}
 * with the PolylineError code a strict decoder gives: char, truncated or
 * overflow (a value past 2^53, where Number math stops being exact).
 */
function googleDecode(str, p) {
  if (!(Number.isInteger(p) && p >= 0 && p <= 22)) return null;
  const f = pow10(p), values = [];
  let v = 0, scale = 1;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i) - 63;
    if (c < 0 || c > 63) return { error: 'char' };
    v += (c & 31) * scale;
    scale *= 32;
    if (v > 2 ** 53) return { error: 'overflow' };
    if (c < 32) {
      values.push(v % 2 ? -(v + 1) / 2 : v / 2);
      v = 0;
      scale = 1;
    }
  }
  if (scale > 1 || values.length % 2) return { error: 'truncated' };
  const points = [];
  for (let i = 0, lat = 0, lng = 0; i < values.length; i += 2) points.push([(lat += values[i]) / f, (lng += values[i + 1]) / f]);
  return { points };
}

/**
 * Model of liblwgeom's pointarray_to_encoded_polyline (PostGIS 3.7.0) on
 * amd64: deltas are C ints, an out of range double to int conversion gives
 * INT_MIN (what cvttsd2si returns), and `delta *= 2` wraps. Adds a reason
 * to `why` every time it takes a path where Google's algorithm would not.
 */
function postgisEncode(c, why) {
  if (c.wkt && !c.wkt.startsWith('SRID=4326;')) return why.add('srid'), { error: 'Only SRID 4326 is supported.' };
  const type = c.wkt?.replace(/^SRID=\d+;/, '').match(/^[A-Z]+/)[0];
  if (type && type != 'LINESTRING' && type != 'MULTIPOINT') {
    why.add('geometry-type');
    return { error: `lwgeom_to_encoded_polyline: '${type[0] + type.slice(1).toLowerCase()}' geometry type not supported` };
  }
  let p = c.precision;
  if (p < 0) why.add('negative-precision'), (p = 5);
  const scale = pow10(p);
  if (!Number.isFinite(scale)) why.add('precision-overflow');
  const toInt = (d) => {
    if (!Number.isFinite(d)) return why.add('non-finite'), -(2 ** 31);
    if (d < -(2 ** 31) || d > 2 ** 31 - 1) return why.add('int32-conversion'), -(2 ** 31);
    return d;
  };
  const deltas = [];
  c.points.forEach((pt, i) => {
    for (let a = 0; a < 2; a++) {
      const v = cround(pt[a] * scale);
      deltas.push(toInt(i ? v - cround(c.points[i - 1][a] * scale) : v));
    }
  });
  let s = '';
  for (const d of deltas) {
    let z = Math.imul(d, 2);
    if (z != d * 2) why.add('int32-overflow');
    if (z < 0) z = ~z;
    for (; z >= 32; z >>= 5) s += String.fromCharCode((32 | (z & 31)) + 63);
    s += String.fromCharCode(z + 63);
  }
  return { encoded: s };
}

/** Model of liblwgeom's lwgeom_from_encoded_polyline (PostGIS 3.7.0). */
function postgisDecode(str, precision, why) {
  let p = precision;
  if (p < 0) why.add('negative-precision'), (p = 5);
  const scale = pow10(p);
  if (!Number.isFinite(scale)) why.add('precision-overflow');
  const bytes = new TextEncoder().encode(str), err = (m) => ({ error: 'lwgeom_from_encoded_polyline: ' + m });
  let idx = 0;
  const varint = () => {
    let res = 0, shift = 0;
    for (;;) {
      if (idx >= bytes.length) return err('input is truncated');
      const b = bytes[idx++] - 63;
      if (b < 0) return err('input contains an invalid byte');
      if (b > 63) why.add('high-bytes');
      if (shift > 30 || (shift == 30 && (b & 0x1c || b >= 0x20))) return why.add('varint-32bit'), err('coordinate value is too large');
      res = (res | ((b & 31) << shift)) >>> 0;
      if (b < 32) return (res >>> 1) ^ -(res & 1);
      shift += 5;
    }
  };
  const points = [];
  for (let lat = 0, lng = 0; idx < bytes.length; ) {
    const dlat = varint();
    if (typeof dlat != 'number') return dlat;
    if ((lat += dlat) != (lat | 0)) return why.add('int32-range'), err('coordinate value is too large');
    const dlng = varint();
    if (typeof dlng != 'number') return dlng;
    if ((lng += dlng) != (lng | 0)) return why.add('int32-range'), err('coordinate value is too large');
    // ptarray_append_point(pa, &pt, LW_FALSE) skips a point equal to the
    // last one, so consecutive duplicates disappear.
    const pt = [lat / scale, lng / scale], last = points[points.length - 1];
    if (last && last[0] == pt[0] && last[1] == pt[1]) why.add('repeated-points');
    else points.push(pt);
  }
  return { points };
}

// What polytini does, with errors reduced to their code.
const attempt = (fn) => {
  try {
    return { value: fn() };
  } catch (e) {
    if (!(e instanceof polytini.PolylineError)) throw e;
    return { error: e.code };
  }
};

// ------------------------------------------------------------------ cases

// Deterministic random numbers (mulberry32), so the fixture is stable.
let seed = 0x5eed2026;
const rand = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const uniform = (lo, hi) => lo + (hi - lo) * rand();
// The double n steps towards +Infinity (n > 0) or -Infinity (n < 0), for x != 0.
const step = (x, n) => {
  const b = new Float64Array([x]), u = new BigInt64Array(b.buffer);
  u[0] += x > 0 ? BigInt(n) : -BigInt(n);
  return b[0];
};
const nextUp = (x) => step(x, 1);
const nextDown = (x) => step(x, -1);

const MAIN = [0, 1, 5, 6, 7, 10];
const ALL = Array.from({ length: 16 }, (_, i) => i);
// Largest |coordinate| whose scaled values and deltas stay in a C int.
const fits = (p, max) => Math.min(max, (0.99 * 2 ** 29) / pow10(p));

const encodeCases = [];
const E = (category, name, precision, points, extra) => encodeCases.push({ category, name, precision, points, ...extra });
const wkt = (type, points, z = '') =>
  `SRID=4326;${type}${z ? ' ' + z : ''}(${points.map(([lat, lng], i) => `${sqlNum(lng)} ${sqlNum(lat)}${z ? ' ' + (i + 1.5) : ''}${z == 'ZM' ? ' ' + i : ''}`).join(',')})`;

const BERLIN_PARIS = [
  [52.520008, 13.404954],
  [48.856614, 2.352222],
];

for (const p of MAIN) {
  E('empty', `empty line p${p}`, p, [], { wkt: 'SRID=4326;LINESTRING EMPTY' });
  E('one-point', `one point p${p}`, p, [[38.5, -120.2]]);
  E('one-point', `one point at the origin p${p}`, p, [[0, 0]]);
  E('zero', `zeros p${p}`, p, [[0, 0], [0, 0], [0, 0]]);
  E('zero', `out and back to zero p${p}`, p, [[0, 0], [1, 1], [0, 0], [-1, -1], [0, 0]]);
  E('zero', `negative zero p${p}`, p, [[-0, -0], [0, -0], [-0, 0]]);
  E('negative', `negatives p${p}`, p, [[-1, -2], [-3.5, -4.25], [-33.868820, -70.6483], [-0.00001, -0.00002], [-0.4, -0.6]]);
  E('negative', `sign changes p${p}`, p, [[-12.5, 33.25], [12.5, -33.25], [-0.75, 0.75], [0.75, -0.75]]);
  E('antimeridian', `antimeridian crossing p${p}`, p, [[10, 179.99999], [10, -179.99999], [10.5, 179.5]]);
  E('antimeridian', `180 to -180 p${p}`, p, [[0, 180], [0, -180], [0, 180]]);
  E('antimeridian', `pacific line p${p}`, p, [[-16.5, 179.25], [-16.6, -179.6], [-16.7, 179.7], [-17.1, -178.9]]);
  E('repeated', `repeated point p${p}`, p, [[1, 2], [1, 2], [1, 2], [1, 2], [1, 2]]);
  E('repeated', `repeated pairs p${p}`, p, [[38.5, -120.2], [38.5, -120.2], [40.7, -120.95], [40.7, -120.95]]);
}
E('empty', 'empty multipoint p5', 5, [], { wkt: 'SRID=4326;MULTIPOINT EMPTY' });
E('one-point', 'one point at the south west corner p5', 5, [[-90, -180]]);

// The corners of the coordinate range, at every precision. From precision 7
// on these leave the C int range that PostGIS works in.
for (const p of ALL) {
  E('bounds', `poles and antimeridian p${p}`, p, [[90, 180], [-90, -180], [90, -180], [-90, 180], [0, 0]]);
  E('bounds', `north pole only p${p}`, p, [[90, 0], [-90, 0]]);
}

// Steps of one unit (10^-precision), from zero and from a base point.
for (const p of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15]) {
  const u = 1 / pow10(p), lat = fits(p, 38.5) * 0.9, lng = -fits(p, 120.2) * 0.9;
  E('unit-steps', `unit steps from zero p${p}`, p, [[0, 0], [u, 0], [u, u], [0, u], [0, 0], [-u, -u], [-2 * u, -u]]);
  E('unit-steps', `unit steps from a base point p${p}`, p, [[lat, lng], [lat + u, lng], [lat + u, lng + u], [lat, lng + u], [lat - u, lng - u], [lat - u, lng - 2 * u]]);
}
// Close points with scaled values past 2^24: PostGIS before 3.7 summed them
// in a float and merged them (PostGIS ticket #5357).
E('unit-steps', 'close points past 2^24 p6', 6, [[55.336448, 38.903876], [55.336448, 38.903875], [55.336449, 38.903875], [89.999999, 179.999999], [89.999998, 179.999998]]);
E('unit-steps', 'close points past 2^24 p7', 7, [[55.3364481, 38.9038761], [55.3364481, 38.9038762], [55.3364480, 38.9038762], [89.9999999, 100.0000001], [89.9999998, 100.0000002]]);

// Rounding ties: k + 0.5 units, written as decimals, so most of them are not
// exact in binary, and the doubles next to them.
for (const p of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
  const ks = [0, 1, 2, 3, 7, 12, 99, 12345, 4567890].filter((k) => (k + 1) / pow10(p) < fits(p, 90));
  const ties = ks.map((k) => (k + 0.5) / pow10(p));
  E('ties', `ties p${p}`, p, ties.map((v) => [v, -v]));
  E('ties', `negative ties p${p}`, p, ties.map((v) => [-v, v]));
  E('ties', `just above and below ties p${p}`, p, ties.slice(1).flatMap((v) => [[nextUp(v), nextDown(-v)], [nextDown(v), nextUp(-v)]]));
  // Half a unit and its neighbours on their own: the double below it scales
  // to the largest double below 0.5 at some precisions (see below).
  const h = ties[0];
  E('ties', `just above half a unit p${p}`, p, [[nextUp(h), nextDown(-h)]]);
  E('ties', `just below half a unit p${p}`, p, [[nextDown(h), nextUp(-h)]]);
}
E('ties', 'decimal ties p5', 5, [[0.000005, -0.000015], [0.000025, -0.000025], [0.000035, -0.000045], [1.000005, -1.000005], [38.123455, -120.987655]]);
E('ties', 'exact binary ties p0', 0, [[0.5, -0.5], [1.5, -1.5], [2.5, -2.5], [-3.5, 3.5], [89.5, -179.5]]);
E('ties', 'exact binary ties p1', 1, [[0.25, -0.25], [0.75, -0.75], [-1.25, 1.25], [12.25, -12.75]]);
E('ties', 'exact binary ties p2', 2, [[0.125, -0.125], [0.375, -0.625], [0.875, -0.875]]);
// The largest double below a half, after scaling. floor(x + 0.5) rounds it
// up to 1, because x + 0.5 rounds to 1.0; C's round() returns 0.
E('ties', 'largest double below a half p0', 0, [[0.49999999999999994, 0]]);
E('ties', 'largest negative double above minus a half p0', 0, [[0, -0.49999999999999994]]);
E('ties', 'scaled to the largest double below a half p1', 1, [[0.049999999999999996, 1]]);
E('ties', 'scaled to the largest double below a half p5', 5, [[0.0000049999999999999996, -0.0000049999999999999996]]);

// Raw GPS readings with 9 decimals, and the same at a scale that fits p9.
const GPS9 = [
  [52.520008123, 13.404954456],
  [48.856613987, 2.352221654],
  [-33.868820111, 151.209295987],
  [40.712775826, -74.005972947],
  [35.689487215, 139.691706333],
  [-22.906846712, -43.172896485],
  [64.146582139, -21.942635871],
];
for (const p of [5, 6, 7, 8, 9]) E('gps9', `9 decimal readings p${p}`, p, GPS9);
for (const p of [6, 7, 8, 9]) E('gps9', `9 decimal readings near the origin p${p}`, p, GPS9.map(([a, b]) => [a / 100, b / 300]));
E('gps9', '9 decimal track p6', 6, Array.from({ length: 40 }, (_, i) => [47.376887123 + i * 0.000013457, 8.541694432 - i * 0.000021113]));

// Long random walks.
const walk = (n, lat, lng, size) => {
  const out = [];
  for (let i = 0; i < n; i++) out.push([(lat += uniform(-size, size)), (lng += uniform(-size, size))]);
  return out;
};
E('long', 'long walk p5', 5, walk(3000, 47.3769, 8.5417, 0.0005));
E('long', 'long walk p6', 6, walk(1500, -33.8688, 151.2093, 0.0002));
E('long', 'long walk p7', 7, walk(1500, 40.7128, -74.006, 0.00005));

// Random lines with raw doubles, in the range where PostGIS's C ints hold
// every value and delta, at every precision polytini supports.
for (const p of ALL) {
  const la = fits(p, 90), lo = fits(p, 180);
  for (const n of [2, 5, 17, 40]) E('random', `random ${n} points p${p}`, p, Array.from({ length: n }, () => [uniform(-la, la), uniform(-lo, lo)]));
  // Steps of mixed sizes, so values take 1 to 7 characters.
  let lat = 0, lng = 0;
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const s = 10 ** uniform(-p, Math.log10(la / 8));
    pts.push([(lat = Math.max(-la, Math.min(la, lat + s * (rand() < 0.5 ? -1 : 1)))), (lng = Math.max(-lo, Math.min(lo, lng + s * uniform(-2, 2))))]);
  }
  E('random', `random steps p${p}`, p, pts);
}
// And over the whole coordinate range at precisions where that overflows.
for (const p of [7, 8, 10]) for (const n of [3, 12]) E('random', `random full range ${n} points p${p}`, p, Array.from({ length: n }, () => [uniform(-90, 90), uniform(-180, 180)]));

// Precisions outside 0..15 (polytini rejects them, PostGIS takes any int).
for (const p of [-1, -5, 16, 18, 20, 22, 400]) {
  E('precision', `precision ${p}`, p, BERLIN_PARIS);
  E('precision', `tiny values precision ${p}`, p, [[1e-15, -2e-15], [3e-15, 4.5e-15]]);
}
// Other inputs PostGIS has opinions about.
E('non-finite', 'NaN latitude p5', 5, [[NaN, 0], [1, 1]]);
E('non-finite', 'infinite longitude p5', 5, [[0, Infinity], [1, 1]]);
E('non-finite', 'negative infinity p5', 5, [[1, 1], [-Infinity, 2]]);
for (const p of [5, 6]) E('geometry', `multipoint p${p}`, p, BERLIN_PARIS, { wkt: wkt('MULTIPOINT', BERLIN_PARIS) });
E('geometry', 'linestring Z p5', 5, BERLIN_PARIS, { wkt: wkt('LINESTRING', BERLIN_PARIS, 'Z') });
E('geometry', 'linestring M p5', 5, BERLIN_PARIS, { wkt: wkt('LINESTRING', BERLIN_PARIS, 'M') });
E('geometry', 'linestring ZM p5', 5, BERLIN_PARIS, { wkt: wkt('LINESTRING', BERLIN_PARIS, 'ZM') });
E('geometry', 'point p5', 5, [BERLIN_PARIS[0]], { wkt: wkt('POINT', [BERLIN_PARIS[0]]) });
E('geometry', 'no SRID p5', 5, BERLIN_PARIS, { wkt: wkt('LINESTRING', BERLIN_PARIS).replace('SRID=4326;', '') });
E('geometry', 'SRID 3857 p5', 5, BERLIN_PARIS, { wkt: wkt('LINESTRING', BERLIN_PARIS).replace('4326', '3857') });

// Hand written strings for decoding.
const chunks = (z) => {
  let s = '';
  for (; z >= 32; z = Math.floor(z / 32)) s += String.fromCharCode((z % 32) + 95);
  return s + String.fromCharCode(z + 63);
};
const decodeCases = [];
const D = (category, name, precision, encoded) => decodeCases.push({ category, name, precision, encoded });
// The example from Google's algorithm description.
for (const p of [5, 6, 7, 0]) D('google-example', `Google's example p${p}`, p, '_p~iF~ps|U_ulLnnqC_mqNvxq`@');
D('empty', 'empty string', 5, '');
D('one-point', 'one point string', 5, '??');
D('repeated', 'two equal points', 5, '????');
D('repeated', 'a step then a zero step', 5, '??AA??');
D('repeated', 'back to an earlier point', 5, '??AA@@');
D('malformed', 'lone continuation character', 5, '_');
D('malformed', 'ends inside the second value', 5, '_p~iF~ps|');
D('malformed', 'latitude without longitude', 5, 'A');
D('malformed', 'odd number of values', 5, '??A');
D('malformed', 'ends inside the third point', 5, '_p~iF~ps|U_ulLnnqC_mqNvxq');
D('malformed', 'trailing continuation character', 5, '_p~iF~ps|U_');
D('malformed', 'space', 5, ' ');
D('malformed', 'character below ? at the end', 5, '??>');
D('malformed', 'exclamation mark inside', 5, '??!?');
D('malformed', 'tab inside', 5, '?\t?');
D('malformed', 'newline at the end', 5, '_p~iF~ps|U\n');
D('high-bytes', 'DEL character as a continuation', 5, '\x7f??');
D('high-bytes', 'DEL at the end', 5, '??\x7f');
D('high-bytes', 'Latin e acute', 5, '?é?');
D('high-bytes', 'o with double acute', 5, 'ő??');
D('high-bytes', 'euro sign', 6, '?€?');
D('varint', 'six zero continuation chunks', 5, '______??');
D('varint', 'seven zero continuation chunks', 5, '_______??');
D('varint', 'zigzag 2^32 - 1 (latitude -2^31)', 5, chunks(2 ** 32 - 1) + '?');
D('varint', 'zigzag 2^32 - 2 (latitude 2^31 - 1)', 7, chunks(2 ** 32 - 2) + '?');
D('varint', 'zigzag 2^32', 5, chunks(2 ** 32) + '?');
D('varint', 'zigzag 2^40', 5, '?' + chunks(2 ** 40));
D('varint', 'zigzag 2^53', 5, chunks(2 ** 53) + '?');
D('varint', 'zigzag 2^60', 5, chunks(2 ** 60) + '?');
D('range', 'latitude sum reaches 2^31', 5, chunks(2 ** 32 - 2) + '?' + chunks(2) + '?');
D('range', 'longitude sum reaches -2^31 - 1', 5, '?' + chunks(2 ** 32 - 1) + '?' + chunks(1));
D('range', 'longitude 180 at p7 in one step', 7, '?' + chunks(3600000000));
D('range', 'latitude 90 at p10', 10, chunks(2 * 9e11) + '?');
D('range', 'latitude 2^31 - 1 then back', 5, chunks(2 ** 32 - 2) + '?' + chunks(2 ** 32 - 1) + '?');
for (const p of [-1, -5, 16, 20, 22, 400]) D('precision', `Google's example precision ${p}`, p, '_p~iF~ps|U_ulLnnqC_mqNvxq`@');
D('precision', 'minus one at precision 400', 400, '@@');

// ------------------------------------------------------------------- main

const TOP_REASONS = {
  'int32-overflow': 'ST_AsEncodedPolyline keeps each delta in a C int and computes delta * 2 in that int. A delta of 2^30 units or more wraps around, for example any step over 107.374 degrees at precision 7. Google\'s algorithm has no such limit.',
  'int32-conversion': 'ST_AsEncodedPolyline converts each rounded value or delta to a C int. Outside the int range that conversion is undefined behavior; this amd64 build produces INT_MIN, which then doubles to 0 and encodes as "?".',
  'non-finite': 'ST_AsEncodedPolyline encodes NaN and infinite coordinates (they convert to INT_MIN, see int32-conversion) instead of rejecting them. polytini throws a PolylineError with code "coordinate".',
  'negative-precision': 'Both functions silently replace a negative precision with 5. polytini throws a PolylineError with code "option".',
  'precision-overflow': 'At a precision where 10^precision is infinite (309 and up), ST_AsEncodedPolyline multiplies to infinity or NaN and ST_LineFromEncodedPolyline divides to zero. polytini allows precision 0 to 15.',
  srid: 'ST_AsEncodedPolyline only accepts geometries with SRID 4326 and raises an error for any other SRID, including none.',
  'geometry-type': 'ST_AsEncodedPolyline only accepts LINESTRING and MULTIPOINT, so a single POINT is an error, while Google\'s algorithm encodes a one point sequence.',
  'high-bytes': 'ST_LineFromEncodedPolyline reads the UTF-8 bytes of the text and only rejects bytes below "?" (63). DEL (127) and every byte of a non-ASCII character count as continuation chunks, so such strings decode to coordinates. Google\'s alphabet is "?" to "~" and polytini rejects anything else (code "char").',
  'repeated-points': 'ST_LineFromEncodedPolyline drops a point that is equal to the point before it (it appends with ptarray_append_point(..., LW_FALSE)), so "????" decodes to one point, not two. Google\'s algorithm returns every point, and so does polytini.',
  'varint-32bit': 'ST_LineFromEncodedPolyline reads each value into 32 bits and raises "coordinate value is too large" for anything wider, including more than 6 zero padding chunks. Google\'s algorithm has no such limit; polytini decodes values exactly up to 2^53.',
  'int32-range': 'ST_LineFromEncodedPolyline keeps the running sums in 32 bit ints and raises "coordinate value is too large" when one leaves that range, for example latitude 90 at precision 10. polytini has no such limit.',
};

const problems = [], polytiniBugs = [];

function classifyEncode(c, row) {
  const pts = c.points.map((p) => p.map(Number));
  const input = row.input.map((p) => p.map(Number));
  // A Z/M WKT case has the same 2D points; any other mismatch means the
  // geometry PostGIS built is not the input.
  if (!same(input, pts) && !(c.wkt && same(input.map((p) => p.slice(0, 2)), pts))) problems.push(`${c.name}: PostGIS built ${JSON.stringify(row.input)}`);
  const postgis = row.error != null ? { error: row.error } : { encoded: row.encoded };
  const why = new Set(), model = postgisEncode({ ...c, points: pts }, why), google = googleEncode(pts, c.precision);
  if (JSON.stringify(model) != JSON.stringify(postgis)) problems.push(`${c.name}: the model says ${JSON.stringify(model)}, PostGIS says ${JSON.stringify(postgis)}`);
  const differs = postgis.encoded == null || postgis.encoded !== google?.encoded;
  if (differs != why.size > 0) problems.push(`${c.name}: differs from Google: ${differs}, reasons predicted: ${[...why]}`);
  // What polytini should return: PostGIS's string unless PostGIS differs
  // from Google, or polytini rejects the precision or the input by design.
  const range = c.precision >= 0 && c.precision <= 15;
  const expected = !range ? { error: 'option' } : why.has('non-finite') ? { error: 'coordinate' } : differs ? google : null;
  const out = {
    category: c.category,
    name: c.name,
    precision: c.precision,
    ...(c.wkt ? { wkt: c.wkt } : {}),
    points: c.points.map((p) => p.map(jsonNum)),
    postgis,
  };
  if (differs) Object.assign(out, { postgisDiffers: [...why].sort(), google });
  if (expected) out.polytini = expected;
  const want = expected ?? postgis, got = attempt(() => polytini.encode(pts, c.precision));
  const okay = want.error ? got.error === want.error : got.value === want.encoded;
  if (!okay) {
    out.polytiniBug = got.error ? { error: got.error } : { encoded: got.value };
    polytiniBugs.push(`encode ${JSON.stringify(c.points)} at precision ${c.precision}: expected ${JSON.stringify(want)}, polytini ${JSON.stringify(out.polytiniBug)}`);
  }
  return out;
}

function classifyDecode(c, row) {
  const postgis = row.error != null ? { error: row.error } : { points: row.points.map((p) => p.map(Number)) };
  if (row.error == null && (row.type != 'LINESTRING' || row.srid != 4326)) problems.push(`${c.name}: decoded to ${row.type} SRID ${row.srid}`);
  const why = new Set(), model = postgisDecode(c.encoded, c.precision, why), google = googleDecode(c.encoded, c.precision);
  const sameResult = (a, b) => (a.error != null && b.error != null ? true : a.points && b.points && same(a.points, b.points));
  if (model.error != null ? model.error !== postgis.error : !(postgis.points && same(model.points, postgis.points)))
    problems.push(`${c.name}: the model says ${JSON.stringify(model)}, PostGIS says ${JSON.stringify(postgis)}`);
  const differs = !google || !sameResult(postgis, google);
  // Reasons only count when they changed the outcome: a high byte in a string
  // that is rejected for another reason anyway is not a difference.
  if (!differs) why.clear();
  if (differs && !why.size) problems.push(`${c.name}: differs from Google with no predicted reason`);
  const range = c.precision >= 0 && c.precision <= 15;
  const expected = !range ? { error: 'option' } : differs || postgis.error != null ? google : null;
  const out = { category: c.category, name: c.name, ...(c.source ? { source: c.source } : {}), precision: c.precision, encoded: c.encoded };
  out.postgis = postgis.error != null ? postgis : { points: postgis.points.map((p) => p.map(jsonNum)) };
  if (differs) Object.assign(out, { postgisDiffers: [...why].sort(), google: google && (google.points ? { points: google.points.map((p) => p.map(jsonNum)) } : google) });
  if (expected) out.polytini = expected.points ? { points: expected.points.map((p) => p.map(jsonNum)) } : expected;
  const want = expected ?? postgis, got = attempt(() => polytini.decode(c.encoded, c.precision));
  const okay = want.error ? got.error === want.error : got.value && same(got.value, want.points);
  if (!okay) {
    out.polytiniBug = got.error ? { error: got.error } : { points: got.value.map((p) => p.map(jsonNum)) };
    polytiniBugs.push(`decode ${JSON.stringify(c.encoded)} at precision ${c.precision}: expected ${JSON.stringify(want)}, polytini ${JSON.stringify(out.polytiniBug)}`);
  }
  return out;
}

const { id, image, cleanup } = await container();
let fixture;
try {
  const versions = psql(
    id,
    `SET client_min_messages = warning; CREATE EXTENSION IF NOT EXISTS postgis;
     SELECT json_build_object('postgis_full_version', postgis_full_version(), 'postgis', postgis_lib_version(),
       'geos', postgis_geos_version(), 'postgresql', current_setting('server_version'));\n`,
  );
  const arch = docker(['exec', id, 'uname', '-m']).stdout.trim();
  console.log(versions.postgis_full_version);

  const encRows = runCases(id, 'enc', encodeCases.map((c) => ({ ...c, points: c.points.map((p) => p.map(sqlNum)) })));
  const encode = encodeCases.map((c, i) => classifyEncode(c, encRows[i]));

  // Decode PostGIS's strings, polytini's strings where they differ, and the
  // hand written ones. One case per (string, precision).
  const seen = new Set(), all = [];
  const add = (c) => {
    const key = c.precision + '|' + c.encoded;
    if (!seen.has(key)) seen.add(key), all.push(c);
  };
  for (const c of encode) {
    if (c.postgis.encoded != null) add({ category: c.category, name: c.name, source: 'postgis', precision: c.precision, encoded: c.postgis.encoded });
    const own = attempt(() => polytini.encode(c.points.map((p) => p.map(Number)), c.precision));
    if (own.value != null) add({ category: c.category, name: c.name + ' (polytini string)', source: 'polytini', precision: c.precision, encoded: own.value });
  }
  for (const c of decodeCases) add(c);
  const decRows = runCases(id, 'dec', all);
  const decode = all.map((c, i) => classifyDecode(c, decRows[i]));

  if (problems.length) throw new Error('PostGIS did something the model does not explain:\n  ' + problems.join('\n  '));
  const used = new Set([...encode, ...decode].flatMap((c) => c.postgisDiffers ?? []));
  fixture = {
    about: 'Generated by scripts/postgis-fixtures.js; see test/fixtures/POSTGIS.md. Points are [lat, lng]. -0, NaN and Infinity are strings.',
    image,
    architecture: arch,
    versions,
    reasons: Object.fromEntries(Object.entries(TOP_REASONS).filter(([k]) => used.has(k))),
    encode,
    decode,
  };
} finally {
  cleanup();
}

// One case per line keeps the file diffable.
const list = (cases) => '[\n' + cases.map((c) => '    ' + JSON.stringify(c)).join(',\n') + '\n  ]';
const { encode, decode, ...meta } = fixture;
const head = JSON.stringify(meta, null, 2).slice(0, -2);
// DEL and non-ASCII characters as \u escapes, so the file is plain ASCII.
const text = `${head},\n  "encode": ${list(encode)},\n  "decode": ${list(decode)}\n}\n`.replace(/[\u007f-￿]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
if (JSON.stringify(JSON.parse(text)) != JSON.stringify(fixture)) throw new Error('fixture text does not read back');

const count = (cases) => {
  const m = {};
  for (const c of cases) {
    const k = c.category;
    m[k] ??= { cases: 0, postgisDiffers: 0 };
    m[k].cases++;
    if (c.postgisDiffers) m[k].postgisDiffers++;
  }
  return m;
};
console.log('encode cases:', encode.length, JSON.stringify(count(encode)));
console.log('decode cases:', decode.length, JSON.stringify(count(decode)));
if (polytiniBugs.length) console.log(`polytini differs from the expected result in ${polytiniBugs.length} cases:\n  ` + polytiniBugs.join('\n  '));

if (CHECK) {
  const old = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  if (old != text) {
    console.error('test/fixtures/postgis.json is out of date: run node scripts/postgis-fixtures.js');
    process.exit(1);
  }
  console.log('test/fixtures/postgis.json is up to date');
} else {
  writeFileSync(OUT, text);
  console.log('wrote test/fixtures/postgis.json');
}
