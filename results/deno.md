## Deno v2.5.4, precision 5

- Runtime: Deno v2.5.4 (V8 14.0.365.5-rusty)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/deno.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 5%, worst 56%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 8.17M | 1.09M | **120k** | **11.6k** | **883** | **484k** |
| @googlemaps/polyline-codec@1.0.28 | 8.22M | **1.16M** | 114k | 10.1k | 791 | 384k |
| **@duoquote/polytini@0.1.4 (wasm)** | 8.30M | 1.05M | 101k | 9.12k | 681 | 387k |
| **@duoquote/polytini@0.1.4 (web entry)** | 8.33M | 1.05M | 99.1k | 8.93k | 682 | 397k |
| @placemarkio/polyline@2.0.3 | **9.98M** | 990k | 83.0k | 8.43k | 626 | 357k |
| @mapbox/polyline@1.2.1 | 9.74M | 984k | 84.8k | 8.55k | 614 | 340k |
| google-polyline@2.0.0 | 8.50M | 911k | 76.3k | 7.66k | 598 | 328k |
| @pirxpilot/google-polyline@4.0.1 | 6.24M | 694k | 61.1k | 6.11k | 493 | 278k |
| polyline-encoded@0.0.9 | 2.23M | 236k | 22.0k | 2.07k | 173 | 121k |
| @lp-labs/polyline-codec@0.1.0 | 602k | 73.1k | 6.73k | 609 | 42.5 | 35.2k |
| decode-google-map-polyline@1.0.1 | 164k | 26.3k | 3.05k | 309 | 20.1 | 19.1k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 5.01M | 1.04M | 129k | **12.1k** | **1.07k** | 448k |
| **@duoquote/polytini@0.1.4 (wasm)** | 5.02M | **1.17M** | **138k** | 9.91k | 982 | 352k |
| **@duoquote/polytini@0.1.4 (web entry)** | 4.95M | 663k | 73.1k | 7.17k | 735 | **461k** |
| @pirxpilot/google-polyline@4.0.1 | 5.07M | 592k | 62.0k | 5.30k | 547 | 246k |
| google-polyline@2.0.0 | **5.10M** | 668k | 63.4k | 4.94k | 490 | 230k |
| @placemarkio/polyline@2.0.3 | 4.08M | 579k | 53.6k | 4.61k | 414 | 203k |
| @mapbox/polyline@1.2.1 | 3.52M | 500k | 46.1k | 3.96k | 357 | 171k |
| @googlemaps/polyline-codec@1.0.28 | 1.73M | 229k | 19.9k | 1.33k | 122 | 90.6k |
| @lp-labs/polyline-codec@0.1.0 | 737k | 86.4k | 7.93k | 696 | 53.3 | 41.4k |
| polyline-encoded@0.0.9 | 247k | 25.0k | 2.42k | 242 | 22.6 | 15.6k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 0.84x | 1.11x | **1.41x** | **1.36x** | **1.44x** | **1.43x** |
| @googlemaps/polyline-codec@1.0.28 | 0.84x | **1.17x** | 1.34x | 1.19x | 1.29x | 1.13x |
| **@duoquote/polytini@0.1.4 (wasm)** | 0.85x | 1.06x | 1.19x | 1.07x | 1.11x | 1.14x |
| **@duoquote/polytini@0.1.4 (web entry)** | 0.86x | 1.07x | 1.17x | 1.04x | 1.11x | 1.17x |
| @placemarkio/polyline@2.0.3 | **1.02x** | 1.01x | 0.98x | 0.99x | 1.02x | 1.05x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| google-polyline@2.0.0 | 0.87x | 0.93x | 0.90x | 0.90x | 0.97x | 0.97x |
| @pirxpilot/google-polyline@4.0.1 | 0.64x | 0.71x | 0.72x | 0.71x | 0.80x | 0.82x |
| polyline-encoded@0.0.9 | 0.23x | 0.24x | 0.26x | 0.24x | 0.28x | 0.36x |
| @lp-labs/polyline-codec@0.1.0 | 0.06x | 0.07x | 0.08x | 0.07x | 0.07x | 0.10x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.03x | 0.04x | 0.04x | 0.03x | 0.06x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 1.42x | 2.09x | 2.81x | **3.05x** | **2.99x** | 2.62x |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.42x | **2.33x** | **2.99x** | 2.50x | 2.75x | 2.05x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.41x | 1.32x | 1.58x | 1.81x | 2.06x | **2.69x** |
| @pirxpilot/google-polyline@4.0.1 | 1.44x | 1.18x | 1.34x | 1.34x | 1.53x | 1.44x |
| google-polyline@2.0.0 | **1.45x** | 1.34x | 1.37x | 1.25x | 1.37x | 1.34x |
| @placemarkio/polyline@2.0.3 | 1.16x | 1.16x | 1.16x | 1.16x | 1.16x | 1.19x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.49x | 0.46x | 0.43x | 0.33x | 0.34x | 0.53x |
| @lp-labs/polyline-codec@0.1.0 | 0.21x | 0.17x | 0.17x | 0.18x | 0.15x | 0.24x |
| polyline-encoded@0.0.9 | 0.07x | 0.05x | 0.05x | 0.06x | 0.06x | 0.09x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | 1.84M | **753k** | 79.9k | **9.82k** | 1.16k | 335k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 1.93M | 619k | **83.6k** | 9.72k | **1.18k** | **345k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.09M** | 613k | 60.3k | 4.79k | 416 | 247k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 5.02M | **1.34M** | **170k** | 11.2k | 1.06k | 425k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | **5.12M** | 1.09M | 132k | **12.4k** | **1.11k** | **519k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.22M | 558k | 50.3k | 3.63k | 372 | 178k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | **586k** |
| **@duoquote/polytini@0.1.4** | 484k |
| **@duoquote/polytini@0.1.4 (web entry)** | 397k |
| **@duoquote/polytini@0.1.4 (wasm)** | 387k |
| @googlemaps/polyline-codec@1.0.28 | 384k |
| @placemarkio/polyline@2.0.3 | 357k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 345k |
| @mapbox/polyline@1.2.1 | 340k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 335k |
| google-polyline@2.0.0 | 328k |
| @pirxpilot/google-polyline@4.0.1 | 278k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 272k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 247k |
| polyline-encoded@0.0.9 | 121k |
| @lp-labs/polyline-codec@0.1.0 | 35.2k |
| decode-google-map-polyline@1.0.1 | 19.1k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **519k** |
| **@duoquote/polytini@0.1.4 (web entry)** | 461k |
| **@duoquote/polytini@0.1.4** | 448k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 425k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 355k |
| **@duoquote/polytini@0.1.4 (wasm)** | 352k |
| @pirxpilot/google-polyline@4.0.1 | 246k |
| google-polyline@2.0.0 | 230k |
| @placemarkio/polyline@2.0.3 | 203k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 178k |
| @mapbox/polyline@1.2.1 | 171k |
| @googlemaps/polyline-codec@1.0.28 | 90.6k |
| @lp-labs/polyline-codec@0.1.0 | 41.4k |
| polyline-encoded@0.0.9 | 15.6k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 81.7 | 109 | **120** | **116** | **88.3** | **70.9** |
| @googlemaps/polyline-codec@1.0.28 | 82.2 | **116** | 114 | 101 | 79.1 | 56.1 |
| **@duoquote/polytini@0.1.4 (wasm)** | 83.0 | 105 | 101 | 91.2 | 68.1 | 56.6 |
| **@duoquote/polytini@0.1.4 (web entry)** | 83.3 | 105 | 99.1 | 89.3 | 68.2 | 58.1 |
| @placemarkio/polyline@2.0.3 | **99.8** | 99.0 | 83.0 | 84.3 | 62.6 | 52.2 |
| @mapbox/polyline@1.2.1 | 97.4 | 98.4 | 84.8 | 85.5 | 61.4 | 49.7 |
| google-polyline@2.0.0 | 85.0 | 91.1 | 76.3 | 76.6 | 59.8 | 48.0 |
| @pirxpilot/google-polyline@4.0.1 | 62.4 | 69.4 | 61.1 | 61.1 | 49.3 | 40.7 |
| polyline-encoded@0.0.9 | 22.3 | 23.6 | 22.0 | 20.7 | 17.3 | 17.7 |
| @lp-labs/polyline-codec@0.1.0 | 6.02 | 7.31 | 6.73 | 6.09 | 4.25 | 5.15 |
| decode-google-map-polyline@1.0.1 | 1.64 | 2.63 | 3.05 | 3.09 | 2.01 | 2.80 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | 50.1 | 104 | 129 | **121** | **107** | 65.6 |
| **@duoquote/polytini@0.1.4 (wasm)** | 50.2 | **117** | **138** | 99.1 | 98.2 | 51.5 |
| **@duoquote/polytini@0.1.4 (web entry)** | 49.5 | 66.3 | 73.1 | 71.7 | 73.5 | **67.4** |
| @pirxpilot/google-polyline@4.0.1 | 50.7 | 59.2 | 62.0 | 53.0 | 54.7 | 36.0 |
| google-polyline@2.0.0 | **51.0** | 66.8 | 63.4 | 49.4 | 49.0 | 33.7 |
| @placemarkio/polyline@2.0.3 | 40.8 | 57.9 | 53.6 | 46.1 | 41.4 | 29.8 |
| @mapbox/polyline@1.2.1 | 35.2 | 50.0 | 46.1 | 39.6 | 35.7 | 25.1 |
| @googlemaps/polyline-codec@1.0.28 | 17.3 | 22.9 | 19.9 | 13.3 | 12.2 | 13.3 |
| @lp-labs/polyline-codec@0.1.0 | 7.37 | 8.64 | 7.93 | 6.96 | 5.33 | 6.06 |
| polyline-encoded@0.0.9 | 2.47 | 2.50 | 2.42 | 2.42 | 2.26 | 2.28 |
