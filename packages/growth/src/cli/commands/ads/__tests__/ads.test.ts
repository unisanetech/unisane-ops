import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Command } from 'commander';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  adsAudit,
  adsCompetitors,
  adsCreativeStatus,
  adsDiff,
  adsDoctor,
  adsNegatives,
  adsOptimize,
  adsPull,
  adsReadiness,
  adsSearchTerms,
  adsTrackingAudit,
} from '../index.js';
import { registerAdsCommands } from '../register.js';
import {
  buildMarketingAdsAssetReport,
  buildMarketingAdsCreativeStatusReport,
  buildMarketingAdsReadinessPlan,
  buildMarketingAdsSearchTermsReport,
  buildMarketingAdsStatusReport,
  buildMarketingNegativeKeywordReport,
  buildMarketingGoogleAdsGoalPlan,
  applyMarketingGoogleAdsGoals,
  buildMarketingAdsAuditReport,
  buildMarketingAdsCompetitorMonitorReport,
  createMarketingGoogleAdsTestClient,
  creativeAssetsFromProviderArtifact,
  importMarketingAdsAsset,
  loadMarketingConfig,
  marketingProviderReportArtifactSchema,
  writeMarketingAdsAssetCreativePlan,
  writeMarketingAdsAssetUploadReceipt,
  writeMarketingAdsAssetUploadPlan,
  writeMarketingAdsApplyPreview,
  writeMarketingAdsLiveApplyReceipt,
  writeMarketingAdsPlan,
  writeMarketingConfirmedConversionPull,
  writeMarketingProviderReportPull,
  writeMarketingStrategyMapPull,
  verifyMarketingGoogleAdsApiSetup,
} from '@unisane/growth/marketing';
import { normalizeGoogleAdsReport } from '@unisane/growth/marketing';
import { executeGoogleAdsLiveOperation } from '@unisane/provider-google/marketing';
import { executeMetaAdsLiveOperation, uploadMetaAdsAsset } from '@unisane/provider-meta/marketing';

function createTempProject(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-ads-'));
  mkdirSync(path.join(cwd, 'config'), { recursive: true });
  writeFileSync(
    path.join(cwd, 'config', 'marketing.mjs'),
    `export default {
  version: 1,
  platformId: 'true-resume',
  appId: 'true-resume',
  defaultEnvironment: 'production',
  environments: {
    production: { production: true }
  },
  providers: {
    googleAds: {
      state: 'configured',
      accountIdEnv: 'GOOGLE_ADS_CUSTOMER_ID',
      loginCustomerIdEnv: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
      developerTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
      googleSearchDefaults: {
        targetGoogleSearch: true,
        targetSearchNetwork: false,
        targetContentNetwork: false,
        locationCriterionIds: ['2840'],
        languageCriterionIds: ['1000'],
        finalUrlSuffix: 'utm_source=google&utm_medium=cpc'
      },
      accessTokenEnv: 'GOOGLE_ADS_ACCESS_TOKEN'
    },
    metaAds: {
      state: 'planned',
      accountIdEnv: 'META_AD_ACCOUNT_ID',
      pixelIdEnv: 'META_PIXEL_ID',
      datasetIdEnv: 'META_DATASET_ID',
      pageIdEnv: 'META_PAGE_ID',
      instagramActorIdEnv: 'META_INSTAGRAM_ACTOR_ID',
      accessTokenEnv: 'META_ADS_ACCESS_TOKEN'
    }
  }
};`,
    'utf8',
  );
  return cwd;
}

function conversionRegistry() {
  return {
    version: 1 as const,
    platformId: 'true-resume',
    conversions: [
      {
        id: 'resume_import_completed_lead',
        name: 'Resume import completed',
        owner: 'true-resume/import',
        sourceEventId: 'resume_import_completed',
        lifecycle: 'lead' as const,
        goal: 'lead' as const,
        confirmationSource: 'server' as const,
        eventIdRule: 'Use the server event id.',
        dedupeRule: 'Server event is canonical.',
        mappings: {
          googleAds: {
            conversionActionName: 'Resume import completed',
            category: 'LEAD',
            primary: true,
          },
        },
        reportingGoal: 'lead',
      },
    ],
  };
}

function writeStrategyMap(cwd: string): string {
  const inputPath = path.join(cwd, 'strategy-map.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        source: 'manual-export',
        pulledAt: '2026-05-21T00:00:00.000Z',
        objects: [
          {
            id: 'true-resume-search',
            kind: 'campaign',
            name: 'True Resume Search',
            owner: 'true-resume/growth',
            status: 'active',
            landingPageUrl: '/templates',
            campaignIds: ['campaign_1'],
            keywords: ['resume builder', 'resume templates'],
            conversionIds: ['resume_import_completed_lead'],
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

function writeSeoAdsPlan(cwd: string): string {
  const inputPath = path.join(cwd, 'seo-ads-plan.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        sourcePatternPack: 'true-resume',
        statusFilter: 'approved-or-built',
        adGroups: [
          {
            id: 'adgroup-resume-templates',
            name: 'Resume Templates',
            landingPage: '/templates',
            opportunityId: 'opp_resume_templates',
            opportunitySlug: 'resume-templates',
            primaryKeyword: 'resume templates',
            keywords: [
              {
                keyword: 'resume templates',
                matchType: 'exact',
                landingPage: '/templates',
                sourceOpportunityId: 'opp_resume_templates',
                sourceOpportunitySlug: 'resume-templates',
                volume: 1200,
                rationale: 'Primary paid-search keyword.',
              },
              {
                keyword: 'professional resume template',
                matchType: 'phrase',
                landingPage: '/templates',
                sourceOpportunityId: 'opp_resume_templates',
                sourceOpportunitySlug: 'resume-templates',
                rationale: 'Supporting paid-search keyword.',
              },
            ],
            negativeKeywords: [
              { keyword: 'jobs', reason: 'Job-board intent should not spend template budget.' },
            ],
            rationale: 'Use the matching SEO landing page for paid-search traffic.',
          },
        ],
        sharedNegativeKeywords: [{ keyword: 'free download', reason: 'Weak conversion fit.' }],
      },
      null,
      2,
    ),
    'utf8',
  );
  return inputPath;
}

describe('Google Ads API setup verifier', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('explains when a configured production customer is blocked by a test-only token', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const fetcher = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.endsWith('/v22/customers:listAccessibleCustomers')) {
        return new Response(JSON.stringify({ resourceNames: ['customers/7667333097'] }));
      }
      if (requestUrl.includes('/customers/7667333097/googleAds:searchStream')) {
        return new Response(
          JSON.stringify([
            {
              error: {
                message: 'The developer token is only approved for use with test accounts.',
                details: [
                  {
                    errors: [
                      {
                        errorCode: {
                          authorizationError: 'DEVELOPER_TOKEN_NOT_APPROVED',
                        },
                      },
                    ],
                  },
                ],
              },
            },
          ]),
          { status: 403, statusText: 'Forbidden' },
        );
      }
      throw new Error(`Unexpected request ${requestUrl} ${String(init?.body)}`);
    });

    const report = await verifyMarketingGoogleAdsApiSetup(loaded.config, {
      accessToken: 'access-token',
      accountId: '766-733-3097',
      env: { GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token' },
      fetch: fetcher as unknown as typeof fetch,
      now: new Date('2026-06-04T00:00:00.000Z'),
    });

    expect(report.status).toBe('warn');
    expect(report.ok).toBe(true);
    expect(report.configuredCustomerId).toBe('7667333097');
    expect(report.customers[0]?.message).toContain('DEVELOPER_TOKEN_NOT_APPROVED');
    expect(report.nextActions.join('\n')).toContain('test client');
  });

  it('identifies a configured test customer as ready for immediate API proof', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const fetcher = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const requestUrl = String(url);
      const body = String(init?.body ?? '');
      if (requestUrl.endsWith('/v22/customers:listAccessibleCustomers')) {
        return new Response(JSON.stringify({ resourceNames: ['customers/2350844564'] }));
      }
      if (
        requestUrl.includes('/customers/2350844564/googleAds:searchStream') &&
        body.includes('FROM customer_client')
      ) {
        return new Response(
          JSON.stringify([
            {
              results: [
                {
                  customerClient: {
                    id: '1234567890',
                    clientCustomer: 'customers/1234567890',
                    descriptiveName: 'API Test Client',
                    currencyCode: 'USD',
                    timeZone: 'Asia/Calcutta',
                    manager: false,
                    testAccount: true,
                    status: 'ENABLED',
                  },
                },
              ],
            },
          ]),
        );
      }
      if (requestUrl.includes('/customers/2350844564/googleAds:searchStream')) {
        return new Response(
          JSON.stringify([
            {
              results: [
                {
                  customer: {
                    id: '2350844564',
                    descriptiveName: 'BHASKAR',
                    manager: true,
                    testAccount: false,
                    status: 'ENABLED',
                  },
                },
              ],
            },
          ]),
        );
      }
      if (requestUrl.includes('/customers/1234567890/googleAds:searchStream')) {
        return new Response(
          JSON.stringify([
            {
              results: [
                {
                  customer: {
                    id: '1234567890',
                    descriptiveName: 'API Test Client',
                    currencyCode: 'USD',
                    timeZone: 'Asia/Calcutta',
                    manager: false,
                    testAccount: true,
                    status: 'ENABLED',
                  },
                },
              ],
            },
          ]),
        );
      }
      throw new Error(`Unexpected request ${requestUrl} ${body}`);
    });

    const report = await verifyMarketingGoogleAdsApiSetup(loaded.config, {
      accessToken: 'access-token',
      accountId: '123-456-7890',
      managerCustomerId: '235-084-4564',
      env: { GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token' },
      fetch: fetcher as unknown as typeof fetch,
      now: new Date('2026-06-04T00:00:00.000Z'),
    });

    expect(report.status).toBe('pass');
    expect(report.ok).toBe(true);
    expect(report.loginCustomerId).toBe('2350844564');
    expect(report.customers.find((customer) => customer.id === '1234567890')?.testAccount).toBe(
      true,
    );
    expect(report.nextActions.join('\n')).toContain('read-only Google Ads API pull');
  });

  it('creates a Google Ads test client request under a manager account', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const fetcher = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(String(url)).toBe(
        'https://googleads.googleapis.com/v22/customers/2350844564:createCustomerClient',
      );
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>)['login-customer-id']).toBe('2350844564');
      expect(JSON.parse(String(init?.body))).toMatchObject({
        validateOnly: false,
        customerClient: {
          descriptiveName: 'Unisane Test Client',
          currencyCode: 'USD',
          timeZone: 'Asia/Kolkata',
        },
      });
      return new Response(JSON.stringify({ resourceName: 'customers/1234567890' }));
    });

    const result = await createMarketingGoogleAdsTestClient(loaded.config, {
      accessToken: 'access-token',
      managerCustomerId: '235-084-4564',
      descriptiveName: 'Unisane Test Client',
      currencyCode: 'USD',
      timeZone: 'Asia/Kolkata',
      env: { GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token' },
      fetch: fetcher as unknown as typeof fetch,
      now: new Date('2026-06-04T00:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.customerId).toBe('1234567890');
    expect(result.nonMutating).toBe(false);
  });

  it('validates Google Ads conversion action setup from the conversion registry', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const fetcher = vi.fn(async (url: string | URL, init?: RequestInit) => {
      const requestUrl = String(url);
      if (requestUrl.includes('/googleAds:searchStream')) {
        return new Response(JSON.stringify([{ results: [] }]));
      }
      if (requestUrl.endsWith('/conversionActions:mutate')) {
        expect(JSON.parse(String(init?.body))).toMatchObject({
          validateOnly: true,
          operations: [
            {
              create: {
                name: 'Resume import completed',
                type: 'WEBPAGE',
                category: 'LEAD',
                status: 'ENABLED',
                primaryForGoal: true,
              },
            },
          ],
        });
        return new Response(
          JSON.stringify({
            results: [{ resourceName: 'customers/1234567890/conversionActions/111222333' }],
          }),
        );
      }
      throw new Error(`Unexpected request ${requestUrl}`);
    });

    const planned = buildMarketingGoogleAdsGoalPlan({
      config: loaded.config,
      registry: conversionRegistry(),
      accountId: '123-456-7890',
      managerCustomerId: '235-084-4564',
      env: {},
      now: new Date('2026-06-04T00:00:00.000Z'),
    });
    const result = await applyMarketingGoogleAdsGoals(loaded.config, conversionRegistry(), {
      accessToken: 'access-token',
      accountId: '123-456-7890',
      managerCustomerId: '235-084-4564',
      env: { GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token' },
      fetch: fetcher as unknown as typeof fetch,
      validateOnly: true,
      now: new Date('2026-06-04T00:00:00.000Z'),
    });

    expect(planned.operations[0]?.actionName).toBe('Resume import completed');
    expect(result.validateOnly).toBe(true);
    expect(result.operations[0]).toMatchObject({
      status: 'validated',
      resourceName: 'customers/1234567890/conversionActions/111222333',
    });
  });
});

