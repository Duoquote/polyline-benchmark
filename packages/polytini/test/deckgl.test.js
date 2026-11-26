// The deck.gl module: the binary format itself, deck.gl's own tesselators
// in this runtime (they read startIndices and the getPath/getPolygon
// buffers the same way the layers do, and need no GPU), real layer
// instances, and a real Deck in headless Chrome when a Chrome is found.
import { test, eq, ok, throws, near } from './lib.js';
import process from 'node:process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PathLayer, SolidPolygonLayer, PolygonLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { binaryPaths, binaryPolygons } from '../src/deckgl.js';
import { decode, encode } from '../src/web.js';
import { osrm6, google as googlePreset, graphhopper3d } from '../src/presets.js';

const google = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const second = encode([[36, -116], [36.5, -116], [36.5, -115.5], [36, -116]]);
const lngLat = (s, o) => decode(s, { ...(typeof o == 'number' ? { precision: o } : o), order: 'lnglat' });
const flat = (lines) => lines.flat(2);

// deck.gl's internal tesselators, which are not in the package exports.
const layersDist = import.meta.resolve('@deck.gl/layers');
const { default: PathTesselator } = await import(new URL('./path-layer/path-tesselator.js', layersDist).href);
const { default: PolygonTesselator } = await import(new URL('./solid-polygon-layer/polygon-tesselator.js', layersDist).href);

// The benchmark repo's real-world lines, when this runs inside it.
let realWorld = null;
try {
  const mod = await import(new URL('../../../src/fixtures.js', import.meta.url).href);
  realWorld = mod.realWorldLines();
} catch {
  console.log('deckgl.test.js: polyline-benchmark fixtures not found, skipping the real-world line test');
}

test('deckgl: binaryPaths has deck.gl\'s binary shape, [lng, lat] per vertex', () => {
  const lines = [google, '', second];
  const data = binaryPaths(lines);
  eq(Object.keys(data), ['length', 'startIndices', 'attributes']);
  eq(data.length, 3);
  ok(data.startIndices instanceof Uint32Array);
  eq(data.startIndices, [0, 3, 3, 7]);
  eq(Object.keys(data.attributes), ['getPath']);
  eq(data.attributes.getPath.size, 2);
  ok(data.attributes.getPath.value instanceof Float64Array);
  eq(data.attributes.getPath.value, flat(lines.map((s) => lngLat(s))));
  // One string is one path.
  eq(binaryPaths(google).startIndices, [0, 3]);
  eq(binaryPaths([]), { length: 0, startIndices: new Uint32Array([0]), attributes: { getPath: { value: new Float64Array(0), size: 2 } } });
});

test('deckgl: float32, precision, presets and the third value', () => {
  const f32 = binaryPaths([google, second], { float32: true }).attributes.getPath.value;
  ok(f32 instanceof Float32Array);
  eq(f32, flat([google, second].map((s) => lngLat(s))).map(Math.fround));
  const s6 = encode(decode(google), 6);
  eq(binaryPaths(s6, 6).attributes.getPath.value, lngLat(google).flat());
  eq(binaryPaths(s6, osrm6).attributes.getPath.value, lngLat(google).flat());
  // A latlng preset still gives deck.gl [lng, lat].
  eq(binaryPaths(google, googlePreset).attributes.getPath.value, lngLat(google).flat());
  const pts3 = [[-120.2, 38.5, 12.34], [-120.95, 40.7, 56.78], [-126.453, 43.252, -3]];
  const s3 = encode(pts3, graphhopper3d);
  const d3 = binaryPaths([s3, s3], graphhopper3d);
  eq(d3.attributes.getPath.size, 3);
  eq(d3.startIndices, [0, 3, 6]);
  eq(d3.attributes.getPath.value, [...pts3.flat(), ...pts3.flat()]);
});

