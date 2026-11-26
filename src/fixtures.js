// Deterministic fixtures. Everything except the real-world CSV is generated
// from a seeded PRNG using integer arithmetic only, so Node, Bun and Deno all
// produce exactly the same coordinates.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as ref from './reference.js';

// mulberry32
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Start points in all four lat/lng sign quadrants, so negative values and
// both hemispheres show up in the benchmark data, not only in edge cases.
export const ANCHORS = [
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
  { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
];

/**
 * A GPS-like track sampled at roughly 1 Hz: speed drifts between walking and
 * highway pace, heading wanders, and the device sometimes sits still and
 * repeats the same point (traffic lights), which produces zero deltas.
 * Works in integer units of 1e-6 degrees, then quantizes to `precision`.
 * @returns {Array<[number, number]>} [lat, lng] pairs
 */
export function gpsTrack({ points, seed, anchor = ANCHORS[0], precision = 5 }) {
  const rand = rng(seed);
  // 1e-6 deg is about 0.11 m of latitude. 300 units/s is about 120 km/h.
  let lat = Math.round(anchor.lat * 1e6);
  let lng = Math.round(anchor.lng * 1e6);
  let vlat = int(rand, -100, 100);
  let vlng = int(rand, -100, 100);
  let stopped = 0;
  const step = 10 ** (6 - precision);
  const factor = 10 ** precision;
  const out = new Array(points);
  for (let i = 0; i < points; i++) {
    out[i] = [Math.round(lat / step) / factor, Math.round(lng / step) / factor];
    if (stopped > 0) {
      stopped--;
      continue;
    }
    if (int(rand, 0, 199) === 0) stopped = int(rand, 3, 40);
    if (int(rand, 0, 99) === 0) {
      // Sharp turn: swap and flip velocity components.
      const t = vlat;
      vlat = int(rand, 0, 1) ? vlng : -vlng;
      vlng = int(rand, 0, 1) ? t : -t;
    }
    vlat = clamp(vlat + int(rand, -15, 15), -300, 300);
    vlng = clamp(vlng + int(rand, -15, 15), -300, 300);
    lat = clamp(lat + vlat, -90e6, 90e6);
    lng += vlng;
    if (lng > 180e6) lng -= 360e6;
    if (lng < -180e6) lng += 360e6;
  }
  return out;
}

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

/**
 * The 1000 encoded polylines from the original 2021 benchmark: PostGIS
 * ST_AsEncodedPolyline output, precision 5.
 * @returns {string[]}
 */
export function realWorldLines() {
  return readFileSync(here('../fixtures/example.csv'), 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map((line) => line.replace(/^"|"$/g, ''));
}

/**
 * Benchmark fixtures. Each has `coords` (one [lat, lng] array per line) and
 * `encoded` (the matching strings), produced by the reference codec.
 */
export function benchFixtures(precision = 5) {
  const sizes = [10, 100, 1_000, 10_000, 100_000];
  const fixtures = sizes.map((n, i) => {
    const coords = [gpsTrack({ points: n, seed: 1000 + i, anchor: ANCHORS[i % ANCHORS.length], precision })];
    return { name: `${n.toLocaleString('en-US')} pts`, coords, encoded: coords.map((c) => ref.encode(c, precision)) };
  });
  if (precision === 5) {
    const encoded = realWorldLines();
    fixtures.push({ name: 'real-world', coords: encoded.map((e) => ref.decode(e, 5)), encoded });
  }
  for (const f of fixtures) f.points = f.coords.reduce((sum, c) => sum + c.length, 0);
  return fixtures;
}
