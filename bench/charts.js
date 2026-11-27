// Static SVG charts and badges from results/*.json, no dependencies:
//
//   node bench/charts.js        (npm run charts)
//
// Writes docs/charts/<name>-light.svg and -dark.svg (each with its own
// background, so either one reads on any page; READMEs pick one with
// <picture> and prefers-color-scheme), and docs/badges/*.svg. Anything else
// in docs/charts is removed, so the folder is exactly what this script makes.
//
// The charts, and what each one answers:
// - overview: every runtime against every case in one heatmap. Each cell is
//   polytini's default import divided by the fastest other library in that
//   cell. A cell where the rounds disagree on who was ahead is hatched gray,
//   so nothing inside the noise reads as a win or a loss.
// - grouped-decode, grouped-encode: a panel per runtime, a group per line
//   length, a bar per library, relative to @mapbox/polyline on a log scale.
//   Bars start at the 1.0x line, because a bar from the bottom of a log
//   axis has a length that depends on where the axis happens to start.
// - memory-decode, memory-encode: the same shape for memory per call.
// - size: gzipped bundle size.
// - ops-<runtime>-<op>: absolute calls per second by line length.
// - speed-<runtime>-<op>: the real-world column only. Nothing here links it
//   any more, but polytini 0.1.4's README on npm and JSR does, so it stays.
//
// Colors follow the dataviz palette. The bar charts use the first five
// categorical slots in their fixed order, polytini always in the first
// (blue), and every library keeps its color in every chart. That order
// passes the colorblind checks for neighbors in both modes; four of the five
// are under 3:1 on white, so every chart has a legend and every value is in
// the tables in docs/results.md too. The heatmap is diverging: blue where
// polytini is faster, red where it's slower, gray at 1.0x, with the value
// printed in every cell.
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BASELINE, COLS, ops, times, bytes, ranked, groups } from './report.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const results = `${root}results/`, out = `${root}docs/charts/`, badgeDir = `${root}docs/badges/`;
mkdirSync(out, { recursive: true });
mkdirSync(badgeDir, { recursive: true });

const THEMES = {
  light: {
    surface: '#ffffff', text: '#191919', muted: '#666666', grid: '#e7e7e7', axis: '#c2c2c2', bar: '#c2c2c2', ours: '#257de0',
    series: ['#257de0', '#f47230', '#00b894', '#f2a600', '#ee7fac'],
    mid: '#efefef', faster: '#1757ac', slower: '#c4302f', hatch: '#6f6f6f',
  },
  dark: {
    surface: '#191919', text: '#efefef', muted: '#9c9c9c', grid: '#303030', axis: '#474747', bar: '#5c5c5c', ours: '#338ced',
    series: ['#338ced', '#e76624', '#00a888', '#d28e05', '#e24d8b'],
    mid: '#383838', faster: '#6aabf1', slower: '#eb6263', hatch: '#a0a0a0',
  },
};
const FONT = "font-family=\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif\"";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isOurs = (n) => n.startsWith('@duoquote/polytini@');
// Short names: drop the version, keep polytini's variant.
const short = (n) => n.replace(/@\d[^ ]*/, '');
// Shorter still, for the heatmap cells: the scope, or the bare package name.
const nick = (n) => {
  if (n === 'google.maps.geometry.encoding') return 'Maps JS API';
  const p = short(n);
  return p.startsWith('@') ? p.slice(1).split('/')[0] : p;
};
const textW = (s, size = 12) => s.length * size * 0.56;

const runtimes = [
  ['bun', 'Bun'], ['node-22', 'Node 22'], ['node-23', 'Node 23'], ['node-24', 'Node 24'], ['node-25', 'Node 25'], ['node-26', 'Node 26'], ['deno', 'Deno'], ['browser', 'Chrome'],
].filter(([f]) => existsSync(`${results}${f}.json`));
const load = (f) => JSON.parse(readFileSync(`${results}${f}.json`, 'utf8'));
const value = (r) => r?.opsPerSec ?? (r ? (r.mptsPerSec * 1e6) / r.points : undefined);
// "Bun 1.4.3", "Node 24.22.3", "Deno 2.5.4", "Chrome 157".
const runtimeName = (env) => env.runtimeLabel.replace(' v', ' ').replace(/^(Chrome \d+)\..*$/, '$1');
// The column headers everywhere: points per line, and the real-world set.
const colShort = (c) => ({ '10 pts': '10', '100 pts': '100', '1,000 pts': '1k', '10,000 pts': '10k', '100,000 pts': '100k', 'real-world': 'real' })[c] ?? c;
const colLong = (c) => (c === 'real-world' ? 'the real-world lines' : c.replace(' pts', ' points'));

