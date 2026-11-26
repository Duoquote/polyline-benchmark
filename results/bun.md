## Bun v1.4.3, precision 5

- Runtime: Bun v1.4.3 (JavaScriptCore)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/bun.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 33%, worst 224%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (web entry)** | 8.10M | **949k** | **99.9k** | 9.47k | 815 | 425k |
| **@duoquote/polytini@0.1.0** | 6.60M | 716k | 84.3k | **10.9k** | **937** | **459k** |
| @googlemaps/polyline-codec@1.0.28 | **9.55M** | 919k | 93.0k | 9.24k | 640 | 286k |
| **@duoquote/polytini@0.1.0 (wasm)** | 7.39M | 766k | 75.4k | 7.54k | 713 | 348k |
| google-polyline@2.0.0 | 8.25M | 825k | 72.6k | 7.77k | 540 | 271k |
| @placemarkio/polyline@2.0.3 | 7.38M | 610k | 61.9k | 7.52k | 646 | 267k |
| @mapbox/polyline@1.2.1 | 7.40M | 757k | 66.1k | 6.07k | 628 | 256k |
| @pirxpilot/google-polyline@4.0.1 | 2.36M | 382k | 36.0k | 2.97k | 233 | 124k |
| polyline-encoded@0.0.9 | 1.06M | 107k | 11.7k | 988 | 92.6 | 64.7k |
| @lp-labs/polyline-codec@0.1.0 | 436k | 41.5k | 4.17k | 387 | 22.7 | 21.1k |
| decode-google-map-polyline@1.0.1 | 293k | 31.3k | 3.43k | 374 | 30.5 | 22.8k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **8.47M** | **1.75M** | **173k** | **14.8k** | **1.34k** | **470k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.25M | 1.46M | 152k | 10.6k | 995 | 283k |
| **@duoquote/polytini@0.1.0 (web entry)** | 4.61M | 697k | 71.8k | 6.16k | 479 | 266k |
| google-polyline@2.0.0 | 5.30M | 720k | 64.2k | 4.75k | 356 | 211k |
| @pirxpilot/google-polyline@4.0.1 | 4.20M | 628k | 65.7k | 3.74k | 372 | 195k |
| @placemarkio/polyline@2.0.3 | 2.83M | 309k | 28.3k | 2.79k | 216 | 139k |
| @mapbox/polyline@1.2.1 | 2.68M | 236k | 26.0k | 2.40k | 180 | 129k |
| @googlemaps/polyline-codec@1.0.28 | 1.35M | 171k | 16.0k | 1.55k | 137 | 75.2k |
| @lp-labs/polyline-codec@0.1.0 | 402k | 31.3k | 3.62k | 316 | 27.2 | 18.0k |
| polyline-encoded@0.0.9 | 270k | 29.8k | 3.07k | 257 | 24.0 | 18.5k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (web entry)** | 1.09x | **1.25x** | **1.51x** | 1.56x | 1.30x | 1.66x |
| **@duoquote/polytini@0.1.0** | 0.89x | 0.95x | 1.28x | **1.80x** | **1.49x** | **1.79x** |
| @googlemaps/polyline-codec@1.0.28 | **1.29x** | 1.21x | 1.41x | 1.52x | 1.02x | 1.12x |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.00x | 1.01x | 1.14x | 1.24x | 1.14x | 1.36x |
| google-polyline@2.0.0 | 1.11x | 1.09x | 1.10x | 1.28x | 0.86x | 1.06x |
| @placemarkio/polyline@2.0.3 | 1.00x | 0.81x | 0.94x | 1.24x | 1.03x | 1.04x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @pirxpilot/google-polyline@4.0.1 | 0.32x | 0.50x | 0.55x | 0.49x | 0.37x | 0.49x |
| polyline-encoded@0.0.9 | 0.14x | 0.14x | 0.18x | 0.16x | 0.15x | 0.25x |
| @lp-labs/polyline-codec@0.1.0 | 0.06x | 0.05x | 0.06x | 0.06x | 0.04x | 0.08x |
| decode-google-map-polyline@1.0.1 | 0.04x | 0.04x | 0.05x | 0.06x | 0.05x | 0.09x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **3.17x** | **7.41x** | **6.66x** | **6.16x** | **7.44x** | **3.65x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.59x | 6.20x | 5.85x | 4.40x | 5.52x | 2.20x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.72x | 2.95x | 2.76x | 2.57x | 2.66x | 2.06x |
| google-polyline@2.0.0 | 1.98x | 3.05x | 2.47x | 1.98x | 1.97x | 1.64x |
| @pirxpilot/google-polyline@4.0.1 | 1.57x | 2.66x | 2.53x | 1.56x | 2.06x | 1.52x |
| @placemarkio/polyline@2.0.3 | 1.06x | 1.31x | 1.09x | 1.16x | 1.20x | 1.08x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.50x | 0.72x | 0.62x | 0.64x | 0.76x | 0.58x |
| @lp-labs/polyline-codec@0.1.0 | 0.15x | 0.13x | 0.14x | 0.13x | 0.15x | 0.14x |
| polyline-encoded@0.0.9 | 0.10x | 0.13x | 0.12x | 0.11x | 0.13x | 0.14x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **10.0M** | **1.94M** | 174k | **16.6k** | 1.36k | 617k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 7.49M | 1.35M | **177k** | 14.2k | **1.55k** | **648k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 7.98M | 812k | 73.8k | 6.71k | 609 | 266k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **9.22M** | 1.80M | **198k** | **15.6k** | **1.62k** | **578k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 5.27M | **1.86M** | 184k | 12.7k | 1.08k | 378k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 2.78M | 328k | 26.3k | 2.36k | 174 | 129k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | **698k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 648k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 617k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 515k |
| **@duoquote/polytini@0.1.0** | 459k |
| **@duoquote/polytini@0.1.0 (web entry)** | 425k |
| **@duoquote/polytini@0.1.0 (wasm)** | 348k |
| @googlemaps/polyline-codec@1.0.28 | 286k |
| google-polyline@2.0.0 | 271k |
| @placemarkio/polyline@2.0.3 | 267k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 266k |
| @mapbox/polyline@1.2.1 | 256k |
| @pirxpilot/google-polyline@4.0.1 | 124k |
| polyline-encoded@0.0.9 | 64.7k |
| decode-google-map-polyline@1.0.1 | 22.8k |
| @lp-labs/polyline-codec@0.1.0 | 21.1k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **578k** |
| **@duoquote/polytini@0.1.0** | 470k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 378k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 286k |
| **@duoquote/polytini@0.1.0 (wasm)** | 283k |
| **@duoquote/polytini@0.1.0 (web entry)** | 266k |
| google-polyline@2.0.0 | 211k |
| @pirxpilot/google-polyline@4.0.1 | 195k |
| @placemarkio/polyline@2.0.3 | 139k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 129k |
| @mapbox/polyline@1.2.1 | 129k |
| @googlemaps/polyline-codec@1.0.28 | 75.2k |
| polyline-encoded@0.0.9 | 18.5k |
| @lp-labs/polyline-codec@0.1.0 | 18.0k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (web entry)** | 81.0 | **94.9** | **99.9** | 94.7 | 81.5 | 62.1 |
| **@duoquote/polytini@0.1.0** | 66.0 | 71.6 | 84.3 | **109** | **93.7** | **67.2** |
| @googlemaps/polyline-codec@1.0.28 | **95.5** | 91.9 | 93.0 | 92.4 | 64.0 | 41.8 |
| **@duoquote/polytini@0.1.0 (wasm)** | 73.9 | 76.6 | 75.4 | 75.4 | 71.3 | 50.9 |
| google-polyline@2.0.0 | 82.5 | 82.5 | 72.6 | 77.7 | 54.0 | 39.7 |
| @placemarkio/polyline@2.0.3 | 73.8 | 61.0 | 61.9 | 75.2 | 64.6 | 39.1 |
| @mapbox/polyline@1.2.1 | 74.0 | 75.7 | 66.1 | 60.7 | 62.8 | 37.5 |
| @pirxpilot/google-polyline@4.0.1 | 23.6 | 38.2 | 36.0 | 29.7 | 23.3 | 18.2 |
| polyline-encoded@0.0.9 | 10.6 | 10.7 | 11.7 | 9.88 | 9.26 | 9.47 |
| @lp-labs/polyline-codec@0.1.0 | 4.36 | 4.15 | 4.17 | 3.87 | 2.27 | 3.08 |
| decode-google-map-polyline@1.0.1 | 2.93 | 3.13 | 3.43 | 3.74 | 3.05 | 3.34 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **84.7** | **175** | **173** | **148** | **134** | **68.7** |
| **@duoquote/polytini@0.1.0 (wasm)** | 42.5 | 146 | 152 | 106 | 99.5 | 41.4 |
| **@duoquote/polytini@0.1.0 (web entry)** | 46.1 | 69.7 | 71.8 | 61.6 | 47.9 | 38.9 |
| google-polyline@2.0.0 | 53.0 | 72.0 | 64.2 | 47.5 | 35.6 | 30.9 |
| @pirxpilot/google-polyline@4.0.1 | 42.0 | 62.8 | 65.7 | 37.4 | 37.2 | 28.6 |
| @placemarkio/polyline@2.0.3 | 28.3 | 30.9 | 28.3 | 27.9 | 21.6 | 20.3 |
| @mapbox/polyline@1.2.1 | 26.8 | 23.6 | 26.0 | 24.0 | 18.0 | 18.8 |
| @googlemaps/polyline-codec@1.0.28 | 13.5 | 17.1 | 16.0 | 15.5 | 13.7 | 11.0 |
| @lp-labs/polyline-codec@0.1.0 | 4.02 | 3.13 | 3.62 | 3.16 | 2.72 | 2.64 |
| polyline-encoded@0.0.9 | 2.70 | 2.98 | 3.07 | 2.57 | 2.40 | 2.71 |
