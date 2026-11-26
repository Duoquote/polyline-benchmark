# Test vector sources

The files in `vectors/` hold encode and decode cases taken from other
polyline libraries, routing engines and Google's documentation.
`test/vectors.test.js` runs every case against every polytini entry point and
checks the cases that fit `test/reference.js` against it as well.
`vectors/DISAGREEMENTS.md` explains where the sources disagree with each other
or with polytini. License texts and attributions are in `NOTICE`.

All sources were read on 2026-11-26. Test data was copied only from projects
under MIT, BSD, Apache-2.0, ISC or CC BY 4.0. Where a project's license did not
allow copying (LGPL-3.0), the cases were written from scratch and nothing was
copied.

## File format

Each file is `{ "source": { name, url, version, license, files }, "cases": [...] }`.
A case has:

- `name`, and `op`: `"encode"` or `"decode"`.
- `input`: points for encode (`[a, b]` tuples or `{lat, lng}`-style objects),
  a string for decode. JSON has no NaN, Infinity or -0, so encode inputs spell
  them as the strings `"NaN"`, `"Infinity"`, `"-Infinity"` and `"-0"`; the test
  turns them into numbers.
- `options`: passed to polytini unchanged (a precision number or an options
  object). Missing means the defaults.
- `expected`: the source's result. Decode results are in the order the options
  give (`[lat, lng]` by default, `[lng, lat]` with `order: "lnglat"`).
- `throws`: the PolylineError code polytini gives in strict mode, or `true`
  where the source throws and polytini does something else.
- `tolerance`: only where the source's expected values are rounded or carry
  floating-point error. The test uses 1e-9 otherwise.
- `polytini`: only where polytini deliberately differs from the source:
  `{ expected }` or `{ throws }` with polytini's result. The test checks this
  instead of the source value.
- `note`: why a case looks the way it does.

