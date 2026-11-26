// Test vectors collected from other polyline libraries, routing engines and
// Google's documentation: test/fixtures/vectors/*.json. Sources, licenses and
// versions are in test/fixtures/SOURCES.md, and the places where sources
// disagree with each other or with polytini are in
// test/fixtures/vectors/DISAGREEMENTS.md.
//
// Every case runs against every entry point (web, node, bun, deno, wasm).
// A case's `polytini` field, when present, holds what polytini does on
// purpose where the source expects something else; that is what is checked.
// Cases that fit test/reference.js (2D, integer precision, valid options) are
// also checked against it, so the vectors and the oracle agree.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, eq, near, throws, ok, entries, json, AssertionError } from './lib.js';
import * as ref from './reference.js';

const DIR = 'fixtures/vectors/';
const files = readdirSync(fileURLToPath(new URL(DIR, import.meta.url)))
  .filter((f) => f.endsWith('.json'))
  .sort();

/**
 * Cases that fail because of a bug in polytini, so the rest still run. Each
 * item is { file, op, name, entries?, bug }, where `entries` limits it to
 * some entry points. A listed case is still run and must still fail; once
 * the bug is fixed the test asks for the item to be removed.
 */
export const KNOWN_BUGS = [];

const isBug = (file, c, entry) =>
  KNOWN_BUGS.some((b) => b.file == file && b.op == c.op && b.name == c.name && (!b.entries || b.entries.includes(entry)));

// JSON has no NaN, Infinity or -0, so encode inputs spell them as strings.
const NUMBERS = { NaN: NaN, Infinity: Infinity, '-Infinity': -Infinity, '-0': -0 };
const revive = (v) =>
  typeof v == 'string' && v in NUMBERS ? NUMBERS[v]
  : Array.isArray(v) ? v.map(revive)
  : v && typeof v == 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, revive(x)]))
  : v;

/** What polytini must do for a case: its own result where it differs from the source. */
const want = (c) => (c.polytini ? { expected: c.polytini.expected, throws: c.polytini.throws } : { expected: c.expected, throws: c.throws });

const DEFAULT_TOLERANCE = 1e-9;
const dims = (o) => (o && typeof o == 'object' && o.dimensions) || 2;

function check(api, c) {
  const w = want(c);
  const input = c.op == 'encode' ? revive(c.input) : c.input;
  const call = () => (c.op == 'encode' ? api.encode(input, c.options) : api.decode(input, c.options));
  if (w.throws) {
    throws(call, w.throws === true ? undefined : w.throws);
    return;
  }
  if (c.op == 'encode') {
    eq(call(), w.expected);
    // The flat encoder must agree when the points are plain tuples of the right size.
    const d = dims(c.options);
    if (Array.isArray(input) && input.every((p) => Array.isArray(p) && p.length == d)) eq(api.encodeFlat(input.flat(), c.options), w.expected, 'encodeFlat');
  } else {
    const tol = c.tolerance ?? DEFAULT_TOLERANCE;
    near(call(), w.expected, tol);
    near(api.decodeFlat(input, c.options), w.expected.flat(), tol, 'decodeFlat');
  }
}

const label = (c) => `${c.op} "${c.name}"`;
const vectors = [];
for (const file of files) vectors.push({ file, slug: file.slice(0, -5), data: await json(DIR + file) });

for (const { name: entry, api } of await entries()) {
  for (const { file, slug, data } of vectors) {
    test(`vectors: ${slug} on ${entry}`, () => {
      ok(data.cases.length > 0, 'no cases');
      const failures = [];
      for (const c of data.cases) {
        let error;
        try {
          check(api, c);
        } catch (e) {
          error = e;
        }
        if (isBug(file, c, entry)) {
          if (!error) failures.push(`${label(c)} passes now; remove it from KNOWN_BUGS`);
        } else if (error) failures.push(`${label(c)}: ${error.message}`);
      }
      if (failures.length) throw new AssertionError(failures.join('\n  '));
    });
  }
}

// ------------------------------------------------ agreement with reference.js

/** Precision and order when the options fit reference.js, otherwise null. */
function refOptions(o) {
  let precision = 5, lnglat = false;
  if (typeof o == 'number') precision = o;
  else if (o != null) {
    if (Object.keys(o).some((k) => k != 'precision' && k != 'order')) return null;
    if (o.precision != null) precision = o.precision;
    lnglat = o.order == 'lnglat';
  }
  return Number.isInteger(precision) && precision >= 0 && precision <= 15 ? { precision, lnglat } : null;
}
const swap = (pts) => pts.map(([a, b]) => [b, a]);
const finite2D = (pts) => Array.isArray(pts) && pts.every((p) => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));

for (const { slug, data } of vectors) {
  test(`vectors: ${slug} agree with test/reference.js`, () => {
    const failures = [];
    for (const c of data.cases) {
      const o = refOptions(c.options), w = want(c);
      if (!o) continue;
      try {
        if (c.op == 'encode') {
          // reference.js has no input checks, so only valid 2D tuples apply.
          const pts = revive(c.input);
          if (w.throws || !finite2D(pts)) continue;
          eq(ref.encode(o.lnglat ? swap(pts) : pts, o.precision), w.expected);
        } else if (w.throws) {
          // reference.js throws on bad characters and truncation, not on overflow.
          if (w.throws == 'overflow') continue;
          throws(() => ref.decode(c.input, o.precision));
        } else {
          const pts = ref.decode(c.input, o.precision);
          near(o.lnglat ? swap(pts) : pts, w.expected, c.tolerance ?? DEFAULT_TOLERANCE);
        }
      } catch (e) {
        failures.push(`${label(c)}: ${e.message}`);
      }
    }
    if (failures.length) throw new AssertionError(failures.join('\n  '));
  });
}
