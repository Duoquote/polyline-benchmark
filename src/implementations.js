// One adapter per library. The benchmark calls `encode` / `decode` with data
// already in the library's own input shape (prepared once with `toNative`),
// so coordinate flipping or object wrapping is never part of the timing.
// `fromNative` turns a decode result back into [lat, lng] pairs for the
// correctness tests only.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import mapbox from '@mapbox/polyline';
import googlemaps from '@googlemaps/polyline-codec';
import googlePolyline from 'google-polyline';
import * as pirxpilot from '@pirxpilot/google-polyline';
import * as placemark from '@placemarkio/polyline';
import polylineEncoded from 'polyline-encoded';
import decodeGoogleMapPolyline from 'decode-google-map-polyline';
import * as lpLabs from '@lp-labs/polyline-codec';

const identity = (x) => x;
const flip = (points) => points.map(([a, b]) => [b, a]);

const shapes = {
  latlng: { toNative: identity, fromNative: identity },
  lnglat: { toNative: flip, fromNative: flip },
  latLngObject: {
    toNative: (points) => points.map(([lat, lng]) => ({ lat, lng })),
    fromNative: (points) => points.map((p) => [p.lat, p.lng]),
  },
  latitudeObject: {
    toNative: (points) => points.map(([latitude, longitude]) => ({ latitude, longitude })),
    fromNative: (points) => points.map((p) => [p.latitude, p.longitude]),
  },
};

function version(pkg) {
  const file = fileURLToPath(new URL(`../node_modules/${pkg}/package.json`, import.meta.url));
  return JSON.parse(readFileSync(file, 'utf8')).version;
}

const defs = [
  {
    pkg: '@mapbox/polyline',
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => mapbox.encode(points, p),
    decode: (str, p) => mapbox.decode(str, p),
  },
  {
    pkg: '@googlemaps/polyline-codec',
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => googlemaps.encode(points, p),
    decode: (str, p) => googlemaps.decode(str, p),
  },
  {
    pkg: 'google-polyline',
    shape: 'latlng',
    // 2.0.0 has a fixed factor of 1e5 and no precision option.
    precisions: [5],
    encode: (points) => googlePolyline.encode(points),
    decode: (str) => googlePolyline.decode(str),
  },
  {
    pkg: '@pirxpilot/google-polyline',
    shape: 'lnglat',
    precisions: [5, 6],
    encode: (points, p) => pirxpilot.encode(points, { factor: 10 ** p }),
    decode: (str, p) => pirxpilot.decode(str, { factor: 10 ** p }),
  },
  {
    pkg: '@placemarkio/polyline',
    shape: 'lnglat',
    precisions: [5, 6],
    encode: (points, p) => placemark.encode(points, p),
    decode: (str, p) => placemark.decode(str, p),
  },
  {
    pkg: 'polyline-encoded',
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => polylineEncoded.encode(points, { precision: p }),
    decode: (str, p) => polylineEncoded.decode(str, { precision: p }),
  },
  {
    pkg: 'decode-google-map-polyline',
    shape: 'latLngObject',
    // Decode only, fixed at precision 5.
    precisions: [5],
    decode: (str) => decodeGoogleMapPolyline(str),
  },
  {
    pkg: '@lp-labs/polyline-codec',
    shape: 'latitudeObject',
    precisions: [5, 6],
    encode: (points, p) => lpLabs.encodePolyline(points, { precision: p }),
    decode: (str, p) => lpLabs.decodePolyline(str, { precision: p }),
  },
];

export const implementations = defs.map((def) => ({
  ...def,
  ...shapes[def.shape],
  version: version(def.pkg),
  name: `${def.pkg}@${version(def.pkg)}`,
}));
