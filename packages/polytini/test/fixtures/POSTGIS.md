# PostGIS parity fixtures

`postgis.json` records what PostGIS returns for `ST_AsEncodedPolyline` and
`ST_LineFromEncodedPolyline` on a set of lines and strings.
`test/postgis.test.js` checks every polytini entry point (web, node, bun,
deno, wasm) against it, so the normal test run needs no Docker.

The committed file was generated with:

| | |
| --- | --- |
| Image | `postgis/postgis:18-3.7` (amd64, `uname -m` = `x86_64`) |
| PostGIS | 3.7.0 (revision 1fdbb1c) |
| GEOS | 3.15.0-CAPI-1.21.0 |
| PostgreSQL | 18.7 |

The full `postgis_full_version()` string is in the `versions` field of the
fixture.

## Regenerating

You need Docker. From `packages/polytini`:

```sh
node scripts/postgis-fixtures.js          # writes test/fixtures/postgis.json
node scripts/postgis-fixtures.js --check  # exits 1 if the file would change
node scripts/postgis-fixtures.js --keep   # leaves the container running
```

The script starts a container named `polytini-postgis-fixtures` from
`postgis/postgis:18-3.7` (or reuses it if it is already running), waits until
PostgreSQL accepts TCP connections, runs every case through
`docker exec ... psql -At` as one JSON document, and removes the container
again unless `--keep` is given. Other settings:

- `POSTGIS_IMAGE`: another image tag, for example `postgis/postgis:17-3.7`.
- `POSTGIS_CONTAINER`: the name or id of a container that is already running,
  for example a CI service container. The script then leaves it alone.
- `POSTGIS_USER`: the database user, `postgres` by default.

The output is deterministic (fixed random seed, no timestamps), so a
regenerated file only changes when PostGIS, the cases or the generator do.
Run it on amd64: one of the differences below depends on how the CPU converts
an out of range double to an int, and the generator stops with an error when
PostGIS does something its model of the C code does not predict.

## How the cases are built and checked

Inputs are passed to PostgreSQL as text that `float8` reads back exactly, and
lines are built with `ST_MakeLine(ST_MakePoint(lng, lat), ...)` and SRID 4326
(a few cases use EWKT to test SRIDs, geometry types and Z/M). The script reads
the geometry back and checks it is exactly the input. Decoded coordinates are
read with `ST_X(p)::text` and `ST_Y(p)::text` under `extra_float_digits = 3`,
which prints the shortest text that reads back as the same double, so the
fixture holds the exact doubles PostGIS computed. JSON can't hold `-0`,
`NaN` or `Infinity`, so those are strings in the file.

Every case is compared with two independent references in the script:

1. Google's algorithm with exact Number arithmetic up to 2^53 and round half
   away from zero (the C `round()` definition, exact for every double).
2. A model of the PostGIS 3.7.0 C code (`lwout_encoded_polyline.c` and
   `lwin_encoded_polyline.c`), which notes a reason each time it takes a path
   that Google's algorithm would not.

The script fails if PostGIS's output does not match the model exactly, if
PostGIS differs from Google's algorithm and the model has no reason for it, or
if the model predicts a difference that does not happen. So every
`postgisDiffers` entry in the fixture is a checked explanation, not a guess.

Each case then records what polytini should return:

- PostGIS agrees with Google: polytini must return the same string, or the
  same doubles, bit for bit. The test also runs each case with
  `order: 'lnglat'` and swapped input.
- PostGIS differs: `postgisDiffers` lists the reasons, `google` holds Google's
  result, and `polytini` holds what polytini must return instead (Google's
  result, or a `PolylineError` code).
- Both PostGIS and Google reject a string: polytini must throw, with the code
  in `polytini.error`.
- A precision outside 0 to 15: polytini must throw with code `option`.
- `polytiniBug`: polytini's current output where it differs from the correct
  result. See "Known polytini difference" below.

Decode cases come from three places: every string PostGIS produced in the
encode cases (296), every string polytini produced that PostGIS did not (41,
mostly the overflow cases), and hand written strings (43).

## Case counts

Encode: 327 cases, 57 where PostGIS differs from Google.

| Category | Cases | PostGIS differs |
| --- | --- | --- |
| empty | 7 | 0 |
| one-point | 13 | 2 |
| zero (including -0) | 18 | 1 |
| negative | 12 | 2 |
| antimeridian | 18 | 6 |
| repeated | 12 | 3 |
| bounds (±90, ±180, precision 0 to 15) | 32 | 18 |
| unit-steps | 28 | 0 |
| ties | 63 | 0 |
| gps9 (unrounded 9 decimal values) | 10 | 3 |
| long (3000, 1500 and 1500 points) | 3 | 0 |
| random (seeded, precision 0 to 15) | 86 | 6 |
| precision (-5, -1, 16 to 22, 400) | 14 | 10 |
| non-finite | 3 | 3 |
| geometry (SRID, MULTIPOINT, Z, M, POINT) | 8 | 3 |

