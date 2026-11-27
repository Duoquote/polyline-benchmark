## Bun v1.4.3, precision 5

- Runtime: Bun v1.4.3 (JavaScriptCore)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/bun.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 7%, worst 220%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 11.0M | 1.38M | 138k | **13.6k** | **1.31k** | **589k** |
| **@duoquote/polytini@0.1.4 (wasm)** | 11.3M | 1.43M | **139k** | 12.9k | 1.20k | 527k |
| **@duoquote/polytini@0.1.4 (web entry)** | **11.4M** | **1.44M** | 134k | 12.9k | 1.17k | 549k |
| @googlemaps/polyline-codec@1.0.28 | 11.0M | 1.21M | 120k | 11.3k | 1.04k | 407k |
| @placemarkio/polyline@2.0.3 | 11.1M | 1.05M | 103k | 10.6k | 965 | 401k |
| google-polyline@2.0.0 | 10.3M | 969k | 92.7k | 9.57k | 899 | 387k |
| @mapbox/polyline@1.2.1 | 9.42M | 941k | 90.4k | 8.93k | 775 | 367k |
| @pirxpilot/google-polyline@4.0.1 | 3.83M | 440k | 42.5k | 4.12k | 374 | 192k |
| polyline-encoded@0.0.9 | 1.14M | 121k | 12.3k | 1.26k | 121 | 72.0k |
| decode-google-map-polyline@1.0.1 | 407k | 44.0k | 4.60k | 453 | 38.1 | 27.9k |
| @lp-labs/polyline-codec@0.1.0 | 505k | 48.6k | 4.87k | 441 | 28.4 | 24.8k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **9.82M** | **1.82M** | **192k** | **16.4k** | **1.60k** | **578k** |
| **@duoquote/polytini@0.1.4 (wasm)** | 5.95M | 1.57M | 162k | 11.5k | 1.10k | 374k |
| **@duoquote/polytini@0.1.4 (web entry)** | 6.06M | 906k | 93.2k | 9.04k | 850 | 391k |
| google-polyline@2.0.0 | 6.44M | 912k | 79.3k | 6.10k | 592 | 260k |
| @pirxpilot/google-polyline@4.0.1 | 6.80M | 786k | 83.0k | 5.59k | 563 | 252k |
| @placemarkio/polyline@2.0.3 | 3.98M | 494k | 46.8k | 3.87k | 361 | 188k |
| @mapbox/polyline@1.2.1 | 3.55M | 405k | 39.8k | 3.65k | 291 | 154k |
| @googlemaps/polyline-codec@1.0.28 | 1.55M | 202k | 18.8k | 1.76k | 160 | 84.4k |
| @lp-labs/polyline-codec@0.1.0 | 501k | 51.1k | 4.99k | 451 | 34.4 | 24.4k |
| polyline-encoded@0.0.9 | 359k | 35.9k | 3.64k | 337 | 30.5 | 22.5k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 1.17x | 1.47x | 1.52x | **1.52x** | **1.69x** | **1.60x** |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.20x | 1.52x | **1.54x** | 1.44x | 1.54x | 1.43x |
| **@duoquote/polytini@0.1.4 (web entry)** | **1.21x** | **1.53x** | 1.49x | 1.44x | 1.51x | 1.50x |
| @googlemaps/polyline-codec@1.0.28 | 1.16x | 1.29x | 1.33x | 1.26x | 1.34x | 1.11x |
| @placemarkio/polyline@2.0.3 | 1.18x | 1.11x | 1.14x | 1.18x | 1.24x | 1.09x |
| google-polyline@2.0.0 | 1.09x | 1.03x | 1.03x | 1.07x | 1.16x | 1.05x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @pirxpilot/google-polyline@4.0.1 | 0.41x | 0.47x | 0.47x | 0.46x | 0.48x | 0.52x |
| polyline-encoded@0.0.9 | 0.12x | 0.13x | 0.14x | 0.14x | 0.16x | 0.20x |
| decode-google-map-polyline@1.0.1 | 0.04x | 0.05x | 0.05x | 0.05x | 0.05x | 0.08x |
| @lp-labs/polyline-codec@0.1.0 | 0.05x | 0.05x | 0.05x | 0.05x | 0.04x | 0.07x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **2.76x** | **4.49x** | **4.83x** | **4.51x** | **5.51x** | **3.76x** |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.67x | 3.87x | 4.08x | 3.16x | 3.77x | 2.44x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.70x | 2.24x | 2.34x | 2.48x | 2.92x | 2.55x |
| google-polyline@2.0.0 | 1.81x | 2.25x | 1.99x | 1.67x | 2.04x | 1.69x |
| @pirxpilot/google-polyline@4.0.1 | 1.91x | 1.94x | 2.08x | 1.53x | 1.94x | 1.64x |
| @placemarkio/polyline@2.0.3 | 1.12x | 1.22x | 1.17x | 1.06x | 1.24x | 1.23x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.44x | 0.50x | 0.47x | 0.48x | 0.55x | 0.55x |
| @lp-labs/polyline-codec@0.1.0 | 0.14x | 0.13x | 0.13x | 0.12x | 0.12x | 0.16x |
| polyline-encoded@0.0.9 | 0.10x | 0.09x | 0.09x | 0.09x | 0.11x | 0.15x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | 12.1M | **2.44M** | **232k** | **21.5k** | **2.07k** | **801k** |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | **12.3M** | 1.92M | 195k | 18.6k | 1.86k | 747k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 8.90M | 953k | 83.4k | 8.57k | 745 | 338k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **10.6M** | **2.00M** | **214k** | **17.6k** | **1.76k** | **641k** |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 6.30M | 1.97M | 198k | 13.6k | 1.24k | 448k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.57M | 385k | 37.0k | 3.59k | 217 | 158k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | **823k** |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 801k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 747k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 590k |
| **@duoquote/polytini@0.1.4** | 589k |
| **@duoquote/polytini@0.1.4 (web entry)** | 549k |
| **@duoquote/polytini@0.1.4 (wasm)** | 527k |
| @googlemaps/polyline-codec@1.0.28 | 407k |
| @placemarkio/polyline@2.0.3 | 401k |
| google-polyline@2.0.0 | 387k |
| @mapbox/polyline@1.2.1 | 367k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 338k |
| @pirxpilot/google-polyline@4.0.1 | 192k |
| polyline-encoded@0.0.9 | 72.0k |
| decode-google-map-polyline@1.0.1 | 27.9k |
| @lp-labs/polyline-codec@0.1.0 | 24.8k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **641k** |
| **@duoquote/polytini@0.1.4** | 578k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 448k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 397k |
| **@duoquote/polytini@0.1.4 (web entry)** | 391k |
| **@duoquote/polytini@0.1.4 (wasm)** | 374k |
| google-polyline@2.0.0 | 260k |
| @pirxpilot/google-polyline@4.0.1 | 252k |
| @placemarkio/polyline@2.0.3 | 188k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 158k |
| @mapbox/polyline@1.2.1 | 154k |
| @googlemaps/polyline-codec@1.0.28 | 84.4k |
| @lp-labs/polyline-codec@0.1.0 | 24.4k |
| polyline-encoded@0.0.9 | 22.5k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 110 | 138 | 138 | **136** | **131** | **86.2** |
| **@duoquote/polytini@0.1.4 (wasm)** | 113 | 143 | **139** | 129 | 120 | 77.1 |
| **@duoquote/polytini@0.1.4 (web entry)** | **114** | **144** | 134 | 129 | 117 | 80.4 |
| @googlemaps/polyline-codec@1.0.28 | 110 | 121 | 120 | 113 | 104 | 59.6 |
| @placemarkio/polyline@2.0.3 | 111 | 105 | 103 | 106 | 96.5 | 58.6 |
| google-polyline@2.0.0 | 103 | 96.9 | 92.7 | 95.7 | 89.9 | 56.7 |
| @mapbox/polyline@1.2.1 | 94.2 | 94.1 | 90.4 | 89.3 | 77.5 | 53.8 |
| @pirxpilot/google-polyline@4.0.1 | 38.3 | 44.0 | 42.5 | 41.2 | 37.4 | 28.1 |
| polyline-encoded@0.0.9 | 11.4 | 12.1 | 12.3 | 12.6 | 12.1 | 10.5 |
| decode-google-map-polyline@1.0.1 | 4.07 | 4.40 | 4.60 | 4.53 | 3.81 | 4.08 |
| @lp-labs/polyline-codec@0.1.0 | 5.05 | 4.86 | 4.87 | 4.41 | 2.84 | 3.63 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **98.2** | **182** | **192** | **164** | **160** | **84.6** |
| **@duoquote/polytini@0.1.4 (wasm)** | 59.5 | 157 | 162 | 115 | 110 | 54.7 |
| **@duoquote/polytini@0.1.4 (web entry)** | 60.6 | 90.6 | 93.2 | 90.4 | 85.0 | 57.3 |
| google-polyline@2.0.0 | 64.4 | 91.2 | 79.3 | 61.0 | 59.2 | 38.1 |
| @pirxpilot/google-polyline@4.0.1 | 68.0 | 78.6 | 83.0 | 55.9 | 56.3 | 36.9 |
| @placemarkio/polyline@2.0.3 | 39.8 | 49.4 | 46.8 | 38.7 | 36.1 | 27.6 |
| @mapbox/polyline@1.2.1 | 35.5 | 40.5 | 39.8 | 36.5 | 29.1 | 22.5 |
| @googlemaps/polyline-codec@1.0.28 | 15.5 | 20.2 | 18.8 | 17.6 | 16.0 | 12.4 |
| @lp-labs/polyline-codec@0.1.0 | 5.01 | 5.11 | 4.99 | 4.51 | 3.44 | 3.57 |
| polyline-encoded@0.0.9 | 3.59 | 3.59 | 3.64 | 3.37 | 3.05 | 3.29 |