test('deckgl: timestamps for TripsLayer', () => {
  const trip = [[-120.2, 38.5, 0], [-120.95, 40.7, 60], [-126.453, 43.252, 125]];
  const o = { dimensions: 3, zFactor: 1, order: 'lnglat' };
  const s = encode(trip, o);
  const d = binaryPaths([s, s], { ...o, timestamps: true });
  eq(d.attributes.getPath, { value: new Float64Array(flat([trip, trip].map((t) => t.map((p) => p.slice(0, 2))))), size: 2 });
  // Always 32-bit: see src/deckgl.js.
  eq(d.attributes.getTimestamps, { value: new Float32Array([0, 60, 125, 0, 60, 125]), size: 1 });
  ok(d.attributes.getTimestamps.value instanceof Float32Array);
  // Four values: [lng, lat, z] positions plus a timestamp.
  const trip4 = trip.map(([x, y, t], i) => [x, y, i * 10, t]);
  const d4 = binaryPaths(encode(trip4, { ...o, dimensions: 4 }), { ...o, dimensions: 4, timestamps: true, float32: true });
  eq(d4.attributes.getPath.size, 3);
  eq(d4.attributes.getPath.value, trip4.flatMap((p) => p.slice(0, 3)).map(Math.fround));
  eq(d4.attributes.getTimestamps.value, [0, 60, 125]);
  ok(d4.attributes.getTimestamps.value instanceof Float32Array);
  throws(() => binaryPaths(google, { timestamps: true }), 'option');
  throws(() => binaryPaths(google, { dimensions: 4 }), 'option');
  throws(() => binaryPaths(google, { dimensions: 1 }), 'option');
});

test('deckgl: binaryPolygons closes every ring', () => {
  const d = binaryPolygons([google, second, '']);
  eq(Object.keys(d.attributes), ['getPolygon']);
  // google is open (3 + 1 vertices), second is already closed (4).
  eq(d.startIndices, [0, 4, 8, 8]);
  eq(d.attributes.getPolygon.value, flat([[...lngLat(google), lngLat(google)[0]], lngLat(second)]));
  const f = binaryPolygons(google, { float32: true });
  ok(f.attributes.getPolygon.value instanceof Float32Array);
  eq(f.attributes.getPolygon.value.length, 8);
  eq(Array.from(f.attributes.getPolygon.value.slice(6)), Array.from(f.attributes.getPolygon.value.slice(0, 2)));
});

test('deckgl: bad input, strict and not', () => {
  throws(() => binaryPaths([google, google.slice(0, -1)]), 'truncated');
  throws(() => binaryPaths([google, google + '!']), 'char');
  throws(() => binaryPaths([google, 5]), 'input');
  throws(() => binaryPaths({}), 'input');
  throws(() => binaryPaths(google, { precision: 99 }), 'option');
  // strict: false skips bad characters and drops a cut-off point, like decode.
  const lines = [google.slice(0, -1), google.replace('~', '~!'), google, '!!', google.slice(0, 12)];
  const d = binaryPaths(lines, { strict: false });
  const want = lines.map((s) => lngLat(s, { strict: false }));
  eq(d.startIndices, [0, ...want.map((w, i) => want.slice(0, i + 1).flat().length)]);
  eq(d.attributes.getPath.value, flat(want));
  eq(binaryPolygons(lines, { strict: false }).length, 5);
  // Values past the fast loop's 30 bits go through the exact decoder.
  const big = encode([[89.9999999, 179.9999999], [-89.9999999, -179.9999999]], 7);
  eq(binaryPaths([google, big, google], 7).attributes.getPath.value, flat([lngLat(google, 7), lngLat(big, 7), lngLat(google, 7)]));
  const big3 = encode([[1e6, 2e6, 3e6]], { precision: 5, dimensions: 3 });
  eq(binaryPaths(big3, { dimensions: 3 }).attributes.getPath.value, [2e6, 1e6, 3e6]);
});

if (realWorld) {
  test('deckgl: the 1000 real-world lines', () => {
    const d = binaryPaths(realWorld), f = binaryPaths(realWorld, { float32: true });
    const want = realWorld.map((s) => lngLat(s));
    eq(d.length, 1000);
    eq(d.attributes.getPath.value, flat(want));
    eq(f.attributes.getPath.value, flat(want).map(Math.fround));
    let k = 0;
    want.forEach((w, i) => {
      eq(d.startIndices[i], k);
      k += w.length;
    });
    eq(d.startIndices[1000], k);
  });
}

