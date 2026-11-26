// Times one implementation on every fixture, decode then encode. Shared by
// the Node/Bun/Deno runner (bench/run.js) and the browser runner
// (bench/browser.js), so every library and runtime goes through the same
// loop. No runtime-specific code here.

// Each timed call processes at least this many points, so short lines are not
// dominated by timer overhead. 10 pts -> 2000 repetitions per timed call.
export const MIN_POINTS_PER_CALL = 20_000;

/**
 * @param impl an adapter from src/adapters.js
 * @param fixtures from makeFixtures()
 * @param o { Bench, precision, time, gc }
 */
export async function measure(impl, fixtures, { Bench, precision, time, gc = () => {} }) {
  let sink = 0; // results feed into this so the work can't be optimised away
  const results = [];
  for (const op of ['decode', 'encode']) {
    if (!impl[op]) continue;
    for (const fixture of fixtures) {
      const reps = Math.max(1, Math.ceil(MIN_POINTS_PER_CALL / fixture.points));
      const lines = fixture.encoded;
      const inputs = op === 'encode' ? fixture.coords.map((c) => impl.toNative(c)) : lines;

      // Check once outside the timed loop: the numbers mean nothing for an
      // implementation that returns the wrong answer.
      inputs.forEach((input, i) => {
        const out = impl[op](input, precision);
        const n = op === 'decode' && (impl.count ? impl.count(out) : out.length);
        const ok = op === 'encode' ? out === lines[i] : n === fixture.coords[i].length;
        if (!ok) throw new Error(`${impl.name} ${op} gives a wrong result on ${fixture.name}, line ${i}`);
      });

      const fn = impl[op];
      // tinybench's default floor of 64 timed and 16 warmup iterations, not
      // the time budget, decided how long big inputs and slow libraries ran.
      // 8 samples of a 100,000 point decode are enough for a median.
      const bench = new Bench({ time, iterations: 8, warmupTime: Math.min(250, time / 2), warmupIterations: 2, throws: true });
      bench.add(impl.name, () => {
        for (let r = 0; r < reps; r++) {
          for (let i = 0; i < inputs.length; i++) sink += fn(inputs[i], precision).length;
        }
      });
      gc();
      await bench.run();

      const { latency } = bench.tasks[0].result;
      results.push({
        op,
        fixture: fixture.name,
        impl: impl.name,
        points: fixture.points,
        reps,
        samples: latency.samplesCount,
        medianMs: latency.p50,
        meanMs: latency.mean,
        rme: latency.rme,
        mptsPerSec: (reps * fixture.points) / (latency.p50 / 1000) / 1e6,
      });
    }
  }
  if (sink === 42) console.error(''); // keep `sink` observable
  return results;
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

/** Median across rounds per cell, plus how far apart the rounds were. */
export function summarize(runs) {
  const results = [];
  for (const r of runs.filter((x) => x.round === 1)) {
    const all = runs.filter((x) => x.op === r.op && x.fixture === r.fixture && x.impl === r.impl).map((x) => x.mptsPerSec);
    const m = median(all);
    results.push({ op: r.op, fixture: r.fixture, impl: r.impl, mptsPerSec: m, rounds: all, spread: (Math.max(...all) - Math.min(...all)) / m });
  }
  const spreads = results.map((r) => r.spread);
  return { results, medianSpread: median(spreads), worstSpread: Math.max(...spreads) };
}

/** One markdown table: rows sorted by the 10,000 point column. */
export function table(results, cols, op, title = op) {
  const fmt = (v) => (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2));
  const rows = results.filter((r) => r.op === op);
  const names = [...new Set(rows.map((r) => r.impl))];
  if (!names.length) return '';
  const get = (impl, col) => rows.find((r) => r.impl === impl && r.fixture === col);
  const key = cols.find((c) => c.startsWith('10,000')) ?? cols[0];
  names.sort((a, b) => (get(b, key)?.mptsPerSec ?? 0) - (get(a, key)?.mptsPerSec ?? 0));
  const lines = [`| ${title} | ${cols.join(' | ')} |`, `|---|${cols.map(() => '--:').join('|')}|`];
  for (const name of names) lines.push(`| ${name} | ${cols.map((c) => (get(name, c) ? fmt(get(name, c).mptsPerSec) : 'n/a')).join(' | ')} |`);
  return lines.join('\n');
}

/** The four tables: main decode/encode, then the typed-array group. */
export function tables(results, cols, flatNames) {
  const main = results.filter((r) => !flatNames.has(r.impl)), flat = results.filter((r) => flatNames.has(r.impl));
  return [table(main, cols, 'decode'), table(main, cols, 'encode'), table(flat, cols, 'decode', 'decode, typed arrays'), table(flat, cols, 'encode', 'encode, typed arrays')].filter(Boolean).join('\n\n');
}

/**
 * The order libraries run in for one round: a seeded shuffle, different for
 * every round and the same on every run. With a fixed order, a library that
 * always ran last took every slow minute at the end of a round, which showed
 * up as a 30% drop in rounds 2 and 3 for the last rows on a busy machine.
 */
export function roundOrder(list, round) {
  let s = (round * 0x9e3779b1) >>> 0;
  const rnd = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32;
  };
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