"Derived" below means the source asserts something weaker than an exact value
(a round trip, a point count, the first and last points), and the exact
expected value was computed with `test/reference.js` (or an n-dimensional
version of it for 1D and 3D cases). Each derived case says so in its `note`.
The second half of a round trip (for example decoding a derived string back to
the source's points) uses the source's points as `expected`.

## Sources

| File | Source | Version | License | Cases | Taken |
| --- | --- | --- | --- | --- | --- |
| `google-algorithm-docs.json` | [Encoded Polyline Algorithm Format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) | page last updated 2026-11-09 | CC BY 4.0 (text), Apache-2.0 (code samples) | 7 | The three-point example, the step-by-step value -179.9832104, and the per-point strings of the example table. |
| `googlemaps-js-polyline-codec.json` | [googlemaps/js-polyline-codec](https://github.com/googlemaps/js-polyline-codec) (`@googlemaps/polyline-codec`) | commit d0b4f42f6409d7e4d68f317578cf23c61c5ed939 | Apache-2.0 | 19 (3 derived) | Every encode and decode test in `src/index.test.ts`, and the 17-point snapshot in `src/__snapshots__/index.test.ts.snap`. |
| `android-maps-utils.json` | [googlemaps/android-maps-utils](https://github.com/googlemaps/android-maps-utils) `PolyUtil` | commit e261b7a0447e868d0e9d2f653ed9052babbde83d | Apache-2.0 | 5 (3 derived) | `TEST_LINE`, `LINE` and `OVAL_POLYGON` from `PolyUtilTest.java`, with the decode and round-trip tests. |
| `google-maps-services-java.json` | [googlemaps/google-maps-services-java](https://github.com/googlemaps/google-maps-services-java) `PolylineEncoding` | commit 95e5b243ad02bdf9bd6b6b0d3b86194522c3ff43 | Apache-2.0 | 2 (1 derived) | The Sydney to Melbourne route from `PolylineEncodingTest.java` (decode, round trip). |
| `google-maps-services-python.json` | [googlemaps/google-maps-services-python](https://github.com/googlemaps/google-maps-services-python) `googlemaps.convert` | commit d3b71ab1333cff0f900d2db6b39c1356341a5ea2 | Apache-2.0 | 3 (2 derived) | The Sydney to Melbourne route and the round-trip string from `tests/test_convert.py`. |
| `google-maps-services-go.json` | [googlemaps/google-maps-services-go](https://github.com/googlemaps/google-maps-services-go) | commit 8f182180c61d5b26d547705e2addf1dd3de7ffbd | Apache-2.0 | 4 (1 derived) | `routeSydMel` and `routeWith0b` with their expected points from `polyline_test.go`. |
| `mapbox-polyline.json` | [mapbox/polyline](https://github.com/mapbox/polyline) (`@mapbox/polyline`) | commit 5e797bf9cdf46db94bc3290b0e4d39e6db5a51c9 | BSD-3-Clause | 21 (4 derived) | Every encode, decode, identity and GeoJSON test in `test/polyline.test.js` (GeoJSON tests as encode/decode with `order: "lnglat"`). |
| `placemark-polyline.json` | [placemark/polyline](https://github.com/placemark/polyline) (`@placemarkio/polyline`) | commit 0a5e01120d6996d59e52bc8b06fea94e7986466c (npm 2.0.3) | MIT | 22 (2 derived) | Every test in `__tests__/index.test.ts`, in its `[lng, lat]` order. |
| `google-polyline.json` | [jhermsmeier/node-google-polyline](https://codeberg.org/jhermsmeier/node-google-polyline) (`google-polyline`) | npm 2.0.0, commit 89413da279b0853d3a6ba4011285f6ab0fe1d145 | MIT | 5 | `test/examples.js` and the 334-point `test/data/example-01.json` sample. |
| `pirxpilot-google-polyline.json` | [pirxpilot/google-polyline](https://github.com/pirxpilot/google-polyline) (`@pirxpilot/google-polyline`) | npm 4.0.1, commit cabde334b1e02437f12e8708901171b89ee46371 | MIT | 8 | `test/examples.js` and its `[lng, lat]` copy of `example-01.json`. |
| `polyline-encoded.json` | [jieter/Leaflet.encoded](https://github.com/jieter/Leaflet.encoded) (`polyline-encoded`) | commit c186c7c75d9d255abb8ac342ad52d4ac0c25ca02 (npm 0.0.9 was published from cc459ab) | MIT | 18 (3 derived) | `test/test.js` (2D, precision 6, 1D integers and floats, 3D) and `test/testcases/issue5.json`. |
| `decode-google-map-polyline.json` | [decode-google-map-polyline](https://www.npmjs.com/package/decode-google-map-polyline) | npm 1.0.1 | ISC (declared in package.json; no LICENSE file) | 3 (3 derived) | The three polylines in `test.js`. The test only prints its results, so all expected values are derived. |
| `lp-labs-polyline-codec.json` | [@lp-labs/polyline-codec](https://www.npmjs.com/package/@lp-labs/polyline-codec) | npm 0.1.0 | MIT | 7 (5 written) | The README example. The package ships no tests, so 5 cases were written from the behavior its README describes (tie rounding, overlong values, range checks, precision limit, truncation). |
| `python-polyline.json` | [frederickjansen/polyline](https://github.com/frederickjansen/polyline) (PyPI `polyline`) | commit 5c5b063cdf0df884a3bb05d8cab492ae53c72e04 (latest tag v2.0.5) | MIT | 21 | Every fixed test in `tests/test_polyline.py`. |
| `georust-polyline.json` | [georust/polyline](https://github.com/georust/polyline) (crate `polyline`) | 0.11.0, commit 7fc654d463a0a7a0b5c23bb4b2ba34b4ac60d73a | MIT OR Apache-2.0, used under MIT | 18 (1 derived) | Every test in the `tests` module of `src/lib.rs`, including the 23 KB `route-geometry-sweden-west-coast.polyline6` resource (4894 points). |
| `go-polyline.json` | [twpayne/go-polyline](https://github.com/twpayne/go-polyline) | commit 15b67cd55e490dabe4c60ba8935cf0682f4331be (latest tag v1.1.2) | BSD-2-Clause | 62 | `TestUint`, `TestInt` (as 1D cases at precision 0), `TestCoord`, `TestCoords`, `TestCodec`, the error tests and the examples from `polyline_test.go` and `example_test.go`. |
| `ruby-polylines.json` | [joshuaclayton/polylines](https://github.com/joshuaclayton/polylines) (gem `polylines`) | 0.4.0, commit 901c0d47baabc81725603d52fce8d95c0b76cca6 | MIT | 14 (1 derived) | Every case in `spec/polylines/decoder_spec.rb` and `encoder_spec.rb`. |
| `php-written.json` | [emcconville/google-map-polyline-encoding-tool](https://github.com/emcconville/google-map-polyline-encoding-tool) | behavior of commit c584626e77228380d09deb1bac4bfeaa701b7a1e | LGPL-3.0: nothing copied; cases written for polytini | 4 (written) | Own cases covering what the PHP tests cover: a short street path with a repeated point, its decode, and PHP `round()` ties. |
| `osrm.json` | [Project-OSRM/osrm-backend](https://github.com/Project-OSRM/osrm-backend) | commit 578a12065917e02bf14bb4568f12a2d3c388ba15 (latest tag v26.11.0) | BSD-2-Clause | 18 (3 derived) | Every test in `unit_tests/engine/polyline_compressor.cpp` (polyline and polyline6). |
| `valhalla.json` | [valhalla/valhalla](https://github.com/valhalla/valhalla) | commit 4d8b2061b566412ce61eb8a2001b7cfa2392356a | MIT | 48 | The 2 plain `encode` checks and all 23 `do_polyline_pair` / `do_polyline_pair5` cases in `test/encode.cc`, each as an encode and a decode case. |
| `graphhopper.json` | [graphhopper/graphhopper](https://github.com/graphhopper/graphhopper) | commit ce72e96197eb16fcc3ab4f18fdd543fa270be9d5 | Apache-2.0 (NOTICE.md reproduced in `NOTICE`) | 13 (2 derived) | Every test in `web-api/.../ResponsePathRepresentationTest.java`, including the elevation cases (third value in centimeters, `zFactor: 100`). |
| `issues.json` | Bug reports: [georust/polyline#55](https://github.com/georust/polyline/issues/55), [#27](https://github.com/georust/polyline/issues/27), [#39](https://github.com/georust/polyline/issues/39), [mapbox/polyline#38](https://github.com/mapbox/polyline/issues/38), [#80](https://github.com/mapbox/polyline/issues/80), [frederickjansen/polyline#4](https://github.com/frederickjansen/polyline/issues/4), [jieter/Leaflet.encoded#5](https://github.com/jieter/Leaflet.encoded/issues/5) | read 2026-11-26 | MIT (written for polytini) | 32 (written) | Own cases for the behavior those reports describe (truncation, stray line feeds and quotes, URL-encoded strings, 32-bit overflow at precision 7, NaN input), plus -0, values past 2^53, rounding ties, decimal near-ties and option errors. No issue text or data was copied. |

Total: 354 cases.

## Skipped

- PostGIS and HERE flexible polyline: covered elsewhere.
- Mapbox Directions API examples: the Mapbox documentation is not under an
  open license, and its geometries use the same polyline and polyline6
  formats that the OSRM vectors cover.
- emcconville/google-map-polyline-encoding-tool (PHP): LGPL-3.0, so its points
  and strings were not copied; see `php-written.json`.
- `@pirxpilot/google-polyline` `test/data/usa.txt` (129 KB): its test only
  compares the library with `polyline-encoded`, and a point list would add
  about 1 MB. The 23 KB Sweden route from georust covers long inputs.
- API features polytini does not have: `@pirxpilot/google-polyline`'s
  `prefix`, `start` and `end` options, `@mapbox/polyline`'s error for
  `fromGeoJSON({})`, go-polyline's `DecodeFlatCoords` buffer-size errors,
  GraphHopper's `multiplier < 1` error, Valhalla's 7-bit varint format
  (`encode7`), and the simplify, polygon and format_float tests of
  android-maps-utils and google-maps-services-python.
- Randomized round-trip tests (Python polyline, go-polyline quick checks):
  no fixed data.
- go-polyline's 32-bit variants of `TestUint`, `TestInt` and `TestDecodeErrors`:
  only the 64-bit (`strconv.IntSize == 64`) strings were taken.
