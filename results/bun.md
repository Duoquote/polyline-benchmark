## Bun v1.4.3, precision 5

- Runtime: Bun v1.4.3 (JavaScriptCore)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/bun.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 32%, worst 104%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 82.0 | 105 | 94.1 | 105 | 82.6 | 51.5 |
| @googlemaps/polyline-codec@1.0.28 | 82.6 | 89.0 | 100 | 92.5 | 84.1 | 50.9 |
| @mapbox/polyline@1.2.1 | 74.8 | 66.0 | 71.8 | 79.3 | 58.6 | 40.3 |
| @duoquote/polytini@0.1.0 (web entry) | 92.5 | 113 | 117 | 78.0 | 81.2 | 59.3 |
| @placemarkio/polyline@2.0.3 | 89.9 | 83.1 | 82.9 | 77.9 | 65.3 | 47.1 |
| google-polyline@2.0.0 | 84.8 | 78.2 | 62.8 | 66.2 | 69.9 | 44.0 |
| @duoquote/polytini@0.1.0 (wasm) | 67.7 | 80.3 | 77.4 | 65.1 | 64.2 | 57.4 |
| @pirxpilot/google-polyline@4.0.1 | 33.8 | 39.9 | 39.1 | 38.5 | 28.0 | 21.2 |
| polyline-encoded@0.0.9 | 32.5 | 19.6 | 24.3 | 19.8 | 17.1 | 14.9 |
| decode-google-map-polyline@1.0.1 | 3.42 | 3.76 | 4.10 | 3.92 | 3.04 | 3.48 |
| @lp-labs/polyline-codec@0.1.0 | 4.17 | 3.94 | 4.00 | 3.84 | 2.40 | 2.92 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 82.9 | 178 | 185 | 159 | 156 | 73.7 |
| @duoquote/polytini@0.1.0 (wasm) | 55.9 | 106 | 109 | 89.7 | 84.0 | 44.0 |
| @duoquote/polytini@0.1.0 (web entry) | 45.2 | 70.4 | 65.7 | 69.7 | 50.5 | 45.7 |
| google-polyline@2.0.0 | 52.5 | 56.7 | 59.6 | 52.4 | 38.7 | 29.8 |
| @pirxpilot/google-polyline@4.0.1 | 52.4 | 64.5 | 61.3 | 45.4 | 45.1 | 32.3 |
| @mapbox/polyline@1.2.1 | 31.7 | 33.1 | 31.5 | 29.9 | 16.5 | 19.2 |
| @placemarkio/polyline@2.0.3 | 32.1 | 41.8 | 38.6 | 29.8 | 16.8 | 20.7 |
| @googlemaps/polyline-codec@1.0.28 | 13.1 | 18.0 | 16.4 | 17.0 | 13.3 | 11.4 |
| @lp-labs/polyline-codec@0.1.0 | 4.16 | 4.36 | 4.24 | 3.74 | 2.33 | 2.23 |
| polyline-encoded@0.0.9 | 2.27 | 3.02 | 3.01 | 2.67 | 2.53 | 2.27 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 73.0 | 168 | 168 | 162 | 157 | 89.2 |
| @duoquote/polytini@0.1.0 (Float64Array) | 110 | 197 | 184 | 159 | 149 | 90.2 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 83.9 | 88.3 | 77.2 | 75.6 | 64.8 | 43.1 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 84.5 | 164 | 200 | 173 | 163 | 87.2 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 56.8 | 121 | 128 | 107 | 91.7 | 53.6 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 29.3 | 30.2 | 29.0 | 26.6 | 16.3 | 17.0 |
