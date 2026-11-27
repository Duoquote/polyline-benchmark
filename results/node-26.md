## Node v26.13.1, precision 5

- Runtime: Node v26.13.1 (V8 14.6.202.34-node.40)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 7%, worst 56%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 8.15M | **1.27M** | **127k** | **11.5k** | **981** | **521k** |
| @googlemaps/polyline-codec@1.0.28 | 8.71M | 1.18M | 115k | 10.6k | 810 | 382k |
| **@duoquote/polytini@0.1.4 (web entry)** | 8.25M | 1.06M | 99.5k | 9.18k | 764 | 377k |
| **@duoquote/polytini@0.1.4 (wasm)** | 8.10M | 1.06M | 98.4k | 9.16k | 761 | 384k |
| @placemarkio/polyline@2.0.3 | **9.95M** | 968k | 85.9k | 8.78k | 724 | 362k |
| @mapbox/polyline@1.2.1 | 9.79M | 943k | 84.8k | 8.51k | 685 | 353k |
| google-polyline@2.0.0 | 8.12M | 892k | 78.5k | 7.79k | 632 | 324k |
| @pirxpilot/google-polyline@4.0.1 | 6.23M | 688k | 61.3k | 6.28k | 527 | 273k |
| polyline-encoded@0.0.9 | 2.21M | 244k | 22.5k | 2.37k | 108 | 121k |
| @lp-labs/polyline-codec@0.1.0 | 642k | 72.7k | 6.87k | 614 | 39.3 | 34.5k |
| decode-google-map-polyline@1.0.1 | 232k | 36.6k | 3.88k | 382 | 21.7 | 23.2k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **7.42M** | 1.23M | 127k | **11.6k** | **1.12k** | **492k** |
| **@duoquote/polytini@0.1.4 (wasm)** | 5.14M | **1.49M** | **152k** | 10.6k | 1.06k | 374k |
| **@duoquote/polytini@0.1.4 (web entry)** | 5.12M | 682k | 75.8k | 7.55k | 753 | 439k |
| @pirxpilot/google-polyline@4.0.1 | 5.05M | 640k | 70.0k | 5.26k | 548 | 233k |
| google-polyline@2.0.0 | 5.04M | 671k | 64.0k | 5.13k | 486 | 224k |
| @placemarkio/polyline@2.0.3 | 4.10M | 573k | 54.4k | 4.65k | 424 | 205k |
| @mapbox/polyline@1.2.1 | 3.68M | 532k | 47.8k | 4.04k | 359 | 168k |
| @googlemaps/polyline-codec@1.0.28 | 1.93M | 249k | 21.7k | 1.86k | 167 | 96.5k |
| @lp-labs/polyline-codec@0.1.0 | 791k | 91.3k | 8.26k | 733 | 59.2 | 42.2k |
| polyline-encoded@0.0.9 | 297k | 30.9k | 3.06k | 299 | 28.0 | 19.2k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 0.83x | **1.35x** | **1.49x** | **1.35x** | **1.43x** | **1.48x** |
| @googlemaps/polyline-codec@1.0.28 | 0.89x | 1.25x | 1.36x | 1.24x | 1.18x | 1.08x |
| **@duoquote/polytini@0.1.4 (web entry)** | 0.84x | 1.13x | 1.17x | 1.08x | 1.12x | 1.07x |
| **@duoquote/polytini@0.1.4 (wasm)** | 0.83x | 1.12x | 1.16x | 1.08x | 1.11x | 1.09x |
| @placemarkio/polyline@2.0.3 | **1.02x** | 1.03x | 1.01x | 1.03x | 1.06x | 1.02x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| google-polyline@2.0.0 | 0.83x | 0.95x | 0.93x | 0.92x | 0.92x | 0.92x |
| @pirxpilot/google-polyline@4.0.1 | 0.64x | 0.73x | 0.72x | 0.74x | 0.77x | 0.77x |
| polyline-encoded@0.0.9 | 0.23x | 0.26x | 0.26x | 0.28x | 0.16x | 0.34x |
| @lp-labs/polyline-codec@0.1.0 | 0.07x | 0.08x | 0.08x | 0.07x | 0.06x | 0.10x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.04x | 0.05x | 0.04x | 0.03x | 0.07x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **2.02x** | 2.31x | 2.67x | **2.87x** | **3.12x** | **2.93x** |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.40x | **2.79x** | **3.18x** | 2.61x | 2.94x | 2.23x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.39x | 1.28x | 1.59x | 1.87x | 2.10x | 2.61x |
| @pirxpilot/google-polyline@4.0.1 | 1.37x | 1.20x | 1.47x | 1.30x | 1.53x | 1.39x |
| google-polyline@2.0.0 | 1.37x | 1.26x | 1.34x | 1.27x | 1.36x | 1.33x |
| @placemarkio/polyline@2.0.3 | 1.11x | 1.08x | 1.14x | 1.15x | 1.18x | 1.22x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.53x | 0.47x | 0.45x | 0.46x | 0.46x | 0.57x |
| @lp-labs/polyline-codec@0.1.0 | 0.22x | 0.17x | 0.17x | 0.18x | 0.17x | 0.25x |
| polyline-encoded@0.0.9 | 0.08x | 0.06x | 0.06x | 0.07x | 0.08x | 0.11x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | 2.12M | **832k** | **90.3k** | **10.1k** | 1.20k | **372k** |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 2.08M | 703k | 81.6k | 9.82k | **1.23k** | 370k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.11M** | 620k | 60.3k | 6.45k | 472 | 249k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 5.13M | **1.84M** | **190k** | 12.0k | **1.17k** | 475k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | **7.62M** | 1.25M | 127k | **12.0k** | 1.14k | **542k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.25M | 581k | 51.3k | 4.31k | 385 | 180k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | **624k** |
| **@duoquote/polytini@0.1.4** | 521k |
| **@duoquote/polytini@0.1.4 (wasm)** | 384k |
| @googlemaps/polyline-codec@1.0.28 | 382k |
| **@duoquote/polytini@0.1.4 (web entry)** | 377k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 372k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 370k |
| @placemarkio/polyline@2.0.3 | 362k |
| @mapbox/polyline@1.2.1 | 353k |
| google-polyline@2.0.0 | 324k |
| @pirxpilot/google-polyline@4.0.1 | 273k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 270k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 249k |
| polyline-encoded@0.0.9 | 121k |
| @lp-labs/polyline-codec@0.1.0 | 34.5k |
| decode-google-map-polyline@1.0.1 | 23.2k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **542k** |
| **@duoquote/polytini@0.1.4** | 492k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 475k |
| **@duoquote/polytini@0.1.4 (web entry)** | 439k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 375k |
| **@duoquote/polytini@0.1.4 (wasm)** | 374k |
| @pirxpilot/google-polyline@4.0.1 | 233k |
| google-polyline@2.0.0 | 224k |
| @placemarkio/polyline@2.0.3 | 205k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 180k |
| @mapbox/polyline@1.2.1 | 168k |
| @googlemaps/polyline-codec@1.0.28 | 96.5k |
| @lp-labs/polyline-codec@0.1.0 | 42.2k |
| polyline-encoded@0.0.9 | 19.2k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 81.5 | **127** | **127** | **115** | **98.1** | **76.2** |
| @googlemaps/polyline-codec@1.0.28 | 87.1 | 118 | 115 | 106 | 81.0 | 55.9 |
| **@duoquote/polytini@0.1.4 (web entry)** | 82.5 | 106 | 99.5 | 91.8 | 76.4 | 55.2 |
| **@duoquote/polytini@0.1.4 (wasm)** | 81.0 | 106 | 98.4 | 91.6 | 76.1 | 56.2 |
| @placemarkio/polyline@2.0.3 | **99.5** | 96.8 | 85.9 | 87.8 | 72.4 | 52.9 |
| @mapbox/polyline@1.2.1 | 97.9 | 94.3 | 84.8 | 85.1 | 68.5 | 51.7 |
| google-polyline@2.0.0 | 81.2 | 89.2 | 78.5 | 77.9 | 63.2 | 47.4 |
| @pirxpilot/google-polyline@4.0.1 | 62.3 | 68.8 | 61.3 | 62.8 | 52.7 | 39.9 |
| polyline-encoded@0.0.9 | 22.1 | 24.4 | 22.5 | 23.7 | 10.8 | 17.7 |
| @lp-labs/polyline-codec@0.1.0 | 6.42 | 7.27 | 6.87 | 6.14 | 3.93 | 5.05 |
| decode-google-map-polyline@1.0.1 | 2.32 | 3.66 | 3.88 | 3.82 | 2.17 | 3.39 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **74.2** | 123 | 127 | **116** | **112** | **72.0** |
| **@duoquote/polytini@0.1.4 (wasm)** | 51.4 | **149** | **152** | 106 | 106 | 54.8 |
| **@duoquote/polytini@0.1.4 (web entry)** | 51.2 | 68.2 | 75.8 | 75.5 | 75.3 | 64.2 |
| @pirxpilot/google-polyline@4.0.1 | 50.5 | 64.0 | 70.0 | 52.6 | 54.8 | 34.1 |
| google-polyline@2.0.0 | 50.4 | 67.1 | 64.0 | 51.3 | 48.6 | 32.7 |
| @placemarkio/polyline@2.0.3 | 41.0 | 57.3 | 54.4 | 46.5 | 42.4 | 30.0 |
| @mapbox/polyline@1.2.1 | 36.8 | 53.2 | 47.8 | 40.4 | 35.9 | 24.6 |
| @googlemaps/polyline-codec@1.0.28 | 19.3 | 24.9 | 21.7 | 18.6 | 16.7 | 14.1 |
| @lp-labs/polyline-codec@0.1.0 | 7.91 | 9.13 | 8.26 | 7.33 | 5.92 | 6.17 |
| polyline-encoded@0.0.9 | 2.97 | 3.09 | 3.06 | 2.99 | 2.80 | 2.81 |
