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
