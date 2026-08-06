import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const projectRoot = mkdtempSync(path.join(tmpdir(), 'unisane-ops-mcp-host-'));
const researchRoot = path.join(projectRoot, 'research');

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
      manifests: { research: 'research' },
      runtime: { integration: 'existing' },
      policy: { mutation: 'approval-required', spend: 'approval-required' }
    }
  }
};\n`,
);

for (const directory of ['opportunities', 'clusters', 'competitors', 'serp']) {
  mkdirSync(path.join(researchRoot, directory), { recursive: true });
}
writeFileSync(
  path.join(researchRoot, 'seo-research.config.json'),
  JSON.stringify({
    version: 2,
    platformId: 'mcp-fixture',
    markets: [{ country: 'US', language: 'en' }],
  }),
);
writeFileSync(
  path.join(researchRoot, 'opportunities', 'pages.json'),
  JSON.stringify({
    version: 1,
    platformId: 'mcp-fixture',
    sourcePatternPack: 'resume',
    basePath: 'templates',
    opportunities: [
      {
        id: 'resume-templates',
        platformId: 'mcp-fixture',
        clusterId: 'templates',
        sourcePatternPack: 'resume',
        status: 'approved',
        priority: 'p0',
        fit: 'strong',
        intent: 'commercial',
        pageType: 'category',
        slug: 'templates',
        routePath: '/templates',
        title: 'Resume templates',
        h1: 'Resume templates',
        metaDescription: 'Compare practical resume templates.',
        primaryKeyword: 'resume templates',
        supportingKeywords: ['resume formats'],
        totalVolume: 10000,
        sections: [],
        internalLinks: [],
        cta: { label: 'Build', target: '/builder' },
        rationale: 'Recorded research supports this page.',
      },
    ],
  }),
);
writeFileSync(
  path.join(researchRoot, 'clusters', 'clusters.json'),
  JSON.stringify({
    version: 1,
    platformId: 'mcp-fixture',
    sourcePatternPack: 'resume',
    clusters: [
      {
        id: 'templates',
        label: 'Templates',
        platformId: 'mcp-fixture',
        intent: 'commercial',
        pageType: 'category',
        primaryKeyword: 'resume templates',
        secondaryKeywords: ['resume formats'],
        priority: 'p0',
        rationale: 'Supported cluster.',
        fit: 'strong',
        status: 'candidate',
      },
    ],
  }),
);
writeFileSync(
  path.join(researchRoot, 'competitors', 'competitors.json'),
  JSON.stringify({
    version: 1,
    platformId: 'mcp-fixture',
    market: 'US / en',
    source: 'manual',
    pages: [
      {
        id: 'competitor',
        platformId: 'mcp-fixture',
        source: 'manual',
        keyword: 'resume templates',
        url: 'https://example.com/templates',
        domain: 'example.com',
        categoryPath: [],
        contentPatterns: [],
      },
    ],
  }),
);
writeFileSync(
  path.join(researchRoot, 'serp', 'serp.json'),
  JSON.stringify({ snapshots: [{ keyword: 'resume templates', country: 'US', language: 'en' }] }),
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
        'prepare_seo_implementation',
        'verify_seo_publication',
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

    const preparation = await client.callTool({
      name: 'prepare_seo_implementation',
      arguments: {
        projectId: 'mcp-fixture',
        environmentId: 'test',
        opportunityId: 'resume-templates',
        audience: 'coding-agent',
      },
    });
    assert.notEqual(preparation.isError, true, JSON.stringify(preparation));
    assert.equal(
      preparation.structuredContent?.packet?.selection?.opportunityId,
      'resume-templates',
    );
    assert.equal(
      existsSync(path.join(researchRoot, 'prepared', 'templates.implementation.json')),
      true,
    );
    assert.equal(
      catalog.tools.some((tool) => tool.name === 'record_seo_publication'),
      false,
    );

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
