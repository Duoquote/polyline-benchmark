## Deno v2.5.4, HERE Flexible Polyline, precision 5

- Runtime: Deno v2.5.4 (V8 14.0.365.5-rusty)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/deno.js`

Calls per second: whole encode() or decode() calls, one line each, so higher is better. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Rows are fastest first (geometric mean over the columns, relative to each column's fastest), and the fastest in each column is in bold. The relative tables divide by @mapbox/polyline. The typed-array tables use flat arrays instead of [lat, lng] arrays, and the batch tables decode all 1000 real-world lines in one call, so they aren't comparable with the main tables. Million points per second is at the end.

Spread between the fastest and slowest round of a cell: median 29%, worst 52%.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **6.01M** | **622k** | **57.9k** | **5.52k** | **378** | **292k** |
| @here/flexpolyline@0.1.0 | 385k | 39.6k | 4.54k | 375 | 21.5 | 21.1k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **3.97M** | **578k** | **69.3k** | **6.04k** | **659** | **305k** |
| @here/flexpolyline@0.1.0 | 236k | 33.0k | 3.12k | 248 | 18.5 | 15.3k |

| decode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **60.1** | **62.2** | **57.9** | **55.2** | **37.8** | **42.7** |
| @here/flexpolyline@0.1.0 | 3.85 | 3.96 | 4.54 | 3.75 | 2.15 | 3.09 |

| encode, million points/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (flexible)** | **39.7** | **57.8** | **69.3** | **60.4** | **65.9** | **44.6** |
| @here/flexpolyline@0.1.0 | 2.36 | 3.30 | 3.12 | 2.48 | 1.85 | 2.24 |
