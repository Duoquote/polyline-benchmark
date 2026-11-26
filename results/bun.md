## Bun v1.4.3, precision 5

- Runtime: Bun v1.4.3 (JavaScriptCore)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26

Million points per second. Each cell is the median of 3 rounds, and each round is the median sample of a 1000 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column.

Spread between the fastest and slowest round of a cell: median 16%, worst 83%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 111 | 123 | 122 | 112 | 105 | 63.1 |
| @placemarkio/polyline@2.0.3 | 107 | 100 | 94.7 | 100 | 91.4 | 52.2 |
| @mapbox/polyline@1.2.1 | 95.7 | 95.3 | 86.9 | 82.6 | 63.1 | 47.2 |
| google-polyline@2.0.0 | 100 | 93.9 | 82.5 | 67.5 | 64.4 | 45.6 |
| @pirxpilot/google-polyline@4.0.1 | 38.0 | 44.3 | 43.1 | 41.0 | 37.2 | 27.6 |
| polyline-encoded@0.0.9 | 28.9 | 27.5 | 31.8 | 33.2 | 29.0 | 21.8 |
| @lp-labs/polyline-codec@0.1.0 | 4.94 | 4.82 | 4.85 | 4.40 | 2.89 | 3.49 |
| decode-google-map-polyline@1.0.1 | 3.96 | 4.23 | 4.43 | 4.40 | 4.12 | 4.05 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| google-polyline@2.0.0 | 65.5 | 88.6 | 78.4 | 61.4 | 49.9 | 36.6 |
| @pirxpilot/google-polyline@4.0.1 | 79.4 | 72.1 | 69.2 | 39.0 | 44.3 | 31.8 |
| @placemarkio/polyline@2.0.3 | 44.2 | 47.1 | 46.2 | 37.5 | 33.3 | 26.5 |
| @mapbox/polyline@1.2.1 | 35.5 | 37.4 | 36.4 | 30.6 | 22.0 | 20.7 |
| @googlemaps/polyline-codec@1.0.28 | 15.7 | 20.5 | 19.3 | 15.8 | 13.9 | 11.2 |
| @lp-labs/polyline-codec@0.1.0 | 4.93 | 5.09 | 5.06 | 4.35 | 3.84 | 3.65 |
| polyline-encoded@0.0.9 | 3.56 | 3.56 | 3.57 | 3.47 | 3.34 | 3.19 |
