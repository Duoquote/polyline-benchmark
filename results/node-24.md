## Node v24.22.3, precision 5

- Runtime: Node v24.22.3 (V8 13.6.233.17-node.63)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 32%, worst 70%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 6.50M | 760k | 74.4k | 7.21k | **581** | **410k** |
| @googlemaps/polyline-codec@1.0.28 | 6.66M | **872k** | 71.8k | 6.72k | 460 | 326k |
| **@duoquote/polytini@0.1.0 (web entry)** | 5.44M | 865k | **74.6k** | **7.62k** | 496 | 302k |
| **@duoquote/polytini@0.1.0 (wasm)** | 5.28M | 694k | 70.3k | 6.65k | 519 | 340k |
| @placemarkio/polyline@2.0.3 | **7.50M** | 681k | 64.8k | 7.03k | 403 | 306k |
| @mapbox/polyline@1.2.1 | 7.00M | 608k | 60.3k | 6.67k | 368 | 254k |
| google-polyline@2.0.0 | 5.09M | 595k | 56.7k | 5.84k | 332 | 254k |
| @pirxpilot/google-polyline@4.0.1 | 5.78M | 627k | 56.5k | 5.13k | 312 | 254k |
| polyline-encoded@0.0.9 | 1.72M | 161k | 14.5k | 1.36k | 99.8 | 81.5k |
| @lp-labs/polyline-codec@0.1.0 | 531k | 66.5k | 5.68k | 489 | 37.5 | 27.1k |
| decode-google-map-polyline@1.0.1 | 131k | 25.1k | 2.36k | 260 | 17.5 | 15.7k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **5.74M** | 898k | 117k | **10.8k** | **918** | **346k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.08M | **1.35M** | **144k** | 7.96k | 706 | 264k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.89M | 579k | 63.2k | 6.43k | 448 | 301k |
| @pirxpilot/google-polyline@4.0.1 | 4.44M | 483k | 55.8k | 4.42k | 438 | 182k |
| google-polyline@2.0.0 | 4.41M | 522k | 54.1k | 4.12k | 368 | 172k |
| @placemarkio/polyline@2.0.3 | 3.45M | 477k | 49.7k | 4.14k | 329 | 172k |
| @mapbox/polyline@1.2.1 | 2.90M | 470k | 41.0k | 3.39k | 295 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 1.67M | 210k | 17.8k | 1.02k | 82.7 | 73.5k |
| @lp-labs/polyline-codec@0.1.0 | 673k | 83.3k | 7.05k | 605 | 41.7 | 35.3k |
| polyline-encoded@0.0.9 | 230k | 22.9k | 2.32k | 218 | 19.9 | 13.1k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 0.93x | 1.25x | 1.23x | 1.08x | **1.58x** | **1.61x** |
| @googlemaps/polyline-codec@1.0.28 | 0.95x | **1.43x** | 1.19x | 1.01x | 1.25x | 1.28x |
| **@duoquote/polytini@0.1.0 (web entry)** | 0.78x | 1.42x | **1.24x** | **1.14x** | 1.35x | 1.19x |
| **@duoquote/polytini@0.1.0 (wasm)** | 0.76x | 1.14x | 1.17x | 1.00x | 1.41x | 1.34x |
| @placemarkio/polyline@2.0.3 | **1.07x** | 1.12x | 1.07x | 1.05x | 1.09x | 1.20x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| google-polyline@2.0.0 | 0.73x | 0.98x | 0.94x | 0.88x | 0.90x | 1.00x |
| @pirxpilot/google-polyline@4.0.1 | 0.83x | 1.03x | 0.94x | 0.77x | 0.85x | 1.00x |
| polyline-encoded@0.0.9 | 0.25x | 0.27x | 0.24x | 0.20x | 0.27x | 0.32x |
| @lp-labs/polyline-codec@0.1.0 | 0.08x | 0.11x | 0.09x | 0.07x | 0.10x | 0.11x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.04x | 0.04x | 0.04x | 0.05x | 0.06x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **1.98x** | 1.91x | 2.84x | **3.19x** | **3.11x** | **2.28x** |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.41x | **2.87x** | **3.51x** | 2.35x | 2.39x | 1.74x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.34x | 1.23x | 1.54x | 1.90x | 1.52x | 1.98x |
| @pirxpilot/google-polyline@4.0.1 | 1.53x | 1.03x | 1.36x | 1.30x | 1.48x | 1.20x |
| google-polyline@2.0.0 | 1.52x | 1.11x | 1.32x | 1.22x | 1.25x | 1.13x |
| @placemarkio/polyline@2.0.3 | 1.19x | 1.01x | 1.21x | 1.22x | 1.11x | 1.13x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.58x | 0.45x | 0.43x | 0.30x | 0.28x | 0.48x |
| @lp-labs/polyline-codec@0.1.0 | 0.23x | 0.18x | 0.17x | 0.18x | 0.14x | 0.23x |
| polyline-encoded@0.0.9 | 0.08x | 0.05x | 0.06x | 0.06x | 0.07x | 0.09x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | 1.33M | **644k** | **74.2k** | **7.17k** | 869 | 265k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 1.15M | 461k | 57.9k | 6.73k | **884** | **293k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **3.90M** | 511k | 51.4k | 4.11k | 294 | 192k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 2.70M | **1.66M** | **177k** | 10.9k | **995** | 396k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | **5.27M** | 1.12M | 126k | **11.3k** | 773 | **462k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 2.79M | 491k | 31.6k | 2.30k | 229 | 154k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | **429k** |
| **@duoquote/polytini@0.1.0** | 410k |
| **@duoquote/polytini@0.1.0 (wasm)** | 340k |
| @googlemaps/polyline-codec@1.0.28 | 326k |
| @placemarkio/polyline@2.0.3 | 306k |
| **@duoquote/polytini@0.1.0 (web entry)** | 302k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 293k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 265k |
| @mapbox/polyline@1.2.1 | 254k |
| google-polyline@2.0.0 | 254k |
| @pirxpilot/google-polyline@4.0.1 | 254k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 252k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 192k |
| polyline-encoded@0.0.9 | 81.5k |
| @lp-labs/polyline-codec@0.1.0 | 27.1k |
| decode-google-map-polyline@1.0.1 | 15.7k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **462k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 396k |
| **@duoquote/polytini@0.1.0** | 346k |
| **@duoquote/polytini@0.1.0 (web entry)** | 301k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 276k |
| **@duoquote/polytini@0.1.0 (wasm)** | 264k |
| @pirxpilot/google-polyline@4.0.1 | 182k |
| google-polyline@2.0.0 | 172k |
| @placemarkio/polyline@2.0.3 | 172k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 154k |
| @mapbox/polyline@1.2.1 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 73.5k |
| @lp-labs/polyline-codec@0.1.0 | 35.3k |
| polyline-encoded@0.0.9 | 13.1k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 65.0 | 76.0 | 74.4 | 72.1 | **58.1** | **59.9** |
| @googlemaps/polyline-codec@1.0.28 | 66.6 | **87.2** | 71.8 | 67.2 | 46.0 | 47.7 |
| **@duoquote/polytini@0.1.0 (web entry)** | 54.4 | 86.5 | **74.6** | **76.2** | 49.6 | 44.2 |
| **@duoquote/polytini@0.1.0 (wasm)** | 52.8 | 69.4 | 70.3 | 66.5 | 51.9 | 49.7 |
| @placemarkio/polyline@2.0.3 | **75.0** | 68.1 | 64.8 | 70.3 | 40.3 | 44.7 |
| @mapbox/polyline@1.2.1 | 70.0 | 60.8 | 60.3 | 66.7 | 36.8 | 37.2 |
| google-polyline@2.0.0 | 50.9 | 59.5 | 56.7 | 58.4 | 33.2 | 37.2 |
| @pirxpilot/google-polyline@4.0.1 | 57.8 | 62.7 | 56.5 | 51.3 | 31.2 | 37.1 |
| polyline-encoded@0.0.9 | 17.2 | 16.1 | 14.5 | 13.6 | 9.98 | 11.9 |
| @lp-labs/polyline-codec@0.1.0 | 5.31 | 6.65 | 5.68 | 4.89 | 3.75 | 3.96 |
| decode-google-map-polyline@1.0.1 | 1.31 | 2.51 | 2.36 | 2.60 | 1.75 | 2.30 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **57.4** | 89.8 | 117 | **108** | **91.8** | **50.7** |
| **@duoquote/polytini@0.1.0 (wasm)** | 40.8 | **135** | **144** | 79.6 | 70.6 | 38.6 |
| **@duoquote/polytini@0.1.0 (web entry)** | 38.9 | 57.9 | 63.2 | 64.3 | 44.8 | 44.1 |
| @pirxpilot/google-polyline@4.0.1 | 44.4 | 48.3 | 55.8 | 44.2 | 43.8 | 26.7 |
| google-polyline@2.0.0 | 44.1 | 52.2 | 54.1 | 41.2 | 36.8 | 25.2 |
| @placemarkio/polyline@2.0.3 | 34.5 | 47.7 | 49.7 | 41.4 | 32.9 | 25.2 |
| @mapbox/polyline@1.2.1 | 29.0 | 47.0 | 41.0 | 33.9 | 29.5 | 22.2 |
| @googlemaps/polyline-codec@1.0.28 | 16.7 | 21.0 | 17.8 | 10.2 | 8.27 | 10.8 |
| @lp-labs/polyline-codec@0.1.0 | 6.73 | 8.33 | 7.05 | 6.05 | 4.17 | 5.16 |
| polyline-encoded@0.0.9 | 2.30 | 2.29 | 2.32 | 2.18 | 1.99 | 1.92 |
