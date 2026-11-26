## Bun v1.4.3, HERE Flexible Polyline, precision 5

- Runtime: Bun v1.4.3 (JavaScriptCore)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/bun.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 31%, worst 52%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **6.46M** | **621k** | **65.2k** | **6.36k** | **545** | **249k** |
| @here/flexpolyline@0.1.0 | 146k | 19.9k | 1.80k | 146 | 9.95 | 7.76k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **3.72M** | **729k** | **64.8k** | **7.72k** | **544** | **252k** |
| @here/flexpolyline@0.1.0 | 109k | 17.8k | 1.27k | 135 | 11.0 | 6.10k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **64.6** | **62.1** | **65.2** | **63.6** | **54.5** | **36.4** |
| @here/flexpolyline@0.1.0 | 1.46 | 1.99 | 1.80 | 1.46 | 0.99 | 1.14 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **37.2** | **72.9** | **64.8** | **77.2** | **54.4** | **36.8** |
| @here/flexpolyline@0.1.0 | 1.09 | 1.78 | 1.27 | 1.35 | 1.10 | 0.89 |