Decode: 380 cases, 114 where PostGIS differs from Google.

| Category | Cases | PostGIS differs |
| --- | --- | --- |
| empty | 6 | 0 |
| one-point | 14 | 1 |
| zero | 13 | 8 |
| negative | 13 | 3 |
| antimeridian | 22 | 9 |
| repeated | 16 | 15 |
| bounds | 45 | 29 |
| unit-steps | 28 | 0 |
| ties | 57 | 10 |
| gps9 | 13 | 5 |
| long | 3 | 0 |
| random | 91 | 10 |
| precision | 20 | 13 |
| non-finite | 3 | 0 |
| geometry | 3 | 0 |
| google-example | 4 | 0 |
| malformed | 11 | 0 |
| high-bytes | 5 | 4 |
| varint | 8 | 4 |
| range | 5 | 3 |

254 encode cases and 246 decode cases are plain agreement cases, where
polytini has to match PostGIS exactly. They cover every precision from 0
to 15, with at least 5 encode and 5 decode cases each, and 11 or more at
each of 0, 1, 5, 6, 7 and 10.

## Where PostGIS and Google's algorithm agree

- **Rounding.** PostGIS multiplies by `pow(10, precision)` and calls C
  `round()`, which rounds half away from zero. That is the same double
  product and the same rounding as Google's algorithm, so every tie agrees:
  exact binary ties (`0.5`, `-2.5` at precision 0, `0.25` at precision 1),
  decimal ties that are not exact in binary (`0.000005` and `-0.000015` at
  precision 5 give 1 and -2 units; `0.000035` is slightly below the tie in
  binary and gives 3), and the doubles just above and below each tie, at
  precisions 0 to 10. See the `ties` cases.
- **Decoding.** PostGIS divides the integer by `pow(10, precision)`, the same
  operation as polytini, so the decoded doubles are identical for every
  string both accept (unit steps, close points past 2^24 units, 9 decimal
  values, long and random lines).
- **Order.** PostGIS geometries are x = longitude, y = latitude, and the
  string has latitude first, as in Google's format.
- **Empty and one point lines.** `LINESTRING EMPTY` and `MULTIPOINT EMPTY`
  encode to `''`, and `''` decodes to `LINESTRING EMPTY`. A one point line
  (built with `ST_MakeLine`, because the WKT parser refuses a one point
  `LINESTRING`) encodes normally, and `'??'` decodes to a one point
  `LINESTRING`.
- **MULTIPOINT, Z and M.** A `MULTIPOINT` encodes like the line through its
  points, and Z and M values are ignored.
- **Malformed strings.** Both reject a string that ends inside a value
  (`'_'`), after a latitude without its longitude (`'A'`, `'??A'`), or that
  contains a byte below `?` (space, tab, newline, `!`, `>`). PostGIS raises
  `input is truncated` or `input contains an invalid byte` and returns no
  partial result; polytini throws `truncated` or `char`.
- **Output.** Decoded lines always have SRID 4326.

## Where PostGIS differs from Google's algorithm

Each heading is the reason id used in `postgisDiffers`. Case names refer to
entries in `postgis.json`.

### int32-overflow (encode)

`pointarray_to_encoded_polyline` stores each delta in a C `int` and doubles
it with `delta[i] *= 2`. A delta of 2^30 units (1073741824) or more
overflows; on this build it wraps around, so the string encodes a different
number. At precision 7 that is any step over 107.374 degrees, including the
first point, whose delta is from 0.

Evidence, `one point p7`: the point `[38.5, -120.2]` at precision 7.

- PostGIS: `_cpi}U_wvjjw@`
- Google and polytini: `_cpi}U~fgssfA`
- PostGIS decodes its own string as `[38.5, 94.5483648]` (case `one point p7`
  in `decode`), while it decodes polytini's string correctly as
  `[38.5, -120.2]`. The decoder handles values the encoder can't produce;
  `longitude 180 at p7 in one step` decodes to `[0, 180]`.

The same happens for the antimeridian, the ±180 bounds and the 9 decimal
readings at precision 7 and above. polytini uses exact Number arithmetic up
to 2^53 and gives Google's result.

### int32-conversion (encode)

Each rounded value and each delta is converted from `double` to `int`. Out of
range, that conversion is undefined behavior in C. On amd64 it yields
`INT_MIN` (-2147483648), which `* 2` then turns into 0, so the value encodes
as `?`. Latitude 90 at precision 8 is 9e9 units, past the int range.

