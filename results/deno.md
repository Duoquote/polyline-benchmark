## Deno v2.5.4, precision 5

- Runtime: Deno v2.5.4 (V8 14.0.365.5-rusty)
- CPU: AMD Ryzen 7 5800X 8-Core Processor, 16 threads, 64 GiB RAM
- OS: Windows_NT 10.0.26300 x64
- Date: 2026-11-26

Million points per second. Each cell is the median of 3 rounds, and each round is the median sample of a 1000 ms tinybench run in a fresh process. Higher is better. Rows are sorted by the 10,000 point column.

Spread between the fastest and slowest round of a cell: median 19%, worst 55%.

| decode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 81.0 | 116 | 99.9 | 86.2 | 68.9 | 51.1 |
| @placemarkio/polyline@2.0.3 | 99.3 | 97.6 | 78.8 | 81.4 | 57.7 | 49.1 |
| @mapbox/polyline@1.2.1 | 95.2 | 97.1 | 77.7 | 78.3 | 61.1 | 47.8 |
| google-polyline@2.0.0 | 85.3 | 90.5 | 61.7 | 65.6 | 48.5 | 40.9 |
| @pirxpilot/google-polyline@4.0.1 | 59.7 | 67.7 | 52.8 | 58.1 | 46.3 | 29.2 |
| polyline-encoded@0.0.9 | 22.1 | 24.2 | 19.8 | 16.3 | 15.1 | 17.0 |
| @lp-labs/polyline-codec@0.1.0 | 6.30 | 7.01 | 6.18 | 4.23 | 3.28 | 3.78 |
| decode-google-map-polyline@1.0.1 | 1.90 | 2.99 | 2.95 | 2.55 | 2.02 | 2.53 |

| encode | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world |
|---|--:|--:|--:|--:|--:|--:|
| @placemarkio/polyline@2.0.3 | 38.4 | 52.4 | 53.1 | 45.7 | 37.7 | 26.9 |
| google-polyline@2.0.0 | 44.5 | 59.2 | 52.8 | 43.4 | 40.8 | 30.2 |
| @pirxpilot/google-polyline@4.0.1 | 32.7 | 40.8 | 42.8 | 36.4 | 47.3 | 32.6 |
| @mapbox/polyline@1.2.1 | 32.5 | 49.1 | 45.3 | 34.3 | 31.5 | 24.3 |
| @googlemaps/polyline-codec@1.0.28 | 14.4 | 19.6 | 17.5 | 11.6 | 10.2 | 11.7 |
| @lp-labs/polyline-codec@0.1.0 | 5.61 | 7.02 | 7.16 | 6.55 | 4.69 | 5.81 |
| polyline-encoded@0.0.9 | 2.30 | 2.45 | 2.42 | 2.42 | 2.08 | 2.09 |
