// Fixtures for Node, Bun and Deno: the generated ones from
// fixtures-core.js plus the real-world CSV read from disk.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeFixtures, makeFlexFixtures } from './fixtures-core.js';

export { rng, ANCHORS, gpsTrack, makeFixtures, makeFlexFixtures } from './fixtures-core.js';

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

/** See makeFixtures in fixtures-core.js. */
export const benchFixtures = (precision = 5) => makeFixtures(precision, precision === 5 ? realWorldLines() : []);

/** The same lines in HERE's Flexible Polyline format. */
export const flexFixtures = (precision, encode) => makeFlexFixtures(precision, precision === 5 ? realWorldLines() : [], encode);
