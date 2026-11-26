// Type check of @duoquote/polytini/google against @types/google.maps. Not
// run, only compiled: npx tsc --noEmit -p test/fixtures/google
import { decodePath, encodePath, PolylineError, type DecodePathOptions, type PathPoint } from '@duoquote/polytini/google';

declare const map: google.maps.Map;
declare const line: google.maps.Polyline;

// Drop-in: the same calls and result types as google.maps.geometry.encoding.
const path: google.maps.LatLng[] = decodePath('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
const fromGoogle: typeof google.maps.geometry.encoding.decodePath = decodePath;
const toGoogle: typeof google.maps.geometry.encoding.encodePath = encodePath;
new google.maps.Polyline({ path, map });
path[0].lat().toFixed(5);

const s1: string = encodePath(line.getPath());
const s2: string = encodePath(path);
const s3: string = encodePath([{ lat: 38.5, lng: -120.2 }, new google.maps.LatLng(40.7, -120.95)]);
const s4: string = encodePath(new google.maps.MVCArray<google.maps.LatLngLiteral>([{ lat: 1, lng: 2 }]));

// polytini extras: precision, strict, tuples, the LatLng option.
const p6: google.maps.LatLng[] = decodePath(s1, 6);
const lenient: google.maps.LatLng[] = decodePath(s1, { precision: 6, strict: false, LatLng: google.maps.LatLng, noClampNoWrap: true });
const literals: google.maps.LatLngLiteral[] = decodePath(s1, { LatLng: false });
literals[0].lat.toFixed(5);
declare const opts: DecodePathOptions;
const either: google.maps.LatLng[] | google.maps.LatLngLiteral[] = decodePath(s1, opts);
const s5: string = encodePath([[38.5, -120.2], [40.7, -120.95]], { precision: 5, order: 'latlng' });
const mixed: PathPoint[] = [[1, 2], { lat: 3, lng: 4 }, new google.maps.LatLng(5, 6)];
const s6: string = encodePath(mixed, 6);

try {
  decodePath('bad');
} catch (e) {
  if (e instanceof PolylineError) e.code satisfies 'char' | 'truncated' | 'overflow' | 'coordinate' | 'input' | 'option' | 'init';
}

// These must not compile.
// @ts-expect-error a decoded LatLngLiteral has no lat() method
literals[0].lat();
// @ts-expect-error order is not a decodePath option
decodePath(s1, { order: 'lnglat' });
// @ts-expect-error a path is not a string
encodePath('abc');
// @ts-expect-error precision is a number
encodePath(path, '5');

export { fromGoogle, toGoogle, s2, s3, s4, s5, s6, p6, lenient, either };