Evidence, `north pole only p8`: `[[90, 0], [-90, 0]]` at precision 8.

- PostGIS: `????` (two points at 0, 0)
- Google and polytini: `` __lcmwO?~~xg{o`@? ``

`north pole only p10` is the same at precision 10. An arm64 build would
saturate instead, and give other strings.

### non-finite (encode)

NaN and infinite coordinates are not rejected: they convert to `INT_MIN` like
above and encode as `?`. `NaN latitude p5` (`[[NaN, 0], [1, 1]]`) gives
`???_ibE`. Google's algorithm has no answer for NaN, and polytini throws a
`PolylineError` with code `coordinate`.

### negative-precision (encode and decode)

Both SQL functions replace a negative precision with 5
(`if (precision < 0) precision = 5;`). `precision -1` and `precision -5`
encode exactly like precision 5 (`ayp_I}cypAfojUpvmbA`), and
`Google's example precision -1` decodes to `[38.5, -120.2], ...`. polytini
throws with code `option` for any precision outside 0 to 15.

### precision-overflow (encode and decode)

PostGIS takes any int precision. From 309 on, `pow(10, precision)` is
infinite: encoding multiplies to infinity or NaN (then INT_MIN, then `?`),
and decoding divides to zero. `precision 400` encodes Berlin to Paris as
`????`, and `minus one at precision 400` decodes `@@` to `[-0, -0]`.
polytini throws `option`.

For precisions 16 to 22, PostGIS computes the same as Google's algorithm when
the values fit in an int (`tiny values precision 20` encodes
`[[1e-15, -2e-15], [3e-15, 4.5e-15]]` as `_ibE~reK_seK_ptf@`). That is not a
PostGIS difference, but polytini limits precision to 15 and throws `option`;
the test checks that.

### srid (encode)

`ST_AsEncodedPolyline` raises `Only SRID 4326 is supported.` for any other
SRID, including none (`no SRID p5`, `SRID 3857 p5`). The format has no SRID,
and polytini encodes the coordinates as given.

### geometry-type (encode)

Only `LINESTRING` and `MULTIPOINT` are accepted. `point p5` raises
`lwgeom_to_encoded_polyline: 'Point' geometry type not supported`, while
Google's algorithm encodes a one point sequence (`ayp_I}cypA`), and so does
polytini.

### repeated-points (decode)

`lwgeom_from_encoded_polyline` appends points with
`ptarray_append_point(pa, &pt, LW_FALSE)`, which skips a point equal to the
previous one. So consecutive duplicate points disappear:

- `two equal points`: `????` decodes to `[[0, 0]]`, Google gives
  `[[0, 0], [0, 0]]`.
- `a step then a zero step`: `??AA??` decodes to 2 points, not 3.
- `back to an earlier point`: `??AA@@` keeps all 3 points, because only
  consecutive duplicates are dropped.

This affects every line with repeated points, and lines whose points round to
the same value (some `ties` cases), so a PostGIS round trip can return fewer
points than it was given. polytini returns every point. For the cases where
this is the only difference, the test also checks that polytini's points with
consecutive duplicates removed are exactly PostGIS's doubles.

### high-bytes (decode)

The decoder reads the UTF-8 bytes of the text and only rejects bytes below
63 (`?`). DEL (127) and every byte of a non-ASCII character pass as
continuation chunks (`byte - 63` is at least 32), and only their low 5 bits
are used:

- `DEL character as a continuation`: `"\u007f??"` decodes to `[[0, 0]]`.
- `Latin e acute`: `"?é?"` (bytes C3 A9) decodes to `[[0, 0.00162]]`.
- `o with double acute`: `"ő??"` decodes to `[[0.00291, 0]]`.
- `euro sign`: `"?€?"` at precision 6 decodes to `[[0, -0.006706]]`.

