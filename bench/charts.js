// Static SVG charts and badges from results/*.json, no dependencies:
//
//   node bench/charts.js        (npm run charts)
//
// Writes docs/charts/<name>-light.svg and -dark.svg (each with its own
// background, so either one reads on any page; READMEs pick one with
// <picture> and prefers-color-scheme), and docs/badges/*.svg.
//
// Colors follow the dataviz palette: polytini in the first categorical blue,
// every other library a recessive gray, so the chart is about one thing.
// The line charts use the first three slots (blue, orange, aqua), which
// pass the colorblind checks as a set in both modes; their lines carry
// direct labels, because orange and aqua are under 3:1 on white. Values are
// never only in the chart: every one is in the tables in docs/results.md.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BASELINE, COLS, colLabel, ops, times, bytes, ranked, groups } from './report.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const results = `${root}results/`, out = `${root}docs/charts/`, badgeDir = `${root}docs/badges/`;
mkdirSync(out, { recursive: true });
mkdirSync(badgeDir, { recursive: true });

const THEMES = {
  light: { surface: '#ffffff', text: '#191919', muted: '#666666', grid: '#e6e6e6', bar: '#c2c2c2', ours: '#257de0', series: ['#257de0', '#f47230', '#00b894'] },
  dark: { surface: '#191919', text: '#efefef', muted: '#9c9c9c', grid: '#333333', bar: '#5c5c5c', ours: '#338ced', series: ['#338ced', '#e76624', '#00a888'] },
};
const FONT = "font-family=\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif\"";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isOurs = (n) => n.startsWith('@duoquote/polytini@');
// Short names: drop the version, keep polytini's variant.
const short = (n) => n.replace(/@\d[^ ]*/, '');
const textW = (s, size = 12) => s.length * size * 0.56;

const runtimes = [
  ['bun', 'Bun'], ['node-22', 'Node 22'], ['node-23', 'Node 23'], ['node-24', 'Node 24'], ['node-25', 'Node 25'], ['node-26', 'Node 26'], ['deno', 'Deno'], ['browser', 'Chrome'],
].filter(([f]) => existsSync(`${results}${f}.json`));
const load = (f) => JSON.parse(readFileSync(`${results}${f}.json`, 'utf8'));
const value = (r) => r?.opsPerSec ?? (r ? (r.mptsPerSec * 1e6) / r.points : undefined);

function svg(t, w, h, title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d" ${FONT}>
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
<rect width="${w}" height="${h}" rx="6" fill="${t.surface}"/>
${body}
</svg>
`;
}

// A horizontal bar: square at the baseline, 4px rounded at the data end.
function bar(x, y, w, h, fill, tip) {
  const r = Math.min(4, w / 2, h / 2);
  const d = w < 1 ? '' : `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - r}z`;
  return d ? `<path d="${d}" fill="${fill}"><title>${esc(tip)}</title></path>` : '';
}

/** Sorted horizontal bars with an optional reference line at `ref`. */
function barChart(t, { title, subtitle, rows, fmt, ref, refLabel, note }) {
  const labelW = Math.max(...rows.map((r) => textW(r.label))) + 24, plotW = 360, valueW = 70;
  const W = Math.round(labelW + plotW + valueW + 24), rowH = 24, top = 58, H = top + rows.length * rowH + (note ? 40 : 24);
  const max = Math.max(...rows.map((r) => r.value), ref ?? 0) * 1.05;
  const x = (v) => labelW + (v / max) * plotW;
  let body = `<text x="16" y="24" font-size="15" font-weight="600" fill="${t.text}">${esc(title)}</text>
