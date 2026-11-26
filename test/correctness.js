// Round-trip every implementation against the reference codec.
// Plain script with no test framework so it runs the same on Node, Bun and
// Deno. Exits non-zero on any failure that is not listed in KNOWN_ISSUES.
import { implementations } from '../src/implementations.js';
import { gpsTrack, realWorldLines, rng, ANCHORS } from '../src/fixtures.js';
import * as ref from '../src/reference.js';
import * as polytini from '@duoquote/polytini';
import * as polytiniWeb from '@duoquote/polytini/web';
import * as polytiniWasm from '@duoquote/polytini/wasm';

// `${pkg} ${case} p${precision} ${encode|decode}` -> why it fails.
// Kept empty unless a library is wrong in a way we want to document rather
// than hide. A listed issue that starts passing is reported as a failure too,
// so this list can't go stale.
const KNOWN_ISSUES = {};

const TOLERANCE = 1e-9; // degrees; far below the 1e-6 quantum of precision 6

const q = (v, p) => Math.round(v * 10 ** p) / 10 ** p;

// Raw float coordinates (like a phone GPS gives you), with values that sit
// exactly on a rounding tie skipped, since libraries legitimately differ there.
function unquantized(p, n = 500) {
  const rand = rng(42 + p);
  const out = [[0, -179.9832104]]; // the value from Google's documentation
  while (out.length < n) {
    const lat = (rand() * 180 - 90).toFixed(9) * 1;
    const lng = (rand() * 360 - 180).toFixed(9) * 1;
    const nearTie = (v) => Math.abs(Math.abs(v * 10 ** p) % 1 - 0.5) < 1e-3;
    if (!nearTie(lat) && !nearTie(lng)) out.push([lat, lng]);
  }
  return out;
}

// Random lines for the round-trip case: random starts anywhere on the globe,
// random lengths, and steps from one unit up to jumps across the
// antimeridian, quantized to precision p so no value sits on a rounding tie.
const RANDOM_LINES = 3000;
function randomLines(p, count, seed) {
  const rand = rng(seed), lines = [];
  const step = () => {
    const kind = rand();
    const size = kind < 0.6 ? 10 ** -p * Math.floor(rand() * 400) : kind < 0.9 ? rand() * 0.5 : rand() * 180;
    return (rand() < 0.5 ? -1 : 1) * size;
  };
  const clampLat = (v) => Math.max(-90, Math.min(90, v));
  const wrapLng = (v) => ((((v + 180) % 360) + 360) % 360) - 180;
  for (let n = 0; n < count; n++) {
    const len = 1 + Math.floor(rand() * 60);
    let lat = rand() * 180 - 90, lng = rand() * 360 - 180;
    const line = [];
    for (let i = 0; i < len; i++) {
      line.push([q(lat, p), q(lng, p)]);
      lat = clampLat(lat + step());
      lng = wrapLng(lng + step());
    }
    lines.push(line);
  }
  return lines;
}

function cases(p) {
  const u = 10 ** -p;
  const list = [
    { name: 'empty', lines: [[]] },
    { name: 'single point at 0,0', lines: [[[0, 0]]] },
    {
      name: 'negative coordinates',
      lines: [[[-33.86882, 151.20929], [-22.90685, -43.1729], [-0.00001, -0.00001], [-54.80191, -68.30295], [64.14, -21.94]]],
    },
    { name: 'extremes (+-90, +-180)', lines: [[[90, 180], [-90, -180], [0, 0], [-90, 180], [90, -180]]] },
    { name: 'antimeridian crossing', lines: [[[10, 179.99999], [10, -179.99999], [10.00001, 179.99999]]] },
    { name: 'repeated points', lines: [Array.from({ length: 6 }, () => [52.52, 13.405])] },
    { name: 'one-unit steps', lines: [[[0, 0], [u, u], [0, 0], [-u, -u], [q(-u * 2, p), q(u * 3, p)]]] },
    { name: 'unquantized input', lines: [unquantized(p)], quantized: false },
    { name: 'long line (100,000 pts)', lines: [gpsTrack({ points: 100_000, seed: 7, anchor: ANCHORS[3], precision: p })] },
    { name: `random lines (${RANDOM_LINES} lines, seeded)`, lines: randomLines(p, RANDOM_LINES, 9000 + p) },
  ];
  if (p === 5) {
    list.push({ name: "Google's documented example", lines: [[[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]], expect: ['_p~iF~ps|U_ulLnnqC_mqNvxq`@'] });
    list.push({ name: 'real-world (1000 lines)', lines: realWorldLines().map((e) => ref.decode(e, 5)) });
  }
  return list;
}

function sameCoords(actual, expected) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    return `expected ${expected.length} points, got ${Array.isArray(actual) ? actual.length : typeof actual}`;
  }
  for (let i = 0; i < expected.length; i++) {
    for (let k = 0; k < 2; k++) {
      if (!(Math.abs(actual[i][k] - expected[i][k]) <= TOLERANCE)) {
        return `point ${i}: expected ${expected[i]}, got ${actual[i]}`;
      }
    }
  }
  return null;
}

