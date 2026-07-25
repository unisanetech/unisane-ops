import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { MarketingProviderReportArtifact, MarketingReportProvider } from '../schema/report.js';
import { providerLatestPullPath, providerPullCacheDir } from './paths.js';

export type MarketingProviderCacheWriteResult = {
  ok: boolean;
  provider: MarketingReportProvider;
  reportType?: MarketingProviderReportArtifact['reportType'];
  path: string;
  latestPath: string;
  recordCount: number;
  pulledAt: string;
  window: MarketingProviderReportArtifact['window'];
};

function safeTimestamp(iso: string): string {
  return iso.replaceAll(':', '-').replaceAll('.', '-');
}

export function cacheMarketingProviderReportArtifact(
  cwd: string,
  artifact: MarketingProviderReportArtifact,
): MarketingProviderCacheWriteResult {
  const outputDir = providerPullCacheDir(cwd, artifact.provider, artifact.reportType);
  mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${safeTimestamp(artifact.pulledAt)}.json`);
  const latestPath = providerLatestPullPath(cwd, artifact.provider, artifact.reportType);
  const serialized = `${JSON.stringify(artifact, null, 2)}\n`;
  writeFileSync(outputPath, serialized, 'utf8');
  writeFileSync(latestPath, serialized, 'utf8');
  return {
    ok: true,
    provider: artifact.provider,
    reportType: artifact.reportType,
    path: outputPath,
    latestPath,
    recordCount: artifact.records.length,
    pulledAt: artifact.pulledAt,
    window: artifact.window,
  };
}
