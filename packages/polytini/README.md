# polytini

polytini encodes and decodes [Google encoded polylines](https://developers.google.com/maps/documentation/utilities/polylinealgorithm), the strings you get back for route geometry from Google Maps, OSRM, Valhalla, GraphHopper and Mapbox. It's strict by default, so a cut-off or corrupted string throws instead of drawing a wrong line. Node, Bun, Deno and browsers each get the code path that measured fastest there.

```js
import { encode, decode } from '@duoquote/polytini';

encode([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);
// '_p~iF~ps|U_ulLnnqC_mqNvxq`@'

decode('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
// [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]
```

I wrote it for the [polyline-benchmark](https://github.com/Duoquote/polyline-benchmark) repo. I wanted to see how fast a polyline codec could get without giving up correctness checks. The numbers are in [Speed](#speed) below.

## Install

```sh
npm install @duoquote/polytini      # or pnpm add, yarn add, bun add
deno add jsr:@duoquote/polytini      # or npm:@duoquote/polytini
```

It's ESM with TypeScript types, plus CommonJS builds for `require()`. Node 22 or newer. Version 0.1.0 isn't on npm or JSR yet; [RELEASING.md](RELEASING.md) covers the first publish.

## Usage

```js
import { encode, decode, decodeFlat, encodeFlat, decodeLatLng, toGeoJSON, fromGeoJSON } from '@duoquote/polytini';

decode(str, 6);                              // precision 6, for OSRM polyline6 or Valhalla
decode(str, { precision: 6, order: 'lnglat' }); // [lng, lat] tuples
encode(points, { factor: 1e5 });             // a factor instead of a precision
encode([{ lat: 38.5, lng: -120.2 }]);        // objects work too: lat/latitude, lng/lon/longitude
decodeLatLng(str);                           // [{ lat, lng }], for Google Maps and Leaflet
toGeoJSON(str);                              // { type: 'LineString', coordinates: [[lng, lat], ...] }
fromGeoJSON(lineStringOrFeature);
decodeFlat(str);                             // one Float64Array [lat0, lng0, lat1, lng1, ...]
encodeFlat(new Float64Array([38.5, -120.2]));
```

Options are a number (the precision) or an object:

- `precision`: decimal places, 0 to 15. Default 5.
- `factor`: multiply by this instead of `10 ** precision`.
- `order`: `'latlng'` (default) or `'lnglat'`. The string itself always stores latitude first; this only changes the tuples you pass in and get back.
- `strict`: default `true`. See below.
- `dimensions`: values per point, 1 to 16. Default 2. GraphHopper puts elevation third.
- `zFactor`: the factor for the third and later values, like GraphHopper's elevation multiplier of 100.

The precision isn't stored in the string, so both sides have to agree. A precision 6 string decoded at precision 5 gives coordinates ten times too big, with no error.

### Strict mode

By default, malformed input throws a `PolylineError` with a `code` and, where it makes sense, an `index`:

- `char`: a character outside `?` to `~` (index of the character)
- `truncated`: the string ends inside a value or a point
- `overflow`: a value past 2^53, where Number math stops being exact
- `coordinate`: NaN, Infinity, `null` or a missing coordinate in encode (index of the point)
- `input`: not a string or an array
- `option`: a bad option

```js
decode('_p~iF~ps|U_ulLnnq');                    // throws PolylineError: Truncated at 17 (code 'truncated')
decode('_p~iF~ps|U_ulLnnq', { strict: false }); // [[38.5, -120.2]]
```

With `strict: false` it never throws on bad data: decode skips invalid characters and drops an incomplete last point, and encode treats missing or non-finite coordinates as 0.

I made strict the default because it's cheap: on 10-point lines the checks measured 0 to 4%, and nothing I could separate from the noise on longer ones. The decoder ORs every character code into one integer and checks it once at the end, and the encoder's range check also catches NaN. Most other libraries silently return a wrong last point for a truncated string; see `npm run behavior` in the benchmark repo.

### Rounding

Encoding rounds half away from zero, as Google's algorithm description says: 0.000005 becomes 1 unit at precision 5, and -0.000005 becomes -1. That matches `@googlemaps/polyline-codec`, `@mapbox/polyline`, PostGIS and OSRM.

One difference from most JavaScript libraries: they round with `Math.floor(Math.abs(x) + 0.5)`, which turns 0.49999999999999994 (the largest double below 0.5) into 1, because the addition itself rounds up. polytini gives 0, like C's `round()` and PostGIS. It only matters for that one value at each scale.

Decoding divides by the factor instead of multiplying by its inverse, so 38.5 comes back as exactly 38.5.

## Entry points

The package picks an entry point by export condition, so you don't import these by hand:

| Condition | File | What's different |
|---|---|---|
| `bun` | `src/bun.js` | the same as node |
| `deno` | `src/deno.js` | byte buffers through TextEncoder and TextDecoder |
| `browser` | `src/browser.js` | the core, but long lines encode through TextDecoder |
| `node` | `src/node.js` | Buffer-backed decode and encode |
| `default` | `src/web.js` | the portable core and nothing else |

`@duoquote/polytini/web`, `/browser` and `/node` pick one explicitly. All of them have the same API and give the same output; the test suite runs every check against each of them.

### Platform notes

Each entry only has its own code where it measured faster than the portable core on that runtime. The numbers here are million points per second at 10,000 points from the benchmark run, entry against `/web`:

- Node (`src/node.js`): encoding writes bytes into a reused `Buffer` and turns them into a string with one `latin1Slice` call, instead of building the string piece by piece. That was 1.6 to 1.8 times faster (109 against 66 on Node 24). Decoding copies the string into a `Buffer` with `ucs2Write`, counts the points first so the output array is allocated once at its final size, then reads 16-bit values. That was 1 to 14% faster on Node 22 and 24 to 26, and 43% on Node 23, which I'd put partly down to noise. On Node 22 and 23 (V8 12), results over 32,768 points are built by appending instead, which was faster there and slower on newer V8.
- Bun (`src/bun.js`): the same code as Node. The `Buffer` encoder was 2.3 times faster than the core (159 against 70). The `Buffer` decoder measured within 5% of the core in a direct comparison on Bun 1.4.3, ahead in some sizes and behind in others, so there was no reason for a Bun-only decoder.
- Deno (`src/deno.js`): `node:buffer` was slower than the core under Deno, so this entry uses `TextEncoder.encodeInto` and `TextDecoder('latin1')` on a reused byte array instead. Encoding was 1.5 times faster (103 against 69), decoding about 6% (86 against 81). Lines under 512 points encode through the core, because the `TextDecoder` call has a fixed cost.
- Browsers (`src/browser.js`): long lines encode through `TextDecoder` like in Deno, 1.6 times faster in Chrome (121 against 77). Decoding stays on the core's `charCodeAt` loop, because `encodeInto` made it slower in Chrome.
- Everything else (`src/web.js`): the core alone. It uses no Node, Bun or Deno globals.

## WASM

There's an opt-in WebAssembly build. It's a hand-written WAT module that assembles to 628 bytes, inlined as base64, so it loads the same way in browsers, bundlers, Node, Bun and Deno. Nothing loads it unless you import it:

```js
import { init, decode, encode, decodeFlat } from '@duoquote/polytini/wasm';

await init(); // once; initSync() also works
decode(str);  // then the same API, synchronous
```

I'll be plain about it: the WASM build is slower than the JavaScript entries, and I don't recommend it for speed. Most of its time goes into copying the string in and the numbers out, which the JavaScript loops don't need. In the benchmark run, at 10,000 points:

| | Node 24 | Bun 1.4.3 | Deno 2.5 | Chrome 157 |
|---|--:|--:|--:|--:|
| `decode`, default entry | 86 | 105 | 86 | 95 |
| `decode`, wasm | 64 | 65 | 47 | 71 |
| `encode`, default entry | 109 | 159 | 103 | 121 |
| `encode`, wasm | 86 | 90 | 37 | 91 |
| `decodeFlat`, default entry | 86 | 159 | 92 | 59 |
| `decodeFlat`, wasm | 84 | 162 | 46 | 69 |

With `Float64Array` on both sides it's about even with the JavaScript version on Node and Bun and a bit ahead in Chrome, but on 10-point lines in Deno and Chrome the call overhead makes it 4 to 6 times slower. I kept it because it's small (628 bytes of WebAssembly), opt-in, and tested like every other entry, and because "WASM is faster" is a common guess that these numbers answer.

## Integrations

Each one is its own subpath, so none of them add bytes to the main entry. The map libraries are optional peer dependencies, and the integrations only import their types.

### Presets for routing engines

```js
import { decode, toGeoJSON } from '@duoquote/polytini';
import { osrm6, valhalla, graphhopper3d } from '@duoquote/polytini/presets';

decode(route.geometry, osrm6);          // [[lng, lat], ...], same as geometries=geojson
decode(leg.shape, valhalla);            // Valhalla and Stadia shapes, precision 6
toGeoJSON(path.points, graphhopper3d);  // GraphHopper elevation=true: [lng, lat, ele]
decode(path.points, { ...graphhopper3d, factor: path.points_encoded_multiplier });
```

`google`, `osrm`, `osrm6`, `valhalla`, `stadia`, `graphhopper`, `graphhopper3d`, `openrouteservice`, `openrouteservice3d`, `mapbox`, `mapbox6`, `strava` and `otp`. Each one is a plain options object with the precision, the order the engine uses for its own coordinates, and the elevation factor where there is one. The sources are cited in `src/presets.js`. Decoding matches every engine exactly. Encoding can differ by one unit from GraphHopper and openrouteservice on negative exact halves, and from OpenTripPlanner, which floors.

### Leaflet

A real plugin for Leaflet 1.9 and the Leaflet 2 betas, and a superset of the old `Polyline.encoded.js` plugin:

```js
import L from 'leaflet';
import { install } from '@duoquote/polytini/leaflet';
install(L); // or: import '@duoquote/polytini/leaflet/auto' when Leaflet is the global L

const line = L.Polyline.fromEncoded(str, { color: 'red', precision: 6 }).addTo(map);
line.toEncoded();                                  // '...'
L.Polygon.fromEncoded([outer, hole]).toEncoded();  // ['...', '...']
L.polylineEncoded(str).addTo(map);                 // factories, Leaflet 1.9 only
```

Multi-polylines and polygons with holes are arrays of strings. Leaflet 2 exports a frozen module namespace, so there `install` adds the static and prototype methods but skips the lower-case factories.

### Turf

```js
import { toFeature, toFeatureCollection, fromGeoJSON } from '@duoquote/polytini/turf';

turf.length(toFeature(str, { precision: 6, properties: { id: 1 }, bbox: true }));
fromGeoJSON(turf.simplify(toFeature(str), { tolerance: 0.001 })); // ['...']
```

`fromGeoJSON` takes any GeoJSON and returns one string per line: LineStrings, MultiLineString parts and polygon rings. There's also `toPolygonFeature(rings)` for Google-style encoded polygons.

### Google Maps

A drop-in for `google.maps.geometry.encoding.decodePath` and `encodePath`:

```js
import { decodePath, encodePath } from '@duoquote/polytini/google';

const path = decodePath(route.polyline.encodedPolyline); // LatLng[] once Maps has loaded
new google.maps.Polyline({ path, map });
encodePath(polyline.getPath());                           // MVCArray<LatLng> to string
decodePath(str, { LatLng: false });                       // {lat, lng} literals, in Node too
```

It's strict by default too. Google's documentation doesn't say what `decodePath` does with bad input.

### OpenLayers

A subclass of `ol/format/Polyline`, with the same options and output:

```js
import Polyline from '@duoquote/polytini/openlayers'; // instead of 'ol/format/Polyline.js'
const format = new Polyline({ factor: 1e6 });
const feature = format.readFeature(route.geometry, { featureProjection: 'EPSG:3857' });
```

One thing it fixes: ol's own `writeGeometry` overwrites the geometry's coordinates with the deltas when no projection change is involved, so writing the same geometry twice gives garbage. This one leaves the geometry alone.

### MapLibre GL and Mapbox GL

```js
import { addPolylineLayer, setPolylineData } from '@duoquote/polytini/maplibre'; // or /mapbox
import { osrm6 } from '@duoquote/polytini/presets';

map.on('load', () => addPolylineLayer(map, 'route', route.geometry, { ...osrm6, layer: { paint: { 'line-width': 4 } } }));
setPolylineData(map, 'route', [a.geometry, b.geometry], { ...osrm6, properties: [{ name: 'a' }, { name: 'b' }] });
```

`polylineSource()` and `polylineData()` build the GeoJSON source and FeatureCollection without touching a map. Both map libraries take the same calls, so `/mapbox` re-exports `/maplibre` with Mapbox's types.

### deck.gl

Decodes straight into deck.gl's binary attribute format, with one buffer for all lines and no array per point:

```js
import { PathLayer } from '@deck.gl/layers';
import { binaryPaths } from '@duoquote/polytini/deckgl';

const data = binaryPaths(routes.map((r) => r.geometry), { precision: 6, float32: true });
new PathLayer({ id: 'routes', data, _pathType: 'open', getWidth: 3, widthUnits: 'pixels' });
```

`binaryPolygons()` does the same for polygon fills. In deck.gl 9.4 the composite `PolygonLayer` doesn't take binary data, so use `SolidPolygonLayer`, plus a `PathLayer` over the same buffer for outlines. TripsLayer timestamps come out as a Float32Array, because a Float64Array drew nothing.

### HERE Flexible Polyline

A different format, with a header and an optional third dimension, fully separate from the Google-format code:

```js
import { encode, decode, ELEVATION } from '@duoquote/polytini/flexible';

const str = encode({ polyline: [[50.10228, 8.69821, 112.5], [50.10201, 8.69567, 113.1]], precision: 5, thirdDim: ELEVATION, thirdDimPrecision: 1 });
const { precision, thirdDim, polyline } = decode(str);
```

The same arguments and results as `@here/flexpolyline`, so it's a drop-in. It matches every line of HERE's official test data, including precision 11 and up, where `@here/flexpolyline` itself doesn't.

## CLI

```sh
npx @duoquote/polytini decode '_p~iF~ps|U_ulLnnqC_mqNvxq`@'
bunx @duoquote/polytini encode --file points.csv
deno run jsr:@duoquote/polytini/cli decode -p 6 -f geojson --file route.txt
```

`pnpm dlx @duoquote/polytini` and `yarn dlx @duoquote/polytini` work too. The command is `polytini`:

```
polytini 0.1.0: encode and decode Google encoded polylines

Usage:
  polytini encode [input] [options]
  polytini decode [input] [options]

Input is the argument, --file <path>, or stdin. Quote polylines on the
command line: they can contain \ ` | and other shell characters.

  encode reads JSON ([[lat, lng], ...], or GeoJSON), CSV with a header, or
         "lat,lng" lines, and prints one polyline per line.
  decode reads one polyline per line and prints coordinates.

Options:
  -p, --precision <n>  decimal places, 0 to 15 (default 5; OSRM polyline6
                       and Valhalla use 6)
      --lnglat         coordinates are [lng, lat], like GeoJSON (GeoJSON
                       input is always read that way)
      --no-strict      accept malformed input instead of failing
  -f, --format <fmt>   decode output: json (default), geojson, csv or lines
      --file <path>    read input from a file
  -h, --help           show this help
  -v, --version        show the version

Examples:
  polytini decode '_p~iF~ps|U_ulLnnqC_mqNvxq`@'
  polytini decode -p 6 -f geojson --file route.txt
  echo '[[38.5,-120.2],[40.7,-120.95]]' | polytini encode
  polytini encode --file points.csv
```

It has no dependencies and isn't part of the library entry points, so it adds nothing to them.

## Size

Minified and gzipped with esbuild and zlib level 9, from `node scripts/size.js`, which CI also runs with a budget per entry:

| entry | minified | gzipped |
|---|--:|--:|
| default / web (everything) | 3972 B | 1966 B |
| web, encode + decode only | 3511 B | 1759 B |
| browser (the "browser" condition) | 4854 B | 2239 B |
| node | 5324 B | 2593 B |
| bun | 5324 B | 2593 B |
| deno | 5387 B | 2463 B |
| wasm (JS glue + inlined .wasm) | 5299 B | 2799 B |
| leaflet | 4017 B | 1976 B |
| turf | 4779 B | 2228 B |
| presets | 818 B | 284 B |
| flexible | 4175 B | 2036 B |
| google | 3995 B | 1982 B |
| openlayers | 1613 B | 871 B |
| maplibre | 3107 B | 1619 B |
| mapbox | 3105 B | 1620 B |
| deckgl | 4107 B | 2026 B |
| cli | 8052 B | 3827 B |

polytini is bigger than most polyline libraries, which are about 0.6 KB gzipped. The extra goes into strict-mode errors, the exact slow path for precision 7 and up, objects, dimensions and both orders. The browser entry adds 273 bytes over the minimal web build for its TextDecoder encode; import `@duoquote/polytini/web` if you'd rather have the smaller one.

## Speed

The full tables, the method and every round are in the [benchmark repo](https://github.com/Duoquote/polyline-benchmark). This is polytini's default entry divided by the fastest other library in each column, so above 1.00x means polytini was faster:

| runtime | entry | decode 10 | decode 1k | decode 10k | decode real | encode 10 | encode 1k | encode 10k | encode real |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|
| Bun 1.4.3 | `src/bun.js` | 0.91x | 0.94x | 1.14x | 1.01x | 1.58x | 3.02x | 3.03x | 2.28x |
| Node 22 | `src/node.js` | 0.66x | 0.99x | 0.86x | 1.10x | 0.99x | 2.08x | 2.49x | 2.03x |
| Node 23 | `src/node.js` | 0.78x | 0.99x | 1.17x | 1.07x | 1.01x | 2.15x | 2.55x | 2.30x |
| Node 24 | `src/node.js` | 0.95x | 1.01x | 1.04x | 1.18x | 1.24x | 1.86x | 2.23x | 2.19x |
| Node 25 | `src/node.js` | 0.87x | 1.00x | 0.95x | 1.19x | 1.25x | 1.99x | 2.29x | 1.83x |
| Node 26 | `src/node.js` | 0.86x | 1.07x | 1.05x | 1.21x | 1.40x | 1.92x | 2.32x | 1.84x |
| Deno 2.5 | `src/deno.js` | 0.88x | 1.18x | 1.05x | 1.09x | 0.86x | 1.89x | 2.18x | 1.81x |
| Chrome 157 | `src/browser.js` | 0.84x | 1.00x | 0.93x | 1.07x | 0.85x | 1.93x | 2.24x | 2.01x |

Encoding is where the difference is: 1.8 to 3 times faster than the next library from 1,000 points up, on every runtime. Decoding is about even with `@googlemaps/polyline-codec`, ahead on the real-world lines everywhere, and behind on 10-point lines everywhere, where `@placemarkio/polyline` and `@mapbox/polyline` were fastest. A separate loop for short lines was 10 to 13% faster there, but it added 190 bytes gzipped for lines under about 12 points, so I left it out.

Between rounds a cell moved by a median of 21 to 32%, so treat anything within about 20% of 1.00x as even.

## Testing

`npm test` runs everything under Node, `npm run test:bun` and `npm run test:deno` under the others. It's 568 tests in 13 files, and the same 568 pass on Node 22 to 26, Bun 1.4.3 and Deno 2.5.4. Every codec test runs against every entry point: web, browser, node, bun, deno and wasm.

- `core.test.js`: the reference codec at precisions 0 to 13, the edge cases (0, ±90, ±180, the antimeridian, repeats, empty input, one-unit steps), every strict error code, lenient mode, options, objects and GeoJSON.
- `property.test.js`: fast-check round trips and agreement with the reference, with a fixed seed (20261126) so a failure is reproducible.
- `vectors.test.js`: 354 cases from 22 sources, other libraries' own tests and Google's, OSRM's, Valhalla's and GraphHopper's docs. Sources, licenses and attributions are in [`test/fixtures/SOURCES.md`](test/fixtures/SOURCES.md) and [`NOTICE`](test/fixtures/NOTICE). Where a source disagrees with polytini, [`DISAGREEMENTS.md`](test/fixtures/vectors/DISAGREEMENTS.md) says why. One of them is a wrong expected value in `@googlemaps/polyline-codec`'s own test.
- `postgis.test.js`: parity with PostGIS 3.7 `ST_AsEncodedPolyline` and `ST_LineFromEncodedPolyline` at precisions 0 to 15. The fixture is committed, so the tests don't need Docker. `node scripts/postgis-fixtures.js` regenerates it, and [`POSTGIS.md`](test/fixtures/POSTGIS.md) lists where PostGIS differs.
- The integration tests use the real libraries: Leaflet 1.9 and 2 in jsdom, Turf, ol 10.11, and maplibre-gl, mapbox-gl and deck.gl rendering in headless Chrome. CI also type-checks a usage file for each one against the library's own types.
- `test/smoke.js` packs the tarball and installs it with npm, pnpm (isolated, strict), Yarn 4 with Plug'n'Play, Yarn 1, Bun and Deno, then runs ESM and CommonJS imports, the CLI, `tsc` with `node16` and `bundler` resolution, and an esbuild browser bundle. The type check is skipped under Plug'n'Play, which needs Yarn's TypeScript patch; Yarn 1 covers the types for Yarn.

`npx c8 --include='src/**' node test/run.js` reports coverage under Node. The codec itself, `core.js`, `fast.js`, `web.js`, `browser.js` and `deno.js`, is at 100% of lines and branches, and all of `src/` is at 99.6% of lines. What's left:

- the V8 12 branch in `node.js`, which only Node 22 and 23 take (the tests run that path on every runtime through `fast(Buffer, 0)`)
- the `encodeInto` path in `wasm.js` for runtimes without `Buffer`, which the Deno run covers
- the scratch buffer over 1 MB in `text.js`
- a few argument-error branches in the CLI and the map integrations

## License

MIT, see [LICENSE](LICENSE).