<text x="16" y="43" font-size="12" fill="${t.muted}">${esc(subtitle)}</text>\n`;
  rows.forEach((r, i) => {
    const y = top + i * rowH, ours = isOurs(r.name);
    body += `<text x="${labelW - 10}" y="${y + 15}" font-size="12" text-anchor="end" fill="${t.text}"${ours ? ' font-weight="600"' : ''}>${esc(r.label)}</text>\n`;
    body += bar(labelW, y + 4, Math.max(0, x(r.value) - labelW), 14, ours ? t.ours : t.bar, `${r.label}: ${fmt(r.value)}`) + '\n';
    body += `<text x="${x(r.value) + 6}" y="${y + 15}" font-size="12" fill="${t.text}">${esc(fmt(r.value))}</text>\n`;
  });
  if (ref) {
    const rx = x(ref).toFixed(1), y1 = top - 4, y2 = top + rows.length * rowH;
    body += `<line x1="${rx}" y1="${y1}" x2="${rx}" y2="${y2}" stroke="${t.muted}" stroke-width="1"/>\n`;
    body += `<text x="${rx}" y="${y2 + 14}" font-size="11" text-anchor="middle" fill="${t.muted}">${esc(refLabel)}</text>\n`;
  }
  if (note) body += `<text x="16" y="${H - 12}" font-size="11" fill="${t.muted}">${esc(note)}</text>\n`;
  return svg(t, W, H, title, `${subtitle}. ${rows.map((r) => `${r.label} ${fmt(r.value)}`).join(', ')}.`, body);
}

/** Calls per second across sizes, log scale, polytini and the two fastest others. */
function lineChart(t, { title, subtitle, series, sizes }) {
  const W = 720, H = 350, L = 64, R = 190, T = 82, B = 44;
  // Round tick labels on the log axis: 100, 1k, 10k, 1M.
  const tick = (v) => (v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : `${v}`);
  const all = series.flatMap((s) => s.points.filter(Boolean));
  const lo = Math.floor(Math.log10(Math.min(...all))), hi = Math.ceil(Math.log10(Math.max(...all)));
  const x = (i) => L + (i / (sizes.length - 1)) * (W - L - R);
  const y = (v) => T + (1 - (Math.log10(v) - lo) / (hi - lo)) * (H - T - B);
  let body = `<text x="16" y="24" font-size="15" font-weight="600" fill="${t.text}">${esc(title)}</text>
<text x="16" y="43" font-size="12" fill="${t.muted}">${esc(subtitle)}</text>\n`;
  for (let e = lo; e <= hi; e++) {
    body += `<line x1="${L}" y1="${y(10 ** e)}" x2="${W - R}" y2="${y(10 ** e)}" stroke="${t.grid}" stroke-width="1"/>`;
    body += `<text x="${L - 8}" y="${y(10 ** e) + 4}" font-size="11" text-anchor="end" fill="${t.muted}">${tick(10 ** e)}</text>\n`;
  }
  sizes.forEach((s, i) => (body += `<text x="${x(i)}" y="${H - B + 18}" font-size="11" text-anchor="middle" fill="${t.muted}">${esc(s.replace(' pts', ''))}</text>`));
  body += `<text x="${(L + W - R) / 2}" y="${H - 8}" font-size="11" text-anchor="middle" fill="${t.muted}">points per line</text>\n`;
  // End labels: one per line, pushed apart by at least 15px with a leader line.
  const ends = series.map((s, k) => ({ k, y: y(s.points[s.points.length - 1]) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i].ly = Math.max(ends[i].y, (ends[i - 1].ly ?? ends[i - 1].y) + 15);
  ends[0].ly = ends[0].y;
  series.forEach((s, k) => {
    const c = t.series[k], pts = s.points.map((v, i) => [x(i), y(v)]);
    body += `<polyline points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')}" fill="none" stroke="${c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>\n`;
    pts.forEach(([px, py], i) => (body += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${c}" stroke="${t.surface}" stroke-width="2"><title>${esc(`${s.label}, ${sizes[i]}: ${ops(s.points[i])} calls/s`)}</title></circle>`));
    const e = ends.find((q) => q.k === k), ex = W - R + 10;
    if (Math.abs(e.ly - e.y) > 1) body += `<line x1="${W - R + 4}" y1="${e.y}" x2="${ex}" y2="${e.ly}" stroke="${t.muted}" stroke-width="1"/>`;
    body += `<text x="${ex + 4}" y="${e.ly + 4}" font-size="12" fill="${t.text}"${k === 0 ? ' font-weight="600"' : ''}>${esc(s.label)}</text>\n`;
  });
  // Legend, top right: a short line key beside each name.
  series.forEach((s, k) => {
    const lx = 16 + k * 210;
    body += `<line x1="${lx}" y1="62" x2="${lx + 18}" y2="62" stroke="${t.series[k]}" stroke-width="2"/><text x="${lx + 24}" y="66" font-size="11" fill="${t.text}">${esc(s.label)}</text>`;
  });
  return svg(t, W, H, title, `${subtitle}. ${series.map((s) => `${s.label}: ${s.points.map((v, i) => `${sizes[i]} ${ops(v)}`).join(', ')}`).join('; ')}.`, body);
}

