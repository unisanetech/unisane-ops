import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const artifacts = resolve(process.argv[2] ?? '');
assert(
  process.argv[2],
  'Pass a directory containing current packed Core and Web Runtime packages.',
);
const required = new Set([
  '@unisane/primitives',
  '@unisane/config',
  '@unisane/kernel',
  '@unisane/events',
  '@unisane/outbox-postgresql',
  '@unisane/web-runtime',
]);
const dependencies = {};
for (const name of readdirSync(artifacts).filter((name) => name.endsWith('.tgz'))) {
  const archive = join(artifacts, name);
  const manifest = JSON.parse(
    execFileSync('tar', ['-xOf', archive, 'package/package.json'], { encoding: 'utf8' }),
  );
  if (!required.has(manifest.name)) continue;
  assert(!dependencies[manifest.name], `Ambiguous artifacts for ${manifest.name}`);
  dependencies[manifest.name] = `file:${archive}`;
}
assert.equal(
  Object.keys(dependencies).length,
  required.size,
  'Missing packed integration dependencies',
);
const consumer = mkdtempSync(join(tmpdir(), 'unisane-conversion-consumer-'));
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify(
    {
      private: true,
      type: 'module',
      dependencies: { ...dependencies, pg: '8.17.1' },
      pnpm: { overrides: dependencies },
    },
    null,
    2,
  ),
);
writeFileSync(join(consumer, '.npmrc'), 'auto-install-peers=false\n');
copyFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'core-outbox.mjs'),
  join(consumer, 'core-outbox.mjs'),
);
execFileSync('pnpm', ['install', '--ignore-scripts', '--prefer-offline'], {
  cwd: consumer,
  stdio: 'inherit',
});
execFileSync('node', ['core-outbox.mjs'], { cwd: consumer, stdio: 'inherit', env: process.env });
console.log(`Isolated consumer: ${consumer}`);
