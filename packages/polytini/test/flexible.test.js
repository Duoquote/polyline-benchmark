// Tests for the HERE Flexible Polyline entry (src/flexible.js): the official
// test data, an independent BigInt version of the spec, and agreement with
// the official @here/flexpolyline package.
import { test, eq, near, throws, ok } from './lib.js';
import { createRequire } from 'node:module';
import * as F from '../src/flexible.js';
import { PolylineError } from '../src/core.js';

const here = createRequire(import.meta.url)('@here/flexpolyline');

async function text(path) {
  const url = new URL(path, import.meta.url);
  if (globalThis.Deno) return Deno.readTextFile(url);
  const { readFile } = await import('node:fs/promises');
  return readFile(url, 'utf8');
}
const lines = async (name) => (await text(`fixtures/flexible/${name}.txt`)).split(/\r?\n/).filter(Boolean);

// mulberry32, the same PRNG the benchmark fixtures use.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The spec, written to be easy to check rather than fast: BigInt values,
// rounding half away from zero, sums in integers and one division per value.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function specUint(v) {
  let s = '';
  for (; v > 31n; v >>= 5n) s += ALPHABET[Number((v & 31n) | 32n)];
  return s + ALPHABET[Number(v)];
}
const specRound = (x) => BigInt(Math.sign(x) * Math.round(Math.abs(x)));
function specEncode({ polyline, precision = 5, thirdDim = 0, thirdDimPrecision = 0 }) {
  let s = specUint(1n) + specUint(BigInt((thirdDimPrecision << 7) | (thirdDim << 4) | precision));
  const last = [0n, 0n, 0n], d = thirdDim ? 3 : 2;
  for (const p of polyline) {
    for (let a = 0; a < d; a++) {
      const v = specRound(p[a] * 10 ** (a < 2 ? precision : thirdDimPrecision));
      s += specIntChars(v - last[a]);
      last[a] = v;
    }
  }
  return s;
}
const specIntChars = (v) => specUint(v < 0n ? -2n * v - 1n : 2n * v);
function specValues(str) {
  const out = [];
  let v = 0n, shift = 0n;
  for (const ch of str) {
    const c = BigInt(ALPHABET.indexOf(ch));
    v |= (c & 31n) << shift;
    if (c & 32n) shift += 5n;
    else {
      out.push(v);
      v = shift = 0n;
    }
  }
  return out;
}
function specDecode(str) {
  const [version, h, ...data] = specValues(str);
  ok(version === 1n);
  const header = Number(h), precision = header & 15, thirdDim = (header >> 4) & 7, thirdDimPrecision = header >> 7;
  const d = thirdDim ? 3 : 2, sum = [0n, 0n, 0n], polyline = [];
  for (let i = 0; i < data.length; i += d) {
    const pt = [];
    for (let a = 0; a < d; a++) {
      const u = data[i + a];
      sum[a] += u & 1n ? -((u + 1n) >> 1n) : u >> 1n;
      pt.push(Number(sum[a]) / Number(10n ** BigInt(a < 2 ? precision : thirdDimPrecision)));
    }
    polyline.push(pt);
  }
  return { precision, thirdDim, thirdDimPrecision, polyline };
}

// The text format of the official test data:
//   2d: {(precision); [(lat, lng), ..., ]}
//   3d: {(precision, thirdDimPrecision, thirdDim); [(lat, lng, z), ..., ]}
function parseLine(line) {
  const [head, body] = line.replace(/[ {}[\]]/g, '').slice(0, -1).split(';');
  const [precision, thirdDimPrecision = 0, thirdDim = 0] = head.slice(1, -1).split(',').map(Number);
  const polyline = body.split('),(').map((p) => p.replace(/[()]/g, '').split(',').map(Number));
  return { precision, thirdDim, thirdDimPrecision, polyline };
}
// Prints a decoded result the way the data files do, with 15 decimals.
function formatLine({ precision, thirdDim, thirdDimPrecision, polyline }) {
  const head = thirdDim ? `${precision}, ${thirdDimPrecision}, ${thirdDim}` : `${precision}`;
  return `{(${head}); [${polyline.map((p) => `(${p.map((v) => v.toFixed(15)).join(', ')}), `).join('')}]}`;
}

