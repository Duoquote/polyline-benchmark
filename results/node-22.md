## Node v22.23.5, precision 5

- Runtime: Node v22.23.5 (V8 12.4.254.21-node.57)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 35%, worst 89%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 4.91M | **822k** | **82.1k** | **8.22k** | **235** | **328k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 6.32M | 767k | 81.0k | 7.88k | 154 | 282k |
| @mapbox/polyline@1.2.1 | **7.68M** | 742k | 59.1k | 6.10k | 234 | 241k |
| @placemarkio/polyline@2.0.3 | 6.75M | 681k | 66.1k | 6.20k | 232 | 256k |
| **@duoquote/polytini@0.1.0 (web entry)** | 5.78M | 776k | 71.9k | 7.31k | 151 | 255k |
| @googlemaps/polyline-codec@1.0.28 | 5.20M | 702k | 66.8k | 6.93k | 133 | 277k |
| google-polyline@2.0.0 | 6.11M | 482k | 47.1k | 5.77k | 186 | 249k |
| @pirxpilot/google-polyline@4.0.1 | 5.68M | 389k | 47.5k | 3.94k | 186 | 227k |
| polyline-encoded@0.0.9 | 1.49M | 145k | 13.0k | 1.20k | 42.9 | 77.5k |
| @lp-labs/polyline-codec@0.1.0 | 429k | 55.5k | 5.14k | 401 | 26.1 | 24.9k |
| decode-google-map-polyline@1.0.1 | 82.2k | 16.2k | 1.74k | 168 | 10.1 | 9.96k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **4.59M** | **972k** | 85.2k | **11.2k** | **857** | **423k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 3.30M | 785k | **87.5k** | 6.99k | 623 | 284k |
| **@duoquote/polytini@0.1.0 (web entry)** | 2.92M | 513k | 57.1k | 5.95k | 328 | 297k |
| google-polyline@2.0.0 | 4.42M | 445k | 43.4k | 4.07k | 116 | 174k |
| @pirxpilot/google-polyline@4.0.1 | 3.83M | 495k | 45.0k | 3.35k | 102 | 166k |
| @placemarkio/polyline@2.0.3 | 2.80M | 446k | 43.1k | 3.31k | 106 | 134k |
| @mapbox/polyline@1.2.1 | 2.82M | 419k | 38.2k | 3.20k | 105 | 134k |
| @googlemaps/polyline-codec@1.0.28 | 1.12M | 190k | 13.9k | 961 | 75.9 | 69.7k |
| @lp-labs/polyline-codec@0.1.0 | 511k | 68.7k | 5.70k | 468 | 34.4 | 30.2k |
| polyline-encoded@0.0.9 | 124k | 14.9k | 1.29k | 120 | 12.5 | 8.69k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 0.64x | **1.11x** | **1.39x** | **1.35x** | **1.01x** | **1.36x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 0.82x | 1.03x | 1.37x | 1.29x | 0.66x | 1.17x |
| @mapbox/polyline@1.2.1 | **1.00x** | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @placemarkio/polyline@2.0.3 | 0.88x | 0.92x | 1.12x | 1.02x | 0.99x | 1.07x |
| **@duoquote/polytini@0.1.0 (web entry)** | 0.75x | 1.05x | 1.22x | 1.20x | 0.65x | 1.06x |
| @googlemaps/polyline-codec@1.0.28 | 0.68x | 0.95x | 1.13x | 1.14x | 0.57x | 1.15x |
| google-polyline@2.0.0 | 0.80x | 0.65x | 0.80x | 0.95x | 0.80x | 1.04x |
| @pirxpilot/google-polyline@4.0.1 | 0.74x | 0.52x | 0.80x | 0.65x | 0.80x | 0.94x |
| polyline-encoded@0.0.9 | 0.19x | 0.20x | 0.22x | 0.20x | 0.18x | 0.32x |
| @lp-labs/polyline-codec@0.1.0 | 0.06x | 0.07x | 0.09x | 0.07x | 0.11x | 0.10x |
| decode-google-map-polyline@1.0.1 | 0.01x | 0.02x | 0.03x | 0.03x | 0.04x | 0.04x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **1.63x** | **2.32x** | 2.23x | **3.51x** | **8.13x** | **3.16x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.17x | 1.87x | **2.29x** | 2.18x | 5.91x | 2.12x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.03x | 1.22x | 1.50x | 1.86x | 3.11x | 2.22x |
| google-polyline@2.0.0 | 1.57x | 1.06x | 1.14x | 1.27x | 1.10x | 1.30x |
| @pirxpilot/google-polyline@4.0.1 | 1.36x | 1.18x | 1.18x | 1.04x | 0.97x | 1.24x |
| @placemarkio/polyline@2.0.3 | 0.99x | 1.06x | 1.13x | 1.03x | 1.00x | 1.00x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.40x | 0.45x | 0.36x | 0.30x | 0.72x | 0.52x |
| @lp-labs/polyline-codec@0.1.0 | 0.18x | 0.16x | 0.15x | 0.15x | 0.33x | 0.23x |
| polyline-encoded@0.0.9 | 0.04x | 0.04x | 0.03x | 0.04x | 0.12x | 0.06x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 1.60M | **544k** | **72.7k** | **7.77k** | **779** | **293k** |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 1.45M | 516k | 60.0k | 5.16k | 773 | 204k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.68M** | 491k | 46.7k | 3.34k | 258 | 192k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **4.57M** | 939k | 108k | **11.2k** | **824** | **474k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 3.48M | **993k** | **114k** | 8.16k | 717 | 331k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 1.92M | 438k | 31.3k | 3.11k | 107 | 138k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | **517k** |
| **@duoquote/polytini@0.1.0** | 328k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 293k |
| **@duoquote/polytini@0.1.0 (wasm)** | 282k |
| @googlemaps/polyline-codec@1.0.28 | 277k |
| @placemarkio/polyline@2.0.3 | 256k |
| **@duoquote/polytini@0.1.0 (web entry)** | 255k |
| google-polyline@2.0.0 | 249k |
| @mapbox/polyline@1.2.1 | 241k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 232k |
| @pirxpilot/google-polyline@4.0.1 | 227k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 204k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 192k |
| polyline-encoded@0.0.9 | 77.5k |
| @lp-labs/polyline-codec@0.1.0 | 24.9k |
| decode-google-map-polyline@1.0.1 | 9.96k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **474k** |
| **@duoquote/polytini@0.1.0** | 423k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 331k |
| **@duoquote/polytini@0.1.0 (web entry)** | 297k |
| **@duoquote/polytini@0.1.0 (wasm)** | 284k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 276k |
| google-polyline@2.0.0 | 174k |
| @pirxpilot/google-polyline@4.0.1 | 166k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 138k |
| @placemarkio/polyline@2.0.3 | 134k |
| @mapbox/polyline@1.2.1 | 134k |
| @googlemaps/polyline-codec@1.0.28 | 69.7k |
| @lp-labs/polyline-codec@0.1.0 | 30.2k |
| polyline-encoded@0.0.9 | 8.69k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 49.1 | **82.2** | **82.1** | **82.2** | **23.5** | **47.9** |
| **@duoquote/polytini@0.1.0 (wasm)** | 63.2 | 76.7 | 81.0 | 78.8 | 15.4 | 41.3 |
| @mapbox/polyline@1.2.1 | **76.8** | 74.2 | 59.1 | 61.0 | 23.4 | 35.2 |
| @placemarkio/polyline@2.0.3 | 67.5 | 68.1 | 66.1 | 62.0 | 23.2 | 37.5 |
| **@duoquote/polytini@0.1.0 (web entry)** | 57.8 | 77.6 | 71.9 | 73.1 | 15.1 | 37.4 |
| @googlemaps/polyline-codec@1.0.28 | 52.0 | 70.2 | 66.8 | 69.3 | 13.3 | 40.5 |
| google-polyline@2.0.0 | 61.1 | 48.2 | 47.1 | 57.7 | 18.6 | 36.5 |
| @pirxpilot/google-polyline@4.0.1 | 56.8 | 38.9 | 47.5 | 39.4 | 18.6 | 33.2 |
| polyline-encoded@0.0.9 | 14.9 | 14.5 | 13.0 | 12.0 | 4.29 | 11.3 |
| @lp-labs/polyline-codec@0.1.0 | 4.29 | 5.55 | 5.14 | 4.01 | 2.61 | 3.65 |
| decode-google-map-polyline@1.0.1 | 0.82 | 1.62 | 1.74 | 1.68 | 1.01 | 1.46 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **45.9** | **97.2** | 85.2 | **112** | **85.7** | **61.9** |
| **@duoquote/polytini@0.1.0 (wasm)** | 33.0 | 78.5 | **87.5** | 69.9 | 62.3 | 41.5 |
| **@duoquote/polytini@0.1.0 (web entry)** | 29.2 | 51.3 | 57.1 | 59.5 | 32.8 | 43.5 |
| google-polyline@2.0.0 | 44.2 | 44.5 | 43.4 | 40.7 | 11.6 | 25.5 |
| @pirxpilot/google-polyline@4.0.1 | 38.3 | 49.5 | 45.0 | 33.5 | 10.2 | 24.3 |
| @placemarkio/polyline@2.0.3 | 28.0 | 44.6 | 43.1 | 33.1 | 10.6 | 19.6 |
| @mapbox/polyline@1.2.1 | 28.2 | 41.9 | 38.2 | 32.0 | 10.5 | 19.6 |
| @googlemaps/polyline-codec@1.0.28 | 11.2 | 19.0 | 13.9 | 9.61 | 7.59 | 10.2 |
| @lp-labs/polyline-codec@0.1.0 | 5.11 | 6.87 | 5.70 | 4.68 | 3.44 | 4.41 |
| polyline-encoded@0.0.9 | 1.24 | 1.49 | 1.29 | 1.20 | 1.25 | 1.27 |
