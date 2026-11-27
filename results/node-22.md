## Node v22.23.5, precision 5

- Runtime: Node v22.23.5 (V8 12.4.254.21-node.57)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 7%, worst 83%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 7.56M | **1.19M** | **125k** | **12.0k** | 288 | **457k** |
| @mapbox/polyline@1.2.1 | **8.52M** | 933k | 82.1k | 8.33k | **291** | 356k |
| @placemarkio/polyline@2.0.3 | 8.30M | 934k | 82.6k | 8.13k | 235 | 349k |
| **@duoquote/polytini@0.1.4 (web entry)** | 7.53M | 1.03M | 99.4k | 9.12k | 165 | 369k |
| @googlemaps/polyline-codec@1.0.28 | 6.57M | 1.06M | 106k | 9.53k | 162 | 373k |
| **@duoquote/polytini@0.1.4 (wasm)** | 7.56M | 1.02M | 95.9k | 8.86k | 162 | 381k |
| google-polyline@2.0.0 | 7.38M | 840k | 71.6k | 7.13k | 217 | 324k |
| @pirxpilot/google-polyline@4.0.1 | 6.67M | 725k | 65.8k | 6.67k | 238 | 298k |
| polyline-encoded@0.0.9 | 1.89M | 227k | 20.4k | 1.99k | 54.0 | 117k |
| @lp-labs/polyline-codec@0.1.0 | 525k | 68.2k | 6.03k | 491 | 32.3 | 30.7k |
| decode-google-map-polyline@1.0.1 | 126k | 19.9k | 2.12k | 196 | 12.8 | 13.6k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **7.09M** | **1.18M** | **128k** | **11.7k** | **1.10k** | **499k** |
| **@duoquote/polytini@0.1.4 (wasm)** | 4.97M | 1.00M | 104k | 7.66k | 781 | 357k |
| **@duoquote/polytini@0.1.4 (web entry)** | 5.01M | 681k | 74.4k | 7.52k | 387 | 429k |
| google-polyline@2.0.0 | 5.08M | 668k | 63.4k | 4.97k | 154 | 231k |
| @pirxpilot/google-polyline@4.0.1 | 4.16M | 579k | 66.6k | 5.14k | 155 | 229k |
| @placemarkio/polyline@2.0.3 | 3.36M | 552k | 51.5k | 4.35k | 133 | 187k |
| @mapbox/polyline@1.2.1 | 3.10M | 490k | 45.5k | 3.94k | 128 | 175k |
| @googlemaps/polyline-codec@1.0.28 | 1.55M | 216k | 18.9k | 1.22k | 103 | 87.7k |
| @lp-labs/polyline-codec@0.1.0 | 703k | 92.6k | 8.10k | 679 | 45.0 | 36.0k |
| polyline-encoded@0.0.9 | 166k | 17.2k | 1.66k | 165 | 15.9 | 10.5k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 0.89x | **1.27x** | **1.53x** | **1.44x** | 0.99x | **1.29x** |
| @mapbox/polyline@1.2.1 | **1.00x** | 1.00x | 1.00x | 1.00x | **1.00x** | 1.00x |
| @placemarkio/polyline@2.0.3 | 0.97x | 1.00x | 1.01x | 0.98x | 0.81x | 0.98x |
| **@duoquote/polytini@0.1.4 (web entry)** | 0.88x | 1.10x | 1.21x | 1.09x | 0.57x | 1.04x |
| @googlemaps/polyline-codec@1.0.28 | 0.77x | 1.14x | 1.29x | 1.14x | 0.56x | 1.05x |
| **@duoquote/polytini@0.1.4 (wasm)** | 0.89x | 1.10x | 1.17x | 1.06x | 0.56x | 1.07x |
| google-polyline@2.0.0 | 0.87x | 0.90x | 0.87x | 0.86x | 0.75x | 0.91x |
| @pirxpilot/google-polyline@4.0.1 | 0.78x | 0.78x | 0.80x | 0.80x | 0.82x | 0.84x |
| polyline-encoded@0.0.9 | 0.22x | 0.24x | 0.25x | 0.24x | 0.19x | 0.33x |
| @lp-labs/polyline-codec@0.1.0 | 0.06x | 0.07x | 0.07x | 0.06x | 0.11x | 0.09x |
| decode-google-map-polyline@1.0.1 | 0.01x | 0.02x | 0.03x | 0.02x | 0.04x | 0.04x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **2.29x** | **2.42x** | **2.82x** | **2.96x** | **8.63x** | **2.85x** |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.61x | 2.05x | 2.28x | 1.95x | 6.12x | 2.04x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.62x | 1.39x | 1.64x | 1.91x | 3.03x | 2.44x |
| google-polyline@2.0.0 | 1.64x | 1.36x | 1.39x | 1.26x | 1.20x | 1.32x |
| @pirxpilot/google-polyline@4.0.1 | 1.34x | 1.18x | 1.46x | 1.30x | 1.21x | 1.31x |
| @placemarkio/polyline@2.0.3 | 1.09x | 1.13x | 1.13x | 1.11x | 1.04x | 1.07x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.50x | 0.44x | 0.42x | 0.31x | 0.81x | 0.50x |
| @lp-labs/polyline-codec@0.1.0 | 0.23x | 0.19x | 0.18x | 0.17x | 0.35x | 0.21x |
| polyline-encoded@0.0.9 | 0.05x | 0.04x | 0.04x | 0.04x | 0.12x | 0.06x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | 1.85M | **774k** | **90.3k** | **10.2k** | 1.16k | **340k** |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 1.82M | 733k | 86.8k | 9.42k | **1.18k** | 308k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **5.22M** | 594k | 55.4k | 4.49k | 368 | 252k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **7.00M** | **1.23M** | **132k** | **12.6k** | **1.07k** | **532k** |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 4.88M | 1.16M | 121k | 8.87k | 847 | 405k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 2.93M | 548k | 48.0k | 3.46k | 128 | 165k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | **574k** |
| **@duoquote/polytini@0.1.4** | 457k |
| **@duoquote/polytini@0.1.4 (wasm)** | 381k |
| @googlemaps/polyline-codec@1.0.28 | 373k |
| **@duoquote/polytini@0.1.4 (web entry)** | 369k |
| @mapbox/polyline@1.2.1 | 356k |
| @placemarkio/polyline@2.0.3 | 349k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 340k |
| google-polyline@2.0.0 | 324k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 308k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 304k |
| @pirxpilot/google-polyline@4.0.1 | 298k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 252k |
| polyline-encoded@0.0.9 | 117k |
| @lp-labs/polyline-codec@0.1.0 | 30.7k |
| decode-google-map-polyline@1.0.1 | 13.6k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **532k** |
| **@duoquote/polytini@0.1.4** | 499k |
| **@duoquote/polytini@0.1.4 (web entry)** | 429k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 405k |
| **@duoquote/polytini@0.1.4 (wasm)** | 357k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 328k |
| google-polyline@2.0.0 | 231k |
| @pirxpilot/google-polyline@4.0.1 | 229k |
| @placemarkio/polyline@2.0.3 | 187k |
| @mapbox/polyline@1.2.1 | 175k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 165k |
| @googlemaps/polyline-codec@1.0.28 | 87.7k |
| @lp-labs/polyline-codec@0.1.0 | 36.0k |
| polyline-encoded@0.0.9 | 10.5k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 75.6 | **119** | **125** | **120** | 28.8 | **66.9** |
| @mapbox/polyline@1.2.1 | **85.2** | 93.3 | 82.1 | 83.3 | **29.1** | 52.1 |
| @placemarkio/polyline@2.0.3 | 83.0 | 93.4 | 82.6 | 81.3 | 23.5 | 51.1 |
| **@duoquote/polytini@0.1.4 (web entry)** | 75.3 | 103 | 99.4 | 91.2 | 16.5 | 54.0 |
| @googlemaps/polyline-codec@1.0.28 | 65.7 | 106 | 106 | 95.3 | 16.2 | 54.6 |
| **@duoquote/polytini@0.1.4 (wasm)** | 75.6 | 102 | 95.9 | 88.6 | 16.2 | 55.8 |
| google-polyline@2.0.0 | 73.8 | 84.0 | 71.6 | 71.3 | 21.7 | 47.4 |
| @pirxpilot/google-polyline@4.0.1 | 66.7 | 72.5 | 65.8 | 66.7 | 23.8 | 43.6 |
| polyline-encoded@0.0.9 | 18.9 | 22.7 | 20.4 | 19.9 | 5.40 | 17.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.25 | 6.82 | 6.03 | 4.91 | 3.23 | 4.49 |
| decode-google-map-polyline@1.0.1 | 1.26 | 1.99 | 2.12 | 1.96 | 1.28 | 1.99 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **70.9** | **118** | **128** | **117** | **110** | **73.1** |
| **@duoquote/polytini@0.1.4 (wasm)** | 49.7 | 100 | 104 | 76.6 | 78.1 | 52.2 |
| **@duoquote/polytini@0.1.4 (web entry)** | 50.1 | 68.1 | 74.4 | 75.2 | 38.7 | 62.7 |
| google-polyline@2.0.0 | 50.8 | 66.8 | 63.4 | 49.7 | 15.4 | 33.8 |
| @pirxpilot/google-polyline@4.0.1 | 41.6 | 57.9 | 66.6 | 51.4 | 15.5 | 33.5 |
| @placemarkio/polyline@2.0.3 | 33.6 | 55.2 | 51.5 | 43.5 | 13.3 | 27.4 |
| @mapbox/polyline@1.2.1 | 31.0 | 49.0 | 45.5 | 39.4 | 12.8 | 25.7 |
| @googlemaps/polyline-codec@1.0.28 | 15.5 | 21.6 | 18.9 | 12.2 | 10.3 | 12.8 |
| @lp-labs/polyline-codec@0.1.0 | 7.03 | 9.26 | 8.10 | 6.79 | 4.50 | 5.26 |
| polyline-encoded@0.0.9 | 1.66 | 1.72 | 1.66 | 1.65 | 1.59 | 1.53 |
