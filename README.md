# polyline-benchmark

Benchmarks for JavaScript libraries that encode and decode Google's [encoded polyline format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm). That's the string you get back for route geometry from Google Maps, OSRM, Valhalla and GraphHopper. Before any library gets timed, it has to pass the same correctness test as the others.

I made the first version in September 2021. It only timed decoding, in five libraries, with `nanobench` and one CSV of 1000 lines. In November 2026 we rebuilt it:

- encode and decode are both timed, on six inputs from 10 points up to 100,000, plus the original 1000 lines
- it runs on Bun, Node 22 to 26, Deno and headless Chrome, with exact versions pinned in `package-lock.json`
- every library is checked against a small reference codec before it's timed
- [polytini](packages/polytini), a codec I wrote while doing this, is in the comparison too

polytini lives in [`packages/polytini`](packages/polytini) for now and has its own README. It will move to its own repository. It's in the tables in bold, and it goes through the same harness, inputs and checks as every other library.

## Which one should I use?

I wrote polytini, so take this part with that in mind. It went through the same harness, inputs and checks as every other library, and what follows is what the run measured, losses included.

- Encoding a lot, like GPS traces on a server: polytini. From 1,000 points up it encoded 1.5 to 7.7 times faster than the fastest other library, on every runtime here. At 100 points it was 1.7 to 2.8 times faster on Bun and Node, and about even in Deno and Chrome. At 10 points it was ahead on Bun and Node 24 to 26, even on Node 22 and 23, and 14 to 15% behind in Deno and Chrome.
- Decoding: polytini and `@googlemaps/polyline-codec` are about even. polytini was ahead on the real-world lines everywhere (1.01 to 1.21 times). From 100 to 100,000 points the other columns went both ways, from 0.76 to 1.22 times the fastest other library, and most of those gaps are inside the noise. On Node 22 it lost every decode column but the real-world one. On 10-point lines, `@placemarkio/polyline` and `@mapbox/polyline` were faster than both, and 5 to 52% faster than polytini.
- The smallest bundle: `@googlemaps/polyline-codec` (568 B gzipped), or `@placemarkio/polyline` (580 B) if you want `[lng, lat]`. polytini is 2.0 KB. Google's package decodes fast, but it encoded 3 to 5 times slower than the fastest other encoder (2 times in Chrome).
- Bad input should fail loudly: polytini, which is strict by default. `@lp-labs/polyline-codec` is strict too, but it decoded 15 to 24 times slower than the fastest decoder.
- Precision 6 (OSRM `polyline6`, Valhalla): anything here except `google-polyline` and `decode-google-map-polyline`.
- HERE Flexible Polyline: polytini's `/flexible` was 12 to 72 times faster than `@here/flexpolyline`. It also reads HERE's own test data at precision 11 and up, where `@here/flexpolyline` fails those tests.
- I'd avoid `decode-google-map-polyline`, which decoded 24 to 47 times slower than the fastest decoder, and `polyline-encoded`, which encoded 17 to 40 times slower and throws on `{lat, lng}` objects with a 0 in them.

## Results

Measured on 26 November 2026 on my machine: AMD Ryzen 7 5800X (8 cores, 16 threads), 64 GB RAM, Windows 11 (build 26300).

Numbers are million points per second, so higher is better. Each cell is the median of 5 rounds, and every round runs in a fresh process (a fresh browser context for Chrome). Rows are sorted by the 10,000 point column. The full tables for each runtime, plus every single round, are in [`results/`](results).

For polytini there are a few rows:

- `@duoquote/polytini@0.1.0` is what a plain `import` gives you on that runtime. Which file that is depends on the export conditions, and the line above each table says which one it resolved to.
- `(web entry)` is the minimal portable build, the `default` condition, so you can see what the runtime-specific code adds.
- `(wasm)` is the opt-in WebAssembly build, including the cost of copying the string in and the numbers out.
- The typed-array tables are separate, because a flat `Float64Array` skips building one array per point. Those numbers aren't comparable with the main tables. OpenLayers' `encodeDeltas`/`decodeDeltas` work on flat arrays too, so they're in that group.

Don't read much into small gaps. The whole run takes 10 minutes, with three runtimes sharing the machine at a time and the usual background apps running. Between rounds, a cell moved by a median of 21 to 32% depending on the runtime (the line above each table has the exact numbers). So a gap under about 20% between the top libraries isn't a reliable ranking, and a rerun can flip it. The big gaps are the same on every runtime, though, and those are what the section above is based on.

### Bun

