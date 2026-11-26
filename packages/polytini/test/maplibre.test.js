// The MapLibre and Mapbox modules: the source objects against both style
// specs' validators, the helpers against a mock map, and both real map
// libraries in headless Chrome when a Chrome is found.
import { test, eq, ok, throws } from './lib.js';
import process from 'node:process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import * as mapboxSpec from 'mapbox-gl/dist/style-spec/index.es.js';
import * as maplibre from '../src/maplibre.js';
import * as mapbox from '../src/mapbox.js';
import { decode, encode } from '../src/web.js';
import { osrm6, graphhopper3d } from '../src/presets.js';

const { polylineData, polylineSource, addPolylineLayer, setPolylineData } = maplibre;
const google = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const second = encode([[38.6, -120.5], [38.7, -120.5], [38.7, -120.4]]);
const lngLat = (s, o) => decode(s, { ...o, order: 'lnglat' });

const style = (sources, layers) => ({ version: 8, sources, layers });
const lineLayer = (id, extra) => ({ id, type: 'line', source: id, ...extra });

test('maplibre: polylineData builds a FeatureCollection of [lng, lat] lines', () => {
  const fc = polylineData([google, second], { properties: [{ name: 'a' }, { name: 'b' }], id: [1, 2] });
  eq(fc.type, 'FeatureCollection');
  eq(fc.features.length, 2);
  eq(fc.features[0], { type: 'Feature', id: 1, properties: { name: 'a' }, geometry: { type: 'LineString', coordinates: lngLat(google) } });
  eq(fc.features[1].properties, { name: 'b' });
  eq(fc.features[1].id, 2);
  // One string, shared properties, bbox.
  const one = polylineData(google, { properties: { kind: 'route' }, bbox: true });
  eq(one.features.length, 1);
  eq(one.features[0].properties, { kind: 'route' });
  eq(one.features[0].bbox, [-126.453, 38.5, -120.2, 43.252]);
  eq(polylineData([]).features, []);
});

test('maplibre: precision, presets and strict pass through, always [lng, lat]', () => {
  const pts = decode(google);
  const s6 = encode(pts, 6);
  eq(polylineData(s6, 6).features[0].geometry.coordinates, lngLat(google));
  eq(polylineData(s6, { precision: 6 }).features[0].geometry.coordinates, lngLat(google));
  eq(polylineData(s6, osrm6).features[0].geometry.coordinates, lngLat(google));
  // A latlng order in the options does not flip GeoJSON.
  eq(polylineData(google, { order: 'latlng' }).features[0].geometry.coordinates, lngLat(google));
  const s3 = encode([[-120.2, 38.5, 12.34], [-120.95, 40.7, 56.78]], graphhopper3d);
  eq(polylineData(s3, graphhopper3d).features[0].geometry.coordinates, [[-120.2, 38.5, 12.34], [-120.95, 40.7, 56.78]]);
  throws(() => polylineData(google.slice(0, -1)), 'truncated');
  eq(polylineData(google.slice(0, -1), { strict: false }).features[0].geometry.coordinates, lngLat(google).slice(0, 2));
});

test('maplibre: polylineSource is a valid GeoJSON source in both style specs', () => {
  const sources = {
    one: polylineSource(google),
    many: polylineSource([google, second], { properties: [{ n: 1 }, { n: 2 }], id: [10, 20] }),
    opts: polylineSource(google, { source: { lineMetrics: true, tolerance: 0.2, attribution: 'x' } }),
    empty: polylineSource([]),
  };
  eq(sources.one.type, 'geojson');
  eq(sources.opts.lineMetrics, true);
  eq(sources.opts.tolerance, 0.2);
  eq(sources.opts.data.features.length, 1);
  // `source` can not change the type or the data.
  eq(polylineSource(google, { source: { type: 'vector', data: 'x' } }).type, 'geojson');
  ok(typeof polylineSource(google, { source: { data: 'x' } }).data == 'object');
  const layers = Object.keys(sources).map((id) => lineLayer(id, { paint: { 'line-width': 3, 'line-color': '#c00' } }));
  eq(validateStyleMin(style(sources, layers)), [], 'maplibre style spec');
  eq(mapboxSpec.validate(style(sources, layers)), [], 'mapbox style spec');
  // The validators do catch broken sources and layers.
  ok(validateStyleMin(style({ bad: { type: 'geojson' } }, [])).length > 0);
  ok(mapboxSpec.validate(style(sources, [lineLayer('one', { paint: { 'line-width': 'wide' } })])).length > 0);
});

