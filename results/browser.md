## Chrome 157.0.8103.80 (headless), precision 5

- Browser: Chrome 157.0.8103.80 (headless), through playwright-core with the installed Chrome
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/browser.js` (esbuild, browser conditions)
- google.maps.geometry.encoding: included, Maps JavaScript API loaded once, its 5 rounds ran in one page

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh browser context. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 33%, worst 72%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 8.33M | 1.05M | **111k** | 9.52k | **847** | **463k** |
| @placemarkio/polyline@2.0.3 | **10.3M** | 1.08M | 93.0k | 8.70k | 644 | 402k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.69M | **1.11M** | **111k** | **9.52k** | 630 | 406k |
| google-polyline@2.0.0 | 8.70M | 1.03M | 81.6k | 7.55k | 714 | 437k |
| @mapbox/polyline@1.2.1 | 9.09M | 952k | 87.0k | 7.27k | 637 | 421k |
| **@duoquote/polytini@0.1.0** | 8.89M | 1.03M | 85.1k | 7.27k | 608 | 419k |
| **@duoquote/polytini@0.1.0 (wasm)** | 8.51M | 808k | 78.4k | 6.78k | 743 | 458k |
| @pirxpilot/google-polyline@4.0.1 | 6.15M | 667k | 47.6k | 6.15k | 434 | 324k |
| google.maps.geometry.encoding | 3.45M | 455k | 48.8k | 4.12k | 152 | 270k |
| polyline-encoded@0.0.9 | 1.87M | 209k | 18.8k | 1.66k | 90.4 | 104k |
| @lp-labs/polyline-codec@0.1.0 | 766k | 80.3k | 6.35k | 544 | 48.8 | 38.8k |
| decode-google-map-polyline@1.0.1 | 222k | 36.9k | 3.30k | 353 | 25.4 | 23.2k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 4.47M | **678k** | **133k** | **11.8k** | **930** | 407k |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.35M | 656k | 127k | 9.30k | 826 | 315k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.88M | 661k | 76.9k | 7.55k | 778 | **442k** |
| google-polyline@2.0.0 | **5.06M** | 537k | 58.8k | 4.88k | 472 | 215k |
| @pirxpilot/google-polyline@4.0.1 | 4.88M | 563k | 62.5k | 4.76k | 391 | 219k |
| @placemarkio/polyline@2.0.3 | 3.39M | 548k | 47.3k | 4.12k | 380 | 159k |
| @mapbox/polyline@1.2.1 | 3.43M | 447k | 44.0k | 3.15k | 295 | 157k |
| @googlemaps/polyline-codec@1.0.28 | 2.55M | 336k | 28.0k | 2.55k | 217 | 126k |
| google.maps.geometry.encoding | 2.33M | 323k | 25.8k | 2.13k | 142 | 89.4k |
| @lp-labs/polyline-codec@0.1.0 | 843k | 101k | 8.89k | 727 | 55.9 | 40.7k |
| polyline-encoded@0.0.9 | 343k | 31.2k | 3.34k | 304 | 29.4 | 18.7k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 0.92x | 1.11x | **1.28x** | 1.31x | **1.33x** | **1.10x** |
| @placemarkio/polyline@2.0.3 | **1.13x** | 1.14x | 1.07x | 1.20x | 1.01x | 0.95x |
| **@duoquote/polytini@0.1.0 (web entry)** | 0.85x | **1.17x** | **1.28x** | **1.31x** | 0.99x | 0.96x |
| google-polyline@2.0.0 | 0.96x | 1.08x | 0.94x | 1.04x | 1.12x | 1.04x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| **@duoquote/polytini@0.1.0** | 0.98x | 1.08x | 0.98x | 1.00x | 0.95x | 0.99x |
| **@duoquote/polytini@0.1.0 (wasm)** | 0.94x | 0.85x | 0.90x | 0.93x | 1.17x | 1.09x |
| @pirxpilot/google-polyline@4.0.1 | 0.68x | 0.70x | 0.55x | 0.85x | 0.68x | 0.77x |
| google.maps.geometry.encoding | 0.38x | 0.48x | 0.56x | 0.57x | 0.24x | 0.64x |
| polyline-encoded@0.0.9 | 0.21x | 0.22x | 0.22x | 0.23x | 0.14x | 0.25x |
| @lp-labs/polyline-codec@0.1.0 | 0.08x | 0.08x | 0.07x | 0.07x | 0.08x | 0.09x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.04x | 0.04x | 0.05x | 0.04x | 0.06x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 1.30x | **1.52x** | **3.03x** | **3.74x** | **3.15x** | 2.60x |
| **@duoquote/polytini@0.1.0 (wasm)** | 1.27x | 1.47x | 2.89x | 2.95x | 2.80x | 2.01x |
| **@duoquote/polytini@0.1.0 (web entry)** | 1.13x | 1.48x | 1.75x | 2.40x | 2.64x | **2.82x** |
| google-polyline@2.0.0 | **1.47x** | 1.20x | 1.34x | 1.55x | 1.60x | 1.37x |
| @pirxpilot/google-polyline@4.0.1 | 1.42x | 1.26x | 1.42x | 1.51x | 1.33x | 1.40x |
| @placemarkio/polyline@2.0.3 | 0.99x | 1.23x | 1.08x | 1.31x | 1.29x | 1.01x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.74x | 0.75x | 0.64x | 0.81x | 0.74x | 0.80x |
| google.maps.geometry.encoding | 0.68x | 0.72x | 0.59x | 0.68x | 0.48x | 0.57x |
| @lp-labs/polyline-codec@0.1.0 | 0.25x | 0.22x | 0.20x | 0.23x | 0.19x | 0.26x |
| polyline-encoded@0.0.9 | 0.10x | 0.07x | 0.08x | 0.10x | 0.10x | 0.12x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.30M** | **506k** | 51.6k | 4.44k | 396 | **243k** |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 1.75M | 392k | **59.7k** | **6.90k** | **769** | 216k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 1.73M | 488k | 48.2k | 5.88k | 599 | 235k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 4.44M | **1.00M** | **129k** | 9.76k | **897** | 329k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | **4.55M** | 702k | 108k | **11.4k** | 877 | **477k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.57M | 563k | 46.5k | 3.88k | 323 | 158k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| @googlemaps/polyline-codec@1.0.28 | **463k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 458k |
| google-polyline@2.0.0 | 437k |
| @mapbox/polyline@1.2.1 | 421k |
| **@duoquote/polytini@0.1.0** | 419k |
| **@duoquote/polytini@0.1.0 (web entry)** | 406k |
| @placemarkio/polyline@2.0.3 | 402k |
| **@duoquote/polytini@0.1.0 (deck.gl binaryPaths)** | 375k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 350k |
| @pirxpilot/google-polyline@4.0.1 | 324k |
| google.maps.geometry.encoding | 270k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 243k |
| **@duoquote/polytini@0.1.0 (Float64Array)** | 235k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 216k |
| polyline-encoded@0.0.9 | 104k |
| @lp-labs/polyline-codec@0.1.0 | 38.8k |
| decode-google-map-polyline@1.0.1 | 23.2k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.0 (Float64Array)** | **477k** |
| **@duoquote/polytini@0.1.0 (web entry)** | 442k |
| **@duoquote/polytini@0.1.0** | 407k |
| **@duoquote/polytini@0.1.0 (wasm, Float64Array)** | 329k |
| **@duoquote/polytini@0.1.0 (wasm)** | 315k |
| **@duoquote/polytini@0.1.0 (wasm decodeMany/encodeMany)** | 306k |
| @pirxpilot/google-polyline@4.0.1 | 219k |
| google-polyline@2.0.0 | 215k |
| @placemarkio/polyline@2.0.3 | 159k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 158k |
| @mapbox/polyline@1.2.1 | 157k |
| @googlemaps/polyline-codec@1.0.28 | 126k |
| google.maps.geometry.encoding | 89.4k |
| @lp-labs/polyline-codec@0.1.0 | 40.7k |
| polyline-encoded@0.0.9 | 18.7k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 83.3 | 105 | **111** | 95.2 | **84.7** | **67.7** |
| @placemarkio/polyline@2.0.3 | **103** | 108 | 93.0 | 87.0 | 64.4 | 58.8 |
| **@duoquote/polytini@0.1.0 (web entry)** | 76.9 | **111** | **111** | **95.2** | 63.0 | 59.4 |
| google-polyline@2.0.0 | 87.0 | 103 | 81.6 | 75.5 | 71.4 | 64.0 |
| @mapbox/polyline@1.2.1 | 90.9 | 95.2 | 87.0 | 72.7 | 63.7 | 61.7 |
| **@duoquote/polytini@0.1.0** | 88.9 | 103 | 85.1 | 72.7 | 60.8 | 61.4 |
| **@duoquote/polytini@0.1.0 (wasm)** | 85.1 | 80.8 | 78.4 | 67.8 | 74.3 | 67.0 |
| @pirxpilot/google-polyline@4.0.1 | 61.5 | 66.7 | 47.6 | 61.5 | 43.4 | 47.4 |
| google.maps.geometry.encoding | 34.5 | 45.5 | 48.8 | 41.2 | 15.2 | 39.6 |
| polyline-encoded@0.0.9 | 18.7 | 20.9 | 18.8 | 16.6 | 9.04 | 15.2 |
| @lp-labs/polyline-codec@0.1.0 | 7.66 | 8.03 | 6.35 | 5.44 | 4.88 | 5.67 |
| decode-google-map-polyline@1.0.1 | 2.22 | 3.69 | 3.30 | 3.53 | 2.54 | 3.40 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 44.7 | **67.8** | **133** | **118** | **93.0** | 59.6 |
| **@duoquote/polytini@0.1.0 (wasm)** | 43.5 | 65.6 | 127 | 93.0 | 82.6 | 46.1 |
| **@duoquote/polytini@0.1.0 (web entry)** | 38.8 | 66.1 | 76.9 | 75.5 | 77.8 | **64.6** |
| google-polyline@2.0.0 | **50.6** | 53.7 | 58.8 | 48.8 | 47.2 | 31.5 |
| @pirxpilot/google-polyline@4.0.1 | 48.8 | 56.3 | 62.5 | 47.6 | 39.1 | 32.1 |
| @placemarkio/polyline@2.0.3 | 33.9 | 54.8 | 47.3 | 41.2 | 38.0 | 23.3 |
| @mapbox/polyline@1.2.1 | 34.3 | 44.7 | 44.0 | 31.5 | 29.5 | 22.9 |
| @googlemaps/polyline-codec@1.0.28 | 25.5 | 33.6 | 28.0 | 25.5 | 21.7 | 18.5 |
| google.maps.geometry.encoding | 23.3 | 32.3 | 25.8 | 21.3 | 14.2 | 13.1 |
| @lp-labs/polyline-codec@0.1.0 | 8.43 | 10.1 | 8.89 | 7.27 | 5.59 | 5.96 |
| polyline-encoded@0.0.9 | 3.43 | 3.12 | 3.34 | 3.04 | 2.94 | 2.74 |
