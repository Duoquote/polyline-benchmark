// The CLI: run() directly, then the real command in a subprocess.
import { test, eq, ok, throws, json } from './lib.js';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, VERSION } from '../src/cli-lib.js';

const s = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
const pts = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]];
const cli = fileURLToPath(new URL('../src/cli.js', import.meta.url));
const runtime = globalThis.Deno ? [Deno.execPath(), ['run', '-A', cli]] : [process.execPath, [cli]];
const sh = (args, input) => spawnSync(runtime[0], [...runtime[1], ...args], { input, encoding: 'utf8' });

test('version matches package.json and jsr.json', async () => {
  eq(VERSION, (await json('../package.json')).version);
  eq(VERSION, (await json('../jsr.json')).version);
  eq(run(['--version']), VERSION);
  eq(run(['-v']), VERSION);
});

test('help', () => {
  const h = run(['--help']);
  ok(h.startsWith(`polytini ${VERSION}`) && h.includes('--precision') && h.includes('--lnglat') && h.includes('--no-strict'));
  eq(run(['-h']), h);
});

test('decode formats', () => {
  eq(run(['decode', s]), JSON.stringify(pts));
  eq(run(['decode', s, '-f', 'json']), JSON.stringify(pts));
  eq(JSON.parse(run(['decode', s, '--format=geojson'])), { type: 'LineString', coordinates: pts.map(([a, b]) => [b, a]) });
  eq(run(['decode', s, '-f', 'csv']), 'lat,lng\n38.5,-120.2\n40.7,-120.95\n43.252,-126.453');
  eq(run(['decode', s, '-f', 'csv', '--lnglat']), 'lng,lat\n-120.2,38.5\n-120.95,40.7\n-126.453,43.252');
  eq(run(['decode', s, '-f', 'lines']), '38.5,-120.2\n40.7,-120.95\n43.252,-126.453');
  eq(run(['decode', '']), '[]');
});

test('decode several lines', () => {
  const two = `${s}\n\n${s}\n`;
  eq(JSON.parse(run(['decode'], () => two)), [pts, pts]);
  eq(JSON.parse(run(['decode', '-f', 'geojson'], () => two)).features.length, 2);
  ok(run(['decode', '-f', 'csv'], () => two).startsWith('line,lat,lng\n0,38.5,-120.2'));
});

test('decode precision and strictness', () => {
  const s6 = run(['encode', JSON.stringify(pts), '-p', '6']);
  eq(run(['decode', s6, '--precision', '6']), JSON.stringify(pts));
  eq(run(['decode', s6, '--precision=6']), JSON.stringify(pts));
  throws(() => run(['decode', s.slice(0, -1)]), 'truncated');
  eq(run(['decode', s.slice(0, -1), '--no-strict']), JSON.stringify(pts.slice(0, 2)));
});

test('encode inputs', () => {
  eq(run(['encode', JSON.stringify(pts)]), s);
  eq(run(['encode', JSON.stringify(pts.map(([a, b]) => [b, a])), '--lnglat']), s);
  eq(run(['encode', JSON.stringify([pts, pts.slice(0, 1)])]), `${s}\n_p~iF~ps|U`);
  eq(run(['encode'], () => '38.5,-120.2\n40.7,-120.95\n43.252,-126.453\n'), s);
  eq(run(['encode'], () => '38.5 -120.2\n40.7\t-120.95\n43.252; -126.453'), s);
  eq(run(['encode'], () => 'name,lon,lat\na,-120.2,38.5\nb,-120.95,40.7\nc,-126.453,43.252'), s);
  eq(run(['encode'], () => '"Latitude","Longitude"\n38.5,-120.2\n40.7,-120.95\n43.252,-126.453'), s);
  const line = { type: 'LineString', coordinates: pts.map(([a, b]) => [b, a]) };
  eq(run(['encode', JSON.stringify(line)]), s);
  eq(run(['encode', JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', geometry: line }, { type: 'Feature', geometry: { type: 'MultiLineString', coordinates: [line.coordinates] } }] })]), `${s}\n${s}`);
  eq(run(['encode', '']), '');
  const ring = [[0, 0], [1, 0], [1, 1], [0, 0]];
  eq(run(['encode', JSON.stringify({ type: 'Polygon', coordinates: [ring] })]).split('\n').length, 1);
  eq(run(['encode', JSON.stringify({ type: 'MultiPolygon', coordinates: [[ring], [ring]] })]).split('\n').length, 2);
  eq(run(['encode', JSON.stringify({ type: 'GeometryCollection', geometries: [line, line] })]), `${s}\n${s}`);
  ok(run(['encode', JSON.stringify([[1, 2]]), '--lnglat']) == run(['encode', JSON.stringify([[2, 1]])]));
});

test('errors', () => {
  for (const args of [[], ['frob'], ['decode', '--frob'], ['decode', '-p'], ['decode', 'a', 'b'], ['decode', s, '-f', 'xml']]) {
    let e;
    try {
      run(args);
    } catch (x) {
      e = x;
    }
    ok(e && !e.code, `${args.join(' ')} should be a usage error`);
  }
  throws(() => run(['encode', '[[1, 2], [3]]']), 'coordinate');
  throws(() => run(['encode', 'name,x\n1,2']), undefined);
  throws(() => run(['decode', s, '-p', '99']), 'option');
});

test('the real command: argument, stdin, file and exit codes', () => {
  let r = sh(['decode', s]);
  eq([r.status, r.stdout], [0, JSON.stringify(pts) + '\n'], r.stderr);
  r = sh(['encode'], JSON.stringify(pts));
  eq([r.status, r.stdout], [0, s + '\n'], r.stderr);
  const dir = mkdtempSync(join(tmpdir(), 'polytini-'));
  try {
    writeFileSync(join(dir, 'in.txt'), s + '\n');
    r = sh(['decode', '--file', join(dir, 'in.txt'), '-f', 'lines']);
    eq([r.status, r.stdout], [0, '38.5,-120.2\n40.7,-120.95\n43.252,-126.453\n'], r.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  r = sh(['decode', 'ab!']);
  eq(r.status, 1);
  ok(r.stderr.includes('Invalid character at 2'), r.stderr);
  r = sh(['nope']);
  eq(r.status, 2);
  ok(r.stderr.includes('--help'));
  r = sh(['--version']);
  eq(r.stdout.trim(), VERSION);
});