// Records what the helpers do to a map.
function mockMap() {
  const calls = [], sources = {};
  return {
    calls,
    sources,
    addSource(id, spec) {
      calls.push(['addSource', id, spec]);
      sources[id] = { type: spec.type, data: spec.data, setData: (d) => (calls.push(['setData', id, d]), (sources[id].data = d), Promise.resolve()) };
      return this;
    },
    addLayer(layer, beforeId) {
      calls.push(['addLayer', layer, beforeId]);
      return this;
    },
    getSource: (id) => sources[id],
  };
}

test('maplibre: addPolylineLayer adds a source and a line layer', () => {
  const map = mockMap();
  eq(addPolylineLayer(map, 'route', google) === map, true, 'returns the map');
  eq(map.calls, [
    ['addSource', 'route', { type: 'geojson', data: polylineData(google) }],
    ['addLayer', { id: 'route', type: 'line', source: 'route' }, undefined],
  ]);
  const map2 = mockMap();
  addPolylineLayer(map2, 'r', [google, second], {
    precision: 5,
    properties: [{ a: 1 }, { a: 2 }],
    source: { lineMetrics: true },
    layer: { id: 'r-line', paint: { 'line-width': 4 }, layout: { 'line-cap': 'round' } },
    beforeId: 'labels',
  });
  eq(map2.calls[0][2].lineMetrics, true);
  eq(map2.calls[0][2].data.features.map((f) => f.properties), [{ a: 1 }, { a: 2 }]);
  eq(map2.calls[1], ['addLayer', { id: 'r-line', type: 'line', source: 'r', paint: { 'line-width': 4 }, layout: { 'line-cap': 'round' } }, 'labels']);
});

test('maplibre: setPolylineData replaces the data and returns what setData returns', async () => {
  const map = mockMap();
  addPolylineLayer(map, 'route', google);
  const result = setPolylineData(map, 'route', [second, google], { properties: { k: 1 } });
  ok(result instanceof Promise);
  await result;
  eq(map.sources.route.data, polylineData([second, google], { properties: { k: 1 } }));
  eq(map.calls.at(-1)[0], 'setData');
  const err = throws(() => setPolylineData(map, 'missing', google), 'input');
  ok(err.message.includes('missing'));
  map.sources.raster = { type: 'raster' };
  throws(() => setPolylineData(map, 'raster', google), 'input');
});

test('mapbox: the same functions as maplibre', () => {
  for (const k of ['polylineData', 'polylineSource', 'addPolylineLayer', 'setPolylineData']) eq(mapbox[k] === maplibre[k], true, k);
  eq(Object.keys(mapbox).sort(), Object.keys(maplibre).sort());
});