<!-- results:bun -->
Bun v1.4.3, 2026-11-26. `@duoquote/polytini` resolved to `src/bun.js`. Between rounds, a cell moved by a median of 32%, and 104% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 82.0 | 105 | 94.1 | 105 | 82.6 | 51.5 |
| @googlemaps/polyline-codec@1.0.28 | 82.6 | 89.0 | 100 | 92.5 | 84.1 | 50.9 |
| @mapbox/polyline@1.2.1 | 74.8 | 66.0 | 71.8 | 79.3 | 58.6 | 40.3 |
| **@duoquote/polytini@0.1.0 (web entry)** | 92.5 | 113 | 117 | 78.0 | 81.2 | 59.3 |
| @placemarkio/polyline@2.0.3 | 89.9 | 83.1 | 82.9 | 77.9 | 65.3 | 47.1 |
| google-polyline@2.0.0 | 84.8 | 78.2 | 62.8 | 66.2 | 69.9 | 44.0 |
| **@duoquote/polytini@0.1.0 (wasm)** | 67.7 | 80.3 | 77.4 | 65.1 | 64.2 | 57.4 |
| @pirxpilot/google-polyline@4.0.1 | 33.8 | 39.9 | 39.1 | 38.5 | 28.0 | 21.2 |
| polyline-encoded@0.0.9 | 32.5 | 19.6 | 24.3 | 19.8 | 17.1 | 14.9 |
| decode-google-map-polyline@1.0.1 | 3.42 | 3.76 | 4.10 | 3.92 | 3.04 | 3.48 |
| @lp-labs/polyline-codec@0.1.0 | 4.17 | 3.94 | 4.00 | 3.84 | 2.40 | 2.92 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 82.9 | 178 | 185 | 159 | 156 | 73.7 |
| **@duoquote/polytini@0.1.0 (wasm)** | 55.9 | 106 | 109 | 89.7 | 84.0 | 44.0 |
| **@duoquote/polytini@0.1.0 (web entry)** | 45.2 | 70.4 | 65.7 | 69.7 | 50.5 | 45.7 |
| google-polyline@2.0.0 | 52.5 | 56.7 | 59.6 | 52.4 | 38.7 | 29.8 |
| @pirxpilot/google-polyline@4.0.1 | 52.4 | 64.5 | 61.3 | 45.4 | 45.1 | 32.3 |
| @mapbox/polyline@1.2.1 | 31.7 | 33.1 | 31.5 | 29.9 | 16.5 | 19.2 |
| @placemarkio/polyline@2.0.3 | 32.1 | 41.8 | 38.6 | 29.8 | 16.8 | 20.7 |
| @googlemaps/polyline-codec@1.0.28 | 13.1 | 18.0 | 16.4 | 17.0 | 13.3 | 11.4 |
| @lp-labs/polyline-codec@0.1.0 | 4.16 | 4.36 | 4.24 | 3.74 | 2.33 | 2.23 |
| polyline-encoded@0.0.9 | 2.27 | 3.02 | 3.01 | 2.67 | 2.53 | 2.27 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 73.0 | 168 | 168 | 162 | 157 | 89.2 |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 110 | 197 | 184 | 159 | 149 | 90.2 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 83.9 | 88.3 | 77.2 | 75.6 | 64.8 | 43.1 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 84.5 | 164 | 200 | 173 | 163 | 87.2 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 56.8 | 121 | 128 | 107 | 91.7 | 53.6 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 29.3 | 30.2 | 29.0 | 26.6 | 16.3 | 17.0 |
<!-- /results:bun -->

### Node

Node 25 is the version installed on the machine. The others ran through `npx -p node@<version>`.

<details open>
<summary>Node 24 (LTS)</summary>

<!-- results:node-24 -->
Node v24.22.3, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds, a cell moved by a median of 25%, and 61% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 77.1 | 103 | 90.1 | 86.3 | 64.1 | 57.6 |
| @googlemaps/polyline-codec@1.0.28 | 69.9 | 102 | 89.5 | 83.3 | 62.5 | 48.9 |
| **@duoquote/polytini@0.1.0 (web entry)** | 68.4 | 84.9 | 86.1 | 81.1 | 54.9 | 50.9 |
| @placemarkio/polyline@2.0.3 | 81.3 | 75.3 | 62.4 | 68.5 | 43.8 | 46.4 |
| @mapbox/polyline@1.2.1 | 77.5 | 69.9 | 64.5 | 67.6 | 44.5 | 43.1 |
| **@duoquote/polytini@0.1.0 (wasm)** | 45.0 | 63.9 | 67.4 | 63.6 | 50.0 | 51.6 |
| google-polyline@2.0.0 | 66.8 | 65.8 | 59.3 | 56.7 | 43.6 | 44.2 |
| @pirxpilot/google-polyline@4.0.1 | 58.3 | 55.7 | 49.5 | 53.1 | 40.3 | 39.8 |
| polyline-encoded@0.0.9 | 15.4 | 17.6 | 16.9 | 15.4 | 11.9 | 14.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.35 | 6.19 | 6.00 | 4.66 | 3.80 | 4.39 |
| decode-google-map-polyline@1.0.1 | 1.50 | 2.40 | 2.69 | 2.82 | 1.85 | 2.46 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 57.3 | 106 | 117 | 109 | 99.6 | 64.7 |
| **@duoquote/polytini@0.1.0 (wasm)** | 46.5 | 101 | 108 | 86.0 | 61.9 | 36.2 |
| **@duoquote/polytini@0.1.0 (web entry)** | 39.9 | 59.9 | 65.9 | 66.1 | 57.5 | 51.1 |
| @pirxpilot/google-polyline@4.0.1 | 46.4 | 56.4 | 63.1 | 49.2 | 42.8 | 29.6 |
| google-polyline@2.0.0 | 43.6 | 61.7 | 59.6 | 46.6 | 43.2 | 28.8 |
| @placemarkio/polyline@2.0.3 | 33.7 | 52.4 | 49.9 | 43.1 | 33.2 | 23.7 |
| @mapbox/polyline@1.2.1 | 32.3 | 45.6 | 42.3 | 33.8 | 24.4 | 21.7 |
| @googlemaps/polyline-codec@1.0.28 | 16.8 | 16.5 | 18.0 | 10.4 | 8.15 | 11.2 |
| @lp-labs/polyline-codec@0.1.0 | 7.18 | 8.34 | 7.20 | 5.50 | 4.06 | 4.01 |
| polyline-encoded@0.0.9 | 2.22 | 2.41 | 2.39 | 2.30 | 2.03 | 1.56 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 15.9 | 64.9 | 80.9 | 86.2 | 94.0 | 40.5 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 13.3 | 56.1 | 70.7 | 83.6 | 102 | 45.6 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 38.9 | 55.5 | 48.5 | 40.6 | 33.5 | 29.9 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 55.8 | 112 | 128 | 118 | 96.9 | 73.4 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 45.7 | 116 | 126 | 102 | 85.0 | 53.5 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 31.3 | 49.6 | 45.7 | 34.5 | 31.1 | 23.8 |
<!-- /results:node-24 -->

