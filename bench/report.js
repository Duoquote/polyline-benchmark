// Turns benchmark results into Markdown tables. Pure, so the runners, the
// README generator and the chart script all format numbers the same way.
//
// The main unit is calls per second: whole encode() or decode() calls, one
// line each, at each input size. Million points per second stays in
// results/*.md as a second view.

export const BASELINE = '@mapbox/polyline';
export const COLS = ['10 pts', '100 pts', '1,000 pts', '10,000 pts', '100,000 pts', 'real-world'];
export const colLabel = (c) => (c === 'real-world' ? 'real-world line' : c);

/** 1.23M, 85.4k, 950, 4.2 */
export function ops(v) {
  if (!(v > 0)) return 'n/a';
  const unit = v >= 1e6 ? [1e6, 'M'] : v >= 1e3 ? [1e3, 'k'] : [1, ''];
  const x = v / unit[0];
  return (x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2)) + unit[1];
}
export const mpts = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
export const times = (v) => (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v.toFixed(2)) + 'x';
export const bytes = (v) => (v >= 1 << 20 ? (v / (1 << 20)).toFixed(1) + ' MB' : v >= 1024 ? (v / 1024).toFixed(1) + ' KB' : Math.round(v) + ' B');
const isOurs = (name) => name.startsWith('@duoquote/polytini@');
const bold = (s) => `**${s}**`;
// polytini's rows carry the name in bold, so they're easy to find.
const rowName = (name) => (isOurs(name) ? bold(name) : name);

export const cell = (results, impl, op, col) => results.find((r) => r.impl === impl && r.op === op && r.fixture === col);
const value = (r) => r?.opsPerSec ?? (r ? (r.mptsPerSec * 1e6) / r.points : undefined);

/**
 * Libraries in order, fastest first: by the geometric mean, over the columns
 * a library has, of its speed relative to the fastest in that column.
 */
export function ranked(results, op, cols = COLS) {
  const names = [...new Set(results.filter((r) => r.op === op).map((r) => r.impl))];
  const best = Object.fromEntries(cols.map((c) => [c, Math.max(0, ...names.map((n) => value(cell(results, n, op, c)) ?? 0))]));
  const score = (n) => {
    const xs = cols.map((c) => value(cell(results, n, op, c)) / best[c]).filter((x) => x > 0);
    return xs.length ? Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length) : 0;
  };
  return names.sort((a, b) => score(b) - score(a));
}

function grid(title, cols, names, get, fmt) {
  const lines = [`| ${title} | ${cols.map(colLabel).join(' | ')} |`, `|---|${cols.map(() => '--:').join('|')}|`];
  const winner = Object.fromEntries(cols.map((c) => [c, Math.max(...names.map((n) => get(n, c) ?? 0))]));
  for (const n of names) {
    lines.push(`| ${rowName(n)} | ${cols.map((c) => {
      const v = get(n, c);
      if (!(v > 0)) return 'n/a';
      return v === winner[c] ? bold(fmt(v)) : fmt(v);
    }).join(' | ')} |`);
  }
  return lines.join('\n');
}

/** Calls per second, fastest first, the winner of each column in bold. */
export function opsTable(results, op, cols = COLS, title = `${op}, calls/s`) {
  const rows = results.filter((r) => r.op === op);
  if (!rows.length) return '';
  const present = cols.filter((c) => rows.some((r) => r.fixture === c));
  return grid(title, present, ranked(rows, op, present), (n, c) => value(cell(rows, n, op, c)), ops);
}

/** Million points per second, same order. */
export function mptsTable(results, op, cols = COLS, title = `${op}, million points/s`) {
  const rows = results.filter((r) => r.op === op);
  if (!rows.length) return '';
  const present = cols.filter((c) => rows.some((r) => r.fixture === c));
  return grid(title, present, ranked(rows, op, present), (n, c) => cell(rows, n, op, c)?.mptsPerSec, mpts);
}

