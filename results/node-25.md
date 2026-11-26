## Node v25.2.1, precision 5

- Runtime: Node v25.2.1 (V8 14.1.146.11-node.14)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 25%, worst 74%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 71.5 | 89.2 | 92.3 | 91.5 | 64.8 | 51.6 |
| @duoquote/polytini@0.1.0 | 70.3 | 93.6 | 92.7 | 87.0 | 75.8 | 61.5 |
| @duoquote/polytini@0.1.0 (web entry) | 67.5 | 83.7 | 79.4 | 76.3 | 49.8 | 50.8 |
| @mapbox/polyline@1.2.1 | 80.5 | 70.6 | 68.4 | 65.9 | 39.9 | 46.3 |
| @duoquote/polytini@0.1.0 (wasm) | 49.2 | 70.6 | 68.8 | 63.4 | 51.6 | 51.3 |
| @placemarkio/polyline@2.0.3 | 73.1 | 66.2 | 60.6 | 62.1 | 39.7 | 46.4 |
| google-polyline@2.0.0 | 65.6 | 59.3 | 49.1 | 58.9 | 43.6 | 41.5 |
| @pirxpilot/google-polyline@4.0.1 | 51.7 | 56.3 | 52.2 | 53.4 | 40.9 | 37.1 |
| polyline-encoded@0.0.9 | 16.3 | 18.8 | 15.6 | 14.8 | 9.71 | 11.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.06 | 6.35 | 5.99 | 5.30 | 3.75 | 4.58 |
| decode-google-map-polyline@1.0.1 | 1.52 | 2.69 | 2.90 | 2.75 | 1.85 | 2.61 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 60.1 | 113 | 123 | 114 | 89.0 | 57.3 |
| @duoquote/polytini@0.1.0 (wasm) | 47.2 | 95.8 | 110 | 92.8 | 63.7 | 43.7 |
| @duoquote/polytini@0.1.0 (web entry) | 44.4 | 63.9 | 67.2 | 68.2 | 58.6 | 51.9 |
| @pirxpilot/google-polyline@4.0.1 | 48.0 | 59.8 | 61.8 | 49.7 | 40.8 | 31.3 |
| @placemarkio/polyline@2.0.3 | 37.3 | 51.9 | 50.1 | 41.3 | 33.9 | 23.9 |
| google-polyline@2.0.0 | 46.6 | 60.9 | 58.0 | 40.1 | 39.4 | 29.4 |
| @mapbox/polyline@1.2.1 | 33.7 | 47.2 | 43.5 | 36.6 | 33.7 | 21.9 |
| @googlemaps/polyline-codec@1.0.28 | 16.2 | 21.0 | 18.1 | 13.8 | 11.4 | 11.6 |
| @lp-labs/polyline-codec@0.1.0 | 7.00 | 7.67 | 7.13 | 6.57 | 4.36 | 3.97 |
| polyline-encoded@0.0.9 | 2.19 | 2.20 | 2.22 | 2.11 | 2.08 | 1.55 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 15.5 | 58.6 | 72.6 | 84.9 | 98.3 | 42.2 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 14.0 | 56.0 | 64.9 | 81.0 | 99.8 | 44.4 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 38.9 | 54.6 | 51.6 | 41.7 | 34.0 | 33.4 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 60.1 | 114 | 124 | 115 | 94.8 | 71.9 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 47.4 | 118 | 124 | 95.1 | 85.5 | 56.2 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 28.9 | 53.4 | 45.1 | 35.2 | 30.7 | 23.9 |