/** One panel per size: relative speed of the top libraries. */
function multiples(t, { title, subtitle, panels, fmt }) {
  const cols = 3, pw = 300, rowH = 18, labelW = 150, n = panels[0].rows.length, ph = 30 + n * rowH;
  const W = cols * pw + 24, H = 60 + Math.ceil(panels.length / cols) * (ph + 16);
  let body = `<text x="16" y="24" font-size="15" font-weight="600" fill="${t.text}">${esc(title)}</text>
<text x="16" y="43" font-size="12" fill="${t.muted}">${esc(subtitle)}</text>\n`;
  panels.forEach((p, i) => {
    const ox = 12 + (i % cols) * pw, oy = 60 + Math.floor(i / cols) * (ph + 16), plot = pw - labelW - 56;
    const max = Math.max(1, ...p.rows.map((r) => r.value)) * 1.05, xx = (v) => ox + labelW + (v / max) * plot;
    body += `<text x="${ox}" y="${oy + 12}" font-size="12" font-weight="600" fill="${t.text}">${esc(colLabel(p.size))}</text>\n`;
    p.rows.forEach((r, j) => {
      const y = oy + 22 + j * rowH;
      body += `<text x="${ox + labelW - 6}" y="${y + 11}" font-size="10.5" text-anchor="end" fill="${t.text}"${isOurs(r.name) ? ' font-weight="600"' : ''}>${esc(r.label)}</text>`;
      body += bar(ox + labelW, y + 2, Math.max(0, xx(r.value) - ox - labelW), 11, isOurs(r.name) ? t.ours : t.bar, `${r.label}, ${p.size}: ${fmt(r.value)}`);
      body += `<text x="${xx(r.value) + 4}" y="${y + 11}" font-size="10.5" fill="${t.text}">${esc(fmt(r.value))}</text>\n`;
    });
    const rx = xx(1).toFixed(1);
    body += `<line x1="${rx}" y1="${oy + 20}" x2="${rx}" y2="${oy + 22 + n * rowH}" stroke="${t.muted}" stroke-width="1"/>\n`;
  });
  return svg(t, W, H, title, `${subtitle}. ${panels.map((p) => `${p.size}: ${p.rows.map((r) => `${r.label} ${fmt(r.value)}`).join(', ')}`).join('; ')}.`, body);
}

const written = [];
function write(name, make) {
  for (const [mode, t] of Object.entries(THEMES)) writeFileSync(`${out}${name}-${mode}.svg`, make(t));
  written.push(name);
}

const label = (n) => (n.startsWith(BASELINE + '@') ? `${short(n)} (baseline)` : short(n));
for (const [file, name] of runtimes) {
  const data = load(file), { main } = groups(data), date = data.env.date;
  const base = [...new Set(main.map((r) => r.impl))].find((n) => n.startsWith(BASELINE + '@'));
  for (const op of ['decode', 'encode']) {
    const rel = (impl, col) => value(main.find((r) => r.impl === impl && r.op === op && r.fixture === col)) / value(main.find((r) => r.impl === base && r.op === op && r.fixture === col));
    const col = 'real-world';
    const rows = ranked(main.filter((r) => r.op === op), op, [col]).map((n) => ({ name: n, label: label(n), value: rel(n, col) })).filter((r) => r.value > 0);
    write(`speed-${file}-${op}`, (t) => barChart(t, {
      title: `${name}: ${op} speed relative to @mapbox/polyline`,
      subtitle: `Calls per second on the real-world lines (median 82 points), @mapbox/polyline = 1.0x. Higher is faster. ${date}.`,
      rows, fmt: times, ref: 1, refLabel: '1.0x',
    }));
    const top = ranked(main.filter((r) => r.op === op), op).slice(0, 8);
    const sizes = COLS.filter((c) => main.some((r) => r.fixture === c && r.op === op));
    write(`sizes-${file}-${op}`, (t) => multiples(t, {
      title: `${name}: ${op} speed at every size, relative to @mapbox/polyline`,
      subtitle: `Calls per second, @mapbox/polyline = 1.0x (the vertical line). The 8 fastest libraries overall. ${date}.`,
      panels: sizes.map((size) => ({ size, rows: ranked(main.filter((r) => r.op === op && top.includes(r.impl)), op, [size]).map((n) => ({ name: n, label: label(n), value: rel(n, size) })).filter((r) => r.value > 0) })),
      fmt: times,
    }));
    const lineSizes = COLS.filter((c) => c !== 'real-world');
    const ours = main.find((r) => r.op === op && /^@duoquote\/polytini@[^ ]+$/.test(r.impl))?.impl;
    const rivals = ranked(main.filter((r) => r.op === op && !isOurs(r.impl)), op, lineSizes).slice(0, 2);
    const get = (n) => lineSizes.map((c) => value(main.find((r) => r.impl === n && r.op === op && r.fixture === c)));
    if (ours) write(`ops-${file}-${op}`, (t) => lineChart(t, {
      title: `${name}: ${op} calls per second by line length`,
      subtitle: `polytini against the two fastest other libraries here. Log scale, higher is faster. ${date}.`,
      sizes: lineSizes, series: [ours, ...rivals].map((n) => ({ label: short(n), points: get(n) })),
    }));
  }
}

