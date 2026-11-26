## Node v24.22.3, precision 5

- Runtime: Node v24.22.3 (V8 13.6.233.17-node.63)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 25%, worst 61%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 77.1 | 103 | 90.1 | 86.3 | 64.1 | 57.6 |
| @googlemaps/polyline-codec@1.0.28 | 69.9 | 102 | 89.5 | 83.3 | 62.5 | 48.9 |
| @duoquote/polytini@0.1.0 (web entry) | 68.4 | 84.9 | 86.1 | 81.1 | 54.9 | 50.9 |
| @placemarkio/polyline@2.0.3 | 81.3 | 75.3 | 62.4 | 68.5 | 43.8 | 46.4 |
| @mapbox/polyline@1.2.1 | 77.5 | 69.9 | 64.5 | 67.6 | 44.5 | 43.1 |
| @duoquote/polytini@0.1.0 (wasm) | 45.0 | 63.9 | 67.4 | 63.6 | 50.0 | 51.6 |
| google-polyline@2.0.0 | 66.8 | 65.8 | 59.3 | 56.7 | 43.6 | 44.2 |
| @pirxpilot/google-polyline@4.0.1 | 58.3 | 55.7 | 49.5 | 53.1 | 40.3 | 39.8 |
| polyline-encoded@0.0.9 | 15.4 | 17.6 | 16.9 | 15.4 | 11.9 | 14.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.35 | 6.19 | 6.00 | 4.66 | 3.80 | 4.39 |
| decode-google-map-polyline@1.0.1 | 1.50 | 2.40 | 2.69 | 2.82 | 1.85 | 2.46 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 57.3 | 106 | 117 | 109 | 99.6 | 64.7 |
| @duoquote/polytini@0.1.0 (wasm) | 46.5 | 101 | 108 | 86.0 | 61.9 | 36.2 |
| @duoquote/polytini@0.1.0 (web entry) | 39.9 | 59.9 | 65.9 | 66.1 | 57.5 | 51.1 |
| @pirxpilot/google-polyline@4.0.1 | 46.4 | 56.4 | 63.1 | 49.2 | 42.8 | 29.6 |
| google-polyline@2.0.0 | 43.6 | 61.7 | 59.6 | 46.6 | 43.2 | 28.8 |
| @placemarkio/polyline@2.0.3 | 33.7 | 52.4 | 49.9 | 43.1 | 33.2 | 23.7 |
| @mapbox/polyline@1.2.1 | 32.3 | 45.6 | 42.3 | 33.8 | 24.4 | 21.7 |
| @googlemaps/polyline-codec@1.0.28 | 16.8 | 16.5 | 18.0 | 10.4 | 8.15 | 11.2 |
| @lp-labs/polyline-codec@0.1.0 | 7.18 | 8.34 | 7.20 | 5.50 | 4.06 | 4.01 |
| polyline-encoded@0.0.9 | 2.22 | 2.41 | 2.39 | 2.30 | 2.03 | 1.56 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 15.9 | 64.9 | 80.9 | 86.2 | 94.0 | 40.5 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 13.3 | 56.1 | 70.7 | 83.6 | 102 | 45.6 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 38.9 | 55.5 | 48.5 | 40.6 | 33.5 | 29.9 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 55.8 | 112 | 128 | 118 | 96.9 | 73.4 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 45.7 | 116 | 126 | 102 | 85.0 | 53.5 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 31.3 | 49.6 | 45.7 | 34.5 | 31.1 | 23.8 |
