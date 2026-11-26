# polyline-benchmark

Benchmarks for JavaScript libraries that encode and decode Google's [encoded polyline format](https://developers.google.com/maps/documentation/utilities/polylinealgorithm). That's the string you get back for route geometry from Google Maps, OSRM, Valhalla and GraphHopper. Before any library gets timed, it has to pass the same correctness test as the others.

I made the first version in September 2021. It only timed decoding, in five libraries, with `nanobench` and one CSV of 1000 lines. The TODO list asked for encoding and different input sizes, so in November 2026 we rebuilt it:

- encode and decode are both timed
- six inputs, from 10 points up to 100,000, plus the original 1000 lines
- every library is checked against a small reference codec at precision 5 and 6
- it runs on Node, Bun and Deno, with exact versions pinned in `package-lock.json`
- CI runs the correctness test, never the benchmark

## Results

Measured on 26 November 2026 on my machine: AMD Ryzen 7 5800X (8 cores, 16 threads), 64 GB RAM, Windows 11 (build 26300).

Numbers are million points per second, so higher is better. Each cell is the median of 3 rounds, and every round runs in a fresh process. The full tables for each runtime, plus every single round, are in [`results/`](results).

Node v25.2.1:

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

The 10,000 point column on all three runtimes:

| 10,000 pts | Node decode | Bun decode | Deno decode | Node encode | Bun encode | Deno encode |
|---|--:|--:|--:|--:|--:|--:|
| @googlemaps/polyline-codec@1.0.28 | 98.4 | 112 | 86.2 | 13.2 | 15.8 | 11.6 |
| @mapbox/polyline@1.2.1 | 79.5 | 82.6 | 78.3 | 37.8 | 30.6 | 34.3 |
| @placemarkio/polyline@2.0.3 | 75.2 | 100 | 81.4 | 43.9 | 37.5 | 45.7 |
| google-polyline@2.0.0 | 66.6 | 67.5 | 65.6 | 45.7 | 61.4 | 43.4 |
| @pirxpilot/google-polyline@4.0.1 | 52.4 | 41.0 | 58.1 | 53.4 | 39.0 | 36.4 |
| polyline-encoded@0.0.9 | 18.5 | 33.2 | 16.3 | 2.12 | 3.47 | 2.42 |
| @lp-labs/polyline-codec@0.1.0 | 4.86 | 4.40 | 4.23 | 6.81 | 4.35 | 6.55 |
| decode-google-map-polyline@1.0.1 | 2.67 | 4.40 | 2.55 | n/a | n/a | n/a |

Bun is v1.4.3 and Deno is v2.5.4.

Don't read much into small gaps. Between rounds, the same cell moved by a median of 10% on Node, 16% on Bun and 19% on Deno, and the worst one moved 83% on Bun. So I wouldn't trust a difference under about 20%. The big gaps are the same on every runtime, though.

What I take from it:

- For decoding, `@googlemaps/polyline-codec` was the fastest from 100 to 100,000 points on all three runtimes. Its decoder allocates the output array once, at an upper bound, and trims it at the end.
- The same package is one of the slowest encoders, about 4 times slower than the fastest one at 10,000 points. It pushes every character into an array and joins them at the end. I think that's where the time goes, but I haven't profiled it.
- `google-polyline`, `@pirxpilot/google-polyline` and `@placemarkio/polyline` were the fastest encoders. Which one wins changes between runtimes and rounds. `@mapbox/polyline` comes next, 1.3 to 2 times slower than the fastest at 10,000 points.
- `decode-google-map-polyline` is still the slow one. It wraps every point in an object with getter closures, then rounds each value with `toFixed`. In 2021 it was 18.6 times slower than `@googlemaps/polyline-codec` on the 1000 lines. Today on Node it's 19.6 times slower. The 2021 run was on a Ryzen 5 3600, so only the ratio compares, not the times.
- `polyline-encoded` encodes about 25 times slower than the fastest encoder, at 10,000 points on Node. It calls `toFixed` on every value and does part of the delta math on strings. It also throws on `{lat, lng}` objects with a 0 in them, because it reads `point.lat || point[0]`. Leaflet `LatLng`s on the equator or the prime meridian would hit this. Arrays work fine.
- `@lp-labs/polyline-codec` decodes about 20 times slower than the fastest decoder, at 10,000 points on Node. It does the delta math in `BigInt` and validates every character and point. In exchange, it's the only one here that throws on a truncated string. The others return a wrong last point, drop it, or give you `null` (see `npm run behavior`).
- `@placemarkio/polyline` and `@pirxpilot/google-polyline` use `[lng, lat]` order, like GeoJSON. Everything else here uses `[lat, lng]`, and the polyline string itself always stores latitude first. Mix these up when you switch libraries and you get a line drawn somewhere else, with no error.
- `google-polyline` 2.0.0 has no precision option and always uses 5. So it can't read OSRM's `polyline6` output or Valhalla shapes.

## What's in the comparison

