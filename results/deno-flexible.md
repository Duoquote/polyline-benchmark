## Deno v2.5.4, HERE Flexible Polyline, precision 5

- Runtime: Deno v2.5.4 (V8 14.0.365.5-rusty)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26
- `@duoquote/polytini` resolved to `src/deno.js`

Million points per second. Each cell is the median of 5 rounds, and each round is the median sample of a 120 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column. The typed-array tables use flat arrays of numbers instead of [lat, lng] arrays, so they aren't comparable with the main tables.

Spread between the fastest and slowest round of a cell: median 28%, worst 58%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (flexible) | 68.5 | 65.4 | 53.9 | 58.1 | 39.3 | 43.0 |
| @here/flexpolyline@0.1.0 | 4.08 | 4.50 | 4.53 | 3.41 | 2.55 | 3.53 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @duoquote/polytini@0.1.0 (flexible) | 40.9 | 65.3 | 71.6 | 69.8 | 70.1 | 49.8 |
| @here/flexpolyline@0.1.0 | 2.83 | 3.64 | 3.19 | 2.18 | 1.44 | 1.71 |
