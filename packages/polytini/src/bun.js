// Bun entry. The same Buffer fast paths as Node measured fastest on
// JavaScriptCore too, so this is the Node entry under the bun condition.
/* @ts-self-types="../types/index.d.ts" */
export * from './node.js';
