#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const distEntry = resolve(dir, '../dist/cli.js');

if (!existsSync(distEntry)) {
  process.stderr.write('[unisane] Missing dist/cli.js. Run "pnpm --filter unisane build" first.\n');
  process.exit(1);
}

await import(pathToFileURL(distEntry).href);
