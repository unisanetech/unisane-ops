#!/usr/bin/env node

import { runUnisaneOpsCli } from './host.js';

try {
  process.exitCode = await runUnisaneOpsCli(process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
