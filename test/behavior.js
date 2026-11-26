// Things the libraries legitimately disagree on, printed side by side.
// Not pass/fail: the correctness test avoids these inputs on purpose.
//
//   node test/behavior.js
import { implementations } from '../src/implementations.js';
import * as ref from '../src/reference.js';

const show = (fn) => {
  try {
    return fn();
  } catch (err) {
    return `throws (${err.message})`;
  }
};

// Values that sit exactly on a rounding tie at precision 5.
const ties = [0.000005, -0.000005, 0.000015, -0.000015];
console.log(`Rounding ties at precision 5: what ${ties.join(', ')} become, in units of 1e-5\n`);
for (const impl of implementations.filter((i) => i.encode)) {
  const units = ties.map((v) => show(() => ref.decode(impl.encode(impl.toNative([[v, 0]]), 5))[0][0] * 1e5));
  console.log(`  ${impl.pkg.padEnd(28)} ${units.join(', ')}`);
}

// A valid two-point line with its last character cut off.
const truncated = ref.encode([[38.5, -120.2], [40.7, -120.95]]).slice(0, -1);
console.log(`\nTruncated input "${truncated}" (the full line is [38.5,-120.2],[40.7,-120.95])\n`);
for (const impl of implementations) {
  const out = show(() => JSON.stringify(impl.fromNative(impl.decode(truncated, 5))));
  console.log(`  ${impl.pkg.padEnd(28)} ${out}`);
}

// The largest double below 0.5, scaled: 0.49999999999999994e-5 at precision
// 5 is 0.49999999999999994 units, so it should round to 0. Code that rounds
// with Math.floor(x + 0.5) gets 1, because the addition itself rounds up.
const almostHalf = 0.49999999999999994e-5;
console.log(`\nJust below a tie: ${almostHalf} at precision 5, in units of 1e-5 (correct: 0)\n`);
for (const impl of implementations.filter((i) => i.encode)) {
  const units = show(() => ref.decode(impl.encode(impl.toNative([[almostHalf, 0]]), 5), 5)[0][0] * 1e5);
  console.log(`  ${impl.name.replace(/@\d[^ ]*/, '').padEnd(42)} ${units}`);
}

// A character outside '?'..'~' in the middle of a valid line.
const invalid = '_p~iF ~ps|U';
console.log(`\nInvalid character: ${JSON.stringify(invalid)} (a space in the middle)\n`);
for (const impl of implementations) {
  const out = show(() => JSON.stringify(impl.fromNative(impl.decode(invalid, 5))));
  console.log(`  ${impl.name.replace(/@\d[^ ]*/, '').padEnd(42)} ${out}`);
}