// deck.gl's tesselators: binary data must give the same vertices as the
// same lines through the plain accessor.
const pathTess = (opts) => new PathTesselator({ fp64: true, positionFormat: 'XY', ...opts });
test('deckgl: PathTesselator reads binaryPaths like the getPath accessor', () => {
  const lines = [google, second, google];
  for (const float32 of [false, true]) {
    const data = binaryPaths(lines, { float32 });
    const objects = lines.map((s) => ({ path: lngLat(s).map(([x, y]) => (float32 ? [Math.fround(x), Math.fround(y)] : [x, y])) }));
    const plain = pathTess({ data: objects, getGeometry: (o) => o.path, normalize: true });
    // _pathType unset: deck.gl normalizes the binary paths.
    const norm = pathTess({ data, geometryBuffer: data.attributes.getPath, buffers: { ...data.attributes }, normalize: true });
    eq(norm.instanceCount, plain.instanceCount);
    eq(Array.from(norm.vertexStarts), Array.from(plain.vertexStarts));
    eq(norm.get('positions').slice(0, norm.instanceCount * 3), plain.get('positions').slice(0, plain.instanceCount * 3));
    eq(norm.get('segmentTypes').slice(0, norm.instanceCount), plain.get('segmentTypes').slice(0, plain.instanceCount));
    // _pathType 'open': the buffer is used as it is.
    const buffers = { ...data.attributes };
    const open = pathTess({ data, geometryBuffer: data.attributes.getPath, buffers, normalize: false });
    eq(open.instanceCount, 10);
    eq(Array.from(open.vertexStarts), [0, 3, 7, 10]);
    ok(buffers.vertexPositions === data.attributes.getPath);
    // The first line is open, so its segment types match. deck.gl only
    // detects closed lines (the second) when it normalizes.
    eq(open.get('segmentTypes').slice(0, 3), plain.get('segmentTypes').slice(0, 3));
  }
});

test('deckgl: PolygonTesselator reads binaryPolygons like the getPolygon accessor', () => {
  const lines = [google, second];
  const data = binaryPolygons(lines);
  const objects = lines.map((s) => ({ polygon: lngLat(s) }));
  const opts = { fp64: true, positionFormat: 'XY', preproject: null, full3d: false };
  const plain = new PolygonTesselator({ ...opts, data: objects, getGeometry: (o) => o.polygon, normalize: true });
  // _normalize true (the default): the same as the accessor data, winding
  // order fixed by deck.gl included.
  const norm = new PolygonTesselator({ ...opts, data, geometryBuffer: data.attributes.getPolygon, buffers: { ...data.attributes }, normalize: true });
  eq(norm.instanceCount, plain.instanceCount);
  eq(Array.from(norm.vertexStarts), Array.from(plain.vertexStarts));
  eq(norm.get('positions').slice(0, norm.instanceCount * 3), plain.get('positions').slice(0, plain.instanceCount * 3));
  eq(norm.get('indices'), plain.get('indices'));
  // _normalize false: the rings as they are, already closed, triangulated.
  const raw = new PolygonTesselator({ ...opts, data, geometryBuffer: data.attributes.getPolygon, buffers: { ...data.attributes }, normalize: false });
  eq(raw.instanceCount, 8);
  eq(Array.from(raw.vertexStarts), [0, 4, 8]);
  const xyz = Array.from(data.attributes.getPolygon.value).flatMap((v, i) => (i % 2 ? [v, 0] : [v]));
  eq(raw.get('positions').slice(0, 24), xyz);
  eq(raw.get('indices').length, plain.get('indices').length);
});

test('deckgl: real layers take the data as props', () => {
  const paths = binaryPaths([google, second]);
  const layer = new PathLayer({ id: 'p', data: paths, _pathType: 'open' });
  ok(layer.props.data === paths);
  eq(layer.props._pathType, 'open');
  const trip = encode([[-120.2, 38.5, 0], [-120.95, 40.7, 60]], { dimensions: 3, zFactor: 1, order: 'lnglat' });
  const trips = new TripsLayer({ id: 't', data: binaryPaths(trip, { dimensions: 3, zFactor: 1, timestamps: true }), currentTime: 30 });
  eq(trips.props.data.attributes.getTimestamps.size, 1);
  const solid = new SolidPolygonLayer({ id: 's', data: binaryPolygons(google), _normalize: false });
  eq(solid.props.data.length, 1);
});

