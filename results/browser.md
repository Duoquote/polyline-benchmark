## Chrome 157.0.8103.80 (headless), precision 5

- Browser: Chrome 157.0.8103.80 (headless), through playwright-core with the installed Chrome
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/browser.js` (esbuild, browser conditions)
- google.maps.geometry.encoding: not included (needs GOOGLE_MAPS_API_KEY)

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh browser context. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 6%, worst 57%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 9.76M | **1.38M** | **133k** | **11.8k** | **1.09k** | 535k |
| @placemarkio/polyline@2.0.3 | **11.8M** | 1.33M | 111k | 11.1k | 1.02k | 528k |
| @mapbox/polyline@1.2.1 | **11.8M** | 1.25M | 108k | 10.8k | 990 | 517k |
| **@duoquote/polytini@0.1.4** | 9.30M | 1.29M | 125k | 11.1k | 881 | **541k** |
| **@duoquote/polytini@0.1.4 (web entry)** | 9.30M | 1.29M | 125k | 11.1k | 879 | 533k |
| **@duoquote/polytini@0.1.4 (wasm)** | 9.52M | 1.29M | 121k | 11.1k | 862 | 526k |
| google-polyline@2.0.0 | 9.30M | 1.18M | 97.6k | 9.76k | 905 | 478k |
| @pirxpilot/google-polyline@4.0.1 | 7.14M | 833k | 74.1k | 7.27k | 707 | 386k |
| polyline-encoded@0.0.9 | 2.45M | 274k | 24.6k | 2.61k | 103 | 142k |
| @lp-labs/polyline-codec@0.1.0 | 766k | 89.0k | 8.40k | 756 | 58.4 | 45.5k |
| decode-google-map-polyline@1.0.1 | 262k | 44.8k | 4.76k | 472 | 29.3 | 28.5k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **5.56M** | 755k | **138k** | **12.5k** | **1.03k** | 515k |
| **@duoquote/polytini@0.1.4 (wasm)** | 5.48M | **1.08M** | **138k** | 10.3k | 971 | 369k |
| **@duoquote/polytini@0.1.4 (web entry)** | 5.48M | 741k | 81.6k | 8.33k | 837 | **541k** |
| @pirxpilot/google-polyline@4.0.1 | 5.26M | 645k | 71.4k | 5.88k | 583 | 251k |
| google-polyline@2.0.0 | 5.26M | 702k | 70.2k | 5.48k | 539 | 247k |
| @placemarkio/polyline@2.0.3 | 4.26M | 625k | 55.6k | 4.76k | 452 | 210k |
| @mapbox/polyline@1.2.1 | 3.67M | 541k | 48.2k | 4.04k | 373 | 185k |
| @googlemaps/polyline-codec@1.0.28 | 2.76M | 370k | 32.8k | 3.01k | 282 | 145k |
| @lp-labs/polyline-codec@0.1.0 | 964k | 111k | 10.3k | 942 | 78.3 | 51.6k |
| polyline-encoded@0.0.9 | 370k | 37.0k | 3.73k | 356 | 35.1 | 23.1k |

| decode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 0.83x | **1.10x** | **1.23x** | **1.09x** | **1.10x** | 1.03x |
| @placemarkio/polyline@2.0.3 | **1.00x** | 1.07x | 1.03x | 1.03x | 1.03x | 1.02x |
| @mapbox/polyline@1.2.1 | **1.00x** | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| **@duoquote/polytini@0.1.4** | 0.79x | 1.03x | 1.16x | 1.03x | 0.89x | **1.05x** |
| **@duoquote/polytini@0.1.4 (web entry)** | 0.79x | 1.03x | 1.16x | 1.03x | 0.89x | 1.03x |
| **@duoquote/polytini@0.1.4 (wasm)** | 0.81x | 1.03x | 1.12x | 1.03x | 0.87x | 1.02x |
| google-polyline@2.0.0 | 0.79x | 0.94x | 0.90x | 0.90x | 0.91x | 0.93x |
| @pirxpilot/google-polyline@4.0.1 | 0.61x | 0.67x | 0.69x | 0.67x | 0.71x | 0.75x |
| polyline-encoded@0.0.9 | 0.21x | 0.22x | 0.23x | 0.24x | 0.10x | 0.28x |
| @lp-labs/polyline-codec@0.1.0 | 0.07x | 0.07x | 0.08x | 0.07x | 0.06x | 0.09x |
| decode-google-map-polyline@1.0.1 | 0.02x | 0.04x | 0.04x | 0.04x | 0.03x | 0.06x |

| encode, vs @mapbox/polyline = 1.00x | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **1.51x** | 1.40x | **2.86x** | **3.09x** | **2.76x** | 2.79x |
| **@duoquote/polytini@0.1.4 (wasm)** | 1.49x | **2.00x** | **2.86x** | 2.54x | 2.60x | 2.00x |
| **@duoquote/polytini@0.1.4 (web entry)** | 1.49x | 1.37x | 1.69x | 2.06x | 2.24x | **2.93x** |
| @pirxpilot/google-polyline@4.0.1 | 1.43x | 1.19x | 1.48x | 1.46x | 1.56x | 1.36x |
| google-polyline@2.0.0 | 1.43x | 1.30x | 1.46x | 1.36x | 1.44x | 1.34x |
| @placemarkio/polyline@2.0.3 | 1.16x | 1.16x | 1.15x | 1.18x | 1.21x | 1.14x |
| @mapbox/polyline@1.2.1 | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x | 1.00x |
| @googlemaps/polyline-codec@1.0.28 | 0.75x | 0.69x | 0.68x | 0.74x | 0.76x | 0.79x |
| @lp-labs/polyline-codec@0.1.0 | 0.26x | 0.20x | 0.21x | 0.23x | 0.21x | 0.28x |
| polyline-encoded@0.0.9 | 0.10x | 0.07x | 0.08x | 0.09x | 0.09x | 0.13x |

| decode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| ol@10.11.0 (encodeDeltas/decodeDeltas) | **4.71M** | **645k** | 63.5k | 6.45k | 575 | 307k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 1.98M | 465k | **70.2k** | **8.70k** | **939** | **307k** |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 1.98M | 615k | 62.5k | 6.45k | 673 | 301k |

| encode, typed arrays, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 5.41M | **1.29M** | **167k** | 12.1k | **1.17k** | 426k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | **5.63M** | 800k | 143k | **13.3k** | 1.04k | **566k** |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.92M | 656k | 55.6k | 4.65k | 399 | 188k |

| decode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4** | **541k** |
| @googlemaps/polyline-codec@1.0.28 | 535k |
| **@duoquote/polytini@0.1.4 (web entry)** | 533k |
| @placemarkio/polyline@2.0.3 | 528k |
| **@duoquote/polytini@0.1.4 (wasm)** | 526k |
| @mapbox/polyline@1.2.1 | 517k |
| google-polyline@2.0.0 | 478k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 475k |
| **@duoquote/polytini@0.1.4 (deck.gl binaryPaths)** | 447k |
| @pirxpilot/google-polyline@4.0.1 | 386k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 307k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 307k |
| **@duoquote/polytini@0.1.4 (Float64Array)** | 301k |
| polyline-encoded@0.0.9 | 142k |
| @lp-labs/polyline-codec@0.1.0 | 45.5k |
| decode-google-map-polyline@1.0.1 | 28.5k |

| encode, real-world lines/s | 1000 lines, each or in one call |
|---|--:|
| **@duoquote/polytini@0.1.4 (Float64Array)** | **566k** |
| **@duoquote/polytini@0.1.4 (web entry)** | 541k |
| **@duoquote/polytini@0.1.4** | 515k |
| **@duoquote/polytini@0.1.4 (wasm, Float64Array)** | 426k |
| **@duoquote/polytini@0.1.4 (wasm decodeMany/encodeMany)** | 373k |
| **@duoquote/polytini@0.1.4 (wasm)** | 369k |
| @pirxpilot/google-polyline@4.0.1 | 251k |
| google-polyline@2.0.0 | 247k |
| @placemarkio/polyline@2.0.3 | 210k |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 188k |
| @mapbox/polyline@1.2.1 | 185k |
| @googlemaps/polyline-codec@1.0.28 | 145k |
| @lp-labs/polyline-codec@0.1.0 | 51.6k |
| polyline-encoded@0.0.9 | 23.1k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 97.6 | **138** | **133** | **118** | **109** | 78.3 |
| @placemarkio/polyline@2.0.3 | **118** | 133 | 111 | 111 | 102 | 77.2 |
| @mapbox/polyline@1.2.1 | **118** | 125 | 108 | 108 | 99.0 | 75.6 |
| **@duoquote/polytini@0.1.4** | 93.0 | 129 | 125 | 111 | 88.1 | **79.1** |
| **@duoquote/polytini@0.1.4 (web entry)** | 93.0 | 129 | 125 | 111 | 87.9 | 78.0 |
| **@duoquote/polytini@0.1.4 (wasm)** | 95.2 | 129 | 121 | 111 | 86.2 | 77.0 |
| google-polyline@2.0.0 | 93.0 | 118 | 97.6 | 97.6 | 90.5 | 70.0 |
| @pirxpilot/google-polyline@4.0.1 | 71.4 | 83.3 | 74.1 | 72.7 | 70.7 | 56.5 |
| polyline-encoded@0.0.9 | 24.5 | 27.4 | 24.6 | 26.1 | 10.3 | 20.8 |
| @lp-labs/polyline-codec@0.1.0 | 7.66 | 8.90 | 8.40 | 7.56 | 5.84 | 6.66 |
| decode-google-map-polyline@1.0.1 | 2.62 | 4.48 | 4.76 | 4.72 | 2.93 | 4.18 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4** | **55.6** | 75.5 | **138** | **125** | **103** | 75.3 |
| **@duoquote/polytini@0.1.4 (wasm)** | 54.8 | **108** | **138** | 103 | 97.1 | 53.9 |
| **@duoquote/polytini@0.1.4 (web entry)** | 54.8 | 74.1 | 81.6 | 83.3 | 83.7 | **79.1** |
| @pirxpilot/google-polyline@4.0.1 | 52.6 | 64.5 | 71.4 | 58.8 | 58.3 | 36.7 |
| google-polyline@2.0.0 | 52.6 | 70.2 | 70.2 | 54.8 | 53.9 | 36.2 |
| @placemarkio/polyline@2.0.3 | 42.6 | 62.5 | 55.6 | 47.6 | 45.2 | 30.7 |
| @mapbox/polyline@1.2.1 | 36.7 | 54.1 | 48.2 | 40.4 | 37.3 | 27.0 |
| @googlemaps/polyline-codec@1.0.28 | 27.6 | 37.0 | 32.8 | 30.1 | 28.2 | 21.2 |
| @lp-labs/polyline-codec@0.1.0 | 9.64 | 11.1 | 10.3 | 9.42 | 7.83 | 7.55 |
| polyline-encoded@0.0.9 | 3.70 | 3.70 | 3.73 | 3.56 | 3.51 | 3.38 |
