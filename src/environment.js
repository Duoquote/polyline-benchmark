// What the numbers were measured on.
import os from 'node:os';

export function environment() {
  let runtime = 'node';
  let runtimeVersion = process.version;
  let engine = `V8 ${process.versions.v8}`;
  if (globalThis.Bun) {
    runtime = 'bun';
    runtimeVersion = `v${globalThis.Bun.version}`;
    engine = 'JavaScriptCore';
  } else if (globalThis.Deno) {
    runtime = 'deno';
    runtimeVersion = `v${globalThis.Deno.version.deno}`;
    engine = `V8 ${globalThis.Deno.version.v8}`;
  }
  const cpus = os.cpus();
  return {
    runtime,
    runtimeVersion,
    runtimeLabel: `${runtime[0].toUpperCase()}${runtime.slice(1)} ${runtimeVersion}`,
    engine,
    cpu: cpus[0]?.model?.trim() ?? 'unknown',
    threads: cpus.length,
    memoryGiB: Math.round(os.totalmem() / 2 ** 30),
    os: `${os.type()} ${os.release()} ${os.arch()}`,
    date: new Date().toISOString().slice(0, 10),
  };
}

export function environmentMarkdown(env) {
  return [
    `- Runtime: ${env.runtimeLabel} (${env.engine})`,
    `- CPU: ${env.cpu}, ${env.threads} threads, ${env.memoryGiB} GiB RAM`,
    `- OS: ${env.os}`,
    `- Date: ${env.date}`,
  ].join('\n');
}
