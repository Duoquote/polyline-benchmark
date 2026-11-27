// `--prio high` in bench/matrix.js: every benchmark process raises its own
// priority through this, because on Windows a child doesn't inherit a high
// priority class from its parent. The affinity mask does get inherited, so
// matrix.js only sets that once, on itself.
import os from 'node:os';

export function applyPriority() {
  if (process.env.BENCH_PRIORITY !== 'high') return;
  try {
    os.setPriority(os.constants.priority.PRIORITY_HIGH);
  } catch {
    // Not allowed here (some runtimes or users); the run goes on at normal priority.
  }
}
