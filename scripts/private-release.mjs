import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, '.tmp/private-release');
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const write = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
const run = (cmd, args, cwd = root) =>
  execFileSync(cmd, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const hash = (path) => `sha512-${createHash('sha512').update(readFileSync(path)).digest('base64')}`;
const policy = read(join(root, 'tools/repository/standalone-integrity-policy.json'));
const selected = readdirSync(join(root, 'packages'))
  .map((name) => join(root, 'packages', name))
  .filter((path) => existsSync(join(path, 'package.json')))
  .map((path) => ({ path, manifest: read(join(path, 'package.json')) }))
  .filter(({ manifest }) => policy.acceptedPrivatePackages.includes(manifest.name));
assert.equal(selected.length, policy.acceptedPrivatePackages.length);
const version = '0.1.0-next.20260910.1';
const targets = (value) =>
  typeof value === 'string' ? [value] : Object.values(value ?? {}).flatMap(targets);

function prepare() {
  rmSync(output, { recursive: true, force: true });
  mkdirSync(output, { recursive: true });
  const packages = [];
  for (const { path, manifest } of selected) {
    assert.equal(manifest.version, version);
    assert.equal(manifest.publishConfig.access, 'restricted');
    assert(manifest.name.startsWith('@unisane/'));
    run('pnpm', ['pack', '--pack-destination', output], path);
    const archive = `${manifest.name.replace('@unisane/', 'unisane-')}-${version}.tgz`;
    const archivePath = join(output, archive);
    const paths = run('tar', ['-tzf', archivePath]).trim().split('\n');
    for (const file of paths) {
      assert(file.startsWith('package/') && !file.split('/').includes('..'));
      assert(
        !/(^|\/)(\.npmrc|\.env(?:\.[^/]*)?|node_modules|\.git)($|\/)/u.test(file),
        `Private file ${file}`,
      );
    }
    const packed = JSON.parse(run('tar', ['-xOf', archivePath, 'package/package.json']));
    for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
      for (const [name, coordinate] of Object.entries(packed[field] ?? {})) {
        assert(!/^(workspace:|file:|link:|catalog:)/u.test(coordinate));
        if (name.startsWith('@unisane/')) {
          assert(policy.acceptedPrivatePackages.includes(name), `Unreleased dependency ${name}`);
          assert.equal(coordinate, version);
        }
      }
    }
    for (const target of [...targets(packed.exports), ...targets(packed.bin)]) {
      assert(
        !target.includes('*') && paths.includes(`package/${target.replace(/^\.\//u, '')}`),
        `Missing export ${target}`,
      );
    }
    packages.push({ name: manifest.name, version, archive, integrity: hash(archivePath) });
  }
  write(join(output, 'receipt.json'), {
    sourceCommit: run('git', ['rev-parse', 'HEAD']).trim(),
    sourceDirty: Boolean(run('git', ['status', '--porcelain']).trim()),
    registryVerified: false,
    packages,
  });
  console.log(`Prepared ${packages.length} private Ops packages`);
}

function consumer() {
  const receipt = read(join(output, 'receipt.json'));
  const directory = mkdtempSync(join(tmpdir(), 'ops-private-consumer-'));
  try {
    const dependencies = Object.fromEntries(
      receipt.packages.map((entry) => {
        const path = join(output, entry.archive);
        assert.equal(hash(path), entry.integrity);
        return [entry.name, `file:${path}`];
      }),
    );
    write(join(directory, 'package.json'), {
      private: true,
      type: 'module',
      dependencies,
      pnpm: { overrides: dependencies },
    });
    writeFileSync(
      join(directory, '.npmrc'),
      'registry=https://registry.npmjs.org/\nauto-install-peers=false\n',
    );
    run('pnpm', ['install', '--ignore-scripts'], directory);
    run(
      'node',
      [
        '--input-type=module',
        '-e',
        "await import('@unisane/ops/config'); await import('@unisane/growth'); await import('@unisane/web-runtime');",
      ],
      directory,
    );
    const info = JSON.parse(run('pnpm', ['exec', 'unisane-ops', 'info', '--json'], directory));
    assert.equal(info.result.cli.name, '@unisane/ops');
    assert.equal(info.result.cli.version, version);
    receipt.consumerVerified = true;
    write(join(output, 'receipt.json'), receipt);
    console.log('Isolated Ops install, imports and CLI passed');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function publish() {
  const receipt = read(join(output, 'receipt.json'));
  assert.equal(process.env.GITHUB_ACTIONS, 'true');
  assert.equal(receipt.sourceCommit, process.env.GITHUB_SHA);
  assert.equal(receipt.sourceDirty, false);
  assert.equal(receipt.consumerVerified, true);
  assert.deepEqual(
    receipt.packages.map((entry) => entry.name).sort(),
    [...policy.acceptedPrivatePackages].sort(),
  );
  for (const entry of receipt.packages) {
    const path = join(output, entry.archive);
    assert.equal(hash(path), entry.integrity);
    const args = [
      'view',
      `${entry.name}@${version}`,
      'dist.integrity',
      '--json',
      '--registry=https://registry.npmjs.org/',
    ];
    let existing;
    try {
      existing = JSON.parse(run('npm', args, output));
    } catch (error) {
      assert(/E404/u.test(String(error.stdout ?? '')), `Registry lookup failed: ${entry.name}`);
    }
    if (existing)
      assert.equal(existing, entry.integrity, `Different archive already published: ${entry.name}`);
    else {
      run(
        'npm',
        [
          'publish',
          path,
          '--ignore-scripts',
          '--access=restricted',
          '--tag=next',
          '--registry=https://registry.npmjs.org/',
        ],
        output,
      );
      assert.equal(JSON.parse(run('npm', args, output)), entry.integrity);
    }
    console.log(`Registry verified ${entry.name}@${version}`);
  }
  receipt.registryVerified = true;
  write(join(output, 'receipt.json'), receipt);
}

const mode = process.argv[2];
assert(['prepare', 'consumer', 'publish'].includes(mode));
({ prepare, consumer, publish })[mode]();
