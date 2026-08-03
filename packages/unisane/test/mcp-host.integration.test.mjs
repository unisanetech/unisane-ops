import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = mkdtempSync(path.join(tmpdir(), 'unisane-ops-mcp-host-'));

after(() => rmSync(projectRoot, { recursive: true, force: true }));

writeFileSync(
  path.join(projectRoot, 'unisane.config.ts'),
  `export const ops = {
  schemaVersion: 1,
  project: { id: 'mcp-fixture' },
  environments: { test: { production: false } },
  connections: {},
  targets: {},
  capabilities: {
    growth: {
      schemaVersion: 1,
      adoptionMode: 'adopt-existing',
      capabilities: ['seo', 'analytics', 'advertising'],
      environments: { test: { connections: {}, resources: [] } },
      manifests: {},
      runtime: { integration: 'existing' },
      policy: { mutation: 'approval-required', spend: 'approval-required' }
    }
  }
};\n`,
);

test('canonical CLI serves the bound Growth MCP catalog and composes campaign planning', async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      path.join(packageRoot, 'bin/cli.js'),
      'mcp',
      'serve',
      '--project',
      projectRoot,
      '--environment',
      'test',
      '--actor',
      'codex.test',
      '--actor-name',
      'Codex test agent',
    ],
    cwd: packageRoot,
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', (chunk) => {
    stderr += String(chunk);
  });
  const client = new Client({ name: 'unisane-ops-host-test', version: '1.0.0' });
  try {
    await client.connect(transport);
    const catalog = await client.listTools();
    assert.deepEqual(
      catalog.tools.map((tool) => tool.name),
      [
        'review_growth_health',
        'research_seo_opportunities',
        'audit_growth_measurement',
        'plan_campaign_pause',
        'review_campaign_pause',
        'apply_approved_campaign_pause',
        'verify_campaign_pause',
      ],
    );
    const result = await client.callTool({
      name: 'review_growth_health',
      arguments: {
        projectId: 'mcp-fixture',
        environmentId: 'test',
        findingLimit: 5,
      },
    });
    assert.notEqual(result.isError, true);
    assert.equal(result.structuredContent?.schemaVersion, 2);

    const mismatch = await client.callTool({
      name: 'review_growth_health',
      arguments: { projectId: 'another-project', environmentId: 'test' },
    });
    assert.equal(mismatch.isError, true);
    assert.match(String(mismatch.content[0]?.text), /target_mismatch/);

    const campaignPlan = await client.callTool({
      name: 'plan_campaign_pause',
      arguments: {
        projectId: 'mcp-fixture',
        environmentId: 'test',
        provider: 'googleAds',
        providerAccountId: '1234567890',
        campaignId: '42',
        evidenceRevision: 'evidence-1',
      },
    });
    assert.notEqual(campaignPlan.isError, true);
    assert.equal(campaignPlan.structuredContent?.review?.status, 'approval-required');
    assert.equal(campaignPlan.structuredContent?.review?.target?.campaignId, '42');

    const unapprovedApply = await client.callTool({
      name: 'apply_approved_campaign_pause',
      arguments: {
        projectId: 'mcp-fixture',
        environmentId: 'test',
        runId: campaignPlan.structuredContent.runId,
        currentEvidenceRevision: 'evidence-1',
        confirmTarget: 'googleAds:1234567890:42',
      },
    });
    assert.equal(unapprovedApply.isError, true);
    assert.match(String(unapprovedApply.content[0]?.text), /approval_required/);
  } finally {
    await client.close();
  }
  assert.equal(stderr, '');
});