/** Speed relative to the baseline library (1.00x), same order. */
export function relativeTable(results, op, cols = COLS) {
  const rows = results.filter((r) => r.op === op);
  const base = rows.find((r) => r.impl.startsWith(BASELINE + '@'))?.impl;
  if (!rows.length || !base) return '';
  const present = cols.filter((c) => rows.some((r) => r.fixture === c));
  return grid(`${op}, vs ${base.split('@').slice(0, 2).join('@')} = 1.00x`, present, ranked(rows, op, present), (n, c) => {
    const v = value(cell(rows, n, op, c)), b = value(cell(rows, base, op, c));
    return v && b ? v / b : undefined;
  }, times);
}

/** Splits results into the main group and the typed-array and batch groups. */
export function groups(data) {
  const flat = new Set(data.groups?.flat ?? data.results.map((r) => r.impl).filter((n) => /Float64Array|encodeDeltas/.test(n)));
  const batch = new Set(data.groups?.batch ?? data.results.map((r) => r.impl).filter((n) => /decodeMany|binaryPaths/.test(n)));
  const main = data.results.filter((r) => !flat.has(r.impl) && !batch.has(r.impl));
  return { main, flat: data.results.filter((r) => flat.has(r.impl)), batch: data.results.filter((r) => batch.has(r.impl)) };
}

/**
 * The real-world set, lines per second: the batch rows (all 1000 lines in
 * one call) next to every other row's one-line-per-call number.
 */
export function batchTable(data, op) {
  const { main, flat, batch } = groups(data);
  const rows = [...batch, ...flat, ...main].filter((r) => r.op === op && r.fixture === 'real-world');
  if (!batch.some((r) => r.op === op)) return '';
  return grid(`${op}, real-world lines/s`, ['real-world'], ranked(rows, op, ['real-world']), (n) => value(rows.find((r) => r.impl === n)), ops).replace('| real-world line |', '| 1000 lines, each or in one call |');
}

/** All of a runtime's speed tables, for results/<runtime>.md. */
export function speedTables(data) {
  const { main, flat } = groups(data);
  return [
    opsTable(main, 'decode'), opsTable(main, 'encode'),
    relativeTable(main, 'decode'), relativeTable(main, 'encode'),
    opsTable(flat, 'decode', COLS, 'decode, typed arrays, calls/s'), opsTable(flat, 'encode', COLS, 'encode, typed arrays, calls/s'),
    batchTable(data, 'decode'), batchTable(data, 'encode'),
    mptsTable(main, 'decode'), mptsTable(main, 'encode'),
  ].filter(Boolean).join('\n\n');
}

/** Memory per call, smallest first, from results/memory-*.json. */
export function memoryTable(mem, op, key = 'allocated') {
  const sizes = ['100 pts', '10,000 pts', '100,000 pts'];
  const rows = mem.results.filter((r) => r.op === op && sizes.includes(r.fixture));
  const names = [...new Set(rows.map((r) => r.impl))];
  const get = (n, c) => rows.find((r) => r.impl === n && r.fixture === c)?.[key];
  names.sort((a, b) => (get(a, '10,000 pts') ?? Infinity) - (get(b, '10,000 pts') ?? Infinity));
  const lines = [`| ${op}, ${key} per call | ${sizes.join(' | ')} | vs ${BASELINE} at 10,000 |`, `|---|${sizes.map(() => '--:').join('|')}|--:|`];
  const least = Object.fromEntries(sizes.map((c) => [c, Math.min(...names.map((n) => get(n, c) ?? Infinity))]));
  const base = names.find((n) => n.startsWith(BASELINE + '@'));
  for (const n of names) {
    const rel = base && get(n, '10,000 pts') / get(base, '10,000 pts');
    lines.push(`| ${rowName(n)} | ${sizes.map((c) => {
      const v = get(n, c);
      return v === undefined ? 'n/a' : v === least[c] ? bold(bytes(v)) : bytes(v);
    }).join(' | ')} | ${rel ? times(rel) : 'n/a'} |`);
  }
  return lines.join('\n');
}
