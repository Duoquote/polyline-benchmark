// The Leaflet plugin against the real Leaflet 1.9 (UMD global, ESM build)
// and the Leaflet 2 beta, in jsdom.
import { test, eq, near, ok, throws } from './lib.js';
import { JSDOM } from 'jsdom';
import { createRequire } from 'node:module';
import { decode, encode } from '../src/web.js';

const dom = new JSDOM('<!doctype html><div id="map" style="width:400px;height:300px"></div>', { pretendToBeVisual: true });
for (const k of ['window', 'document', 'navigator', 'HTMLElement', 'Element', 'Node', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  if (!(k in globalThis) || k == 'window' || k == 'document') {
    try {
      globalThis[k] = k == 'window' ? dom.window : dom.window[k];
    } catch {}
  }
}
// Deno has its own navigator without the fields Leaflet 1.9 reads at load.
if (globalThis.Deno) Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
dom.window.L = undefined;

const require = createRequire(import.meta.url);
const google = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const pts = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]];
const hole = encode([[38.6, -120.5], [38.7, -120.5], [38.7, -120.4]]);
const latlngs = (l) => (Array.isArray(l) ? l.map(latlngs) : [l.lat, l.lng]);

async function leaflets() {
  // 1.9 UMD build: sets window.L. Load it fresh so the auto import sees it.
  const umd = require('leaflet');
  globalThis.L = umd;
  const esm = await import('leaflet/dist/leaflet-src.esm.js');
  const two = await import('leaflet-2');
  return [
    ['1.9 UMD', umd, true],
    ['1.9 ESM', { ...esm }, true],
    ['2.0 beta', two, false],
  ];
}
const all = await leaflets();
const { install } = await import('../src/leaflet.js');

for (const [name, L, factories] of all) {
  install(L);
  test(`Leaflet ${name}: Polyline.fromEncoded and toEncoded`, () => {
    const line = L.Polyline.fromEncoded(google, { color: 'red' });
    ok(line instanceof L.Polyline);
    eq(line.options.color, 'red');
    eq(latlngs(line.getLatLngs()), pts);
    eq(line.toEncoded(), google);
    eq(line.encodePath(), google);
  });
  test(`Leaflet ${name}: precision and strict pass through`, () => {
    const s6 = encode(pts, 6);
    const line = L.Polyline.fromEncoded(s6, { precision: 6 });
    eq(latlngs(line.getLatLngs()), pts);
    eq(line.toEncoded({ precision: 6 }), s6);
    throws(() => L.Polyline.fromEncoded(google.slice(0, -1)), 'truncated');
    eq(latlngs(L.Polyline.fromEncoded(google.slice(0, -1), { strict: false }).getLatLngs()), pts.slice(0, 2));
  });
  test(`Leaflet ${name}: multi-polylines are arrays of strings`, () => {
    const parts = [google, hole];
    const multi = L.Polyline.fromEncoded(parts);
    eq(latlngs(multi.getLatLngs()), parts.map((s) => decode(s)));
    eq(multi.toEncoded(), parts);
  });
  test(`Leaflet ${name}: polygons, holes and multi-polygons`, () => {
    const poly = L.Polygon.fromEncoded(google);
    ok(poly instanceof L.Polygon);
    eq(poly.toEncoded(), [google]);
    const holes = L.Polygon.fromEncoded([google, hole]);
    eq(latlngs(holes.getLatLngs()), [pts, decode(hole)]);
    eq(holes.toEncoded(), [google, hole]);
    const mp = L.Polygon.fromEncoded([[google, hole], [hole]]);
    eq(mp.toEncoded(), [[google, hole], [hole]]);
  });
  test(`Leaflet ${name}: empty and on a map`, () => {
    eq(L.Polyline.fromEncoded('').toEncoded(), '');
    if (!factories) return;
    const map = L.map(document.getElementById('map')).setView([40, -120], 5);
    const line = L.polylineEncoded(google).addTo(map);
    ok(map.hasLayer(line));
    eq(L.polygonEncoded([google]).toEncoded(), [google]);
    eq(L.PolylineUtil.decode(google), pts);
    map.remove();
  });
  if (!factories) {
    test(`Leaflet ${name}: frozen namespace gets no factories`, () => {
      eq(typeof L.polylineEncoded, 'undefined');
      ok(typeof L.Polyline.fromEncoded == 'function');
    });
  }
}

test('Leaflet 1.9: the auto import patches the global L', async () => {
  const fresh = { ...require('leaflet') };
  fresh.Polyline = fresh.Polyline.extend({});
  fresh.Polygon = fresh.Polygon.extend({});
  globalThis.L = fresh;
  await import('../src/leaflet-auto.js?fresh');
  ok(typeof fresh.Polyline.fromEncoded == 'function' && typeof fresh.polylineEncoded == 'function');
  near(latlngs(fresh.polylineEncoded(google).getLatLngs()), pts);
});
