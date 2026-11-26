// The polytini command line, minus the part that runs it (src/cli.js).
// No dependencies, and only node: built-ins that Node, Bun and Deno all
// have, so the same code runs under each.
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { encode, decode, PolylineError } from './web.js';

// Kept in sync with package.json and jsr.json by test/cli.test.js.
export const VERSION = '0.1.0';

const HELP = `polytini ${VERSION}: encode and decode Google encoded polylines

Usage:
  polytini encode [input] [options]
  polytini decode [input] [options]

Input is the argument, --file <path>, or stdin. Quote polylines on the
command line: they can contain \\ \` | and other shell characters.

  encode reads JSON ([[lat, lng], ...], or GeoJSON), CSV with a header, or
         "lat,lng" lines, and prints one polyline per line.
  decode reads one polyline per line and prints coordinates.

Options:
  -p, --precision <n>  decimal places, 0 to 15 (default 5; OSRM polyline6
                       and Valhalla use 6)
      --lnglat         coordinates are [lng, lat], like GeoJSON (GeoJSON
                       input is always read that way)
      --no-strict      accept malformed input instead of failing
  -f, --format <fmt>   decode output: json (default), geojson, csv or lines
      --file <path>    read input from a file
  -h, --help           show this help
  -v, --version        show the version

Examples:
  polytini decode '_p~iF~ps|U_ulLnnqC_mqNvxq\`@'
  polytini decode -p 6 -f geojson --file route.txt
  echo '[[38.5,-120.2],[40.7,-120.95]]' | polytini encode
  polytini encode --file points.csv
`;

export function parseArgs(argv) {
  const a = { precision: 5, order: 'latlng', strict: true, format: 'json', rest: [] };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i], value = () => argv[++i] ?? die(`${x} needs a value`);
    if (x == '-h' || x == '--help') a.help = true;
    else if (x == '-v' || x == '--version') a.version = true;
    else if (x == '-p' || x == '--precision') a.precision = Number(value());
    else if (x.startsWith('--precision=')) a.precision = Number(x.slice(12));
    else if (x == '--lnglat') a.order = 'lnglat';
    else if (x == '--no-strict') a.strict = false;
    else if (x == '-f' || x == '--format') a.format = value();
    else if (x.startsWith('--format=')) a.format = x.slice(9);
    else if (x == '--file') a.file = value();
    else if (x.startsWith('-') && x.length > 1) die(`unknown option ${x}`);
    else a.rest.push(x);
  }
  return a;
}

class Usage extends Error {}
const die = (m) => {
  throw new Usage(m);
};

// Numbers from one CSV or "lat,lng" line: commas, semicolons, tabs or spaces.
const cells = (line) => line.trim().split(/\s*[,;\t]\s*|\s+/);