function attempt(fn) {
  try {
    return fn();
  } catch (err) {
    return `threw ${err?.name}: ${err?.message}`;
  }
}

const results = []; // { impl, case, p, op, status, detail }
for (const p of [5, 6]) {
  for (const c of cases(p)) {
    const encoded = c.lines.map((line) => ref.encode(line, p));
    if (c.expect) {
      // Guard the oracle itself.
      if (encoded.join() !== c.expect.join()) throw new Error(`reference codec is wrong on ${c.name}`);
    }
    // Decoded values to compare against: the input quantized to precision p.
    const expectedCoords = encoded.map((e) => ref.decode(e, p));

    for (const impl of implementations) {
      for (const op of ['encode', 'decode']) {
        const base = { impl: impl.name, pkg: impl.pkg, case: c.name, p, op };
        if (!impl[op] || !impl.precisions.includes(p)) {
          results.push({ ...base, status: 'n/a' });
          continue;
        }
        let detail = null;
        for (let i = 0; i < c.lines.length && !detail; i++) {
          detail = attempt(() => {
            // Batch rows take an array of lines: check them one line at a time.
            if (op === 'encode') {
              const native = impl.toNative(c.lines[i].map((pt) => pt.slice()));
              const out = impl.batch ? impl.encode([native], p)[0] : impl.encode(native, p);
              return out === encoded[i] ? null : `line ${i}: got ${JSON.stringify(String(out).slice(0, 40))}, expected ${JSON.stringify(encoded[i].slice(0, 40))}`;
            }
            return sameCoords(impl.fromNative(impl.decode(impl.batch ? [encoded[i]] : encoded[i], p)), expectedCoords[i]);
          });
          if (detail && c.lines.length > 1) detail = `line ${i}: ${detail}`;
        }
        results.push({ ...base, status: detail ? 'fail' : 'pass', detail });
      }
    }
  }
}

