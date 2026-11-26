// The OpenLayers drop-in against the real ol/format/Polyline: the same
// geometries and strings on the benchmark fixtures, every layout,
// projections, the feature API, rounding and bad input.
import { test, eq, ok } from './lib.js';
import OlPolyline from 'ol/format/Polyline.js';
import LineString from 'ol/geom/LineString.js';
import Point from 'ol/geom/Point.js';
import Feature from 'ol/Feature.js';
import Polyline from '../src/openlayers.js';
import { encode, decode } from '../src/web.js';

const google = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const layouts = ['XY', 'XYZ', 'XYM', 'XYZM'];
const strideOf = { XY: 2, XYZ: 3, XYM: 3, XYZM: 4 };

// mulberry32, so every runtime gets the same cases.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ol's writeGeometry may change its input, so ol always gets a clone.
const olWrite = (format, geom, o) => format.writeGeometry(geom.clone(), o);
const flat = (g) => g.getFlatCoordinates();

// Both formats read the same string: same layout, same flat coordinates
// (NaN equals NaN), and ours writes it back like ol.
function same(text, options = {}, readOptions) {
  const ol = new OlPolyline(options), ours = new Polyline(options);
  const a = ol.readGeometry(text, readOptions), b = ours.readGeometry(text, readOptions);
  eq(b.getLayout(), a.getLayout(), 'layout');
  eq(flat(b), flat(a), `read ${JSON.stringify(text).slice(0, 60)} ${JSON.stringify(options)}`);
  ok(Array.isArray(flat(b)), 'flat coordinates are a plain array');
  eq(ours.writeGeometry(b, readOptions), olWrite(ol, a, readOptions), 'write');
  return b;
}

// The benchmark repo's fixtures, when this runs inside it.
let fixtures = null;
try {
  const mod = await import(new URL('../../../src/fixtures.js', import.meta.url).href);
  fixtures = { 5: mod.benchFixtures(5), 6: mod.benchFixtures(6) };
} catch {
  console.log('openlayers.test.js: polyline-benchmark fixtures not found, skipping the fixture tests (generated lines still run)');
}

if (fixtures) {
  for (const p of [5, 6]) {
    test(`OpenLayers: benchmark fixtures at precision ${p} read and write like ol`, () => {
      const factor = 10 ** p, ol = new OlPolyline({ factor }), ours = new Polyline({ factor });
      for (const f of fixtures[p]) {
        f.encoded.forEach((s, i) => {
          const a = ol.readGeometry(s), b = ours.readGeometry(s);
          eq(flat(b), flat(a), `${f.name} line ${i}`);
          eq(ours.writeGeometry(b), s, `${f.name} line ${i} write`);
          eq(olWrite(ol, a), s, `${f.name} line ${i} ol write`);
          // Built from the fixture's own [lat, lng] points.
          const g = new LineString(f.coords[i].map(([lat, lng]) => [lng, lat]));
          eq(ours.writeGeometry(g), olWrite(ol, g), `${f.name} line ${i} from coords`);
        });
      }
    });
  }
  test('OpenLayers: real-world lines with EPSG:3857', () => {
    const o = { featureProjection: 'EPSG:3857' }, ol = new OlPolyline(), ours = new Polyline();
    for (const s of fixtures[5].find((f) => f.name == 'real-world').encoded) {
      const a = ol.readGeometry(s, o), b = ours.readGeometry(s, o);
      eq(flat(b), flat(a));
      eq(ours.writeGeometry(b, o), olWrite(ol, a, o));
    }
  });
}

test('OpenLayers: the Google example, and the class is an ol Polyline', () => {
  const format = new Polyline();
  ok(format instanceof OlPolyline);
  eq(format.getType(), 'text');
  const g = same(google);
  eq(g.getCoordinates(), [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]);
});

test('OpenLayers: generated lines in every layout and factor', () => {
  const rand = rng(1);
  for (const layout of layouts) {
    const stride = strideOf[layout];
    for (const factor of [1e5, 1e6, 1e7, 10, 3.5, undefined, 0]) {
      for (let n = 0; n < 30; n++) {
        const pts = Array.from({ length: Math.floor(rand() * 40) }, () => [
          rand() * 360 - 180,
          rand() * 170 - 85,
          ...(stride > 2 ? [rand() * 9000 - 500] : []),
          ...(stride > 3 ? [rand() * 1e6] : []),
        ]);
        const g = new LineString(pts, layout);
        const ol = new OlPolyline({ factor, geometryLayout: layout }), ours = new Polyline({ factor, geometryLayout: layout });
        const s = olWrite(ol, g);
        eq(ours.writeGeometry(g), s, `${layout} factor ${factor}`);
        same(s, { factor, geometryLayout: layout });
      }
    }
  }
});

test('OpenLayers: writeGeometry does not change the geometry (ol does)', () => {
  const format = new Polyline(), ol = new OlPolyline();
  const g = format.readGeometry(google), before = flat(g).slice();
  eq(format.writeGeometry(g), google);
  eq(format.writeGeometry(g), google);
  eq(flat(g), before);
  // The ol behavior this works around, so the docs stay true.
  const h = ol.readGeometry(google);
  eq(ol.writeGeometry(h), google);
  ok(ol.writeGeometry(h) != google, 'ol changes the geometry it writes');
  ok(flat(h).join() != before.join());
});

