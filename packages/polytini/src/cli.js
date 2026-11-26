#!/usr/bin/env node
// The polytini command. npx/bunx/pnpm dlx/yarn dlx run this through the
// package's bin, and `deno run jsr:@duoquote/polytini/cli` runs it directly.
/* @ts-self-types="../types/cli.d.ts" */
import { main } from './cli-lib.js';

main();
