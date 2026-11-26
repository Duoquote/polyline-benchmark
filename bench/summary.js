// Summarizes results/*.json for the README: where polytini's default row
// wins or loses against the fastest other library, per runtime, operation
// and column. Reads only what the benchmark wrote; nothing is typed in.
//
//   node bench/summary.js            all runtimes
//   node bench/summary.js bun node-24
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../results/', import.meta.url));
const want = process.argv.slice(2);
const files = readdirSync(dir).filter((f) => f.endsWith('.json') && !f.startsWith('size') && !f.includes('-p6'));
const cols = ['10 pts', '100 pts', '1,000 pts', '10,000 pts', '100,000 pts', 'real-world'];

for (const f of files.sort()) {
  const name = f.replace('.json', '');
  if (want.length && !want.includes(name)) continue;
  const data = JSON.parse(readFileSync(dir + f, 'utf8'));
  const flat = new Set(data.groups?.flat ?? []);
  const isOurs = (impl) => impl.startsWith('@duoquote/polytini@');
  const isFlex = name.endsWith('-flexible');
  // The row people get from a plain import: no variant in parentheses,
  // or the flexible variant in the flexible suite.
  const ours = (impl) => (isFlex ? impl.includes('(flexible)') : isOurs(impl) && !impl.includes('('));
  const rows = data.results.filter((r) => !flat.has(r.impl));
  console.log(`\n## ${data.env.runtimeLabel}${isFlex ? ' (flexible)' : ''}  [median spread ${(medianOf(data.results.map((r) => r.spread)) * 100).toFixed(0)}%]`);
  for (const op of ['decode', 'encode']) {
    const line = [];
    for (const c of cols) {
      const cell = rows.filter((r) => r.op === op && r.fixture === c);
      if (!cell.length) continue;
      const mine = cell.find((r) => ours(r.impl));
      const best = cell.filter((r) => !isOurs(r.impl)).sort((a, b) => b.mptsPerSec - a.mptsPerSec)[0];
      if (!mine || !best) continue;
      const ratio = mine.mptsPerSec / best.mptsPerSec;
      line.push(`${c}: ${ratio >= 1 ? 'win' : 'LOSS'} ${ratio.toFixed(2)}x (${fmt(mine.mptsPerSec)} vs ${fmt(best.mptsPerSec)} ${short(best.impl)})`);
    }
    console.log(`  ${op}:\n    ${line.join('\n    ')}`);
  }
}

function medianOf(xs) {
  const s = [...xs].sort((a, b) => a - b);
  return s[(s.length - 1) >> 1];
}
function fmt(v) {
  return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
}
function short(impl) {
  return impl.replace(/@\d[^ ]*/, '');
}
