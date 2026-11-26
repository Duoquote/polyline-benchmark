## Node v22.23.5, precision 5

- Runtime: Node v22.23.5 (V8 12.4.254.21-node.57)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 29%, worst 69%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 60.5 | 87.6 | 73.6 | 85.5 | 16.7 | 48.3 |
| @duoquote/polytini@0.1.0 | 47.8 | 75.9 | 73.1 | 73.4 | 20.7 | 53.2 |
| @duoquote/polytini@0.1.0 (web entry) | 65.7 | 85.3 | 80.0 | 72.9 | 18.0 | 46.6 |
| @duoquote/polytini@0.1.0 (wasm) | 48.2 | 63.2 | 63.7 | 66.7 | 15.2 | 46.1 |
| google-polyline@2.0.0 | 68.1 | 68.2 | 51.5 | 63.6 | 27.2 | 41.3 |
| @placemarkio/polyline@2.0.3 | 72.7 | 74.1 | 64.6 | 59.7 | 20.0 | 41.9 |
| @mapbox/polyline@1.2.1 | 70.6 | 64.7 | 55.6 | 57.6 | 26.7 | 38.0 |
| @pirxpilot/google-polyline@4.0.1 | 53.8 | 63.9 | 52.3 | 55.4 | 21.9 | 36.6 |
| polyline-encoded@0.0.9 | 15.7 | 16.1 | 14.3 | 12.7 | 4.58 | 13.7 |
| @lp-labs/polyline-codec@0.1.0 | 4.79 | 6.19 | 4.96 | 4.05 | 2.63 | 4.31 |
| decode-google-map-polyline@1.0.1 | 1.13 | 1.62 | 1.92 | 1.82 | 1.13 | 1.32 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 47.0 | 107 | 124 | 113 | 97.5 | 61.9 |
| @duoquote/polytini@0.1.0 (wasm) | 35.0 | 73.5 | 82.3 | 71.4 | 62.3 | 37.3 |
| @duoquote/polytini@0.1.0 (web entry) | 33.8 | 51.7 | 60.0 | 62.5 | 29.8 | 52.5 |
| @pirxpilot/google-polyline@4.0.1 | 33.8 | 49.1 | 50.2 | 45.4 | 13.8 | 30.5 |
| google-polyline@2.0.0 | 47.2 | 63.6 | 59.5 | 43.1 | 12.8 | 27.1 |
| @placemarkio/polyline@2.0.3 | 32.2 | 35.5 | 47.5 | 39.7 | 11.4 | 24.8 |
| @mapbox/polyline@1.2.1 | 27.4 | 43.3 | 41.3 | 36.7 | 10.8 | 21.4 |
| @googlemaps/polyline-codec@1.0.28 | 13.6 | 18.2 | 15.8 | 9.18 | 8.34 | 9.66 |
| @lp-labs/polyline-codec@0.1.0 | 6.89 | 8.28 | 7.02 | 5.91 | 2.98 | 3.72 |
| polyline-encoded@0.0.9 | 1.46 | 1.59 | 1.30 | 1.15 | 1.01 | 1.01 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 13.4 | 57.0 | 71.0 | 75.2 | 92.4 | 38.7 |
| @duoquote/polytini@0.1.0 (Float64Array) | 12.2 | 56.7 | 71.4 | 72.2 | 86.1 | 33.7 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 49.2 | 52.6 | 49.9 | 39.9 | 32.1 | 32.5 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 38.6 | 106 | 123 | 119 | 98.8 | 67.5 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 35.3 | 80.7 | 91.3 | 80.1 | 69.1 | 49.5 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 23.3 | 46.3 | 41.3 | 24.9 | 9.56 | 20.6 |
