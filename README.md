# polyline-benchmark

<p align="center">
  <a href="https://github.com/Duoquote/polyline-benchmark/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/Duoquote/polyline-benchmark/ci.yml?branch=main&style=flat&label=CI"></a>
  <a href="docs/methodology.md#whats-in-the-comparison"><img alt="libraries compared" src="https://raw.githubusercontent.com/Duoquote/polyline-benchmark/main/docs/badges/libraries.svg"></a>
  <a href="#results"><img alt="runtimes" src="https://raw.githubusercontent.com/Duoquote/polyline-benchmark/main/docs/badges/runtimes.svg"></a>
  <a href="results"><img alt="last benchmark run" src="https://raw.githubusercontent.com/Duoquote/polyline-benchmark/main/docs/badges/last-run.svg"></a>
  <a href="LICENSE"><img alt="license: MIT" src="https://img.shields.io/github/license/Duoquote/polyline-benchmark?style=flat"></a>
</p>

Speed and memory of the JavaScript libraries that encode and decode Google's [encoded polyline format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm), the strings Google Maps, OSRM, Valhalla and GraphHopper return for route geometry. Every library passes the same correctness test before it's timed, then runs through the same harness on Bun, Node 22 to 26, Deno and Chrome. I started it in 2021 with five decoders; [polytini](https://github.com/Duoquote/polytini) is the codec I wrote while rebuilding it in 2026, so read its rows knowing that.

<!-- charts:top -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/overview-dark.svg">
  <img alt="Heatmap of polytini against the fastest other library: a row per runtime (Bun, Node 22 to 26, Deno, Chrome) and a column per case (decode and encode at 10 to 100,000 points and on the real-world lines). Each cell gives the ratio and names the fastest other library; hatched cells are within the noise." src="docs/charts/overview-light.svg">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/grouped-decode-dark.svg">
  <img alt="Decode speed relative to @mapbox/polyline: a panel per runtime, a group of bars per line length, one bar per library, on a log scale." src="docs/charts/grouped-decode-light.svg">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/grouped-encode-dark.svg">
  <img alt="Encode speed relative to @mapbox/polyline: a panel per runtime, a group of bars per line length, one bar per library, on a log scale." src="docs/charts/grouped-encode-light.svg">
</picture>
<!-- /charts:top -->

## Best at what

Across all 8 runtimes (geometric mean over runtimes and sizes):

<!-- best -->
| Situation | Best | Runner-up | Margin |
|---|---|---|--:|
| Decode short lines (10 and 100 points) | @googlemaps/polyline-codec | @mapbox/polyline | 1.05x faster, within the noise |
| Decode long lines (10,000 and 100,000 points) | **@duoquote/polytini** | @googlemaps/polyline-codec | 1.14x faster, within the noise |
| Decode real-world lines (median 82 points) | **@duoquote/polytini** | @googlemaps/polyline-codec | 1.22x faster, within the noise |
| Encode, any length | **@duoquote/polytini** | google-polyline | 2.05x faster |
| Decode to typed arrays | **@duoquote/polytini (wasm, Float64Array)** | @duoquote/polytini (Float64Array) | 1.08x faster, within the noise |
| Encode from typed arrays | **@duoquote/polytini (wasm, Float64Array)** | @duoquote/polytini (Float64Array) | 1.05x faster, within the noise |
| Decode 1000 lines in one call | **@duoquote/polytini (wasm decodeMany/encodeMany)** | @duoquote/polytini (wasm, Float64Array) | 1.61x faster |
| Least memory per decode (10,000 points, [lat, lng] arrays) | **@duoquote/polytini (765.4 KB)** | @googlemaps/polyline-codec (766.2 KB) | 0.1% less |
| Smallest bundle (gzipped) | google-polyline (551 B) | @googlemaps/polyline-codec (568 B) | 17 B smaller |
| Strict validation (throws on bad input) | **@duoquote/polytini** | @lp-labs/polyline-codec | 15x faster |
| HERE Flexible Polyline (encode and decode) | **@duoquote/polytini (flexible)** | @here/flexpolyline | 24x faster |
<!-- /best -->

## Results

Calls per second, higher is better, fastest first, the fastest in each column in bold. A call is one `encode()` or `decode()` of one line. Between rounds a cell moved by a median of <!-- spread -->29% to 35%<!-- /spread --> depending on the runtime, so a gap smaller than that between the top libraries isn't a reliable ranking; the heatmap hatches those cells and the best-at-what table marks them. Relative numbers (`@mapbox/polyline` = 1.0x), typed arrays, batch calls, memory and sizes are in [docs/results.md](docs/results.md), and every chart is in [docs/charts.md](docs/charts.md).

<details>
<summary>Bun</summary>

<!-- results:bun -->
Bun v1.4.3, 2026-11-26. `@duoquote/polytini` resolved to `src/bun.js`. Between rounds a cell moved by a median of 33%, 224% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0 (web entry)** | 8.10M | **949k** | **99.9k** | 9.47k | 815 | 425k |
| **@duoquote/polytini@0.1.0** | 6.60M | 716k | 84.3k | **10.9k** | **937** | **459k** |
| @googlemaps/polyline-codec@1.0.28 | **9.55M** | 919k | 93.0k | 9.24k | 640 | 286k |
| **@duoquote/polytini@0.1.0 (wasm)** | 7.39M | 766k | 75.4k | 7.54k | 713 | 348k |
| google-polyline@2.0.0 | 8.25M | 825k | 72.6k | 7.77k | 540 | 271k |
| @placemarkio/polyline@2.0.3 | 7.38M | 610k | 61.9k | 7.52k | 646 | 267k |
| @mapbox/polyline@1.2.1 | 7.40M | 757k | 66.1k | 6.07k | 628 | 256k |
| @pirxpilot/google-polyline@4.0.1 | 2.36M | 382k | 36.0k | 2.97k | 233 | 124k |
| polyline-encoded@0.0.9 | 1.06M | 107k | 11.7k | 988 | 92.6 | 64.7k |
| @lp-labs/polyline-codec@0.1.0 | 436k | 41.5k | 4.17k | 387 | 22.7 | 21.1k |
| decode-google-map-polyline@1.0.1 | 293k | 31.3k | 3.43k | 374 | 30.5 | 22.8k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **8.47M** | **1.75M** | **173k** | **14.8k** | **1.34k** | **470k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.25M | 1.46M | 152k | 10.6k | 995 | 283k |
| **@duoquote/polytini@0.1.0 (web entry)** | 4.61M | 697k | 71.8k | 6.16k | 479 | 266k |
| google-polyline@2.0.0 | 5.30M | 720k | 64.2k | 4.75k | 356 | 211k |
| @pirxpilot/google-polyline@4.0.1 | 4.20M | 628k | 65.7k | 3.74k | 372 | 195k |
| @placemarkio/polyline@2.0.3 | 2.83M | 309k | 28.3k | 2.79k | 216 | 139k |
| @mapbox/polyline@1.2.1 | 2.68M | 236k | 26.0k | 2.40k | 180 | 129k |
| @googlemaps/polyline-codec@1.0.28 | 1.35M | 171k | 16.0k | 1.55k | 137 | 75.2k |
| @lp-labs/polyline-codec@0.1.0 | 402k | 31.3k | 3.62k | 316 | 27.2 | 18.0k |
| polyline-encoded@0.0.9 | 270k | 29.8k | 3.07k | 257 | 24.0 | 18.5k |
<!-- /results:bun -->

</details>

<details>
<summary>Node 22</summary>

<!-- results:node-22 -->
Node v22.23.5, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds a cell moved by a median of 35%, 89% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 4.91M | **822k** | **82.1k** | **8.22k** | **235** | **328k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 6.32M | 767k | 81.0k | 7.88k | 154 | 282k |
| @mapbox/polyline@1.2.1 | **7.68M** | 742k | 59.1k | 6.10k | 234 | 241k |
| @placemarkio/polyline@2.0.3 | 6.75M | 681k | 66.1k | 6.20k | 232 | 256k |
| **@duoquote/polytini@0.1.0 (web entry)** | 5.78M | 776k | 71.9k | 7.31k | 151 | 255k |
| @googlemaps/polyline-codec@1.0.28 | 5.20M | 702k | 66.8k | 6.93k | 133 | 277k |
| google-polyline@2.0.0 | 6.11M | 482k | 47.1k | 5.77k | 186 | 249k |
| @pirxpilot/google-polyline@4.0.1 | 5.68M | 389k | 47.5k | 3.94k | 186 | 227k |
| polyline-encoded@0.0.9 | 1.49M | 145k | 13.0k | 1.20k | 42.9 | 77.5k |
| @lp-labs/polyline-codec@0.1.0 | 429k | 55.5k | 5.14k | 401 | 26.1 | 24.9k |
| decode-google-map-polyline@1.0.1 | 82.2k | 16.2k | 1.74k | 168 | 10.1 | 9.96k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **4.59M** | **972k** | 85.2k | **11.2k** | **857** | **423k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 3.30M | 785k | **87.5k** | 6.99k | 623 | 284k |
| **@duoquote/polytini@0.1.0 (web entry)** | 2.92M | 513k | 57.1k | 5.95k | 328 | 297k |
| google-polyline@2.0.0 | 4.42M | 445k | 43.4k | 4.07k | 116 | 174k |
| @pirxpilot/google-polyline@4.0.1 | 3.83M | 495k | 45.0k | 3.35k | 102 | 166k |
| @placemarkio/polyline@2.0.3 | 2.80M | 446k | 43.1k | 3.31k | 106 | 134k |
| @mapbox/polyline@1.2.1 | 2.82M | 419k | 38.2k | 3.20k | 105 | 134k |
| @googlemaps/polyline-codec@1.0.28 | 1.12M | 190k | 13.9k | 961 | 75.9 | 69.7k |
| @lp-labs/polyline-codec@0.1.0 | 511k | 68.7k | 5.70k | 468 | 34.4 | 30.2k |
| polyline-encoded@0.0.9 | 124k | 14.9k | 1.29k | 120 | 12.5 | 8.69k |
<!-- /results:node-22 -->

</details>

<details>
<summary>Node 23</summary>

<!-- results:node-23 -->
Node v23.11.1, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds a cell moved by a median of 29%, 67% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @placemarkio/polyline@2.0.3 | **7.89M** | 683k | 67.2k | 7.06k | **263** | 286k |
| @mapbox/polyline@1.2.1 | 6.71M | 791k | 71.7k | 7.47k | 210 | 294k |
| **@duoquote/polytini@0.1.0** | 7.00M | 678k | 67.0k | **7.60k** | 194 | **329k** |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.00M | **824k** | **73.9k** | 7.47k | 153 | 245k |
| @googlemaps/polyline-codec@1.0.28 | 6.18M | 820k | 65.3k | 7.08k | 160 | 307k |
| google-polyline@2.0.0 | 6.48M | 701k | 51.3k | 6.29k | 243 | 286k |
| **@duoquote/polytini@0.1.0 (wasm)** | 6.40M | 794k | 63.4k | 6.07k | 160 | 295k |
| @pirxpilot/google-polyline@4.0.1 | 5.47M | 520k | 47.7k | 5.63k | 195 | 212k |
| polyline-encoded@0.0.9 | 1.69M | 188k | 15.3k | 1.47k | 48.2 | 81.9k |
| @lp-labs/polyline-codec@0.1.0 | 443k | 59.1k | 5.58k | 451 | 27.2 | 28.0k |
| decode-google-map-polyline@1.0.1 | 106k | 19.5k | 2.05k | 178 | 12.6 | 12.2k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **4.15M** | 1.07M | 117k | **11.1k** | **964** | **418k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 3.34M | **1.23M** | **138k** | 9.63k | 856 | 316k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.40M | 537k | 63.7k | 6.02k | 272 | 295k |
| google-polyline@2.0.0 | 4.11M | 563k | 52.5k | 4.39k | 125 | 186k |
| @pirxpilot/google-polyline@4.0.1 | 3.74M | 535k | 55.0k | 3.36k | 120 | 177k |
| @placemarkio/polyline@2.0.3 | 3.03M | 483k | 46.7k | 4.09k | 112 | 160k |
| @mapbox/polyline@1.2.1 | 2.82M | 467k | 42.4k | 3.47k | 91.9 | 145k |
| @googlemaps/polyline-codec@1.0.28 | 1.21M | 162k | 15.5k | 1.02k | 78.9 | 64.5k |
| @lp-labs/polyline-codec@0.1.0 | 605k | 82.2k | 6.61k | 539 | 31.6 | 32.4k |
| polyline-encoded@0.0.9 | 168k | 16.4k | 1.66k | 133 | 14.7 | 9.59k |
<!-- /results:node-23 -->

</details>

<details>
<summary>Node 24</summary>

<!-- results:node-24 -->
Node v24.22.3, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds a cell moved by a median of 32%, 70% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 6.50M | 760k | 74.4k | 7.21k | **581** | **410k** |
| @googlemaps/polyline-codec@1.0.28 | 6.66M | **872k** | 71.8k | 6.72k | 460 | 326k |
| **@duoquote/polytini@0.1.0 (web entry)** | 5.44M | 865k | **74.6k** | **7.62k** | 496 | 302k |
| **@duoquote/polytini@0.1.0 (wasm)** | 5.28M | 694k | 70.3k | 6.65k | 519 | 340k |
| @placemarkio/polyline@2.0.3 | **7.50M** | 681k | 64.8k | 7.03k | 403 | 306k |
| @mapbox/polyline@1.2.1 | 7.00M | 608k | 60.3k | 6.67k | 368 | 254k |
| google-polyline@2.0.0 | 5.09M | 595k | 56.7k | 5.84k | 332 | 254k |
| @pirxpilot/google-polyline@4.0.1 | 5.78M | 627k | 56.5k | 5.13k | 312 | 254k |
| polyline-encoded@0.0.9 | 1.72M | 161k | 14.5k | 1.36k | 99.8 | 81.5k |
| @lp-labs/polyline-codec@0.1.0 | 531k | 66.5k | 5.68k | 489 | 37.5 | 27.1k |
| decode-google-map-polyline@1.0.1 | 131k | 25.1k | 2.36k | 260 | 17.5 | 15.7k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **5.74M** | 898k | 117k | **10.8k** | **918** | **346k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.08M | **1.35M** | **144k** | 7.96k | 706 | 264k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.89M | 579k | 63.2k | 6.43k | 448 | 301k |
| @pirxpilot/google-polyline@4.0.1 | 4.44M | 483k | 55.8k | 4.42k | 438 | 182k |
| google-polyline@2.0.0 | 4.41M | 522k | 54.1k | 4.12k | 368 | 172k |
| @placemarkio/polyline@2.0.3 | 3.45M | 477k | 49.7k | 4.14k | 329 | 172k |
| @mapbox/polyline@1.2.1 | 2.90M | 470k | 41.0k | 3.39k | 295 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 1.67M | 210k | 17.8k | 1.02k | 82.7 | 73.5k |
| @lp-labs/polyline-codec@0.1.0 | 673k | 83.3k | 7.05k | 605 | 41.7 | 35.3k |
| polyline-encoded@0.0.9 | 230k | 22.9k | 2.32k | 218 | 19.9 | 13.1k |
<!-- /results:node-24 -->

</details>

<details>
<summary>Node 25</summary>

<!-- results:node-25 -->
Node v25.2.1, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds a cell moved by a median of 29%, 69% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 6.76M | 852k | **86.9k** | 8.35k | **542** | **399k** |
| @googlemaps/polyline-codec@1.0.28 | 7.25M | **964k** | 83.0k | **8.49k** | 482 | 300k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.05M | 889k | 86.6k | 7.82k | 450 | 307k |
| **@duoquote/polytini@0.1.0 (wasm)** | 7.04M | 838k | 74.1k | 7.25k | 431 | 321k |
| @mapbox/polyline@1.2.1 | **7.58M** | 782k | 64.6k | 5.82k | 354 | 280k |
| google-polyline@2.0.0 | 6.76M | 676k | 55.6k | 5.06k | 428 | 292k |
| @placemarkio/polyline@2.0.3 | 7.34M | 597k | 55.6k | 5.30k | 351 | 277k |
| @pirxpilot/google-polyline@4.0.1 | 4.55M | 517k | 46.7k | 5.42k | 321 | 243k |
| polyline-encoded@0.0.9 | 1.45M | 160k | 15.5k | 1.37k | 101 | 84.9k |
| @lp-labs/polyline-codec@0.1.0 | 540k | 62.1k | 5.66k | 536 | 32.7 | 28.5k |
| decode-google-map-polyline@1.0.1 | 133k | 22.8k | 2.46k | 238 | 17.4 | 16.8k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **5.87M** | 1.13M | 118k | **11.0k** | **906** | **419k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 3.98M | **1.33M** | **141k** | 8.58k | 847 | 298k |
| **@duoquote/polytini@0.1.0 (web entry)** | 4.17M | 581k | 68.2k | 6.52k | 559 | 353k |
| @pirxpilot/google-polyline@4.0.1 | 4.73M | 565k | 50.7k | 4.82k | 429 | 202k |
| google-polyline@2.0.0 | 4.61M | 611k | 58.2k | 4.56k | 312 | 188k |
| @placemarkio/polyline@2.0.3 | 3.58M | 517k | 49.5k | 3.98k | 325 | 174k |
| @mapbox/polyline@1.2.1 | 3.13M | 463k | 42.9k | 3.67k | 320 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 1.55M | 137k | 16.5k | 1.24k | 111 | 71.1k |
| @lp-labs/polyline-codec@0.1.0 | 665k | 76.6k | 6.62k | 559 | 37.3 | 34.0k |
| polyline-encoded@0.0.9 | 218k | 22.6k | 2.14k | 203 | 18.4 | 13.9k |
<!-- /results:node-25 -->

</details>

<details>
<summary>Node 26</summary>

<!-- results:node-26 -->
Node v26.13.1, 2026-11-26. `@duoquote/polytini` resolved to `src/node.js`. Between rounds a cell moved by a median of 34%, 87% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 6.99M | **887k** | 80.5k | **8.33k** | **561** | **413k** |
| @googlemaps/polyline-codec@1.0.28 | **7.39M** | 851k | **89.6k** | 8.31k | 506 | 307k |
| **@duoquote/polytini@0.1.0 (wasm)** | 6.27M | 859k | 88.7k | 5.95k | 474 | 339k |
| @mapbox/polyline@1.2.1 | 7.06M | 615k | 64.3k | 6.82k | 478 | 308k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.00M | 791k | 66.5k | 5.87k | 414 | 295k |
| @placemarkio/polyline@2.0.3 | 7.22M | 719k | 60.6k | 6.33k | 446 | 284k |
| google-polyline@2.0.0 | 6.93M | 626k | 49.3k | 6.30k | 426 | 265k |
| @pirxpilot/google-polyline@4.0.1 | 5.41M | 520k | 43.3k | 5.18k | 410 | 242k |
| polyline-encoded@0.0.9 | 1.74M | 144k | 15.5k | 1.86k | 83.0 | 94.4k |
| @lp-labs/polyline-codec@0.1.0 | 541k | 49.4k | 4.23k | 491 | 28.6 | 26.3k |
| decode-google-map-polyline@1.0.1 | 162k | 29.0k | 3.23k | 313 | 15.5 | 17.0k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | **6.24M** | 1.18M | 122k | **10.8k** | 597 | **373k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.05M | **1.36M** | **145k** | 9.49k | **817** | 299k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.72M | 550k | 66.1k | 6.80k | 601 | 317k |
| google-polyline@2.0.0 | 4.25M | 600k | 55.2k | 4.10k | 326 | 169k |
| @pirxpilot/google-polyline@4.0.1 | 4.58M | 435k | 44.4k | 4.50k | 377 | 180k |
| @placemarkio/polyline@2.0.3 | 3.76M | 406k | 48.0k | 3.89k | 274 | 161k |
| @mapbox/polyline@1.2.1 | 3.30M | 458k | 40.5k | 3.82k | 298 | 152k |
| @googlemaps/polyline-codec@1.0.28 | 1.73M | 225k | 16.8k | 1.46k | 118 | 69.1k |
| @lp-labs/polyline-codec@0.1.0 | 688k | 76.3k | 6.45k | 435 | 43.9 | 33.5k |
| polyline-encoded@0.0.9 | 241k | 25.7k | 2.66k | 239 | 22.8 | 16.2k |
<!-- /results:node-26 -->

</details>

<details>
<summary>Deno</summary>

<!-- results:deno -->
Deno v2.5.4, 2026-11-26. `@duoquote/polytini` resolved to `src/deno.js`. Between rounds a cell moved by a median of 35%, 66% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 7.74M | 789k | **94.1k** | **9.35k** | **684** | **395k** |
| **@duoquote/polytini@0.1.0 (wasm)** | 7.53M | **890k** | 84.7k | 7.48k | 379 | 311k |
| @googlemaps/polyline-codec@1.0.28 | 6.36M | 871k | 81.1k | 6.99k | 475 | 322k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.05M | 804k | 75.6k | 6.90k | 378 | 317k |
| @mapbox/polyline@1.2.1 | **8.36M** | 707k | 67.1k | 5.30k | 487 | 294k |
| @placemarkio/polyline@2.0.3 | 7.18M | 594k | 60.4k | 5.88k | 365 | 291k |
| google-polyline@2.0.0 | 5.50M | 597k | 49.7k | 5.77k | 354 | 245k |
| @pirxpilot/google-polyline@4.0.1 | 4.86M | 381k | 44.5k | 5.12k | 350 | 226k |
| polyline-encoded@0.0.9 | 1.90M | 188k | 17.6k | 1.79k | 134 | 89.6k |
| @lp-labs/polyline-codec@0.1.0 | 504k | 63.7k | 4.88k | 444 | 32.4 | 26.6k |
| decode-google-map-polyline@1.0.1 | 128k | 23.4k | 2.16k | 215 | 15.6 | 15.3k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 4.19M | 542k | 107k | **9.60k** | **715** | 283k |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.14M | **650k** | **107k** | 6.73k | 670 | 244k |
| **@duoquote/polytini@0.1.0 (web entry)** | 4.19M | 597k | 62.3k | 6.33k | 561 | **374k** |
| google-polyline@2.0.0 | **4.47M** | 523k | 58.1k | 3.95k | 416 | 184k |
| @pirxpilot/google-polyline@4.0.1 | 3.58M | 504k | 47.5k | 4.14k | 382 | 199k |
| @placemarkio/polyline@2.0.3 | 3.53M | 515k | 44.6k | 3.63k | 294 | 148k |
| @mapbox/polyline@1.2.1 | 3.27M | 442k | 40.4k | 3.36k | 268 | 155k |
| @googlemaps/polyline-codec@1.0.28 | 1.56M | 152k | 15.6k | 977 | 66.8 | 73.4k |
| @lp-labs/polyline-codec@0.1.0 | 641k | 70.9k | 5.07k | 436 | 34.5 | 35.5k |
| polyline-encoded@0.0.9 | 189k | 22.9k | 2.22k | 197 | 18.0 | 12.6k |
<!-- /results:deno -->

</details>

<details>
<summary>Chrome</summary>

<!-- results:browser -->
Chrome 157.0.8103.80 (headless), 2026-11-26. `@duoquote/polytini` resolved to `src/browser.js`. Between rounds a cell moved by a median of 33%, 72% at worst.

| decode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 8.33M | 1.05M | **111k** | 9.52k | **847** | **463k** |
| @placemarkio/polyline@2.0.3 | **10.3M** | 1.08M | 93.0k | 8.70k | 644 | 402k |
| **@duoquote/polytini@0.1.0 (web entry)** | 7.69M | **1.11M** | **111k** | **9.52k** | 630 | 406k |
| google-polyline@2.0.0 | 8.70M | 1.03M | 81.6k | 7.55k | 714 | 437k |
| @mapbox/polyline@1.2.1 | 9.09M | 952k | 87.0k | 7.27k | 637 | 421k |
| **@duoquote/polytini@0.1.0** | 8.89M | 1.03M | 85.1k | 7.27k | 608 | 419k |
| **@duoquote/polytini@0.1.0 (wasm)** | 8.51M | 808k | 78.4k | 6.78k | 743 | 458k |
| @pirxpilot/google-polyline@4.0.1 | 6.15M | 667k | 47.6k | 6.15k | 434 | 324k |
| google.maps.geometry.encoding | 3.45M | 455k | 48.8k | 4.12k | 152 | 270k |
| polyline-encoded@0.0.9 | 1.87M | 209k | 18.8k | 1.66k | 90.4 | 104k |
| @lp-labs/polyline-codec@0.1.0 | 766k | 80.3k | 6.35k | 544 | 48.8 | 38.8k |
| decode-google-map-polyline@1.0.1 | 222k | 36.9k | 3.30k | 353 | 25.4 | 23.2k |

| encode, calls/s | 10 pts | 100 pts | 1,000 pts | 10,000 pts | 100,000 pts | real-world line |
|---|--:|--:|--:|--:|--:|--:|
| **@duoquote/polytini@0.1.0** | 4.47M | **678k** | **133k** | **11.8k** | **930** | 407k |
| **@duoquote/polytini@0.1.0 (wasm)** | 4.35M | 656k | 127k | 9.30k | 826 | 315k |
| **@duoquote/polytini@0.1.0 (web entry)** | 3.88M | 661k | 76.9k | 7.55k | 778 | **442k** |
| google-polyline@2.0.0 | **5.06M** | 537k | 58.8k | 4.88k | 472 | 215k |
| @pirxpilot/google-polyline@4.0.1 | 4.88M | 563k | 62.5k | 4.76k | 391 | 219k |
| @placemarkio/polyline@2.0.3 | 3.39M | 548k | 47.3k | 4.12k | 380 | 159k |
| @mapbox/polyline@1.2.1 | 3.43M | 447k | 44.0k | 3.15k | 295 | 157k |
| @googlemaps/polyline-codec@1.0.28 | 2.55M | 336k | 28.0k | 2.55k | 217 | 126k |
| google.maps.geometry.encoding | 2.33M | 323k | 25.8k | 2.13k | 142 | 89.4k |
| @lp-labs/polyline-codec@0.1.0 | 843k | 101k | 8.89k | 727 | 55.9 | 40.7k |
| polyline-encoded@0.0.9 | 343k | 31.2k | 3.34k | 304 | 29.4 | 18.7k |
<!-- /results:browser -->

</details>

### Memory and size

<!-- charts:more -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/memory-decode-dark.svg">
  <img alt="Memory allocated per decode call relative to @mapbox/polyline at 100, 10,000 and 100,000 points, on Node 24 and Deno" src="docs/charts/memory-decode-light.svg">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/memory-encode-dark.svg">
  <img alt="Memory allocated per encode call relative to @mapbox/polyline at 100, 10,000 and 100,000 points, on Node 24 and Deno" src="docs/charts/memory-encode-light.svg">
</picture>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/charts/size-dark.svg">
  <img alt="Gzipped bundle size of every library, smallest first" src="docs/charts/size-light.svg">
</picture>
<!-- /charts:more -->

## Running it

```sh
npm ci
npm test              # correctness, every library
npm run bench:all     # everything, about 10 minutes
npm run bench:quick   # about a minute, for checking changes
```

How it's measured, the library list and what's left out: [docs/methodology.md](docs/methodology.md).

## License

MIT, see [LICENSE](LICENSE).