// polytini only: what the other libraries don't offer. Odd precisions,
// strict-mode errors, object and GeoJSON input, both orders. Every entry
// point that loads here goes through the same checks.
await polytiniWasm.init();
const extra = []; // { entry, name, detail }
const entries = { default: polytini, web: polytiniWeb, wasm: polytiniWasm };
const codeOf = (fn) => {
  try {
    fn();
    return 'no throw';
  } catch (e) {
    return e.name === 'PolylineError' ? e.code : `${e.name}: ${e.message}`;
  }
};
const google = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const pts = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]];
for (const [entry, api] of Object.entries(entries)) {
  const check = (name, fn) => extra.push({ entry, name, detail: attempt(fn) });
  for (const p of [0, 1, 2, 3, 4, 7, 8, 10, 13]) {
    check(`random lines at precision ${p}`, () => {
      for (const line of randomLines(p, 500, 7000 + p)) {
        const s = ref.encode(line, p);
        if (api.encode(line, p) !== s) return `encode differs on ${JSON.stringify(line).slice(0, 80)}`;
        const d = sameCoords(api.decode(s, p), ref.decode(s, p));
        if (d) return d;
        if (api.encodeFlat(line.flat(), p) !== s) return 'encodeFlat differs';
      }
      return null;
    });
  }
  const expectCode = (name, fn, code) => check(name, () => (codeOf(fn) === code ? null : `expected ${code}, got ${codeOf(fn)}`));
  expectCode('strict: truncated string throws', () => api.decode(google.slice(0, -1)), 'truncated');
  expectCode('strict: odd number of values throws', () => api.decode('_p~iF'), 'truncated');
  expectCode('strict: invalid character throws', () => api.decode('_p~iF ~ps|U'), 'char');
  expectCode('strict: non-ASCII character throws', () => api.decode('_p~iF~ps|U' + String.fromCharCode(0x151) + '?'), 'char');
  expectCode('strict: NaN coordinate throws', () => api.encode([[1, 2], [NaN, 3]]), 'coordinate');
  expectCode('strict: null coordinate throws', () => api.encode([[1, 2], [null, 3]]), 'coordinate');
  expectCode('strict: Infinity throws', () => api.encode([[Infinity, 2]]), 'coordinate');
  expectCode('bad precision throws', () => api.decode(google, 99), 'option');
  check('lenient: truncated string drops the last point', () => sameCoords(api.decode(google.slice(0, -1), { strict: false }), pts.slice(0, 2)));
  check('{lat, lng} objects', () => (api.encode(pts.map(([lat, lng]) => ({ lat, lng }))) === google ? null : 'differs'));
  check('{latitude, longitude} objects', () => (api.encode(pts.map(([latitude, longitude]) => ({ latitude, longitude }))) === google ? null : 'differs'));
  check('objects with a 0 coordinate', () => (api.encode([{ lat: 0, lng: 0 }, { lat: 0, lng: 1 }]) === ref.encode([[0, 0], [0, 1]], 5) ? null : 'differs'));
  check('[lng, lat] order', () => (api.encode(pts.map(([a, b]) => [b, a]), { order: 'lnglat' }) === google ? null : 'differs') ?? sameCoords(api.decode(google, { order: 'lnglat' }), pts.map(([a, b]) => [b, a])));
  check('GeoJSON LineString to and from', () => {
    const line = { type: 'LineString', coordinates: pts.map(([a, b]) => [b, a]) };
    if (api.fromGeoJSON(line) !== google || api.fromGeoJSON({ type: 'Feature', properties: {}, geometry: line }) !== google) return 'fromGeoJSON differs';
    return sameCoords(api.toGeoJSON(google).coordinates, line.coordinates);
  });
  check('rounding: half away from zero, exactly', () => (api.encode([[0.000005, -0.000005], [0.49999999999999994e-5, 0]]) === ref.encode([[0.000005, -0.000005], [0.49999999999999994e-5, 0]], 5) ? null : 'differs'));
}

// Report.
let unexpected = 0;
for (const r of results) {
  const key = `${r.pkg} ${r.case} p${r.p} ${r.op}`;
  const known = KNOWN_ISSUES[key];
  if (r.status === 'fail' && !known) {
    unexpected++;
    console.error(`FAIL ${key}\n     ${r.detail}`);
  } else if (r.status === 'fail') {
    console.log(`known issue: ${key}: ${known}`);
  } else if (r.status === 'pass' && known) {
    unexpected++;
    console.error(`FIXED? ${key} passes now; remove it from KNOWN_ISSUES`);
  }
}

// Markdown summary: one row per implementation, one column per precision/op.
const cols = [
  [5, 'decode'],
  [5, 'encode'],
  [6, 'decode'],
  [6, 'encode'],
];
const caseCount = (p) => cases(p).length;
console.log('\n| Implementation | ' + cols.map(([p, op]) => `${op} p${p}`).join(' | ') + ' |');
console.log('|---|' + cols.map(() => ':-:').join('|') + '|');
for (const impl of implementations) {
  const cells = cols.map(([p, op]) => {
    const rs = results.filter((r) => r.impl === impl.name && r.p === p && r.op === op);
    if (rs.every((r) => r.status === 'n/a')) return 'n/a';
    const passed = rs.filter((r) => r.status === 'pass').length;
    return `${passed}/${caseCount(p)}`;
  });
  console.log(`| ${impl.name} | ${cells.join(' | ')} |`);
}

const extraFailed = extra.filter((x) => x.detail);
for (const x of extraFailed) console.error(`FAIL @duoquote/polytini (${x.entry}) ${x.name}\n     ${x.detail}`);
unexpected += extraFailed.length;
console.log(`\n@duoquote/polytini extra checks: ${extra.length - extraFailed.length}/${extra.length} passed (${Object.keys(entries).join(', ')} entries)`);

const total = results.filter((r) => r.status !== 'n/a').length;
const failed = results.filter((r) => r.status === 'fail').length;
console.log(`\n${total - failed}/${total} checks passed, ${unexpected} unexpected`);
if (unexpected) process.exitCode = 1;
