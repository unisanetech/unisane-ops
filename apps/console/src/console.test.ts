import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildMarketingConsoleState,
  loadGrowthConsoleExecutionContext,
  runWithGrowthConsoleRuntime,
} from '@unisane/growth/console';
import { writeMarketingProviderReportPull } from '@unisane/growth/marketing';
import { buildMarketingConsoleApp } from './build.js';

function createTempProject(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-marketing-console-'));
  mkdirSync(path.join(cwd, 'docs', 'marketing'), { recursive: true });
  writeFileSync(
    path.join(cwd, 'unisane.config.ts'),
    `export const ops = {
  schemaVersion: 1,
  project: { id: 'true-resume' },
  environments: {
    production: { production: true }
  },
  connections: {},
  targets: {},
  capabilities: {
    growth: {
      schemaVersion: 1,
      adoptionMode: 'adopt-existing',
      capabilities: ['seo', 'analytics', 'tag-manager', 'advertising'],
      environments: {
        production: { connections: {}, resources: [] }
      },
      manifests: {
        events: 'docs/marketing/events.json',
        conversions: 'docs/marketing/conversions.json',
        research: 'ops/growth/research'
      },
      runtime: {
        integration: 'tag-manager',
        manifest: 'ops/growth/tag-manager.ts'
      },
      policy: {
        mutation: 'disabled',
        spend: 'disabled'
      }
    }
  }
};`,
    'utf8',
  );
  writeFileSync(
    path.join(cwd, 'docs', 'marketing', 'events.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        events: [
          {
            id: 'resume_import_completed',
            name: 'resume_import_completed',
            owner: 'true-resume/growth',
            source: 'server',
            lifecycle: 'lead',
            requiredProperties: [{ name: 'eventId', type: 'string' }],
            optionalProperties: [],
            consent: { required: true, categories: ['analytics', 'ads'] },
            attributionFields: ['gclid', '_fbp'],
            eventIdRule: 'Use canonical server event id.',
            dedupeRule: 'Dedupe by event id.',
            mappings: {
              ga4: { eventName: 'resume_import_completed', keyEvent: true },
              internalAnalytics: { eventName: 'resume_import_completed', goal: 'lead' },
            },
            reportingGoal: 'lead',
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
  writeFileSync(
    path.join(cwd, 'docs', 'marketing', 'conversions.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        conversions: [
          {
            id: 'resume_import_completed_lead',
            name: 'Resume import completed',
            owner: 'true-resume/growth',
            sourceEventId: 'resume_import_completed',
            lifecycle: 'lead',
            goal: 'lead',
            confirmationSource: 'server',
            eventIdRule: 'Use canonical server event id.',
            dedupeRule: 'Dedupe by event id.',
            mappings: {
              ga4: { eventName: 'resume_import_completed', keyEvent: true },
              googleAds: {
                conversionActionName: 'Resume Import Completed',
                category: 'LEAD',
                primary: true,
              },
              meta: { pixelEventName: 'Lead', capiEventName: 'Lead' },
              internalAnalytics: { eventName: 'resume_import_completed', goal: 'lead' },
            },
            reportingGoal: 'lead',
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
  return cwd;
}

function runWithTestProjectContext<T>(cwd: string, run: () => T): T {
  const runtime = {
    resolveBinding: async (_bindingId: string, input: unknown) => {
      const request = input as { operation?: string };
      if (request.operation !== 'growth.project.context') {
        throw new Error(`[TEST_PROVIDER_OPERATION_UNEXPECTED] ${request.operation ?? 'missing'}`);
      }
      return {
        projectRoot: cwd,
        configPath: path.join(cwd, 'unisane.config.ts'),
        projectId: 'true-resume',
        environments: { production: { production: true } },
        growth: {
          schemaVersion: 1,
          adoptionMode: 'adopt-existing',
          capabilities: ['seo', 'analytics', 'tag-manager', 'advertising'],
          environments: {
            production: { connections: {}, resources: [] },
          },
          manifests: {
            events: 'docs/marketing/events.json',
            conversions: 'docs/marketing/conversions.json',
            research: 'ops/growth/research',
          },
          runtime: {
            integration: 'tag-manager',
            manifest: 'ops/growth/tag-manager.ts',
          },
          policy: {
            mutation: 'disabled',
            spend: 'disabled',
          },
        },
      };
    },
  };
  return runWithGrowthConsoleRuntime(runtime as never, cwd, run);
}

function writeProviderInput(cwd: string): string {
  const inputPath = path.join(cwd, 'google-ads-campaign.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider: 'googleAds',
        reportType: 'campaign',
        source: 'manual-export',
        pulledAt: '2026-05-21T00:00:00.000Z',
        window: { startDate: '2026-05-01', endDate: '2026-05-21' },
        records: [
          {
            id: 'campaign_1',
            level: 'campaign',
            currency: 'INR',
            campaignId: 'campaign_1',
            campaignName: 'True Resume Search',
            metrics: {
              impressions: 1000,
              clicks: 100,
              cost: 250,
              conversions: 10,
              conversionValue: 1000,
            },
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
  return inputPath;
}

function writeSearchConsoleInput(cwd: string): string {
  const inputPath = path.join(cwd, 'search-console-query-page.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        window: { startDate: '2026-05-01', endDate: '2026-05-21' },
        siteUrl: 'https://true-resume.example.com',
        dimensions: ['query', 'page'],
        rows: [
          {
            keys: [
              'executive resume templates',
              'https://true-resume.example.com/templates/executive',
            ],
            clicks: 3,
            impressions: 120,
            ctr: 0.025,
            position: 8.4,
          },
          {
            keys: ['resume builder', 'https://true-resume.example.com/templates'],
            clicks: 1,
            impressions: 80,
            ctr: 0.0125,
            position: 12.2,
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
  return inputPath;
}

function writeGtmArtifacts(cwd: string): void {
  const root = path.join(cwd, '.unisane', 'gtm', 'true-resume', 'production');
  const snapshots = path.join(root, 'snapshots');
  const plans = path.join(root, 'plans');
  const receipts = path.join(root, 'receipts');
  const previews = path.join(root, 'previews');
  mkdirSync(snapshots, { recursive: true });
  mkdirSync(plans, { recursive: true });
  mkdirSync(receipts, { recursive: true });
  mkdirSync(previews, { recursive: true });
  writeFileSync(
    path.join(snapshots, 'gtm-snapshot-2026-05-21T00-00-00-000Z.json'),
    JSON.stringify({ containerPath: 'accounts/1/containers/2' }, null, 2),
    'utf8',
  );
  writeFileSync(
    path.join(plans, 'gtm-plan-2026-05-21T00-05-00-000Z.json'),
    JSON.stringify(
      {
        appId: 'true-resume',
        environment: 'production',
        containerPath: 'accounts/1/containers/2',
        workspacePath: 'accounts/1/containers/2/workspaces/3',
        operationCount: 0,
        validation: { ok: true, issues: [] },
      },
      null,
      2,
    ),
    'utf8',
  );
  writeFileSync(
    path.join(receipts, 'gtm-apply-receipt-2026-05-21T00-10-00-000Z.json'),
    JSON.stringify(
      {
        appId: 'true-resume',
        environment: 'production',
        accountId: '1',
        containerId: '2',
        workspacePath: 'accounts/1/containers/2/workspaces/3',
        appliedAt: '2026-05-21T00:10:00.000Z',
        operationCount: 0,
      },
      null,
      2,
    ),
    'utf8',
  );
  writeFileSync(
    path.join(previews, 'gtm-preview-2026-05-21T00-15-00-000Z.json'),
    JSON.stringify(
      {
        appId: 'true-resume',
        environment: 'production',
        accountId: '1',
        containerId: '2',
        workspacePath: 'accounts/1/containers/2/workspaces/3',
        previewedAt: '2026-05-21T00:15:00.000Z',
        compilerError: false,
        containerVersion: {
          container: {
            publicId: 'GTM-TEST123',
          },
        },
      },
      null,
      2,
    ),
    'utf8',
  );
}

function writeResearchMemory(cwd: string): void {
  const root = path.join(cwd, 'ops', 'growth', 'research');
  mkdirSync(root, { recursive: true });
  writeFileSync(
    path.join(root, 'research-memory.json'),
    JSON.stringify(
      {
        version: 1,
        appId: 'true-resume',
        title: 'CV maker planning memory',
        source: {
          kind: 'manual',
          label: 'Manual planning note',
          capturedAt: '2026-05-21T00:30:00.000Z',
        },
        records: [
          {
            id: 'cv-maker',
            title: 'CV Maker landing page',
            kind: 'landing-page',
            priority: 'p0',
            status: 'planned',
            confidence: 'high',
            capturedAt: '2026-05-21T00:30:00.000Z',
            summary: 'Build /cv-maker as a distinct commercial SEO page.',
            keywords: ['cv maker', 'online cv maker'],
            findings: ['CV maker intent is distinct from resume builder.'],
            decisions: [
              {
                id: 'build-cv-maker',
                decision: 'Build /cv-maker.',
                rationale: 'It captures distinct CV search intent.',
                priority: 'p0',
                routes: [{ path: '/cv-maker', status: 'planned' }],
              },
            ],
            opportunities: [
              {
                id: 'cv-maker-page',
                title: 'CV Maker',
                routePath: '/cv-maker',
                primaryKeyword: 'cv maker',
                priority: 'p0',
                rationale: 'Missing commercial intent.',
              },
            ],
            nextActions: [
              {
                id: 'write-copy',
                title: 'Write CV maker copy',
                priority: 'p0',
                summary: 'Write conversion-focused landing-page copy.',
              },
            ],
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
}

function writeKeywordPlannerMetrics(cwd: string): void {
  const metricsDir = path.join(cwd, 'docs', 'seo', 'keyword-research', 'metrics');
  mkdirSync(metricsDir, { recursive: true });
  writeFileSync(
    path.join(metricsDir, 'true-resume-primary-google-ads-metrics.json'),
    JSON.stringify(
      {
        version: 2,
        platformId: 'true-resume',
        country: 'US',
        language: 'en',
        provider: 'google-ads',
        runId: 'true-resume-us-ats',
        fetchedAt: '2026-05-21T00:00:00.000Z',
        market: {
          country: 'US',
          language: 'en',
          locationIds: ['2840'],
          languageId: '1000',
          currencyCode: 'USD',
        },
        source: {
          kind: 'keyword-seed',
          clusterId: 'ats',
          seedKeywords: ['ats resume checker'],
        },
        metrics: [
          {
            term: 'ats resume checker',
            normalizedTerm: 'ats resume checker',
            country: 'US',
            language: 'en',
            provider: 'google-ads',
            avgMonthlySearches: 2400,
            competition: 'MEDIUM',
            competitionIndex: 54,
            lowTopOfPageBidMicros: 1200000,
            highTopOfPageBidMicros: 4200000,
            fetchedAt: '2026-05-21T00:00:00.000Z',
          },
          {
            term: 'resume keyword optimizer',
            normalizedTerm: 'resume keyword optimizer',
            country: 'US',
            language: 'en',
            provider: 'google-ads',
            avgMonthlySearches: 900,
            competition: 'LOW',
            competitionIndex: 31,
            fetchedAt: '2026-05-21T00:00:00.000Z',
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
  writeFileSync(
    path.join(metricsDir, 'true-resume-fresher-in-google-ads-metrics.json'),
    JSON.stringify(
      {
        version: 2,
        platformId: 'true-resume',
        country: 'IN',
        language: 'en',
        provider: 'google-ads',
        runId: 'true-resume-in-fresher',
        fetchedAt: '2026-05-21T00:05:00.000Z',
        market: {
          country: 'IN',
          language: 'en',
          locationIds: ['2356'],
          languageId: '1000',
          currencyCode: 'INR',
        },
        source: {
          kind: 'keyword-seed',
          clusterId: 'cv-fresher',
          seedKeywords: ['fresher resume format'],
        },
        metrics: [
          {
            term: 'ats resume checker',
            normalizedTerm: 'ats resume checker',
            country: 'IN',
            language: 'en',
            provider: 'google-ads',
            avgMonthlySearches: 5400,
            competition: 'MEDIUM',
            competitionIndex: 48,
            lowTopOfPageBidMicros: 900000,
            highTopOfPageBidMicros: 3100000,
            fetchedAt: '2026-05-21T00:05:00.000Z',
          },
          {
            term: 'fresher resume format',
            normalizedTerm: 'fresher resume format',
            country: 'IN',
            language: 'en',
            provider: 'google-ads',
            avgMonthlySearches: 1200,
            competition: 'LOW',
            competitionIndex: 22,
            fetchedAt: '2026-05-21T00:05:00.000Z',
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
}

function writeCompetitorResearch(cwd: string): void {
  const competitorsDir = path.join(cwd, 'docs', 'seo', 'keyword-research', 'competitors');
  mkdirSync(competitorsDir, { recursive: true });
  writeFileSync(
    path.join(competitorsDir, 'homepage-resume-builder-competitors.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        market: 'Homepage resume builder intent',
        source: 'manual-web-research',
        pages: [
          {
            id: 'canva-resume-builder',
            competitor: 'Canva',
            keyword: 'free resume builder',
            position: 1,
            url: 'https://www.canva.com/create/resumes/',
            domain: 'canva.com',
            pageType: 'builder-landing-page',
            contentPatterns: [{ label: 'template library' }, { label: 'download or share' }],
            strengths: ['Strong design-first positioning.'],
            gaps: ['Less focused on ATS-safe resume structure.'],
            opportunities: ['Position TrueResume around ATS-safe job-ready resumes.'],
          },
          {
            id: 'zety-resume-builder',
            competitor: 'Zety',
            keyword: 'ai resume builder',
            position: 2,
            url: 'https://zety.com/resume-builder/t3',
            domain: 'zety.com',
            pageType: 'ai-builder-landing-page',
            contentPatterns: [{ label: 'ATS checker' }, { label: 'cover letter builder' }],
            strengths: ['Strong expert-guided workflow.'],
            gaps: ['Free download promise is qualified.'],
            opportunities: ['Make TrueResume pricing and download rules explicit.'],
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
}

function writeFaqResearch(cwd: string): void {
  const faqDir = path.join(cwd, 'docs', 'seo', 'keyword-research', 'faqs');
  mkdirSync(faqDir, { recursive: true });
  writeFileSync(
    path.join(faqDir, 'homepage-resume-builder-faqs.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        pageId: 'homepage-resume-builder',
        routePath: '/',
        source: 'llm-curated',
        capturedAt: '2026-05-21T00:30:00.000Z',
        questions: [
          {
            id: 'free-resume-builder',
            question: 'Is TrueResume a free resume builder?',
            answerIntent: 'Clarify free plan and download rules.',
            pageRole: 'homepage',
            routePath: '/',
            clusterId: 'builder',
            priority: 'p0',
            status: 'approved',
            sourceTerms: ['free resume builder'],
            supportingKeywords: ['resume maker free'],
            avgMonthlySearches: 110000,
            markets: [{ country: 'US', language: 'en', avgMonthlySearches: 110000 }],
            evidence: [{ source: 'google-ads', label: 'Keyword Planner evidence' }],
            recommendedAnswer: 'State free limits and download behavior clearly.',
            internalLinks: [{ label: 'Templates', path: '/templates' }],
          },
          {
            id: 'ats-friendly',
            question: 'Will my resume be ATS-friendly?',
            answerIntent: 'Route ATS concerns to checker and templates.',
            pageRole: 'homepage',
            routePath: '/',
            clusterId: 'ats',
            priority: 'p0',
            status: 'approved',
            avgMonthlySearches: 5400,
            evidence: [{ source: 'google-ads', label: 'ATS evidence' }],
            recommendedAnswer: 'Explain readable sections, clean formatting, and ATS checks.',
            internalLinks: [{ label: 'ATS checker', path: '/ats-checker' }],
          },
          {
            id: 'fresher-cv',
            question: 'Can I make a CV as a fresher?',
            answerIntent: 'Own fresher CV intent on the CV maker page.',
            pageRole: 'landing-page',
            routePath: '/cv-maker',
            clusterId: 'cv-fresher',
            priority: 'p1',
            status: 'planned',
            avgMonthlySearches: 1200,
            recommendedAnswer: 'Explain how freshers can use education, projects, and skills.',
            internalLinks: [{ label: 'Fresher resume format', path: '/fresher-resume-format' }],
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
}

describe('marketing console', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('builds a typed console state from marketing artifacts without secrets', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    await runWithTestProjectContext(cwd, async () => {
      const loaded = await loadGrowthConsoleExecutionContext();
      writeMarketingProviderReportPull(loaded.config, {
        cwd,
        provider: 'googleAds',
        reportType: 'campaign',
        inputPath: writeProviderInput(cwd),
        inputFormat: 'normalized',
        now: new Date('2026-05-21T00:00:00.000Z'),
      });
      writeMarketingProviderReportPull(loaded.config, {
        cwd,
        provider: 'searchConsole',
        reportType: 'queryPage',
        inputPath: writeSearchConsoleInput(cwd),
        inputFormat: 'search-console',
        now: new Date('2026-05-21T00:00:00.000Z'),
      });
      writeGtmArtifacts(cwd);
      writeResearchMemory(cwd);
      writeKeywordPlannerMetrics(cwd);
      writeCompetitorResearch(cwd);
      writeFaqResearch(cwd);

      const state = await buildMarketingConsoleState({
        cwd,
        now: new Date('2026-05-21T01:00:00.000Z'),
      });

      expect(state.kind).toBe('unisane.marketing.console-state');
      expect(state.platformId).toBe('true-resume');
      expect(state.metrics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'spend', numericValue: 250 }),
          expect.objectContaining({ id: 'conversions', numericValue: 10 }),
        ]),
      );
      expect(state.metrics).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'spend', value: '₹250 INR', currencyCode: 'INR' }),
        ]),
      );
      expect(state.freshness).toContainEqual(
        expect.objectContaining({
          id: 'googleAds.campaign',
          label: 'Google Ads campaign',
          status: 'ready',
          recordCount: 1,
          currencyCode: 'INR',
        }),
      );
      expect(state.routes.map((route) => route.id)).toContain('performance');
      expect(state.seo.rows).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            query: 'executive resume templates',
            clicks: 3,
            impressions: 120,
            ctr: 2.5,
            position: 8.4,
          }),
        ]),
      );
      expect(state.routes).toContainEqual(
        expect.objectContaining({ id: 'research', status: 'ready' }),
      );
      expect(state.reports.researchStatus).toEqual(
        expect.objectContaining({ recordCount: 1, decisionCount: 1, opportunityCount: 1 }),
      );
      expect(state.keywordResearch).toEqual(
        expect.objectContaining({
          status: 'ready',
          sourceCount: 2,
          runCount: 2,
          metricCount: 4,
          totalKnownVolume: 9900,
        }),
      );
      expect(state.keywordResearch.markets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            market: 'IN / en',
            currencyCode: 'INR',
            metricCount: 2,
            totalKnownVolume: 6600,
          }),
          expect.objectContaining({
            market: 'US / en',
            currencyCode: 'USD',
            metricCount: 2,
            totalKnownVolume: 3300,
          }),
        ]),
      );
      expect(state.keywordResearch.matrix).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            normalizedTerm: 'ats resume checker',
            marketCount: 2,
            totalKnownVolume: 7800,
            bestMarket: 'IN / en',
          }),
        ]),
      );
      expect(state.keywordResearch.clusters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'ats',
            label: 'ATS checker and job match',
            bestMarket: 'IN / en',
            totalKnownVolume: 8700,
          }),
        ]),
      );
      expect(state.keywordResearch.topKeywords[0]).toEqual(
        expect.objectContaining({
          term: 'ats resume checker',
          country: 'IN',
          currencyCode: 'INR',
          sourceClusterId: 'cv-fresher',
          avgMonthlySearches: 5400,
        }),
      );
      expect(state.competitorResearch).toEqual(
        expect.objectContaining({
          status: 'ready',
          sourceCount: 1,
          pageCount: 2,
          domainCount: 2,
          keywordCount: 2,
        }),
      );
      expect(state.competitorResearch.domains).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            domain: 'canva.com',
            topPatterns: expect.arrayContaining(['template library']),
          }),
        ]),
      );
      expect(state.competitorResearch.opportunities).toEqual(
        expect.arrayContaining(['Position TrueResume around ATS-safe job-ready resumes.']),
      );
      expect(state.faqResearch).toEqual(
        expect.objectContaining({
          status: 'warn',
          sourceCount: 1,
          questionCount: 3,
          pageCount: 2,
          approvedCount: 2,
          highPriorityCount: 3,
          totalKnownVolume: 116600,
          qualityScore: 72,
          evidenceSourceCount: 1,
          marketCount: 1,
          needsProofCount: 2,
          duplicateQuestionCount: 0,
          routeConflictCount: 0,
        }),
      );
      expect(state.faqResearch.warnings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Proof gaps', severity: 'warn' }),
          expect.objectContaining({ title: 'Single evidence source', severity: 'warn' }),
        ]),
      );
      expect(state.faqResearch.pages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            routePath: '/',
            questionCount: 2,
            totalKnownVolume: 115400,
            evidenceSourceCount: 1,
          }),
          expect.objectContaining({
            routePath: '/cv-maker',
            questionCount: 1,
            needsProofCount: 1,
          }),
        ]),
      );
      expect(state.faqResearch.topQuestions[0]).toEqual(
        expect.objectContaining({
          id: 'free-resume-builder',
          bestMarket: 'US / en · 110000',
          proofStatus: 'ready',
          evidenceSources: ['google-ads'],
        }),
      );
      expect(state.artifacts).toEqual(
        expect.arrayContaining([expect.objectContaining({ lane: 'research', status: 'ready' })]),
      );
      expect(state.routes).toContainEqual(expect.objectContaining({ id: 'gtm', status: 'ready' }));
      expect(state.gtm).toEqual(
        expect.objectContaining({
          accountId: '1',
          containerId: '2',
          workspaceId: '3',
          publicId: 'GTM-TEST123',
        }),
      );
      expect(state.artifacts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'gtm.plan.latest', status: 'ready' }),
          expect.objectContaining({ id: 'gtm.preview.latest', status: 'ready' }),
        ]),
      );
      expect(state.receipts).toEqual(
        expect.arrayContaining([expect.objectContaining({ action: 'gtm.preview' })]),
      );
      expect(JSON.stringify(state)).not.toContain('token');
    });
  });

  it('writes a static dashboard and serialized console state', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    await runWithTestProjectContext(cwd, async () => {
      const loaded = await loadGrowthConsoleExecutionContext();
      writeMarketingProviderReportPull(loaded.config, {
        cwd,
        provider: 'searchConsole',
        reportType: 'queryPage',
        inputPath: writeSearchConsoleInput(cwd),
        inputFormat: 'search-console',
        now: new Date('2026-05-21T00:00:00.000Z'),
      });
      writeGtmArtifacts(cwd);
      writeResearchMemory(cwd);
      writeKeywordPlannerMetrics(cwd);

      const result = await buildMarketingConsoleApp({
        cwd,
        outputDirectory: '.unisane/marketing/console-test',
        now: new Date('2026-05-21T01:00:00.000Z'),
      });

      expect(result.writeStatus).toBe('written');
      expect(existsSync(result.entryHtmlPath)).toBe(true);
      expect(existsSync(result.statePath)).toBe(true);
      expect(
        result.assetPaths.some((assetPath) => assetPath.endsWith('assets/unisane-ui.css')),
      ).toBe(true);
      const html = readFileSync(result.entryHtmlPath, 'utf8');
      expect(html).toContain('Marketing Console');
      expect(html).toContain('./assets/unisane-ui.css');
      expect(html).toContain('marketing-console-state');
      expect(html).toContain('Pre-live checklist');
      expect(html).toContain('Live mutation guard');
      expect(html).toContain('Organic decision map');
      expect(html).toContain('Organic queries');
      expect(html).toContain('Avg. position');
      expect(html).toContain('executive resume templates');
      expect(html).toContain('Research memory');
      expect(html).toContain('Keyword Planner evidence');
      expect(html).toContain('Keyword clusters');
      expect(html).toContain('Keyword matrix');
      expect(html).toContain('Market summary');
      expect(html).toContain('ats resume checker');
      expect(html).toContain('"country":"IN"');
      expect(html).toContain('"currencyCode":"INR"');
      expect(html).toContain('Measurement trust');
      expect(html).toContain('Publish safety');
      expect(html).toContain('Container identity');
      expect(html).toContain('Provider tags in container');
      expect(html).toContain('GTM-TEST123');
      expect(html).toContain('Performance decision table');
      expect(html).toContain('Campaign control');
      expect(html).toContain('Operator checklist');
      expect(html).toContain('Spend and conversions');
      expect(html).toContain('unisane growth gtm validate');
      expect(html).toContain(
        'unisane growth marketing pull-api --provider searchConsole --report queryPage',
      );
    });
  });
});