// Memory: allocated per call at 10,000 points, relative to the baseline.
for (const f of readdirSync(results).filter((x) => /^memory-.*\.json$/.test(x))) {
  const mem = JSON.parse(readFileSync(results + f, 'utf8')), rt = mem.env.runtimeLabel, key = f.replace(/^memory-|\.json$/g, '');
  for (const op of ['decode', 'encode']) {
    const rows0 = mem.results.filter((r) => r.op === op && r.fixture === '10,000 pts');
    const base = rows0.find((r) => r.impl.startsWith(BASELINE + '@'));
    if (!base) continue;
    const rows = rows0.map((r) => ({ name: r.impl, label: label(r.impl), value: r.allocated / base.allocated })).filter((r) => r.value > 0).sort((a, b) => a.value - b.value);
    write(`memory-${key}-${op}`, (t) => barChart(t, {
      title: `${rt}: memory allocated per ${op} call, relative to @mapbox/polyline`,
      subtitle: `10,000 points, heap plus typed arrays and WASM memory, @mapbox/polyline = 1.0x (${bytes(base.allocated)}). Lower is better.`,
      rows, fmt: times, ref: 1, refLabel: '1.0x',
    }));
  }
}

// Bundle size, gzipped, smallest first.
if (existsSync(results + 'size.json')) {
  const size = JSON.parse(readFileSync(results + 'size.json', 'utf8'));
  const rows = size.map((r) => ({ name: r.name, label: short(r.name), value: r.gzip })).sort((a, b) => a.value - b.value);
  write('size', (t) => barChart(t, {
    title: 'Bundle size, gzipped',
    subtitle: 'What the import pulls into a browser bundle: esbuild, minified, gzip level 9. Smaller is better.',
    rows, fmt: bytes,
  }));
}

// Badges, in shields.io's flat style.
function badge(labelText, valueText, color) {
  const lw = Math.round(textW(labelText, 11) + 10), vw = Math.round(textW(valueText, 11) + 10), w = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(labelText)}: ${esc(valueText)}"><title>${esc(labelText)}: ${esc(valueText)}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/><rect width="${w}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"><text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(labelText)}</text><text x="${lw / 2}" y="14">${esc(labelText)}</text><text x="${lw + vw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(valueText)}</text><text x="${lw + vw / 2}" y="14">${esc(valueText)}</text></g></svg>\n`;
}
if (runtimes.length) {
  const bun = load(runtimes[0][0]), libs = new Set(groups(bun).main.map((r) => r.impl.replace(/@\d[^ ]*( \(.*\))?$/, ''))).size;
  writeFileSync(`${badgeDir}libraries.svg`, badge('libraries', `${libs} compared`, '#007ec6'));
  writeFileSync(`${badgeDir}runtimes.svg`, badge('runtimes', 'Bun | Node 22-26 | Deno | Chrome', '#007ec6'));
  writeFileSync(`${badgeDir}last-run.svg`, badge('last run', bun.env.date, '#007ec6'));
}
console.log(`docs/charts: ${written.length} charts, light and dark; docs/badges: 3 badges`);
