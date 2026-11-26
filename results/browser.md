## Chrome 157.0.8103.80 (headless), precision 5

- Browser: Chrome 157.0.8103.80 (headless), through playwright-core with the installed Chrome
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/browser.js` (esbuild, browser conditions)
- google.maps.geometry.encoding: included, Maps JavaScript API loaded once, its 5 rounds ran in one page

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh browser process. Higher is better. Rows are sorted by the 10,000 point column.

Spread between the fastest and slowest round of a cell: median 28%, worst 97%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 90.9 | 121 | 111 | 103 | 87.7 | 67.9 |
| @duoquote/polytini@0.1.0 | 88.9 | 118 | 111 | 95.2 | 73.8 | 73.3 |
| @duoquote/polytini@0.1.0 (web entry) | 85.1 | 105 | 103 | 93.0 | 76.5 | 67.7 |
| @mapbox/polyline@1.2.1 | 97.6 | 111 | 93.0 | 90.9 | 84.0 | 64.5 |
| @placemarkio/polyline@2.0.3 | 105 | 111 | 87.0 | 87.0 | 88.1 | 68.7 |
| google-polyline@2.0.0 | 83.3 | 105 | 74.8 | 85.1 | 77.4 | 61.4 |
| @duoquote/polytini@0.1.0 (wasm) | 22.2 | 71.4 | 76.9 | 71.4 | 62.9 | 44.1 |
| @pirxpilot/google-polyline@4.0.1 | 67.8 | 65.6 | 63.5 | 63.5 | 57.3 | 50.5 |
| google.maps.geometry.encoding | 29.9 | 35.1 | 36.0 | 33.1 | 12.8 | 30.0 |
| polyline-encoded@0.0.9 | 18.2 | 15.2 | 18.3 | 14.9 | 8.69 | 17.4 |
| @lp-labs/polyline-codec@0.1.0 | 6.94 | 8.10 | 7.33 | 6.16 | 4.74 | 5.92 |
| decode-google-map-polyline@1.0.1 | 2.37 | 3.51 | 3.81 | 4.08 | 2.63 | 3.57 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 42.6 | 71.4 | 133 | 121 | 84.4 | 63.5 |
| @duoquote/polytini@0.1.0 (wasm) | 20.9 | 85.1 | 103 | 90.9 | 76.9 | 40.6 |
| @duoquote/polytini@0.1.0 (web entry) | 47.1 | 70.2 | 76.9 | 76.9 | 78.7 | 64.7 |
| @pirxpilot/google-polyline@4.0.1 | 50.0 | 61.5 | 69.0 | 54.1 | 54.7 | 31.6 |
| google-polyline@2.0.0 | 48.8 | 69.0 | 65.6 | 50.0 | 48.1 | 31.5 |
| @placemarkio/polyline@2.0.3 | 40.4 | 60.6 | 52.6 | 44.4 | 40.1 | 26.0 |
| @mapbox/polyline@1.2.1 | 33.9 | 51.3 | 46.0 | 38.8 | 33.7 | 24.3 |
| @googlemaps/polyline-codec@1.0.28 | 21.1 | 34.5 | 29.9 | 27.4 | 22.5 | 15.1 |
| google.maps.geometry.encoding | 15.4 | 19.3 | 18.8 | 17.9 | 14.2 | 11.7 |
| @lp-labs/polyline-codec@0.1.0 | 8.30 | 9.95 | 9.13 | 8.13 | 6.36 | 6.75 |
| polyline-encoded@0.0.9 | 3.52 | 3.49 | 3.46 | 3.27 | 3.25 | 2.74 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 14.3 | 47.6 | 59.7 | 69.0 | 86.8 | 36.5 |
| @duoquote/polytini@0.1.0 (Float64Array) | 18.1 | 43.5 | 54.8 | 58.8 | 57.6 | 39.8 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 44.4 | 54.1 | 53.3 | 58.0 | 46.5 | 38.9 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 44.9 | 72.7 | 138 | 129 | 84.4 | 72.1 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 28.8 | 100 | 121 | 103 | 86.6 | 49.3 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 37.7 | 62.0 | 53.3 | 43.0 | 37.0 | 25.2 |
