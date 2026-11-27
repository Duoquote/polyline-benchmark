## Bundle size

esbuild 0.28.2, Rollup 4.68.8 and webpack 5.113.0, production builds for the browser (the node entry for Node), minified ESM, gzip level 9. Measured 2026-11-27.

Gzipped, esbuild 0.28.2. Each column is one import; "whole entry" is `import * as m`. Minified sizes are in results/size.json.

| Package | decode only | encode only | decode and encode | whole entry |
|---|--:|--:|--:|--:|
| @duoquote/polytini@0.1.8 | 1,063 B | 1,432 B | 1,895 B | 2,278 B |
| @mapbox/polyline@1.2.1 | 956 B | 956 B | 960 B | 949 B |
| @googlemaps/polyline-codec@1.0.28 | 252 B | 340 B | 472 B | 568 B |
| google-polyline@2.0.0 | 459 B | 460 B | 464 B | 551 B |
| @pirxpilot/google-polyline@4.0.1 | 305 B | 295 B | 491 B | 595 B |
| @placemarkio/polyline@2.0.3 | 230 B | 293 B | 424 B | 580 B |
| polyline-encoded@0.0.9 | 1,215 B | 1,215 B | 1,218 B | 1,207 B |
| decode-google-map-polyline@1.0.1 (decodes only) | 744 B |  |  | 739 B |
| @lp-labs/polyline-codec@0.1.0 | 803 B | 702 B | 996 B | 1,223 B |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 1,371 B | 1,408 B | 1,548 B |  |
| @duoquote/polytini/lite@0.1.8 | 295 B | 349 B | 503 B | 583 B |
| @duoquote/polytini@0.1.8 (/web entry) | 1,063 B | 1,222 B | 1,686 B | 2,061 B |
| @duoquote/polytini@0.1.8 (node entry) | 2,561 B | 2,562 B | 2,563 B | 2,682 B |
| @duoquote/polytini@0.1.8 (/wasm, JS glue plus inlined .wasm) | 2,925 B | 3,413 B | 3,880 B | 5,671 B |
| ol@10.11.0 (ol/format/Polyline) |  |  |  | 9,749 B |
| @here/flexpolyline@0.1.0 (HERE Flexible Polyline) | 1,444 B | 1,443 B | 1,449 B | 1,435 B |
| @duoquote/polytini@0.1.8 (/flexible) | 1,121 B | 1,250 B | 1,900 B | 2,107 B |

The same imports with Rollup 4.68.8 and webpack 5.113.0, gzipped. Rollup / webpack in each cell.

| Package | decode only | encode only | decode and encode | whole entry |
|---|--:|--:|--:|--:|
| @duoquote/polytini@0.1.8 | 1,021 B / 1,035 B | 1,433 B / 1,476 B | 1,907 B / 1,939 B | 2,287 B / 2,397 B |
| @mapbox/polyline@1.2.1 | 720 B / 681 B | 720 B / 680 B | 723 B / 685 B | 873 B / 1,087 B |
| @googlemaps/polyline-codec@1.0.28 | 247 B / 245 B | 340 B / 335 B | 481 B / 476 B | 531 B / 653 B |
| google-polyline@2.0.0 | 229 B / 433 B | 319 B / 433 B | 441 B / 438 B | 481 B / 612 B |
| @pirxpilot/google-polyline@4.0.1 | 302 B / 300 B | 298 B / 296 B | 494 B / 491 B | 549 B / 679 B |
| @placemarkio/polyline@2.0.3 | 236 B / 233 B | 297 B / 295 B | 432 B / 430 B | 539 B / 675 B |
| polyline-encoded@0.0.9 | 988 B / 975 B | 988 B / 975 B | 991 B / 978 B | 1,140 B / 1,307 B |
| decode-google-map-polyline@1.0.1 (decodes only) | 496 B / 493 B |  |  | 648 B / 848 B |
| @lp-labs/polyline-codec@0.1.0 | 801 B / 798 B | 700 B / 697 B | 1,017 B / 1,014 B | 1,197 B / 1,315 B |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 1,332 B / 2,317 B | 1,372 B / 2,354 B | 1,495 B / 2,475 B |  |
| @duoquote/polytini/lite@0.1.8 | 298 B / 296 B | 352 B / 349 B | 512 B / 509 B | 551 B / 682 B |
| @duoquote/polytini@0.1.8 (/web entry) | 1,021 B / 1,035 B | 1,163 B / 1,204 B | 1,604 B / 1,650 B | 2,006 B / 2,124 B |
| @duoquote/polytini@0.1.8 (node entry) | 2,376 B / 2,384 B | 2,379 B / 2,384 B | 2,381 B / 2,386 B | 2,595 B / 2,730 B |
| @duoquote/polytini@0.1.8 (/wasm, JS glue plus inlined .wasm) | 2,794 B / 2,832 B | 3,390 B / 3,413 B | 3,875 B / 3,884 B | 5,458 B / 5,580 B |
| ol@10.11.0 (ol/format/Polyline) |  |  |  | 9,039 B / 8,971 B |
| @here/flexpolyline@0.1.0 (HERE Flexible Polyline) | 1,177 B / 730 B | 1,177 B / 647 B | 1,181 B / 1,120 B | 1,328 B / 1,501 B |
| @duoquote/polytini@0.1.8 (/flexible) | 1,054 B / 1,085 B | 1,234 B / 1,231 B | 1,893 B / 1,890 B | 2,028 B / 2,190 B |
