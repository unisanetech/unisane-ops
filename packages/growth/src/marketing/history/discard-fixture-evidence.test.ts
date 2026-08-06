import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { MarketingProviderReportArtifact } from '../schema/report.js';
import { readMarketingHistoryCatalog } from './catalog.js';
import { discardMarketingFixtureEvidence } from './discard-fixture-evidence.js';

function artifact(input: {
  provider: 'googleAds' | 'metaAds';
  source: 'api' | 'fixture';
  pulledAt: string;
}): MarketingProviderReportArtifact {
  return {
    version: 1,
    platformId: 'example',
    appId: 'app',
    provider: input.provider,
    reportType: 'campaign',
    source: input.source,
    pulledAt: input.pulledAt,
    window: { startDate: '2026-07-01', endDate: '2026-07-29' },
    partial: false,
    records: [],
  };
}

function writeArtifact(cwd: string, value: MarketingProviderReportArtifact, name: string): string {
  const directory = path.join(
    cwd,
    '.unisane/marketing/cache/provider-pulls',
    value.provider,
    value.reportType ?? '',
  );
  mkdirSync(directory, { recursive: true });
  const artifactPath = path.join(directory, name);
  writeFileSync(artifactPath, `${JSON.stringify(value, null, 2)}\n`);
  return artifactPath;
}

describe('discardMarketingFixtureEvidence', () => {
  it('previews fixture-only provider evidence without changing files', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-growth-fixture-preview-'));
    const fixture = artifact({
      provider: 'metaAds',
      source: 'fixture',
      pulledAt: '2026-07-30T21:12:11.253Z',
    });
    const artifactPath = writeArtifact(cwd, fixture, '2026-07-30T21-12-11-253Z.json');
    writeArtifact(cwd, fixture, 'latest.json');

    const result = discardMarketingFixtureEvidence({ cwd, provider: 'metaAds' });

    expect(result).toMatchObject({ applied: false, provider: 'metaAds', removedPaths: [] });
    expect(result.candidatePaths).toHaveLength(2);
    expect(readFileSync(artifactPath, 'utf8')).toContain('"source": "fixture"');
  });

  it('removes only selected-provider fixtures and rebuilds history from real evidence', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-growth-fixture-apply-'));
    const metaFixture = artifact({
      provider: 'metaAds',
      source: 'fixture',
      pulledAt: '2026-07-30T21:12:11.253Z',
    });
    const googleApi = artifact({
      provider: 'googleAds',
      source: 'api',
      pulledAt: '2026-07-30T13:19:28.237Z',
    });
    writeArtifact(cwd, metaFixture, '2026-07-30T21-12-11-253Z.json');
    writeArtifact(cwd, metaFixture, 'latest.json');
    const googlePath = writeArtifact(cwd, googleApi, '2026-07-30T13-19-28-237Z.json');
    writeArtifact(cwd, googleApi, 'latest.json');

    const result = discardMarketingFixtureEvidence({
      cwd,
      provider: 'metaAds',
      confirm: true,
      now: new Date('2026-08-06T00:00:00.000Z'),
    });

    expect(result).toMatchObject({
      applied: true,
      provider: 'metaAds',
      historyObservationCount: 1,
    });
    expect(result.removedPaths).toHaveLength(2);
    expect(readFileSync(googlePath, 'utf8')).toContain('"source": "api"');
    expect(readMarketingHistoryCatalog(cwd).observations).toMatchObject([
      { provider: 'googleAds', source: 'api', sampleData: false },
    ]);
  });

  it('restores the latest alias when real provider evidence survives a fixture cleanup', async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), 'unisane-growth-fixture-restore-'));
    const metaApi = artifact({
      provider: 'metaAds',
      source: 'api',
      pulledAt: '2026-07-29T00:00:00.000Z',
    });
    const metaFixture = artifact({
      provider: 'metaAds',
      source: 'fixture',
      pulledAt: '2026-07-30T00:00:00.000Z',
    });
    writeArtifact(cwd, metaApi, '2026-07-29T00-00-00-000Z.json');
    writeArtifact(cwd, metaFixture, '2026-07-30T00-00-00-000Z.json');
    writeArtifact(cwd, metaFixture, 'latest.json');

    const result = discardMarketingFixtureEvidence({ cwd, provider: 'metaAds', confirm: true });
    const latest = path.join(
      cwd,
      '.unisane/marketing/cache/provider-pulls/metaAds/campaign/latest.json',
    );

    expect(result.restoredLatestPaths).toEqual([
      '.unisane/marketing/cache/provider-pulls/metaAds/campaign/latest.json',
    ]);
    expect(JSON.parse(readFileSync(latest, 'utf8'))).toMatchObject({ source: 'api' });
  });
});
