## Node v25.2.1, precision 5

- Runtime: Node v25.2.1 (V8 14.1.146.11-node.14)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 5%, worst 54%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 7.99M | **1.21M** | **115k** | **10.4k** | 809 | 374k |
| **@duoquote/polytini@0.1.4** | 7.93M | 1.06M | 105k | 9.75k | **849** | **460k** |
| **@duoquote/polytini@0.1.4 (web entry)** | 8.14M | 1.04M | 97.4k | 9.12k | 755 | 380k |
| **@duoquote/polytini@0.1.4 (wasm)** | 8.13M | 1.04M | 99.9k | 9.06k | 710 | 386k |
| @placemarkio/polyline@2.0.3 | **9.85M** | 943k | 81.8k | 8.45k | 597 | 354k |
| @mapbox/polyline@1.2.1 | 9.67M | 930k | 84.0k | 8.31k | 595 | 360k |
| google-polyline@2.0.0 | 8.31M | 902k | 76.5k | 7.77k | 599 | 331k |
| @pirxpilot/google-polyline@4.0.1 | 6.29M | 680k | 61.2k | 6.20k | 496 | 278k |
| polyline-encoded@0.0.9 | 2.16M | 230k | 22.7k | 2.12k | 170 | 120k |
| @lp-labs/polyline-codec@0.1.0 | 653k | 72.8k | 6.92k | 587 | 46.6 | 35.7k |
| decode-google-map-polyline@1.0.1 | 167k | 29.6k | 3.27k | 318 | 20.9 | 19.6k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **7.14M** | 1.19M | 127k | **11.7k** | **1.09k** | **484k** |
| **@duoquote/polytini@0.1.4 (wasm)** | 5.06M | **1.45M** | **152k** | 10.4k | 1.03k | 421k |
| **@duoquote/polytini@0.1.4 (web entry)** | 5.11M | 679k | 73.4k | 7.27k | 760 | 468k |
| @pirxpilot/google-polyline@4.0.1 | 5.17M | 638k | 67.8k | 5.45k | 542 | 246k |
| google-polyline@2.0.0 | 5.04M | 675k | 63.9k | 5.08k | 500 | 239k |
| @placemarkio/polyline@2.0.3 | 3.98M | 561k | 53.1k | 4.62k | 419 | 202k |
| @mapbox/polyline@1.2.1 | 3.52M | 508k | 45.2k | 3.95k | 354 | 178k |
| @googlemaps/polyline-codec@1.0.28 | 1.67M | 225k | 19.6k | 1.57k | 141 | 89.9k |
| @lp-labs/polyline-codec@0.1.0 | 742k | 85.7k | 8.12k | 744 | 54.1 | 41.7k |
| polyline-encoded@0.0.9 | 245k | 25.5k | 2.48k | 247 | 24.0 | 16.1k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 0.83x | **1.30x** | **1.37x** | **1.25x** | 1.36x | 1.04x |
| **@duoquote/polytini@0.1.4** | 0.82x | 1.14x | 1.25x | 1.17x | **1.43x** | **1.28x** |
| **@duoquote/polytini@0.1.4 (web entry)** | 0.84x | 1.12x | 1.16x | 1.10x | 1.27x | 1.06x |
| **@duoquote/polytini@0.1.4 (wasm)** | 0.84x | 1.12x | 1.19x | 1.09x | 1.19x | 1.07x |
| @placemarkio/polyline@2.0.3 | **1.02x** | 1.01x | 0.97x | 1.02x | 1.00x | 0.98x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| google-polyline@2.0.0 | 0.86x | 0.97x | 0.91x | 0.94x | 1.01x | 0.92x |
| @pirxpilot/google-polyline@4.0.1 | 0.65x | 0.73x | 0.73x | 0.75x | 0.83x | 0.77x |
| polyline-encoded@0.0.9 | 0.22x | 0.25x | 0.27x | 0.25x | 0.29x | 0.33x |
| @lp-labs/polyline-codec@0.1.0 | 0.07x | 0.08x | 0.08x | 0.07x | 0.08x | 0.10x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.03x | 0.04x | 0.04x | 0.04x | 0.05x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **2.03x** | 2.34x | 2.82x | **2.97x** | **3.07x** | **2.71x** |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.44x | **2.86x** | **3.37x** | 2.64x | 2.91x | 2.36x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.45x | 1.34x | 1.62x | 1.84x | 2.15x | 2.62x |
| @pirxpilot/google-polyline@4.0.1 | 1.47x | 1.26x | 1.50x | 1.38x | 1.53x | 1.38x |
| google-polyline@2.0.0 | 1.43x | 1.33x | 1.41x | 1.28x | 1.41x | 1.34x |
| @placemarkio/polyline@2.0.3 | 1.13x | 1.11x | 1.17x | 1.17x | 1.18x | 1.13x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.47x | 0.44x | 0.43x | 0.40x | 0.40x | 0.50x |
| @lp-labs/polyline-codec@0.1.0 | 0.21x | 0.17x | 0.18x | 0.19x | 0.15x | 0.23x |
| polyline-encoded@0.0.9 | 0.07x | 0.05x | 0.05x | 0.06x | 0.07x | 0.09x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | 1.85M | **692k** | **77.3k** | **8.70k** | 980 | 326k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 1.86M | 566k | 73.8k | **8.70k** | **1.01k** | **340k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.08M** | 609k | 59.0k | 4.89k | 419 | 251k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 5.05M | **1.82M** | **190k** | 12.0k | **1.14k** | 481k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | **7.21M** | 1.24M | 130k | **12.1k** | 1.02k | **526k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.26M | 568k | 48.9k | 3.69k | 365 | 181k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | **507k** |
| **@duoquote/polytini@0.1.4** | 460k |
| **@duoquote/polytini@0.1.4 (wasm)** | 386k |
| **@duoquote/polytini@0.1.4 (web entry)** | 380k |
| @googlemaps/polyline-codec@1.0.28 | 374k |
| @mapbox/polyline@1.2.1 | 360k |
| @placemarkio/polyline@2.0.3 | 354k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 340k |
| google-polyline@2.0.0 | 331k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 326k |
| @pirxpilot/google-polyline@4.0.1 | 278k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 276k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 251k |
| polyline-encoded@0.0.9 | 120k |
| @lp-labs/polyline-codec@0.1.0 | 35.7k |
| decode-google-map-polyline@1.0.1 | 19.6k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **526k** |
| **@duoquote/polytini@0.1.4** | 484k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 481k |
| **@duoquote/polytini@0.1.4 (web entry)** | 468k |
| **@duoquote/polytini@0.1.4 (wasm)** | 421k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 365k |
| @pirxpilot/google-polyline@4.0.1 | 246k |
| google-polyline@2.0.0 | 239k |
| @placemarkio/polyline@2.0.3 | 202k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 181k |
| @mapbox/polyline@1.2.1 | 178k |
| @googlemaps/polyline-codec@1.0.28 | 89.9k |
| @lp-labs/polyline-codec@0.1.0 | 41.7k |
| polyline-encoded@0.0.9 | 16.1k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 79.9 | **121** | **115** | **104** | 80.9 | 54.7 |
| **@duoquote/polytini@0.1.4** | 79.3 | 106 | 105 | 97.5 | **84.9** | **67.3** |
| **@duoquote/polytini@0.1.4 (web entry)** | 81.4 | 104 | 97.4 | 91.2 | 75.5 | 55.6 |
| **@duoquote/polytini@0.1.4 (wasm)** | 81.3 | 104 | 99.9 | 90.6 | 71.0 | 56.5 |
| @placemarkio/polyline@2.0.3 | **98.5** | 94.3 | 81.8 | 84.5 | 59.7 | 51.8 |
| @mapbox/polyline@1.2.1 | 96.7 | 93.0 | 84.0 | 83.1 | 59.5 | 52.6 |
| google-polyline@2.0.0 | 83.1 | 90.2 | 76.5 | 77.7 | 59.9 | 48.5 |
| @pirxpilot/google-polyline@4.0.1 | 62.9 | 68.0 | 61.2 | 62.0 | 49.6 | 40.7 |
| polyline-encoded@0.0.9 | 21.6 | 23.0 | 22.7 | 21.2 | 17.0 | 17.6 |
| @lp-labs/polyline-codec@0.1.0 | 6.53 | 7.28 | 6.92 | 5.87 | 4.66 | 5.23 |
| decode-google-map-polyline@1.0.1 | 1.67 | 2.96 | 3.27 | 3.18 | 2.09 | 2.87 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **71.4** | 119 | 127 | **117** | **109** | **70.8** |
| **@duoquote/polytini@0.1.4 (wasm)** | 50.6 | **145** | **152** | 104 | 103 | 61.6 |
| **@duoquote/polytini@0.1.4 (web entry)** | 51.1 | 67.9 | 73.4 | 72.7 | 76.0 | 68.5 |
| @pirxpilot/google-polyline@4.0.1 | 51.7 | 63.8 | 67.8 | 54.5 | 54.2 | 36.0 |
| google-polyline@2.0.0 | 50.4 | 67.5 | 63.9 | 50.8 | 50.0 | 34.9 |
| @placemarkio/polyline@2.0.3 | 39.8 | 56.1 | 53.1 | 46.2 | 41.9 | 29.5 |
| @mapbox/polyline@1.2.1 | 35.2 | 50.8 | 45.2 | 39.5 | 35.4 | 26.1 |
| @googlemaps/polyline-codec@1.0.28 | 16.7 | 22.5 | 19.6 | 15.7 | 14.1 | 13.2 |
| @lp-labs/polyline-codec@0.1.0 | 7.42 | 8.57 | 8.12 | 7.44 | 5.41 | 6.11 |
| polyline-encoded@0.0.9 | 2.45 | 2.55 | 2.48 | 2.47 | 2.40 | 2.35 |
