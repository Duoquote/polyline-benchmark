## Node v23.11.1, precision 5

- Runtime: Node v23.11.1 (V8 12.9.202.28-node.14)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 24%, worst 67%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 74.5 | 91.8 | 98.2 | 95.8 | 25.7 | 54.3 |
| @googlemaps/polyline-codec@1.0.28 | 65.2 | 78.2 | 99.0 | 81.6 | 19.2 | 50.9 |
| @mapbox/polyline@1.2.1 | 95.0 | 78.6 | 74.7 | 70.5 | 24.9 | 44.2 |
| @placemarkio/polyline@2.0.3 | 80.8 | 81.4 | 59.6 | 67.7 | 23.0 | 46.1 |
| @duoquote/polytini@0.1.0 (wasm) | 46.4 | 69.7 | 70.2 | 67.4 | 19.1 | 46.3 |
| @duoquote/polytini@0.1.0 (web entry) | 70.0 | 82.8 | 83.5 | 66.8 | 16.7 | 50.6 |
| google-polyline@2.0.0 | 78.6 | 73.0 | 60.6 | 59.3 | 21.8 | 40.3 |
| @pirxpilot/google-polyline@4.0.1 | 58.8 | 72.2 | 59.6 | 55.9 | 19.1 | 35.4 |
| polyline-encoded@0.0.9 | 17.2 | 19.4 | 19.5 | 14.2 | 5.30 | 15.7 |
| @lp-labs/polyline-codec@0.1.0 | 5.10 | 6.49 | 5.90 | 4.70 | 2.59 | 3.95 |
| decode-google-map-polyline@1.0.1 | 1.19 | 1.97 | 2.21 | 1.74 | 1.15 | 1.63 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 47.0 | 106 | 123 | 113 | 93.1 | 61.5 |
| @duoquote/polytini@0.1.0 (wasm) | 42.4 | 115 | 130 | 108 | 78.1 | 46.2 |
| @duoquote/polytini@0.1.0 (web entry) | 34.8 | 60.9 | 67.3 | 67.7 | 29.8 | 50.0 |
| @pirxpilot/google-polyline@4.0.1 | 37.7 | 53.7 | 56.9 | 44.4 | 12.1 | 26.8 |
| google-polyline@2.0.0 | 46.5 | 57.9 | 55.5 | 43.0 | 11.5 | 25.2 |
| @placemarkio/polyline@2.0.3 | 31.6 | 47.6 | 48.2 | 39.7 | 9.94 | 23.4 |
| @mapbox/polyline@1.2.1 | 27.5 | 42.8 | 39.0 | 32.8 | 10.5 | 22.0 |
| @googlemaps/polyline-codec@1.0.28 | 14.0 | 20.5 | 16.5 | 11.0 | 8.05 | 11.1 |
| @lp-labs/polyline-codec@0.1.0 | 6.22 | 8.43 | 7.21 | 5.57 | 3.15 | 3.74 |
| polyline-encoded@0.0.9 | 1.72 | 1.85 | 1.83 | 1.69 | 1.16 | 1.14 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 14.3 | 57.0 | 70.0 | 77.9 | 93.1 | 32.9 |
| @duoquote/polytini@0.1.0 (Float64Array) | 15.4 | 56.5 | 74.2 | 72.5 | 88.9 | 39.2 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 56.0 | 55.4 | 55.0 | 40.0 | 32.5 | 32.8 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 44.1 | 141 | 162 | 131 | 99.6 | 56.1 |
| @duoquote/polytini@0.1.0 (Float64Array) | 47.8 | 110 | 121 | 119 | 100.0 | 66.0 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 26.0 | 47.6 | 45.2 | 34.8 | 11.6 | 23.0 |