</details>

<details>
<summary>Node 22</summary>

<!-- results:node-22 -->
Node v22.23.5, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds, a cell moved by a median of 29%, and 69% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 60.5 | 87.6 | 73.6 | 85.5 | 16.7 | 48.3 |
| **@duoquote/polytini@0.1.0** | 47.8 | 75.9 | 73.1 | 73.4 | 20.7 | 53.2 |
| **@duoquote/polytini@0.1.0 (web entry)** | 65.7 | 85.3 | 80.0 | 72.9 | 18.0 | 46.6 |
| **@duoquote/polytini@0.1.0 (wasm)** | 48.2 | 63.2 | 63.7 | 66.7 | 15.2 | 46.1 |
| google-polyline@2.0.0 | 68.1 | 68.2 | 51.5 | 63.6 | 27.2 | 41.3 |
| @placemarkio/polyline@2.0.3 | 72.7 | 74.1 | 64.6 | 59.7 | 20.0 | 41.9 |
| @mapbox/polyline@1.2.1 | 70.6 | 64.7 | 55.6 | 57.6 | 26.7 | 38.0 |
| @pirxpilot/google-polyline@4.0.1 | 53.8 | 63.9 | 52.3 | 55.4 | 21.9 | 36.6 |
| polyline-encoded@0.0.9 | 15.7 | 16.1 | 14.3 | 12.7 | 4.58 | 13.7 |
| @lp-labs/polyline-codec@0.1.0 | 4.79 | 6.19 | 4.96 | 4.05 | 2.63 | 4.31 |
| decode-google-map-polyline@1.0.1 | 1.13 | 1.62 | 1.92 | 1.82 | 1.13 | 1.32 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 47.0 | 107 | 124 | 113 | 97.5 | 61.9 |
| **@duoquote/polytini@0.1.0 (wasm)** | 35.0 | 73.5 | 82.3 | 71.4 | 62.3 | 37.3 |
| **@duoquote/polytini@0.1.0 (web entry)** | 33.8 | 51.7 | 60.0 | 62.5 | 29.8 | 52.5 |
| @pirxpilot/google-polyline@4.0.1 | 33.8 | 49.1 | 50.2 | 45.4 | 13.8 | 30.5 |
| google-polyline@2.0.0 | 47.2 | 63.6 | 59.5 | 43.1 | 12.8 | 27.1 |
| @placemarkio/polyline@2.0.3 | 32.2 | 35.5 | 47.5 | 39.7 | 11.4 | 24.8 |
| @mapbox/polyline@1.2.1 | 27.4 | 43.3 | 41.3 | 36.7 | 10.8 | 21.4 |
| @googlemaps/polyline-codec@1.0.28 | 13.6 | 18.2 | 15.8 | 9.18 | 8.34 | 9.66 |
| @lp-labs/polyline-codec@0.1.0 | 6.89 | 8.28 | 7.02 | 5.91 | 2.98 | 3.72 |
| polyline-encoded@0.0.9 | 1.46 | 1.59 | 1.30 | 1.15 | 1.01 | 1.01 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 13.4 | 57.0 | 71.0 | 75.2 | 92.4 | 38.7 |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 12.2 | 56.7 | 71.4 | 72.2 | 86.1 | 33.7 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 49.2 | 52.6 | 49.9 | 39.9 | 32.1 | 32.5 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 38.6 | 106 | 123 | 119 | 98.8 | 67.5 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 35.3 | 80.7 | 91.3 | 80.1 | 69.1 | 49.5 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 23.3 | 46.3 | 41.3 | 24.9 | 9.56 | 20.6 |
<!-- /results:node-22 -->

</details>

<details>
<summary>Node 23</summary>

