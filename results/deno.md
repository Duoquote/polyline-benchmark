## Deno v2.5.4, precision 5

- Runtime: Deno v2.5.4 (V8 14.0.365.5-rusty)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/deno.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 23%, worst 60%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 77.9 | 101 | 115 | 86.1 | 75.8 | 55.0 |
| @googlemaps/polyline-codec@1.0.28 | 74.4 | 95.1 | 97.5 | 82.3 | 69.5 | 50.3 |
| @duoquote/polytini@0.1.0 (web entry) | 76.3 | 93.0 | 89.1 | 81.1 | 53.2 | 51.0 |
| @mapbox/polyline@1.2.1 | 77.9 | 77.0 | 65.2 | 72.2 | 50.6 | 45.4 |
| @placemarkio/polyline@2.0.3 | 88.7 | 83.1 | 71.1 | 70.8 | 51.2 | 47.0 |
| google-polyline@2.0.0 | 70.1 | 74.6 | 62.3 | 64.4 | 37.3 | 41.2 |
| @pirxpilot/google-polyline@4.0.1 | 52.4 | 55.1 | 51.7 | 53.7 | 38.5 | 35.7 |
| @duoquote/polytini@0.1.0 (wasm) | 13.2 | 41.3 | 50.5 | 47.1 | 39.2 | 29.2 |
| polyline-encoded@0.0.9 | 18.3 | 20.3 | 19.9 | 18.0 | 13.1 | 14.5 |
| @lp-labs/polyline-codec@0.1.0 | 5.55 | 6.67 | 5.71 | 5.40 | 3.85 | 4.77 |
| decode-google-map-polyline@1.0.1 | 1.34 | 2.54 | 2.76 | 2.91 | 2.10 | 2.42 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 | 40.3 | 57.7 | 109 | 103 | 85.1 | 52.2 |
| @duoquote/polytini@0.1.0 (web entry) | 43.1 | 59.6 | 69.1 | 69.0 | 69.6 | 54.0 |
| @pirxpilot/google-polyline@4.0.1 | 47.0 | 55.7 | 56.8 | 47.5 | 43.7 | 28.8 |
| google-polyline@2.0.0 | 46.0 | 59.7 | 57.5 | 45.5 | 41.0 | 24.8 |
| @placemarkio/polyline@2.0.3 | 38.2 | 52.0 | 49.9 | 42.7 | 33.6 | 25.4 |
| @duoquote/polytini@0.1.0 (wasm) | 35.5 | 46.2 | 48.2 | 37.3 | 29.5 | 22.2 |
| @mapbox/polyline@1.2.1 | 31.9 | 43.7 | 40.1 | 35.8 | 32.6 | 23.9 |
| @googlemaps/polyline-codec@1.0.28 | 16.3 | 20.9 | 16.6 | 10.6 | 9.87 | 9.82 |
| @lp-labs/polyline-codec@0.1.0 | 6.65 | 8.17 | 6.76 | 6.74 | 3.98 | 4.09 |
| polyline-encoded@0.0.9 | 2.24 | 2.35 | 2.34 | 2.24 | 2.07 | 1.54 |

| decode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 18.2 | 67.1 | 81.0 | 91.7 | 113 | 46.8 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 8.68 | 36.4 | 44.2 | 46.2 | 52.5 | 25.7 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 40.1 | 56.2 | 50.9 | 43.0 | 37.2 | 33.7 |

| encode, typed arrays | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (Float64Array) | 43.7 | 64.0 | 114 | 112 | 99.0 | 59.7 |
| @duoquote/polytini@0.1.0 (wasm, Float64Array) | 36.0 | 56.6 | 49.0 | 36.9 | 34.9 | 26.1 |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 31.3 | 51.5 | 46.5 | 32.7 | 27.0 | 21.9 |
