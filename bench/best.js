// The "best at what" table: for each situation, the winner and the
// runner-up, computed from results/*.json. Speed rows use the geometric
// mean over every runtime and every size in the situation, so one noisy
// cell can't decide a row. Each library counts once, by its plain import;
// polytini's WASM and typed-array variants have rows of their own.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { groups, bytes } from './report.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (f) => (existsSync(`${root}results/${f}.json`) ? JSON.parse(readFileSync(`${root}results/${f}.json`, 'utf8')) : null);
const RUNTIMES = ['bun', 'node-22', 'node-23', 'node-24', 'node-25', 'node-26', 'deno', 'browser'];
const pkg = (impl) => impl.replace(/@\d[^ ]*/, '');
const geo = (xs) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
const value = (r) => r.opsPerSec ?? (r.mptsPerSec * 1e6) / r.points;

function speed(pick, op, cols) {
  const scores = {};
  for (const f of RUNTIMES) {
    const d = read(f);
    if (!d) continue;
    for (const r of pick(groups(d)).filter((r) => r.op === op && cols.includes(r.fixture))) (scores[pkg(r.impl)] ??= []).push(value(r));
  }
  // Only libraries measured in every cell compete; a ratio of geometric means
  // over the same cells is the typical speedup.
  const n = Math.max(...Object.values(scores).map((x) => x.length));
  return Object.entries(scores).filter(([, xs]) => xs.length === n).map(([name, xs]) => ({ name, score: geo(xs) })).sort((a, b) => b.score - a.score);
}
const plain = (g) => g.main.filter((r) => !/\(.*\)$/.test(r.impl));
// The noise: how far a cell moved between rounds, the median over every
// cell of a runtime, then the median over runtimes. A lead smaller than
// that isn't a ranking. It was about 30% on a busy desktop.
const median = (xs) => [...xs].sort((a, b) => a - b)[(xs.length - 1) >> 1];
export function noise() {
  const per = RUNTIMES.map(read).filter(Boolean).map((d) => median(d.results.map((r) => r.spread)));
  return per.length ? median(per) : 0.3;
}
const row = (situation, list, better = 'faster') => {
  const [a, b] = list;
  if (!a || !b) return null;
  const m = better === 'faster' ? a.score / b.score : b.score / a.score;
  return { situation, winner: a.name, runnerUp: b.name, margin: `${m.toFixed(m >= 10 ? 0 : 2)}x ${better}${m < 1 + noise() ? ', within the noise' : ''}` };
};

export function bestAt() {
  const rows = [
    row('Decode short lines (10 and 100 points)', speed(plain, 'decode', ['10 pts', '100 pts'])),
    row('Decode long lines (10,000 and 100,000 points)', speed(plain, 'decode', ['10,000 pts', '100,000 pts'])),
    row('Decode real-world lines (median 82 points)', speed(plain, 'decode', ['real-world'])),
    row('Encode, any length', speed(plain, 'encode', ['10 pts', '100 pts', '1,000 pts', '10,000 pts', '100,000 pts', 'real-world'])),
    row('Decode to typed arrays', speed((g) => g.flat, 'decode', ['1,000 pts', '10,000 pts', '100,000 pts'])),
    row('Encode from typed arrays', speed((g) => g.flat, 'encode', ['1,000 pts', '10,000 pts', '100,000 pts'])),
    row('Decode 1000 lines in one call', speed((g) => [...g.batch, ...g.flat.filter((r) => /Float64Array/.test(r.impl))], 'decode', ['real-world'])),
  ];
  const mem = read('memory-node-24') ?? read('memory-node-25');
  if (mem) {
    const list = mem.results.filter((r) => r.op === 'decode' && r.fixture === '10,000 pts' && !/\(.*\)$/.test(r.impl)).map((r) => ({ name: pkg(r.impl), score: r.allocated })).sort((a, b) => a.score - b.score);
    const [a, b] = list;
    rows.push({ situation: 'Least memory per decode (10,000 points, [lat, lng] arrays)', winner: `${a.name} (${bytes(a.score)})`, runnerUp: `${b.name} (${bytes(b.score)})`, margin: b.score / a.score < 1.02 ? `${((1 - a.score / b.score) * 100).toFixed(1)}% less` : `${(b.score / a.score).toFixed(2)}x less` });
  }
  const size = read('size');
  if (size) {
    const best = {};
    for (const r of size) {
      const name = r.name.replace(/@\d[^ ]*/, '').replace(/ \(.*\)$/, '');
      if (/flexpolyline|flexible|ol\/format|deltas/i.test(r.name)) continue;
      if (!(best[name] <= r.gzip)) best[name] = r.gzip;
    }
    const [a, b] = Object.entries(best).sort((x, y) => x[1] - y[1]);
    rows.push({ situation: 'Smallest bundle (gzipped)', winner: `${a[0]} (${bytes(a[1])})`, runnerUp: `${b[0]} (${bytes(b[1])})`, margin: `${b[1] - a[1]} B smaller` });
  }
  // Strict validation: the libraries that throw on a truncated string (see
  // npm run behavior), ranked by decode speed.
  const strict = speed(plain, 'decode', ['10 pts', '100 pts', '1,000 pts', '10,000 pts', '100,000 pts', 'real-world']).filter((x) => /polytini|lp-labs/.test(x.name));
  rows.push(row('Strict validation (throws on bad input)', strict));
  const flexRows = ['bun-flexible', 'node-24-flexible', 'deno-flexible'].map(read).filter(Boolean);
  if (flexRows.length) {
    const s = {};
    for (const d of flexRows) for (const r of d.results) (s[r.impl.replace(/@\d[^ ]*/, '')] ??= []).push(value(r));
    const list = Object.entries(s).map(([name, xs]) => ({ name, score: geo(xs) })).sort((a, b) => b.score - a.score);
    rows.push(row('HERE Flexible Polyline (encode and decode)', list));
  }
  return rows.filter(Boolean);
}

export function bestTable() {
  const rows = bestAt();
  return ['| Situation | Best | Runner-up | Margin |', '|---|---|---|--:|', ...rows.map((r) => `| ${r.situation} | ${r.winner.includes('polytini') ? `**${r.winner}**` : r.winner} | ${r.runnerUp} | ${r.margin} |`)].join('\n');
}

if (process.argv[1]?.endsWith('best.js')) console.log(bestTable());
