// Property-based tests with fast-check, on every entry point. Fixed seeds,
// so CI runs are repeatable; set POLYTINI_SEED to explore others.
import fc from 'fast-check';
import { test, eq, ok, entries } from './lib.js';
import * as ref from './reference.js';

const all = await entries();
const env = globalThis.Deno ? Deno.env.toObject() : process.env;
const seed = Number(env.POLYTINI_SEED ?? 20261126);
const runs = Number(env.POLYTINI_RUNS ?? 300);
const check = (prop) => fc.assert(prop, { seed, numRuns: runs });

const precision = fc.integer({ min: 0, max: 10 });
// Any double in the coordinate range, and a few far outside it.
const coord = fc.oneof(
  fc.double({ min: -180, max: 180, noNaN: true }),
  fc.integer({ min: -180, max: 180 }),
  fc.constantFrom(0, -0, 90, -90, 180, -180, 0.000005, -0.000005, 0.000015, -0.000015, 1e-7, 123456.789),
);
const line = fc.array(fc.tuple(coord, coord), { maxLength: 120 });
// Long lines, so the buffer-backed paths (64+ characters) get exercised too.
const longLine = fc.array(fc.tuple(fc.double({ min: -90, max: 90, noNaN: true }), fc.double({ min: -180, max: 180, noNaN: true })), { minLength: 30, maxLength: 400 });
const anyLine = fc.oneof(line, longLine);
// Values every reference-exact path handles: at precision p the scaled
// value has to stay within 2^51.
const fits = (l, p) => l.every(([a, b]) => Math.abs(a) * 10 ** p < 2 ** 51 && Math.abs(b) * 10 ** p < 2 ** 51);

for (const { name, api } of all) {
  test(`${name}: encode agrees with the reference at random precisions`, () =>
    check(fc.property(anyLine, precision, (l, p) => !fits(l, p) || api.encode(l, p) === ref.encode(l, p))));

  test(`${name}: decode agrees with the reference`, () =>
    check(fc.property(anyLine, precision, (l, p) => {
      if (!fits(l, p)) return true;
      const s = ref.encode(l, p);
      eq(api.decode(s, p), ref.decode(s, p));
      eq(api.decodeFlat(s, p), ref.decode(s, p).flat());
      return true;
    })));

  test(`${name}: encode, decode, encode is a fixpoint`, () =>
    check(fc.property(anyLine, precision, (l, p) => {
      if (!fits(l, p)) return true;
      const s = api.encode(l, p);
      return api.encode(api.decode(s, p), p) === s && api.encodeFlat(api.decodeFlat(s, p), p) === s;
    })));

  test(`${name}: lnglat is the same string with flipped tuples`, () =>
    check(fc.property(anyLine, (l) => {
      if (!fits(l, 5)) return true;
      const flipped = l.map(([a, b]) => [b, a]);
      return api.encode(flipped, { order: 'lnglat' }) === api.encode(l);
    })));

  test(`${name}: strict mode rejects every truncation`, () =>
    check(fc.property(longLine, (l) => {
      const s = ref.encode(l, 5);
      // Lengths where a point ends: those cuts are valid shorter lines.
      const ends = new Set([0]);
      for (let i = 0, k = 0; i < s.length; i++) if (s.charCodeAt(i) < 95 && ++k % 2 == 0) ends.add(i + 1);
      for (let n = 1; n < s.length; n++) {
        let code = null;
        try {
          api.decode(s.slice(0, n));
        } catch (e) {
          code = e.code;
        }
        if (ends.has(n) ? code !== null : code !== 'truncated') return false;
      }
      return true;
    }), { numRuns: 30 }));

  test(`${name}: any string decodes like the reference, or throws like it`, () =>
    check(fc.property(fc.oneof(fc.string({ maxLength: 200 }), fc.stringMatching(/^[?-~]{0,300}$/)), (s) => {
      let want, got;
      try {
        want = ref.decode(s, 5);
      } catch {
        want = 'throws';
      }
      try {
        got = api.decode(s, 5);
      } catch (e) {
        ok(e.name == 'PolylineError', e.message);
        got = 'throws';
      }
      // The reference has no 2^53 limit, so a string that overflows only
      // throws here. Everything else must agree exactly.
      if (got == 'throws' && want != 'throws') return want.some((p) => p.some((v) => Math.abs(v) * 1e5 > 2 ** 52));
      eq(got, want);
      return true;
    })));

  test(`${name}: lenient decode never throws on any string`, () =>
    check(fc.property(fc.string({ maxLength: 300 }), (s) => Array.isArray(api.decode(s, { strict: false })))));
}

test('every entry gives the same output', () =>
  check(fc.property(anyLine, precision, (l, p) => {
    if (!fits(l, p)) return true;
    const s = all[0].api.encode(l, p);
    return all.every(({ api }) => api.encode(l, p) === s) && all.every(({ api }) => JSON.stringify(api.decode(s, p)) === JSON.stringify(all[0].api.decode(s, p)));
  })));
