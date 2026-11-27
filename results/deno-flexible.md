## Deno v2.5.4, HERE Flexible Polyline, precision 5

- Runtime: Deno v2.5.4 (V8 14.0.365.5-rusty)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/deno.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 7%, worst 20%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **7.69M** | **912k** | **76.1k** | **7.97k** | **600** | **361k** |
| @here/flexpolyline@0.1.0 | 482k | 53.3k | 5.11k | 440 | 32.2 | 27.9k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **4.64M** | **710k** | **79.4k** | **7.88k** | **802** | **455k** |
| @here/flexpolyline@0.1.0 | 299k | 41.3k | 3.69k | 297 | 23.9 | 18.6k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **76.9** | **91.2** | **76.1** | **79.7** | **60.0** | **52.9** |
| @here/flexpolyline@0.1.0 | 4.82 | 5.33 | 5.11 | 4.40 | 3.22 | 4.09 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **46.4** | **71.0** | **79.4** | **78.8** | **80.2** | **66.6** |
| @here/flexpolyline@0.1.0 | 2.99 | 4.13 | 3.69 | 2.97 | 2.39 | 2.72 |