// A real Deck in headless Chrome, bundled with esbuild: render, pick, and
// compare the GPU attributes of binary layers with the same lines given
// through accessors.
const chromePath = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].find((p) => p && existsSync(p));
if (!chromePath) console.log('deckgl.test.js: no Chrome found (set CHROME_PATH), skipping the real Deck checks');
else {
  test('deckgl: a real Deck renders and picks binary PathLayer, TripsLayer, SolidPolygonLayer and PolygonLayer data', async () => {
    const esbuild = await import('esbuild');
    const { chromium } = await import('playwright-core');
    const built = await esbuild.build({
      entryPoints: [fileURLToPath(new URL('./fixtures/deckgl/browser-entry.js', import.meta.url))],
      bundle: true,
      format: 'esm',
      write: false,
      logLevel: 'silent',
    });
    const bundle = built.outputFiles[0].text;
    const browser = await chromium.launch({ executablePath: chromePath, headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.route('**/*', (route) => {
        const { pathname, origin } = new URL(route.request().url());
        if (origin != 'http://polytini.test') return route.abort();
        if (pathname == '/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><body style="margin:0"><div id="c" style="position:relative;width:400px;height:300px"></div>' });
        if (pathname == '/bundle.js') return route.fulfill({ contentType: 'text/javascript', body: bundle });
        return route.fulfill({ status: 404, body: '' });
      });
      await page.goto('http://polytini.test/');
      const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
      if (!webgl) return console.log('deckgl.test.js: headless Chrome has no WebGL 2 here, skipping the real Deck checks');
      const trip = encode([[-120.2, 38.5, 0], [-120.95, 40.7, 60], [-126.453, 43.252, 120]], { dimensions: 3, zFactor: 1, order: 'lnglat' });
      const got = await page.evaluate(
        async ({ lines, trip }) => {
          const m = await import(location.origin + '/bundle.js');
          const lngLat = (d, i, size) => Array.from(d.attributes[Object.keys(d.attributes)[0]].value.subarray(d.startIndices[i] * size, d.startIndices[i + 1] * size));
          const pairs = (a, size) => Array.from({ length: a.length / size }, (_, i) => a.slice(i * size, i * size + size));
          const paths = m.binaryPaths(lines);
          const paths32 = m.binaryPaths(lines, { float32: true });
          const polys = m.binaryPolygons(lines);
          const trips = m.binaryPaths(trip, { dimensions: 3, zFactor: 1, timestamps: true });
          const objects = lines.map((_, i) => ({ path: pairs(lngLat(paths, i, 2), 2) }));
          const polyObjects = lines.map((_, i) => ({ polygon: pairs(lngLat(polys, i, 2), 2) }));
          const common = { widthUnits: 'pixels', getWidth: 12, pickable: true };
          const layers = [
            new m.PathLayer({ id: 'path-open', data: paths, _pathType: 'open', getColor: [255, 0, 0], ...common }),
            new m.PathLayer({ id: 'path-normalized', data: paths, getColor: [255, 0, 0], ...common }),
            new m.PathLayer({ id: 'path-f32', data: paths32, _pathType: 'open', ...common }),
            new m.PathLayer({ id: 'path-accessor', data: objects, getPath: (d) => d.path, ...common }),
            new m.TripsLayer({ id: 'trips-binary', data: trips, _pathType: 'open', currentTime: 60, trailLength: 200, ...common }),
            new m.TripsLayer({ id: 'trips-accessor', data: [{ path: pairs(lngLat(trips, 0, 2), 2), timestamps: [0, 60, 120] }], getPath: (d) => d.path, getTimestamps: (d) => d.timestamps, currentTime: 60, trailLength: 200, ...common }),
            new m.SolidPolygonLayer({ id: 'solid-binary', data: polys, _normalize: false, getFillColor: [0, 0, 255], pickable: true }),
            // Outlines for the same polygons: the ring buffer as a path.
            new m.PathLayer({ id: 'outline', data: { ...polys, attributes: { getPath: polys.attributes.getPolygon } }, _pathType: 'open', ...common }),
            new m.SolidPolygonLayer({ id: 'solid-accessor', data: polyObjects, getPolygon: (d) => d.polygon }),
          ];
          let rendered;
          const done = new Promise((r) => (rendered = r));
          const deckErrors = [];
          const deck = new m.Deck({ parent: document.getElementById('c'), width: 400, height: 300, initialViewState: { longitude: -123, latitude: 41, zoom: 4 }, layers, onAfterRender: () => rendered(), onError: (e) => deckErrors.push(e.message) });
          await done;
          const byId = Object.fromEntries(deck.layerManager.getLayers().map((l) => [l.id, l]));
          // A layer's vertex positions on the GPU side: the binary buffer
          // itself, or what deck.gl packed from the accessor.
          const attr = (id, name) => {
            const at = byId[id].getAttributeManager().getAttributes()[name];
            const value = at.value ?? at.state.binaryValue?.value ?? at.state.binaryValue;
            return Array.from(value.subarray(0, byId[id].getNumInstances() * at.size));
          };
          const vp = deck.getViewports()[0];
          const pick = (lngLat, layerIds) => {
            const [x, y] = vp.project(lngLat);
            const p = deck.pickObject({ x, y, radius: 2, layerIds });
            return p ? [p.layer.id, p.index] : null;
          };
          const out = {
            instances: Object.fromEntries(Object.entries(byId).map(([k, l]) => [k, l.getNumInstances()])),
            bin: attr('path-open', 'vertexPositions'),
            bin32: attr('path-f32', 'vertexPositions'),
            solid: attr('solid-binary', 'vertexPositions'),
            timestamps: attr('trips-binary', 'timestamps'),
            pickPath: pick([-126.453, 43.252], ['path-open']),
            pickSecond: pick([-115.75, 36.5], ['path-open']),
            pickTrip: pick([-120.575, 39.6], ['trips-binary']),
            pickTripLater: pick([-123.7, 41.976], ['trips-binary']),
            pickTripAcc: pick([-120.575, 39.6], ['trips-accessor']),
            pickSolid: pick([-124, 41.5], ['solid-binary']),
            pickOutline: pick([-126.453, 43.252], ['outline']),
            deckErrors: deckErrors.slice(),
          };
          // PolygonLayer is a composite layer: try binary data on it too.
          try {
            deck.setProps({ layers: [new m.PolygonLayer({ id: 'composite', data: polys, _normalize: false, getFillColor: [0, 255, 0], pickable: true })] });
            await new Promise((r) => setTimeout(r, 300));
            const picked = pick([-124, 41.5], ['composite']);
            out.polygonLayer = picked ? 'renders and picks' : 'nothing picked' + (deckErrors.length > out.deckErrors.length ? ', deck.gl error: ' + deckErrors.at(-1) : '');
          } catch (e) {
            out.polygonLayer = 'throws: ' + e.message;
          }
          deck.finalize();
          return out;
        },
        { lines: [google, second], trip },
      );
      eq(errors, [], 'page errors');
      eq(got.deckErrors, [], 'deck.gl errors');
      // second is a closed line: deck.gl's normalization adds a vertex to
      // join it (9), _pathType 'open' draws it as it is (7).
      eq(got.instances, { 'path-open': 7, 'path-normalized': 9, 'path-f32': 7, 'path-accessor': 9, 'trips-binary': 3, 'trips-accessor': 3, 'solid-binary': 8, outline: 8, 'solid-accessor': 8 });
      // With _pathType 'open' the binary buffer is the GPU attribute as it
      // is. (That normalized binary paths pack like accessor data is checked
      // with deck.gl's PathTesselator above.)
      eq(got.bin, [...lngLat(google).flat(), ...lngLat(second).flat()]);
      eq(got.bin32, [...lngLat(google).flat(), ...lngLat(second).flat()].map(Math.fround));
      eq(got.solid, Array.from(binaryPolygons([google, second]).attributes.getPolygon.value));
      eq(got.timestamps, [0, 60, 120]);
      eq(got.pickPath, ['path-open', 0]);
      eq(got.pickSecond, ['path-open', 1]);
      eq(got.pickTrip, ['trips-binary', 0]);
      eq(got.pickTripAcc, ['trips-accessor', 0]);
      // Past currentTime: the second segment is not drawn yet.
      eq(got.pickTripLater, null);
      eq(got.pickSolid, ['solid-binary', 0]);
      eq(got.pickOutline, ['outline', 0]);
      // Recorded rather than asserted: what deck.gl 9 does with binary data
      // on the composite PolygonLayer.
      console.log(`deckgl.test.js: PolygonLayer with binary getPolygon data: ${got.polygonLayer}`);
    } finally {
      await browser.close();
    }
  });
}