/** Parses encode input into lines of [a, b] tuples in the given order. */
export function readPoints(text, order) {
  const t = text.trim();
  if (!t) return [[]];
  if (t[0] == '[' || t[0] == '{') {
    const j = JSON.parse(t);
    if (Array.isArray(j)) return Array.isArray(j[0]?.[0]) ? j : [j];
    // GeoJSON: every LineString, MultiLineString part and polygon ring.
    const out = [], flip = (c) => (order == 'lnglat' ? c : c.map(([x, y]) => [y, x]));
    const walk = (g) => {
      if (!g) return;
      if (g.type == 'Feature') walk(g.geometry);
      else if (g.type == 'FeatureCollection') g.features.forEach(walk);
      else if (g.type == 'GeometryCollection') g.geometries.forEach(walk);
      else if (g.type == 'LineString') out.push(flip(g.coordinates));
      else if (g.type == 'MultiLineString' || g.type == 'Polygon') g.coordinates.forEach((c) => out.push(flip(c)));
      else if (g.type == 'MultiPolygon') g.coordinates.forEach((p) => p.forEach((c) => out.push(flip(c))));
    };
    walk(j);
    if (!out.length) die('no LineString in the GeoJSON input');
    return out;
  }
  // CSV or lines. A header row picks the columns by name; otherwise the
  // first two columns are lat, lng (or lng, lat with --lnglat).
  const rows = t.split(/\r?\n/).filter((l) => l.trim());
  let ia = 0, ib = 1;
  const head = cells(rows[0]).map((c) => c.toLowerCase().replace(/^"|"$/g, ''));
  if (head.some((c) => c && isNaN(c))) {
    rows.shift();
    const find = (...names) => head.findIndex((c) => names.includes(c));
    const lat = find('lat', 'latitude', 'y'), lng = find('lng', 'lon', 'long', 'longitude', 'x');
    if (lat < 0 || lng < 0) die('CSV header needs lat and lng (or lon, longitude) columns');
    [ia, ib] = order == 'lnglat' ? [lng, lat] : [lat, lng];
  }
  return [
    rows.map((r, i) => {
      const c = cells(r);
      if (c.length < 2) die(`line ${i + 1}: expected two numbers, got ${JSON.stringify(r.trim())}`);
      return [Number(c[ia]), Number(c[ib])];
    }),
  ];
}

/** Formats decoded lines. */
export function format(lines, fmt, order) {
  const [a, b] = order == 'lnglat' ? ['lng', 'lat'] : ['lat', 'lng'];
  const many = lines.length > 1;
  switch (fmt) {
    case 'json':
      return JSON.stringify(many ? lines : lines[0]);
    case 'geojson': {
      const geo = (l) => ({ type: 'LineString', coordinates: order == 'lnglat' ? l : l.map(([x, y]) => [y, x]) });
      return JSON.stringify(many ? { type: 'FeatureCollection', features: lines.map((l) => ({ type: 'Feature', properties: {}, geometry: geo(l) })) } : geo(lines[0]));
    }
    case 'csv':
      return [many ? `line,${a},${b}` : `${a},${b}`, ...lines.flatMap((l, i) => l.map((p) => (many ? `${i},` : '') + p.join(',')))].join('\n');
    case 'lines':
      return lines.map((l) => l.map((p) => p.join(',')).join('\n')).join('\n\n');
    default:
      die(`unknown format ${fmt}: use json, geojson, csv or lines`);
  }
}

/** Runs one command and returns the output text (no trailing newline). */
export function run(argv, stdin = () => '') {
  const a = parseArgs(argv);
  if (a.help) return HELP.trimEnd();
  if (a.version) return VERSION;
  const [cmd, arg, extra] = a.rest;
  if (cmd != 'encode' && cmd != 'decode') die(cmd ? `unknown command ${cmd}` : 'expected a command: encode or decode');
  if (extra != null) die('expected one input argument; quote it');
  if (arg != null && a.file) die('give an argument or --file, not both');
  const input = arg ?? (a.file ? readFileSync(a.file, 'utf8') : stdin());
  const o = { precision: a.precision, order: a.order, strict: a.strict };
  if (cmd == 'encode') return readPoints(input, a.order).map((l) => encode(l, o)).join('\n');
  // Polylines never contain whitespace, so one per line, blank lines skipped.
  const strs = input.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  return format(strs.length ? strs.map((s) => decode(s, o)) : [[]], a.format, a.order);
}

/** Runs the CLI with process.argv and stdin, and sets the exit code. */
export function main() {
  try {
    const out = run(process.argv.slice(2), () => readFileSync(0, 'utf8'));
    process.stdout.write(out + '\n');
  } catch (e) {
    const usage = e instanceof Usage;
    process.stderr.write(`polytini: ${e instanceof PolylineError || usage || e instanceof SyntaxError ? e.message : e?.stack ?? e}\n`);
    if (usage) process.stderr.write('Run polytini --help for usage.\n');
    process.exitCode = usage ? 2 : 1;
  }
}