const data = Promise.all(['original', 'round_half_up_encoded', 'round_half_up_decoded'].map(lines));

test('the example from the spec', () => {
  const polyline = [
    [50.1022829, 8.6982122],
    [50.1020076, 8.6956695],
    [50.1006313, 8.691496],
    [50.09878, 8.6875156],
  ];
  eq(F.encode({ polyline, precision: 5 }), 'BFoz5xJ67i1B1B7PzIhaxL7Y');
  eq(F.decode('BFoz5xJ67i1B1B7PzIhaxL7Y'), {
    precision: 5,
    thirdDim: 0,
    thirdDimPrecision: 0,
    polyline: [
      [50.10228, 8.69821],
      [50.10201, 8.69567],
      [50.10063, 8.6915],
      [50.09878, 8.68752],
    ],
  });
});

test('third dimension constants match the official package and the spec', () => {
  for (const k of ['ABSENT', 'LEVEL', 'ALTITUDE', 'ELEVATION']) eq(F[k], here[k], k);
  eq([F.ABSENT, F.LEVEL, F.ALTITUDE, F.ELEVATION, F.RESERVED1, F.RESERVED2, F.CUSTOM1, F.CUSTOM2], [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('encode matches every line of the official round_half_up data', async () => {
  const [original, encoded] = await data;
  eq(original.length, 3072);
  let checked = 0;
  original.forEach((line, i) => {
    const input = parseLine(line);
    if (input.thirdDim == 4 || input.thirdDim == 5) return;
    eq(F.encode(input), encoded[i], `line ${i + 1}`);
    checked++;
  });
  // A quarter of the lines use the reserved types 4 and 5.
  eq(checked, 2304);
});

test('reserved third dimensions: encode refuses them, decode reads them', async () => {
  const [original, encoded, decoded] = await data;
  let seen = 0;
  original.forEach((line, i) => {
    const input = parseLine(line);
    if (input.thirdDim != 4 && input.thirdDim != 5) return;
    throws(() => F.encode(input), 'option');
    const out = F.decode(encoded[i]);
    eq(out.thirdDim, input.thirdDim);
    eq(formatLine(out), decoded[i], `line ${i + 1}`);
    seen++;
  });
  eq(seen, 768);
});

test('decode matches every line of the official decoded data, to all 15 printed decimals', async () => {
  const [, encoded, decoded] = await data;
  encoded.forEach((str, i) => eq(formatLine(F.decode(str)), decoded[i], `line ${i + 1}`));
});

test('decode agrees exactly with the BigInt spec decoder on the official data', async () => {
  const [, encoded] = await data;
  for (const str of encoded) eq(F.decode(str), specDecode(str), str);
});

test('header reads the header alone', async () => {
  const [original, encoded] = await data;
  original.forEach((line, i) => {
    const { precision, thirdDim, thirdDimPrecision } = parseLine(line);
    eq(F.header(encoded[i]), { precision, thirdDim, thirdDimPrecision });
  });
});

test('re-encoding decoded official data gives the same string up to precision 12', async () => {
  // Past 2^53 a value divided by 10 ** 15 and multiplied back can land on a
  // neighbouring float, so the round trip is only exact while values fit.
  const [original, encoded] = await data;
  original.forEach((line, i) => {
    const { precision, thirdDim, thirdDimPrecision } = parseLine(line);
    if (thirdDim == 4 || thirdDim == 5 || precision > 12 || (thirdDim && thirdDimPrecision > 12)) return;
    eq(F.encode(F.decode(encoded[i])), encoded[i], `line ${i + 1}`);
  });
});

// Random GPS-like lines: a start point anywhere, small steps, and a third
// value such as elevation in meters.
function randomLine(rand, n) {
  let lat = rand() * 170 - 85, lng = rand() * 360 - 180, z = rand() * 4000 - 500;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push([lat, lng, z]);
    lat = Math.max(-90, Math.min(90, lat + (rand() - 0.5) * 0.01));
    lng += (rand() - 0.5) * 0.01;
    z += (rand() - 0.5) * 20;
  }
  return out;
}
const DIMS = [0, 1, 2, 3, 6, 7];

test('encode agrees with @here/flexpolyline on random lines', () => {
  // Up to precision 7, the scaled values are far from a .5 tie, where the
  // two differ (see the rounding test below).
  const rand = rng(42);
  for (const precision of [0, 1, 3, 5, 6, 7]) {
    for (const thirdDim of DIMS) {
      for (const thirdDimPrecision of [0, 2, 5]) {
        for (const n of [0, 1, 2, 10, 300]) {
          const input = { polyline: randomLine(rand, n), precision, thirdDim, thirdDimPrecision };
          eq(F.encode(input), here.encode(input), JSON.stringify({ precision, thirdDim, thirdDimPrecision, n }));
        }
      }
    }
  }
});

test('decode agrees with @here/flexpolyline on random lines', () => {
  // The npm release 0.1.0 adds up float deltas, so its last digits drift.
  // Newer reference code and the spec add up integers, like decode here,
  // and the exact comparison is against the spec decoder.
  const rand = rng(43);
  for (const precision of [0, 1, 3, 5, 6, 7, 9, 10]) {
    for (const thirdDim of DIMS) {
      for (const thirdDimPrecision of [0, 2, 5]) {
        const str = here.encode({ polyline: randomLine(rand, 300), precision, thirdDim, thirdDimPrecision });
        const ours = F.decode(str), theirs = here.decode(str);
        eq({ ...ours, polyline: null }, { ...theirs, polyline: null });
        near(ours.polyline, theirs.polyline, 1e-8);
        eq(ours, specDecode(str));
      }
    }
  }
});

test('encode agrees with the spec encoder at every precision', () => {
  const rand = rng(44);
  for (let precision = 0; precision <= 15; precision++) {
    for (const thirdDim of DIMS) {
      for (const thirdDimPrecision of [0, 3, 9, 15]) {
        const input = { polyline: randomLine(rand, 50), precision, thirdDim, thirdDimPrecision };
        const str = F.encode(input);
        eq(str, specEncode(input), JSON.stringify({ precision, thirdDim, thirdDimPrecision }));
        eq(F.decode(str), specDecode(str));
      }
    }
  }
});

test('round trips', () => {
  const rand = rng(45);
  for (const precision of [0, 4, 5, 6, 9, 12]) {
    for (const thirdDim of DIMS) {
      const polyline = randomLine(rand, 100), thirdDimPrecision = 2;
      const str = F.encode({ polyline, precision, thirdDim, thirdDimPrecision });
      const out = F.decode(str);
      eq(out.polyline.length, 100);
      near(out.polyline, polyline.map((p) => (thirdDim ? p : p.slice(0, 2))), 0.5 / 10 ** Math.min(precision, thirdDim ? 2 : 15) + 1e-12);
      eq(F.encode(out), str);
    }
  }
});

test('decode is exact for values of every length, from 1 to 13 characters', () => {
  // Random 64-bit deltas take the fast loop (up to 10 characters) and the
  // BigInt path (11 to 13), in both 2D and 3D.
  const rand = rng(46);
  const big = () => {
    const bits = 1 + Math.floor(rand() * 63);
    let v = 0n;
    for (let b = 0; b < bits; b += 16) v = (v << 16n) | BigInt(Math.floor(rand() * 65536));
    v &= (1n << BigInt(bits)) - 1n;
    return rand() < 0.5 ? -v : v;
  };
  for (let round = 0; round < 200; round++) {
    const three = round % 2, wide = round % 3 == 0, d = three ? 3 : 2;
    let str = 'B' + specUint(BigInt((3 << 7) | (three << 4) | (round % 16)));
    // Keep the sums within 64 bits: a few large values, many small ones.
    for (let i = 0; i < 40 * d; i++) str += specIntChars(wide && i % 7 == 0 ? big() / 64n : BigInt(Math.floor(rand() * 2000) - 1000));
    eq(F.decode(str), specDecode(str), str);
  }
  // The largest value: 2^64 - 1 as an unsigned varint.
  const max = 'BF' + specUint((1n << 64n) - 1n) + 'A';
  eq(F.decode(max), specDecode(max));
});

test('decode stays exact when large deltas add up past 2^53', () => {
  // 10 character values near 2^48, all positive in one string, so 64 of
  // them per axis add up past 2^53, and alternating in the other. Plain float
  // sums get most results of the first string wrong in the last bits.
  const rand = rng(48);
  for (const alternate of [false, true]) {
    let str = 'BF';
    for (let i = 0; i < 128; i++) {
      const v = (1n << 48n) + BigInt(Math.floor(rand() * 2 ** 30)) * 2n ** 17n + 1n;
      str += specIntChars(alternate && i % 4 > 1 ? -v : v);
    }
    eq(F.decode(str), specDecode(str));
  }
});

test('the fast and the exact encoder round the same way', () => {
  // Flat arrays always take the exact encoder, arrays of points the fast
  // loop when values fit. Values are near .5 ties and near the fast loop's
  // 2^29 limit.
  const rand = rng(49);
  for (let precision = 0; precision <= 8; precision++) {
    const polyline = [];
    for (let i = 0; i < 200; i++) {
      const base = [0, 1, 2 ** 20, 2 ** 29 - 2, 2 ** 29][i % 5] + Math.floor(rand() * 4);
      const frac = [0.5, 0.49999999999, 0.50000000001, rand()][i % 4];
      polyline.push([(base + frac) / 10 ** precision, -(base + frac) / 10 ** precision, (rand() - 0.5) * 2000]);
    }
    for (const thirdDim of [0, 2]) {
      const o = { precision, thirdDim, thirdDimPrecision: 3 }, pts = thirdDim ? polyline : polyline.map((p) => p.slice(0, 2));
      const str = F.encode(pts, o);
      eq(F.encode(pts.flat(), o), str, String(precision));
      eq(str, specEncode({ polyline: pts, ...o }), String(precision));
    }
  }
});

test('values past 2^53 at precision 15', () => {
  const polyline = [
    [89.123456789012345, 179.98765432109876, 8848.86],
    [-89.99999999999999, -179.999999999999, -10994.5],
  ];
  const input = { polyline, precision: 15, thirdDim: F.ALTITUDE, thirdDimPrecision: 14 };
  const str = F.encode(input);
  eq(str, specEncode(input));
  eq(F.decode(str), specDecode(str));
  eq(F.decode(str).polyline[0][0], 89.123456789012345);
});

test('rounds half away from zero, like the official round_half_up data', () => {
  // @here/flexpolyline uses Math.round, which rounds -0.5 to 0. The
  // official round_half_up data, like Rust's f64::round, has -1.
  // Only exact ties of negative values differ.
  eq(F.encode({ polyline: [[0.5, -0.5], [1.5, -1.5], [2.5, -2.5]], precision: 0 }), specEncode({ polyline: [[0.5, -0.5], [1.5, -1.5], [2.5, -2.5]], precision: 0 }));
  eq(F.decode(F.encode({ polyline: [[0.5, -0.5], [-2.5, 2.5]], precision: 0 })).polyline, [[1, -1], [-3, 3]]);
  eq(here.decode(here.encode({ polyline: [[0.5, -0.5]], precision: 0 })).polyline, [[1, 0]]);
  eq(F.decode(F.encode({ polyline: [[-0.15, 0.15]], precision: 1 })).polyline, [[-0.2, 0.2]]);
  // Adding 0.5 and flooring would round 2^52 + 1 up to 2^52 + 2.
  eq(F.decode(F.encode({ polyline: [[(2 ** 52 + 1) / 1e15, 0]], precision: 15 })).polyline[0][0] * 1e15, 2 ** 52 + 1);
});

test('encode takes points with options, and flat arrays', () => {
  const rand = rng(47);
  for (const thirdDim of [0, 3]) {
    const polyline = randomLine(rand, 20).map((p) => (thirdDim ? p : p.slice(0, 2)));
    const o = { precision: 6, thirdDim, thirdDimPrecision: 1 }, want = F.encode({ polyline, ...o });
    eq(F.encode(polyline, o), want);
    eq(F.encode(polyline.flat(), o), want);
    eq(F.encode(Float64Array.from(polyline.flat()), o), want);
    eq(F.encode({ polyline: polyline.flat(), ...o }), want);
    // Options win over the fields of the object.
    eq(F.encode({ polyline, precision: 2, thirdDim, thirdDimPrecision: 1 }, { precision: 6 }), want);
  }
  eq(F.encode([[1, 2]]), here.encode({ polyline: [[1, 2]] }));
  eq(F.encode([]), 'BF');
  eq(F.encode({ polyline: [] }), 'BF');
  eq(F.decode('BF').polyline, []);
});

test('encode ignores a third value when thirdDim is ABSENT, like the reference', () => {
  eq(F.encode({ polyline: [[1, 2, 3]] }), here.encode({ polyline: [[1, 2, 3]] }));
});

test('decode errors', () => {
  throws(() => F.decode(null), 'input');
  throws(() => F.decode(42), 'input');
  throws(() => F.decode(''), 'truncated');
  throws(() => F.decode('B'), 'truncated');
  throws(() => F.decode('Bh'), 'truncated');
  eq(throws(() => F.decode('CF'), 'version').index, 0);
  throws(() => F.decode('AF'), 'version');
  throws(() => F.decode('B' + specUint(2048n)), 'version');
  throws(() => F.decode('B' + 'g'.repeat(300) + 'A'), 'version');
  throws(() => F.decode('g'.repeat(300) + 'BF'), 'version');
  throws(() => F.decode('!F'), 'char');
  throws(() => F.decode('Bő'), 'char');
  eq(throws(() => F.decode('BFoz5xJ!7i1B'), 'char').index, 7);
  eq(throws(() => F.decode('BFoz5xJ6Ň7i1B'), 'char').index, 8);
  throws(() => F.decode('BFoz5xJ67i1B=='), 'char');
  throws(() => F.decode('BF '), 'char');
  throws(() => F.decode('BFoz5xJ67i1B\n'), 'char');
  throws(() => F.decode('BFoz5xJ67i1B1B7PzIhaxL7'), 'truncated');
  throws(() => F.decode('BFoz5xJ67i1B1B7PzIhaxL'), 'truncated');
  throws(() => F.decode('BFoz5xJ'), 'truncated');
  // 3D: two values are not a point.
  throws(() => F.decode(F.encode({ polyline: [[1, 2, 3]], thirdDim: 3 }).slice(0, -1)), 'truncated');
  // 2^64 and longer values don't fit 64 bits.
  throws(() => F.decode('BF' + specUint(1n << 64n) + 'A'), 'overflow');
  throws(() => F.decode('BF' + 'z'.repeat(20) + 'A'), 'overflow');
  ok(throws(() => F.decode('BFo')) instanceof PolylineError);
});

test('decode accepts a header written with extra characters', () => {
  // 'hA' is 1 with a needless continuation, so the version is still 1.
  eq(F.decode('hAF' + 'oz5xJ67i1B').polyline, [[50.10228, 8.69821]]);
});

test('encode errors', () => {
  const polyline = [[1, 2, 3]];
  for (const precision of [-1, 16, 1.5, '5', NaN]) throws(() => F.encode({ polyline, precision }), 'option', String(precision));
  for (const thirdDimPrecision of [-1, 16, 0.5]) throws(() => F.encode({ polyline, thirdDim: 3, thirdDimPrecision }), 'option');
  for (const thirdDim of [-1, 4, 5, 8, 1.5, '3']) throws(() => F.encode({ polyline, thirdDim }), 'option', String(thirdDim));
  throws(() => F.encode(null), 'input');
  throws(() => F.encode({}), 'input');
  throws(() => F.encode({ polyline: 5 }), 'input');
  throws(() => F.encode([1, 2, 3]), 'input');
  throws(() => F.encode([1, 2], { thirdDim: 3 }), 'input');
  eq(throws(() => F.encode([[1, 2], [NaN, 2]]), 'coordinate').index, 1);
  throws(() => F.encode([[1, 2], [1, Infinity]]), 'coordinate');
  throws(() => F.encode([[1, 2], [1]]), 'coordinate');
  throws(() => F.encode([[1, 2], null]), 'coordinate');
  throws(() => F.encode([[1, 'x']]), 'coordinate');
  eq(throws(() => F.encode({ polyline: [[1, 2, 3], [1, 2]], thirdDim: 3 }), 'coordinate').index, 1);
  throws(() => F.encode([1, NaN]), 'coordinate');
  throws(() => F.encode([[1e300, 0]]), 'overflow');
  throws(() => F.encode([[9e13, 0], [-9e13, 0]], { precision: 5 }), 'overflow');
});
