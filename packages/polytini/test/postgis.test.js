// Parity with PostGIS's ST_AsEncodedPolyline and ST_LineFromEncodedPolyline,
// from the committed fixture test/fixtures/postgis.json, so no Docker is
// needed here. scripts/postgis-fixtures.js generates the fixture and
// test/fixtures/POSTGIS.md explains every case where PostGIS differs from
// Google's algorithm.
//
// Every case is one of:
// - PostGIS agrees with Google's algorithm: polytini must give exactly the
//   PostGIS string, or exactly the PostGIS doubles.
// - PostGIS differs (`postgisDiffers` lists the reasons): polytini must give
//   `polytini`, which is Google's result or a PolylineError code.
// - PostGIS and Google both reject the string: polytini must throw `polytini.error`.
// - `polytiniBug`: a known polytini difference, reported, not fixed here.
//   Either the correct result or the recorded one passes, so a fix in src
//   doesn't break this test, but any third result fails.
import { test, eq, ok, throws, entries, json, AssertionError } from './lib.js';

const fx = await json('fixtures/postgis.json');
const list = await entries();

// The fixture keeps -0, NaN and Infinity as strings.
const num = (x) => (typeof x == 'string' ? Number(x) : x);
const pts = (a) => a.map((p) => p.map(num));
const swap = (a) => a.map(([lat, lng]) => [lng, lat]);
const lnglat = (precision) => ({ precision, order: 'lnglat' });
const dedupe = (a) => a.filter((p, i) => i == 0 || p[0] != a[i - 1][0] || p[1] != a[i - 1][1]);
const plain = (c) => !c.postgisDiffers && !c.polytini && !c.polytiniBug;

// Runs fn on every case and reports all the failures together.
function each(cases, fn) {
  ok(cases.length > 0, 'no cases');
  const bad = [];
  for (const c of cases) {
    try {
      fn(c);
    } catch (e) {
      bad.push(`${c.name} (precision ${c.precision}): ${e.message}`);
    }
  }
  if (bad.length) throw new AssertionError(`${bad.length} of ${cases.length} cases failed:\n    ${bad.slice(0, 8).join('\n    ')}`);
}

const encodes = (api, c, want) => {
  const p = pts(c.points), run = [() => api.encode(p, c.precision), () => api.encode(swap(p), lnglat(c.precision))];
  for (const fn of run) want.error ? throws(fn, want.error) : eq(fn(), want.encoded);
};
const decodes = (api, c, want) => {
  const run = [() => api.decode(c.encoded, c.precision), () => swap(api.decode(c.encoded, lnglat(c.precision)))];
  for (const fn of run) want.error ? throws(fn, want.error) : eq(fn(), pts(want.points));
};

test('postgis fixture: versions, categories and reasons', () => {
  ok(/^postgis\/postgis:/.test(fx.image), 'image tag');
  ok(fx.versions.postgis && fx.versions.geos && fx.versions.postgis_full_version.includes('GEOS='), 'versions');
  const categories = new Set([...fx.encode, ...fx.decode].map((c) => c.category));
  for (const k of ['empty', 'one-point', 'zero', 'negative', 'bounds', 'antimeridian', 'repeated', 'unit-steps', 'ties', 'gps9', 'long', 'random', 'malformed', 'high-bytes', 'varint', 'range', 'precision'])
    ok(categories.has(k), 'missing category ' + k);
  for (const p of [0, 1, 5, 6, 7, 10]) ok(fx.encode.some((c) => c.precision == p && plain(c)), 'no plain cases at precision ' + p);
  for (const c of [...fx.encode, ...fx.decode]) {
    for (const r of c.postgisDiffers ?? []) ok(fx.reasons[r], `${c.name}: unknown reason ${r}`);
    // Every difference says what polytini does instead.
    if (c.postgisDiffers) ok(c.polytini, `${c.name}: no polytini result`);
  }
});

for (const { name, api } of list) {
  test(`postgis ${name}: encode matches ST_AsEncodedPolyline`, () =>
    each(
      fx.encode.filter((c) => plain(c)),
      (c) => {
        encodes(api, c, c.postgis);
        if (c.precision == 5) eq(api.encode(pts(c.points)), c.postgis.encoded, 'default precision');
      },
    ));

  test(`postgis ${name}: decode matches ST_LineFromEncodedPolyline`, () =>
    each(
      fx.decode.filter((c) => plain(c)),
      (c) => {
        decodes(api, c, c.postgis);
        if (c.precision == 5) eq(api.decode(c.encoded), pts(c.postgis.points), 'default precision');
      },
    ));

  test(`postgis ${name}: rejects the strings PostGIS rejects`, () =>
    each(
      fx.decode.filter((c) => c.postgis.error && !c.postgisDiffers),
      (c) => decodes(api, c, c.polytini),
    ));

  test(`postgis ${name}: encode where PostGIS differs from Google's algorithm`, () =>
    each(
      fx.encode.filter((c) => c.postgisDiffers),
      (c) => {
        ok(c.polytini.error || c.polytini.encoded !== c.postgis.encoded, 'the fixture records no difference');
        encodes(api, c, c.polytini);
      },
    ));

  test(`postgis ${name}: decode where PostGIS differs from Google's algorithm`, () =>
    each(
      fx.decode.filter((c) => c.postgisDiffers),
      (c) => {
        decodes(api, c, c.polytini);
        // Dropping repeated points is the only change: the rest of the
        // doubles must still be identical.
        if (c.polytini.points && c.postgisDiffers.every((r) => r == 'repeated-points')) eq(dedupe(api.decode(c.encoded, c.precision)), pts(c.postgis.points), 'without repeated points');
      },
    ));

  test(`postgis ${name}: precisions PostGIS accepts and polytini rejects`, () =>
    each(
      [...fx.encode, ...fx.decode].filter((c) => !(c.precision >= 0 && c.precision <= 15)),
      (c) => {
        eq(c.polytini, { error: 'option' });
        (c.points ? encodes : decodes)(api, c, c.polytini);
      },
    ));

  test(`postgis ${name}: known polytini differences`, () =>
    each(
      [...fx.encode, ...fx.decode].filter((c) => c.polytiniBug),
      (c) => {
        const want = c.polytini ?? c.postgis, check = c.points ? encodes : decodes;
        try {
          check(api, c, want);
        } catch {
          check(api, c, c.polytiniBug);
        }
      },
    ));
}
