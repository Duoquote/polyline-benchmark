## Bun v1.4.3, HERE Flexible Polyline, precision 5

- Runtime: Bun v1.4.3 (JavaScriptCore)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/bun.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 24%, worst 64%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (flexible) | 68.8 | 70.9 | 70.9 | 73.1 | 54.6 | 37.5 |
| @here/flexpolyline@0.1.0 | 1.65 | 2.13 | 2.06 | 1.45 | 0.94 | 0.95 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (flexible) | 39.7 | 64.4 | 69.0 | 67.1 | 49.4 | 39.6 |
| @here/flexpolyline@0.1.0 | 0.83 | 1.30 | 1.05 | 0.94 | 0.86 | 0.72 |