<!-- results:node-23 -->
Node v23.11.1, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds, a cell moved by a median of 24%, and 67% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 74.5 | 91.8 | 98.2 | 95.8 | 25.7 | 54.3 |
| @googlemaps/polyline-codec@1.0.28 | 65.2 | 78.2 | 99.0 | 81.6 | 19.2 | 50.9 |
| @mapbox/polyline@1.2.1 | 95.0 | 78.6 | 74.7 | 70.5 | 24.9 | 44.2 |
| @placemarkio/polyline@2.0.3 | 80.8 | 81.4 | 59.6 | 67.7 | 23.0 | 46.1 |
| **@duoquote/polytini@0.1.0 (wasm)** | 46.4 | 69.7 | 70.2 | 67.4 | 19.1 | 46.3 |
| **@duoquote/polytini@0.1.0 (web entry)** | 70.0 | 82.8 | 83.5 | 66.8 | 16.7 | 50.6 |
| google-polyline@2.0.0 | 78.6 | 73.0 | 60.6 | 59.3 | 21.8 | 40.3 |
| @pirxpilot/google-polyline@4.0.1 | 58.8 | 72.2 | 59.6 | 55.9 | 19.1 | 35.4 |
| polyline-encoded@0.0.9 | 17.2 | 19.4 | 19.5 | 14.2 | 5.30 | 15.7 |
| @lp-labs/polyline-codec@0.1.0 | 5.10 | 6.49 | 5.90 | 4.70 | 2.59 | 3.95 |
| decode-google-map-polyline@1.0.1 | 1.19 | 1.97 | 2.21 | 1.74 | 1.15 | 1.63 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 47.0 | 106 | 123 | 113 | 93.1 | 61.5 |
| **@duoquote/polytini@0.1.0 (wasm)** | 42.4 | 115 | 130 | 108 | 78.1 | 46.2 |
| **@duoquote/polytini@0.1.0 (web entry)** | 34.8 | 60.9 | 67.3 | 67.7 | 29.8 | 50.0 |
| @pirxpilot/google-polyline@4.0.1 | 37.7 | 53.7 | 56.9 | 44.4 | 12.1 | 26.8 |
| google-polyline@2.0.0 | 46.5 | 57.9 | 55.5 | 43.0 | 11.5 | 25.2 |
| @placemarkio/polyline@2.0.3 | 31.6 | 47.6 | 48.2 | 39.7 | 9.94 | 23.4 |
| @mapbox/polyline@1.2.1 | 27.5 | 42.8 | 39.0 | 32.8 | 10.5 | 22.0 |
| @googlemaps/polyline-codec@1.0.28 | 14.0 | 20.5 | 16.5 | 11.0 | 8.05 | 11.1 |
| @lp-labs/polyline-codec@0.1.0 | 6.22 | 8.43 | 7.21 | 5.57 | 3.15 | 3.74 |
| polyline-encoded@0.0.9 | 1.72 | 1.85 | 1.83 | 1.69 | 1.16 | 1.14 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 14.3 | 57.0 | 70.0 | 77.9 | 93.1 | 32.9 |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 15.4 | 56.5 | 74.2 | 72.5 | 88.9 | 39.2 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 56.0 | 55.4 | 55.0 | 40.0 | 32.5 | 32.8 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 44.1 | 141 | 162 | 131 | 99.6 | 56.1 |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 47.8 | 110 | 121 | 119 | 100.0 | 66.0 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 26.0 | 47.6 | 45.2 | 34.8 | 11.6 | 23.0 |
<!-- /results:node-23 -->

</details>

<details>
<summary>Node 25</summary>

<!-- results:node-25 -->
Node v25.2.1, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds, a cell moved by a median of 25%, and 74% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 71.5 | 89.2 | 92.3 | 91.5 | 64.8 | 51.6 |
| **@duoquote/polytini@0.1.0** | 70.3 | 93.6 | 92.7 | 87.0 | 75.8 | 61.5 |
| **@duoquote/polytini@0.1.0 (web entry)** | 67.5 | 83.7 | 79.4 | 76.3 | 49.8 | 50.8 |
| @mapbox/polyline@1.2.1 | 80.5 | 70.6 | 68.4 | 65.9 | 39.9 | 46.3 |
| **@duoquote/polytini@0.1.0 (wasm)** | 49.2 | 70.6 | 68.8 | 63.4 | 51.6 | 51.3 |
| @placemarkio/polyline@2.0.3 | 73.1 | 66.2 | 60.6 | 62.1 | 39.7 | 46.4 |
| google-polyline@2.0.0 | 65.6 | 59.3 | 49.1 | 58.9 | 43.6 | 41.5 |
| @pirxpilot/google-polyline@4.0.1 | 51.7 | 56.3 | 52.2 | 53.4 | 40.9 | 37.1 |
| polyline-encoded@0.0.9 | 16.3 | 18.8 | 15.6 | 14.8 | 9.71 | 11.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.06 | 6.35 | 5.99 | 5.30 | 3.75 | 4.58 |
| decode-google-map-polyline@1.0.1 | 1.52 | 2.69 | 2.90 | 2.75 | 1.85 | 2.61 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 60.1 | 113 | 123 | 114 | 89.0 | 57.3 |
| **@duoquote/polytini@0.1.0 (wasm)** | 47.2 | 95.8 | 110 | 92.8 | 63.7 | 43.7 |
| **@duoquote/polytini@0.1.0 (web entry)** | 44.4 | 63.9 | 67.2 | 68.2 | 58.6 | 51.9 |
| @pirxpilot/google-polyline@4.0.1 | 48.0 | 59.8 | 61.8 | 49.7 | 40.8 | 31.3 |
| @placemarkio/polyline@2.0.3 | 37.3 | 51.9 | 50.1 | 41.3 | 33.9 | 23.9 |
| google-polyline@2.0.0 | 46.6 | 60.9 | 58.0 | 40.1 | 39.4 | 29.4 |
| @mapbox/polyline@1.2.1 | 33.7 | 47.2 | 43.5 | 36.6 | 33.7 | 21.9 |
| @googlemaps/polyline-codec@1.0.28 | 16.2 | 21.0 | 18.1 | 13.8 | 11.4 | 11.6 |
| @lp-labs/polyline-codec@0.1.0 | 7.00 | 7.67 | 7.13 | 6.57 | 4.36 | 3.97 |
| polyline-encoded@0.0.9 | 2.19 | 2.20 | 2.22 | 2.11 | 2.08 | 1.55 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 15.5 | 58.6 | 72.6 | 84.9 | 98.3 | 42.2 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 14.0 | 56.0 | 64.9 | 81.0 | 99.8 | 44.4 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 38.9 | 54.6 | 51.6 | 41.7 | 34.0 | 33.4 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 60.1 | 114 | 124 | 115 | 94.8 | 71.9 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 47.4 | 118 | 124 | 95.1 | 85.5 | 56.2 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 28.9 | 53.4 | 45.1 | 35.2 | 30.7 | 23.9 |
<!-- /results:node-25 -->

</details>

<details>
<summary>Node 26</summary>

