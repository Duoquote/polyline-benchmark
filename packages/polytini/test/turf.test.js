// The Turf integration against the real @turf/turf.
import { test, eq, near, throws } from './lib.js';
import * as turf from '@turf/turf';
import { toFeature, toFeatureCollection, toPolygonFeature, fromGeoJSON } from '../src/turf.js';
import { encode, decode } from '../src/web.js';

const s = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const lngLat = [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]];

test('toFeature matches turf.lineString, with properties, id and bbox', () => {
  eq(toFeature(s), turf.lineString(lngLat));
  const o = { properties: { name: 'a' }, id: 7, bbox: true };
  eq(toFeature(s, o), turf.lineString(lngLat, { name: 'a' }, { id: 7, bbox: turf.bbox(turf.lineString(lngLat)) }));
});

test('toFeature works with Turf measurements', () => {
  const f = toFeature(s);
  near(turf.length(f), turf.length(turf.lineString(lngLat)), 0);
  const s6 = encode(lngLat, { precision: 6, order: 'lnglat' });
  near(turf.length(toFeature(s6, { precision: 6 })), turf.length(f), 1e-9);
});

test('toFeatureCollection with per-line properties', () => {
  const fc = toFeatureCollection([s, s], { properties: [{ i: 0 }, { i: 1 }], id: ['a', 'b'] });
  eq(fc, turf.featureCollection([turf.lineString(lngLat, { i: 0 }, { id: 'a' }), turf.lineString(lngLat, { i: 1 }, { id: 'b' })]));
});

test('round trip through turf.simplify and turf.lineSlice', () => {
  const f = toFeature(s);
  const simple = turf.simplify(f, { tolerance: 0.5 });
  eq(fromGeoJSON(simple), [encode(simple.geometry.coordinates, { order: 'lnglat' })]);
  const slice = turf.lineSlice(turf.point(lngLat[0]), turf.point(lngLat[1]), f);
  eq(decode(fromGeoJSON(slice)[0], { order: 'lnglat' }).length, slice.geometry.coordinates.length);
});

test('fromGeoJSON walks every line type', () => {
  const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
  const poly = turf.polygon([ring, [[0.2, 0.2], [0.4, 0.2], [0.4, 0.4], [0.2, 0.2]]]);
  const multi = turf.multiLineString([lngLat, lngLat.slice(0, 2)]);
  const fc = turf.featureCollection([turf.point([1, 2]), turf.lineString(lngLat), poly, multi]);
  const out = fromGeoJSON(fc);
  eq(out.length, 1 + 2 + 2);
  eq(out[0], s);
  eq(fromGeoJSON(multi.geometry), [s, encode(lngLat.slice(0, 2), { order: 'lnglat' })]);
  eq(fromGeoJSON(turf.multiPolygon([[ring], [ring]])).length, 2);
  eq(fromGeoJSON(turf.geometryCollection([multi.geometry]).geometry).length, 2);
  eq(fromGeoJSON(turf.lineString(lngLat), 6), [encode(lngLat, { precision: 6, order: 'lnglat' })]);
  throws(() => fromGeoJSON({ type: 'Nope' }), 'input');
});

test('toPolygonFeature matches turf.polygon, and turf.area agrees', () => {
  const ring = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
  const f = toPolygonFeature([encode(ring, { order: 'lnglat' })]);
  eq(f, turf.polygon([ring]));
  near(turf.area(f), turf.area(turf.polygon([ring])), 0);
  eq(fromGeoJSON(f), [encode(ring, { order: 'lnglat' })]);
});

test('strict errors come through', () => {
  throws(() => toFeature(s.slice(0, -1)), 'truncated');
  eq(toFeature(s.slice(0, -1), { strict: false }).geometry.coordinates, lngLat.slice(0, 2));
  throws(() => fromGeoJSON(turf.lineString([[0, 0], [NaN, 1]])), 'coordinate');
});
