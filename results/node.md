## Node v25.2.1, precision 5

- Runtime: Node v25.2.1 (V8 14.1.146.11-node.14)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26

Million points per second. Each cell is the median of 3 rounds, and each round is the median sample of a 1000 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column.

Spread between the fastest and slowest round of a cell: median 10%, worst 34%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 75.5 | 119 | 109 | 98.4 | 77.3 | 48.7 |
| @mapbox/polyline@1.2.1 | 97.0 | 94.1 | 78.2 | 79.5 | 52.5 | 49.3 |
| @placemarkio/polyline@2.0.3 | 98.1 | 94.5 | 77.5 | 75.2 | 52.9 | 47.8 |
| google-polyline@2.0.0 | 82.1 | 85.1 | 71.3 | 66.6 | 53.9 | 46.3 |
| @pirxpilot/google-polyline@4.0.1 | 61.9 | 67.8 | 54.3 | 52.4 | 44.8 | 38.5 |
| polyline-encoded@0.0.9 | 21.6 | 24.1 | 20.0 | 18.5 | 14.4 | 16.8 |
| @lp-labs/polyline-codec@0.1.0 | 6.35 | 7.44 | 6.26 | 4.86 | 3.83 | 4.51 |
| decode-google-map-polyline@1.0.1 | 1.95 | 3.05 | 3.00 | 2.67 | 2.10 | 2.48 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @pirxpilot/google-polyline@4.0.1 | 47.8 | 62.0 | 67.2 | 53.4 | 47.7 | 32.1 |
| google-polyline@2.0.0 | 48.0 | 61.7 | 61.5 | 45.7 | 45.3 | 32.1 |
| @placemarkio/polyline@2.0.3 | 38.9 | 53.9 | 50.7 | 43.9 | 35.9 | 23.5 |
| @mapbox/polyline@1.2.1 | 33.7 | 48.9 | 42.8 | 37.8 | 32.9 | 24.7 |
| @googlemaps/polyline-codec@1.0.28 | 13.7 | 20.8 | 17.1 | 13.2 | 10.7 | 12.5 |
| @lp-labs/polyline-codec@0.1.0 | 6.65 | 8.12 | 7.58 | 6.81 | 5.15 | 5.59 |
| polyline-encoded@0.0.9 | 2.33 | 2.33 | 2.38 | 2.12 | 1.82 | 2.03 |