<!-- results:node-26 -->
Node v26.13.1, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds, a cell moved by a median of 21%, and 59% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 73.5 | 99.5 | 97.7 | 90.6 | 74.1 | 60.8 |
| @googlemaps/polyline-codec@1.0.28 | 73.9 | 93.9 | 91.4 | 86.1 | 60.6 | 50.3 |
| **@duoquote/polytini@0.1.0 (web entry)** | 71.8 | 92.4 | 88.2 | 79.8 | 60.1 | 51.6 |
| @placemarkio/polyline@2.0.3 | 85.2 | 81.1 | 65.9 | 71.5 | 60.2 | 46.5 |
| @mapbox/polyline@1.2.1 | 77.0 | 71.8 | 62.7 | 70.1 | 54.6 | 45.5 |
| **@duoquote/polytini@0.1.0 (wasm)** | 50.0 | 70.0 | 70.7 | 68.7 | 50.4 | 52.8 |
| google-polyline@2.0.0 | 70.4 | 63.4 | 63.3 | 66.8 | 49.9 | 43.0 |
| @pirxpilot/google-polyline@4.0.1 | 52.3 | 52.2 | 55.0 | 53.5 | 38.0 | 36.5 |
| polyline-encoded@0.0.9 | 19.8 | 18.4 | 17.3 | 17.4 | 7.51 | 14.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.77 | 6.81 | 6.04 | 5.56 | 2.96 | 4.42 |
| decode-google-map-polyline@1.0.1 | 1.68 | 3.25 | 3.49 | 3.59 | 1.95 | 3.14 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 63.7 | 116 | 119 | 112 | 93.4 | 55.9 |
| **@duoquote/polytini@0.1.0 (wasm)** | 51.1 | 105 | 110 | 95.1 | 72.5 | 47.1 |
| **@duoquote/polytini@0.1.0 (web entry)** | 44.0 | 65.1 | 70.5 | 71.1 | 62.4 | 52.8 |
| @pirxpilot/google-polyline@4.0.1 | 45.0 | 59.0 | 61.8 | 48.5 | 41.1 | 30.4 |
| google-polyline@2.0.0 | 45.4 | 62.2 | 58.9 | 44.7 | 35.3 | 29.6 |
| @placemarkio/polyline@2.0.3 | 38.7 | 54.7 | 50.8 | 42.1 | 32.6 | 25.1 |
| @mapbox/polyline@1.2.1 | 34.9 | 49.1 | 44.6 | 38.2 | 27.6 | 22.9 |
| @googlemaps/polyline-codec@1.0.28 | 17.4 | 18.6 | 17.6 | 16.1 | 12.3 | 11.2 |
| @lp-labs/polyline-codec@0.1.0 | 7.43 | 8.63 | 7.62 | 6.50 | 4.95 | 4.04 |
| polyline-encoded@0.0.9 | 2.77 | 2.82 | 2.85 | 2.63 | 2.33 | 1.87 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 18.8 | 60.9 | 74.1 | 84.3 | 94.6 | 45.0 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 17.3 | 60.0 | 71.1 | 78.7 | 99.0 | 44.6 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 40.5 | 57.9 | 53.9 | 57.7 | 41.6 | 34.8 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 61.8 | 118 | 124 | 114 | 107 | 73.4 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 51.9 | 123 | 129 | 106 | 87.9 | 56.8 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 31.8 | 55.0 | 47.9 | 40.0 | 30.8 | 25.0 |
<!-- /results:node-26 -->

</details>

### Deno

<!-- results:deno -->
Deno v2.5.4, 2026-11-26. `@duoquote/polytini` resolved to `src/deno.js`. Between rounds, a cell moved by a median of 23%, and 60% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 77.9 | 101 | 115 | 86.1 | 75.8 | 55.0 |
| @googlemaps/polyline-codec@1.0.28 | 74.4 | 95.1 | 97.5 | 82.3 | 69.5 | 50.3 |
| **@duoquote/polytini@0.1.0 (web entry)** | 76.3 | 93.0 | 89.1 | 81.1 | 53.2 | 51.0 |
| @mapbox/polyline@1.2.1 | 77.9 | 77.0 | 65.2 | 72.2 | 50.6 | 45.4 |
| @placemarkio/polyline@2.0.3 | 88.7 | 83.1 | 71.1 | 70.8 | 51.2 | 47.0 |
| google-polyline@2.0.0 | 70.1 | 74.6 | 62.3 | 64.4 | 37.3 | 41.2 |
| @pirxpilot/google-polyline@4.0.1 | 52.4 | 55.1 | 51.7 | 53.7 | 38.5 | 35.7 |
| **@duoquote/polytini@0.1.0 (wasm)** | 13.2 | 41.3 | 50.5 | 47.1 | 39.2 | 29.2 |
| polyline-encoded@0.0.9 | 18.3 | 20.3 | 19.9 | 18.0 | 13.1 | 14.5 |
| @lp-labs/polyline-codec@0.1.0 | 5.55 | 6.67 | 5.71 | 5.40 | 3.85 | 4.77 |
| decode-google-map-polyline@1.0.1 | 1.34 | 2.54 | 2.76 | 2.91 | 2.10 | 2.42 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 40.3 | 57.7 | 109 | 103 | 85.1 | 52.2 |
| **@duoquote/polytini@0.1.0 (web entry)** | 43.1 | 59.6 | 69.1 | 69.0 | 69.6 | 54.0 |
| @pirxpilot/google-polyline@4.0.1 | 47.0 | 55.7 | 56.8 | 47.5 | 43.7 | 28.8 |
| google-polyline@2.0.0 | 46.0 | 59.7 | 57.5 | 45.5 | 41.0 | 24.8 |
| @placemarkio/polyline@2.0.3 | 38.2 | 52.0 | 49.9 | 42.7 | 33.6 | 25.4 |
| **@duoquote/polytini@0.1.0 (wasm)** | 35.5 | 46.2 | 48.2 | 37.3 | 29.5 | 22.2 |
| @mapbox/polyline@1.2.1 | 31.9 | 43.7 | 40.1 | 35.8 | 32.6 | 23.9 |
| @googlemaps/polyline-codec@1.0.28 | 16.3 | 20.9 | 16.6 | 10.6 | 9.87 | 9.82 |
| @lp-labs/polyline-codec@0.1.0 | 6.65 | 8.17 | 6.76 | 6.74 | 3.98 | 4.09 |
| polyline-encoded@0.0.9 | 2.24 | 2.35 | 2.34 | 2.24 | 2.07 | 1.54 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 18.2 | 67.1 | 81.0 | 91.7 | 113 | 46.8 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 8.68 | 36.4 | 44.2 | 46.2 | 52.5 | 25.7 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 40.1 | 56.2 | 50.9 | 43.0 | 37.2 | 33.7 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 43.7 | 64.0 | 114 | 112 | 99.0 | 59.7 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 36.0 | 56.6 | 49.0 | 36.9 | 34.9 | 26.1 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 31.3 | 51.5 | 46.5 | 32.7 | 27.0 | 21.9 |
<!-- /results:deno -->

