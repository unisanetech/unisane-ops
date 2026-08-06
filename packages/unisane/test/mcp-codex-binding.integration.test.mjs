import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cli = path.join(packageRoot, 'dist/cli.js');
const fixtures = [];

afterEach(() => {
  while (fixtures.length) rmSync(fixtures.pop(), { recursive: true, force: true });
});

function fixture() {
  const projectRoot = mkdtempSync(path.join(tmpdir(), 'unisane-codex-binding-'));
  fixtures.push(projectRoot);
  return projectRoot;
}

function run(args) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
}

function command(projectRoot, ...additional) {
  return [
    'mcp',
    'configure',
    'codex',
    '--project',
    projectRoot,
    '--environment',
    'production',
    '--actor',
    'codex.local',
    '--actor-name',
    'Codex',
    ...additional,
    '--json',
  ];
}

test('previews a bounded Codex MCP block without writing', () => {
  const projectRoot = fixture();
  const result = run(command(projectRoot));
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  const configPath = path.join(projectRoot, '.codex', 'config.toml');
  assert.equal(output.result.applied, false);
  assert.equal(output.result.changed, true);
  assert.equal(output.result.configPath, configPath);
  assert.match(output.result.managedBlock, /\[mcp_servers\.unisane_ops\]/);
  assert.match(output.result.managedBlock, /default_tools_approval_mode = "writes"/);
  assert.equal(existsSync(configPath), false);
});

test('writes a new project-scoped binding with exact target and tool bounds', () => {
  const projectRoot = fixture();
  const configPath = path.join(projectRoot, '.codex', 'config.toml');
  const result = run(command(projectRoot, '--write'));
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.match(output.nextActions.join(' '), /trusts this repository/i);
  const config = readFileSync(configPath, 'utf8');
  assert.match(config, /command = "unisane"/);
  assert.match(config, new RegExp(projectRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(config, /"--environment","production"/);
  assert.match(config, /"--actor","codex\.local"/);
  assert.match(
    config,
    /enabled_tools = \["review_growth_health","research_seo_opportunities","prepare_seo_implementation","verify_seo_publication","audit_growth_measurement","plan_campaign_pause","review_campaign_pause","apply_approved_campaign_pause","verify_campaign_pause"\]/,
  );

  const removed = run([
    'mcp',
    'configure',
    'codex',
    '--project',
    projectRoot,
    '--remove',
    '--write',
    '--json',
  ]);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(existsSync(configPath), false);
});

test('preserves unrelated Codex settings exactly across install, update, and removal', () => {
  const projectRoot = fixture();
  const configDirectory = path.join(projectRoot, '.codex');
  const configPath = path.join(configDirectory, 'config.toml');
  const unrelated =
    '# user setting\nmodel = "gpt-example"\n[mcp_servers.other]\ncommand = "other"\n';
  mkdirSync(configDirectory, { recursive: true });
  writeFileSync(configPath, unrelated);

  const installed = run(command(projectRoot, '--write'));
  assert.equal(installed.status, 0, installed.stderr);
  const first = readFileSync(configPath, 'utf8');
  assert.equal(first.endsWith(unrelated), true);

  const updated = run([
    'mcp',
    'configure',
    'codex',
    '--project',
    projectRoot,
    '--environment',
    'staging',
    '--actor',
    'codex.local',
    '--write',
    '--json',
  ]);
  assert.equal(updated.status, 0, updated.stderr);
  const second = readFileSync(configPath, 'utf8');
  assert.equal(second.endsWith(unrelated), true);
  assert.match(second, /"--environment","staging"/);
  assert.doesNotMatch(second, /"--environment","production"/);

  const idempotent = run([
    'mcp',
    'configure',
    'codex',
    '--project',
    projectRoot,
    '--environment',
    'staging',
    '--actor',
    'codex.local',
    '--write',
    '--json',
  ]);
  assert.equal(idempotent.status, 0, idempotent.stderr);
  assert.equal(JSON.parse(idempotent.stdout).result.changed, false);
  assert.equal(readFileSync(configPath, 'utf8'), second);

  const removed = run([
    'mcp',
    'configure',
    'codex',
    '--project',
    projectRoot,
    '--remove',
    '--write',
    '--json',
  ]);
  assert.equal(removed.status, 0, removed.stderr);
  assert.equal(readFileSync(configPath, 'utf8'), unrelated);
});

test('rejects relative projects, invalid identities, and incomplete managed blocks', () => {
  const relative = run(command('.', '--write'));
  assert.notEqual(relative.status, 0);
  assert.match(relative.stderr, /OPS_MCP_CODEX_PROJECT_INVALID/);

  const projectRoot = fixture();
  const invalidActor = run([
    'mcp',
    'configure',
    'codex',
    '--project',
    projectRoot,
    '--environment',
    'production',
    '--actor',
    'Codex User',
    '--write',
  ]);
  assert.notEqual(invalidActor.status, 0);
  assert.match(invalidActor.stderr, /OPS_MCP_CODEX_ID_INVALID/);

  const configDirectory = path.join(projectRoot, '.codex');
  mkdirSync(configDirectory, { recursive: true });
  writeFileSync(path.join(configDirectory, 'config.toml'), '# >>> unisane ops mcp:codex >>>\n');
  const incomplete = run(command(projectRoot, '--write'));
  assert.notEqual(incomplete.status, 0);
  assert.match(incomplete.stderr, /OPS_MCP_CODEX_BLOCK_INVALID/);
});
