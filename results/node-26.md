## Node v26.13.1, precision 5

- Runtime: Node v26.13.1 (V8 14.6.202.34-node.40)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 34%, worst 87%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 6.99M | **887k** | 80.5k | **8.33k** | **561** | **413k** |
| @googlemaps/polyline-codec@1.0.28 | **7.39M** | 851k | **89.6k** | 8.31k | 506 | 307k |
| **@duoquote/polytini@0.1.0 (wasm)** | 6.27M | 859k | 88.7k | 5.95k | 474 | 339k |
| @mapbox/polyline@1.2.1 | 7.06M | 615k | 64.3k | 6.82k | 478 | 308k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.00M | 791k | 66.5k | 5.87k | 414 | 295k |
| @placemarkio/polyline@2.0.3 | 7.22M | 719k | 60.6k | 6.33k | 446 | 284k |
| google-polyline@2.0.0 | 6.93M | 626k | 49.3k | 6.30k | 426 | 265k |
| @pirxpilot/google-polyline@4.0.1 | 5.41M | 520k | 43.3k | 5.18k | 410 | 242k |
| polyline-encoded@0.0.9 | 1.74M | 144k | 15.5k | 1.86k | 83.0 | 94.4k |
| @lp-labs/polyline-codec@0.1.0 | 541k | 49.4k | 4.23k | 491 | 28.6 | 26.3k |
| decode-google-map-polyline@1.0.1 | 162k | 29.0k | 3.23k | 313 | 15.5 | 17.0k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **6.24M** | 1.18M | 122k | **10.8k** | 597 | **373k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.05M | **1.36M** | **145k** | 9.49k | **817** | 299k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.72M | 550k | 66.1k | 6.80k | 601 | 317k |
| google-polyline@2.0.0 | 4.25M | 600k | 55.2k | 4.10k | 326 | 169k |
| @pirxpilot/google-polyline@4.0.1 | 4.58M | 435k | 44.4k | 4.50k | 377 | 180k |
| @placemarkio/polyline@2.0.3 | 3.76M | 406k | 48.0k | 3.89k | 274 | 161k |
| @mapbox/polyline@1.2.1 | 3.30M | 458k | 40.5k | 3.82k | 298 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 1.73M | 225k | 16.8k | 1.46k | 118 | 69.1k |
| @lp-labs/polyline-codec@0.1.0 | 688k | 76.3k | 6.45k | 435 | 43.9 | 33.5k |
| polyline-encoded@0.0.9 | 241k | 25.7k | 2.66k | 239 | 22.8 | 16.2k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 0.99x | **1.44x** | 1.25x | **1.22x** | **1.17x** | **1.34x** |
| @googlemaps/polyline-codec@1.0.28 | **1.05x** | 1.39x | **1.39x** | 1.22x | 1.06x | 1.00x |
| **@duoquote/polytini@0.1.0 (wasm)** | 0.89x | 1.40x | 1.38x | 0.87x | 0.99x | 1.10x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| **@duoquote/polytini@0.1.0 (web entry)** | 0.99x | 1.29x | 1.04x | 0.86x | 0.86x | 0.96x |
| @placemarkio/polyline@2.0.3 | 1.02x | 1.17x | 0.94x | 0.93x | 0.93x | 0.92x |
| google-polyline@2.0.0 | 0.98x | 1.02x | 0.77x | 0.92x | 0.89x | 0.86x |
| @pirxpilot/google-polyline@4.0.1 | 0.77x | 0.85x | 0.67x | 0.76x | 0.86x | 0.79x |
| polyline-encoded@0.0.9 | 0.25x | 0.23x | 0.24x | 0.27x | 0.17x | 0.31x |
| @lp-labs/polyline-codec@0.1.0 | 0.08x | 0.08x | 0.07x | 0.07x | 0.06x | 0.09x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.05x | 0.05x | 0.05x | 0.03x | 0.06x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **1.89x** | 2.57x | 3.01x | **2.84x** | 2.00x | **2.45x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.23x | **2.97x** | **3.57x** | 2.49x | **2.74x** | 1.97x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.13x | 1.20x | 1.63x | 1.78x | 2.02x | 2.09x |
| google-polyline@2.0.0 | 1.29x | 1.31x | 1.36x | 1.07x | 1.09x | 1.11x |
| @pirxpilot/google-polyline@4.0.1 | 1.39x | 0.95x | 1.10x | 1.18x | 1.27x | 1.18x |
| @placemarkio/polyline@2.0.3 | 1.14x | 0.88x | 1.18x | 1.02x | 0.92x | 1.06x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.52x | 0.49x | 0.41x | 0.38x | 0.40x | 0.45x |
| @lp-labs/polyline-codec@0.1.0 | 0.21x | 0.17x | 0.16x | 0.11x | 0.15x | 0.22x |
| polyline-encoded@0.0.9 | 0.07x | 0.06x | 0.07x | 0.06x | 0.08x | 0.11x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 1.79M | **626k** | 57.2k | **7.27k** | 828 | 244k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 1.54M | 489k | **75.6k** | 6.77k | **924** | **252k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **3.62M** | 504k | 47.8k | 5.39k | 365 | 182k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **5.85M** | 1.15M | 122k | **11.3k** | 979 | **440k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 4.07M | **1.35M** | **172k** | 9.00k | **1.08k** | 384k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 2.67M | 476k | 44.9k | 3.76k | 277 | 155k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | **454k** |
| **@duoquote/polytini@0.1.0** | 413k |
| **@duoquote/polytini@0.1.0 (wasm)** | 339k |
| @mapbox/polyline@1.2.1 | 308k |
| @googlemaps/polyline-codec@1.0.28 | 307k |
| **@duoquote/polytini@0.1.0 (web entry)** | 295k |
| @placemarkio/polyline@2.0.3 | 284k |
| google-polyline@2.0.0 | 265k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 252k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 244k |
| @pirxpilot/google-polyline@4.0.1 | 242k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 206k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 182k |
| polyline-encoded@0.0.9 | 94.4k |
| @lp-labs/polyline-codec@0.1.0 | 26.3k |
| decode-google-map-polyline@1.0.1 | 17.0k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **440k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 384k |
| **@duoquote/polytini@0.1.0** | 373k |
| **@duoquote/polytini@0.1.0 (web entry)** | 317k |
| **@duoquote/polytini@0.1.0 (wasm)** | 299k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 288k |
| @pirxpilot/google-polyline@4.0.1 | 180k |
| google-polyline@2.0.0 | 169k |
| @placemarkio/polyline@2.0.3 | 161k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 155k |
| @mapbox/polyline@1.2.1 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 69.1k |
| @lp-labs/polyline-codec@0.1.0 | 33.5k |
| polyline-encoded@0.0.9 | 16.2k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 69.9 | **88.7** | 80.5 | **83.3** | **56.1** | **60.4** |
| @googlemaps/polyline-codec@1.0.28 | **73.9** | 85.1 | **89.6** | 83.1 | 50.6 | 45.0 |
| **@duoquote/polytini@0.1.0 (wasm)** | 62.7 | 85.9 | 88.7 | 59.5 | 47.4 | 49.6 |
| @mapbox/polyline@1.2.1 | 70.6 | 61.5 | 64.3 | 68.2 | 47.8 | 45.0 |
| **@duoquote/polytini@0.1.0 (web entry)** | 70.0 | 79.1 | 66.5 | 58.7 | 41.4 | 43.1 |
| @placemarkio/polyline@2.0.3 | 72.2 | 71.9 | 60.6 | 63.3 | 44.6 | 41.6 |
| google-polyline@2.0.0 | 69.3 | 62.6 | 49.3 | 63.0 | 42.6 | 38.8 |
| @pirxpilot/google-polyline@4.0.1 | 54.1 | 52.0 | 43.3 | 51.8 | 41.0 | 35.5 |
| polyline-encoded@0.0.9 | 17.4 | 14.4 | 15.5 | 18.6 | 8.30 | 13.8 |
| @lp-labs/polyline-codec@0.1.0 | 5.41 | 4.94 | 4.23 | 4.91 | 2.86 | 3.85 |
| decode-google-map-polyline@1.0.1 | 1.62 | 2.90 | 3.23 | 3.13 | 1.55 | 2.48 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **62.4** | 118 | 122 | **108** | 59.7 | **54.5** |
| **@duoquote/polytini@0.1.0 (wasm)** | 40.5 | **136** | **145** | 94.9 | **81.7** | 43.8 |
| **@duoquote/polytini@0.1.0 (web entry)** | 37.2 | 55.0 | 66.1 | 68.0 | 60.1 | 46.4 |
| google-polyline@2.0.0 | 42.5 | 60.0 | 55.2 | 41.0 | 32.6 | 24.8 |
| @pirxpilot/google-polyline@4.0.1 | 45.8 | 43.5 | 44.4 | 45.0 | 37.7 | 26.3 |
| @placemarkio/polyline@2.0.3 | 37.6 | 40.6 | 48.0 | 38.9 | 27.4 | 23.6 |
| @mapbox/polyline@1.2.1 | 33.0 | 45.8 | 40.5 | 38.2 | 29.8 | 22.2 |
| @googlemaps/polyline-codec@1.0.28 | 17.3 | 22.5 | 16.8 | 14.6 | 11.8 | 10.1 |
| @lp-labs/polyline-codec@0.1.0 | 6.88 | 7.63 | 6.45 | 4.35 | 4.39 | 4.91 |
| polyline-encoded@0.0.9 | 2.41 | 2.57 | 2.66 | 2.39 | 2.28 | 2.37 |