Google's alphabet is `?` to `~`, and polytini throws `char` for these. (`DEL
at the end` is rejected by both, because the DEL starts a value that never
ends.)

### varint-32bit (decode)

Each value is read into a `uint32_t`, and a seventh chunk may only carry 2
more bits. Anything wider raises `coordinate value is too large`:

- `zigzag 2^32 - 1 (latitude -2^31)`: `~~~~~~B?` is accepted, the widest value.
- `zigzag 2^32`: `______C?` is rejected; Google and polytini decode
  `[21474.83648, 0]`.
- `seven zero continuation chunks`: `_______??` is rejected although it is
  the value 0 with zero padding; six padding chunks (`______??`) are fine.
- `latitude 90 at p10`: `__swdkks@?` (90 degrees at precision 10) is rejected.
- polytini strings for the overflow cases above (for example
  `antimeridian crossing p7 (polytini string)`) are rejected the same way.

polytini decodes values exactly up to 2^53 and throws `overflow` past that
(`zigzag 2^60`, which PostGIS also rejects).

### int32-range (decode)

The running sums are `int32_t`, and a sum outside that range raises
`coordinate value is too large`. `latitude sum reaches 2^31` (2^31 - 1 units,
then one more) and `longitude sum reaches -2^31 - 1` are rejected, while
`latitude 2^31 - 1 then back` is accepted. polytini has no such limit.

## Known polytini difference

polytini rounds with `Math.sign(x) * Math.floor(Math.abs(x) + 0.5)` (and the
same in its fast paths and WASM). That is not exact half away from zero for
one input: the largest double below 0.5, `0.49999999999999994`. Adding 0.5
to it rounds up to exactly 1.0 in floating point, so polytini rounds it to 1,
while C's `round()` (PostGIS) correctly returns 0. Any coordinate whose
scaled value is exactly that double is affected, for example:

| Input `[lat, lng]` | Precision | PostGIS | polytini |
| --- | --- | --- | --- |
| `[0.49999999999999994, 0]` | 0 | `??` | `A?` |
| `[0, -0.49999999999999994]` | 0 | `??` | `?@` |
| `[0.049999999999999996, 1]` | 1 | `?S` | `AS` |
| `[0.0000049999999999999996, -0.0000049999999999999996]` | 5 | `??` | `A@` |

The same appears at precisions 2, 4, 8, 9 and 10 (the `just below half a
unit` cases). PostGIS is right here, since Google's algorithm says to round
the scaled value, and the scaled value is below one half. The fixture
records polytini's output in `polytiniBug`. The test accepts either result,
so fixing it in `src` does not break the test, but any other output fails.
Values scaled into [2^52, 2^53) would have the same problem, but polytini
already rejects those with `overflow`.

## Older PostGIS versions

The fixture is for PostGIS 3.7.0. Running the generator with
`POSTGIS_IMAGE=postgis/postgis:18-3.6` (PostGIS 3.6.1) stops with 144
decode cases that the 3.7.0 model does not explain. 3.6.1 summed decoded
values in a C `float`, so coordinates lose precision past 2^24 units (PostGIS
ticket #5357): `antimeridian crossing p5` decodes `179.99999` as `180`, and
`negatives p6` decodes `-0.4` as `-0.400002`. It also read past the end of
truncated strings instead of raising an error: `'_'` decoded to
`[0.00016, 194.99778]` and `'A'` to `[0.00001, -0.00001]`. The encoder was
the same as in 3.7.0. Don't compare polytini against PostGIS before 3.7.

## PostGIS's own tests

These PostGIS 3.7.0 tests cover the two functions:

- `regress/core/in_encodedpolyline.sql` and its expected output
- `regress/core/out_geometry.sql` (`encoded_polyline_01` to `04`)
- `regress/core/tickets.sql` (#3627 and #5357)
- `liblwgeom/cunit/cu_in_encoded_polyline.c` and
  `liblwgeom/cunit/cu_out_encoded_polyline.c`

PostGIS is GPL-2.0, so none of their data is copied here. The cases in this
fixture are written for this project and cover the same behavior:

| PostGIS test covers | Cases here |
| --- | --- |
| encode and decode a line at precision 5 and 6 | `random`, `gps9`, `long`, `unit-steps` and the `postgis` decode cases |
| MULTIPOINT input, and empty LINESTRING and MULTIPOINT | `multipoint p5`, `multipoint p6`, `empty line p*`, `empty multipoint p5` |
| geometry without SRID 4326 | `no SRID p5`, `SRID 3857 p5` |
| rounding at precision 6, round trip at precision 7 (#3627) | `ties`, `gps9`, `random` at 6 and 7, and the decode of every PostGIS string |
| close points must not merge (#5357) | `close points past 2^24 p6` and `p7`, `unit steps from a base point p*` |
| truncated input | `lone continuation character`, `latitude without longitude`, `odd number of values`, `ends inside the third point` |
| over long value | `zigzag 2^32`, `seven zero continuation chunks`, `zigzag 2^40` |
| running sum out of int range | `latitude sum reaches 2^31`, `longitude sum reaches -2^31 - 1` |

The one string shared with those tests is `` _p~iF~ps|U_ulLnnqC_mqNvxq`@ ``, the
worked example from Google's
[algorithm description](https://developers.google.com/maps/documentation/utilities/polylinealgorithm),
used here as `Google's example p*`.
