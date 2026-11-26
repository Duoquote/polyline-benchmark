## Node v25.2.1, precision 5

- Runtime: Node v25.2.1 (V8 14.1.146.11-node.14)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 29%, worst 69%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 6.76M | 852k | **86.9k** | 8.35k | **542** | **399k** |
| @googlemaps/polyline-codec@1.0.28 | 7.25M | **964k** | 83.0k | **8.49k** | 482 | 300k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.05M | 889k | 86.6k | 7.82k | 450 | 307k |
| **@duoquote/polytini@0.1.0 (wasm)** | 7.04M | 838k | 74.1k | 7.25k | 431 | 321k |
| @mapbox/polyline@1.2.1 | **7.58M** | 782k | 64.6k | 5.82k | 354 | 280k |
| google-polyline@2.0.0 | 6.76M | 676k | 55.6k | 5.06k | 428 | 292k |
| @placemarkio/polyline@2.0.3 | 7.34M | 597k | 55.6k | 5.30k | 351 | 277k |
| @pirxpilot/google-polyline@4.0.1 | 4.55M | 517k | 46.7k | 5.42k | 321 | 243k |
| polyline-encoded@0.0.9 | 1.45M | 160k | 15.5k | 1.37k | 101 | 84.9k |
| @lp-labs/polyline-codec@0.1.0 | 540k | 62.1k | 5.66k | 536 | 32.7 | 28.5k |
| decode-google-map-polyline@1.0.1 | 133k | 22.8k | 2.46k | 238 | 17.4 | 16.8k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **5.87M** | 1.13M | 118k | **11.0k** | **906** | **419k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 3.98M | **1.33M** | **141k** | 8.58k | 847 | 298k |
| **@duoquote/polytini@0.1.0 (web entry)** | 4.17M | 581k | 68.2k | 6.52k | 559 | 353k |
| @pirxpilot/google-polyline@4.0.1 | 4.73M | 565k | 50.7k | 4.82k | 429 | 202k |
| google-polyline@2.0.0 | 4.61M | 611k | 58.2k | 4.56k | 312 | 188k |
| @placemarkio/polyline@2.0.3 | 3.58M | 517k | 49.5k | 3.98k | 325 | 174k |
| @mapbox/polyline@1.2.1 | 3.13M | 463k | 42.9k | 3.67k | 320 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 1.55M | 137k | 16.5k | 1.24k | 111 | 71.1k |
| @lp-labs/polyline-codec@0.1.0 | 665k | 76.6k | 6.62k | 559 | 37.3 | 34.0k |
| polyline-encoded@0.0.9 | 218k | 22.6k | 2.14k | 203 | 18.4 | 13.9k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 0.89x | 1.09x | **1.34x** | 1.43x | **1.53x** | **1.43x** |
| @googlemaps/polyline-codec@1.0.28 | 0.96x | **1.23x** | 1.29x | **1.46x** | 1.36x | 1.07x |
| **@duoquote/polytini@0.1.0 (web entry)** | 0.93x | 1.14x | 1.34x | 1.34x | 1.27x | 1.10x |
| **@duoquote/polytini@0.1.0 (wasm)** | 0.93x | 1.07x | 1.15x | 1.24x | 1.22x | 1.15x |
| @mapbox/polyline@1.2.1 | **1.00x** | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| google-polyline@2.0.0 | 0.89x | 0.86x | 0.86x | 0.87x | 1.21x | 1.04x |
| @placemarkio/polyline@2.0.3 | 0.97x | 0.76x | 0.86x | 0.91x | 0.99x | 0.99x |
| @pirxpilot/google-polyline@4.0.1 | 0.60x | 0.66x | 0.72x | 0.93x | 0.91x | 0.87x |
| polyline-encoded@0.0.9 | 0.19x | 0.20x | 0.24x | 0.24x | 0.29x | 0.30x |
| @lp-labs/polyline-codec@0.1.0 | 0.07x | 0.08x | 0.09x | 0.09x | 0.09x | 0.10x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.03x | 0.04x | 0.04x | 0.05x | 0.06x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **1.88x** | 2.45x | 2.76x | **2.99x** | **2.83x** | **2.75x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.27x | **2.87x** | **3.30x** | 2.34x | 2.64x | 1.96x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.33x | 1.25x | 1.59x | 1.78x | 1.75x | 2.32x |
| @pirxpilot/google-polyline@4.0.1 | 1.51x | 1.22x | 1.18x | 1.32x | 1.34x | 1.33x |
| google-polyline@2.0.0 | 1.48x | 1.32x | 1.36x | 1.25x | 0.98x | 1.24x |
| @placemarkio/polyline@2.0.3 | 1.15x | 1.12x | 1.15x | 1.09x | 1.01x | 1.14x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.50x | 0.30x | 0.38x | 0.34x | 0.35x | 0.47x |
| @lp-labs/polyline-codec@0.1.0 | 0.21x | 0.17x | 0.15x | 0.15x | 0.12x | 0.22x |
| polyline-encoded@0.0.9 | 0.07x | 0.05x | 0.05x | 0.06x | 0.06x | 0.09x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 1.50M | **592k** | **70.1k** | **8.31k** | **856** | **279k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 1.49M | 419k | 61.2k | 6.93k | 834 | 251k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **3.71M** | 467k | 42.5k | 3.20k | 314 | 228k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 3.79M | **1.71M** | **183k** | **11.5k** | **1.01k** | **410k** |
| **@duoquote/polytini@0.1.0 (Float64Array)** | **5.72M** | 1.12M | 116k | 8.49k | 888 | 395k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.00M | 510k | 46.9k | 2.88k | 296 | 173k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | **438k** |
| **@duoquote/polytini@0.1.0** | 399k |
| **@duoquote/polytini@0.1.0 (wasm)** | 321k |
| **@duoquote/polytini@0.1.0 (web entry)** | 307k |
| @googlemaps/polyline-codec@1.0.28 | 300k |
| google-polyline@2.0.0 | 292k |
| @mapbox/polyline@1.2.1 | 280k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 279k |
| @placemarkio/polyline@2.0.3 | 277k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 251k |
| @pirxpilot/google-polyline@4.0.1 | 243k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 228k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 201k |
| polyline-encoded@0.0.9 | 84.9k |
| @lp-labs/polyline-codec@0.1.0 | 28.5k |
| decode-google-map-polyline@1.0.1 | 16.8k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0** | **419k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 410k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 395k |
| **@duoquote/polytini@0.1.0 (web entry)** | 353k |
| **@duoquote/polytini@0.1.0 (wasm)** | 298k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 295k |
| @pirxpilot/google-polyline@4.0.1 | 202k |
| google-polyline@2.0.0 | 188k |
| @placemarkio/polyline@2.0.3 | 174k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 173k |
| @mapbox/polyline@1.2.1 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 71.1k |
| @lp-labs/polyline-codec@0.1.0 | 34.0k |
| polyline-encoded@0.0.9 | 13.9k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 67.6 | 85.2 | **86.9** | 83.5 | **54.2** | **58.4** |
| @googlemaps/polyline-codec@1.0.28 | 72.5 | **96.4** | 83.0 | **84.9** | 48.2 | 43.9 |
| **@duoquote/polytini@0.1.0 (web entry)** | 70.5 | 88.9 | 86.6 | 78.2 | 45.0 | 44.9 |
| **@duoquote/polytini@0.1.0 (wasm)** | 70.4 | 83.8 | 74.1 | 72.5 | 43.1 | 47.0 |
| @mapbox/polyline@1.2.1 | **75.8** | 78.2 | 64.6 | 58.2 | 35.4 | 40.9 |
| google-polyline@2.0.0 | 67.6 | 67.6 | 55.6 | 50.6 | 42.8 | 42.7 |
| @placemarkio/polyline@2.0.3 | 73.4 | 59.7 | 55.6 | 53.0 | 35.1 | 40.5 |
| @pirxpilot/google-polyline@4.0.1 | 45.5 | 51.7 | 46.7 | 54.2 | 32.1 | 35.6 |
| polyline-encoded@0.0.9 | 14.5 | 16.0 | 15.5 | 13.7 | 10.1 | 12.4 |
| @lp-labs/polyline-codec@0.1.0 | 5.40 | 6.21 | 5.66 | 5.36 | 3.27 | 4.16 |
| decode-google-map-polyline@1.0.1 | 1.33 | 2.28 | 2.46 | 2.38 | 1.74 | 2.46 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **58.7** | 113 | 118 | **110** | **90.6** | **61.2** |
| **@duoquote/polytini@0.1.0 (wasm)** | 39.8 | **133** | **141** | 85.8 | 84.7 | 43.6 |
| **@duoquote/polytini@0.1.0 (web entry)** | 41.7 | 58.1 | 68.2 | 65.2 | 55.9 | 51.6 |
| @pirxpilot/google-polyline@4.0.1 | 47.3 | 56.5 | 50.7 | 48.2 | 42.9 | 29.6 |
| google-polyline@2.0.0 | 46.1 | 61.1 | 58.2 | 45.6 | 31.2 | 27.5 |
| @placemarkio/polyline@2.0.3 | 35.8 | 51.7 | 49.5 | 39.8 | 32.5 | 25.4 |
| @mapbox/polyline@1.2.1 | 31.3 | 46.3 | 42.9 | 36.7 | 32.0 | 22.3 |
| @googlemaps/polyline-codec@1.0.28 | 15.5 | 13.7 | 16.5 | 12.4 | 11.1 | 10.4 |
| @lp-labs/polyline-codec@0.1.0 | 6.65 | 7.66 | 6.62 | 5.59 | 3.73 | 4.97 |
| polyline-encoded@0.0.9 | 2.18 | 2.26 | 2.14 | 2.03 | 1.84 | 2.03 |