test('OpenLayers: projections, features and write options', () => {
  const o = { featureProjection: 'EPSG:3857' };
  const g = same(google, {}, o);
  ok(Math.abs(flat(g)[0] + 13380602.79) < 0.01, 'EPSG:3857 x');
  const ol = new OlPolyline(), ours = new Polyline();
  const fa = ol.readFeature(google, o), fb = ours.readFeature(google, o);
  ok(fb instanceof Feature);
  eq(flat(fb.getGeometry()), flat(fa.getGeometry()));
  const list = ours.readFeatures(google, o);
  eq(list.length, 1);
  eq(flat(list[0].getGeometry()), flat(fa.getGeometry()));
  eq(ours.writeFeature(fb, o), google);
  eq(ours.writeFeatures([fb], o), google);
  eq(ours.writeFeature(fb, o), ol.writeFeature(fa, o));
  // dataProjection on the call, and the decimals write option.
  eq(ours.writeGeometry(g, { ...o, dataProjection: 'EPSG:4326' }), google);
  const d = new LineString([[-120.123456, 38.987654], [-121, 39]]);
  for (const decimals of [0, 2, 4]) eq(ours.writeGeometry(d, { decimals }), olWrite(ol, d, { decimals }), `decimals ${decimals}`);
  // Other geometries with flat coordinates, like ol.
  const pt = new Point([-120.2, 38.5]);
  eq(ours.writeGeometry(pt), olWrite(ol, pt));
});

test('OpenLayers: rounding is ol\'s, which differs from Google\'s at -0.49999999999999994', () => {
  const x = -0.49999999999999994; // -(0.5 - 2 ** -54)
  const g = new LineString([[0, x], [0, -x]]);
  const ol = new OlPolyline({ factor: 1 }), ours = new Polyline({ factor: 1 });
  const s = ours.writeGeometry(g);
  eq(s, olWrite(ol, g));
  eq(s, '@?A?', 'ol rounds -0.49999999999999994 to -1 and 0.49999999999999994 to 0');
  eq(encode([[x, 0], [-x, 0]], { factor: 1 }), '????', 'polytini (Google) rounds both to 0');
  // The same value reached through the default factor.
  const y = x / 1e5;
  if (y * 1e5 === x) eq(new Polyline().writeGeometry(new LineString([[0, y]])), olWrite(new OlPolyline(), new LineString([[0, y]])));
  // Halves and their neighbours agree with ol everywhere else.
  const rand = rng(2), vals = [];
  for (let i = 0; i < 2000; i++) {
    const h = Math.floor(rand() * 2e6) - 1e6 + 0.5;
    vals.push(h, -h, h + 2 ** -30, h - 2 ** -30, -h + 2 ** -30, -h - 2 ** -30, 0.5, -0.5, 1.5, -1.5, 2.5, -2.5);
  }
  for (let i = 0; i < vals.length; i += 2) {
    const l = new LineString([[vals[i], vals[i + 1]]]);
    eq(ours.writeGeometry(l), olWrite(ol, l), `values ${vals[i]} ${vals[i + 1]}`);
  }
});

test('OpenLayers: bad input gives exactly what ol gives', () => {
  const strings = [
    '',
    '?',
    google.slice(0, -1), // a value cut off
    google.slice(0, 10), // half a point
    google + '!', // a character below '?'
    google.replace('i', 'é'), // a character above '~'
    'a b',
    '~~~~~~~?', // a value of more than 30 bits
    '_cidP_cidP', // big values
    '~~~~~~~~~~~~~~~~~~~~?',
    // Long enough for the counting pass.
    google.repeat(2500),
    google.repeat(2500) + '!',
    google.repeat(2500).slice(0, -1),
    google.repeat(2500).slice(0, -5),
  ];
  const rand = rng(3);
  for (let i = 0; i < 300; i++) {
    let s = '';
    const n = Math.floor(rand() * 30);
    for (let j = 0; j < n; j++) s += String.fromCharCode(rand() < 0.03 ? 32 + Math.floor(rand() * 128) : 63 + Math.floor(rand() * 64));
    strings.push(s);
  }
  for (const s of strings) for (const geometryLayout of layouts) for (const factor of [undefined, 1e6]) same(s, { geometryLayout, factor });
});

test('OpenLayers: odd coordinates give exactly what ol gives', () => {
  const ol = new OlPolyline(), ours = new Polyline();
  const cases = [
    [[NaN, 1], [2, 3]],
    [[1, Infinity], [2, 3]],
    [[-Infinity, 1]],
    [[1e9, 1e9], [1e9 + 1, 0]], // deltas past 32 bits
    [[5368.70911, 0], [-5368.70912, 0]], // around 2^29 units
    [[10737.41823, 0]],
    [],
  ];
  for (const c of cases) {
    const g = new LineString(c);
    eq(ours.writeGeometry(g), olWrite(ol, g), JSON.stringify(c));
  }
  // Strings ol reads with NaN in them write back like ol's.
  const g = ol.readGeometry(google.slice(0, 10) + '_ulL', { featureProjection: 'EPSG:4326' });
  ok(flat(g).some(Number.isNaN));
  eq(ours.writeGeometry(g), olWrite(ol, g));
});

test('OpenLayers: polytini and the drop-in agree on valid input', () => {
  const pts = decode(google);
  const g = new Polyline({ factor: 1e6 }).readGeometry(encode(pts, 6));
  eq(g.getCoordinates(), pts.map(([lat, lng]) => [lng, lat]));
});
