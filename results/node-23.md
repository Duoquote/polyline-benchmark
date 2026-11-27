## Node v23.11.1, precision 5

- Runtime: Node v23.11.1 (V8 12.9.202.28-node.14)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 6%, worst 116%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 8.11M | **1.20M** | **130k** | **12.7k** | **400** | **481k** |
| @placemarkio/polyline@2.0.3 | 9.28M | 990k | 88.5k | 8.65k | 334 | 355k |
| @googlemaps/polyline-codec@1.0.28 | 7.45M | 1.15M | 115k | 10.5k | 179 | 371k |
| @mapbox/polyline@1.2.1 | **9.91M** | 967k | 85.2k | 8.85k | 239 | 359k |
| **@duoquote/polytini@0.1.4 (wasm)** | 8.18M | 1.06M | 99.1k | 9.12k | 173 | 388k |
| **@duoquote/polytini@0.1.4 (web entry)** | 8.12M | 1.05M | 100k | 9.35k | 171 | 382k |
| google-polyline@2.0.0 | 8.25M | 920k | 79.2k | 7.73k | 230 | 320k |
| @pirxpilot/google-polyline@4.0.1 | 7.32M | 762k | 69.7k | 6.97k | 286 | 302k |
| polyline-encoded@0.0.9 | 1.85M | 223k | 20.5k | 2.07k | 63.1 | 118k |
| @lp-labs/polyline-codec@0.1.0 | 561k | 70.5k | 6.45k | 532 | 32.1 | 33.2k |
| decode-google-map-polyline@1.0.1 | 135k | 22.9k | 2.36k | 216 | 14.0 | 15.1k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **7.01M** | 1.19M | 126k | **11.7k** | **1.08k** | **488k** |
| **@duoquote/polytini@0.1.4 (wasm)** | 4.84M | **1.36M** | **143k** | 10.1k | 964 | 385k |
| **@duoquote/polytini@0.1.4 (web entry)** | 4.91M | 656k | 73.8k | 7.38k | 328 | 438k |
| google-polyline@2.0.0 | 4.94M | 649k | 64.2k | 5.01k | 153 | 225k |
| @pirxpilot/google-polyline@4.0.1 | 4.10M | 575k | 64.1k | 5.17k | 151 | 231k |
| @placemarkio/polyline@2.0.3 | 3.34M | 570k | 53.6k | 4.54k | 130 | 190k |
| @mapbox/polyline@1.2.1 | 2.93M | 492k | 45.4k | 3.97k | 126 | 173k |
| @googlemaps/polyline-codec@1.0.28 | 1.55M | 219k | 19.2k | 1.27k | 105 | 87.8k |
| @lp-labs/polyline-codec@0.1.0 | 732k | 94.3k | 7.90k | 717 | 45.6 | 39.8k |
| polyline-encoded@0.0.9 | 188k | 19.2k | 1.94k | 187 | 17.3 | 12.6k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 0.82x | **1.24x** | **1.53x** | **1.44x** | **1.68x** | **1.34x** |
| @placemarkio/polyline@2.0.3 | 0.94x | 1.02x | 1.04x | 0.98x | 1.40x | 0.99x |
| @googlemaps/polyline-codec@1.0.28 | 0.75x | 1.19x | 1.34x | 1.18x | 0.75x | 1.03x |
| @mapbox/polyline@1.2.1 | **1.00x** | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| **@duoquote/polytini@0.1.4 (wasm)** | 0.83x | 1.10x | 1.16x | 1.03x | 0.73x | 1.08x |
| **@duoquote/polytini@0.1.4 (web entry)** | 0.82x | 1.08x | 1.18x | 1.06x | 0.72x | 1.06x |
| google-polyline@2.0.0 | 0.83x | 0.95x | 0.93x | 0.87x | 0.97x | 0.89x |
| @pirxpilot/google-polyline@4.0.1 | 0.74x | 0.79x | 0.82x | 0.79x | 1.20x | 0.84x |
| polyline-encoded@0.0.9 | 0.19x | 0.23x | 0.24x | 0.23x | 0.26x | 0.33x |
| @lp-labs/polyline-codec@0.1.0 | 0.06x | 0.07x | 0.08x | 0.06x | 0.13x | 0.09x |
| decode-google-map-polyline@1.0.1 | 0.01x | 0.02x | 0.03x | 0.02x | 0.06x | 0.04x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **2.39x** | 2.43x | 2.78x | **2.95x** | **8.56x** | **2.82x** |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.65x | **2.75x** | **3.15x** | 2.54x | 7.65x | 2.23x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.67x | 1.33x | 1.63x | 1.86x | 2.60x | 2.54x |
| google-polyline@2.0.0 | 1.68x | 1.32x | 1.41x | 1.26x | 1.21x | 1.30x |
| @pirxpilot/google-polyline@4.0.1 | 1.40x | 1.17x | 1.41x | 1.30x | 1.20x | 1.34x |
| @placemarkio/polyline@2.0.3 | 1.14x | 1.16x | 1.18x | 1.14x | 1.03x | 1.10x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.53x | 0.44x | 0.42x | 0.32x | 0.83x | 0.51x |
| @lp-labs/polyline-codec@0.1.0 | 0.25x | 0.19x | 0.17x | 0.18x | 0.36x | 0.23x |
| polyline-encoded@0.0.9 | 0.06x | 0.04x | 0.04x | 0.05x | 0.14x | 0.07x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | 1.93M | **805k** | **86.5k** | **10.0k** | 1.17k | 327k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 1.91M | 758k | 82.2k | 9.75k | **1.23k** | **355k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **5.86M** | 618k | 61.1k | 4.89k | 400 | 250k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 4.74M | **1.63M** | **173k** | 11.8k | **1.09k** | 468k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | **7.12M** | 1.21M | 129k | **12.4k** | 1.05k | **531k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.02M | 568k | 49.5k | 3.80k | 126 | 175k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | **578k** |
| **@duoquote/polytini@0.1.4** | 481k |
| **@duoquote/polytini@0.1.4 (wasm)** | 388k |
| **@duoquote/polytini@0.1.4 (web entry)** | 382k |
| @googlemaps/polyline-codec@1.0.28 | 371k |
| @mapbox/polyline@1.2.1 | 359k |
| @placemarkio/polyline@2.0.3 | 355k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 355k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 327k |
| google-polyline@2.0.0 | 320k |
| @pirxpilot/google-polyline@4.0.1 | 302k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 291k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 250k |
| polyline-encoded@0.0.9 | 118k |
| @lp-labs/polyline-codec@0.1.0 | 33.2k |
| decode-google-map-polyline@1.0.1 | 15.1k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **531k** |
| **@duoquote/polytini@0.1.4** | 488k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 468k |
| **@duoquote/polytini@0.1.4 (web entry)** | 438k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 387k |
| **@duoquote/polytini@0.1.4 (wasm)** | 385k |
| @pirxpilot/google-polyline@4.0.1 | 231k |
| google-polyline@2.0.0 | 225k |
| @placemarkio/polyline@2.0.3 | 190k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 175k |
| @mapbox/polyline@1.2.1 | 173k |
| @googlemaps/polyline-codec@1.0.28 | 87.8k |
| @lp-labs/polyline-codec@0.1.0 | 39.8k |
| polyline-encoded@0.0.9 | 12.6k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 81.1 | **120** | **130** | **127** | **40.0** | **70.4** |
| @placemarkio/polyline@2.0.3 | 92.8 | 99.0 | 88.5 | 86.5 | 33.4 | 51.9 |
| @googlemaps/polyline-codec@1.0.28 | 74.5 | 115 | 115 | 105 | 17.9 | 54.3 |
| @mapbox/polyline@1.2.1 | **99.1** | 96.7 | 85.2 | 88.5 | 23.9 | 52.6 |
| **@duoquote/polytini@0.1.4 (wasm)** | 81.8 | 106 | 99.1 | 91.2 | 17.3 | 56.8 |
| **@duoquote/polytini@0.1.4 (web entry)** | 81.2 | 105 | 100 | 93.5 | 17.1 | 55.9 |
| google-polyline@2.0.0 | 82.5 | 92.0 | 79.2 | 77.3 | 23.0 | 46.8 |
| @pirxpilot/google-polyline@4.0.1 | 73.2 | 76.2 | 69.7 | 69.7 | 28.6 | 44.1 |
| polyline-encoded@0.0.9 | 18.5 | 22.3 | 20.5 | 20.7 | 6.31 | 17.2 |
| @lp-labs/polyline-codec@0.1.0 | 5.61 | 7.05 | 6.45 | 5.32 | 3.21 | 4.86 |
| decode-google-map-polyline@1.0.1 | 1.35 | 2.29 | 2.36 | 2.16 | 1.40 | 2.21 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **70.1** | 119 | 126 | **117** | **108** | **71.3** |
| **@duoquote/polytini@0.1.4 (wasm)** | 48.4 | **136** | **143** | 101 | 96.4 | 56.3 |
| **@duoquote/polytini@0.1.4 (web entry)** | 49.1 | 65.6 | 73.8 | 73.8 | 32.8 | 64.1 |
| google-polyline@2.0.0 | 49.4 | 64.9 | 64.2 | 50.1 | 15.3 | 32.9 |
| @pirxpilot/google-polyline@4.0.1 | 41.0 | 57.5 | 64.1 | 51.7 | 15.1 | 33.8 |
| @placemarkio/polyline@2.0.3 | 33.4 | 57.0 | 53.6 | 45.4 | 13.0 | 27.8 |
| @mapbox/polyline@1.2.1 | 29.3 | 49.2 | 45.4 | 39.7 | 12.6 | 25.3 |
| @googlemaps/polyline-codec@1.0.28 | 15.5 | 21.9 | 19.2 | 12.7 | 10.5 | 12.8 |
| @lp-labs/polyline-codec@0.1.0 | 7.32 | 9.43 | 7.90 | 7.17 | 4.56 | 5.82 |
| polyline-encoded@0.0.9 | 1.88 | 1.92 | 1.94 | 1.87 | 1.73 | 1.84 |
