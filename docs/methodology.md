# How the benchmark works

The README has the results. This page has the details behind them.

## What's in the comparison

| Package | Version | Published | Downloads/week | Point shape | Precision tested |
|---|---|---|--:|---|---|
| `ol` (`ol/format/Polyline`) | 10.11.0 | 2026-10 | 1,130,036 | flat array | 5, 6 |
| `@mapbox/polyline` | 1.2.1 | 2023-09 | 916,574 | `[lat, lng]` | 5, 6 |
| `@googlemaps/polyline-codec` | 1.0.28 | 2022-05 | 106,922 | `[lat, lng]` | 5, 6 |
| `@here/flexpolyline` | 0.1.0 | 2024-03 | 52,731 | `[lat, lng]` | flexible format only |
| `google-polyline` | 2.0.0 | 2026-09 | 24,690 | `[lat, lng]` | 5 only |
| `polyline-encoded` | 0.0.9 | 2020-02 | 12,093 | `[lat, lng]` | 5, 6 |
| `@placemarkio/polyline` | 2.0.3 | 2025-12 | 6,974 | `[lng, lat]` | 5, 6 |
| `decode-google-map-polyline` | 1.0.1 | 2017-01 | 2,949 | `{lat, lng}` | 5 only, decode only |
| `@pirxpilot/google-polyline` | 4.0.1 | 2026-02 | 50 | `[lng, lat]` | 5, 6 |
| `@lp-labs/polyline-codec` | 0.1.0 | 2026-11 | 28 | `{latitude, longitude}` | 5, 6 |
| `@duoquote/polytini` | 0.1.6 | 2026-11 | new | `[lat, lng]` or `[lng, lat]` | 0 to 15 |

Downloads are from npm for 19 to 25 November 2026; polytini was first published on 27 November, after that week. Most of `ol`'s downloads are for the map library as a whole, not its polyline format, so the relative tables and charts use `@mapbox/polyline` as the 1.0x baseline: it's the most downloaded polyline library, and the one people most likely have installed.

Since 2021, `@googlemaps/polyline-codec` went from 1.0.2 to 1.0.28 and `@mapbox/polyline` from 1.1.1 to 1.2.1. `google-polyline` went from 1.0.3 to 2.0.0, which is ESM and lives on Codeberg now. `polyline-encoded` and `decode-google-map-polyline` haven't had a release since 2020 and 2017. I kept both because people still download them every week.

The two packages with tiny download counts are in because they work differently. `@pirxpilot/google-polyline` takes `[lng, lat]` and a `factor` option, and `@lp-labs/polyline-codec` is the strict `BigInt` one.