### Chrome

Headless Chrome through `playwright-core`, served from `127.0.0.1` with cross-origin isolation headers so `performance.now()` has 5 microsecond resolution instead of 100. Each library is bundled with esbuild using browser conditions.

`google.maps.geometry.encoding` is the encoder and decoder in the Maps JavaScript API. It only exists after the API loads with a key, so that row only shows up when `GOOGLE_MAPS_API_KEY` is set. It ran its 5 rounds in one page, so the Maps script loaded once.

<!-- results:browser -->
Chrome 157.0.8103.80 (headless), 2026-11-26. `@duoquote/polytini` resolved to `src/browser.js`. Between rounds, a cell moved by a median of 28%, and 97% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 90.9 | 121 | 111 | 103 | 87.7 | 67.9 |
| **@duoquote/polytini@0.1.0** | 88.9 | 118 | 111 | 95.2 | 73.8 | 73.3 |
| **@duoquote/polytini@0.1.0 (web entry)** | 85.1 | 105 | 103 | 93.0 | 76.5 | 67.7 |
| @mapbox/polyline@1.2.1 | 97.6 | 111 | 93.0 | 90.9 | 84.0 | 64.5 |
| @placemarkio/polyline@2.0.3 | 105 | 111 | 87.0 | 87.0 | 88.1 | 68.7 |
| google-polyline@2.0.0 | 83.3 | 105 | 74.8 | 85.1 | 77.4 | 61.4 |
| **@duoquote/polytini@0.1.0 (wasm)** | 22.2 | 71.4 | 76.9 | 71.4 | 62.9 | 44.1 |
| @pirxpilot/google-polyline@4.0.1 | 67.8 | 65.6 | 63.5 | 63.5 | 57.3 | 50.5 |
| google.maps.geometry.encoding | 29.9 | 35.1 | 36.0 | 33.1 | 12.8 | 30.0 |
| polyline-encoded@0.0.9 | 18.2 | 15.2 | 18.3 | 14.9 | 8.69 | 17.4 |
| @lp-labs/polyline-codec@0.1.0 | 6.94 | 8.10 | 7.33 | 6.16 | 4.74 | 5.92 |
| decode-google-map-polyline@1.0.1 | 2.37 | 3.51 | 3.81 | 4.08 | 2.63 | 3.57 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 42.6 | 71.4 | 133 | 121 | 84.4 | 63.5 |
| **@duoquote/polytini@0.1.0 (wasm)** | 20.9 | 85.1 | 103 | 90.9 | 76.9 | 40.6 |
| **@duoquote/polytini@0.1.0 (web entry)** | 47.1 | 70.2 | 76.9 | 76.9 | 78.7 | 64.7 |
| @pirxpilot/google-polyline@4.0.1 | 50.0 | 61.5 | 69.0 | 54.1 | 54.7 | 31.6 |
| google-polyline@2.0.0 | 48.8 | 69.0 | 65.6 | 50.0 | 48.1 | 31.5 |
| @placemarkio/polyline@2.0.3 | 40.4 | 60.6 | 52.6 | 44.4 | 40.1 | 26.0 |
| @mapbox/polyline@1.2.1 | 33.9 | 51.3 | 46.0 | 38.8 | 33.7 | 24.3 |
| @googlemaps/polyline-codec@1.0.28 | 21.1 | 34.5 | 29.9 | 27.4 | 22.5 | 15.1 |
| google.maps.geometry.encoding | 15.4 | 19.3 | 18.8 | 17.9 | 14.2 | 11.7 |
| @lp-labs/polyline-codec@0.1.0 | 8.30 | 9.95 | 9.13 | 8.13 | 6.36 | 6.75 |
| polyline-encoded@0.0.9 | 3.52 | 3.49 | 3.46 | 3.27 | 3.25 | 2.74 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 14.3 | 47.6 | 59.7 | 69.0 | 86.8 | 36.5 |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 18.1 | 43.5 | 54.8 | 58.8 | 57.6 | 39.8 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 44.4 | 54.1 | 53.3 | 58.0 | 46.5 | 38.9 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 44.9 | 72.7 | 138 | 129 | 84.4 | 72.1 |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 28.8 | 100 | 121 | 103 | 86.6 | 49.3 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 37.7 | 62.0 | 53.3 | 43.0 | 37.0 | 25.2 |
<!-- /results:browser -->

