## Node v23.11.1, precision 5

- Runtime: Node v23.11.1 (V8 12.9.202.28-node.14)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 29%, worst 67%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @placemarkio/polyline@2.0.3 | **7.89M** | 683k | 67.2k | 7.06k | **263** | 286k |
| @mapbox/polyline@1.2.1 | 6.71M | 791k | 71.7k | 7.47k | 210 | 294k |
| **@duoquote/polytini@0.1.0** | 7.00M | 678k | 67.0k | **7.60k** | 194 | **329k** |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.00M | **824k** | **73.9k** | 7.47k | 153 | 245k |
| @googlemaps/polyline-codec@1.0.28 | 6.18M | 820k | 65.3k | 7.08k | 160 | 307k |
| google-polyline@2.0.0 | 6.48M | 701k | 51.3k | 6.29k | 243 | 286k |
| **@duoquote/polytini@0.1.0 (wasm)** | 6.40M | 794k | 63.4k | 6.07k | 160 | 295k |
| @pirxpilot/google-polyline@4.0.1 | 5.47M | 520k | 47.7k | 5.63k | 195 | 212k |
| polyline-encoded@0.0.9 | 1.69M | 188k | 15.3k | 1.47k | 48.2 | 81.9k |
| @lp-labs/polyline-codec@0.1.0 | 443k | 59.1k | 5.58k | 451 | 27.2 | 28.0k |
| decode-google-map-polyline@1.0.1 | 106k | 19.5k | 2.05k | 178 | 12.6 | 12.2k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **4.15M** | 1.07M | 117k | **11.1k** | **964** | **418k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 3.34M | **1.23M** | **138k** | 9.63k | 856 | 316k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.40M | 537k | 63.7k | 6.02k | 272 | 295k |
| google-polyline@2.0.0 | 4.11M | 563k | 52.5k | 4.39k | 125 | 186k |
| @pirxpilot/google-polyline@4.0.1 | 3.74M | 535k | 55.0k | 3.36k | 120 | 177k |
| @placemarkio/polyline@2.0.3 | 3.03M | 483k | 46.7k | 4.09k | 112 | 160k |
| @mapbox/polyline@1.2.1 | 2.82M | 467k | 42.4k | 3.47k | 91.9 | 145k |
| @googlemaps/polyline-codec@1.0.28 | 1.21M | 162k | 15.5k | 1.02k | 78.9 | 64.5k |
| @lp-labs/polyline-codec@0.1.0 | 605k | 82.2k | 6.61k | 539 | 31.6 | 32.4k |
| polyline-encoded@0.0.9 | 168k | 16.4k | 1.66k | 133 | 14.7 | 9.59k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @placemarkio/polyline@2.0.3 | **1.18x** | 0.86x | 0.94x | 0.95x | **1.25x** | 0.97x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| **@duoquote/polytini@0.1.0** | 1.04x | 0.86x | 0.93x | **1.02x** | 0.92x | **1.12x** |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.04x | **1.04x** | **1.03x** | 1.00x | 0.73x | 0.83x |
| @googlemaps/polyline-codec@1.0.28 | 0.92x | 1.04x | 0.91x | 0.95x | 0.76x | 1.05x |
| google-polyline@2.0.0 | 0.97x | 0.89x | 0.72x | 0.84x | 1.15x | 0.97x |
| **@duoquote/polytini@0.1.0 (wasm)** | 0.95x | 1.00x | 0.88x | 0.81x | 0.76x | 1.01x |
| @pirxpilot/google-polyline@4.0.1 | 0.81x | 0.66x | 0.67x | 0.75x | 0.92x | 0.72x |
| polyline-encoded@0.0.9 | 0.25x | 0.24x | 0.21x | 0.20x | 0.23x | 0.28x |
| @lp-labs/polyline-codec@0.1.0 | 0.07x | 0.07x | 0.08x | 0.06x | 0.13x | 0.10x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.02x | 0.03x | 0.02x | 0.06x | 0.04x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **1.47x** | 2.29x | 2.76x | **3.20x** | **10x** | **2.87x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.18x | **2.64x** | **3.25x** | 2.78x | 9.31x | 2.17x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.20x | 1.15x | 1.50x | 1.74x | 2.96x | 2.03x |
| google-polyline@2.0.0 | 1.46x | 1.21x | 1.24x | 1.27x | 1.36x | 1.28x |
| @pirxpilot/google-polyline@4.0.1 | 1.32x | 1.15x | 1.30x | 0.97x | 1.30x | 1.22x |
| @placemarkio/polyline@2.0.3 | 1.07x | 1.03x | 1.10x | 1.18x | 1.21x | 1.10x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.43x | 0.35x | 0.37x | 0.29x | 0.86x | 0.44x |
| @lp-labs/polyline-codec@0.1.0 | 0.21x | 0.18x | 0.16x | 0.16x | 0.34x | 0.22x |
| polyline-encoded@0.0.9 | 0.06x | 0.04x | 0.04x | 0.04x | 0.16x | 0.07x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 1.09M | 518k | **75.9k** | **8.10k** | **1.09k** | **253k** |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 1.60M | **546k** | 70.2k | 7.55k | 749 | 248k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.78M** | 498k | 40.5k | 3.61k | 281 | 188k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **4.65M** | **1.06M** | 126k | **11.4k** | 835 | **443k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 2.42M | 1.02M | **166k** | 10.6k | **946** | 387k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 2.19M | 382k | 32.5k | 3.27k | 102 | 145k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | **413k** |
| **@duoquote/polytini@0.1.0** | 329k |
| @googlemaps/polyline-codec@1.0.28 | 307k |
| **@duoquote/polytini@0.1.0 (wasm)** | 295k |
| @mapbox/polyline@1.2.1 | 294k |
| @placemarkio/polyline@2.0.3 | 286k |
| google-polyline@2.0.0 | 286k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 271k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 253k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 248k |
| **@duoquote/polytini@0.1.0 (web entry)** | 245k |
| @pirxpilot/google-polyline@4.0.1 | 212k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 188k |
| polyline-encoded@0.0.9 | 81.9k |
| @lp-labs/polyline-codec@0.1.0 | 28.0k |
| decode-google-map-polyline@1.0.1 | 12.2k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **443k** |
| **@duoquote/polytini@0.1.0** | 418k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 387k |
| **@duoquote/polytini@0.1.0 (wasm)** | 316k |
| **@duoquote/polytini@0.1.0 (web entry)** | 295k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 274k |
| google-polyline@2.0.0 | 186k |
| @pirxpilot/google-polyline@4.0.1 | 177k |
| @placemarkio/polyline@2.0.3 | 160k |
| @mapbox/polyline@1.2.1 | 145k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 145k |
| @googlemaps/polyline-codec@1.0.28 | 64.5k |
| @lp-labs/polyline-codec@0.1.0 | 32.4k |
| polyline-encoded@0.0.9 | 9.59k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @placemarkio/polyline@2.0.3 | **78.9** | 68.3 | 67.2 | 70.6 | **26.3** | 41.9 |
| @mapbox/polyline@1.2.1 | 67.1 | 79.1 | 71.7 | 74.7 | 21.0 | 42.9 |
| **@duoquote/polytini@0.1.0** | 70.0 | 67.8 | 67.0 | **76.0** | 19.4 | **48.1** |
| **@duoquote/polytini@0.1.0 (web entry)** | 70.0 | **82.4** | **73.9** | 74.7 | 15.3 | 35.9 |
| @googlemaps/polyline-codec@1.0.28 | 61.8 | 82.0 | 65.3 | 70.8 | 16.0 | 44.9 |
| google-polyline@2.0.0 | 64.8 | 70.1 | 51.3 | 62.9 | 24.3 | 41.8 |
| **@duoquote/polytini@0.1.0 (wasm)** | 64.0 | 79.4 | 63.4 | 60.7 | 16.0 | 43.2 |
| @pirxpilot/google-polyline@4.0.1 | 54.7 | 52.0 | 47.7 | 56.3 | 19.5 | 31.1 |
| polyline-encoded@0.0.9 | 16.9 | 18.8 | 15.3 | 14.7 | 4.82 | 12.0 |
| @lp-labs/polyline-codec@0.1.0 | 4.43 | 5.91 | 5.58 | 4.51 | 2.72 | 4.10 |
| decode-google-map-polyline@1.0.1 | 1.06 | 1.95 | 2.05 | 1.78 | 1.26 | 1.79 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **41.5** | 107 | 117 | **111** | **96.4** | **61.2** |
| **@duoquote/polytini@0.1.0 (wasm)** | 33.4 | **123** | **138** | 96.3 | 85.6 | 46.2 |
| **@duoquote/polytini@0.1.0 (web entry)** | 34.0 | 53.7 | 63.7 | 60.2 | 27.2 | 43.2 |
| google-polyline@2.0.0 | 41.1 | 56.3 | 52.5 | 43.9 | 12.5 | 27.3 |
| @pirxpilot/google-polyline@4.0.1 | 37.4 | 53.5 | 55.0 | 33.6 | 12.0 | 25.9 |
| @placemarkio/polyline@2.0.3 | 30.3 | 48.3 | 46.7 | 40.9 | 11.2 | 23.4 |
| @mapbox/polyline@1.2.1 | 28.2 | 46.7 | 42.4 | 34.7 | 9.19 | 21.3 |
| @googlemaps/polyline-codec@1.0.28 | 12.1 | 16.2 | 15.5 | 10.2 | 7.89 | 9.44 |
| @lp-labs/polyline-codec@0.1.0 | 6.05 | 8.22 | 6.61 | 5.39 | 3.16 | 4.74 |
| polyline-encoded@0.0.9 | 1.68 | 1.64 | 1.66 | 1.33 | 1.47 | 1.40 |
