## Deno v2.5.4, precision 5

- Runtime: Deno v2.5.4 (V8 14.0.365.5-rusty)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/deno.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 35%, worst 66%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 7.74M | 789k | **94.1k** | **9.35k** | **684** | **395k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 7.53M | **890k** | 84.7k | 7.48k | 379 | 311k |
| @googlemaps/polyline-codec@1.0.28 | 6.36M | 871k | 81.1k | 6.99k | 475 | 322k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.05M | 804k | 75.6k | 6.90k | 378 | 317k |
| @mapbox/polyline@1.2.1 | **8.36M** | 707k | 67.1k | 5.30k | 487 | 294k |
| @placemarkio/polyline@2.0.3 | 7.18M | 594k | 60.4k | 5.88k | 365 | 291k |
| google-polyline@2.0.0 | 5.50M | 597k | 49.7k | 5.77k | 354 | 245k |
| @pirxpilot/google-polyline@4.0.1 | 4.86M | 381k | 44.5k | 5.12k | 350 | 226k |
| polyline-encoded@0.0.9 | 1.90M | 188k | 17.6k | 1.79k | 134 | 89.6k |
| @lp-labs/polyline-codec@0.1.0 | 504k | 63.7k | 4.88k | 444 | 32.4 | 26.6k |
| decode-google-map-polyline@1.0.1 | 128k | 23.4k | 2.16k | 215 | 15.6 | 15.3k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 4.19M | 542k | 107k | **9.60k** | **715** | 283k |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.14M | **650k** | **107k** | 6.73k | 670 | 244k |
| **@duoquote/polytini@0.1.0 (web entry)** | 4.19M | 597k | 62.3k | 6.33k | 561 | **374k** |
| google-polyline@2.0.0 | **4.47M** | 523k | 58.1k | 3.95k | 416 | 184k |
| @pirxpilot/google-polyline@4.0.1 | 3.58M | 504k | 47.5k | 4.14k | 382 | 199k |
| @placemarkio/polyline@2.0.3 | 3.53M | 515k | 44.6k | 3.63k | 294 | 148k |
| @mapbox/polyline@1.2.1 | 3.27M | 442k | 40.4k | 3.36k | 268 | 155k |
| @googlemaps/polyline-codec@1.0.28 | 1.56M | 152k | 15.6k | 977 | 66.8 | 73.4k |
| @lp-labs/polyline-codec@0.1.0 | 641k | 70.9k | 5.07k | 436 | 34.5 | 35.5k |
| polyline-encoded@0.0.9 | 189k | 22.9k | 2.22k | 197 | 18.0 | 12.6k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 0.93x | 1.12x | **1.40x** | **1.76x** | **1.40x** | **1.34x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 0.90x | **1.26x** | 1.26x | 1.41x | 0.78x | 1.06x |
| @googlemaps/polyline-codec@1.0.28 | 0.76x | 1.23x | 1.21x | 1.32x | 0.97x | 1.09x |
| **@duoquote/polytini@0.1.0 (web entry)** | 0.84x | 1.14x | 1.13x | 1.30x | 0.78x | 1.08x |
| @mapbox/polyline@1.2.1 | **1.00x** | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @placemarkio/polyline@2.0.3 | 0.86x | 0.84x | 0.90x | 1.11x | 0.75x | 0.99x |
| google-polyline@2.0.0 | 0.66x | 0.84x | 0.74x | 1.09x | 0.73x | 0.83x |
| @pirxpilot/google-polyline@4.0.1 | 0.58x | 0.54x | 0.66x | 0.97x | 0.72x | 0.77x |
| polyline-encoded@0.0.9 | 0.23x | 0.27x | 0.26x | 0.34x | 0.27x | 0.30x |
| @lp-labs/polyline-codec@0.1.0 | 0.06x | 0.09x | 0.07x | 0.08x | 0.07x | 0.09x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.03x | 0.03x | 0.04x | 0.03x | 0.05x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 1.28x | 1.23x | 2.64x | **2.86x** | **2.67x** | 1.82x |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.27x | **1.47x** | **2.66x** | 2.00x | 2.50x | 1.57x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.28x | 1.35x | 1.54x | 1.88x | 2.09x | **2.41x** |
| google-polyline@2.0.0 | **1.37x** | 1.18x | 1.44x | 1.18x | 1.55x | 1.19x |
| @pirxpilot/google-polyline@4.0.1 | 1.10x | 1.14x | 1.18x | 1.23x | 1.43x | 1.28x |
| @placemarkio/polyline@2.0.3 | 1.08x | 1.17x | 1.10x | 1.08x | 1.10x | 0.95x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.48x | 0.34x | 0.39x | 0.29x | 0.25x | 0.47x |
| @lp-labs/polyline-codec@0.1.0 | 0.20x | 0.16x | 0.13x | 0.13x | 0.13x | 0.23x |
| polyline-encoded@0.0.9 | 0.06x | 0.05x | 0.05x | 0.06x | 0.07x | 0.08x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 1.45M | 465k | 70.7k | **8.98k** | **994** | **269k** |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 1.61M | **532k** | **75.9k** | 6.37k | 854 | 258k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **3.86M** | 497k | 45.0k | 3.41k | 299 | 215k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 3.10M | **829k** | **135k** | 9.00k | 850 | 288k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | **3.85M** | 442k | 107k | **9.11k** | **882** | **362k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.03M | 503k | 42.5k | 3.17k | 229 | 160k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | **509k** |
| **@duoquote/polytini@0.1.0** | 395k |
| @googlemaps/polyline-codec@1.0.28 | 322k |
| **@duoquote/polytini@0.1.0 (web entry)** | 317k |
| **@duoquote/polytini@0.1.0 (wasm)** | 311k |
| @mapbox/polyline@1.2.1 | 294k |
| @placemarkio/polyline@2.0.3 | 291k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 269k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 258k |
| google-polyline@2.0.0 | 245k |
| @pirxpilot/google-polyline@4.0.1 | 226k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 215k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 189k |
| polyline-encoded@0.0.9 | 89.6k |
| @lp-labs/polyline-codec@0.1.0 | 26.6k |
| decode-google-map-polyline@1.0.1 | 15.3k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (web entry)** | **374k** |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 362k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 288k |
| **@duoquote/polytini@0.1.0** | 283k |
| **@duoquote/polytini@0.1.0 (wasm)** | 244k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 225k |
| @pirxpilot/google-polyline@4.0.1 | 199k |
| google-polyline@2.0.0 | 184k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 160k |
| @mapbox/polyline@1.2.1 | 155k |
| @placemarkio/polyline@2.0.3 | 148k |
| @googlemaps/polyline-codec@1.0.28 | 73.4k |
| @lp-labs/polyline-codec@0.1.0 | 35.5k |
| polyline-encoded@0.0.9 | 12.6k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 77.4 | 78.9 | **94.1** | **93.5** | **68.4** | **57.8** |
| **@duoquote/polytini@0.1.0 (wasm)** | 75.3 | **89.0** | 84.7 | 74.8 | 37.9 | 45.5 |
| @googlemaps/polyline-codec@1.0.28 | 63.6 | 87.1 | 81.1 | 69.9 | 47.5 | 47.2 |
| **@duoquote/polytini@0.1.0 (web entry)** | 70.5 | 80.4 | 75.6 | 69.0 | 37.8 | 46.4 |
| @mapbox/polyline@1.2.1 | **83.6** | 70.7 | 67.1 | 53.0 | 48.7 | 43.1 |
| @placemarkio/polyline@2.0.3 | 71.8 | 59.4 | 60.4 | 58.8 | 36.5 | 42.6 |
| google-polyline@2.0.0 | 55.0 | 59.7 | 49.7 | 57.7 | 35.4 | 35.9 |
| @pirxpilot/google-polyline@4.0.1 | 48.6 | 38.1 | 44.5 | 51.2 | 35.0 | 33.1 |
| polyline-encoded@0.0.9 | 19.0 | 18.8 | 17.6 | 17.9 | 13.4 | 13.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.04 | 6.37 | 4.88 | 4.44 | 3.24 | 3.89 |
| decode-google-map-polyline@1.0.1 | 1.28 | 2.34 | 2.16 | 2.15 | 1.56 | 2.25 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 41.9 | 54.2 | 107 | **96.0** | **71.5** | 41.4 |
| **@duoquote/polytini@0.1.0 (wasm)** | 41.4 | **65.0** | **107** | 67.3 | 67.0 | 35.7 |
| **@duoquote/polytini@0.1.0 (web entry)** | 41.9 | 59.7 | 62.3 | 63.3 | 56.1 | **54.7** |
| google-polyline@2.0.0 | **44.7** | 52.3 | 58.1 | 39.5 | 41.6 | 27.0 |
| @pirxpilot/google-polyline@4.0.1 | 35.8 | 50.4 | 47.5 | 41.4 | 38.2 | 29.1 |
| @placemarkio/polyline@2.0.3 | 35.3 | 51.5 | 44.6 | 36.3 | 29.4 | 21.6 |
| @mapbox/polyline@1.2.1 | 32.7 | 44.2 | 40.4 | 33.6 | 26.8 | 22.7 |
| @googlemaps/polyline-codec@1.0.28 | 15.6 | 15.2 | 15.6 | 9.77 | 6.68 | 10.7 |
| @lp-labs/polyline-codec@0.1.0 | 6.41 | 7.09 | 5.07 | 4.36 | 3.45 | 5.20 |
| polyline-encoded@0.0.9 | 1.89 | 2.29 | 2.22 | 1.97 | 1.80 | 1.85 |