// The libraries in the bar charts, in this order in every panel and chart.
// @mapbox/polyline is the 1.0x line. polyline-encoded, @lp-labs/polyline-codec
// and decode-google-map-polyline are left out of the bars, because they're
// several times slower everywhere and would stretch the axis; each chart's
// note gives their range, and the tables have them.
const LIBS = ['@duoquote/polytini', '@googlemaps/polyline-codec', 'google-polyline', '@placemarkio/polyline', '@pirxpilot/google-polyline'];
const plainName = (impl) => (/\(.*\)$/.test(impl) ? null : short(impl));

// ---------------------------------------------------------------- color

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const delin = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
function toLab(h) {
  const [r, g, b] = hex2rgb(h).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromLab([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return '#' + rgb.map((c) => Math.round(Math.min(1, Math.max(0, delin(c))) * 255).toString(16).padStart(2, '0')).join('');
}
const mix = (a, b, f) => {
  const A = toLab(a), B = toLab(b);
  return fromLab(A.map((x, i) => x + (B[i] - x) * f));
};
const luminance = (h) => {
  const [r, g, b] = hex2rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const inkOn = (fill) => (contrast(fill, '#191919') >= contrast(fill, '#ffffff') ? '#191919' : '#ffffff');
// The diverging scale: log ratio, full color at 4x either way.
const DIVERGE_MAX = 4;
const divergeColor = (t, r) => {
  const f = Math.max(-1, Math.min(1, Math.log(r) / Math.log(DIVERGE_MAX)));
  return f >= 0 ? mix(t.mid, t.faster, f) : mix(t.mid, t.slower, -f);
};

// ---------------------------------------------------------------- shapes

function svg(t, w, h, title, desc, body, defs = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t d" ${FONT}>
<title id="t">${esc(title)}</title>
<desc id="d">${esc(desc)}</desc>
${defs}<rect width="${w}" height="${h}" rx="6" fill="${t.surface}"/>
${body}
</svg>\n`;
}

function header(t, title, subtitle) {
  const lines = Array.isArray(subtitle) ? subtitle : [subtitle];
  return `<text x="16" y="24" font-size="15" font-weight="600" fill="${t.text}">${esc(title)}</text>\n` +
    lines.map((s, i) => `<text x="16" y="${43 + i * 16}" font-size="12" fill="${t.muted}">${esc(s)}</text>\n`).join('');
}
// Splits text into lines that fit `width` pixels at `size`, by estimate.
function wrap(text, width, size = 11) {
  const lines = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length * size * 0.46 > width) lines.push(line), (line = word);
    else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
const notes = (t, lines, y) => lines.map((s, i) => `<text x="16" y="${y + i * 15}" font-size="11" fill="${t.muted}">${esc(s)}</text>\n`).join('');

// A horizontal bar: square at the baseline, 4px rounded at the data end.
function bar(x, y, w, h, fill, tip) {
  const r = Math.min(4, w / 2, h / 2);
  const d = w < 1 ? '' : `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 -${r},${r}h-${w - r}z`;
  return d ? `<path d="${d}" fill="${fill}"><title>${esc(tip)}</title></path>` : '';
}

// A vertical bar from y0 (the 1.0x line) to y1, rounded at the y1 end.
function vbar(x, w, y0, y1, fill, tip) {
  const h = Math.max(1.5, Math.abs(y1 - y0)), r = Math.min(3, w / 2, h / 2);
  const d = y1 <= y0
    ? `M${x},${y0}v${-(h - r)}a${r},${r} 0 0 1 ${r},${-r}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - r}z`
    : `M${x},${y0}v${h - r}a${r},${r} 0 0 0 ${r},${r}h${w - 2 * r}a${r},${r} 0 0 0 ${r},${-r}v${-(h - r)}z`;
  return `<path d="${d}" fill="${fill}"><title>${esc(tip)}</title></path>`;
}

/** Sorted horizontal bars with an optional reference line at `ref`. */
function barChart(t, { title, subtitle, rows, fmt, ref, refLabel, note }) {
  const labelW = Math.max(...rows.map((r) => textW(r.label))) + 24, plotW = 360, valueW = 70;
  const W = Math.round(labelW + plotW + valueW + 24), rowH = 24, top = 58, H = top + rows.length * rowH + (note ? 40 : 24);
  const max = Math.max(...rows.map((r) => r.value), ref ?? 0) * 1.05;
  const x = (v) => labelW + (v / max) * plotW;
  let body = header(t, title, subtitle);
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
  let body = header(t, title, subtitle);
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
  // Legend, top left: a short line key beside each name.
  series.forEach((s, k) => {
    const lx = 16 + k * 210;
    body += `<line x1="${lx}" y1="62" x2="${lx + 18}" y2="62" stroke="${t.series[k]}" stroke-width="2"/><text x="${lx + 24}" y="66" font-size="11" fill="${t.text}">${esc(s.label)}</text>`;
  });
  return svg(t, W, H, title, `${subtitle}. ${series.map((s) => `${s.label}: ${s.points.map((v, i) => `${sizes[i]} ${ops(v)}`).join(', ')}`).join('; ')}.`, body);
}

/**
 * Rows of cells in column groups, each cell a ratio on the diverging scale
 * with its value printed, and an optional second line of small text.
 * Cells marked `noise` are gray and hatched instead of colored.
 */
function heatmap(t, { title, subtitle, colGroups, rows, notes: footer, stacked = false }) {
  const cw = 78, ch = 42, gap = 2, groupGap = 16, labelW = 104, L = 16 + labelW;
  // Side by side, or (stacked) one block per group, for narrow pages.
  const blocks = stacked ? colGroups.map((g) => [g]) : [colGroups];
  let offset = 0;
  for (const g of colGroups) (g.offset = offset), (offset += g.cols.length);
  const blockW = (gs) => gs.reduce((a, g) => a + g.cols.length * (cw + gap) - gap, 0) + (gs.length - 1) * groupGap;
  const W = Math.max(...blocks.map((gs) => L + blockW(gs) + 16), stacked ? 0 : 760);
  const titleLines = wrap(title, W - 32, 15 * 1.08);
  const sub = (Array.isArray(subtitle) ? subtitle : [subtitle]).flatMap((s) => wrap(s, W - 32, 12));
  const narrow = W < 760;
  const top = 24 + (titleLines.length - 1) * 19;
  const legendY = top + 19 + sub.length * 16 + 10;
  const blockH = 64 + rows.length * (ch + gap);
  const T0 = legendY + (narrow ? 112 : 86);
  footer = footer.flatMap((s) => wrap(s, W - 32));
  const bottom = T0 + blocks.length * blockH - 64 + (blocks.length - 1) * 8;
  const H = bottom + 14 + footer.length * 15 + 6;
  const defs = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="${t.mid}"/><line x1="0" y1="0" x2="0" y2="6" stroke="${t.hatch}" stroke-width="1.6" stroke-opacity="0.45"/></pattern></defs>\n`;
  let body = titleLines.map((s, i) => `<text x="16" y="${24 + i * 19}" font-size="15" font-weight="600" fill="${t.text}">${esc(s)}</text>\n`).join('');
  body += sub.map((s, i) => `<text x="16" y="${top + 19 + i * 16}" font-size="12" fill="${t.muted}">${esc(s)}</text>\n`).join('');
  // Legend: the diverging scale as small steps, then the hatch swatch.
  const lx = 16, lw = 320, steps = 64, ly = legendY + 12;
  body += `<text x="${lx}" y="${legendY + 4}" font-size="11" fill="${t.text}">polytini slower</text><text x="${lx + lw}" y="${legendY + 4}" font-size="11" text-anchor="end" fill="${t.text}">polytini faster</text>\n`;
  for (let i = 0; i < steps; i++) {
    const r = DIVERGE_MAX ** (((i + 0.5) / steps) * 2 - 1);
    body += `<rect x="${(lx + (i * lw) / steps).toFixed(1)}" y="${ly}" width="${(lw / steps + 0.4).toFixed(1)}" height="10" fill="${divergeColor(t, r)}"/>`;
  }
  for (const r of [0.25, 0.5, 1, 2, 4]) {
    const tx = lx + ((Math.log(r) / Math.log(DIVERGE_MAX) + 1) / 2) * lw;
    body += `<line x1="${tx.toFixed(1)}" y1="${ly + 10}" x2="${tx.toFixed(1)}" y2="${ly + 14}" stroke="${t.muted}" stroke-width="1"/><text x="${tx.toFixed(1)}" y="${ly + 25}" font-size="10.5" text-anchor="${r === 4 ? 'end' : r === 0.25 ? 'start' : 'middle'}" fill="${t.muted}">${r === 4 ? '4x or more' : r === 0.25 ? '0.25x or less' : `${r}x`}</text>`;
  }
  const [hx, hy] = narrow ? [lx, ly + 40] : [lx + lw + 48, ly];
  const hatchText = narrow ? ['Within the noise: polytini was ahead in some rounds and', 'behind in others, so call it even'] : ['Within the noise: polytini was ahead in some rounds', 'and behind in others, so call it even'];
  body += `
<rect x="${hx}" y="${hy - 6}" width="28" height="20" rx="3" fill="url(#hatch)"/><text x="${hx + 36}" y="${hy + 3}" font-size="11" fill="${t.text}">${esc(hatchText[0])}</text><text x="${hx + 36}" y="${hy + 17}" font-size="11" fill="${t.text}">${esc(hatchText[1])}</text>\n`;
  blocks.forEach((gs, bi) => {
    const T = T0 + bi * (blockH + 8);
    let x = L;
    const colX = {};
    for (const g of gs) {
      g.x0 = x;
      g.cols.forEach((c, i) => (colX[g.offset + i] = x + i * (cw + gap)));
      g.x1 = x + g.cols.length * (cw + gap) - gap;
      x = g.x1 + groupGap;
      body += `<text x="${(g.x0 + g.x1) / 2}" y="${T - 30}" font-size="12" font-weight="600" text-anchor="middle" fill="${t.text}">${esc(g.label)}</text>`;
      body += `<line x1="${g.x0}" y1="${T - 24}" x2="${g.x1}" y2="${T - 24}" stroke="${t.axis}" stroke-width="1"/>\n`;
      g.cols.forEach((c, i) => (body += `<text x="${colX[g.offset + i] + cw / 2}" y="${T - 8}" font-size="11" text-anchor="middle" fill="${t.muted}">${esc(c)}</text>`));
      body += '\n';
    }
    rows.forEach((row, ri) => {
      const y = T + ri * (ch + gap);
      body += `<text x="${L - 10}" y="${y + ch / 2 + 4}" font-size="12" text-anchor="end" fill="${t.text}">${esc(row.label)}</text>\n`;
      row.cells.forEach((c, ci) => {
        if (!c || !(ci in colX)) return;
        const fill = c.noise ? t.mid : divergeColor(t, c.value), ink = c.noise ? t.text : inkOn(fill);
        body += `<rect x="${colX[ci]}" y="${y}" width="${cw}" height="${ch}" rx="3" fill="${c.noise ? 'url(#hatch)' : fill}"><title>${esc(c.tip)}</title></rect>`;
        body += `<text x="${colX[ci] + cw / 2}" y="${y + 19}" font-size="13" font-weight="600" text-anchor="middle" fill="${ink}" pointer-events="none">${esc(times(c.value))}</text>`;
        if (c.sub) body += `<text x="${colX[ci] + cw / 2}" y="${y + 33}" font-size="9.5" text-anchor="middle" fill="${ink}" pointer-events="none">${esc(c.sub)}</text>`;
        body += '\n';
      });
    });
  });
  body += notes(t, footer, bottom + 14);
  const names = colGroups.flatMap((g) => g.cols.map((col) => `${g.label} ${col}`));
  const desc = `${sub.join(' ')} ${rows.map((r) => `${r.label}: ${r.cells.map((c, i) => c && `${names[i]} ${times(c.value)}${c.noise ? ' (within the noise)' : ''}`).filter(Boolean).join(', ')}`).join('. ')}.`;
  return svg(t, W, H, title, desc, body, defs);
}

/**
 * Small multiples of grouped bars on one shared log scale: a panel per
 * runtime, a group per size, a bar per series in a fixed order. Bars start
 * at the 1.0x line and go up for more, down for less.
 */
function grouped(t, { title, subtitle, series, refLabel, groupLabels, panels, cols = 2, notes: footer, axisLabel }) {
  const sub = Array.isArray(subtitle) ? subtitle : [subtitle];
  const pw = 470, ph = 206, padL = 46, padT = 26, padB = 26, gx = 12;
  const rowsN = Math.ceil(panels.length / cols), W = 16 + cols * pw + (cols - 1) * gx + 8;
  // Legend items in bar order, then the reference line; wraps to more rows.
  const items = [...series.map((s, k) => ({ label: s.label, k })), { label: refLabel, k: -1 }];
  const itemW = (it) => 16 + it.label.length * 11.5 * 0.5 + 16;
  const legendRows = [[]];
  for (const it of items) {
    const row = legendRows.at(-1);
    if (row.length && 16 + [...row, it].reduce((a, x) => a + itemW(x), 0) > W - 16) legendRows.push([it]);
    else row.push(it);
  }
  const legendY = 43 + sub.length * 16 + 10, top = legendY + legendRows.length * 18 + 8;
  footer = footer.flatMap((s) => wrap(s, W - 32));
  const H = top + rowsN * (ph + 14) + footer.length * 15 + 8;
  const all = panels.flatMap((p) => p.groups.flatMap((g) => g.bars.filter(Boolean).map((b) => b.value)));
  let lo = Math.floor(Math.log2(Math.min(1, ...all))), hi = Math.ceil(Math.log2(Math.max(1, ...all)));
  if (hi - lo < 2) hi = lo + 2;
  const tickStep = hi - lo > 6 ? 2 : 1;
  const tickLabel = (v) => (v >= 0.25 ? `${v}x` : `1/${1 / v}x`);
  let body = header(t, title, sub);
  // Legend: a swatch per series in the same order as the bars, then the line.
  legendRows.forEach((row, ri) => {
    let lx = 16;
    const ly = legendY + ri * 18;
    for (const it of row) {
      body += it.k >= 0
        ? `<rect x="${lx}" y="${ly - 9}" width="11" height="11" rx="2" fill="${t.series[it.k]}"/><text x="${lx + 16}" y="${ly}" font-size="11.5" fill="${t.text}"${it.k === 0 ? ' font-weight="600"' : ''}>${esc(it.label)}</text>`
        : `<line x1="${lx}" y1="${ly - 4}" x2="${lx + 11}" y2="${ly - 4}" stroke="${t.text}" stroke-width="1.5"/><text x="${lx + 16}" y="${ly}" font-size="11.5" fill="${t.text}">${esc(it.label)}</text>`;
      lx += itemW(it);
    }
  });
  body += '\n';
  panels.forEach((p, i) => {
    const ox = 16 + (i % cols) * (pw + gx), oy = top + Math.floor(i / cols) * (ph + 14);
    const px0 = ox + padL, px1 = ox + pw - 6, py0 = oy + padT, py1 = oy + ph - padB;
    const y = (v) => py1 - ((Math.log2(v) - lo) / (hi - lo)) * (py1 - py0);
    body += `<text x="${ox}" y="${oy + 13}" font-size="12.5" font-weight="600" fill="${t.text}">${esc(p.label)}</text>\n`;
    for (let e = lo; e <= hi; e++) {
      if (e % tickStep) continue;
      const v = 2 ** e, yy = y(v).toFixed(1);
      if (e !== 0) body += `<line x1="${px0}" y1="${yy}" x2="${px1}" y2="${yy}" stroke="${t.grid}" stroke-width="1"/>`;
      body += `<text x="${px0 - 6}" y="${(+yy + 4).toFixed(1)}" font-size="10.5" text-anchor="end" fill="${t.muted}">${tickLabel(v)}</text>`;
    }
    const n = series.length, slot = (px1 - px0) / groupLabels.length, bw = Math.min(12, (slot - 16 - (n - 1) * 2) / n);
    p.groups.forEach((g, gi) => {
      const gw = n * bw + (n - 1) * 2, gx0 = px0 + gi * slot + (slot - gw) / 2;
      g.bars.forEach((b, k) => {
        if (b) body += vbar(+(gx0 + k * (bw + 2)).toFixed(1), bw, y(1), y(b.value), t.series[k], b.tip);
      });
      body += `<text x="${(px0 + gi * slot + slot / 2).toFixed(1)}" y="${py1 + 16}" font-size="10.5" text-anchor="middle" fill="${t.muted}">${esc(groupLabels[gi])}</text>\n`;
    });
    body += `<line x1="${px0}" y1="${y(1).toFixed(1)}" x2="${px1}" y2="${y(1).toFixed(1)}" stroke="${t.text}" stroke-width="1.5"/>\n`;
  });
  body += notes(t, footer, top + rowsN * (ph + 14) + 6);
  const desc = `${sub.join(' ')} ${axisLabel}. ${panels.map((p) => `${p.label}: ${p.groups.map((g, gi) => `${groupLabels[gi]}: ${g.bars.map((b, k) => b && `${series[k].label} ${times(b.value)}`).filter(Boolean).join(', ')}`).join('; ')}`).join('. ')}.`;
  return svg(t, W, H, title, desc, body);
}

// ---------------------------------------------------------------- data

const written = [];
function write(name, make) {
  for (const [mode, t] of Object.entries(THEMES)) writeFileSync(`${out}${name}-${mode}.svg`, make(t));
  written.push(name);
}
const label = (n) => (n.startsWith(BASELINE + '@') ? `${short(n)} (baseline)` : short(n));
const data = Object.fromEntries(runtimes.map(([f]) => [f, load(f)]));
const first = runtimes.length ? data[runtimes[0][0]] : null;
const version = first && [...new Set(first.results.map((r) => r.impl))].find((n) => /^@duoquote\/polytini@[^ ]+$/.test(n))?.split('@')[2];
const dates = [...new Set(Object.values(data).map((d) => d.env.date))].sort();
const runDate = dates.length > 1 ? `${dates[0]} to ${dates.at(-1)}` : dates[0];
const machine = first && `${/^[AEIOU]/.test(first.env.cpu) ? 'an' : 'a'} ${first.env.cpu.replace(/ \d+-Core Processor$/, '')}, ${first.env.os.startsWith('Windows') ? 'Windows' : first.env.os}`;
const spreadOf = (d) => {
  const s = d.results.map((r) => r.spread).sort((a, b) => a - b);
  return s[(s.length - 1) >> 1];
};
const pct = (x) => `${Math.round(x * 100)}%`;
const spreads = runtimes.map(([f]) => spreadOf(data[f]));
const spreadRange = spreads.length && `${pct(Math.min(...spreads))} to ${pct(Math.max(...spreads))}`;
const hasMaps = Object.values(data).some((d) => d.results.some((r) => r.impl === 'google.maps.geometry.encoding'));

// The overview heatmap.
if (runtimes.length) {
  const opsList = ['decode', 'encode'];
  const cols = COLS;
  const cells = [];
  const rows = runtimes.map(([f]) => {
    const d = data[f], { main } = groups(d);
    return {
      label: runtimeName(d.env),
      cells: opsList.flatMap((op) => cols.map((c) => {
        const here = main.filter((r) => r.op === op && r.fixture === c);
        const ours = here.find((r) => /^@duoquote\/polytini@[^ ]+$/.test(r.impl));
        const best = here.filter((r) => !isOurs(r.impl)).sort((a, b) => value(b) - value(a))[0];
        if (!ours || !best) return null;
        // Rounds are interleaved, so round k of both ran minutes apart at
        // most. If polytini wasn't ahead (or behind) in every round, the
        // median ratio isn't a ranking.
        const paired = ours.rounds.map((x, k) => x / best.rounds[k]).filter((x) => x > 0);
        const noise = !(paired.every((x) => x > 1) || paired.every((x) => x < 1));
        const v = value(ours) / value(best);
        cells.push({ f, op, c, v, noise, rival: short(best.impl) });
        return {
          value: v, noise, sub: nick(best.impl),
          tip: `${runtimeName(d.env)}, ${op} ${colLong(c)}: polytini ${ops(value(ours))} calls/s, ${short(best.impl)} ${ops(value(best))} calls/s, ${times(v)}; polytini ahead in ${paired.filter((x) => x > 1).length} of ${paired.length} rounds`,
        };
      })),
    };
  });
  const others = new Set(Object.values(data).flatMap((d) => groups(d).main.map((r) => r.impl).filter((n) => !isOurs(n)).map(short)));
  const wins = cells.filter((c) => !c.noise && c.v > 1).length, losses = cells.filter((c) => !c.noise && c.v < 1).length, even = cells.filter((c) => c.noise).length;
  const overview = {
    title: `polytini ${version} against the fastest other library, every runtime and line length`,
    subtitle: [
      `Each cell: polytini's calls per second divided by the fastest of the ${others.size} other libraries in that cell (named under the value). 1.0x is even, above is faster.`,
      `Default import, precision 5. Run of ${runDate} on ${machine}. ${wins} cells faster, ${losses} slower, ${even} within the noise.`,
    ],
    colGroups: opsList.map((op) => ({ label: op === 'decode' ? 'Decode, points per line' : 'Encode, points per line', cols: cols.map(colShort) })),
    rows,
    notes: [
      `"real" is the 1000 real-world lines, median 82 points. Each cell is the median of ${first.rounds} interleaved rounds; between rounds a cell moved by a median of ${spreadRange}, depending on the runtime.`,
      'googlemaps is @googlemaps/polyline-codec, mapbox is @mapbox/polyline, placemarkio is @placemarkio/polyline, pirxpilot is @pirxpilot/google-polyline. Every number is in docs/results.md.',
    ],
  };
  write('overview', (t) => heatmap(t, overview));
  // The same with decode above encode, about 620 pixels wide, for blog posts and phones.
  write('overview-narrow', (t) => heatmap(t, { ...overview, stacked: true }));
}

// The grouped bar charts: speed relative to the baseline, a panel per runtime.
const relRange = (pick) => {
  const xs = pick.filter((x) => x > 0 && Number.isFinite(x));
  return xs.length ? `${times(Math.min(...xs))} to ${times(Math.max(...xs))}` : null;
};
for (const op of ['decode', 'encode']) {
  if (!runtimes.length) break;
  const left = new Map();
  const panels = runtimes.map(([f]) => {
    const d = data[f], { main } = groups(d);
    const byName = new Map(main.filter((r) => r.op === op).map((r) => [`${plainName(r.impl)}|${r.fixture}`, r]));
    return {
      label: runtimeName(d.env),
      groups: COLS.map((c) => {
        const base = byName.get(`${BASELINE}|${c}`);
        for (const r of main.filter((r) => r.op === op && r.fixture === c && plainName(r.impl) && !isOurs(r.impl) && r.impl !== 'google.maps.geometry.encoding' && ![BASELINE, ...LIBS].includes(plainName(r.impl)))) {
          (left.get(plainName(r.impl)) ?? left.set(plainName(r.impl), []).get(plainName(r.impl))).push(value(r) / value(base));
        }
        return {
          bars: LIBS.map((lib) => {
            const r = byName.get(`${lib}|${c}`);
            if (!r || !base) return null;
            const v = value(r) / value(base);
            return { value: v, tip: `${runtimeName(d.env)}, ${op} ${colLong(c)}: ${lib} ${times(v)} (${ops(value(r))} calls/s, @mapbox/polyline ${ops(value(base))})` };
          }),
        };
      }),
    };
  });
  const rest = [...left.entries()].map(([n, xs]) => `${n} (${relRange(xs)})`);
  write(`grouped-${op}`, (t) => grouped(t, {
    title: `${op === 'decode' ? 'Decode' : 'Encode'} speed relative to @mapbox/polyline, every runtime and line length`,
    subtitle: [
      `Calls per second divided by @mapbox/polyline's in the same cell, log scale. Up is faster, down is slower.`,
      `polytini ${version}, default import, precision 5. Run of ${runDate} on ${machine}.`,
    ],
    series: LIBS.map((n) => ({ label: n === '@duoquote/polytini' ? `polytini ${version}` : n })),
    refLabel: '@mapbox/polyline = 1.0x',
    groupLabels: COLS.map(colShort),
    panels,
    axisLabel: 'Groups are points per line; real is the 1000 real-world lines',
    notes: [
      `Groups are points per line; "real" is the 1000 real-world lines, median 82 points. Between rounds a cell moved by a median of ${spreadRange}, so bars closer than that are a tie.`,
      rest.length ? `Not drawn, to keep the scale readable: ${rest.join(', ')}.` : '',
      `Also not drawn: polytini's web and wasm entries${hasMaps ? ' and google.maps.geometry.encoding in Chrome' : ''}. All of them are in docs/results.md.`,
    ].filter(Boolean),
  }));

  // Absolute calls per second and the real-world bars, per runtime.
  for (const [f, name] of runtimes) {
    const d = data[f], { main } = groups(d), date = d.env.date;
    const base = [...new Set(main.map((r) => r.impl))].find((n) => n.startsWith(BASELINE + '@'));
    const rel = (impl, col) => value(main.find((r) => r.impl === impl && r.op === op && r.fixture === col)) / value(main.find((r) => r.impl === base && r.op === op && r.fixture === col));
    const col = 'real-world';
    const rows = ranked(main.filter((r) => r.op === op), op, [col]).map((n) => ({ name: n, label: label(n), value: rel(n, col) })).filter((r) => r.value > 0);
    write(`speed-${f}-${op}`, (t) => barChart(t, {
      title: `${name}: ${op} speed relative to @mapbox/polyline`,
      subtitle: `Calls per second on the real-world lines (median 82 points), @mapbox/polyline = 1.0x. Higher is faster. ${date}.`,
      rows, fmt: times, ref: 1, refLabel: '1.0x',
    }));
    const lineSizes = COLS.filter((c) => c !== 'real-world');
    const ours = main.find((r) => r.op === op && /^@duoquote\/polytini@[^ ]+$/.test(r.impl))?.impl;
    const rivals = ranked(main.filter((r) => r.op === op && !isOurs(r.impl)), op, lineSizes).slice(0, 2);
    const get = (n) => lineSizes.map((c) => value(main.find((r) => r.impl === n && r.op === op && r.fixture === c)));
    if (ours) write(`ops-${f}-${op}`, (t) => lineChart(t, {
      title: `${name}: ${op} calls per second by line length`,
      subtitle: `polytini against the two fastest other libraries here. Log scale, higher is faster. ${date}.`,
      sizes: lineSizes, series: [ours, ...rivals].map((n) => ({ label: short(n), points: get(n) })),
    }));
  }
}

// Memory: allocated per call, the same grouped shape, a panel per runtime.
// Node first, then Deno, like the speed charts.
const memFiles = readdirSync(results).filter((x) => /^memory-.*\.json$/.test(x)).sort((a, b) => b.includes('node') - a.includes('node') || a.localeCompare(b));
for (const op of ['decode', 'encode']) {
  if (!memFiles.length) break;
  const mems = memFiles.map((f) => JSON.parse(readFileSync(results + f, 'utf8')));
  const sizes = ['100 pts', '10,000 pts', '100,000 pts'];
  const left = new Map();
  const panels = mems.map((m) => {
    const rows = m.results.filter((r) => r.op === op && plainName(r.impl));
    const get = (lib, c) => rows.find((r) => plainName(r.impl) === lib && r.fixture === c);
    return {
      label: runtimeName(m.env),
      groups: sizes.map((c) => {
        const base = get(BASELINE, c);
        for (const r of rows.filter((r) => r.fixture === c && !isOurs(r.impl) && r.impl !== 'google.maps.geometry.encoding' && ![BASELINE, ...LIBS].includes(plainName(r.impl)))) {
          (left.get(plainName(r.impl)) ?? left.set(plainName(r.impl), []).get(plainName(r.impl))).push(r.allocated / base.allocated);
        }
        return {
          bars: LIBS.map((lib) => {
            const r = get(lib, c);
            if (!r || !base) return null;
            const v = r.allocated / base.allocated;
            return { value: v, tip: `${runtimeName(m.env)}, ${op} ${colLong(c)}: ${lib} allocates ${bytes(r.allocated)} per call, ${times(v)} of @mapbox/polyline's ${bytes(base.allocated)}` };
          }),
        };
      }),
    };
  });
  const rest = [...left.entries()].map(([n, xs]) => `${n} (${relRange(xs)})`);
  write(`memory-${op}`, (t) => grouped(t, {
    title: `Memory allocated per ${op} call, relative to @mapbox/polyline`,
    subtitle: [
      `Heap plus typed arrays and WASM memory, divided by @mapbox/polyline's at the same size, log scale. Down is less memory.`,
      `polytini ${version}, default import. Median of ${mems[0].rounds} rounds in fresh processes, ${mems[0].env.date}. Bun isn't measured (see docs/methodology.md).`,
    ],
    series: LIBS.map((n) => ({ label: n === '@duoquote/polytini' ? `polytini ${version}` : n })),
    refLabel: '@mapbox/polyline = 1.0x',
    groupLabels: sizes.map((c) => `${colShort(c)} points`),
    panels, cols: 2,
    axisLabel: 'Groups are points per line',
    notes: [rest.length ? `Not drawn: ${rest.join(', ')}. Bytes per call are in docs/results.md.` : 'Bytes per call are in docs/results.md.'],
  }));
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

// Remove charts this run didn't make, so stale ones can't linger.
const keep = new Set(written.flatMap((n) => [`${n}-light.svg`, `${n}-dark.svg`]));
let removed = 0;
for (const f of readdirSync(out)) if (f.endsWith('.svg') && !keep.has(f)) unlinkSync(out + f), removed++;

// Badges, in shields.io's flat style.
function badge(labelText, valueText, color) {
  const lw = Math.round(textW(labelText, 11) + 10), vw = Math.round(textW(valueText, 11) + 10), w = lw + vw;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${esc(labelText)}: ${esc(valueText)}"><title>${esc(labelText)}: ${esc(valueText)}</title><linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#r)"><rect width="${lw}" height="20" fill="#555"/><rect x="${lw}" width="${vw}" height="20" fill="${color}"/><rect width="${w}" height="20" fill="url(#s)"/></g><g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11"><text x="${lw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(labelText)}</text><text x="${lw / 2}" y="14">${esc(labelText)}</text><text x="${lw + vw / 2}" y="15" fill="#010101" fill-opacity=".3">${esc(valueText)}</text><text x="${lw + vw / 2}" y="14">${esc(valueText)}</text></g></svg>\n`;
}
if (runtimes.length) {
  const libs = new Set(groups(first).main.map((r) => r.impl.replace(/@\d[^ ]*( \(.*\))?$/, ''))).size;
  writeFileSync(`${badgeDir}libraries.svg`, badge('libraries', `${libs} compared`, '#007ec6'));
  writeFileSync(`${badgeDir}runtimes.svg`, badge('runtimes', 'Bun | Node 22-26 | Deno | Chrome', '#007ec6'));
  writeFileSync(`${badgeDir}last-run.svg`, badge('last run', first.env.date, '#007ec6'));
}
console.log(`docs/charts: ${written.length} charts, light and dark${removed ? `, ${removed} old files removed` : ''}; docs/badges: 3 badges`);