// Real maps in headless Chrome, through playwright-core. Every request goes
// to a fake origin answered from disk; anything else (Mapbox's telemetry and
// session requests) is aborted, so nothing leaves the machine.
const chromePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p));
if (!chromePath) console.log('maplibre.test.js: no Chrome found (set CHROME_PATH), skipping the real maplibre-gl and mapbox-gl maps');
else {
  // Directories the fake origin serves, wherever the packages are installed.
  const dir = (url) => fileURLToPath(new URL('.', url));
  const ORIGIN = 'http://polytini.test';
  const html = (script) => `<!doctype html><div id="map" style="width:400px;height:300px"></div>${script}`;
  const files = {
    '/maplibre/': dir(import.meta.resolve('maplibre-gl')),
    '/mapbox/': dir(import.meta.resolve('mapbox-gl/dist/mapbox-gl.js')),
    '/src/': dir(new URL('../src/web.js', import.meta.url)),
  };

  async function withPage(body, fn) {
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (url.origin != ORIGIN) return route.abort();
        if (url.pathname == '/') return route.fulfill({ contentType: 'text/html', body });
        const prefix = Object.keys(files).find((p) => url.pathname.startsWith(p));
        const file = prefix && files[prefix] + url.pathname.slice(prefix.length);
        if (!file || !existsSync(file)) return route.fulfill({ status: 404, body: '' });
        return route.fulfill({ contentType: file.endsWith('.css') ? 'text/css' : 'text/javascript', body: readFileSync(file) });
      });
      await page.goto(ORIGIN + '/');
      const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
      if (!webgl) return console.log('maplibre.test.js: headless Chrome has no WebGL 2 here, skipping the real map checks');
      const result = await fn(page);
      eq(errors, [], 'page errors');
      return result;
    } finally {
      await browser.close();
    }
  }

  // Runs in the page: adds the lines, waits for rendering, updates them.
  // `lib` is the map library, `mod` our module for it.
  const scenario = async ({ lib, mod, lines, next }) => {
    const map = new lib.Map({
      container: 'map',
      style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#fff' } }] },
      center: [-123, 41],
      zoom: 4,
      testMode: true,
    });
    const idle = () => new Promise((r) => map.once('idle', r));
    await new Promise((r) => map.once('load', r));
    mod.addPolylineLayer(map, 'route', lines, { properties: lines.map((_, i) => ({ i })), layer: { paint: { 'line-width': 6, 'line-color': '#f00' } } });
    mod.addPolylineLayer(map, 'under', lines[0], { layer: { id: 'under-line' }, beforeId: 'route' });
    await idle();
    const rendered = map.queryRenderedFeatures({ layers: ['route'] }).map((f) => f.properties.i);
    const order = map.getStyle().layers.map((l) => l.id);
    const color = map.getPaintProperty('route', 'line-color');
    await mod.setPolylineData(map, 'route', next, { properties: { updated: true } });
    await idle();
    const updated = map.querySourceFeatures('route').map((f) => f.properties.updated);
    let missing = '';
    try {
      mod.setPolylineData(map, 'nope', next);
    } catch (e) {
      missing = e.code;
    }
    return { rendered: [...new Set(rendered)].sort(), order, color, updated: [...new Set(updated)], missing };
  };
  const lines = [google, second], next = [second];
  const expected = { rendered: [0, 1], order: ['bg', 'under-line', 'route'], color: '#f00', updated: [true], missing: 'input' };

  test('maplibre: a real maplibre-gl map renders, orders and updates the lines', async () => {
    await withPage(html(''), async (page) => {
      const got = await page.evaluate(
        async ({ code, lines, next, origin }) => {
          const lib = await import(origin + '/maplibre/maplibre-gl.mjs');
          const mod = await import(origin + '/src/maplibre.js');
          return (0, eval)(code)({ lib, mod, lines, next });
        },
        { code: `(${scenario})`, lines, next, origin: ORIGIN },
      );
      eq(got, expected);
    });
  });

  test('mapbox: a real mapbox-gl map renders, orders and updates the lines', async () => {
    await withPage(html('<script src="/mapbox/mapbox-gl.js"></script>'), async (page) => {
      const got = await page.evaluate(
        async ({ code, lines, next, origin }) => {
          // A placeholder token: Mapbox GL wants one, and its requests are aborted.
          globalThis.mapboxgl.accessToken = 'pk.placeholder';
          const mod = await import(origin + '/src/mapbox.js');
          return (0, eval)(code)({ lib: globalThis.mapboxgl, mod, lines, next });
        },
        { code: `(${scenario})`, lines, next, origin: ORIGIN },
      );
      eq(got, expected);
    });
  });
}
