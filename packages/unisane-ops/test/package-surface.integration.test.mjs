import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8'));

test('package exposes the final Ops coordinate, binary, config, and metadata subpaths', () => {
  assert.equal(manifest.name, 'unisane-ops');
  assert.deepEqual(manifest.bin, { 'unisane-ops': './dist/cli.js' });
  assert.deepEqual(Object.keys(manifest.exports), ['./config', './meta']);
  assert.equal(manifest.exports['./config'].types, './dist/config/index.d.ts');
  assert.equal(manifest.exports['./config'].import, './dist/config/index.js');
  assert.equal(manifest.exports['./meta'], './unisane.meta.json');
  assert.equal(existsSync(path.resolve(packageRoot, '../unisane')), false);
  assert.equal(existsSync(path.join(packageRoot, 'bin/cli.js')), false);
});
