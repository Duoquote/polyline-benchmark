# Where the sources disagree

This file lists every place where the vector sources disagree with each other
or with polytini, what each side does, and which behavior polytini follows.
The reasoning starts from Google's description of the format,
<https://developers.google.com/maps/documentation/utilities/polylinealgorithm>:

1. Multiply the value by 1e5 and round the result.
2. Take the 32-bit two's complement, shift left by one, and invert if the
   value was negative (zigzag).
3. Split into 5-bit chunks from the low end, OR 0x20 into every chunk but the
   last, add 63, and write each as an ASCII character.
4. Store each point as the offset from the previous point.

So a valid string only contains characters `?` (63) to `~` (126), every
value ends with a character below `_` (95), and every point has the same
number of values. The page says nothing about precisions other than 5, ties,
range checks, or what to do with a string that breaks these rules.

Cases where polytini differs on purpose have a `polytini` field in the JSON;
cases where both throw, but with different error kinds, have the polytini
code in `throws` and the source's error in `note`.

## 1. Rounding exact ties

The page says "round" without a tie rule. For a product that is exactly
`n + 0.5`, the sources do four different things:

| Rule | Who | -0.5, -1.5, -2.5 become |
| --- | --- | --- |
| Half away from zero | @googlemaps/polyline-codec (`Math.floor(Math.abs(v) + 0.5) * sign`), @mapbox/polyline and @placemarkio/polyline (`py2_round`), Python polyline (`_py2_round`), @pirxpilot/google-polyline, Rust `f64::round`, Go `math.Round` (go-polyline), C++ `std::round` (OSRM, Valhalla), Ruby `Float#round`, PHP `round()`, test/reference.js | -1, -2, -3 |
| Half up (`Math.round`, `floor(x + 0.5)`) | Java `Math.round` (GraphHopper, google-maps-services-java), JavaScript `Math.round` (google-polyline), @lp-labs/polyline-codec | 0, -1, -2 |
| Half to even | Kotlin `kotlin.math.round` (android-maps-utils `PolyUtil.encode`), Python 3 `round()` (google-maps-services-python `encode_polyline`) | 0, -2, -2 (and 0.5 becomes 0, 2.5 becomes 2) |
| Truncation | google-maps-services-go `Encode` (`int64(point.Lat * 1e5)`) | 0, -1, -2 (and 0.29 becomes 28999 units, since 0.29 * 1e5 is 28999.999999999996) |

**polytini rounds half away from zero.** That is what Google's own JavaScript
codec does, what the Python 2 `round()` of the original encoder scripts did
(mapbox and Python polyline both name it "py2 round" for that reason), and
what most implementations agree on, so strings match theirs byte for byte.
Positive ties come out the same under the first two rules; only negative ties
differ, by one unit. Half-to-even and truncation also change positive values.

