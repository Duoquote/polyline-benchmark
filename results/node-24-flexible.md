## Node v24.22.3, HERE Flexible Polyline, precision 5

- Runtime: Node v24.22.3 (V8 13.6.233.17-node.63)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 30%, worst 56%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **6.41M** | **703k** | **44.6k** | **5.58k** | **390** | **312k** |
| @here/flexpolyline@0.1.0 | 391k | 47.4k | 4.45k | 388 | 24.5 | 22.1k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **4.33M** | **647k** | **62.8k** | **6.64k** | **611** | **359k** |
| @here/flexpolyline@0.1.0 | 254k | 36.2k | 3.48k | 231 | 18.1 | 14.3k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **64.1** | **70.3** | **44.6** | **55.8** | **39.0** | **45.6** |
| @here/flexpolyline@0.1.0 | 3.91 | 4.74 | 4.45 | 3.88 | 2.45 | 3.23 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **43.3** | **64.7** | **62.8** | **66.4** | **61.1** | **52.5** |
| @here/flexpolyline@0.1.0 | 2.54 | 3.62 | 3.48 | 2.31 | 1.81 | 2.09 |