`@googlemaps/polyline-codec` is Google's own package: it lives in the [googlemaps/js-polyline-codec](https://github.com/googlemaps/js-polyline-codec) repository, and its source says "Copyright 2020 Google LLC". I couldn't find anything saying whether it shares code with the encoder inside the Maps JavaScript API, which is only shipped minified as part of the API. I also didn't find a published benchmark of `google.maps.geometry.encoding`.

In Chrome, `google.maps.geometry.encoding` decoded 3 to 7 times slower than `@googlemaps/polyline-codec`, 30 to 36 million points per second against 88 to 121 (12.8 against 88 at 100,000 points). Part of that is the output: `decodePath` returns `google.maps.LatLng` objects, which cost more to create than arrays. It encoded `LatLng` arrays at 12 to 19 million points per second, 55 to 77% of the npm codec's speed. If you only need the geometry functions, the npm package is faster and doesn't need the Maps script.

### HERE Flexible Polyline

HERE's Flexible Polyline is a different format, with a header and an optional third dimension, so it's benchmarked on its own with `--format flexible`: `@here/flexpolyline` against polytini's `/flexible` module, on the same lines encoded with a precision 5 header.

polytini's version decoded 12 to 58 times faster and encoded 13 to 72 times faster than `@here/flexpolyline`, depending on the runtime and size. The gap is biggest on Bun.

<details>
<summary>Bun, Node 24 and Deno tables</summary>

<!-- results:bun-flexible -->
Bun v1.4.3, 2026-11-26. `@duoquote/polytini` resolved to `src/bun.js`. Between rounds, a cell moved by a median of 24%, and 64% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | 68.8 | 70.9 | 70.9 | 73.1 | 54.6 | 37.5 |
| @here/flexpolyline@0.1.0 | 1.65 | 2.13 | 2.06 | 1.45 | 0.94 | 0.95 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | 39.7 | 64.4 | 69.0 | 67.1 | 49.4 | 39.6 |
| @here/flexpolyline@0.1.0 | 0.83 | 1.30 | 1.05 | 0.94 | 0.86 | 0.72 |
<!-- /results:bun-flexible -->

<!-- results:node-24-flexible -->
Node v24.22.3, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds, a cell moved by a median of 24%, and 53% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | 61.7 | 66.9 | 68.0 | 67.6 | 40.1 | 43.6 |
| @here/flexpolyline@0.1.0 | 4.31 | 4.77 | 4.75 | 3.63 | 2.60 | 3.36 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | 40.6 | 62.8 | 67.4 | 65.1 | 62.7 | 52.4 |
| @here/flexpolyline@0.1.0 | 3.06 | 3.61 | 3.08 | 2.29 | 1.51 | 1.75 |
<!-- /results:node-24-flexible -->

<!-- results:deno-flexible -->
Deno v2.5.4, 2026-11-26. `@duoquote/polytini` resolved to `src/deno.js`. Between rounds, a cell moved by a median of 27%, and 58% at worst.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | 68.5 | 65.4 | 53.9 | 58.1 | 39.3 | 43.0 |
| @here/flexpolyline@0.1.0 | 4.08 | 4.50 | 4.53 | 3.41 | 2.55 | 3.53 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | 40.9 | 65.3 | 71.6 | 69.8 | 70.1 | 49.8 |
| @here/flexpolyline@0.1.0 | 2.83 | 3.64 | 3.19 | 2.18 | 1.44 | 1.71 |
<!-- /results:deno-flexible -->

</details>

### Bundle size

What `import * as x from '<package>'` pulls into a browser bundle, minified by esbuild and gzipped at level 9:

<!-- results:size -->
| Package | Minified | Gzipped |
|---|--:|--:|
| @mapbox/polyline@1.2.1 | 1.8 KB | 948 B |
| @googlemaps/polyline-codec@1.0.28 | 1.0 KB | 568 B |
| google-polyline@2.0.0 | 873 B | 551 B |
| @pirxpilot/google-polyline@4.0.1 | 973 B | 595 B |
| @placemarkio/polyline@2.0.3 | 1016 B | 580 B |
| polyline-encoded@0.0.9 | 3.0 KB | 1.2 KB |
| decode-google-map-polyline@1.0.1 | 1.3 KB | 738 B |
| @lp-labs/polyline-codec@0.1.0 | 2.6 KB | 1.2 KB |
| **@duoquote/polytini@0.1.0 (browser entry, every export)** | 4.9 KB | 2.3 KB |
| **@duoquote/polytini@0.1.0 (web entry, every export)** | 4.0 KB | 2.0 KB |
| **@duoquote/polytini@0.1.0 (encode and decode only)** | 4.3 KB | 2.0 KB |
| **@duoquote/polytini@0.1.0 (node entry)** | 5.3 KB | 2.6 KB |
| **@duoquote/polytini@0.1.0 (wasm, JS glue plus inlined .wasm)** | 5.3 KB | 2.8 KB |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.9 KB | 1.5 KB |
| ol@10.11.0 (ol/format/Polyline) | 27.3 KB | 9.5 KB |
| @here/flexpolyline@0.1.0 (HERE Flexible Polyline) | 2.6 KB | 1.4 KB |
| **@duoquote/polytini@0.1.0 (flexible)** | 4.2 KB | 2.1 KB |
<!-- /results:size -->