| Package | Version | Published | Downloads/week | Point shape | Precision tested |
|---|---|---|--:|---|---|
| `@mapbox/polyline` | 1.2.1 | 2023-09 | 916,574 | `[lat, lng]` | 5, 6 |
| `@googlemaps/polyline-codec` | 1.0.28 | 2022-05 | 106,922 | `[lat, lng]` | 5, 6 |
| `google-polyline` | 2.0.0 | 2026-09 | 24,690 | `[lat, lng]` | 5 only |
| `polyline-encoded` | 0.0.9 | 2020-02 | 12,093 | `[lat, lng]` | 5, 6 |
| `@placemarkio/polyline` | 2.0.3 | 2025-12 | 6,974 | `[lng, lat]` | 5, 6 |
| `decode-google-map-polyline` | 1.0.1 | 2017-01 | 2,949 | `{lat, lng}` | 5 only, decode only |
| `@pirxpilot/google-polyline` | 4.0.1 | 2026-02 | 50 | `[lng, lat]` | 5, 6 |
| `@lp-labs/polyline-codec` | 0.1.0 | 2026-11 | 28 | `{latitude, longitude}` | 5, 6 |

Downloads are from npm for 19 to 25 November 2026.

Since 2021, `@googlemaps/polyline-codec` went from 1.0.2 to 1.0.28 and `@mapbox/polyline` from 1.1.1 to 1.2.1. `google-polyline` went from 1.0.3 to 2.0.0, which is ESM and lives on Codeberg now. `polyline-encoded` and `decode-google-map-polyline` haven't had a release since 2020 and 2017. I kept both because people still download them every week.

The two packages with tiny download counts are in because they work differently. `@pirxpilot/google-polyline` takes `[lng, lat]` and a `factor` option, and `@lp-labs/polyline-codec` is the strict `BigInt` one.

Left out:

- `@cargoffer/polyline`: its own source says it's a bit-for-bit copy of `@mapbox/polyline` 1.2.1.
- `polyline-decode`: a TypeScript port of `polyline-encoded`, with 7 downloads a week.
- `polyline`: deprecated in favor of `@mapbox/polyline`.
- `@here/flexpolyline`: HERE's Flexible Polyline is a different format.
- `geojson-polyline`: a wrapper around `@mapbox/polyline`.
- WebAssembly: I couldn't find a WASM polyline codec on npm in November 2026. There are Rust crates (`polyline`, `polyline-codec`), but I didn't find a JS build of either.

## Correctness

`npm test` runs every library against [`src/reference.js`](src/reference.js), a short, slow codec written to be easy to check. At precision 5 and 6, each library has to encode to the exact same string and decode to the same coordinates (within 1e-9 degrees). The cases:

- empty input
- a single point at 0,0
- negative latitudes and longitudes
- ±90 and ±180
- a line crossing the antimeridian
- repeated points, so zero deltas
- one-unit steps
- unrounded input with 9 decimals, like raw GPS fixes
- a 100,000 point line
- Google's documented example (precision 5 only)
- all 1000 real-world lines (precision 5 only)

All 8 libraries pass every case they support, 273 checks in total. `google-polyline` and `decode-google-map-polyline` skip precision 6, and `decode-google-map-polyline` has no encoder. The benchmark also checks each library's output on every input before it starts timing.

Exact rounding ties are left out on purpose, because the libraries disagree there. At precision 5, `google-polyline` and `@lp-labs/polyline-codec` turn -0.000005 into 0, and the rest turn it into -1. Run `npm run behavior` to see this and the truncated-string case for each library.

## Running it

```sh
npm ci
npm test
npm run bench
```

`npm run bench` writes `results/node.md` and `results/node.json`. For the other runtimes, use `npm run bench:bun` and `npm run bench:deno`, or `npm run bench:all` for all three. The tests also run with `npm run test:bun` and `npm run test:deno`.

Options go after `--`, for example `npm run bench -- --precision 6 --only google`:

- `--precision 5` or `6`
- `--time 1000`: milliseconds per cell
- `--rounds 3`
- `--only <text>`: only libraries whose name contains it
- `--no-write`: print the tables without saving them

A full run takes about 7 minutes per runtime on my machine. I've only run the benchmark on Windows. CI runs the tests on Ubuntu with Node 22, 24 and 26, Bun and Deno.

## How it's measured

- The test inputs come from a seeded PRNG and use integer math only, so Node, Bun and Deno get exactly the same coordinates. They're GPS-like tracks sampled at about 1 Hz, starting in Istanbul, São Paulo, Seattle and Sydney. That way negative values show up in the timed data too. The tracks also stop now and then, which gives repeated points.
- The real-world set is the CSV from 2021: 1000 lines from PostGIS `ST_AsEncodedPolyline`, 146,330 points in total, median 82 points per line.
- Each library runs in its own child process with `tinybench`, 1000 ms per cell after a 250 ms warmup. I added the separate processes after `@mapbox/polyline` decoded 10 points about 25% faster when it ran alone than after the other libraries.
- Short lines are repeated inside one timed call until it covers 20,000 points, so timer overhead doesn't swamp a 10 point decode.
- Inputs are built in each library's own point shape ahead of time, so flipping to `[lng, lat]` or building objects isn't part of the timing. Decode returns whatever the library returns.
- CI never runs the benchmark, because shared runners are too noisy for the numbers to mean anything.

## License

MIT, see [LICENSE](LICENSE).
