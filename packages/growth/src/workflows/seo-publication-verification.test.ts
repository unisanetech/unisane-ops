import { access, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import { registerGrowthCommands } from '../cli/register.js';
import { prepareSeoImplementationPacket } from '../playbooks/seo-opportunity-preparation.js';
import { planSeoOpportunityResearch } from '../playbooks/seo-opportunity-research-plan.js';
import {
  rankSeoOpportunityCandidates,
  type SeoOpportunityCandidate,
} from '../playbooks/seo-opportunity-research.js';
import type { PageOpportunity } from '../seo/schema/opportunity.js';
import { createGrowthSeoOpportunityExecutor } from './seo-opportunity-execution.js';
import {
  findSeoPublicationRecord,
  recordSeoPublicationArtifacts,
  verifySeoPublicationArtifacts,
} from './seo-publication-verification.js';

const now = new Date('2026-08-04T00:00:00.000Z');

function candidate(clicks = 10): SeoOpportunityCandidate {
  return {
    id: 'resume-templates',
    title: 'Resume templates',
    routePath: '/templates',
    primaryKeyword: 'resume templates',
    market: 'US / en',
    intent: 'commercial',
    rationale: 'Recorded evidence supports the templates page.',
    signals: {
      estimatedMonthlySearches: 10_000,
      competitionIndex: 24,
      marketFit: 'strong',
      currentClicks: clicks,
      currentImpressions: 200,
      currentCtr: clicks / 200,
      currentPosition: 18,
    },
    evidence: ['keyword', 'market', 'serp', 'page'].map((kind) => ({
      evidenceId: `resume-templates.${kind}`,
      revision: 1,
      kind: kind as 'keyword' | 'market' | 'serp' | 'page',
      source: `${kind} research`,
      observedAt: now.toISOString(),
      freshness: 'fresh' as const,
      summary: `Recorded ${kind} evidence.`,
      sampleData: false,
      limitations: [],
      issues: [],
      status: 'current' as const,
    })),
  };
}

const page: PageOpportunity = {
  id: 'resume-templates',
  platformId: 'true-resume',
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
  supportingKeywords: [],
  sections: [],
  internalLinks: [],
  cta: { label: 'Build', target: '/builder' },
  rationale: 'Recorded evidence supports this page.',
};

function packet() {
  const source = candidate();
  const opportunity = rankSeoOpportunityCandidates({ candidates: [source], limit: 1 })[0]!;
  return prepareSeoImplementationPacket({
    projectId: 'true-resume',
    environmentId: 'production',
    preparedAt: now.toISOString(),
    opportunityReviewObservedAt: now.toISOString(),
    opportunitySource: 'research/opportunities.json',
    opportunity,
    pageOpportunity: page,
    evidence: source.evidence,
    researchPlan: planSeoOpportunityResearch({
      candidates: [source],
      opportunities: [opportunity],
    }),
  });
}

async function review(observedAt: Date, clicks = 20) {
  return createGrowthSeoOpportunityExecutor({ loadCandidates: () => [candidate(clicks)] })({
    cwd: '/workspace',
    projectId: 'true-resume',
    environmentId: 'production',
    principal: { kind: 'user', id: 'user.test' },
    opportunityId: 'resume-templates',
    now: observedAt,
  });
}

describe('SEO publication verification artifacts', () => {
  it('registers separate record and verification leaves with bounded options', () => {
    const program = new Command();
    registerGrowthCommands(program);
    const growth = program.commands.find((command) => command.name() === 'growth');
    const seo = growth?.commands.find((command) => command.name() === 'seo');
    const opportunities = seo?.commands.find((command) => command.name() === 'opportunities');
    const record = opportunities?.commands.find(
      (command) => command.name() === 'record-publication',
    );
    const verify = opportunities?.commands.find(
      (command) => command.name() === 'verify-publication',
    );
    expect(record?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining([
        '--packet',
        '--published-url',
        '--published-at',
        '--recorded-by',
        '--confirm-reviewed',
        '--out',
        '--dry-run',
        '--json',
      ]),
    );
    expect(verify?.options.map((option) => option.long)).toEqual(
      expect.arrayContaining(['--publication', '--out', '--max-age-days', '--dry-run', '--json']),
    );
  });

  it('previews then writes the exact publication record', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'seo-publication-'));
    try {
      const common = {
        cwd,
        packetPath: 'prepared/templates.implementation.json',
        outputPath: 'publications/templates.json',
        packet: packet(),
        publishedUrl: 'https://example.com/templates',
        publishedAt: now.toISOString(),
        recordedBy: 'operator@example.com',
        confirmedReviewed: true,
        recordedAt: new Date('2026-08-04T01:00:00.000Z'),
      };
      const preview = await recordSeoPublicationArtifacts({ ...common, dryRun: true });
      expect(preview).toMatchObject({ outputPath: 'publications/templates.json', dryRun: true });
      await expect(access(path.join(cwd, preview.outputPath))).rejects.toThrow();

      const written = await recordSeoPublicationArtifacts(common);
      expect(JSON.parse(await readFile(path.join(cwd, written.outputPath), 'utf8'))).toEqual(
        written.publication,
      );
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('finds an exact canonical publication id and bounds directory scanning', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'seo-publication-lookup-'));
    try {
      const written = await recordSeoPublicationArtifacts({
        cwd,
        packetPath: 'prepared/templates.implementation.json',
        outputPath: 'publications/templates.json',
        packet: packet(),
        publishedUrl: 'https://example.com/templates',
        publishedAt: now.toISOString(),
        recordedBy: 'operator@example.com',
        confirmedReviewed: true,
        recordedAt: new Date('2026-08-04T01:00:00.000Z'),
      });
      await expect(
        findSeoPublicationRecord({
          directory: path.join(cwd, 'publications'),
          publicationId: written.publication.publicationId,
        }),
      ).resolves.toEqual({
        filePath: path.join(cwd, 'publications', 'templates.json'),
        publication: written.publication,
      });
      await expect(
        findSeoPublicationRecord({
          directory: path.join(cwd, 'publications'),
          publicationId: 'publication.missing',
        }),
      ).resolves.toBeUndefined();

      const boundedDirectory = path.join(cwd, 'bounded');
      await mkdir(boundedDirectory);
      await writeFile(path.join(boundedDirectory, 'a.json'), '{}');
      await writeFile(path.join(boundedDirectory, 'b.json'), '{}');
      await expect(
        findSeoPublicationRecord({
          directory: boundedDirectory,
          publicationId: written.publication.publicationId,
          maximumFiles: 1,
        }),
      ).rejects.toThrow(/safety bound/);
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });

  it('previews waiting state and writes an eligible measured result', async () => {
    const cwd = await mkdtemp(path.join(os.tmpdir(), 'seo-verification-'));
    try {
      const publication = (
        await recordSeoPublicationArtifacts({
          cwd,
          packetPath: 'prepared/templates.implementation.json',
          outputPath: 'publications/templates.json',
          packet: packet(),
          publishedUrl: 'https://example.com/templates',
          publishedAt: now.toISOString(),
          recordedBy: 'operator@example.com',
          confirmedReviewed: true,
          recordedAt: new Date('2026-08-04T01:00:00.000Z'),
          dryRun: true,
        })
      ).publication;
      const waitingAt = new Date('2026-08-10T00:00:00.000Z');
      const waiting = await verifySeoPublicationArtifacts({
        cwd,
        publicationPath: 'publications/templates.json',
        publication,
        outputPath: 'verifications/templates.json',
        review: await review(waitingAt),
        observedAt: waitingAt,
        dryRun: true,
      });
      expect(waiting.verification.outcome).toBe('waiting');
      await expect(access(path.join(cwd, waiting.outputPath))).rejects.toThrow();

      const eligibleAt = new Date('2026-08-20T00:00:00.000Z');
      const measured = await verifySeoPublicationArtifacts({
        cwd,
        publicationPath: 'publications/templates.json',
        publication,
        outputPath: 'verifications/templates.json',
        review: await review(eligibleAt),
        observedAt: eligibleAt,
      });
      expect(measured.verification).toMatchObject({ outcome: 'improved', windowState: 'eligible' });
      expect(JSON.parse(await readFile(path.join(cwd, measured.outputPath), 'utf8'))).toEqual(
        measured.verification,
      );
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
