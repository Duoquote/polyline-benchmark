## Node v24.22.3, HERE Flexible Polyline, precision 5

- Runtime: Node v24.22.3 (V8 13.6.233.17-node.63)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/node.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 25%, worst 53%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (flexible) | 61.7 | 66.9 | 68.0 | 67.6 | 40.1 | 43.6 |
| @here/flexpolyline@0.1.0 | 4.31 | 4.77 | 4.75 | 3.63 | 2.60 | 3.36 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (flexible) | 40.6 | 62.8 | 67.4 | 65.1 | 62.7 | 52.4 |
| @here/flexpolyline@0.1.0 | 3.06 | 3.61 | 3.08 | 2.29 | 1.51 | 1.75 |
