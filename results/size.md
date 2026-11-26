## Bundle size

esbuild 0.28.2, browser conditions (node entry: node), minified ESM, gzip level 9. Measured 2026-11-26.

| Package | Minified | Gzipped |
|---|--:|--:|
| @mapbox/polyline@1.2.1 | 1.8 KB | 948 B |
| @googlemaps/polyline-codec@1.0.28 | 1.0 KB | 568 B |
| google-polyline@2.0.0 | 873 B | 551 B |
| @pirxpilot/google-polyline@4.0.1 | 973 B | 595 B |
| @placemarkio/polyline@2.0.3 | 1016 B | 580 B |
| polyline-encoded@0.0.9 | 3.0 KB | 1.2 KB |
| decode-google-map-polyline@1.0.1 | 1.3 KB | 738 B |
| @lp-labs/polyline-codec@0.1.0 | 2.6 KB | 1.2 KB |
| @duoquote/polytini@0.1.0 (browser entry, every export) | 4.9 KB | 2.3 KB |
| @duoquote/polytini@0.1.0 (web entry, every export) | 4.0 KB | 2.0 KB |
| @duoquote/polytini@0.1.0 (encode and decode only) | 4.3 KB | 2.0 KB |
| @duoquote/polytini@0.1.0 (node entry) | 5.3 KB | 2.6 KB |
| @duoquote/polytini@0.1.0 (wasm, JS glue plus inlined .wasm) | 8.9 KB | 4.3 KB |
| ol@10.11.0 (encodeDeltas/decodeDeltas) | 3.9 KB | 1.5 KB |
| ol@10.11.0 (ol/format/Polyline) | 27.3 KB | 9.5 KB |
| @here/flexpolyline@0.1.0 (HERE Flexible Polyline) | 2.6 KB | 1.4 KB |
| @duoquote/polytini@0.1.0 (flexible) | 4.2 KB | 2.1 KB |