The sources' own vectors settle it. "encodes with proper negative rounding"
(@googlemaps/polyline-codec, @mapbox/polyline, @placemarkio/polyline, and
Python polyline's `test_rounding_py3_match_py2`) encodes
`[36.053845, -112.083965]`, and `-112.083965 * 1e5` is exactly `-11208396.5`
in doubles. The expected string `` ss`{E~kbkTeAQw@J `` needs -11208397, which only
half away from zero gives; `Math.round` and half-to-even give -11208396. In the
same way "encodes with precision 0" needs `38.5` to become 39, which
half-to-even and truncation do not give. The other copied vectors have one
more tie, `0.000045 * 1e5 = 4.5` in google-polyline's "fine locations", which
is positive, so the first two rules agree on it. `issues.json` has a 1D tie
case whose note lists every rule's result, and `lp-labs-polyline-codec.json`
and `php-written.json` have written tie cases.

## 2. Near-ties: multiply first, or round the decimal

polyline-encoded (Leaflet.encoded) rounds with `value.toFixed(precision)`,
which works on the exact binary value. Everyone else multiplies first, as
step 1 says. They differ when the product lands on a tie the decimal does
not: `0.000155 * 1e5` is exactly 15.5 in doubles and rounds to 16, but the
double nearest 0.000155 is slightly below it, so `toFixed(5)` gives
`0.00015`. **polytini multiplies, then rounds**, as the page describes
(`issues.json`, "decimal near-ties"). polyline-encoded also turns precision 0
into 5 (`options.precision || 5`), so its precision-0 output differs too.

## 3. Decoding by division or by multiplication

Valhalla (`* 1e-6`), android-maps-utils (`* 1e-5`), google-maps-services-go
(`* 1e-5`), decode-google-map-polyline (`1E-5 *`) and OSRM (fixed-point
integers) multiply by the inverse factor; the rest divide. Multiplying gives
values such as `-12645300 * 1e-5 = -126.45300000000002`, which is why Valhalla,
Leaflet.encoded's issue 5 and the Google libraries compare within a tolerance.
**polytini divides** (integer / 10^precision), so a decoded value is the
double closest to the decimal and `38.5` comes back as exactly `38.5`. The
vectors use `tolerance` only where the source's expected values are rounded or
carry this error (ruby-polylines single values, Leaflet.encoded issue 5).

## 4. Characters outside `?` to `~`

| Behavior | Who |
| --- | --- |
| Throw | go-polyline (`ErrInvalidByte`), @lp-labs/polyline-codec, georust (`DecodeError`, but only for bytes below 63: it reads UTF-8 bytes, so non-ASCII characters pass and fail later as an out-of-range latitude) |
| Read garbage without an error | @mapbox/polyline, @placemarkio/polyline (`"Hello, world!"` decodes to two points in its own test), google-polyline, polyline-encoded, @googlemaps/polyline-codec, android-maps-utils, google-maps-services-go, GraphHopper, OSRM, Valhalla, Python polyline |
| Treat `>` as 0 | @pirxpilot/google-polyline, on purpose: a lone `>` (62) is what encoders produce when they zigzag a negative zero as `~0 = -1` |
| Ignore a trailing line feed | Python polyline, according to georust issue 27 |

**polytini throws `char` in strict mode (the default)**, with the index of the
character. Such characters cannot come out of step 3, so a string holding one
is damaged (URL-encoded, quoted, cut and pasted) and any points read from it
are wrong without anyone noticing. With `strict: false` polytini skips the
character and reads on, which recovers strings with stray whitespace, quotes
or line feeds, but not URL-encoded ones (`%5B` contains a valid `B`).
Affected cases: placemark's two "Hello, world!" cases and pirxpilot's `>`
case have a `polytini` field; issues.json has lenient-mode cases.

## 5. Strings that end inside a value or a point

| Behavior | Who |
| --- | --- |
| Throw | go-polyline (`ErrUnterminatedSequence`, or `ErrEmpty` for a missing longitude), @lp-labs/polyline-codec, georust (`NoLongError` for a missing longitude), Valhalla, Python polyline (`IndexError`), GraphHopper and android-maps-utils (index exceptions) |
| Return a point built from the partial value | @mapbox/polyline, @placemarkio/polyline, @googlemaps/polyline-codec (`charCodeAt` past the end is NaN, which ends the value), OSRM, georust for a cut-off last value (issue 55) |
| Drop the incomplete point | google-polyline, @pirxpilot/google-polyline, polyline-encoded, google-maps-services-go |

**polytini throws `truncated` in strict mode.** The last character of a valid
string is always below `_` and completes a point, so a string that does not is
cut off, and a point made from part of a value is in the wrong place. With
`strict: false` it drops the incomplete point, like the third group.

## 6. Integer width and overflow

The page says "32-bit", and many implementations shift with 32-bit operators.
That holds for precision 5 and 6 (a value or delta fits as long as twice it
is below 2^31: up to about 1073 degrees at precision 6), but not for
precision 7 and up:

- @googlemaps/polyline-codec shifts with `<<`. Its own test "encodes negative
  values correctly" (-107.3741825 at precision 7) only checks the sign; the
  library returns `?@`, which decodes to -0.0000001. The exact string is
  `` ?`_____A ``.
- mapbox/polyline issue 80: at precision 7, a jump from -180 to 180 is 3.6e9
  units and decoded as -34.7483648 before the fix; mapbox now uses arithmetic.
- @placemarkio/polyline, google-polyline, @pirxpilot/google-polyline,
  polyline-encoded and GraphHopper (`int`) shift in 32 bits; OSRM and
  Valhalla store `int32_t`.
- go-polyline, georust and google-maps-services-go use 64-bit integers;
  Python has unbounded integers.

**polytini computes with exact Numbers up to 2^53** (the fast paths fall back
to that when values leave the 32-bit range) and throws `overflow` in strict
mode when a value would pass 2^53, where doubles stop being exact. So it
encodes the precision-7 cases exactly and accepts precisions up to 15. It
does not reproduce 64-bit values past 2^53: go-polyline's `MaxInt`, `MinInt`
and `MaxUint` cases keep the Go value in `expected` and have
`polytini: { throws: "overflow" }`. The format has no fixed width, so a
decoder cannot tell a long value from garbage except by a limit; 2^53 is the
limit where polytini's results stop being exact. Where both throw but at
different points, the codes differ: go-polyline reports
`ErrUnterminatedSequence` or `ErrInvalidByte` for 12 `~` characters, georust
`DecodeError` at index 12 for `invalid_polyline_...`, and polytini `overflow`
at index 10, where the value passes 2^53.

## 7. Precision limits

| Who | Allowed precision |
| --- | --- |
| polytini | integers 0 to 15; anything else throws `option` |
| @lp-labs/polyline-codec | integers 0 to 7 |
| @mapbox/polyline | any integer; a non-integer silently means 5 |
| polyline-encoded | any number; 0 silently means 5 |
| others | whatever the factor arithmetic allows |

polytini rejects bad precisions instead of guessing, because a silent default
moves every point by a power of ten. Precision 13 (mapbox's high-precision test) and 15 work as long as the
values stay below 2^53.

## 8. Range checks

georust rejects latitudes outside [-90, 90] and longitudes outside
[-180, 180] on encode and decode; @lp-labs/polyline-codec does too.
Valhalla's own vectors contain random points with |lat| > 90, and the other
libraries do not check. **polytini does not range-check**: the format can
hold any number, `order`, `factor` and `dimensions` change what the values
mean, and elevation or 1D data have no geographic range. georust's
`bad_coords` case and lp-labs' range case have `polytini` fields with the
encoded string or the decoded points.

## 9. Overlong values

A value can be spelled with extra zero chunks (`a?` is a two-chunk 1; the
short form is `A`). @lp-labs/polyline-codec rejects that; go-polyline and the
rest accept it, and go-polyline's `TestCoord` decodes `a?Z` on purpose.
**polytini accepts it**: the page only defines how chunks are read, the
result is unambiguous, and no encoder following the steps produces it, so
rejecting it would only reject strings that decode fine.

## 10. Negative zero

An encoder that tests the sign before rounding, or zigzags `-0` as
`~(0 << 1)`, writes `>` (62) for a value that rounds to zero, which is not a
valid character. @pirxpilot/google-polyline decodes `>` as 0 to cope with
such strings. **polytini rounds first and zigzags -0 as 0**, so `-0`,
`-0.000001` and `-0.000004` all encode as `?`, and decoding never returns
-0 (`0 / factor` is +0). Cases: issues.json "negative zero", "values that
round to negative zero" and "zero decodes to positive zero".

## 11. Non-finite and missing coordinates

@mapbox/polyline and the other loose encoders turn NaN into arbitrary
characters (Leaflet.encoded issue 5 is a decode that produced NaN). georust
and @lp-labs/polyline-codec reject non-finite input through their range
checks. **polytini throws `coordinate`** in strict mode for NaN, Infinity and
missing values, and encodes them as 0 with `strict: false`.

## 12. Third and later values

@mapbox/polyline and @placemarkio/polyline ignore a third value when encoding
2D points, and polytini does the same with the default `dimensions: 2`.
polyline-encoded uses one factor for every dimension; GraphHopper stores
elevation in centimeters (factor 100) next to precision-5 coordinates. polytini
covers both with `dimensions` and `zFactor` (the factor of the third and later
values, defaulting to the coordinate factor).

## 13. Smaller API differences

- Empty string: go-polyline's `DecodeUint` returns `ErrEmpty`, its
  `DecodeCoords` returns no points. polytini returns `[]`, like every other
  source.
- Coordinate order: placemark, pirxpilot, georust, OSRM and Valhalla take and
  return `[lng, lat]`; those vectors use `order: "lnglat"`.
- 1D values: go-polyline tests single unsigned and signed integers, and
  polyline-encoded encodes lists of integers or floats without deltas. polytini
  with `dimensions: 1` encodes the deltas of a list of values, so those cases
  use running sums, and unsigned values are given as their signed zigzag
  value. Each case's note says which.
