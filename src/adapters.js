// One adapter per library and variant. The benchmark calls `encode` /
// `decode` with data already in the library's own input shape (prepared
// once with `toNative`), so coordinate flipping or object wrapping is never
// part of the timing. `fromNative` turns a decode result back into
// [lat, lng] pairs for the correctness tests only, and `count` gives the
// number of points in a decode result when that isn't `.length`.
//
// No file system access here, so the browser benchmark can bundle it.
// src/implementations.js adds the installed versions for Node, Bun and Deno.
import mapbox from '@mapbox/polyline';
import * as googlemapsModule from '@googlemaps/polyline-codec';
import googlePolyline from 'google-polyline';
import * as pirxpilot from '@pirxpilot/google-polyline';
import * as placemark from '@placemarkio/polyline';
import polylineEncoded from 'polyline-encoded';
import decodeGoogleMapPolyline from 'decode-google-map-polyline';
import * as lpLabs from '@lp-labs/polyline-codec';
import { encodeDeltas, decodeDeltas } from 'ol/format/Polyline.js';
// polytini resolves to its runtime entry here: node, bun, deno, or the web
// entry in browsers. The other polytini rows pick an entry explicitly.
import * as polytini from '@duoquote/polytini';
import * as polytiniWeb from '@duoquote/polytini/web';
import * as polytiniWasm from '@duoquote/polytini/wasm';
import hereFlex from '@here/flexpolyline';
import * as polytiniFlex from '@duoquote/polytini/flexible';
import { binaryPaths } from '@duoquote/polytini/deckgl';

// Node loads @googlemaps/polyline-codec's UMD build (one default export),
// bundlers its ESM build (named exports only). Same functions either way.
const googlemaps = googlemapsModule.default ?? googlemapsModule;

await polytiniWasm.init();

const identity = (x) => x;
const flip = (points) => points.map(([a, b]) => [b, a]);
const pairs = (flat) => Array.from({ length: flat.length / 2 }, (_, i) => [flat[2 * i], flat[2 * i + 1]]);

export const shapes = {
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
  // Typed-array rows: one flat Float64Array [lat0, lng0, lat1, lng1, ...].
  flat: { toNative: (points) => new Float64Array(points.flat()), fromNative: pairs, count: (out) => out.length / 2 },
  // ol's flat number arrays, same order.
  flatArray: { toNative: (points) => points.flat(), fromNative: pairs, count: (out) => out.length / 2 },
};

// `group: 'flat'` rows use typed arrays or flat number arrays instead of the
// [lat, lng] tuples of the main comparison. They're reported in their own
// table, because they skip the per-point arrays the main rows must build.
export const defs = [
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
  {
    pkg: '@duoquote/polytini',
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => polytini.encode(points, p),
    decode: (str, p) => polytini.decode(str, p),
  },
  {
    pkg: '@duoquote/polytini',
    variant: 'web entry',
    // The minimal portable build (the "default" condition), run everywhere
    // to show what each runtime's own entry adds.
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => polytiniWeb.encode(points, p),
    decode: (str, p) => polytiniWeb.decode(str, p),
  },
  {
    pkg: '@duoquote/polytini',
    variant: 'wasm',
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => polytiniWasm.encode(points, p),
    decode: (str, p) => polytiniWasm.decode(str, p),
  },
  {
    pkg: '@duoquote/polytini',
    variant: 'Float64Array',
    group: 'flat',
    shape: 'flat',
    precisions: [5, 6],
    encode: (values, p) => polytini.encodeFlat(values, p),
    decode: (str, p) => polytini.decodeFlat(str, p),
  },
  {
    pkg: '@duoquote/polytini',
    variant: 'wasm, Float64Array',
    group: 'flat',
    shape: 'flat',
    precisions: [5, 6],
    encode: (values, p) => polytiniWasm.encodeFlat(values, p),
    decode: (str, p) => polytiniWasm.decodeFlat(str, p),
  },
  // Batch rows: every line of the real-world set in one call, into one
  // typed array. Other libraries have no batch API; their per-line
  // numbers on the same set are in the main tables.
  {
    pkg: '@duoquote/polytini',
    variant: 'wasm decodeMany/encodeMany',
    group: 'batch',
    batch: true,
    shape: 'latlng',
    precisions: [5],
    count: (out) => out.starts[out.starts.length - 1],
    fromNative: (out) => pairs(out.coords),
    encode: (lines, p) => polytiniWasm.encodeMany(lines, p),
    decode: (lines, p) => polytiniWasm.decodeMany(lines, p),
  },
  {
    pkg: '@duoquote/polytini',
    variant: 'deck.gl binaryPaths',
    group: 'batch',
    batch: true,
    shape: 'latlng',
    precisions: [5],
    count: (out) => out.startIndices[out.length],
    // deck.gl positions are [lng, lat].
    fromNative: (out) => pairs(out.attributes.getPath.value).map(([lng, lat]) => [lat, lng]),
    decode: (lines, p) => binaryPaths(lines, { precision: p }),
  },
  {
    pkg: 'ol',
    variant: 'encodeDeltas/decodeDeltas',
    group: 'flat',
    shape: 'flatArray',
    precisions: [5, 6],
    // encodeDeltas overwrites its input with the deltas, so it needs a copy
    // per call. ol's own Polyline format makes the same copy, or worse,
    // mutates the geometry (see the README).
    encode: (values, p) => encodeDeltas(values.slice(), 2, 10 ** p),
    decode: (str, p) => decodeDeltas(str, 2, 10 ** p),
  },
];

// HERE's Flexible Polyline: a different format, benchmarked on its own
// (bench/run.js --format flexible), with strings from HERE's encoder.
export const flexDefs = [
  {
    pkg: '@here/flexpolyline',
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => hereFlex.encode({ polyline: points, precision: p }),
    decode: (str) => hereFlex.decode(str).polyline,
  },
  {
    pkg: '@duoquote/polytini',
    variant: 'flexible',
    shape: 'latlng',
    precisions: [5, 6],
    encode: (points, p) => polytiniFlex.encode({ polyline: points, precision: p }),
    decode: (str) => polytiniFlex.decode(str).polyline,
  },
];

/** HERE's encoder, for building the flexible fixtures. */
export const encodeFlexible = (points, precision) => hereFlex.encode({ polyline: points, precision });

export function withShapes(def, version) {
  const label = def.variant ? `${def.pkg}@${version} (${def.variant})` : `${def.pkg}@${version}`;
  // A row's own count and fromNative win over its shape's.
  return { ...def, ...shapes[def.shape], ...(def.count && { count: def.count }), ...(def.fromNative && { fromNative: def.fromNative }), version, name: label };
}
