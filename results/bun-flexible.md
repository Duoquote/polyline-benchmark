## Bun v1.4.3, HERE Flexible Polyline, precision 5

- Runtime: Bun v1.4.3 (JavaScriptCore)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-27
- `@duoquote/polytini` resolved to `src/bun.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 10%, worst 44%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **7.97M** | **889k** | **87.2k** | **8.49k** | **804** | **357k** |
| @here/flexpolyline@0.1.0 | 184k | 25.4k | 2.27k | 165 | 12.3 | 10.9k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **4.86M** | **900k** | **97.3k** | **9.68k** | **873** | **383k** |
| @here/flexpolyline@0.1.0 | 141k | 21.0k | 1.80k | 165 | 13.4 | 8.27k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **79.7** | **88.9** | **87.2** | **84.9** | **80.4** | **52.3** |
| @here/flexpolyline@0.1.0 | 1.84 | 2.54 | 2.27 | 1.65 | 1.23 | 1.59 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.4 (flexible)** | **48.6** | **90.0** | **97.3** | **96.8** | **87.3** | **56.0** |
| @here/flexpolyline@0.1.0 | 1.41 | 2.10 | 1.80 | 1.65 | 1.34 | 1.21 |
