## Node v24.22.3, precision 5

- Runtime: Node v24.22.3 (V8 13.6.233.17-node.63)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 6%, worst 58%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 8.16M | **1.25M** | **131k** | **12.4k** | **995** | **527k** |
| @googlemaps/polyline-codec@1.0.28 | 7.69M | 1.17M | 114k | 10.3k | 804 | 383k |
| **@duoquote/polytini@0.1.4 (wasm)** | 8.08M | 1.09M | 104k | 9.56k | 790 | 403k |
| **@duoquote/polytini@0.1.4 (web entry)** | 8.28M | 1.09M | 104k | 9.51k | 790 | 396k |
| @placemarkio/polyline@2.0.3 | **9.59M** | 1.02M | 87.0k | 8.69k | 618 | 359k |
| @mapbox/polyline@1.2.1 | 9.45M | 932k | 84.0k | 8.28k | 615 | 353k |
| google-polyline@2.0.0 | 8.19M | 907k | 74.2k | 7.54k | 577 | 327k |
| @pirxpilot/google-polyline@4.0.1 | 7.13M | 790k | 67.3k | 6.73k | 545 | 309k |
| polyline-encoded@0.0.9 | 2.19M | 243k | 23.1k | 1.97k | 154 | 113k |
| @lp-labs/polyline-codec@0.1.0 | 648k | 73.2k | 6.88k | 629 | 45.0 | 35.9k |
| decode-google-map-polyline@1.0.1 | 189k | 29.5k | 3.17k | 307 | 20.4 | 19.3k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **6.73M** | 1.13M | 123k | **11.4k** | **1.07k** | **473k** |
| **@duoquote/polytini@0.1.4 (wasm)** | 4.82M | **1.41M** | **152k** | 10.8k | 1.06k | 421k |
| **@duoquote/polytini@0.1.4 (web entry)** | 4.92M | 668k | 72.8k | 7.20k | 730 | 416k |
| @pirxpilot/google-polyline@4.0.1 | 4.97M | 589k | 65.2k | 5.11k | 516 | 236k |
| google-polyline@2.0.0 | 5.02M | 661k | 63.6k | 4.88k | 494 | 232k |
| @placemarkio/polyline@2.0.3 | 3.86M | 585k | 53.9k | 4.64k | 405 | 203k |
| @mapbox/polyline@1.2.1 | 3.37M | 486k | 46.7k | 3.99k | 359 | 175k |
| @googlemaps/polyline-codec@1.0.28 | 1.78M | 231k | 20.5k | 1.38k | 118 | 92.0k |
| @lp-labs/polyline-codec@0.1.0 | 768k | 89.8k | 8.08k | 706 | 53.7 | 41.8k |
| polyline-encoded@0.0.9 | 239k | 24.8k | 2.38k | 231 | 22.4 | 15.6k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 0.86x | **1.34x** | **1.56x** | **1.50x** | **1.62x** | **1.49x** |
| @googlemaps/polyline-codec@1.0.28 | 0.81x | 1.26x | 1.36x | 1.24x | 1.31x | 1.09x |
| **@duoquote/polytini@0.1.4 (wasm)** | 0.86x | 1.17x | 1.24x | 1.15x | 1.28x | 1.14x |
| **@duoquote/polytini@0.1.4 (web entry)** | 0.88x | 1.17x | 1.24x | 1.15x | 1.28x | 1.12x |
| @placemarkio/polyline@2.0.3 | **1.02x** | 1.10x | 1.04x | 1.05x | 1.00x | 1.02x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| google-polyline@2.0.0 | 0.87x | 0.97x | 0.88x | 0.91x | 0.94x | 0.93x |
| @pirxpilot/google-polyline@4.0.1 | 0.75x | 0.85x | 0.80x | 0.81x | 0.89x | 0.88x |
| polyline-encoded@0.0.9 | 0.23x | 0.26x | 0.27x | 0.24x | 0.25x | 0.32x |
| @lp-labs/polyline-codec@0.1.0 | 0.07x | 0.08x | 0.08x | 0.08x | 0.07x | 0.10x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.03x | 0.04x | 0.04x | 0.03x | 0.05x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **1.99x** | 2.33x | 2.64x | **2.85x** | **2.97x** | **2.71x** |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.43x | **2.90x** | **3.27x** | 2.70x | 2.95x | 2.41x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.46x | 1.37x | 1.56x | 1.81x | 2.03x | 2.38x |
| @pirxpilot/google-polyline@4.0.1 | 1.47x | 1.21x | 1.40x | 1.28x | 1.44x | 1.35x |
| google-polyline@2.0.0 | 1.49x | 1.36x | 1.36x | 1.22x | 1.37x | 1.33x |
| @placemarkio/polyline@2.0.3 | 1.14x | 1.20x | 1.16x | 1.16x | 1.13x | 1.16x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.53x | 0.47x | 0.44x | 0.35x | 0.33x | 0.53x |
| @lp-labs/polyline-codec@0.1.0 | 0.23x | 0.18x | 0.17x | 0.18x | 0.15x | 0.24x |
| polyline-encoded@0.0.9 | 0.07x | 0.05x | 0.05x | 0.06x | 0.06x | 0.09x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | 1.87M | **791k** | **92.5k** | **10.6k** | **1.22k** | 355k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 1.87M | 716k | 83.3k | 9.89k | 1.20k | **359k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.29M** | 623k | 59.6k | 4.84k | 408 | 240k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 4.85M | **1.78M** | **191k** | **12.4k** | **1.17k** | 483k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | **6.66M** | 1.19M | 128k | 12.1k | 1.05k | **522k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.27M | 576k | 50.0k | 3.84k | 363 | 183k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | **600k** |
| **@duoquote/polytini@0.1.4** | 527k |
| **@duoquote/polytini@0.1.4 (wasm)** | 403k |
| **@duoquote/polytini@0.1.4 (web entry)** | 396k |
| @googlemaps/polyline-codec@1.0.28 | 383k |
| @placemarkio/polyline@2.0.3 | 359k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 359k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 355k |
| @mapbox/polyline@1.2.1 | 353k |
| google-polyline@2.0.0 | 327k |
| @pirxpilot/google-polyline@4.0.1 | 309k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 292k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 240k |
| polyline-encoded@0.0.9 | 113k |
| @lp-labs/polyline-codec@0.1.0 | 35.9k |
| decode-google-map-polyline@1.0.1 | 19.3k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **522k** |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 483k |
| **@duoquote/polytini@0.1.4** | 473k |
| **@duoquote/polytini@0.1.4 (wasm)** | 421k |
| **@duoquote/polytini@0.1.4 (web entry)** | 416k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 378k |
| @pirxpilot/google-polyline@4.0.1 | 236k |
| google-polyline@2.0.0 | 232k |
| @placemarkio/polyline@2.0.3 | 203k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 183k |
| @mapbox/polyline@1.2.1 | 175k |
| @googlemaps/polyline-codec@1.0.28 | 92.0k |
| @lp-labs/polyline-codec@0.1.0 | 41.8k |
| polyline-encoded@0.0.9 | 15.6k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 81.6 | **125** | **131** | **124** | **99.5** | **77.2** |
| @googlemaps/polyline-codec@1.0.28 | 76.9 | 117 | 114 | 103 | 80.4 | 56.1 |
| **@duoquote/polytini@0.1.4 (wasm)** | 80.8 | 109 | 104 | 95.6 | 79.0 | 59.0 |
| **@duoquote/polytini@0.1.4 (web entry)** | 82.8 | 109 | 104 | 95.1 | 79.0 | 58.0 |
| @placemarkio/polyline@2.0.3 | **95.9** | 102 | 87.0 | 86.9 | 61.8 | 52.6 |
| @mapbox/polyline@1.2.1 | 94.5 | 93.2 | 84.0 | 82.8 | 61.5 | 51.7 |
| google-polyline@2.0.0 | 81.9 | 90.7 | 74.2 | 75.4 | 57.7 | 47.9 |
| @pirxpilot/google-polyline@4.0.1 | 71.3 | 79.0 | 67.3 | 67.3 | 54.5 | 45.3 |
| polyline-encoded@0.0.9 | 21.9 | 24.3 | 23.1 | 19.7 | 15.4 | 16.6 |
| @lp-labs/polyline-codec@0.1.0 | 6.48 | 7.32 | 6.88 | 6.29 | 4.50 | 5.25 |
| decode-google-map-polyline@1.0.1 | 1.89 | 2.95 | 3.17 | 3.07 | 2.04 | 2.82 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **67.3** | 113 | 123 | **114** | **107** | **69.3** |
| **@duoquote/polytini@0.1.4 (wasm)** | 48.2 | **141** | **152** | 108 | 106 | 61.6 |
| **@duoquote/polytini@0.1.4 (web entry)** | 49.2 | 66.8 | 72.8 | 72.0 | 73.0 | 60.9 |
| @pirxpilot/google-polyline@4.0.1 | 49.7 | 58.9 | 65.2 | 51.1 | 51.6 | 34.5 |
| google-polyline@2.0.0 | 50.2 | 66.1 | 63.6 | 48.8 | 49.4 | 34.0 |
| @placemarkio/polyline@2.0.3 | 38.6 | 58.5 | 53.9 | 46.4 | 40.5 | 29.7 |
| @mapbox/polyline@1.2.1 | 33.7 | 48.6 | 46.7 | 39.9 | 35.9 | 25.6 |
| @googlemaps/polyline-codec@1.0.28 | 17.8 | 23.1 | 20.5 | 13.8 | 11.8 | 13.5 |
| @lp-labs/polyline-codec@0.1.0 | 7.68 | 8.98 | 8.08 | 7.06 | 5.37 | 6.12 |
| polyline-encoded@0.0.9 | 2.39 | 2.48 | 2.38 | 2.31 | 2.24 | 2.28 |