function writeMetaCreativeInventory(cwd: string): string {
  const inputPath = path.join(cwd, 'meta-creative-inventory.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider: 'metaAds',
        reportType: 'creative',
        source: 'manual-export',
        pulledAt: '2026-05-21T00:00:00.000Z',
        window: {
          startDate: '2026-05-01',
          endDate: '2026-05-21',
        },
        records: [
          {
            id: 'creative_1',
            level: 'creative',
            creativeId: 'creative_1',
            creativeName: 'Import CTA Creative',
            creativeStatus: 'ACTIVE',
            creativeAssetType: 'SHARE',
            creativeHeadline: 'Build a better resume',
            creativeBody: 'Import your existing resume and improve it.',
            creativeThumbnailUrl: 'https://example.com/thumb.jpg',
            creativeDestinationUrl: '/templates',
            creativeUrlTags: 'utm_source=meta&utm_medium=paid_social',
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

function writeMarketingRegistries(cwd: string): void {
  mkdirSync(path.join(cwd, 'docs', 'marketing'), { recursive: true });
  writeFileSync(
    path.join(cwd, 'docs', 'marketing', 'events.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        events: [
          {
            id: 'resume_import_completed',
            name: 'Resume import completed',
            owner: 'true-resume/growth',
            source: 'server',
            lifecycle: 'lead',
            requiredProperties: [
              { name: 'eventId', type: 'string' },
              { name: 'value', type: 'number' },
              { name: 'currency', type: 'string' },
            ],
            optionalProperties: [],
            consent: { required: true, categories: ['analytics', 'ads'] },
            attributionFields: ['gclid', '_fbp', '_fbc'],
            eventIdRule: 'Use canonical server conversion event id.',
            valueRule: 'Use configured lead value.',
            currencyRule: 'Use configured currency.',
            dedupeRule: 'Dedupe by event_id.',
            mappings: {
              ga4: { eventName: 'resume_import_completed' },
              gtm: { dataLayerEvent: 'resume_import_completed' },
              internalAnalytics: { eventName: 'resume_import_completed' },
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
            name: 'Resume import completed lead',
            owner: 'true-resume/growth',
            sourceEventId: 'resume_import_completed',
            lifecycle: 'lead',
            goal: 'lead',
            confirmationSource: 'server',
            eventIdRule: 'Use canonical server conversion event id.',
            valueRule: 'Use configured lead value.',
            currencyRule: 'Use configured currency.',
            dedupeRule: 'Dedupe by event_id.',
            mappings: {
              ga4: { eventName: 'resume_import_completed', keyEvent: true },
              googleAds: {
                conversionActionName: 'Resume Import Completed',
                category: 'SUBMIT_LEAD_FORM',
                primary: true,
              },
              meta: {
                pixelEventName: 'Lead',
                capiEventName: 'Lead',
              },
              internalAnalytics: {
                eventName: 'resume_import_completed',
                goal: 'lead',
              },
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
}

function writeNormalizedAdsReport(cwd: string): string {
  const inputPath = path.join(cwd, 'google-ads-report.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider: 'googleAds',
        source: 'manual-export',
        window: { startDate: '2026-05-01', endDate: '2026-05-21' },
        records: [
          {
            id: 'campaign_1',
            name: 'True Resume Search',
            level: 'campaign',
            campaignId: 'campaign_1',
            campaignName: 'True Resume Search',
            metrics: { impressions: 1000, clicks: 100, cost: 250, conversions: 12 },
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

function writeProviderReportInput(
  cwd: string,
  fileName: string,
  reportType: string,
  records: unknown[],
): string {
  const inputPath = path.join(cwd, fileName);
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider: 'googleAds',
        source: 'manual-export',
        reportType,
        window: { startDate: '2026-05-01', endDate: '2026-05-21' },
        records,
      },
      null,
      2,
    ),
    'utf8',
  );
  return inputPath;
}

function writeConfirmedConversionInput(cwd: string): string {
  const inputPath = path.join(cwd, 'confirmed-conversions.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        appId: 'true-resume',
        source: 'manual-export',
        pulledAt: '2026-05-21T00:00:00.000Z',
        window: { startDate: '2026-05-01', endDate: '2026-05-21' },
        records: [
          {
            id: 'confirmed_1',
            conversionId: 'resume_import_completed_lead',
            sourceEventId: 'resume_import_completed',
            value: 35,
            revenue: 49,
            margin: 35,
            currency: 'USD',
            campaignId: 'campaign_1',
            campaignName: 'True Resume Search',
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

function writeNegativeKeywordRegistry(cwd: string): void {
  mkdirSync(path.join(cwd, 'docs', 'marketing', 'ads'), { recursive: true });
  writeFileSync(
    path.join(cwd, 'docs', 'marketing', 'ads', 'negative-keywords.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        appId: 'true-resume',
        generatedAt: '2026-05-21T00:00:00.000Z',
        owner: 'true-resume/growth',
        entries: [
          {
            id: 'jobs-resume-writer-jobs',
            text: 'resume writer jobs',
            matchType: 'phrase',
            scope: 'account',
            theme: 'jobs',
            reason: 'Blocks job-seeker traffic.',
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
}

function writeCompetitorRegistry(cwd: string): void {
  mkdirSync(path.join(cwd, 'docs', 'marketing', 'ads'), { recursive: true });
  writeFileSync(
    path.join(cwd, 'docs', 'marketing', 'ads', 'competitors.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        appId: 'true-resume',
        generatedAt: '2026-05-21T00:00:00.000Z',
        owner: 'true-resume/growth',
        entries: [
          {
            id: 'resume-io',
            domain: 'resume.io',
            name: 'Resume.io',
            category: 'resume-builder',
            priority: 'high',
            reason: 'Direct resume builder competitor.',
          },
          {
            id: 'canva',
            domain: 'canva.com',
            name: 'Canva',
            category: 'design-template',
            priority: 'medium',
            reason: 'Template design competitor.',
          },
        ],
      },
      null,
      2,
    ),
    'utf8',
  );
}

function writeZeroConversionAdsReport(cwd: string): string {
  const inputPath = path.join(cwd, 'google-ads-zero-conversions.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider: 'googleAds',
        source: 'manual-export',
        window: { startDate: '2026-05-01', endDate: '2026-05-21' },
        records: [
          {
            id: 'campaign_1',
            name: 'True Resume Search',
            level: 'campaign',
            campaignId: 'campaign_1',
            campaignName: 'True Resume Search',
            metrics: { impressions: 1200, clicks: 140, cost: 650, conversions: 0 },
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

describe('ads planning command engine', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('reports ads readiness across provider accounts, conversion mappings, and cached reports', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = await buildMarketingAdsStatusReport(loaded.config, {
      cwd,
      configPath: loaded.path,
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
      },
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(report.ok).toBe(true);
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        accountIdEnv: 'GOOGLE_ADS_CUSTOMER_ID',
        accountIdSet: true,
      }),
    );
    expect(report.conversionMappings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: 'googleAds',
          mappedConversions: 1,
          missingConversions: [],
        }),
        expect.objectContaining({
          provider: 'metaAds',
          mappedConversions: 1,
          missingConversions: [],
        }),
      ]),
    );
    expect(report.providerReports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ provider: 'googleAds', status: 'missing' }),
        expect.objectContaining({ provider: 'metaAds', status: 'missing' }),
      ]),
    );
    expect(report.nextWorkflowStep).toContain('Pull read-only Google Ads and Meta Ads reports');
  });

  it('prints ads doctor JSON with control-plane env guidance', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await adsDoctor({ cwd, json: true });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        controlPlane: {
          envReport: { entries: Array<{ name: string; kind: string; example: string | null }> };
        };
      };

      expect(code).toBe(1);
      expect(output.controlPlane.envReport.entries).toContainEqual(
        expect.objectContaining({
          name: 'GOOGLE_ADS_DEVELOPER_TOKEN',
          kind: 'provider-resource-ref',
          example: null,
        }),
      );
      expect(output.controlPlane.envReport.entries).toContainEqual(
        expect.objectContaining({
          name: 'META_ADS_ACCESS_TOKEN',
          kind: 'fallback-debug',
          example: null,
        }),
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it('builds a product-specific ads readiness plan from cached Google Ads and conversion proof', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const now = new Date('2026-05-21T03:00:00.000Z');

    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'google-ads-account.json', 'account', [
        {
          id: 'account_1',
          name: 'True Resume Test',
          level: 'account',
          autoTaggingEnabled: true,
          finalUrlSuffix: 'utm_source=google&utm_medium=cpc',
          conversionTrackingStatus: 'CONVERSION_TRACKING_MANAGED_BY_SELF',
          accountTimeZone: 'Asia/Kolkata',
          currency: 'USD',
          metrics: {},
        },
      ]),
      reportType: 'account',
      now,
    });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'google-ads-campaigns.json', 'campaign', [
        {
          id: 'campaign_1',
          name: 'True Resume Search',
          level: 'campaign',
          campaignId: 'campaign_1',
          campaignName: 'True Resume Search',
          metrics: { impressions: 1000, clicks: 120, cost: 280, conversions: 14 },
        },
      ]),
      reportType: 'campaign',
      now,
    });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'google-ads-keywords.json', 'keyword', [
        {
          id: 'keyword_1',
          level: 'keyword',
          campaignId: 'campaign_1',
          adGroupId: 'ad_group_1',
          keyword: 'ats resume checker',
          metrics: { impressions: 300, clicks: 45, cost: 80, conversions: 6 },
        },
      ]),
      reportType: 'keyword',
      now,
    });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'google-ads-conversions.json', 'conversion', [
        {
          id: 'conversion_1',
          level: 'conversion',
          conversionId: 'resume_import_completed_lead',
          conversionName: 'Resume Import Completed',
          metrics: { conversions: 14, conversionValue: 490 },
        },
      ]),
      reportType: 'conversion',
      now,
    });
    writeMarketingConfirmedConversionPull(loaded.config, {
      cwd,
      inputPath: writeConfirmedConversionInput(cwd),
      now,
    });

    const plan = await buildMarketingAdsReadinessPlan(loaded.config, { cwd, now });

    expect(plan.ok).toBe(true);
    expect(plan.readinessScore).toBeGreaterThanOrEqual(80);
    expect(plan.accountSettings.autoTaggingEnabled).toBe(true);
    expect(plan.checks).toContainEqual(
      expect.objectContaining({ id: 'account.autoTagging', status: 'pass' }),
    );
    expect(plan.productStrategy.recommendedAdGroups).toContain('ATS resume checker');
    expect(plan.productStrategy.recommendedNegativeKeywords).toContain('resume writer jobs');
    expect(plan.actions).toContainEqual(
      expect.objectContaining({
        id: 'campaign-search-intent-structure',
        priority: 'should',
      }),
    );
  });

  it('prints ads readiness JSON and writes the latest readiness artifact', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await adsReadiness({ cwd, json: true });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        path?: string;
        plan?: { kind: string; productStrategy?: { recommendedAdGroups: string[] } };
      };

      expect(code).toBe(1);
      expect(output.path).toContain(path.join('.unisane', 'marketing', 'ads', 'readiness'));
      expect(output.path && existsSync(output.path)).toBe(true);
      expect(output.plan?.kind).toBe('unisane.marketing.ads.readiness-plan');
      expect(output.plan?.productStrategy?.recommendedAdGroups).toContain('ATS resume checker');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('classifies Google Ads search terms into optimization actions', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const now = new Date('2026-05-21T03:00:00.000Z');
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'google-ads-search-terms.json', 'query', [
        {
          id: 'query_1',
          level: 'query',
          campaignId: 'campaign_1',
          campaignName: 'True Resume Search',
          adGroupId: 'ad_group_1',
          adGroupName: 'ATS',
          query: 'ats resume checker',
          metrics: { impressions: 90, clicks: 12, cost: 30, conversions: 3 },
        },
        {
          id: 'query_2',
          level: 'query',
          campaignId: 'campaign_1',
          campaignName: 'True Resume Search',
          adGroupId: 'ad_group_2',
          adGroupName: 'Waste',
          query: 'resume writer jobs',
          metrics: { impressions: 40, clicks: 5, cost: 15, conversions: 0 },
        },
        {
          id: 'query_3',
          level: 'query',
          campaignId: 'campaign_1',
          campaignName: 'True Resume Search',
          adGroupId: 'ad_group_3',
          adGroupName: 'Templates',
          query: 'software engineer resume template',
          metrics: { impressions: 60, clicks: 4, cost: 8, conversions: 0 },
        },
      ]),
      reportType: 'query',
      now,
    });

    const report = buildMarketingAdsSearchTermsReport(loaded.config, { cwd, now });

    expect(report.ok).toBe(true);
    expect(report.summary).toMatchObject({
      totalQueries: 3,
      negativeCandidates: 1,
      keywordPromotions: 1,
      landingPageOpportunities: 2,
      seoOpportunities: 1,
    });
    expect(report.classifications).toContainEqual(
      expect.objectContaining({
        query: 'ats resume checker',
        actions: expect.arrayContaining(['promote_keyword', 'create_landing_page']),
        suggestedKeyword: { text: 'ats resume checker', matchType: 'EXACT' },
      }),
    );
    expect(report.classifications).toContainEqual(
      expect.objectContaining({
        query: 'resume writer jobs',
        actions: expect.arrayContaining(['add_negative']),
        suggestedNegative: { text: 'resume writer jobs', matchType: 'PHRASE' },
      }),
    );
    expect(report.classifications).toContainEqual(
      expect.objectContaining({
        query: 'software engineer resume template',
        actions: expect.arrayContaining(['create_landing_page', 'create_seo_page']),
        suggestedLandingPage: '/software-engineer-resume-template',
      }),
    );
  });

  it('prints ads search terms JSON and writes the latest artifact', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'google-ads-search-terms-cli.json', 'query', [
        {
          id: 'query_1',
          level: 'query',
          query: 'ats resume checker',
          metrics: { impressions: 90, clicks: 12, cost: 30, conversions: 3 },
        },
      ]),
      reportType: 'query',
      now: new Date('2026-05-21T03:00:00.000Z'),
    });
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await adsSearchTerms({ cwd, json: true, maxAgeDays: '9999' });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        path?: string;
        report?: { kind: string; summary?: { keywordPromotions: number } };
      };

      expect(code).toBe(0);
      expect(output.path).toContain(path.join('.unisane', 'marketing', 'ads', 'search-terms'));
      expect(output.path && existsSync(output.path)).toBe(true);
      expect(output.report?.kind).toBe('unisane.marketing.ads.search-terms');
      expect(output.report?.summary?.keywordPromotions).toBe(1);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('validates negative keyword registry coverage against search-term recommendations', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    writeNegativeKeywordRegistry(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const now = new Date('2026-05-21T03:00:00.000Z');
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'google-ads-negatives-query.json', 'query', [
        {
          id: 'query_1',
          level: 'query',
          query: 'resume writer jobs',
          metrics: { impressions: 40, clicks: 5, cost: 15, conversions: 0 },
        },
        {
          id: 'query_2',
          level: 'query',
          query: 'resume writer salary',
          metrics: { impressions: 20, clicks: 3, cost: 8, conversions: 0 },
        },
      ]),
      reportType: 'query',
      now,
    });
    const searchTerms = buildMarketingAdsSearchTermsReport(loaded.config, { cwd, now });
    mkdirSync(path.join(cwd, '.unisane', 'marketing', 'ads', 'search-terms'), {
      recursive: true,
    });
    writeFileSync(
      path.join(cwd, '.unisane', 'marketing', 'ads', 'search-terms', 'latest.json'),
      `${JSON.stringify(searchTerms, null, 2)}\n`,
      'utf8',
    );

    const report = buildMarketingNegativeKeywordReport(loaded.config, { cwd, now });

    expect(report.ok).toBe(true);
    expect(report.summary).toMatchObject({
      entries: 1,
      searchTermNegativeCandidates: 2,
      uncoveredSearchTermNegatives: 1,
    });
    expect(report.coverage).toContainEqual(
      expect.objectContaining({
        query: 'resume writer jobs',
        covered: true,
        matchedEntryId: 'jobs-resume-writer-jobs',
      }),
    );
    expect(report.coverage).toContainEqual(
      expect.objectContaining({
        query: 'resume writer salary',
        covered: false,
      }),
    );
  });

  it('prints ads negatives JSON and writes the latest artifact', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    writeNegativeKeywordRegistry(cwd);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await adsNegatives({ cwd, json: true });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        path?: string;
        report?: { kind: string; summary?: { entries: number } };
      };

      expect(code).toBe(0);
      expect(output.path).toContain(path.join('.unisane', 'marketing', 'ads', 'negative-keywords'));
      expect(output.path && existsSync(output.path)).toBe(true);
      expect(output.report?.kind).toBe('unisane.marketing.ads.negative-keywords');
      expect(output.report?.summary?.entries).toBe(1);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('monitors Auction Insights competitors from cached Google Ads reports', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    writeCompetitorRegistry(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const now = new Date('2026-05-21T03:00:00.000Z');
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(
        cwd,
        'google-ads-auction-insights.json',
        'auctionInsight',
        [
          {
            id: 'campaign_1:resume.io',
            level: 'competitor',
            campaignId: 'campaign_1',
            campaignName: 'True Resume Search',
            auctionInsightDomain: 'resume.io',
            auctionInsightSearchImpressionShare: 0.42,
            auctionInsightSearchOverlapRate: 0.58,
            auctionInsightSearchPositionAboveRate: 0.37,
            auctionInsightSearchOutrankingShare: 0.22,
            auctionInsightSearchTopImpressionPercentage: 0.51,
            auctionInsightSearchAbsoluteTopImpressionPercentage: 0.24,
            metrics: {},
          },
          {
            id: 'campaign_1:unknown.example',
            level: 'competitor',
            campaignId: 'campaign_1',
            campaignName: 'True Resume Search',
            auctionInsightDomain: 'unknown.example',
            auctionInsightSearchImpressionShare: 0.09,
            auctionInsightSearchOverlapRate: 0.11,
            metrics: {},
          },
        ],
      ),
      reportType: 'auctionInsight',
      now,
    });

    const report = buildMarketingAdsCompetitorMonitorReport(loaded.config, { cwd, now });

    expect(report.ok).toBe(true);
    expect(report.summary).toMatchObject({
      knownCompetitors: 2,
      auctionInsightRows: 2,
      domains: 2,
      knownDomainsSeen: 1,
      unknownDomainsSeen: 1,
      highPressureDomains: 1,
    });
    expect(report.signals).toContainEqual(
      expect.objectContaining({
        domain: 'resume.io',
        known: true,
        pressure: 'high',
        actions: expect.arrayContaining(['landing_page_review', 'bid_pressure_review']),
      }),
    );
    expect(report.signals).toContainEqual(
      expect.objectContaining({
        domain: 'unknown.example',
        known: false,
        actions: expect.arrayContaining(['positioning_research']),
      }),
    );
  });

  it('prints ads competitors JSON and writes the latest artifact', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    writeCompetitorRegistry(cwd);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await adsCompetitors({ cwd, json: true });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        path?: string;
        report?: { kind: string; summary?: { knownCompetitors: number } };
      };

      expect(code).toBe(0);
      expect(output.path).toContain(path.join('.unisane', 'marketing', 'ads', 'competitors'));
      expect(output.path && existsSync(output.path)).toBe(true);
      expect(output.report?.kind).toBe('unisane.marketing.ads.competitors');
      expect(output.report?.summary?.knownCompetitors).toBe(2);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('builds a unified ads audit from readiness, tracking, terms, negatives, competitors, and creative status', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    writeNegativeKeywordRegistry(cwd);
    writeCompetitorRegistry(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'tracking.ts'),
      [
        "import { createWebTracker } from '@unisane/web-runtime/tracking';",
        "import { normalizeWebConversion } from '@unisane/web-runtime/conversions';",
        "export const sourceEventId = 'resume_import_completed';",
        "export const eventId = 'event_1';",
        'void createWebTracker;',
        'void normalizeWebConversion;',
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    const now = new Date('2026-05-21T03:00:00.000Z');
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportInput(cwd, 'audit-query.json', 'query', [
        {
          id: 'query_1',
          level: 'query',
          query: 'resume writer jobs',
          metrics: { impressions: 40, clicks: 5, cost: 15, conversions: 0 },
        },
      ]),
      reportType: 'query',
      now,
    });
    const searchTerms = buildMarketingAdsSearchTermsReport(loaded.config, { cwd, now });
    mkdirSync(path.join(cwd, '.unisane', 'marketing', 'ads', 'search-terms'), {
      recursive: true,
    });
    writeFileSync(
      path.join(cwd, '.unisane', 'marketing', 'ads', 'search-terms', 'latest.json'),
      `${JSON.stringify(searchTerms, null, 2)}\n`,
      'utf8',
    );

    const report = await buildMarketingAdsAuditReport(loaded.config, { cwd, now });

    expect(report.kind).toBe('unisane.marketing.ads.audit');
    expect(report.sections.map((section) => section.id)).toEqual([
      'readiness',
      'tracking',
      'searchTerms',
      'negatives',
      'competitors',
      'creative',
    ]);
    expect(report.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'pull:auction-insights',
          owner: 'marketing/reporting',
        }),
      ]),
    );
    expect(report.searchTerms.summary.totalQueries).toBe(1);
    expect(report.negatives.summary.entries).toBe(1);
    expect(report.competitors.summary.knownCompetitors).toBe(2);
  });

  it('prints ads audit JSON and writes the latest artifact', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    writeNegativeKeywordRegistry(cwd);
    writeCompetitorRegistry(cwd);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await adsAudit({ cwd, json: true });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        path?: string;
        report?: { kind: string; sections?: unknown[] };
      };

      expect(code).toBe(1);
      expect(output.path).toContain(path.join('.unisane', 'marketing', 'ads', 'audit'));
      expect(output.path && existsSync(output.path)).toBe(true);
      expect(output.report?.kind).toBe('unisane.marketing.ads.audit');
      expect(output.report?.sections?.length).toBeGreaterThan(0);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('caches a read-only ads provider pull through the focused ads command', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const inputPath = writeNormalizedAdsReport(cwd);

    const code = await adsPull({
      cwd,
      config: 'config/marketing.mjs',
      provider: 'googleAds',
      input: inputPath,
      report: 'campaign',
      json: true,
    });

    expect(code).toBe(0);
    expect(
      existsSync(
        path.join(
          cwd,
          '.unisane',
          'marketing',
          'cache',
          'provider-pulls',
          'googleAds',
          'campaign',
          'latest.json',
        ),
      ),
    ).toBe(true);
  });

  it('registers auth profile options on the focused ads pull command', () => {
    const program = new Command();
    registerAdsCommands(program);

    const adsCommand = program.commands.find((command) => command.name() === 'ads');
    const pullCommand = adsCommand?.commands.find((command) => command.name() === 'pull');
    const optionFlags = pullCommand?.options.map((option) => option.long) ?? [];

    expect(optionFlags).toContain('--auth-profile');
    expect(optionFlags).toContain('--meta-auth-profile');
  });

  it('imports and validates private ads media assets through the asset registry', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const sourcePath = path.join(cwd, 'creative.png');
    writeFileSync(sourcePath, 'fake image bytes', 'utf8');

    const result = importMarketingAdsAsset(loaded.config, {
      cwd,
      assetId: 'resume-template-hero-image',
      filePath: sourcePath,
      assetType: 'image',
      owner: 'true-resume/growth',
      providers: ['metaAds'],
      placements: ['feed'],
      strategyObjectIds: ['true-resume-search'],
      license: 'owned',
      now: new Date('2026-05-22T00:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.asset.sourceFile?.localPath).toContain(
      path.join('.unisane', 'marketing', 'assets', 'source'),
    );
    expect(result.asset.sourceFile?.sha256).toMatch(/^[a-f0-9]{64}$/);
    const report = buildMarketingAdsAssetReport(loaded.config, {
      cwd,
      now: new Date('2026-05-22T00:00:00.000Z'),
    });
    expect(report.ok).toBe(true);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'assets.resume-template-hero-image.sourceFile.sha256',
        status: 'pass',
      }),
    );
    expect(JSON.stringify(report.registry)).not.toContain(sourcePath);
  });

  it('builds a non-mutating ads asset upload plan for approved assets', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const sourcePath = path.join(cwd, 'creative.png');
    writeFileSync(sourcePath, 'fake image bytes', 'utf8');
    const imported = importMarketingAdsAsset(loaded.config, {
      cwd,
      assetId: 'resume-template-hero-image',
      filePath: sourcePath,
      assetType: 'image',
      owner: 'true-resume/growth',
      providers: ['metaAds'],
      placements: ['feed'],
      now: new Date('2026-05-22T00:00:00.000Z'),
    });
    const registry = JSON.parse(readFileSync(imported.registryPath, 'utf8')) as {
      assets: Array<Record<string, unknown>>;
    };
    registry.assets[0] = {
      ...registry.assets[0],
      lifecycleStatus: 'approved',
      sourceFile: {
        ...(registry.assets[0]?.sourceFile as Record<string, unknown>),
        width: 1200,
        height: 628,
      },
    };
    writeFileSync(imported.registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

    const plan = writeMarketingAdsAssetUploadPlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      dryRun: true,
      now: new Date('2026-05-22T01:00:00.000Z'),
    });

    expect(plan.ok).toBe(true);
    expect(plan.dryRun).toBe(true);
    expect(plan.plan.nonMutating).toBe(true);
    expect(plan.plan.operations).toEqual([
      expect.objectContaining({
        id: 'upload:metaAds:resume-template-hero-image',
        provider: 'metaAds',
        mutation: 'upload_asset',
      }),
    ]);
  });

  it('warns when two ads assets share the same source hash', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const sourcePath = path.join(cwd, 'creative.png');
    writeFileSync(sourcePath, 'same creative bytes', 'utf8');
    for (const assetId of ['asset-one', 'asset-two']) {
      importMarketingAdsAsset(loaded.config, {
        cwd,
        assetId,
        filePath: sourcePath,
        assetType: 'image',
        owner: 'true-resume/growth',
        providers: ['metaAds'],
      });
    }

    const report = buildMarketingAdsAssetReport(loaded.config, { cwd });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'assets.asset-one.duplicateHash',
        status: 'warn',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'assets.asset-two.duplicateHash',
        status: 'warn',
      }),
    );
  });

  it('creates upload receipts and writes Meta provider refs for live image uploads', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const sourcePath = path.join(cwd, 'creative.png');
    writeFileSync(sourcePath, 'fake image bytes', 'utf8');
    const imported = importMarketingAdsAsset(loaded.config, {
      cwd,
      assetId: 'resume-template-hero-image',
      filePath: sourcePath,
      assetType: 'image',
      owner: 'true-resume/growth',
      providers: ['metaAds'],
      now: new Date('2026-05-22T00:00:00.000Z'),
    });
    const registry = JSON.parse(readFileSync(imported.registryPath, 'utf8')) as {
      assets: Array<Record<string, unknown>>;
    };
    registry.assets[0] = {
      ...registry.assets[0],
      lifecycleStatus: 'approved',
      sourceFile: {
        ...(registry.assets[0]?.sourceFile as Record<string, unknown>),
        width: 1200,
        height: 628,
      },
    };
    writeFileSync(imported.registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    const plan = writeMarketingAdsAssetUploadPlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      out: 'docs/marketing/ads/assets/plans/meta-upload.json',
      now: new Date('2026-05-22T01:00:00.000Z'),
    });
    const dryRun = await writeMarketingAdsAssetUploadReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/assets/plans/meta-upload.json',
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-assets-upload',
      productionConfirm: 'production:true-resume:true-resume:ads-assets-upload',
      now: new Date('2026-05-22T02:00:00.000Z'),
    });
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          images: {
            'creative.png': {
              hash: 'meta_image_hash_123',
            },
          },
        }),
        { status: 200 },
      );
    });

    const live = await writeMarketingAdsAssetUploadReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/assets/plans/meta-upload.json',
      yes: true,
      receiptPath: dryRun.path,
      approvalRef: 'APPROVAL-1',
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-assets-upload',
      productionConfirm: 'production:true-resume:true-resume:ads-assets-upload',
      operationConfirm:
        'live-assets:production:upload:metaAds:resume-template-hero-image:APPROVAL-1',
      liveExecutorMode: 'api',
      providerUploaders: {
        metaAds: uploadMetaAdsAsset,
      },
      env: {
        META_AD_ACCOUNT_ID: 'act_123',
        META_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-22T03:00:00.000Z'),
    });

    expect(plan.ok).toBe(true);
    expect(dryRun.ok).toBe(true);
    expect(live.ok).toBe(true);
    if (live.dryRun) throw new Error('Expected live upload receipt.');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://graph.facebook.com/v25.0/act_123/adimages',
    );
    expect(JSON.stringify(live.receipt)).not.toContain('access-token');
    expect(live.receipt.operationResults).toContainEqual(
      expect.objectContaining({
        providerAssetId: 'meta_image_hash_123',
        liveMutationSent: true,
      }),
    );
    const providerRefPath = live.receipt.operationResults[0]?.providerRefPath;
    expect(providerRefPath).toBeTruthy();
    const providerRef = JSON.parse(readFileSync(providerRefPath ?? '', 'utf8')) as {
      providerAssetId?: string;
    };
    expect(providerRef.providerAssetId).toBe('meta_image_hash_123');
    const creativePlan = writeMarketingAdsAssetCreativePlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      dryRun: true,
      now: new Date('2026-05-22T04:00:00.000Z'),
    });
    expect(creativePlan.ok).toBe(true);
    expect(creativePlan.plan.operations).toContainEqual(
      expect.objectContaining({
        id: 'creative:metaAds:resume-template-hero-image',
        mutation: 'create_meta_image_creative',
        providerAssetId: 'meta_image_hash_123',
        placements: ['facebook_feed', 'instagram_feed'],
        placementTargeting: {
          publisherPlatforms: ['facebook', 'instagram'],
          facebookPositions: ['feed'],
          instagramPositions: ['stream'],
        },
      }),
    );
  });

  it('executes guarded Google Ads image asset upload and writes provider refs', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const sourcePath = path.join(cwd, 'creative.jpg');
    writeFileSync(sourcePath, 'fake jpg bytes', 'utf8');
    const imported = importMarketingAdsAsset(loaded.config, {
      cwd,
      assetId: 'resume-google-hero-image',
      filePath: sourcePath,
      assetType: 'image',
      owner: 'true-resume/growth',
      providers: ['googleAds'],
      now: new Date('2026-05-22T00:00:00.000Z'),
    });
    const registry = JSON.parse(readFileSync(imported.registryPath, 'utf8')) as {
      assets: Array<Record<string, unknown>>;
    };
    registry.assets[0] = {
      ...registry.assets[0],
      lifecycleStatus: 'approved',
      sourceFile: {
        ...(registry.assets[0]?.sourceFile as Record<string, unknown>),
        width: 1200,
        height: 628,
      },
    };
    writeFileSync(imported.registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    const plan = writeMarketingAdsAssetUploadPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/assets/plans/google-upload.json',
      now: new Date('2026-05-22T01:00:00.000Z'),
    });
    const dryRun = await writeMarketingAdsAssetUploadReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/assets/plans/google-upload.json',
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-assets-upload',
      productionConfirm: 'production:true-resume:true-resume:ads-assets-upload',
      now: new Date('2026-05-22T02:00:00.000Z'),
    });
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(
        JSON.stringify({
          results: [{ resourceName: 'customers/1234567890/assets/111' }],
        }),
        { status: 200 },
      );
    });

    const live = await writeMarketingAdsAssetUploadReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/assets/plans/google-upload.json',
      yes: true,
      receiptPath: dryRun.path,
      approvalRef: 'APPROVAL-1',
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-assets-upload',
      productionConfirm: 'production:true-resume:true-resume:ads-assets-upload',
      operationConfirm:
        'live-assets:production:upload:googleAds:resume-google-hero-image:APPROVAL-1',
      liveExecutorMode: 'api',
      providerUploaders: {
        metaAds: uploadMetaAdsAsset,
      },
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '123-456-7890',
        GOOGLE_ADS_LOGIN_CUSTOMER_ID: '999-888-7777',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-22T03:00:00.000Z'),
    });

    expect(plan.ok).toBe(true);
    expect(dryRun.ok).toBe(true);
    expect(live.ok).toBe(true);
    if (live.dryRun) throw new Error('Expected live upload receipt.');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://googleads.googleapis.com/v24/customers/1234567890/assets:mutate',
    );
    expect(
      (fetcher.mock.calls[0]?.[1]?.headers as Record<string, string>)['login-customer-id'],
    ).toBe('9998887777');
    expect(JSON.stringify(live.receipt)).not.toContain('access-token');
    const body = JSON.parse(String(fetcher.mock.calls[0]?.[1]?.body)) as {
      operations: Array<{ create: { imageAsset: { data: string } } }>;
    };
    expect(body.operations[0]?.create.imageAsset.data).toBe(
      Buffer.from('fake jpg bytes').toString('base64'),
    );
    expect(live.receipt.operationResults).toContainEqual(
      expect.objectContaining({
        providerAssetId: 'customers/1234567890/assets/111',
        liveMutationSent: true,
      }),
    );
  });

  it('executes guarded Meta video asset upload and writes provider refs', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const sourcePath = path.join(cwd, 'creative.mp4');
    writeFileSync(sourcePath, 'fake video bytes', 'utf8');
    const imported = importMarketingAdsAsset(loaded.config, {
      cwd,
      assetId: 'resume-meta-demo-video',
      filePath: sourcePath,
      assetType: 'video',
      owner: 'true-resume/growth',
      providers: ['metaAds'],
      now: new Date('2026-05-22T00:00:00.000Z'),
    });
    const registry = JSON.parse(readFileSync(imported.registryPath, 'utf8')) as {
      assets: Array<Record<string, unknown>>;
    };
    registry.assets[0] = {
      ...registry.assets[0],
      lifecycleStatus: 'approved',
      sourceFile: {
        ...(registry.assets[0]?.sourceFile as Record<string, unknown>),
        durationSeconds: 12,
      },
    };
    writeFileSync(imported.registryPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
    const plan = writeMarketingAdsAssetUploadPlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      out: 'docs/marketing/ads/assets/plans/meta-video-upload.json',
      now: new Date('2026-05-22T01:00:00.000Z'),
    });
    const dryRun = await writeMarketingAdsAssetUploadReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/assets/plans/meta-video-upload.json',
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-assets-upload',
      productionConfirm: 'production:true-resume:true-resume:ads-assets-upload',
      now: new Date('2026-05-22T02:00:00.000Z'),
    });
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      return new Response(JSON.stringify({ id: 'meta_video_123' }), { status: 200 });
    });

    const live = await writeMarketingAdsAssetUploadReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/assets/plans/meta-video-upload.json',
      yes: true,
      receiptPath: dryRun.path,
      approvalRef: 'APPROVAL-1',
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-assets-upload',
      productionConfirm: 'production:true-resume:true-resume:ads-assets-upload',
      operationConfirm: 'live-assets:production:upload:metaAds:resume-meta-demo-video:APPROVAL-1',
      liveExecutorMode: 'api',
      providerUploaders: {
        metaAds: uploadMetaAdsAsset,
      },
      env: {
        META_AD_ACCOUNT_ID: '123',
        META_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-22T03:00:00.000Z'),
    });

    expect(plan.ok).toBe(true);
    expect(dryRun.ok).toBe(true);
    expect(live.ok).toBe(true);
    if (live.dryRun) throw new Error('Expected live upload receipt.');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(String(fetcher.mock.calls[0]?.[0])).toBe(
      'https://graph.facebook.com/v25.0/act_123/advideos',
    );
    expect(live.receipt.operationResults).toContainEqual(
      expect.objectContaining({
        providerAssetId: 'meta_video_123',
        liveMutationSent: true,
      }),
    );
    const creativePlan = writeMarketingAdsAssetCreativePlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      placements: ['instagram_reels'],
      dryRun: true,
      now: new Date('2026-05-22T04:00:00.000Z'),
    });
    expect(creativePlan.ok).toBe(true);
    expect(creativePlan.plan.operations).toContainEqual(
      expect.objectContaining({
        id: 'creative:metaAds:resume-meta-demo-video',
        mutation: 'create_meta_video_creative',
        placements: ['instagram_reels'],
        placementTargeting: {
          publisherPlatforms: ['instagram'],
          facebookPositions: [],
          instagramPositions: ['reels'],
        },
      }),
    );
  });

  it('rejects non-ads providers in the focused ads pull command', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);

    const code = await adsPull({
      cwd,
      config: 'config/marketing.mjs',
      provider: 'ga4' as never,
      input: writeNormalizedAdsReport(cwd),
      json: true,
    });

    expect(code).toBe(1);
  });

  it('runs the focused ads tracking audit through the canonical tracking engine', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'tracking.ts'),
      [
        "import { createWebTracker } from '@unisane/web-runtime/tracking';",
        "import { normalizeWebConversion } from '@unisane/web-runtime/conversions';",
        "export const eventName = 'Resume import completed';",
        "export const sourceEventId = 'resume_import_completed';",
        "export const eventId = 'event_1';",
        'export const value = 50;',
        "export const currency = 'USD';",
        'void createWebTracker;',
        'void normalizeWebConversion;',
      ].join('\n'),
      'utf8',
    );

    const code = await adsTrackingAudit({
      cwd,
      config: 'config/marketing.mjs',
      json: true,
    });

    expect(code).toBe(0);
  });

  it('diffs a reviewed ads plan against cached provider pulls', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });
    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/diff-plan.json',
      dailyBudgetAmount: 25,
      currency: 'USD',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    writeFileSync(
      planResult.path ?? '',
      `${JSON.stringify({ ...planResult.artifact, status: 'reviewed' }, null, 2)}\n`,
      'utf8',
    );

    await adsPull({
      cwd,
      config: 'config/marketing.mjs',
      provider: 'googleAds',
      input: writeProviderReportInput(cwd, 'campaign-report.json', 'campaign', [
        {
          id: 'campaign_1',
          name: 'True Resume Search',
          level: 'campaign',
          campaignId: 'campaign_1',
          campaignName: 'True Resume Search',
          metrics: {},
        },
      ]),
      report: 'campaign',
      json: true,
    });
    await adsPull({
      cwd,
      config: 'config/marketing.mjs',
      provider: 'googleAds',
      input: writeProviderReportInput(cwd, 'keyword-report.json', 'keyword', [
        { id: 'kw_1', level: 'keyword', keyword: 'resume builder', metrics: {} },
        { id: 'kw_2', level: 'keyword', keyword: 'resume templates', metrics: {} },
      ]),
      report: 'keyword',
      json: true,
    });
    await adsPull({
      cwd,
      config: 'config/marketing.mjs',
      provider: 'googleAds',
      input: writeProviderReportInput(cwd, 'conversion-report.json', 'conversion', [
        {
          id: 'conv_1',
          level: 'conversion',
          conversionId: 'resume_import_completed_lead',
          conversionName: 'Resume Import Completed',
          metrics: {},
        },
      ]),
      report: 'conversion',
      json: true,
    });

    const code = await adsDiff({
      cwd,
      plan: 'docs/marketing/ads/plans/diff-plan.json',
      provider: 'googleAds',
      json: true,
    });

    expect(code).toBe(0);
  });

  it('generates read-only ads optimization recommendations from unified truth', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'tracking.ts'),
      [
        "import { createWebTracker } from '@unisane/web-runtime/tracking';",
        "import { normalizeWebConversion } from '@unisane/web-runtime/conversions';",
        "export const sourceEventId = 'resume_import_completed';",
        "export const eventId = 'event_1';",
        'export const value = 50;',
        "export const currency = 'USD';",
        'void createWebTracker;',
        'void normalizeWebConversion;',
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });
    await adsPull({
      cwd,
      config: 'config/marketing.mjs',
      provider: 'googleAds',
      input: writeZeroConversionAdsReport(cwd),
      json: true,
    });

    const code = await adsOptimize({
      cwd,
      config: 'config/marketing.mjs',
      targetCpa: '100',
      spendSpikeAmount: '500',
      out: '.unisane/marketing/recommendations/test-ads-optimize.json',
      json: true,
    });

    expect(code).toBe(1);
    const artifact = JSON.parse(
      readFileSync(
        path.join(cwd, '.unisane', 'marketing', 'recommendations', 'test-ads-optimize.json'),
        'utf8',
      ),
    ) as {
      nonMutating: boolean;
      alerts: Array<{ type: string }>;
      recommendations: Array<{ action: string }>;
    };
    expect(artifact.nonMutating).toBe(true);
    expect(artifact.alerts).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: 'zero_conversion' })]),
    );
    expect(artifact.recommendations).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: 'pause_or_reduce_spend' })]),
    );
  });

  it('writes a non-mutating Google Ads draft plan from the marketing strategy map', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const result = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/test-plan.json',
      dailyBudgetAmount: 25,
      currency: 'USD',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.path).toContain(path.join('docs', 'marketing', 'ads', 'plans', 'test-plan.json'));
    expect(existsSync(result.path ?? '')).toBe(true);
    expect(result.artifact.nonMutating).toBe(true);
    expect(result.artifact.mutationPolicy).toEqual(
      expect.objectContaining({
        liveMutationAllowed: false,
        applyRequiresReviewedPlan: true,
        applyRequiresReceipt: true,
        budgetDecreaseAllowsStandardApproval: true,
        pauseOrArchiveAllowsStandardApproval: true,
        destructiveDeletesAllowed: false,
      }),
    );
    expect(result.artifact.candidates).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        strategyObjectId: 'true-resume-search',
        keywords: expect.arrayContaining([
          expect.objectContaining({ text: 'resume builder', matchType: 'phrase' }),
        ]),
        utm: expect.objectContaining({
          source: 'google',
          medium: 'cpc',
          campaign: 'true-resume-search',
          finalUrl:
            '/templates?utm_source=google&utm_medium=cpc&utm_campaign=true-resume-search&utm_content=campaign&utm_term=resume-builder',
        }),
        budgetGuardrail: expect.objectContaining({
          currency: 'USD',
          dailyBudgetAmount: 25,
          budgetIncreaseRequiresApproval: true,
          campaignEnableRequiresApproval: true,
          status: 'reviewable',
        }),
        bidStrategy: expect.objectContaining({
          type: 'manual_cpc',
          requiresApproval: true,
        }),
        actions: expect.arrayContaining([
          expect.objectContaining({ type: 'validate_account_settings', risk: 'medium' }),
          expect.objectContaining({ type: 'create_campaign', risk: 'high' }),
          expect.objectContaining({ type: 'configure_campaign_settings', risk: 'high' }),
          expect.objectContaining({ type: 'add_keywords', risk: 'high' }),
          expect.objectContaining({ type: 'create_responsive_search_ad', risk: 'high' }),
          expect.objectContaining({ type: 'set_budget_guardrail', risk: 'high' }),
          expect.objectContaining({ type: 'set_bid_strategy', risk: 'high' }),
        ]),
        googleSearchSettings: expect.objectContaining({
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          locationCriterionIds: ['2840'],
          languageCriterionIds: ['1000'],
          finalUrlSuffix: 'utm_source=google&utm_medium=cpc',
          accountPreferencesRequired: {
            autoTaggingEnabled: true,
            conversionTrackingReady: true,
            currencyCodeReviewed: true,
            timeZoneReviewed: true,
          },
        }),
      }),
    );
    expect(result.artifact.creativeAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: 'googleAds',
          assetType: 'text_ad',
          approvalStatus: 'draft',
          policyStatus: 'needs_review',
          destinationUrl:
            '/templates?utm_source=google&utm_medium=cpc&utm_campaign=true-resume-search&utm_content=campaign&utm_term=resume-builder',
        }),
        expect.objectContaining({
          provider: 'googleAds',
          assetType: 'landing_page_variant',
          owner: 'true-resume-search',
        }),
      ]),
    );
    expect(readFileSync(result.path ?? '', 'utf8')).toContain('"liveMutationAllowed": false');
  });

  it('normalizes Google Ads account settings for readiness checks', () => {
    const artifact = marketingProviderReportArtifactSchema.parse(
      normalizeGoogleAdsReport(
        {
          results: [
            {
              customer: {
                id: '1234567890',
                descriptiveName: 'True Resume',
                currencyCode: 'USD',
                timeZone: 'America/New_York',
                autoTaggingEnabled: true,
                finalUrlSuffix: 'utm_source=google&utm_medium=cpc',
                conversionTrackingSetting: {
                  conversionTrackingStatus: 'CONVERSION_TRACKING_MANAGED_BY_SELF',
                },
              },
            },
          ],
        },
        {
          platformId: 'true-resume',
          appId: 'true-resume',
          reportType: 'account',
          source: 'api',
          pulledAt: '2026-05-22T00:00:00.000Z',
          window: {
            startDate: '2026-05-01',
            endDate: '2026-05-22',
          },
        },
      ),
    );

    expect(artifact.records).toContainEqual(
      expect.objectContaining({
        level: 'account',
        accountId: '1234567890',
        currency: 'USD',
        accountTimeZone: 'America/New_York',
        autoTaggingEnabled: true,
        finalUrlSuffix: 'utm_source=google&utm_medium=cpc',
        conversionTrackingStatus: 'CONVERSION_TRACKING_MANAGED_BY_SELF',
      }),
    );
  });

  it('normalizes Google Ads Auction Insights domains and metrics', () => {
    const artifact = marketingProviderReportArtifactSchema.parse(
      normalizeGoogleAdsReport(
        {
          results: [
            {
              campaign: { id: 'campaign_1', name: 'True Resume Search' },
              segments: { auctionInsightDomain: 'resume.io' },
              metrics: {
                auctionInsightSearchImpressionShare: 0.42,
                auctionInsightSearchOverlapRate: 0.58,
                auctionInsightSearchPositionAboveRate: 0.37,
                auctionInsightSearchOutrankingShare: 0.22,
                auctionInsightSearchTopImpressionPercentage: 0.51,
                auctionInsightSearchAbsoluteTopImpressionPercentage: 0.24,
              },
            },
          ],
        },
        {
          platformId: 'true-resume',
          appId: 'true-resume',
          reportType: 'auctionInsight',
          source: 'api',
          pulledAt: '2026-05-22T00:00:00.000Z',
          window: {
            startDate: '2026-05-01',
            endDate: '2026-05-22',
          },
        },
      ),
    );

    expect(artifact.records).toContainEqual(
      expect.objectContaining({
        id: 'campaign_1:resume.io',
        level: 'competitor',
        campaignId: 'campaign_1',
        auctionInsightDomain: 'resume.io',
        auctionInsightSearchImpressionShare: 0.42,
        auctionInsightSearchOverlapRate: 0.58,
      }),
    );
  });

  it('normalizes Meta creative inventory into reviewable creative asset records', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    writeMarketingRegistries(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const pull = writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'metaAds',
      reportType: 'creative',
      inputPath: writeMetaCreativeInventory(cwd),
      inputFormat: 'normalized',
    });

    const artifact = marketingProviderReportArtifactSchema.parse(
      JSON.parse(readFileSync(pull.latestPath, 'utf8')),
    );
    const assets = creativeAssetsFromProviderArtifact(artifact);
    const status = await buildMarketingAdsStatusReport(loaded.config, {
      cwd,
      now: new Date('2026-05-21T01:00:00.000Z'),
      maxAgeDays: 3,
    });

    expect(assets).toContainEqual(
      expect.objectContaining({
        provider: 'metaAds',
        source: 'provider-pull',
        creativeId: 'creative_1',
        assetType: 'image',
        approvalStatus: 'reviewed',
        policyStatus: 'eligible',
        destinationUrl: '/templates',
      }),
    );
    expect(status.creativeInventory).toContainEqual(
      expect.objectContaining({
        provider: 'metaAds',
        reportType: 'creative',
        status: 'fresh',
        recordCount: 1,
      }),
    );
    expect(status.checks).toContainEqual(
      expect.objectContaining({
        id: 'creative.metaAds.creative',
        status: 'pass',
      }),
    );
  });

  it('reports planned creative review status before provider mutation workflows', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });
    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/creative-status-plan.json',
      dailyBudgetAmount: 25,
      currency: 'USD',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });

    const report = buildMarketingAdsCreativeStatusReport({
      cwd,
      planPath: 'docs/marketing/ads/plans/creative-status-plan.json',
      provider: 'googleAds',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });
    const code = await adsCreativeStatus({
      cwd,
      plan: 'docs/marketing/ads/plans/creative-status-plan.json',
      provider: 'googleAds',
      json: true,
    });

    expect(code).toBe(0);
    expect(report.ok).toBe(true);
    expect(report.planPath).toBe(planResult.path);
    expect(report.plannedAssets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provider: 'googleAds',
          assetType: 'text_ad',
          approvalStatus: 'draft',
          policyStatus: 'needs_review',
        }),
      ]),
    );
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.stringContaining('.approval'), status: 'warn' }),
        expect.objectContaining({ id: expect.stringContaining('.policy'), status: 'warn' }),
        expect.objectContaining({
          id: 'provider.googleAds.creative.cache',
          status: 'skip',
        }),
      ]),
    );
    expect(report.nextWorkflowStep).toContain('Review creative copy/assets');
  });

  it('blocks rejected or policy-disapproved planned creatives', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });
    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/rejected-creative-plan.json',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const brokenPlan = {
      ...planResult.artifact,
      creativeAssets: [
        {
          ...planResult.artifact.creativeAssets[0],
          approvalStatus: 'rejected',
          policyStatus: 'disapproved',
          destinationUrl: undefined,
        },
      ],
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(brokenPlan, null, 2)}\n`, 'utf8');

    const report = buildMarketingAdsCreativeStatusReport({
      cwd,
      planPath: 'docs/marketing/ads/plans/rejected-creative-plan.json',
      provider: 'googleAds',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });

    expect(report.ok).toBe(false);
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: expect.stringContaining('.destination'), status: 'error' }),
        expect.objectContaining({ id: expect.stringContaining('.approval'), status: 'error' }),
        expect.objectContaining({ id: expect.stringContaining('.policy'), status: 'error' }),
      ]),
    );
    expect(report.nextWorkflowStep).toContain('Fix blocking creative errors');
  });

  it('reviews provider creative inventory separately from planned creatives', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'metaAds',
      reportType: 'creative',
      inputPath: writeMetaCreativeInventory(cwd),
      inputFormat: 'normalized',
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const report = buildMarketingAdsCreativeStatusReport({
      cwd,
      provider: 'metaAds',
      maxAgeDays: 3,
      now: new Date('2026-05-21T01:00:00.000Z'),
    });

    expect(report.ok).toBe(true);
    expect(report.providerArtifacts).toContainEqual(
      expect.objectContaining({
        provider: 'metaAds',
        status: 'fresh',
        recordCount: 1,
      }),
    );
    expect(report.providerAssets).toContainEqual(
      expect.objectContaining({
        provider: 'metaAds',
        source: 'provider-pull',
        creativeId: 'creative_1',
        policyStatus: 'eligible',
      }),
    );
    expect(report.checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'provider.metaAds.creative.cache', status: 'pass' }),
        expect.objectContaining({
          id: expect.stringContaining('provider.metaAds.provider:metaAds:creative_1.policy'),
          status: 'pass',
        }),
      ]),
    );
  });

  it('writes a full non-mutating Meta launch draft chain while creative remains a blocker', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const result = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      dryRun: true,
      now: new Date('2026-05-21T01:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    expect(result.artifact.candidates).toContainEqual(
      expect.objectContaining({
        provider: 'metaAds',
        strategyObjectId: 'true-resume-search',
        blockers: expect.arrayContaining(['prepare_creative']),
        metaAdsBuildout: expect.objectContaining({
          destinationUrl:
            '/templates?utm_source=meta&utm_medium=paid_social&utm_campaign=true-resume-search&utm_content=campaign',
          countryCodes: ['IN'],
          placementTargeting: expect.objectContaining({
            publisherPlatforms: ['facebook', 'instagram'],
            facebookPositions: ['feed'],
            instagramPositions: ['stream'],
          }),
          creative: expect.objectContaining({
            providerAssetId: 'REVIEW_REQUIRED_PROVIDER_ASSET_ID',
            primaryText: 'REVIEW_REQUIRED_PRIMARY_TEXT',
            headline: 'REVIEW_REQUIRED_HEADLINE',
          }),
        }),
        actions: expect.arrayContaining([
          expect.objectContaining({ type: 'prepare_creative', blocksApply: true }),
          expect.objectContaining({ type: 'create_campaign', risk: 'high' }),
          expect.objectContaining({ type: 'create_ad_set', risk: 'high' }),
          expect.objectContaining({ type: 'create_ad_creative', risk: 'high' }),
          expect.objectContaining({ type: 'create_ad', risk: 'high' }),
        ]),
      }),
    );
  });

  it('blocks ads planning when no strategy map is cached', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const result = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      dryRun: true,
      now: new Date('2026-05-21T01:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    expect(result.path).toBeUndefined();
    expect(result.artifact.blockers).toContain('missing_strategy_map');
    expect(result.artifact.nextWorkflowStep).toContain('marketing strategy-pull');
  });

  it('imports SEO ads-plan output as guarded Google Ads draft candidates', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const result = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      seoAdsPlanPath: writeSeoAdsPlan(cwd),
      dailyBudgetAmount: 30,
      currency: 'USD',
      dryRun: true,
      now: new Date('2026-05-21T01:00:00.000Z'),
    });

    expect(result.path).toBeUndefined();
    expect(result.artifact.blockers).not.toContain('missing_strategy_map');
    expect(result.artifact.blockers).toContain('conversion_mapping_required');
    expect(result.artifact.candidates).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        source: 'seo-ads-plan',
        sourceSeoAdGroupId: 'adgroup-resume-templates',
        sourceOpportunityId: 'opp_resume_templates',
        sourceOpportunitySlug: 'resume-templates',
        strategyObjectId: 'seo-adgroup-resume-templates',
        strategyObjectKind: 'seoAdGroup',
        landingPageUrl: '/templates',
        keywords: [
          { text: 'resume templates', matchType: 'exact', source: 'seo-ads-plan' },
          {
            text: 'professional resume template',
            matchType: 'phrase',
            source: 'seo-ads-plan',
          },
        ],
        negativeKeywords: expect.arrayContaining([
          expect.objectContaining({ text: 'jobs' }),
          expect.objectContaining({ text: 'free download' }),
        ]),
        budgetGuardrail: expect.objectContaining({
          dailyBudgetAmount: 30,
          status: 'reviewable',
        }),
        blockers: expect.arrayContaining(['conversion_mapping_required']),
      }),
    );
  });

  it('writes a guarded ads apply dry-run preview from a reviewed plan', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/reviewed-plan.json',
      dailyBudgetAmount: 25,
      currency: 'USD',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const reviewedPlan = {
      ...planResult.artifact,
      status: 'reviewed',
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(reviewedPlan, null, 2)}\n`, 'utf8');

    const result = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/reviewed-plan.json',
      dryRun: true,
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      out: '.unisane/marketing/production/apply-previews/test-ads-apply.json',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(existsSync(result.path ?? '')).toBe(true);
    expect(existsSync(result.receiptPath ?? '')).toBe(true);
    expect(result.preview.liveMutationAllowed).toBe(false);
    expect(result.preview.status).toBe('ready');
    expect(result.preview.blockers).toEqual([]);
    expect(result.preview.confirmations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'account', provider: 'googleAds', status: 'confirmed' }),
        expect.objectContaining({ type: 'production', status: 'confirmed' }),
      ]),
    );
    expect(result.preview.operations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionType: 'validate_landing_page',
          applyOrder: 1,
          safety: 'verification',
          mutationIntent: 'verify',
          approvalTier: 'none',
          firstApplyEligible: true,
          receiptRequired: true,
          destructiveAllowed: false,
          mode: 'dry_run_only',
        }),
        expect.objectContaining({
          actionType: 'create_campaign',
          safety: 'spend_or_launch',
          mutationIntent: 'launch_or_expand',
          approvalTier: 'strict',
          firstApplyEligible: false,
          mode: 'dry_run_only',
        }),
      ]),
    );
    expect(result.receipt).toEqual(
      expect.objectContaining({
        kind: 'unisane.marketing.ads-apply-receipt',
        status: 'previewed',
        dryRun: true,
        liveMutationAllowed: false,
        previewStatus: 'ready',
        actor: {
          kind: 'devtools-cli',
          actorRef: 'redacted',
          secretValues: 'redacted',
        },
        providerAccounts: [
          {
            provider: 'googleAds',
            accountRef: 'GOOGLE_ADS_CUSTOMER_ID',
            confirmationExpected: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
            confirmationStatus: 'confirmed',
          },
        ],
        operationResults: expect.arrayContaining([
          expect.objectContaining({
            actionType: 'validate_landing_page',
            attemptedAt: '2026-05-21T02:00:00.000Z',
            environment: 'production',
            status: 'previewed',
            safety: 'verification',
            mutationIntent: 'verify',
            approvalTier: 'none',
          }),
          expect.objectContaining({
            actionType: 'create_campaign',
            attemptedAt: '2026-05-21T02:00:00.000Z',
            environment: 'production',
            status: 'blocked',
            safety: 'spend_or_launch',
            mutationIntent: 'launch_or_expand',
            approvalTier: 'strict',
          }),
        ]),
      }),
    );
  });

  it('sends a live Google Ads pause only behind receipt, approval, and exact confirmations', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/live-pause-plan.json',
      dailyBudgetAmount: 25,
      currency: 'USD',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const candidate = planResult.artifact.candidates[0];
    const reviewedPlan = {
      ...planResult.artifact,
      status: 'reviewed',
      blockers: [],
      candidates: [
        {
          ...candidate,
          campaignIds: ['123456'],
          blockers: [],
          actions: [
            {
              type: 'validate_landing_page',
              provider: 'googleAds',
              risk: 'low',
              summary: 'Verify the landing page before any provider mutation.',
              requiresApproval: false,
              blocksApply: false,
            },
            {
              type: 'pause_campaign',
              provider: 'googleAds',
              risk: 'medium',
              summary: 'Pause a reviewed underperforming campaign.',
              requiresApproval: true,
              blocksApply: false,
            },
          ],
        },
      ],
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(reviewedPlan, null, 2)}\n`, 'utf8');
    const dryRun = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-pause-plan.json',
      dryRun: true,
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            results: [{ resourceName: 'customers/1234567890/campaigns/123456' }],
          }),
          { status: 200 },
        ),
    );

    const result = await writeMarketingAdsLiveApplyReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-pause-plan.json',
      receiptPath: dryRun.receiptPath ?? '',
      yes: true,
      approvalRef: 'APPROVAL-1',
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      operationConfirm:
        'live:production:googleAds:googleAds:true-resume-search:pause_campaign:APPROVAL-1',
      liveExecutorMode: 'api',
      providerExecutors: {
        googleAds: executeGoogleAdsLiveOperation,
      },
      env: {
        UNISANE_MARKETING_ADS_LIVE_MUTATION: 'enabled',
        GOOGLE_ADS_CUSTOMER_ID: '123-456-7890',
        GOOGLE_ADS_LOGIN_CUSTOMER_ID: '999-888-7777',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.receipt.status).toBe('executed');
    expect(fetcher).toHaveBeenCalledTimes(1);
    const fetchCall = fetcher.mock.calls[0];
    expect(String(fetchCall?.[0])).toBe(
      'https://googleads.googleapis.com/v24/customers/1234567890/campaigns:mutate',
    );
    expect(fetchCall?.[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer access-token',
          'developer-token': 'developer-token',
          'login-customer-id': '9998887777',
        }),
      }),
    );
    expect(JSON.parse(String(fetchCall?.[1]?.body))).toEqual({
      operations: [
        {
          updateMask: 'status',
          update: {
            resourceName: 'customers/1234567890/campaigns/123456',
            status: 'PAUSED',
          },
        },
      ],
    });
    expect(result.receipt.operationResults).toEqual([
      expect.objectContaining({
        operationId: 'googleAds:true-resume-search:pause_campaign',
        status: 'sent',
        liveMutationSent: true,
      }),
    ]);
    expect(JSON.stringify(result.receipt)).not.toContain('access-token');
    expect(JSON.stringify(result.receipt)).not.toContain('developer-token');
  });

  it('creates a paused Google Ads Search campaign for an explicitly approved production customer', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/live-create-plan.json',
      dailyBudgetAmount: 25,
      currency: 'INR',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const reviewedPlan = {
      ...planResult.artifact,
      status: 'reviewed',
      candidates: planResult.artifact.candidates.map((candidate) => ({
        ...candidate,
        bidStrategy: {
          type: 'maximize_conversions',
          requiresApproval: true,
          message: 'Use purchase-focused conversion bidding for the reviewed Search test.',
        },
      })),
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(reviewedPlan, null, 2)}\n`, 'utf8');
    const dryRun = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-create-plan.json',
      dryRun: true,
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });
    let campaignCreateBody: unknown;
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/googleAds:searchStream')) {
        return new Response(
          JSON.stringify([{ results: [{ customer: { id: '8355106509', testAccount: false } }] }]),
          { status: 200 },
        );
      }
      if (url.endsWith('/campaignBudgets:mutate')) {
        expect(JSON.parse(String(init?.body))).toEqual({
          operations: [
            {
              create: expect.objectContaining({
                amountMicros: 25_000_000,
                deliveryMethod: 'STANDARD',
                explicitlyShared: false,
              }),
            },
          ],
        });
        return new Response(
          JSON.stringify({
            results: [{ resourceName: 'customers/8355106509/campaignBudgets/777' }],
          }),
          { status: 200 },
        );
      }
      if (url.endsWith('/campaigns:mutate')) {
        const body = JSON.parse(String(init?.body));
        campaignCreateBody = body;
        return new Response(
          JSON.stringify({ results: [{ resourceName: 'customers/8355106509/campaigns/888' }] }),
          { status: 200 },
        );
      }
      if (url.endsWith('/campaignCriteria:mutate')) {
        const body = JSON.parse(String(init?.body));
        expect(body.operations).toHaveLength(2);
        expect(body.operations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              create: expect.objectContaining({
                campaign: 'customers/8355106509/campaigns/888',
                location: { geoTargetConstant: 'geoTargetConstants/2840' },
              }),
            }),
            expect.objectContaining({
              create: expect.objectContaining({
                campaign: 'customers/8355106509/campaigns/888',
                language: { languageConstant: 'languageConstants/1000' },
              }),
            }),
          ]),
        );
        return new Response(
          JSON.stringify({
            results: [
              { resourceName: 'customers/8355106509/campaignCriteria/888~2840' },
              { resourceName: 'customers/8355106509/campaignCriteria/888~1000' },
            ],
          }),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected request ${url}`);
    });

    const result = await writeMarketingAdsLiveApplyReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-create-plan.json',
      receiptPath: dryRun.receiptPath ?? '',
      yes: true,
      approvalRef: 'APPROVAL-2',
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      operationConfirm:
        'live:production:googleAds:googleAds:true-resume-search:create_campaign:APPROVAL-2',
      liveExecutorMode: 'api',
      providerExecutors: {
        googleAds: executeGoogleAdsLiveOperation,
      },
      env: {
        UNISANE_MARKETING_ADS_LIVE_MUTATION: 'enabled',
        UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION: 'enabled',
        GOOGLE_ADS_CUSTOMER_ID: '8355106509',
        GOOGLE_ADS_LOGIN_CUSTOMER_ID: '9418255450',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.receipt.status).toBe('executed');
    expect(fetcher).toHaveBeenCalledTimes(4);
    const campaignCreate = (campaignCreateBody as { operations: Array<{ create: unknown }> })
      .operations[0]?.create;
    expect(campaignCreate).toEqual(
      expect.objectContaining({
        status: 'PAUSED',
        advertisingChannelType: 'SEARCH',
        containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
        campaignBudget: 'customers/8355106509/campaignBudgets/777',
        maximizeConversions: {},
        networkSettings: expect.objectContaining({
          targetGoogleSearch: true,
          targetSearchNetwork: false,
          targetContentNetwork: false,
          targetPartnerSearchNetwork: false,
        }),
      }),
    );
    expect(result.receipt.operationResults).toEqual([
      expect.objectContaining({
        operationId: 'googleAds:true-resume-search:create_campaign',
        status: 'sent',
        liveMutationSent: true,
        providerOperationId: 'customers/8355106509/campaigns/888',
      }),
    ]);
  });

  it('creates a paused Meta Ads campaign from a reviewed buildout behind exact confirmations', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      out: 'docs/marketing/ads/plans/live-meta-create-plan.json',
      dailyBudgetAmount: 100,
      currency: 'INR',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const candidate = planResult.artifact.candidates[0];
    const reviewedPlan = {
      ...planResult.artifact,
      status: 'reviewed',
      blockers: [],
      candidates: [
        {
          ...candidate,
          blockers: [],
          metaAdsBuildout: {
            destinationUrl: '/templates',
            adSetName: 'True Resume Meta Ad Set',
            adName: 'True Resume Meta Ad',
            countryCodes: ['IN'],
            placementTargeting: {
              publisherPlatforms: ['facebook', 'instagram'],
              facebookPositions: ['feed'],
              instagramPositions: ['stream'],
            },
            creative: {
              name: 'True Resume Meta Creative',
              assetType: 'image',
              providerAssetId: 'meta_image_hash_123',
              primaryText: 'Build a polished resume before your next application.',
              headline: 'Create A Better Resume',
              description: 'ATS-ready templates and guided resume tools.',
              callToActionType: 'LEARN_MORE',
              urlTags: 'utm_source=meta&utm_medium=paid_social',
            },
          },
          actions: [
            {
              type: 'validate_landing_page',
              provider: 'metaAds',
              risk: 'low',
              summary: 'Verify the landing page before any provider mutation.',
              requiresApproval: false,
              blocksApply: false,
            },
            {
              type: 'create_campaign',
              provider: 'metaAds',
              risk: 'high',
              summary: 'Create a paused Meta campaign from reviewed creative.',
              requiresApproval: true,
              blocksApply: false,
            },
          ],
        },
      ],
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(reviewedPlan, null, 2)}\n`, 'utf8');
    const dryRun = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-meta-create-plan.json',
      dryRun: true,
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });
    const requests: Array<{ url: string; body: Record<string, string> }> = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const body = Object.fromEntries(new URLSearchParams(String(init?.body)));
      requests.push({ url, body });
      if (url.endsWith('/act_123/campaigns')) {
        return new Response(JSON.stringify({ id: 'meta_campaign_1' }), { status: 200 });
      }
      if (url.endsWith('/act_123/adsets')) {
        return new Response(JSON.stringify({ id: 'meta_adset_1' }), { status: 200 });
      }
      if (url.endsWith('/act_123/adcreatives')) {
        return new Response(JSON.stringify({ id: 'meta_creative_1' }), { status: 200 });
      }
      if (url.endsWith('/act_123/ads')) {
        return new Response(JSON.stringify({ id: 'meta_ad_1' }), { status: 200 });
      }
      throw new Error(`Unexpected request ${url}`);
    });

    const result = await writeMarketingAdsLiveApplyReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-meta-create-plan.json',
      receiptPath: dryRun.receiptPath ?? '',
      yes: true,
      approvalRef: 'APPROVAL-META',
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      operationConfirm:
        'live:production:metaAds:metaAds:true-resume-search:create_campaign:APPROVAL-META',
      liveExecutorMode: 'api',
      providerExecutors: {
        googleAds: executeGoogleAdsLiveOperation,
        metaAds: executeMetaAdsLiveOperation,
      },
      env: {
        UNISANE_MARKETING_ADS_LIVE_MUTATION: 'enabled',
        META_AD_ACCOUNT_ID: '123',
        META_ADS_ACCESS_TOKEN: 'meta-access-token',
        META_PAGE_ID: 'page_123',
        META_INSTAGRAM_ACTOR_ID: 'ig_123',
        META_PIXEL_ID: 'pixel_123',
      },
      fetch: fetcher,
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(result.receipt.status).toBe('executed');
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(requests.map((request) => request.url)).toEqual([
      'https://graph.facebook.com/v25.0/act_123/campaigns',
      'https://graph.facebook.com/v25.0/act_123/adsets',
      'https://graph.facebook.com/v25.0/act_123/adcreatives',
      'https://graph.facebook.com/v25.0/act_123/ads',
    ]);
    expect(requests[0]?.body).toEqual(
      expect.objectContaining({
        name: 'True Resume Search',
        objective: 'OUTCOME_SALES',
        status: 'PAUSED',
      }),
    );
    expect(JSON.parse(requests[1]?.body.promoted_object ?? '{}')).toEqual({
      pixel_id: 'pixel_123',
      custom_event_type: 'PURCHASE',
    });
    expect(JSON.parse(requests[1]?.body.targeting ?? '{}')).toEqual(
      expect.objectContaining({
        geo_locations: { countries: ['IN'] },
        publisher_platforms: ['facebook', 'instagram'],
        facebook_positions: ['feed'],
        instagram_positions: ['stream'],
      }),
    );
    expect(requests[1]?.body).toEqual(
      expect.objectContaining({
        campaign_id: 'meta_campaign_1',
        daily_budget: '10000',
        status: 'PAUSED',
      }),
    );
    expect(JSON.parse(requests[2]?.body.object_story_spec ?? '{}')).toEqual(
      expect.objectContaining({
        page_id: 'page_123',
        instagram_actor_id: 'ig_123',
        link_data: expect.objectContaining({
          image_hash: 'meta_image_hash_123',
          link: 'https://trueresume.io/templates',
          message: 'Build a polished resume before your next application.',
          name: 'Create A Better Resume',
        }),
      }),
    );
    expect(JSON.parse(requests[3]?.body.creative ?? '{}')).toEqual({
      creative_id: 'meta_creative_1',
    });
    expect(result.receipt.operationResults).toEqual([
      expect.objectContaining({
        operationId: 'metaAds:true-resume-search:create_campaign',
        status: 'sent',
        liveMutationSent: true,
        providerOperationId: 'meta_campaign_1',
      }),
    ]);
    expect(JSON.stringify(result.receipt)).not.toContain('meta-access-token');
  });

  it('blocks Meta Ads live campaign creation when generated buildout placeholders were not reviewed', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'metaAds',
      out: 'docs/marketing/ads/plans/live-meta-placeholder-plan.json',
      dailyBudgetAmount: 100,
      currency: 'INR',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const candidate = planResult.artifact.candidates[0];
    const reviewedPlan = {
      ...planResult.artifact,
      status: 'reviewed',
      blockers: [],
      candidates: [
        {
          ...candidate,
          blockers: [],
          actions: [
            {
              type: 'validate_landing_page',
              provider: 'metaAds',
              risk: 'low',
              summary: 'Verify the landing page before any provider mutation.',
              requiresApproval: false,
              blocksApply: false,
            },
            {
              type: 'create_campaign',
              provider: 'metaAds',
              risk: 'high',
              summary: 'Create a paused Meta campaign from reviewed creative.',
              requiresApproval: true,
              blocksApply: false,
            },
          ],
        },
      ],
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(reviewedPlan, null, 2)}\n`, 'utf8');
    const dryRun = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-meta-placeholder-plan.json',
      dryRun: true,
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ id: 'should_not_send' })));

    const result = await writeMarketingAdsLiveApplyReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-meta-placeholder-plan.json',
      receiptPath: dryRun.receiptPath ?? '',
      yes: true,
      approvalRef: 'APPROVAL-META',
      accountConfirm: 'production:metaAds:META_AD_ACCOUNT_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      operationConfirm:
        'live:production:metaAds:metaAds:true-resume-search:create_campaign:APPROVAL-META',
      liveExecutorMode: 'api',
      providerExecutors: {
        googleAds: executeGoogleAdsLiveOperation,
        metaAds: executeMetaAdsLiveOperation,
      },
      env: {
        UNISANE_MARKETING_ADS_LIVE_MUTATION: 'enabled',
        META_AD_ACCOUNT_ID: '123',
        META_ADS_ACCESS_TOKEN: 'meta-access-token',
        META_PAGE_ID: 'page_123',
        META_PIXEL_ID: 'pixel_123',
      },
      fetch: fetcher,
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    expect(result.receipt.status).toBe('failed');
    expect(fetcher).not.toHaveBeenCalled();
    expect(result.receipt.operationResults).toEqual([
      expect.objectContaining({
        operationId: 'metaAds:true-resume-search:create_campaign',
        status: 'failed',
        liveMutationSent: false,
        message: expect.stringContaining('ADS_LIVE_META_BUILDOUT_UNREVIEWED'),
      }),
    ]);
    expect(JSON.stringify(result.receipt)).not.toContain('meta-access-token');
  });

  it('blocks Google Ads Search campaign creation for a production customer without explicit production mutation approval', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/live-create-plan.json',
      dailyBudgetAmount: 25,
      currency: 'INR',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    writeFileSync(
      planResult.path ?? '',
      `${JSON.stringify({ ...planResult.artifact, status: 'reviewed' }, null, 2)}\n`,
      'utf8',
    );
    const dryRun = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-create-plan.json',
      dryRun: true,
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/googleAds:searchStream')) {
        return new Response(
          JSON.stringify([{ results: [{ customer: { id: '8355106509', testAccount: false } }] }]),
          { status: 200 },
        );
      }
      throw new Error(`Unexpected request ${url}`);
    });

    const result = await writeMarketingAdsLiveApplyReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-create-plan.json',
      receiptPath: dryRun.receiptPath ?? '',
      yes: true,
      approvalRef: 'APPROVAL-2',
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      operationConfirm:
        'live:production:googleAds:googleAds:true-resume-search:create_campaign:APPROVAL-2',
      liveExecutorMode: 'api',
      providerExecutors: {
        googleAds: executeGoogleAdsLiveOperation,
      },
      env: {
        UNISANE_MARKETING_ADS_LIVE_MUTATION: 'enabled',
        GOOGLE_ADS_CUSTOMER_ID: '8355106509',
        GOOGLE_ADS_LOGIN_CUSTOMER_ID: '9418255450',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    expect(result.receipt.status).toBe('failed');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(result.receipt.operationResults).toEqual([
      expect.objectContaining({
        operationId: 'googleAds:true-resume-search:create_campaign',
        status: 'failed',
        liveMutationSent: false,
        message: expect.stringContaining(
          'UNISANE_MARKETING_ADS_PRODUCTION_CUSTOMER_MUTATION=enabled',
        ),
      }),
    ]);
  });

  it('blocks live ads apply without an exact operation confirmation', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/live-blocked-plan.json',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const candidate = planResult.artifact.candidates[0];
    const reviewedPlan = {
      ...planResult.artifact,
      status: 'reviewed',
      blockers: [],
      candidates: [
        {
          ...candidate,
          campaignIds: ['123456'],
          blockers: [],
          actions: [
            {
              type: 'validate_landing_page',
              provider: 'googleAds',
              risk: 'low',
              summary: 'Verify the landing page before any provider mutation.',
              requiresApproval: false,
              blocksApply: false,
            },
            {
              type: 'pause_campaign',
              provider: 'googleAds',
              risk: 'medium',
              summary: 'Pause a reviewed underperforming campaign.',
              requiresApproval: true,
              blocksApply: false,
            },
          ],
        },
      ],
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(reviewedPlan, null, 2)}\n`, 'utf8');
    const dryRun = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-blocked-plan.json',
      dryRun: true,
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => new Response('{}', { status: 200 }),
    );

    const result = await writeMarketingAdsLiveApplyReceipt(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/live-blocked-plan.json',
      receiptPath: dryRun.receiptPath ?? '',
      yes: true,
      approvalRef: 'APPROVAL-1',
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      liveExecutorMode: 'api',
      providerExecutors: {
        googleAds: executeGoogleAdsLiveOperation,
      },
      env: {
        UNISANE_MARKETING_ADS_LIVE_MUTATION: 'enabled',
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    expect(result.receipt.status).toBe('blocked');
    expect(result.receipt.blockers).toContain(
      'missing_live_operation_confirmation:googleAds:true-resume-search:pause_campaign',
    );
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('blocks ads apply dry-run when the plan is still draft', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });
    writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/draft-plan.json',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });

    const result = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/draft-plan.json',
      dryRun: true,
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    expect(result.receipt?.status).toBe('blocked');
    expect(result.preview.blockers).toContain('plan_status_not_reviewed');
    expect(result.preview.nextWorkflowStep).toContain('set status to reviewed or approved');
  });

  it('classifies pause/archive and budget decrease with lower approval friction than launches', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const planResult = writeMarketingAdsPlan(loaded.config, {
      cwd,
      provider: 'googleAds',
      out: 'docs/marketing/ads/plans/optimization-plan.json',
      dailyBudgetAmount: 25,
      currency: 'USD',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const candidate = planResult.artifact.candidates[0];
    const reviewedPlan = {
      ...planResult.artifact,
      status: 'reviewed',
      candidates: [
        {
          ...candidate,
          actions: [
            {
              type: 'pause_campaign',
              provider: 'googleAds',
              risk: 'medium',
              summary: 'Pause a reviewed underperforming campaign instead of deleting it.',
              requiresApproval: true,
              blocksApply: false,
            },
            {
              type: 'decrease_budget',
              provider: 'googleAds',
              risk: 'medium',
              summary: 'Reduce spend on a reviewed underperforming campaign.',
              requiresApproval: true,
              blocksApply: false,
            },
            {
              type: 'create_campaign',
              provider: 'googleAds',
              risk: 'high',
              summary: 'Launch a replacement campaign.',
              requiresApproval: true,
              blocksApply: false,
            },
          ],
        },
      ],
      blockers: [],
    };
    writeFileSync(planResult.path ?? '', `${JSON.stringify(reviewedPlan, null, 2)}\n`, 'utf8');

    const result = await writeMarketingAdsApplyPreview(loaded.config, {
      cwd,
      planPath: 'docs/marketing/ads/plans/optimization-plan.json',
      dryRun: true,
      accountConfirm: 'production:googleAds:GOOGLE_ADS_CUSTOMER_ID:ads-apply',
      productionConfirm: 'production:true-resume:true-resume:ads-apply',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });

    expect(result.ok).toBe(false);
    expect(result.preview.blockers).toContain('no_first_apply_safe_operations');
    expect(result.preview.operations).toEqual([
      expect.objectContaining({
        actionType: 'decrease_budget',
        applyOrder: 1,
        safety: 'low_risk_change',
        mutationIntent: 'spend_decrease',
        approvalTier: 'standard',
        destructiveAllowed: false,
      }),
      expect.objectContaining({
        actionType: 'pause_campaign',
        applyOrder: 2,
        safety: 'pause_or_archive',
        mutationIntent: 'pause_or_archive',
        approvalTier: 'standard',
        destructiveAllowed: false,
      }),
      expect.objectContaining({
        actionType: 'create_campaign',
        applyOrder: 3,
        safety: 'spend_or_launch',
        mutationIntent: 'launch_or_expand',
        approvalTier: 'strict',
        destructiveAllowed: false,
      }),
    ]);
  });
});
