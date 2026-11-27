# AGENTS.md

Notes for AI coding agents working in this repository.

This repo compares the JavaScript libraries for Google's encoded polyline format: correctness first, then speed, memory and size, on Bun, Node 22 to 26, Deno and Chrome. It isn't published anywhere (`"private": true`). polytini comes from npm at an exact version, like the other libraries (see docs/methodology.md#updating-polytini).

## Commands

```sh
npm ci
npm test                 # correctness of every library against src/reference.js (Node)
npm run test:bun
npm run test:deno
npm run behavior         # where libraries legitimately disagree; prints, never fails
npm run bench:quick      # about a minute, one round, writes nothing
npm run bench:all        # every runtime, about 10 minutes, writes results/
npm run size             # gzipped bundle size per library
npm run charts           # docs/charts and docs/badges from results/*.json
node bench/readme.js     # the tables in README.md and docs/
```

Single runtimes: `npm run bench`, `bench:bun`, `bench:deno`, `bench:browser` (needs Chrome) and `bench:flexible`. Options go after `--`: `--precision 5|6`, `--time <ms>`, `--rounds <n>`, `--only <text>`, `--no-write`.

## Where things live

- `src/adapters.js`: one adapter per library and variant. It's the only file that imports the libraries.
- `src/implementations.js`: the adapters with their installed versions, for Node, Bun and Deno.
- `src/reference.js`: a short, slow codec written to be easy to check. Everything is tested against it.
- `src/fixtures.js`, `fixtures/example.csv`: the seeded GPS-like tracks and the 1000 real-world lines.
- `bench/`: the harness (`run.js`, `measure.js`, `matrix.js`, `memory.js`, `browser.js`, `size.js`) and the report scripts (`report.js`, `best.js`, `charts.js`, `readme.js`).
- `results/`: raw results per runtime, as `.json` and `.md`. `docs/`: generated tables and charts, plus `methodology.md`.

## Adding a library

1. Install it at an exact version (`npm install --save-exact <pkg>`).
2. Add an adapter to `defs` in `src/adapters.js`: `pkg`, `shape` (one of the keys of `shapes`, the point shape the library takes), `precisions` it supports, and `encode`/`decode` that take data already in that shape. Use `group: 'flat'` for typed arrays and `group: 'batch'` for many lines per call.
3. Add it to `bench/size.js`, and to the library table in `docs/methodology.md` with its version, publish date and weekly downloads.
4. `npm test` on Node, Bun and Deno. If it's wrong on some input, don't hide it: document it in `KNOWN_ISSUES` in `test/correctness.js` with the reason.
5. Run it with `npm run bench:quick -- --only <name>` to check it works. Leave the full run and the committed results to the maintainer.

## Rules

- Don't commit results from a quick run, and don't edit numbers in README.md or docs/ by hand: they come from `results/*.json` through `bench/readme.js` and `bench/charts.js`.
- Keep the harness the same for every library: inputs prepared in each library's own shape ahead of time, one child process per library, interleaved rounds in a shuffled order. A change to the harness changes every row, so say so in the PR.
- Never put a `GOOGLE_MAPS_API_KEY` in a file. The run fails if one shows up in a result.
- Prose is plain and short, with numbers and no marketing words. Gaps inside the noise are called even.
- Ask the person you're working for before opening an issue or a PR, and say in the PR that an AI agent helped.
