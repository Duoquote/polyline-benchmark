## Node v26.13.1, precision 5

- Runtime: Node v26.13.1 (V8 14.6.202.34-node.40)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 22%, worst 59%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 73.5 | 99.5 | 97.7 | 90.6 | 74.1 | 60.8 |
| @googlemaps/polyline-codec@1.0.28 | 73.9 | 93.9 | 91.4 | 86.1 | 60.6 | 50.3 |
| @duoquote/polytini@0.1.0 (web entry) | 71.8 | 92.4 | 88.2 | 79.8 | 60.1 | 51.6 |
| @placemarkio/polyline@2.0.3 | 85.2 | 81.1 | 65.9 | 71.5 | 60.2 | 46.5 |
| @mapbox/polyline@1.2.1 | 77.0 | 71.8 | 62.7 | 70.1 | 54.6 | 45.5 |
| @duoquote/polytini@0.1.0 (wasm) | 50.0 | 70.0 | 70.7 | 68.7 | 50.4 | 52.8 |
| google-polyline@2.0.0 | 70.4 | 63.4 | 63.3 | 66.8 | 49.9 | 43.0 |
| @pirxpilot/google-polyline@4.0.1 | 52.3 | 52.2 | 55.0 | 53.5 | 38.0 | 36.5 |
| polyline-encoded@0.0.9 | 19.8 | 18.4 | 17.3 | 17.4 | 7.51 | 14.1 |
| @lp-labs/polyline-codec@0.1.0 | 5.77 | 6.81 | 6.04 | 5.56 | 2.96 | 4.42 |
| decode-google-map-polyline@1.0.1 | 1.68 | 3.25 | 3.49 | 3.59 | 1.95 | 3.14 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 63.7 | 116 | 119 | 112 | 93.4 | 55.9 |
| @duoquote/polytini@0.1.0 (wasm) | 51.1 | 105 | 110 | 95.1 | 72.5 | 47.1 |
| @duoquote/polytini@0.1.0 (web entry) | 44.0 | 65.1 | 70.5 | 71.1 | 62.4 | 52.8 |
| @pirxpilot/google-polyline@4.0.1 | 45.0 | 59.0 | 61.8 | 48.5 | 41.1 | 30.4 |
| google-polyline@2.0.0 | 45.4 | 62.2 | 58.9 | 44.7 | 35.3 | 29.6 |
| @placemarkio/polyline@2.0.3 | 38.7 | 54.7 | 50.8 | 42.1 | 32.6 | 25.1 |
| @mapbox/polyline@1.2.1 | 34.9 | 49.1 | 44.6 | 38.2 | 27.6 | 22.9 |
| @googlemaps/polyline-codec@1.0.28 | 17.4 | 18.6 | 17.6 | 16.1 | 12.3 | 11.2 |
| @lp-labs/polyline-codec@0.1.0 | 7.43 | 8.63 | 7.62 | 6.50 | 4.95 | 4.04 |
| polyline-encoded@0.0.9 | 2.77 | 2.82 | 2.85 | 2.63 | 2.33 | 1.87 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 18.8 | 60.9 | 74.1 | 84.3 | 94.6 | 45.0 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 17.3 | 60.0 | 71.1 | 78.7 | 99.0 | 44.6 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 40.5 | 57.9 | 53.9 | 57.7 | 41.6 | 34.8 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 61.8 | 118 | 124 | 114 | 107 | 73.4 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 51.9 | 123 | 129 | 106 | 87.9 | 56.8 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 31.8 | 55.0 | 47.9 | 40.0 | 30.8 | 25.0 |
