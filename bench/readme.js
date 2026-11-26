// Fills the result tables in README.md from results/*.md and *.json, so no
// number in the README is typed by hand. Each block sits between markers:
//
//   <!-- results:bun -->  ...  <!-- /results:bun -->
//   <!-- results:size --> ...  <!-- /results:size -->
//
//   node bench/readme.js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tables } from './measure.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const readme = `${root}README.md`;
const cols = (p) => ['10 pts', '100 pts', '1,000 pts', '10,000 pts', '100,000 pts', ...(p === 5 ? ['real-world'] : [])];
// polytini's rows in bold, so they're easy to find.
const mark = (md) => md.replace(/^\| (@duoquote\/polytini@[^|]*?) \|/gm, '| **$1** |');

// The browser results don't list the typed-array group, so fall back to the
// variant names the adapters give those rows.
const flatRows = (d) => new Set(d.groups?.flat ?? d.results.map((r) => r.impl).filter((n) => /Float64Array|encodeDeltas/.test(n)));

function block(name) {
  if (name === 'size') {
    const md = readFileSync(`${root}results/size.md`, 'utf8');
    return mark(md.slice(md.indexOf('| Package')).trim());
  }
  const file = `${root}results/${name}.json`;
  if (!existsSync(file)) throw new Error(`no ${file}: run the benchmark first`);
  const d = JSON.parse(readFileSync(file, 'utf8'));
  const spreads = d.results.map((r) => r.spread).sort((a, b) => a - b);
  const pct = (x) => `${(x * 100).toFixed(0)}%`;
  const meta = [
    `${d.env.runtimeLabel}, ${d.env.date}. \`@duoquote/polytini\` resolved to \`${d.polytiniEntry}\`.`,
    `Between rounds, a cell moved by a median of ${pct(spreads[(spreads.length - 1) >> 1])}, and ${pct(spreads.at(-1))} at worst.`,
  ].join(' ');
  return `${meta}\n\n${mark(tables(d.results, cols(d.precision), flatRows(d)))}`;
}

let s = readFileSync(readme, 'utf8');
s = s.replace(/<!-- results:([\w-]+) -->[\s\S]*?<!-- \/results:\1 -->/g, (_, name) => `<!-- results:${name} -->\n${block(name)}\n<!-- /results:${name} -->`);
writeFileSync(readme, s);
console.error('README.md tables updated');