polytini is the biggest of the Google-format libraries except `ol/format/Polyline`. The extra goes into strict-mode errors, the exact path for precision 7 and up, objects, extra dimensions and both coordinate orders. The browser entry adds about 270 bytes for its TextDecoder encoder; `@duoquote/polytini/web` leaves it out.

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
| `@duoquote/polytini` | 0.1.0 | not published | | `[lat, lng]` or `[lng, lat]` | 0 to 15 |

Downloads are from npm for 19 to 25 November 2026. Most of `ol`'s downloads are for the map library as a whole, not its polyline format.

Since 2021, `@googlemaps/polyline-codec` went from 1.0.2 to 1.0.28 and `@mapbox/polyline` from 1.1.1 to 1.2.1. `google-polyline` went from 1.0.3 to 2.0.0, which is ESM and lives on Codeberg now. `polyline-encoded` and `decode-google-map-polyline` haven't had a release since 2020 and 2017. I kept both because people still download them every week.

The two packages with tiny download counts are in because they work differently. `@pirxpilot/google-polyline` takes `[lng, lat]` and a `factor` option, and `@lp-labs/polyline-codec` is the strict `BigInt` one.

OpenLayers comes in two ways. `encodeDeltas` and `decodeDeltas` are its flat-array functions, in the typed-array tables. Its `ol/format/Polyline` class, which builds OpenLayers geometries, is compared with polytini's OpenLayers drop-in in [`packages/polytini/bench/openlayers.js`](packages/polytini/bench/openlayers.js). One thing to know about `encodeDeltas`: it overwrites the array you pass in with the deltas. The benchmark copies the input before every call so each call sees the same data, and the copy is part of its time. The same thing happens in `Polyline#writeGeometry` when no projection change is involved, so writing a geometry twice gives a different string the second time.

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

Every library passes every case it supports, 564 checks in total, on Node, Bun and Deno. `google-polyline` and `decode-google-map-polyline` skip precision 6, and `decode-google-map-polyline` has no encoder. polytini also gets 72 more checks on its default, web and WASM entries: other precisions, strict-mode errors, `{lat, lng}` objects and GeoJSON. Its own test suite is much bigger; see its README. The benchmark also checks each library's output on every input before it starts timing.

Exact rounding ties are left out on purpose, because the libraries disagree there. At precision 5, `google-polyline` and `@lp-labs/polyline-codec` turn -0.000005 into 0, and the rest turn it into -1. Run `npm run behavior` to see this, the truncated-string case, an invalid character in the middle of a string, and 0.49999999999999994. That last one is the largest double below 0.5, and every library that rounds with `Math.floor(x + 0.5)` turns it into 1, because the addition itself rounds up. The reference codec used to do the same. It uses `Math.round` on the magnitude now, which is exact.

## Running it

```sh
npm ci
npm test
npm run bench
```

`npm run bench` writes `results/node-<major>.md` and `.json`. For the other runtimes, use `npm run bench:bun`, `npm run bench:deno` and `npm run bench:browser` (it needs Chrome installed). `npm run bench:flexible` runs the HERE format, and `npm run size` measures bundle sizes. `npm run bench:all` runs all of it one after another, including Node 22 to 26 through `npx`. The tests also run with `npm run test:bun` and `npm run test:deno`.

Options go after `--`, for example `npm run bench -- --precision 6 --only google`:

- `--precision 5` or `6`
- `--time 120`: milliseconds per cell
- `--rounds 5`
- `--only <text>`: only libraries whose name contains it
- `--no-write`: print the tables without saving them

`node bench/readme.js` copies the tables from `results/` into this README.

For the `google.maps.geometry.encoding` row, set `GOOGLE_MAPS_API_KEY` to a Maps JavaScript API key that allows `http://127.0.0.1/*` as a referrer. Without it the row is skipped. The key only goes into the page served from memory, never into a file, and the run fails if it shows up in a result file.

`npm run bench:all` took 10.0 minutes on my machine for everything: 7 runtimes, Chrome with the Maps row, the flexible format and sizes, running 3 steps at a time. `npm run bench:quick` takes about a minute and writes nothing, for checking changes. I've only run the benchmark on Windows. CI runs the tests on Ubuntu with Node 22, 24 and 26, Bun and Deno.

## How it's measured

- The test inputs come from a seeded PRNG and use integer math only, so every runtime gets exactly the same coordinates. They're GPS-like tracks sampled at about 1 Hz, starting in Istanbul, São Paulo, Seattle and Sydney. That way negative values show up in the timed data too. The tracks also stop now and then, which gives repeated points.
- The real-world set is the CSV from 2021: 1000 lines from PostGIS `ST_AsEncodedPolyline`, 146,330 points in total, median 82 points per line.
- Each library runs in its own child process with `tinybench`, 120 ms per cell after a 60 ms warmup, and at least 8 samples. I added the separate processes after `@mapbox/polyline` decoded 10 points about 25% faster when it ran alone than after the other libraries.
- The rounds are interleaved: every library runs once, then every library again, in a different shuffled order each round. A slow minute on the machine hits every library a little instead of one library a lot. I added the shuffle after a fixed order showed a 20 to 35% drop in the last two rounds for whichever libraries ran last.
- Short lines are repeated inside one timed call until it covers 20,000 points, so timer overhead doesn't swamp a 10 point decode.
- Inputs are built in each library's own point shape ahead of time, so flipping to `[lng, lat]` or building objects isn't part of the timing. Decode returns whatever the library returns.
- The browser runs use the same `measure()` code as the server runtimes, bundled into the page.
- CI never runs the benchmark, because shared runners are too noisy for the numbers to mean anything.

## License

MIT, see [LICENSE](LICENSE).