OpenLayers comes in two ways. `encodeDeltas` and `decodeDeltas` are its flat-array functions, in the typed-array tables. Its `ol/format/Polyline` class, which builds OpenLayers geometries, is compared with polytini's OpenLayers drop-in in [polytini's `bench/openlayers.js`](https://github.com/Duoquote/polytini/blob/main/bench/openlayers.js). One thing to know about `encodeDeltas`: it overwrites the array you pass in with the deltas. The benchmark copies the input before every call so each call sees the same data, and the copy is part of its time. The same thing happens in `Polyline#writeGeometry` when no projection change is involved, so writing a geometry twice gives a different string the second time.

Left out:

- `@cargoffer/polyline`: its own source says it's a bit-for-bit copy of `@mapbox/polyline` 1.2.1.
- `polyline-decode`: a TypeScript port of `polyline-encoded`, with 7 downloads a week.
- `polyline`: deprecated in favor of `@mapbox/polyline`.
- `geojson-polyline`: a wrapper around `@mapbox/polyline`.
- Other WebAssembly codecs: I couldn't find one on npm in November 2026. There are Rust crates (`polyline`, `polyline-codec`), but I didn't find a JS build of either. polytini's `/wasm` build is the only WASM row.

## Correctness

`npm test` runs every library against [`src/reference.js`](src/reference.js), a short, slow codec written to be easy to check. At precision 5 and 6, each library has to encode to the exact same string and decode to the same coordinates (within 1e-9 degrees). The cases:

- empty input
- a single point at 0,0
- negative latitudes and longitudes
- ±90 and ±180
- a line crossing the antimeridian
- repeated points, so zero deltas
- one-unit steps
- unrounded input with 9 decimals, like raw GPS fixes
- a 100,000 point line
- Google's documented example (precision 5 only)
- all 1000 real-world lines (precision 5 only)
- 3000 random lines per precision from a seeded PRNG, round-tripped through each library

Every library passes every case it supports, 600 checks in total, on Node, Bun and Deno. The batch rows are checked one line at a time. `google-polyline` and `decode-google-map-polyline` skip precision 6, and `decode-google-map-polyline` has no encoder. polytini also gets 72 more checks on its default, web and WASM entries: other precisions, strict-mode errors, `{lat, lng}` objects and GeoJSON. Its own test suite is much bigger; see [its repo](https://github.com/Duoquote/polytini). The benchmark also checks each library's output on every input before it starts timing.

Exact rounding ties are left out on purpose, because the libraries disagree there. At precision 5, `google-polyline` and `@lp-labs/polyline-codec` turn -0.000005 into 0, and the rest turn it into -1. Run `npm run behavior` to see this, the truncated-string case, an invalid character in the middle of a string, and 0.49999999999999994. That last one is the largest double below 0.5, and every library that rounds with `Math.floor(x + 0.5)` turns it into 1, because the addition itself rounds up. The reference codec used to do the same. It uses `Math.round` on the magnitude now, which is exact.

## How it's measured

- The unit is calls per second: whole `encode()` or `decode()` calls, one line each. For the real-world set that's one of its 1000 lines per call, so the batch rows, which take all 1000 in one call, are reported in lines per second to compare with them. Million points per second is in `results/*.md` too.
- The test inputs come from a seeded PRNG and use integer math only, so every runtime gets exactly the same coordinates. They're GPS-like tracks sampled at about 1 Hz, starting in Istanbul, São Paulo, Seattle and Sydney. That way negative values show up in the timed data too. The tracks also stop now and then, which gives repeated points.
- The real-world set is the CSV from 2021: 1000 lines from PostGIS `ST_AsEncodedPolyline`, 146,330 points in total, median 82 points per line.
- Each library runs in its own child process with `tinybench`, 120 ms per cell after a 60 ms warmup, and at least 8 samples. I added the separate processes after `@mapbox/polyline` decoded 10 points about 25% faster when it ran alone than after the other libraries.
- The 5 rounds are interleaved: every library runs once, then every library again, in a different shuffled order each round. A slow minute on the machine hits every library a little instead of one library a lot. I added the shuffle after a fixed order showed a 20 to 35% drop in the last two rounds for whichever libraries ran last.
- The published numbers come from `npm run bench:clean`: one runtime at a time, at high priority, pinned to logical CPUs 12 to 15 (`--jobs 1 --prio high --affinity 0xF000`), the same setup polytini's `bench/ab.js` uses. It takes about 30 minutes. `npm run bench:all` runs 3 runtimes at a time in about 10 minutes; libraries are only compared within one runtime, where they share the same conditions, so that adds noise but no bias. The spread line in each `results/*.md` says how much.
- The 27 November 2026 run used `bench:all` on a desktop with other programs busy, and a cell moved by a median of 29 to 35% between rounds. The run after it, later the same day, used `bench:clean` with my other CPU-heavy jobs paused. The machine still had its usual background, about 40% total CPU from a remote desktop session and system services, on other cores. The median spread was 5 to 7% per runtime. Three steps (Chrome, Bun and Node 22) overlapped another benchmark at first, so I ran them again once it had stopped; the committed results are from the second try.
- Short lines are repeated inside one timed call until it covers 20,000 points, so timer overhead doesn't swamp a 10 point decode.
- Inputs are built in each library's own point shape ahead of time, so flipping to `[lng, lat]` or building objects isn't part of the timing. Decode returns whatever the library returns.
- The browser runs use the same `measure()` code as the server runtimes, bundled into the page. Chrome starts once, and every library gets a fresh browser context.
- CI never runs the benchmark, because shared runners are too noisy for the numbers to mean anything.

## Memory

`bench/memory.js` measures, for every library at 100, 10,000 and 100,000 points, in a fresh process per library and 3 rounds:

- allocated per call: how much the heap plus external memory grows over a run of calls whose results are thrown away. The young generation is set to 128 MB, so no garbage collection runs in the middle.
- retained per call: the same with the results kept and a full collection before and after, which is the size of the result.

External memory covers typed arrays and WebAssembly memory, so the WASM rows include what the module grows to. It grows once to fit the biggest call and stays, so the per-call numbers don't repeat it. It runs on Node 24 and Deno only. Bun's JavaScriptCore doesn't count new allocations until a collection runs, and when I checked, its heap figures counted typed arrays twice, so Bun numbers would be wrong.

One thing it shows: a library that builds its string with `+=` returns a rope, a tree of the pieces, until something flattens it. `@mapbox/polyline`'s 100,000 point string keeps about 8 MB alive where a flat string needs 280 KB.

## Bundle size

`bench/size.js` (`npm run size`) bundles four imports per library: decode only, encode only, both, and `import * as m` for the whole entry. Each is built three ways in production mode: esbuild (minified ESM, browser platform), Rollup with node-resolve, commonjs and terser, and webpack 5. Then gzip at level 9. Every entry keeps what it imported (`globalThis.x = [decode]`), so nothing it asked for is dropped. Named imports for ES modules, the default export for the CommonJS packages, the way their READMEs show them.

Until 27 November the chart showed only the whole entry, which compared polytini's every export with other libraries' whole files. What a bundle gets depends on what it imports: tree shaking drops the rest for ES modules, and does nothing for CommonJS packages or a package that exports one object. The chart now has a panel per import, with esbuild's numbers; the tables in docs/results.md have Rollup and webpack too.

The size results use polytini 0.1.6, which made its per-import bundles smaller at the same speed (its changelog has the paired runs). The speed and memory results are still from the 27 November run with 0.1.4, and their rows say so.

## Chrome and the Maps JavaScript API

`google.maps.geometry.encoding` is the encoder and decoder in the Maps JavaScript API. It only exists after the API loads with a key, so that row only shows up when `GOOGLE_MAPS_API_KEY` is set. It ran its 5 rounds in one page, so the Maps script loaded once.

`@googlemaps/polyline-codec` is Google's own package: it lives in the [googlemaps/js-polyline-codec](https://github.com/googlemaps/js-polyline-codec) repository, and its source says "Copyright 2020 Google LLC". I couldn't find anything saying whether it shares code with the encoder inside the Maps JavaScript API, which is only shipped minified as part of the API. I also didn't find a published benchmark of `google.maps.geometry.encoding`.

<!-- google -->
In the 2026-11-26 run, `@googlemaps/polyline-codec` decoded 1.7 to 5.6 times as fast as `google.maps.geometry.encoding.decodePath` and encoded 1.0 to 1.5 times as fast as `encodePath`, depending on the line length. On the real-world lines that's 463k against 270k decodes per second. Part of the decode gap is the output: `decodePath` returns `google.maps.LatLng` objects, which cost more to create than arrays. If you only need the geometry functions, the npm package is faster and doesn't need the Maps script.
<!-- /google -->

## Running it

```sh
npm ci
npm test
npm run bench:quick   # about a minute, writes nothing
npm run bench:all     # everything, about 10 minutes, writes results/
npm run bench:clean   # the same one step at a time, pinned, about 30 minutes (Windows)
npm run charts        # docs/charts and docs/badges from results/
node bench/readme.js  # the tables in README.md and docs/results.md
```

Single runtimes: `npm run bench`, `bench:bun`, `bench:deno`, `bench:browser` (needs Chrome installed) and `bench:flexible`, plus `npm run size`. Options go after `--`, for example `npm run bench -- --precision 6 --only google`:

- `--precision 5` or `6`
- `--time 120`: milliseconds per cell
- `--rounds 5`
- `--only <text>`: only libraries whose name contains it
- `--no-write`: print the tables without saving them

For the `google.maps.geometry.encoding` row, set `GOOGLE_MAPS_API_KEY` to a Maps JavaScript API key that allows `http://127.0.0.1/*` as a referrer. Without it the row is skipped. The key only goes into the page served from memory, never into a file, and the run fails if it shows up in a result file. `--quick` never loads the Maps script.

I've only run the benchmark on Windows. CI runs the correctness tests on Ubuntu with Node 22, 24 and 26, Bun and Deno.

## Updating polytini

polytini comes from npm at an exact version, like every other library. Before 0.1.4 it came from its GitHub repository at a fixed commit, because it wasn't published yet; the 27 November run used 0.1.0 that way. To move to a new release:

```sh
npm install --save-exact @duoquote/polytini@<version>
```

The adapters import `@duoquote/polytini` and its subpaths, and the version in each row's name comes from the installed package.json, so nothing else changes. Then update the version in the library table above.
