## Node v24.22.3, HERE Flexible Polyline, precision 5

- Runtime: Node v24.22.3 (V8 13.6.233.17-node.63)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 6%, worst 51%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **7.51M** | **876k** | **73.9k** | **7.71k** | **590** | **369k** |
| @here/flexpolyline@0.1.0 | 478k | 54.3k | 5.25k | 479 | 34.5 | 27.3k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **4.65M** | **726k** | **78.2k** | **8.04k** | **806** | **477k** |
| @here/flexpolyline@0.1.0 | 326k | 41.4k | 3.79k | 301 | 24.9 | 18.9k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **75.1** | **87.6** | **73.9** | **77.1** | **59.0** | **53.9** |
| @here/flexpolyline@0.1.0 | 4.78 | 5.43 | 5.25 | 4.79 | 3.45 | 3.99 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **46.5** | **72.6** | **78.2** | **80.4** | **80.6** | **69.8** |
| @here/flexpolyline@0.1.0 | 3.26 | 4.14 | 3.79 | 3.01 | 2.49 | 2.77 |
