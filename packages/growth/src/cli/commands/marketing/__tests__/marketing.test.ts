import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../provider-runtime.js', async () => {
  const { executeGrowthTestProviderCommand } =
    await import('../../../__tests__/provider-command.js');
  return { executeGrowthProviderCommand: executeGrowthTestProviderCommand };
});
import {
  marketingProofSetup,
  marketingProofStatus,
  marketingSetupGuide,
  marketingSetupPrelive,
  marketingSetupStatus,
} from '../index.js';
import { saveMarketingGoogleAuthProfile } from '../auth/google.js';
import { saveMarketingMetaAuthProfile } from '../auth/meta.js';
import {
  auditMarketingTrackingSource,
  buildMarketingSetupLifecycleStatus,
  buildMarketingRecommendations,
  buildMarketingRealAccountProofStatus,
  buildMarketingScheduledReportingPlan,
  buildMarketingStatusReport,
  buildUnifiedMarketingReport,
  discoverMarketingGoogleAccounts,
  discoverMarketingMetaAccounts,
  loadMarketingConfig,
  MARKETING_GOOGLE_ADS_SCOPE,
  MARKETING_GOOGLE_ANALYTICS_SCOPE,
  MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
  readMarketingProviderReportStatus,
  runMarketingDoctor,
  validateMarketingRegistries,
  writeMarketingAlertAcknowledgementReceipt,
  writeMarketingExperimentDecisionReceipt,
  writeMarketingRecommendationDecisionReceipt,
  writeMarketingScheduledReportingPlan,
  writeMarketingConfirmedConversionPull,
  writeMarketingProofSetup,
  writeMarketingProviderApiReportPull,
  writeMarketingProviderReportPull,
  writeMarketingStrategyMapPull,
} from '@unisane/growth/marketing';
import {
  discoverMarketingGoogleAccounts as discoverMarketingGoogleAccountsWithProvider,
  pullGoogleAdsReport,
} from '@unisane/provider-google/marketing';
import {
  discoverMarketingMetaAccounts as discoverMarketingMetaAccountsWithProvider,
  pullMetaAdsReport,
} from '@unisane/provider-meta/marketing';

function createTempProject(configSource?: string): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'unisane-marketing-'));
  mkdirSync(path.join(cwd, 'config'), { recursive: true });
  if (configSource) {
    writeFileSync(path.join(cwd, 'config', 'marketing.mjs'), configSource, 'utf8');
  }
  return cwd;
}

function configSource(options: { gtmManifest?: string } = {}): string {
  return `export default {
  version: 1,
  platformId: 'true-resume',
  appId: 'true-resume',
  defaultEnvironment: 'production',
  environments: {
    production: {
      production: true,
      publicBaseUrl: 'https://true-resume.example.com'
    }
  },
  ${
    options.gtmManifest
      ? `paths: {
    gtmManifest: '${options.gtmManifest}'
  },`
      : ''
  }
  providers: {
    googleAds: {
      state: 'configured',
      accountIdEnv: 'GOOGLE_ADS_CUSTOMER_ID',
      loginCustomerIdEnv: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
      developerTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
      accessTokenEnv: 'GOOGLE_ADS_ACCESS_TOKEN'
    },
    metaAds: {
      state: 'planned',
      accountIdEnv: 'META_AD_ACCOUNT_ID',
      pixelIdEnv: 'META_PIXEL_ID',
      accessTokenEnv: 'META_ADS_ACCESS_TOKEN'
    }
  }
};`;
}

function configSourceWithAttributionStore(): string {
  return configSource().replace(
    '\n};',
    `,
  attributionStore: {
    state: 'configured',
    collectionName: 'true_resume_marketing_attribution',
    ttlDays: 90,
    setupCommand: 'pnpm marketing:attribution-store:setup'
  }
};`,
  );
}

function configSourceForRealAccountProof(): string {
  return `export default {
  version: 1,
  platformId: 'true-resume',
  appId: 'true-resume',
  defaultEnvironment: 'production',
  environments: {
    production: {
      production: true,
      publicBaseUrl: 'https://true-resume.example.com',
      gtmContainerId: 'GTM-TEST',
      ga4PropertyId: 'properties/123',
      googleAdsCustomerIdEnv: 'GOOGLE_ADS_CUSTOMER_ID',
      metaAdAccountIdEnv: 'META_AD_ACCOUNT_ID'
    }
  },
  paths: {
    gtmManifest: 'config/google-tag-manager.mjs'
  },
  providers: {
    googleAds: {
      state: 'configured',
      accountIdEnv: 'GOOGLE_ADS_CUSTOMER_ID',
      developerTokenEnv: 'GOOGLE_ADS_DEVELOPER_TOKEN',
      accessTokenEnv: 'GOOGLE_ADS_ACCESS_TOKEN'
    },
    metaAds: {
      state: 'configured',
      accountIdEnv: 'META_AD_ACCOUNT_ID',
      pixelIdEnv: 'META_PIXEL_ID',
      datasetIdEnv: 'META_DATASET_ID',
      accessTokenEnv: 'META_ADS_ACCESS_TOKEN'
    },
    ga4: {
      state: 'configured',
      accountIdEnv: 'GA4_PROPERTY_ID',
      accessTokenEnv: 'GOOGLE_ANALYTICS_ACCESS_TOKEN'
    },
    searchConsole: {
      state: 'configured',
      accountIdEnv: 'SEARCH_CONSOLE_SITE_URL',
      accessTokenEnv: 'SEARCH_CONSOLE_ACCESS_TOKEN'
    }
  }
};`;
}

function writeRegistryFiles(
  cwd: string,
  conversionSourceEventId = 'resume_import_completed',
  options: { includeProviderMappings?: boolean } = {},
): void {
  const includeProviderMappings = options.includeProviderMappings ?? true;
  mkdirSync(path.join(cwd, 'docs', 'marketing'), { recursive: true });
  writeFileSync(
    path.join(cwd, 'docs', 'marketing', 'events.json'),
    JSON.stringify(
      {
        version: 1,
        platformId: 'true-resume',
        events: [
          {
            id: 'resume_import_started',
            name: 'resume_import_started',
            owner: 'true-resume/import',
            source: 'browser',
            lifecycle: 'intent',
            requiredProperties: [{ name: 'sourceKind', type: 'string' }],
            optionalProperties: [],
            consent: { required: true, categories: ['analytics'] },
            attributionFields: ['gclid', 'fbclid'],
            eventIdRule: 'Use generated browser event id.',
            dedupeRule: 'One start event per import attempt.',
            mappings: {
              ga4: { eventName: 'resume_import_started', keyEvent: false },
              gtm: { dataLayerEvent: 'resume_import_started' },
            },
            reportingGoal: 'resume_import_intent',
          },
          {
            id: 'resume_import_completed',
            name: 'resume_import_completed',
            owner: 'true-resume/import',
            source: 'server',
            lifecycle: 'lead',
            requiredProperties: [{ name: 'importId', type: 'string' }],
            optionalProperties: [],
            consent: { required: true, categories: ['analytics', 'ads'] },
            attributionFields: ['gclid', 'fbclid'],
            eventIdRule: 'Use importId and completion attempt.',
            dedupeRule: 'Server event is canonical.',
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
            owner: 'true-resume/import',
            sourceEventId: conversionSourceEventId,
            lifecycle: 'lead',
            goal: 'lead',
            confirmationSource: 'server',
            eventIdRule: 'Use server event id.',
            dedupeRule: 'Server event is canonical.',
            mappings: {
              ga4: { eventName: 'resume_import_completed', keyEvent: true },
              ...(includeProviderMappings
                ? {
                    googleAds: {
                      conversionActionName: 'Resume import completed',
                      category: 'LEAD',
                      primary: true,
                    },
                    meta: {
                      pixelEventName: 'Lead',
                      capiEventName: 'Lead',
                    },
                  }
                : {}),
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
}

function writeGtmManifest(cwd: string, eventName = 'resume_import_started'): void {
  writeFileSync(
    path.join(cwd, 'config', 'google-tag-manager.mjs'),
    `export default {
  appId: 'true-resume',
  accountId: '123456',
  containerId: 'GTM-TEST',
  namespace: 'true_resume',
  environments: {
    production: {
      workspacePrefix: 'true-resume-production'
    }
  },
  triggers: [
    {
      slug: 'resume_import_started',
      type: 'data_layer_event',
      eventName: '${eventName}'
    },
    {
      slug: 'resume_import_completed',
      type: 'data_layer_event',
      eventName: 'resume_import_completed'
    }
  ],
  tags: [
    {
      slug: 'ga4_resume_import_started',
      type: 'ga4_event',
      triggerSlugs: ['resume_import_started'],
      parameters: [
        { key: 'eventName', value: 'resume_import_started' },
        { key: 'measurementId', value: { variable: 'ga4_measurement_id' } }
      ]
    },
    {
      slug: 'google_ads_resume_import_completed',
      type: 'google_ads_conversion',
      triggerSlugs: ['resume_import_completed'],
      parameters: [
        { key: 'conversionId', value: { secretRef: 'google_ads_conversion_id' } },
        { key: 'conversionLabel', value: { secretRef: 'google_ads_resume_import_completed_label' } }
      ]
    }
  ]
};`,
    'utf8',
  );
}

function writeProviderReportArtifact(cwd: string): string {
  const inputPath = path.join(cwd, 'google-ads-report.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider: 'googleAds',
        source: 'manual-export',
        pulledAt: '2026-05-20T00:00:00.000Z',
        window: {
          startDate: '2026-05-01',
          endDate: '2026-05-20',
        },
        records: [
          {
            id: 'campaign_1',
            name: 'True Resume Search',
            level: 'campaign',
            campaignId: 'campaign_1',
            creativeId: 'creative_1',
            audienceId: 'audience_1',
            audienceName: 'Resume builders',
            experimentId: 'experiment_1',
            utmSource: 'google',
            utmMedium: 'cpc',
            utmCampaign: 'true_resume_search',
            utmContent: 'headline_a',
            utmTerm: 'resume_builder',
            currency: 'USD',
            metrics: {
              impressions: 1000,
              clicks: 100,
              cost: 250,
              conversions: 10,
              conversionValue: 500,
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

function writeZeroConversionProviderReport(cwd: string): string {
  const inputPath = path.join(cwd, 'google-ads-zero-conversions.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider: 'googleAds',
        source: 'manual-export',
        pulledAt: '2026-05-20T00:00:00.000Z',
        window: {
          startDate: '2026-05-01',
          endDate: '2026-05-20',
        },
        records: [
          {
            id: 'campaign_1',
            name: 'True Resume Search',
            level: 'campaign',
            campaignId: 'campaign_1',
            currency: 'USD',
            metrics: {
              impressions: 1200,
              clicks: 140,
              cost: 650,
              conversions: 0,
              conversionValue: 0,
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

function writeGoogleAdsExport(cwd: string): string {
  const inputPath = path.join(cwd, 'google-ads-export.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        window: { startDate: '2026-05-01', endDate: '2026-05-20' },
        results: [
          {
            customer: { id: '1234567890' },
            campaign: { id: 'campaign_1', name: 'True Resume Search' },
            adGroup: { id: 'ad_group_1', name: 'Import Leads' },
            metrics: {
              impressions: '1000',
              clicks: '100',
              costMicros: '250000000',
              conversions: '10',
              conversionsValue: '500',
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

function writeMetaAdsExport(cwd: string): string {
  const inputPath = path.join(cwd, 'meta-ads-export.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        window: { startDate: '2026-05-01', endDate: '2026-05-20' },
        data: [
          {
            account_id: 'act_123',
            campaign_id: 'campaign_1',
            campaign_name: 'True Resume Prospecting',
            adset_id: 'adset_1',
            adset_name: 'Founders',
            impressions: '2000',
            clicks: '80',
            spend: '120.5',
            actions: [{ action_type: 'lead', value: '6' }],
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

function writeGa4Report(cwd: string): string {
  const inputPath = path.join(cwd, 'ga4-report.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        dateRanges: [{ startDate: '2026-05-01', endDate: '2026-05-20' }],
        propertyId: 'properties/123',
        dimensionHeaders: [{ name: 'eventName' }],
        metricHeaders: [{ name: 'sessions' }, { name: 'keyEvents' }, { name: 'totalRevenue' }],
        rows: [
          {
            dimensionValues: [{ value: 'resume_import_completed' }],
            metricValues: [{ value: '400' }, { value: '20' }, { value: '1000' }],
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

function writeSearchConsoleReport(cwd: string): string {
  const inputPath = path.join(cwd, 'search-console-report.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        window: { startDate: '2026-05-01', endDate: '2026-05-20' },
        siteUrl: 'https://true-resume.example.com',
        rows: [
          {
            keys: ['resume builder', '/templates'],
            clicks: 30,
            impressions: 900,
            ctr: 0.033333,
            position: 4.2,
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

function writeConfirmedConversions(cwd: string): string {
  const inputPath = path.join(cwd, 'confirmed-conversions.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        source: 'manual-export',
        pulledAt: '2026-05-20T00:00:00.000Z',
        window: { startDate: '2026-05-01', endDate: '2026-05-20' },
        records: Array.from({ length: 10 }, (_, index) => ({
          id: `confirmed_${index + 1}`,
          conversionId: 'resume_import_completed_lead',
          sourceEventId: 'resume_import_completed',
          eventId: `event_${index + 1}`,
          value: 50,
          revenue: 60,
          margin: 20,
          currency: 'USD',
        })),
      },
      null,
      2,
    ),
    'utf8',
  );
  return inputPath;
}

function writeStrategyMap(cwd: string): string {
  const inputPath = path.join(cwd, 'strategy-map.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        source: 'manual-export',
        pulledAt: '2026-05-20T00:00:00.000Z',
        objects: [
          {
            id: 'true-resume-search',
            kind: 'campaign',
            name: 'True Resume Search',
            owner: 'true-resume/growth',
            status: 'active',
            landingPageUrl: '/templates',
            campaignIds: ['campaign_1'],
            creativeIds: ['creative_1'],
            audienceIds: ['audience_1'],
            audienceNames: ['Resume builders'],
            experimentIds: ['experiment_1'],
            utmSources: ['google'],
            utmMediums: ['cpc'],
            utmCampaigns: ['true_resume_search'],
            utmContents: ['headline_a'],
            utmTerms: ['resume_builder'],
            keywords: ['resume builder'],
            queries: ['resume builder'],
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

function writeProofLimits(cwd: string): string {
  const inputPath = path.join(cwd, 'proof-limits.json');
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        providers: ['googleAds', 'metaAds', 'ga4', 'searchConsole'].map((provider) => ({
          provider,
          accountRefEnv:
            provider === 'googleAds'
              ? 'GOOGLE_ADS_CUSTOMER_ID'
              : provider === 'metaAds'
                ? 'META_AD_ACCOUNT_ID'
                : provider === 'ga4'
                  ? 'GA4_PROPERTY_ID'
                  : 'SEARCH_CONSOLE_SITE_URL',
          recordedAt: '2026-05-21T00:00:00.000Z',
          scopes: [`${provider}:read`],
          rateLimits: [`${provider}:narrow-date-window`],
          failureModes: [`${provider}:retry-later`],
          notes: [`${provider} proof uses env refs only.`],
        })),
      },
      null,
      2,
    ),
    'utf8',
  );
  return inputPath;
}

function writeNormalizedProofReport(
  cwd: string,
  provider: 'googleAds' | 'metaAds' | 'ga4' | 'searchConsole',
  reportType: string,
): string {
  const inputPath = path.join(cwd, `${provider}-${reportType}-proof.json`);
  const levelByReportType: Record<string, string> = {
    adSet: 'adSet',
    landingPage: 'page',
    sourceMedium: 'sourceMedium',
    queryPage: 'query',
    searchAppearance: 'searchAppearance',
  };
  writeFileSync(
    inputPath,
    JSON.stringify(
      {
        version: 1,
        provider,
        reportType,
        source: 'manual-export',
        pulledAt: '2026-05-21T00:00:00.000Z',
        window: { startDate: '2026-05-01', endDate: '2026-05-21' },
        records: [
          {
            id: `${provider}_${reportType}_1`,
            level: levelByReportType[reportType] ?? reportType,
            campaignId: 'campaign_1',
            campaignName: 'True Resume Search',
            keyword: 'resume builder',
            query: 'resume builder',
            pageUrl: '/templates',
            creativeId: 'creative_1',
            creativeName: 'True Resume Creative',
            metrics: { impressions: 100, clicks: 10, conversions: 1 },
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

function writeProofReportFamilies(
  cwd: string,
  config: Awaited<ReturnType<typeof loadMarketingConfig>>['config'],
): void {
  const families = {
    googleAds: ['campaign', 'keyword', 'conversion'],
    metaAds: ['campaign', 'adSet', 'ad', 'creative'],
    ga4: ['landingPage', 'channel', 'sourceMedium'],
    searchConsole: ['queryPage', 'page', 'query'],
  } as const;
  for (const [provider, reportTypes] of Object.entries(families)) {
    for (const reportType of reportTypes) {
      writeMarketingProviderReportPull(config, {
        cwd,
        provider,
        reportType,
        inputPath: writeNormalizedProofReport(
          cwd,
          provider as 'googleAds' | 'metaAds' | 'ga4' | 'searchConsole',
          reportType,
        ),
        inputFormat: 'normalized',
        now: new Date('2026-05-21T00:00:00.000Z'),
      });
    }
  }
}

describe('marketing control-plane config and doctor', () => {
  const tempProjects: string[] = [];

  afterEach(() => {
    for (const project of tempProjects.splice(0)) {
      rmSync(project, { recursive: true, force: true });
    }
  });

  it('loads and defaults a platform marketing config', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    const loaded = await loadMarketingConfig({ cwd });

    expect(loaded.config.appId).toBe('true-resume');
    expect(loaded.config.paths.gtmManifest).toBe('config/google-tag-manager.ts');
    expect(loaded.config.paths.eventRegistry).toBe('docs/marketing/events.json');
    expect(loaded.config.providers.searchConsole.state).toBe('planned');
  });

  it('validates canonical event and conversion registries', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);

    const loaded = await loadMarketingConfig({ cwd });
    const report = await validateMarketingRegistries(loaded.config, { cwd });

    expect(report.ok).toBe(true);
    expect(report.eventCount).toBe(2);
    expect(report.conversionCount).toBe(1);
  });

  it('fails registry validation when a conversion references a missing event', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd, 'missing_event');

    const loaded = await loadMarketingConfig({ cwd });
    const report = await validateMarketingRegistries(loaded.config, { cwd });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'conversions.resume_import_completed_lead.sourceEventId',
        status: 'error',
      }),
    );
  });

  it('fails tracking audit when source uses vendor globals directly', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'tracking.ts'),
      "window.dataLayer.push({ event: 'resume_import_completed' });",
      'utf8',
    );

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'vendorGlobal.dataLayer',
        status: 'error',
      }),
    );
  });

  it('warns when registry events are not emitted through source yet', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'tracking.ts'),
      "import { trackWebEvent } from '@unisane/web-runtime/tracking';\ntrackWebEvent({ name: 'other_event' });",
      'utf8',
    );

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(true);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'events.resume_import_started.usage',
        status: 'warn',
      }),
    );
  });

  it('passes GTM audit when manifest uses canonical registry events', async () => {
    const cwd = createTempProject(configSource({ gtmManifest: 'config/google-tag-manager.mjs' }));
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(path.join(cwd, 'src', 'tracking.ts'), '', 'utf8');

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(true);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'gtm.triggers.canonicalEvents',
        status: 'pass',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'gtm.tags.conversionTriggers',
        status: 'pass',
      }),
    );
  });

  it('fails GTM audit when manifest uses a non-canonical data-layer event', async () => {
    const cwd = createTempProject(configSource({ gtmManifest: 'config/google-tag-manager.mjs' }));
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd, 'unknown_marketing_event');
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(path.join(cwd, 'src', 'tracking.ts'), '', 'utf8');

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'gtm.triggers.resume_import_started.eventName',
        status: 'error',
      }),
    );
  });

  it('passes provider conversion mapping audit for configured mappings', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(path.join(cwd, 'src', 'tracking.ts'), '', 'utf8');

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(true);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.conversions.resume_import_completed_lead.mapping',
        status: 'pass',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.metaAds.conversions.resume_import_completed_lead.mapping',
        status: 'pass',
      }),
    );
  });

  it('allows duplicate Meta purchase mappings when conversions share one source event', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    const conversionRegistryPath = path.join(cwd, 'docs', 'marketing', 'conversions.json');
    const conversionRegistry = JSON.parse(readFileSync(conversionRegistryPath, 'utf8')) as {
      conversions: Array<Record<string, unknown>>;
    };
    conversionRegistry.conversions = [
      {
        id: 'subscription_started_purchase',
        name: 'Subscription started',
        owner: 'true-resume/billing',
        sourceEventId: 'subscription_started',
        lifecycle: 'purchase',
        goal: 'purchase',
        confirmationSource: 'server',
        eventIdRule: 'Use subscription_started event id.',
        transactionIdRule: 'Use checkout transaction id.',
        valueRule: 'Use net first-period value.',
        currencyRule: 'Use payment currency.',
        dedupeRule: 'Server event is canonical.',
        mappings: {
          meta: {
            pixelEventName: 'Purchase',
            capiEventName: 'Purchase',
          },
        },
        reportingGoal: 'purchase',
      },
      {
        id: 'purchase_with_values_purchase',
        name: 'Purchase With Values',
        owner: 'true-resume/billing',
        sourceEventId: 'subscription_started',
        lifecycle: 'purchase',
        goal: 'purchase',
        confirmationSource: 'server',
        eventIdRule: 'Use subscription_started event id.',
        transactionIdRule: 'Use checkout transaction id.',
        valueRule: 'Use net first-period value.',
        currencyRule: 'Use payment currency.',
        dedupeRule: 'Server event is canonical.',
        mappings: {
          meta: {
            pixelEventName: 'Purchase',
            capiEventName: 'Purchase',
          },
        },
        reportingGoal: 'purchase',
      },
    ];
    writeFileSync(conversionRegistryPath, JSON.stringify(conversionRegistry, null, 2), 'utf8');
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(path.join(cwd, 'src', 'tracking.ts'), '', 'utf8');

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.metaAds.pixelEventNames',
        status: 'pass',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.metaAds.capiEventNames',
        status: 'pass',
      }),
    );
  });

  it('fails provider conversion mapping audit for configured Google Ads without mappings', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd, 'resume_import_completed', { includeProviderMappings: false });
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(path.join(cwd, 'src', 'tracking.ts'), '', 'utf8');

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.conversions.resume_import_completed_lead.mapping',
        status: 'error',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.metaAds.conversions.resume_import_completed_lead.mapping',
        status: 'warn',
      }),
    );
  });

  it('detects missing value currency and transaction evidence for value conversions', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'conversion.ts'),
      "send({ name: 'resume_import_completed', eventId: 'evt_1' });",
      'utf8',
    );
    const eventRegistryPath = path.join(cwd, 'docs', 'marketing', 'events.json');
    const eventRegistry = JSON.parse(readFileSync(eventRegistryPath, 'utf8')) as {
      events: Array<{
        id: string;
        requiredProperties: Array<{ name: string; type: string }>;
        transactionIdRule?: string;
        valueRule?: string;
        currencyRule?: string;
      }>;
    };
    for (const event of eventRegistry.events) {
      if (event.id === 'resume_import_completed') {
        event.requiredProperties.push(
          { name: 'transactionId', type: 'string' },
          { name: 'value', type: 'number' },
          { name: 'currency', type: 'string' },
        );
        event.transactionIdRule = 'Use provider transaction id.';
        event.valueRule = 'Use net value.';
        event.currencyRule = 'Use ISO currency.';
      }
    }
    writeFileSync(eventRegistryPath, JSON.stringify(eventRegistry, null, 2), 'utf8');
    const conversionRegistryPath = path.join(cwd, 'docs', 'marketing', 'conversions.json');
    const conversionRegistry = JSON.parse(readFileSync(conversionRegistryPath, 'utf8')) as {
      conversions: Array<Record<string, unknown>>;
    };
    conversionRegistry.conversions = [
      {
        id: 'resume_import_completed_purchase',
        name: 'Resume import completed purchase test',
        owner: 'true-resume/import',
        sourceEventId: 'resume_import_completed',
        lifecycle: 'purchase',
        goal: 'purchase',
        confirmationSource: 'server',
        eventIdRule: 'Use import event id.',
        transactionIdRule: 'Use provider transaction id.',
        valueRule: 'Use net value.',
        currencyRule: 'Use ISO currency.',
        dedupeRule: 'Use transaction id.',
        mappings: {
          ga4: { eventName: 'purchase', keyEvent: true },
          googleAds: {
            conversionActionName: 'Resume import completed purchase test',
            category: 'PURCHASE',
            primary: true,
          },
        },
        reportingGoal: 'purchase',
      },
    ];
    writeFileSync(conversionRegistryPath, JSON.stringify(conversionRegistry, null, 2), 'utf8');

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'conversions.resume_import_completed_purchase.transactionId.source',
        status: 'error',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'conversions.resume_import_completed_purchase.value.source',
        status: 'error',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'conversions.resume_import_completed_purchase.currency.source',
        status: 'error',
      }),
    );
  });

  it('fails provider conversion audit when ads consent is missing on the source event', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    const eventRegistryPath = path.join(cwd, 'docs', 'marketing', 'events.json');
    const eventRegistry = JSON.parse(readFileSync(eventRegistryPath, 'utf8')) as {
      events: Array<{ id: string; consent?: { required: boolean; categories: string[] } }>;
    };
    for (const event of eventRegistry.events) {
      if (event.id === 'resume_import_completed') {
        event.consent = { required: true, categories: ['analytics'] };
      }
    }
    writeFileSync(eventRegistryPath, JSON.stringify(eventRegistry, null, 2), 'utf8');
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'conversion.ts'),
      "send({ name: 'resume_import_completed', eventId: 'evt_1' });",
      'utf8',
    );

    const loaded = await loadMarketingConfig({ cwd });
    const report = await auditMarketingTrackingSource(loaded.config, { cwd });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'conversions.resume_import_completed_lead.adsConsent',
        status: 'error',
      }),
    );
  });

  it('fails doctor when configured provider env vars are missing', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    const report = await runMarketingDoctor({
      cwd,
      env: {},
    });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.account',
        status: 'error',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.metaAds.pixel',
        status: 'warn',
      }),
    );
  });

  it('passes configured provider checks when env vars are present', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    const report = await runMarketingDoctor({
      cwd,
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
    });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.account',
        status: 'pass',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.developerToken',
        status: 'pass',
      }),
    );
  });

  it('treats saved Marketing Google auth as Google access-token readiness in doctor', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    const report = await runMarketingDoctor({
      cwd,
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'token',
      },
      googleAuth: {
        profile: 'true-resume',
        configured: true,
        scopes: ['https://www.googleapis.com/auth/adwords'],
        refreshTokenStored: true,
        clientSecretStored: true,
      },
    });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.accessToken',
        status: 'pass',
      }),
    );
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        id: 'googleAds',
        configured: true,
      }),
    );
  });

  it('treats saved Marketing Meta auth as Meta access-token readiness in doctor', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    const report = await runMarketingDoctor({
      cwd,
      env: {
        META_AD_ACCOUNT_ID: 'act_123',
        META_PIXEL_ID: 'pixel_123',
      },
      metaAuth: {
        ok: true,
        profile: 'true-resume',
        authHome: cwd,
        configured: true,
        scopes: ['ads_read'],
        secretStore: 'file',
        accessTokenStored: true,
      },
    });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.metaAds.accessToken',
        status: 'pass',
      }),
    );
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        id: 'metaAds',
        configured: true,
      }),
    );
  });

  it('shows a short marketing setup guide before raw provider work', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const missingAuthProfile = `missing-${path.basename(cwd)}`;
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await marketingSetupGuide({
        cwd,
        json: true,
        authProfile: missingAuthProfile,
        metaAuthProfile: missingAuthProfile,
      });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        nextActions: Array<{ id: string; command?: string }>;
      };

      expect(code).toBe(0);
      expect(output.nextActions[0]).toMatchObject({
        id: 'google.auth.login',
        command: `unisane growth marketing auth login --profile ${missingAuthProfile}`,
      });
      expect(output.nextActions.length).toBeLessThanOrEqual(3);
    } finally {
      logSpy.mockRestore();
    }
  });

  it('returns setup guide config failures as JSON', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await marketingSetupGuide({ cwd, json: true });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        ok: boolean;
        error: string;
      };

      expect(code).toBe(1);
      expect(output.ok).toBe(false);
      expect(output.error).toContain('[MARKETING_CONFIG_NOT_FOUND]');
    } finally {
      logSpy.mockRestore();
    }
  });

  it('points setup guide identifier work to shared provider inventories', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    const googleAuthHome = path.join(cwd, '.auth', 'google');
    const metaAuthHome = path.join(cwd, '.auth', 'meta');
    await saveMarketingGoogleAuthProfile({
      profile: 'true-resume',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      refreshToken: 'refresh-token',
      scopes: [
        MARKETING_GOOGLE_ADS_SCOPE,
        MARKETING_GOOGLE_ANALYTICS_SCOPE,
        MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
      ],
      secretStore: 'file',
      runtime: { authHome: googleAuthHome, store: 'file', allowPlaintextStore: true },
    });
    await saveMarketingMetaAuthProfile({
      profile: 'true-resume',
      accessToken: 'meta-token',
      scopes: ['ads_read'],
      secretStore: 'file',
      runtime: { authHome: metaAuthHome, store: 'file', allowPlaintextStore: true },
    });
    const env = {
      UNISANE_MARKETING_AUTH_HOME: googleAuthHome,
      UNISANE_MARKETING_AUTH_STORE: 'file',
      UNISANE_MARKETING_AUTH_ALLOW_PLAINTEXT_STORE: '1',
      UNISANE_MARKETING_META_AUTH_HOME: metaAuthHome,
      UNISANE_MARKETING_META_AUTH_STORE: 'file',
      UNISANE_MARKETING_META_AUTH_ALLOW_PLAINTEXT_STORE: '1',
      GOOGLE_ADS_CUSTOMER_ID: undefined,
      GOOGLE_ADS_DEVELOPER_TOKEN: undefined,
      META_AD_ACCOUNT_ID: undefined,
      META_PIXEL_ID: undefined,
      META_DATASET_ID: undefined,
      GA4_PROPERTY_ID: undefined,
      SEARCH_CONSOLE_SITE_URL: undefined,
    } satisfies Record<string, string | undefined>;
    const previousEnv = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      for (const [key, value] of Object.entries(env)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
      const code = await marketingSetupGuide({
        cwd,
        json: true,
        authProfile: 'true-resume',
        metaAuthProfile: 'true-resume',
      });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        nextActions: Array<{ id: string; command?: string }>;
      };

      expect(code).toBe(0);
      expect(output.nextActions).toContainEqual(
        expect.objectContaining({
          id: 'google.products.inventory',
          command: expect.stringContaining('--auth-namespace marketing'),
        }),
      );
      expect(output.nextActions).toContainEqual(
        expect.objectContaining({
          id: 'meta.ads.inventory',
          command: expect.stringContaining('unisane provider meta ads inventory'),
        }),
      );
    } finally {
      logSpy.mockRestore();
      for (const [key, value] of previousEnv) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it('reports setup lifecycle status before a deployed domain exists', async () => {
    const cwd = createTempProject(configSource({ gtmManifest: 'config/google-tag-manager.mjs' }));
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = buildMarketingSetupLifecycleStatus(loaded.config, {
      cwd,
      configPath: loaded.path,
      env: {},
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(report.ok).toBe(false);
    expect(report.currentStage).toBe('deployedDomain');
    expect(report.stages).toContainEqual(
      expect.objectContaining({
        id: 'local',
        status: 'pass',
      }),
    );
    expect(report.stages).toContainEqual(
      expect.objectContaining({
        id: 'deployedDomain',
        status: 'current',
      }),
    );
    expect(report.nextActions).toContainEqual(
      expect.objectContaining({
        id: 'deploy.domain',
      }),
    );
  });

  it('moves setup lifecycle to proof once auth and provider identifiers are ready', async () => {
    const cwd = createTempProject(
      configSourceForRealAccountProof().replace(
        'https://true-resume.example.com',
        'https://resume.unisane.dev',
      ),
    );
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = buildMarketingSetupLifecycleStatus(loaded.config, {
      cwd,
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
        META_AD_ACCOUNT_ID: 'act_123',
        META_PIXEL_ID: 'pixel_123',
        META_DATASET_ID: 'dataset_123',
        GA4_PROPERTY_ID: 'properties/123',
        SEARCH_CONSOLE_SITE_URL: 'https://resume.unisane.dev',
      },
      googleAuth: {
        profile: 'true-resume',
        configured: true,
        scopes: [
          MARKETING_GOOGLE_ADS_SCOPE,
          MARKETING_GOOGLE_ANALYTICS_SCOPE,
          MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
        ],
        refreshTokenStored: true,
        clientSecretStored: true,
      },
      metaAuth: {
        ok: true,
        profile: 'true-resume',
        authHome: cwd,
        configured: true,
        scopes: ['ads_read'],
        secretStore: 'file',
        accessTokenStored: true,
      },
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(report.currentStage).toBe('proofReady');
    expect(report.stages.find((stage) => stage.id === 'providerDiscovery')?.status).toBe('pass');
    expect(report.nextActions).toContainEqual(
      expect.objectContaining({
        id: 'proof.status',
      }),
    );
    expect(JSON.stringify(report)).not.toContain('developer-token');
  });

  it('uses the inferred Meta profile in setup lifecycle auth guidance', async () => {
    const cwd = createTempProject(
      configSourceForRealAccountProof().replace(
        'https://true-resume.example.com',
        'https://resume.unisane.dev',
      ),
    );
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = buildMarketingSetupLifecycleStatus(loaded.config, {
      cwd,
      env: {},
      googleAuth: {
        profile: 'true-resume',
        configured: false,
        scopes: [],
        refreshTokenStored: false,
        clientSecretStored: false,
      },
      metaAuth: {
        ok: false,
        profile: 'true-resume',
        authHome: cwd,
        configured: false,
        scopes: [],
        secretStore: 'file',
        accessTokenStored: false,
      },
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(report.currentStage).toBe('providerAuth');
    expect(report.nextActions).toContainEqual(
      expect.objectContaining({
        id: 'meta.auth',
        command: 'unisane growth marketing auth meta save --profile true-resume',
      }),
    );
  });

  it('points provider discovery lifecycle actions to shared provider inventories', async () => {
    const cwd = createTempProject(
      configSourceForRealAccountProof().replace(
        'https://true-resume.example.com',
        'https://resume.unisane.dev',
      ),
    );
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = buildMarketingSetupLifecycleStatus(loaded.config, {
      cwd,
      env: {},
      googleAuth: {
        profile: 'true-resume',
        configured: true,
        scopes: [
          MARKETING_GOOGLE_ADS_SCOPE,
          MARKETING_GOOGLE_ANALYTICS_SCOPE,
          MARKETING_GOOGLE_SEARCH_CONSOLE_SCOPE,
        ],
        refreshTokenStored: true,
        clientSecretStored: true,
      },
      metaAuth: {
        ok: true,
        profile: 'true-resume',
        authHome: cwd,
        configured: true,
        scopes: ['ads_read'],
        secretStore: 'file',
        accessTokenStored: true,
      },
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(report.currentStage).toBe('providerDiscovery');
    expect(report.nextActions).toContainEqual(
      expect.objectContaining({
        id: 'google.products.inventory',
        command: expect.stringContaining('unisane provider google products inventory'),
      }),
    );
    expect(report.nextActions).toContainEqual(
      expect.objectContaining({
        id: 'google.products.inventory',
        command: expect.stringContaining('--auth-namespace marketing'),
      }),
    );
    expect(report.nextActions).toContainEqual(
      expect.objectContaining({
        id: 'meta.ads.inventory',
        command: expect.stringContaining('unisane provider meta ads inventory'),
      }),
    );
  });

  it('prints setup lifecycle JSON from the setup status command', async () => {
    const cwd = createTempProject(configSource({ gtmManifest: 'config/google-tag-manager.mjs' }));
    tempProjects.push(cwd);
    const missingAuthProfile = `missing-${path.basename(cwd)}`;
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      const code = await marketingSetupStatus({
        cwd,
        json: true,
        authProfile: missingAuthProfile,
        metaAuthProfile: missingAuthProfile,
      });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        kind: string;
        currentStage: string;
        nextActions: Array<{ id: string }>;
        controlPlane: {
          authProfiles: Array<{ provider: string; status: string }>;
          envReport: { entries: Array<{ name: string; kind: string }> };
          providerSetupStatuses: Array<{ provider: string; ready: boolean }>;
        };
      };

      expect(code).toBe(0);
      expect(output.kind).toBe('unisane.marketing.setup-lifecycle-status');
      expect(output.currentStage).toBe('deployedDomain');
      expect(output.nextActions[0]).toMatchObject({ id: 'deploy.domain' });
      expect(output.controlPlane.authProfiles).toContainEqual(
        expect.objectContaining({ provider: 'google', status: 'missing' }),
      );
      expect(output.controlPlane.envReport.entries).toContainEqual(
        expect.objectContaining({ name: 'GOOGLE_MARKETING_ACCESS_TOKEN', kind: 'fallback-debug' }),
      );
      expect(output.controlPlane.providerSetupStatuses).toContainEqual(
        expect.objectContaining({ provider: 'google', ready: false }),
      );
      expect(output.controlPlane.providerSetupStatuses).toContainEqual(
        expect.objectContaining({ provider: 'meta', ready: false }),
      );
    } finally {
      logSpy.mockRestore();
    }
  });

  it('prints one pre-live readiness report without exposing env secret values', async () => {
    const cwd = createTempProject(configSource({ gtmManifest: 'config/google-tag-manager.mjs' }));
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    writeGtmManifest(cwd);
    const env = {
      GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token-secret',
    } satisfies Record<string, string>;
    const previousEnv = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    try {
      for (const [key, value] of Object.entries(env)) process.env[key] = value;
      const code = await marketingSetupPrelive({
        cwd,
        json: true,
        authProfile: 'true-resume',
      });
      const output = JSON.parse(logSpy.mock.calls.at(-1)?.[0] ?? '{}') as {
        kind: string;
        readyForLiveAccountUse: boolean;
        currentStage: string;
        summary: { blockerCount: number };
        nextActions: Array<{ id: string; command?: string }>;
        sections: Array<{ id: string; status: string; checks: Array<{ message: string }> }>;
      };
      const serialized = JSON.stringify(output);

      expect(code).toBe(1);
      expect(output.kind).toBe('unisane.marketing.prelive-readiness');
      expect(output.readyForLiveAccountUse).toBe(false);
      expect(output.currentStage).toBe('deployedDomain');
      expect(output.summary.blockerCount).toBeGreaterThan(0);
      expect(output.nextActions[0]).toMatchObject({ id: 'deploy.domain' });
      expect(output.sections).toContainEqual(
        expect.objectContaining({
          id: 'local',
          status: 'pass',
        }),
      );
      expect(serialized).not.toContain('developer-token-secret');
    } finally {
      logSpy.mockRestore();
      for (const [key, value] of previousEnv) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  });

  it('reports configured providers, artifact freshness, attribution store, and next step', async () => {
    const cwd = createTempProject(configSourceWithAttributionStore());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);

    const report = await runMarketingDoctor({
      cwd,
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
    });

    expect(report.providers).toContainEqual(
      expect.objectContaining({
        id: 'googleAds',
        configured: true,
      }),
    );
    expect(report.artifacts).toContainEqual(
      expect.objectContaining({
        id: 'eventRegistry',
        exists: true,
        ageDays: expect.any(Number),
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'attributionStore.config',
        status: 'pass',
      }),
    );
    expect(report.nextWorkflowStep).toContain('marketing:attribution-store:setup');
  });

  it('caches normalized provider report pulls under the local marketing cache', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inputPath = writeProviderReportArtifact(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const result = writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath,
    });

    expect(result.ok).toBe(true);
    expect(result.recordCount).toBe(1);
    expect(result.latestPath).toContain(
      path.join('.unisane', 'marketing', 'cache', 'provider-pulls', 'googleAds', 'latest.json'),
    );
    expect(readFileSync(result.latestPath, 'utf8')).toContain('"platformId": "true-resume"');
  });

  it('resolves report import input paths relative to the marketing app cwd', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const providerResult = writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: path.relative(cwd, writeProviderReportArtifact(cwd)),
    });
    const conversionResult = writeMarketingConfirmedConversionPull(loaded.config, {
      cwd,
      inputPath: path.relative(cwd, writeConfirmedConversions(cwd)),
    });
    const strategyResult = writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: path.relative(cwd, writeStrategyMap(cwd)),
    });

    expect(providerResult.ok).toBe(true);
    expect(conversionResult.ok).toBe(true);
    expect(strategyResult.ok).toBe(true);
  });

  it('reports provider pull freshness and metric totals', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inputPath = writeProviderReportArtifact(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath,
    });

    const report = readMarketingProviderReportStatus({
      cwd,
      provider: 'googleAds',
      now: new Date('2026-05-21T00:00:00.000Z'),
      maxAgeDays: 3,
    });

    expect(report.ok).toBe(true);
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        status: 'fresh',
        recordCount: 1,
        metrics: expect.objectContaining({
          clicks: 100,
          cost: 250,
          conversions: 10,
        }),
      }),
    );
  });

  it('marks missing and stale provider pulls clearly', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const inputPath = writeProviderReportArtifact(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath,
    });

    const staleReport = readMarketingProviderReportStatus({
      cwd,
      now: new Date('2026-06-01T00:00:00.000Z'),
      maxAgeDays: 3,
    });

    expect(staleReport.providers).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        status: 'stale',
      }),
    );
    expect(staleReport.providers).toContainEqual(
      expect.objectContaining({
        provider: 'metaAds',
        status: 'missing',
      }),
    );
  });

  it('builds marketing status with provider, conversion, strategy, and next-step guidance', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    const report = buildMarketingStatusReport({
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
      maxAgeDays: 3,
    });

    expect(report.ok).toBe(false);
    expect(report.providerFreshness).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        status: 'missing',
      }),
    );
    expect(report.confirmedConversions.status).toBe('missing');
    expect(report.strategyMap.status).toBe('missing');
    expect(report.nextWorkflowStep).toContain('Refresh googleAds/campaign pulls');
  });

  it('builds analytics status from GA4, Search Console, and confirmed conversion truth', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const ga4InputPath = writeGa4Report(cwd);
    for (const reportType of ['landingPage', 'channel', 'sourceMedium']) {
      writeMarketingProviderReportPull(loaded.config, {
        cwd,
        provider: 'ga4',
        reportType,
        inputPath: ga4InputPath,
        inputFormat: 'ga4',
      });
    }
    const searchConsoleInputPath = writeSearchConsoleReport(cwd);
    for (const reportType of ['queryPage', 'page', 'query']) {
      writeMarketingProviderReportPull(loaded.config, {
        cwd,
        provider: 'searchConsole',
        reportType,
        inputPath: searchConsoleInputPath,
        inputFormat: 'search-console',
      });
    }
    writeMarketingConfirmedConversionPull(loaded.config, {
      cwd,
      inputPath: writeConfirmedConversions(cwd),
    });

    const report = buildMarketingStatusReport({
      cwd,
      mode: 'analytics',
      now: new Date('2026-05-21T00:00:00.000Z'),
      maxAgeDays: 3,
    });

    expect(report.ok).toBe(true);
    expect(
      report.providerFreshness.map((provider) => `${provider.provider}/${provider.reportType}`),
    ).toEqual([
      'ga4/landingPage',
      'ga4/channel',
      'ga4/sourceMedium',
      'searchConsole/queryPage',
      'searchConsole/page',
      'searchConsole/query',
    ]);
    expect(report.confirmedConversions.status).toBe('fresh');
    expect(report.nextWorkflowStep).toContain('marketing report --unified');
  });

  it('reports real-account proof env blockers without printing secret values', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = buildMarketingRealAccountProofStatus(loaded.config, {
      cwd,
      configPath: loaded.path,
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
      },
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(report.ok).toBe(false);
    expect(report.readyForScheduledPulls).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.env.GOOGLE_ADS_CUSTOMER_ID',
        status: 'pass',
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.env.GOOGLE_ADS_DEVELOPER_TOKEN',
        status: 'error',
      }),
    );
    expect(JSON.stringify(report)).not.toContain('1234567890');
    expect(report.nextWorkflowStep).toContain('providers.googleAds.env.GOOGLE_ADS_DEVELOPER_TOKEN');
  });

  it('writes a real-account proof setup file without secrets', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const result = writeMarketingProofSetup(loaded.config, {
      cwd,
      out: 'docs/marketing/real-account-proof-limits.json',
    });
    const code = await marketingProofSetup({
      cwd,
      config: 'config/marketing.mjs',
      out: 'docs/marketing/real-account-proof-limits-command.json',
      json: true,
    });
    const artifact = JSON.parse(readFileSync(result.path, 'utf8')) as {
      providers: Array<{ provider: string; accountRefEnv?: string; scopes: string[] }>;
    };

    expect(code).toBe(0);
    expect(result.providerCount).toBe(4);
    expect(existsSync(path.join(cwd, 'docs', 'marketing', 'real-account-proof-limits.json'))).toBe(
      true,
    );
    expect(
      existsSync(path.join(cwd, 'docs', 'marketing', 'real-account-proof-limits-command.json')),
    ).toBe(true);
    expect(artifact.providers).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        accountRefEnv: 'GOOGLE_ADS_CUSTOMER_ID',
        scopes: [],
      }),
    );
    expect(result.nextCommands.map((command) => command.command)).toContain(
      'unisane growth marketing auth login --profile <name>',
    );
    expect(result.nextCommands.map((command) => command.command)).toContain(
      'unisane growth marketing doctor',
    );
    expect(JSON.stringify(artifact)).not.toContain('developer-token');
  });

  it('marks real-account proof ready after env refs and fresh read-only evidence exist', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    writeGtmManifest(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeProofReportFamilies(cwd, loaded.config);
    const limitsPath = writeProofLimits(cwd);
    writeMarketingConfirmedConversionPull(loaded.config, {
      cwd,
      inputPath: writeConfirmedConversions(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const env = {
      GOOGLE_ADS_CUSTOMER_ID: '1234567890',
      GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
      GOOGLE_ADS_ACCESS_TOKEN: 'google-token',
      META_AD_ACCOUNT_ID: 'act_123',
      META_ADS_ACCESS_TOKEN: 'meta-token',
      META_PIXEL_ID: 'pixel_123',
      META_DATASET_ID: 'dataset_123',
      GA4_PROPERTY_ID: 'properties/123',
      GOOGLE_ANALYTICS_ACCESS_TOKEN: 'ga4-token',
      SEARCH_CONSOLE_SITE_URL: 'https://true-resume.example.com',
      SEARCH_CONSOLE_ACCESS_TOKEN: 'search-console-token',
    };
    const report = buildMarketingRealAccountProofStatus(loaded.config, {
      cwd,
      env,
      limitsPath,
      now: new Date('2026-05-21T01:00:00.000Z'),
      maxAgeDays: 3,
    });
    const previousEnv = new Map(Object.keys(env).map((key) => [key, process.env[key]]));
    let code: number;
    try {
      for (const [key, value] of Object.entries(env)) process.env[key] = value;
      code = await marketingProofStatus({
        cwd,
        config: 'config/marketing.mjs',
        json: true,
        limits: limitsPath,
        out: '.unisane/marketing/proof/status.json',
        maxAgeDays: '3',
      });
    } finally {
      for (const [key, value] of previousEnv) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }

    expect(code).toBe(0);
    expect(report.ok).toBe(true);
    expect(report.readyForScheduledPulls).toBe(true);
    expect(existsSync(path.join(cwd, '.unisane', 'marketing', 'proof', 'status.json'))).toBe(true);
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        evidenceStatus: 'pass',
        reportFamilies: expect.arrayContaining([
          expect.objectContaining({ reportType: 'campaign', status: 'pass' }),
          expect.objectContaining({ reportType: 'keyword', status: 'pass' }),
          expect.objectContaining({ reportType: 'conversion', status: 'pass' }),
        ]),
      }),
    );
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.limits',
        status: 'pass',
      }),
    );
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'confirmedConversions',
        evidenceStatus: 'pass',
      }),
    );
    expect(report.nextWorkflowStep).toContain('scheduled read-only pulls can be considered');
    expect(JSON.stringify(report)).not.toContain('developer-token');
  });

  it('writes proof-gated scheduled reporting commands after real-account evidence is ready', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    writeGtmManifest(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    writeProofReportFamilies(cwd, loaded.config);
    const limitsPath = writeProofLimits(cwd);
    writeMarketingConfirmedConversionPull(loaded.config, {
      cwd,
      inputPath: writeConfirmedConversions(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    const env = {
      GOOGLE_ADS_CUSTOMER_ID: '1234567890',
      GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token',
      GOOGLE_ADS_ACCESS_TOKEN: 'google-token',
      META_AD_ACCOUNT_ID: 'act_123',
      META_ADS_ACCESS_TOKEN: 'meta-token',
      META_PIXEL_ID: 'pixel_123',
      META_DATASET_ID: 'dataset_123',
      GA4_PROPERTY_ID: 'properties/123',
      GOOGLE_ANALYTICS_ACCESS_TOKEN: 'ga4-token',
      SEARCH_CONSOLE_SITE_URL: 'https://true-resume.example.com',
      SEARCH_CONSOLE_ACCESS_TOKEN: 'search-console-token',
    };
    const plan = buildMarketingScheduledReportingPlan(loaded.config, {
      cwd,
      env,
      limitsPath,
      authProfile: 'true-resume-google',
      metaAuthProfile: 'true-resume-meta',
      now: new Date('2026-05-21T01:00:00.000Z'),
      maxAgeDays: 3,
      windowDays: 7,
    });
    const result = writeMarketingScheduledReportingPlan(loaded.config, {
      cwd,
      env,
      limitsPath,
      authProfile: 'true-resume-google',
      metaAuthProfile: 'true-resume-meta',
      out: '.unisane/marketing/production/schedules/reporting-plan.json',
      now: new Date('2026-05-21T01:00:00.000Z'),
      maxAgeDays: 3,
      windowDays: 7,
    });

    expect(plan.ok).toBe(true);
    expect(result.ok).toBe(true);
    expect(existsSync(result.path ?? '')).toBe(true);
    expect(plan.jobs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'googleAds.campaign.daily',
          status: 'ready',
          command: expect.stringContaining('--auth-profile true-resume-google'),
        }),
        expect.objectContaining({
          id: 'googleAds.auctionInsight.weekly',
          status: 'ready',
          cadence: 'weekly',
          windowDays: 7,
          command: expect.stringContaining('--report auctionInsight'),
        }),
        expect.objectContaining({
          id: 'metaAds.campaign.daily',
          status: 'ready',
          command: expect.stringContaining('--meta-auth-profile true-resume-meta'),
        }),
        expect.objectContaining({
          id: 'ga4.landingPage.daily',
          status: 'ready',
        }),
        expect.objectContaining({
          id: 'searchConsole.queryPage.daily',
          status: 'ready',
        }),
      ]),
    );
    expect(plan.jobs[0]?.command).toContain('unisane growth marketing pull-api');
    expect(plan.jobs[0]?.command).toContain('--start-date <YYYY-MM-DD-7d>');
    expect(JSON.stringify(plan)).not.toContain('developer-token');
  });

  it('treats saved Marketing Google auth as proof access-token readiness', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = buildMarketingRealAccountProofStatus(loaded.config, {
      cwd,
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'token',
      },
      googleAuth: {
        profile: 'true-resume',
        configured: true,
        scopes: ['https://www.googleapis.com/auth/adwords'],
        refreshTokenStored: true,
        clientSecretStored: true,
      },
    });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.googleAds.env.GOOGLE_ADS_ACCESS_TOKEN',
        status: 'pass',
        message: 'googleAds Marketing auth profile true-resume satisfies GOOGLE_ADS_ACCESS_TOKEN.',
      }),
    );
    expect(
      report.providers
        .find((provider) => provider.provider === 'googleAds')
        ?.proofCommands.some((command) => command.command.includes('--auth-profile true-resume')),
    ).toBe(true);
  });

  it('treats saved Marketing Meta auth as proof access-token readiness', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const report = buildMarketingRealAccountProofStatus(loaded.config, {
      cwd,
      env: {
        META_AD_ACCOUNT_ID: 'act_123',
        META_PIXEL_ID: 'pixel_123',
        META_DATASET_ID: 'dataset_123',
      },
      metaAuth: {
        ok: true,
        profile: 'true-resume',
        authHome: cwd,
        configured: true,
        scopes: ['ads_read'],
        secretStore: 'file',
        accessTokenStored: true,
      },
    });

    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'providers.metaAds.env.META_ADS_ACCESS_TOKEN',
        status: 'pass',
        message: 'metaAds Marketing auth profile true-resume satisfies META_ADS_ACCESS_TOKEN.',
      }),
    );
    expect(
      report.providers
        .find((provider) => provider.provider === 'metaAds')
        ?.proofCommands.some((command) =>
          command.command.includes('--meta-auth-profile true-resume'),
        ),
    ).toBe(true);
  });

  it('discovers Google Ads, GA4, and Search Console account refs from Google APIs', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('customers:listAccessibleCustomers')) {
        return new Response(JSON.stringify({ resourceNames: ['customers/1234567890'] }), {
          status: 200,
        });
      }
      if (url.includes('analyticsadmin.googleapis.com')) {
        return new Response(
          JSON.stringify({
            accountSummaries: [
              {
                account: 'accounts/1',
                displayName: 'Resume Account',
                propertySummaries: [
                  {
                    property: 'properties/123',
                    displayName: 'True Resume',
                  },
                ],
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes('webmasters/v3/sites')) {
        return new Response(
          JSON.stringify({
            siteEntry: [
              {
                siteUrl: 'https://true-resume.example.com/',
                permissionLevel: 'siteOwner',
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ error: 'unexpected url' }), { status: 404 });
    });

    const report = await discoverMarketingGoogleAccounts(loaded.config, {
      accessToken: 'access-token',
      env: { GOOGLE_ADS_DEVELOPER_TOKEN: 'developer-token' },
      fetch: fetcher,
      now: new Date('2026-05-22T00:00:00.000Z'),
      driver: discoverMarketingGoogleAccountsWithProvider,
    });

    expect(report.ok).toBe(true);
    expect(report.googleAds.customerIds).toEqual(['1234567890']);
    expect(report.ga4.properties).toContainEqual(
      expect.objectContaining({
        property: 'properties/123',
        propertyId: '123',
        displayName: 'True Resume',
      }),
    );
    expect(report.searchConsole.sites).toContainEqual(
      expect.objectContaining({
        siteUrl: 'https://true-resume.example.com/',
        permissionLevel: 'siteOwner',
      }),
    );
    expect(report.nextActions.map((action) => action.message)).toEqual(
      expect.arrayContaining([
        'Set GOOGLE_ADS_CUSTOMER_ID to 1234567890.',
        'Set GA4_PROPERTY_ID to 123.',
        'Set SEARCH_CONSOLE_SITE_URL to https://true-resume.example.com/.',
      ]),
    );
    expect(JSON.stringify(report)).not.toContain('developer-token');
  });

  it('warns instead of calling Google Ads discovery without a developer token', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('analyticsadmin.googleapis.com')) {
        return new Response(JSON.stringify({ accountSummaries: [] }), { status: 200 });
      }
      if (url.includes('webmasters/v3/sites')) {
        return new Response(JSON.stringify({ siteEntry: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: 'unexpected url' }), { status: 500 });
    });

    const report = await discoverMarketingGoogleAccounts(loaded.config, {
      accessToken: 'access-token',
      env: {},
      fetch: fetcher,
      now: new Date('2026-05-22T00:00:00.000Z'),
      driver: discoverMarketingGoogleAccountsWithProvider,
    });

    expect(report.ok).toBe(true);
    expect(report.googleAds.status).toBe('warn');
    expect(report.googleAds.message).toContain('GOOGLE_ADS_DEVELOPER_TOKEN');
    expect(fetcher).not.toHaveBeenCalledWith(
      expect.stringContaining('customers:listAccessibleCustomers'),
      expect.anything(),
    );
  });

  it('normalizes Google Ads exports into provider pull artifacts', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    const result = writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeGoogleAdsExport(cwd),
      inputFormat: 'google-ads',
      source: 'manual-export',
    });

    const report = readMarketingProviderReportStatus({ cwd, provider: 'googleAds' });
    expect(result.recordCount).toBe(1);
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        metrics: expect.objectContaining({
          clicks: 100,
          cost: 250,
          conversions: 10,
        }),
      }),
    );
  });

  it('normalizes Meta Ads insights exports into provider pull artifacts', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'metaAds',
      inputPath: writeMetaAdsExport(cwd),
      inputFormat: 'meta-ads',
    });

    const report = readMarketingProviderReportStatus({ cwd, provider: 'metaAds' });
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'metaAds',
        metrics: expect.objectContaining({
          clicks: 80,
          cost: 120.5,
          conversions: 6,
        }),
      }),
    );
  });

  it('normalizes GA4 runReport output into provider pull artifacts', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'ga4',
      inputPath: writeGa4Report(cwd),
      inputFormat: 'ga4',
    });

    const report = readMarketingProviderReportStatus({ cwd, provider: 'ga4' });
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'ga4',
        metrics: expect.objectContaining({
          sessions: 400,
          keyEvents: 20,
          revenue: 1000,
        }),
      }),
    );
  });

  it('normalizes Search Console search analytics output into provider pull artifacts', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'searchConsole',
      inputPath: writeSearchConsoleReport(cwd),
      inputFormat: 'search-console',
    });

    const report = readMarketingProviderReportStatus({ cwd, provider: 'searchConsole' });
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'searchConsole',
        metrics: expect.objectContaining({
          clicks: 30,
          impressions: 900,
        }),
      }),
    );
    expect(
      JSON.parse(
        readFileSync(
          path.join(
            cwd,
            '.unisane',
            'marketing',
            'cache',
            'provider-pulls',
            'searchConsole',
            'latest.json',
          ),
          'utf8',
        ),
      ),
    ).toEqual(
      expect.objectContaining({
        records: expect.arrayContaining([
          expect.objectContaining({
            query: 'resume builder',
            ctr: 0.033333,
            position: 4.2,
          }),
        ]),
      }),
    );
  });

  it('pulls Google Ads API reports through the read-only API path', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                customer: { id: '1234567890' },
                campaign: { id: 'campaign_1', name: 'True Resume Search' },
                metrics: {
                  impressions: '1000',
                  clicks: '100',
                  costMicros: '250000000',
                  conversions: '10',
                },
              },
            ],
          },
        ]),
        { status: 200 },
      );
    };

    const result = await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      driver: pullGoogleAdsReport,
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_LOGIN_CUSTOMER_ID: '999-888-7777',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    expect(result.ok).toBe(true);
    expect(calls[0]?.url).toContain('/v22/customers/1234567890/googleAds:searchStream');
    expect(calls[0]?.init?.headers).toEqual(
      expect.objectContaining({
        authorization: 'Bearer access-token',
        'developer-token': 'dev-token',
        'login-customer-id': '9998887777',
      }),
    );
    const report = readMarketingProviderReportStatus({ cwd, provider: 'googleAds' });
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        metrics: expect.objectContaining({
          clicks: 100,
          cost: 250,
          conversions: 10,
        }),
      }),
    );
  });

  it('pulls explicit Google Ads report families into isolated cache paths', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                campaign: { id: 'campaign_1', name: 'True Resume Search' },
                adGroup: { id: 'ad_group_1', name: 'Import Leads' },
                metrics: {
                  impressions: '1000',
                  clicks: '100',
                  costMicros: '250000000',
                },
              },
            ],
          },
        ]),
        { status: 200 },
      );
    };

    const result = await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      driver: pullGoogleAdsReport,
      reportType: 'adGroup',
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_LOGIN_CUSTOMER_ID: '999-888-7777',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    const body = JSON.parse(String(calls[0]?.init?.body)) as { query: string };
    expect(body.query).toContain('FROM ad_group');
    expect(calls[0]?.init?.headers).toEqual(
      expect.objectContaining({
        'login-customer-id': '9998887777',
      }),
    );
    expect(result.reportType).toBe('adGroup');
    expect(result.latestPath).toContain(
      path.join(
        '.unisane',
        'marketing',
        'cache',
        'provider-pulls',
        'googleAds',
        'adGroup',
        'latest.json',
      ),
    );
    const report = readMarketingProviderReportStatus({
      cwd,
      provider: 'googleAds',
      reportType: 'adGroup',
    });
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        provider: 'googleAds',
        reportType: 'adGroup',
        recordCount: 1,
      }),
    );
  });

  it('normalizes Google Ads device breakdown reports for segment optimization', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                campaign: { id: 'campaign_1', name: 'True Resume Search' },
                segments: { device: 'MOBILE' },
                metrics: { impressions: '1000', clicks: '100', costMicros: '250000000' },
              },
            ],
          },
        ]),
        { status: 200 },
      );
    };

    const result = await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      driver: pullGoogleAdsReport,
      reportType: 'device',
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    const body = JSON.parse(String(calls[0]?.init?.body)) as { query: string };
    expect(body.query).toContain('segments.device');
    expect(result.reportType).toBe('device');
    const artifact = JSON.parse(readFileSync(result.latestPath, 'utf8')) as {
      records: Array<Record<string, unknown>>;
    };
    expect(artifact.records).toContainEqual(
      expect.objectContaining({
        id: 'campaign_1:MOBILE',
        level: 'device',
        campaignId: 'campaign_1',
        device: 'MOBILE',
      }),
    );
  });

  it('pulls Google Ads conversion action inventory without unsupported metric segments', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                conversionAction: {
                  resourceName: 'customers/1234567890/conversionActions/111222333',
                  name: 'Resume import completed',
                  category: 'SUBMIT_LEAD_FORM',
                  status: 'ENABLED',
                  primaryForGoal: true,
                },
              },
            ],
          },
        ]),
        { status: 200 },
      );
    };

    const result = await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      driver: pullGoogleAdsReport,
      reportType: 'conversion',
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    const body = JSON.parse(String(calls[0]?.init?.body)) as { query: string };
    expect(body.query).toContain('FROM conversion_action');
    expect(body.query).not.toContain('segments.conversion_action');
    expect(body.query).not.toContain('metrics.');
    expect(result.reportType).toBe('conversion');
    const artifact = JSON.parse(readFileSync(result.latestPath, 'utf8')) as {
      records: Array<Record<string, unknown>>;
    };
    expect(artifact.records).toContainEqual(
      expect.objectContaining({
        id: 'customers/1234567890/conversionActions/111222333',
        name: 'Resume import completed',
        level: 'conversion',
      }),
    );
  });

  it('normalizes Google Ads search-term reports for negative-keyword review', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    const fetcher: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response(
        JSON.stringify([
          {
            results: [
              {
                campaign: { id: 'campaign_1', name: 'True Resume Search' },
                adGroup: { id: 'ad_group_1', name: 'Templates' },
                searchTermView: { searchTerm: 'free resume download' },
                metrics: { impressions: '500', clicks: '40', costMicros: '80000000' },
              },
            ],
          },
        ]),
        { status: 200 },
      );
    };

    const result = await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      driver: pullGoogleAdsReport,
      reportType: 'query',
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        GOOGLE_ADS_CUSTOMER_ID: '1234567890',
        GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
        GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    const body = JSON.parse(String(calls[0]?.init?.body)) as { query: string };
    expect(body.query).toContain('FROM search_term_view');
    expect(result.reportType).toBe('query');
    const artifact = JSON.parse(readFileSync(result.latestPath, 'utf8')) as {
      records: Array<Record<string, unknown>>;
    };
    expect(artifact.records).toContainEqual(
      expect.objectContaining({
        id: 'ad_group_1:free resume download',
        level: 'query',
        campaignId: 'campaign_1',
        adGroupId: 'ad_group_1',
        query: 'free resume download',
      }),
    );
  });

  it('fails read-only API pulls when required provider tokens are missing', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });

    await expect(
      writeMarketingProviderApiReportPull(loaded.config, {
        cwd,
        provider: 'googleAds',
        driver: pullGoogleAdsReport,
        startDate: '2026-05-01',
        endDate: '2026-05-20',
        env: {
          GOOGLE_ADS_CUSTOMER_ID: '1234567890',
          GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
        },
        fetch: async () => new Response('{}', { status: 200 }),
      }),
    ).rejects.toThrow(/GOOGLE_ADS_ACCESS_TOKEN/);
  });

  it('rejects invalid read-only API pull date windows before provider requests', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    let called = false;

    await expect(
      writeMarketingProviderApiReportPull(loaded.config, {
        cwd,
        provider: 'googleAds',
        driver: pullGoogleAdsReport,
        startDate: 'not-a-date',
        endDate: '2026-05-20',
        env: {
          GOOGLE_ADS_CUSTOMER_ID: '1234567890',
          GOOGLE_ADS_DEVELOPER_TOKEN: 'dev-token',
          GOOGLE_ADS_ACCESS_TOKEN: 'access-token',
        },
        fetch: async () => {
          called = true;
          return new Response('{}', { status: 200 });
        },
      }),
    ).rejects.toThrow();
    expect(called).toBe(false);
  });

  it('paginates Meta Ads API reports into one cached artifact', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const urlText = String(url);
      calls.push(urlText);
      const body =
        calls.length === 1
          ? {
              data: [
                {
                  account_id: 'act_123',
                  campaign_id: 'campaign_1',
                  campaign_name: 'True Resume Prospecting',
                  clicks: '10',
                  spend: '20',
                },
              ],
              paging: { next: 'https://graph.facebook.com/v25.0/next-page' },
            }
          : {
              data: [
                {
                  account_id: 'act_123',
                  campaign_id: 'campaign_2',
                  campaign_name: 'True Resume Remarketing',
                  clicks: '15',
                  spend: '30',
                },
              ],
            };
      return new Response(JSON.stringify(body), { status: 200 });
    };

    await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'metaAds',
      driver: pullMetaAdsReport,
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        META_AD_ACCOUNT_ID: 'act_123',
        META_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    const report = readMarketingProviderReportStatus({ cwd, provider: 'metaAds' });
    expect(calls).toHaveLength(2);
    expect(report.providers).toContainEqual(
      expect.objectContaining({
        recordCount: 2,
        metrics: expect.objectContaining({
          clicks: 25,
          cost: 50,
        }),
      }),
    );
  });

  it('normalizes Meta Ads device breakdown reports for segment optimization', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const urlText = String(url);
      calls.push(urlText);
      return new Response(
        JSON.stringify({
          data: [
            {
              account_id: 'act_123',
              campaign_id: 'campaign_1',
              campaign_name: 'True Resume Prospecting',
              impression_device: 'mobile_app',
              clicks: '10',
              spend: '20',
            },
          ],
        }),
        { status: 200 },
      );
    };

    const result = await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'metaAds',
      driver: pullMetaAdsReport,
      reportType: 'device',
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        META_AD_ACCOUNT_ID: 'act_123',
        META_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    expect(calls[0]).toContain('breakdowns=impression_device');
    expect(result.reportType).toBe('device');
    const artifact = JSON.parse(readFileSync(result.latestPath, 'utf8')) as {
      records: Array<Record<string, unknown>>;
    };
    expect(artifact.records).toContainEqual(
      expect.objectContaining({
        id: 'campaign_1:mobile_app',
        level: 'device',
        campaignId: 'campaign_1',
        device: 'mobile_app',
      }),
    );
  });

  it('pulls Meta creative inventory through the ad creatives edge', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: string[] = [];
    const fetcher: typeof fetch = async (url) => {
      const urlText = String(url);
      calls.push(urlText);
      return new Response(
        JSON.stringify({
          data: [
            {
              id: 'creative_1',
              name: 'Import CTA Creative',
              account_id: 'act_123',
              status: 'ACTIVE',
              object_type: 'SHARE',
              title: 'Build a better resume',
              body: 'Import your existing resume and improve it.',
              thumbnail_url: 'https://example.com/thumb.jpg',
              object_story_spec: {
                link_data: {
                  link: 'https://true-resume.example.com/templates',
                  call_to_action: { type: 'SIGN_UP' },
                },
              },
              url_tags: 'utm_source=meta&utm_medium=paid_social&utm_campaign=true_resume',
            },
          ],
        }),
        { status: 200 },
      );
    };

    const result = await writeMarketingProviderApiReportPull(loaded.config, {
      cwd,
      provider: 'metaAds',
      driver: pullMetaAdsReport,
      reportType: 'creative',
      startDate: '2026-05-01',
      endDate: '2026-05-20',
      env: {
        META_AD_ACCOUNT_ID: 'act_123',
        META_ADS_ACCESS_TOKEN: 'access-token',
      },
      fetch: fetcher,
      now: new Date('2026-05-20T00:00:00.000Z'),
    });

    expect(calls[0]).toContain('/v25.0/act_123/adcreatives');
    expect(calls[0]).toContain('object_story_spec');
    expect(result.reportType).toBe('creative');
    expect(result.latestPath).toContain(
      path.join(
        '.unisane',
        'marketing',
        'cache',
        'provider-pulls',
        'metaAds',
        'creative',
        'latest.json',
      ),
    );
    const artifact = JSON.parse(readFileSync(result.latestPath, 'utf8')) as {
      records: Array<Record<string, unknown>>;
    };
    expect(artifact.records).toContainEqual(
      expect.objectContaining({
        id: 'creative_1',
        level: 'creative',
        creativeId: 'creative_1',
        creativeName: 'Import CTA Creative',
        creativeStatus: 'ACTIVE',
        creativeAssetType: 'SHARE',
        creativeHeadline: 'Build a better resume',
        creativeBody: 'Import your existing resume and improve it.',
        creativeThumbnailUrl: 'https://example.com/thumb.jpg',
        creativeDestinationUrl: 'https://true-resume.example.com/templates',
        creativeUrlTags: 'utm_source=meta&utm_medium=paid_social&utm_campaign=true_resume',
      }),
    );
  });

  it('discovers Meta ad accounts and pixels from Graph API responses', async () => {
    const cwd = createTempProject(configSourceForRealAccountProof());
    tempProjects.push(cwd);
    const loaded = await loadMarketingConfig({ cwd });
    const calls: string[] = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('/me/adaccounts')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'act_123',
                account_id: '123',
                name: 'True Resume',
                account_status: '1',
                currency: 'USD',
                timezone_name: 'America/New_York',
                business: { id: 'business_1', name: 'True Resume Business' },
              },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes('/act_123/adspixels')) {
        return new Response(
          JSON.stringify({
            data: [
              {
                id: 'pixel_123',
                name: 'True Resume Pixel',
                account_id: 'act_123',
              },
            ],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ error: 'unexpected url' }), { status: 404 });
    });

    const report = await discoverMarketingMetaAccounts(loaded.config, {
      driver: discoverMarketingMetaAccountsWithProvider,
      accessToken: 'access-token',
      fetch: fetcher,
      now: new Date('2026-05-22T00:00:00.000Z'),
    });

    expect(report.ok).toBe(true);
    expect(calls[0]).toContain('/v25.0/me/adaccounts');
    expect(calls[1]).toContain('/v25.0/act_123/adspixels');
    expect(report.adAccounts.accounts).toContainEqual(
      expect.objectContaining({
        id: 'act_123',
        accountId: 'act_123',
        displayName: 'True Resume',
        businessName: 'True Resume Business',
      }),
    );
    expect(report.pixels.pixels).toContainEqual(
      expect.objectContaining({
        id: 'pixel_123',
        name: 'True Resume Pixel',
        accountId: 'act_123',
      }),
    );
    expect(report.nextActions.map((action) => action.message)).toEqual(
      expect.arrayContaining([
        'Set META_AD_ACCOUNT_ID to act_123.',
        'Set META_PIXEL_ID to pixel_123.',
        'Confirm the Events Manager dataset id for CAPI and set META_DATASET_ID if used; do not assume it without review.',
      ]),
    );
    expect(JSON.stringify(report)).not.toContain('access-token');
  });

  it('builds a unified report that separates provider conversions from Unisane truth', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'marketing.ts'),
      [
        "import '@unisane/web-runtime/tracking';",
        "import '@unisane/web-runtime/conversions';",
        "emit('resume_import_started');",
        "emit('resume_import_completed');",
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportArtifact(cwd),
    });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'ga4',
      inputPath: writeGa4Report(cwd),
      inputFormat: 'ga4',
    });

    const report = await buildUnifiedMarketingReport(loaded.config, {
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(report.sections.ads.metrics).toEqual(
      expect.objectContaining({
        clicks: 100,
        cost: 250,
        conversions: 10,
      }),
    );
    expect(report.sections.ads.derived).toEqual(
      expect.objectContaining({
        ctr: 10,
        cpc: 2.5,
        cpm: 250,
        cpa: 25,
        roas: 2,
      }),
    );
    expect(report.sections.analytics.metrics).toEqual(
      expect.objectContaining({
        sessions: 400,
        keyEvents: 20,
      }),
    );
    expect(report.sections.conversionTruth.providerReported).toEqual(
      expect.objectContaining({
        conversions: 10,
        conversionValue: 500,
        sources: ['googleAds'],
      }),
    );
    expect(report.sections.conversionTruth.unisaneConfirmed).toEqual(
      expect.objectContaining({
        status: 'missing',
        configuredServerConversionCount: 1,
      }),
    );
    expect(report.sections.trackingGaps.length).toBeGreaterThan(0);
    expect(report.nextWorkflowStep).toContain('Fix marketing tracking errors');
  });

  it('reconciles provider conversions against Unisane-confirmed conversion truth', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'marketing.ts'),
      [
        "import '@unisane/web-runtime/tracking';",
        "import '@unisane/web-runtime/conversions';",
        "emit('resume_import_started');",
        "emit('resume_import_completed');",
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportArtifact(cwd),
    });
    const conversionPull = writeMarketingConfirmedConversionPull(loaded.config, {
      cwd,
      inputPath: writeConfirmedConversions(cwd),
    });

    const report = await buildUnifiedMarketingReport(loaded.config, {
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(conversionPull.recordCount).toBe(10);
    expect(report.sections.conversionTruth.unisaneConfirmed).toEqual(
      expect.objectContaining({
        status: 'available',
        conversions: 10,
        conversionValue: 500,
        revenue: 600,
        margin: 200,
      }),
    );
    expect(report.sections.conversionTruth.reconciliation).toEqual(
      expect.objectContaining({
        status: 'ready',
        conversionDelta: 0,
        conversionValueDelta: 0,
      }),
    );
  });

  it('joins unified report metrics by cached marketing strategy objects', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'marketing.ts'),
      [
        "import '@unisane/web-runtime/tracking';",
        "import '@unisane/web-runtime/conversions';",
        "emit('resume_import_started');",
        "emit('resume_import_completed');",
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeProviderReportArtifact(cwd),
    });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'searchConsole',
      inputPath: writeSearchConsoleReport(cwd),
      inputFormat: 'search-console',
    });
    writeMarketingConfirmedConversionPull(loaded.config, {
      cwd,
      inputPath: writeConfirmedConversions(cwd),
    });
    const strategyPull = writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
    });

    const report = await buildUnifiedMarketingReport(loaded.config, {
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
    });

    expect(strategyPull.objectCount).toBe(1);
    expect(report.sections.strategyObjects.status).toBe('available');
    expect(report.sections.strategyObjects.objects).toContainEqual(
      expect.objectContaining({
        object: expect.objectContaining({ id: 'true-resume-search' }),
        metrics: expect.objectContaining({
          ads: expect.objectContaining({
            clicks: 100,
            conversions: 10,
            conversionValue: 500,
          }),
          seo: expect.objectContaining({
            clicks: 30,
            impressions: 900,
          }),
          confirmed: expect.objectContaining({
            conversions: 10,
            conversionValue: 500,
            revenue: 600,
            margin: 200,
          }),
        }),
        reconciliation: expect.objectContaining({
          status: 'ready',
          conversionDelta: 0,
          conversionValueDelta: 0,
        }),
        dimensions: expect.objectContaining({
          creativeIds: ['creative_1'],
          audienceIds: ['audience_1'],
          audienceNames: ['Resume builders'],
          utmSources: ['google'],
          utmMediums: ['cpc'],
          utmCampaigns: ['true_resume_search'],
          utmContents: ['headline_a'],
          utmTerms: ['resume_builder'],
          experimentIds: ['experiment_1'],
        }),
      }),
    );
  });

  it('generates marketing alerts, recommendations, and experiment records from unified truth', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'marketing.ts'),
      [
        "import '@unisane/web-runtime/tracking';",
        "import '@unisane/web-runtime/conversions';",
        "emit('resume_import_started');",
        "emit('resume_import_completed');",
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeZeroConversionProviderReport(cwd),
    });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
    });

    const artifact = await buildMarketingRecommendations(loaded.config, {
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
      targetCpa: 100,
      spendSpikeAmount: 500,
    });

    expect(artifact.nonMutating).toBe(true);
    expect(artifact.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'spend_spike',
          severity: 'high',
          window: expect.stringContaining('2026-05-01..2026-05-20'),
        }),
        expect.objectContaining({
          type: 'zero_conversion',
          severity: 'critical',
          window: expect.stringContaining('2026-05-01..2026-05-20'),
        }),
      ]),
    );
    expect(artifact.recommendations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: 'fix_tracking',
          approvalTier: 'none',
          confidence: 'high',
          risk: 'critical',
          dataWindow: 'audit:2026-05-21T00:00:00.000Z',
        }),
        expect.objectContaining({
          action: 'pause_or_reduce_spend',
          approvalTier: 'standard',
          confidence: 'medium',
          risk: 'critical',
          dataWindow: expect.stringContaining('2026-05-01..2026-05-20'),
          requiresReceipt: true,
        }),
      ]),
    );
    expect(artifact.decisionPolicy).toEqual(
      expect.objectContaining({
        acceptedRecommendationRequiresReceipt: true,
        rejectedRecommendationAllowsReason: true,
        trackingFixOutranksScaling: true,
      }),
    );
    expect(artifact.experiments).toContainEqual(
      expect.objectContaining({
        id: 'exp-true-resume-search-cpa',
        owner: 'true-resume/growth',
        channel: 'googleAds',
        strategyObjectId: 'true-resume-search',
        campaignIds: ['campaign_1'],
        creativeIds: ['creative_1'],
        audienceIds: ['audience_1'],
        landingPageUrl: '/templates',
        baseline: expect.objectContaining({
          metric: 'cost_with_zero_conversions',
          value: 650,
        }),
        minimumSignalRule: expect.stringContaining('14 days'),
        result: 'pending',
        decision: 'pending',
      }),
    );
    expect(artifact.nextWorkflowStep).toContain('Fix tracking alerts first');
  });

  it('writes recommendation decision receipts with approval policy', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'marketing.ts'),
      [
        "import '@unisane/web-runtime/tracking';",
        "import '@unisane/web-runtime/conversions';",
        "emit('resume_import_started');",
        "emit('resume_import_completed');",
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeZeroConversionProviderReport(cwd),
    });
    const recommendationArtifact = await buildMarketingRecommendations(loaded.config, {
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
      targetCpa: 100,
      spendSpikeAmount: 500,
    });
    const recommendationPath = path.join(cwd, 'recommendations.json');
    writeFileSync(
      recommendationPath,
      `${JSON.stringify(recommendationArtifact, null, 2)}\n`,
      'utf8',
    );

    expect(() =>
      writeMarketingRecommendationDecisionReceipt({
        cwd,
        inputPath: recommendationPath,
        recommendationId: 'rec-hold-scaling-zero-conversions',
        decision: 'accepted',
      }),
    ).toThrow(/MARKETING_RECOMMENDATION_APPROVER_REQUIRED/);
    expect(() =>
      writeMarketingRecommendationDecisionReceipt({
        cwd,
        inputPath: recommendationPath,
        recommendationId: 'rec-hold-scaling-zero-conversions',
        decision: 'rejected',
      }),
    ).toThrow(/MARKETING_RECOMMENDATION_REJECTION_REASON_REQUIRED/);

    const accepted = writeMarketingRecommendationDecisionReceipt({
      cwd,
      inputPath: recommendationPath,
      recommendationId: 'rec-hold-scaling-zero-conversions',
      decision: 'accepted',
      decidedBy: 'marketing-lead',
      reason: 'Hold scaling until conversion mapping is verified.',
      now: new Date('2026-05-21T01:00:00.000Z'),
    });
    const rejected = writeMarketingRecommendationDecisionReceipt({
      cwd,
      inputPath: recommendationPath,
      recommendationId: 'rec-fix-tracking-before-scaling',
      decision: 'rejected',
      reason: 'Tracking fix is already covered by a separate deployment.',
      now: new Date('2026-05-21T02:00:00.000Z'),
    });

    expect(accepted.receipt).toEqual(
      expect.objectContaining({
        kind: 'unisane.marketing.recommendation-decision-receipt',
        decision: 'accepted',
        decidedBy: 'marketing-lead',
        liveMutationAllowed: false,
        policy: expect.objectContaining({
          approverRequired: true,
          liveMutationRequiresSeparatePlanApplyReceipt: true,
        }),
      }),
    );
    expect(rejected.receipt).toEqual(
      expect.objectContaining({
        decision: 'rejected',
        reason: 'Tracking fix is already covered by a separate deployment.',
        policy: expect.objectContaining({
          rejectedRecommendationReasonRequired: true,
          approverRequired: false,
        }),
      }),
    );
    expect(JSON.parse(readFileSync(accepted.path, 'utf8'))).toEqual(accepted.receipt);
  });

  it('writes experiment decision receipts with baseline and follow-up action', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'marketing.ts'),
      [
        "import '@unisane/web-runtime/tracking';",
        "import '@unisane/web-runtime/conversions';",
        "emit('resume_import_started');",
        "emit('resume_import_completed');",
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeZeroConversionProviderReport(cwd),
    });
    writeMarketingStrategyMapPull(loaded.config, {
      cwd,
      inputPath: writeStrategyMap(cwd),
    });
    const recommendationArtifact = await buildMarketingRecommendations(loaded.config, {
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
      targetCpa: 100,
      spendSpikeAmount: 500,
    });
    const recommendationPath = path.join(cwd, 'recommendations.json');
    writeFileSync(
      recommendationPath,
      `${JSON.stringify(recommendationArtifact, null, 2)}\n`,
      'utf8',
    );

    const result = writeMarketingExperimentDecisionReceipt({
      cwd,
      inputPath: recommendationPath,
      experimentId: 'exp-true-resume-search-cpa',
      decision: 'iterate',
      result: 'inconclusive',
      decidedBy: 'growth-lead',
      reason: 'Minimum confirmed conversion signal was not reached.',
      followUpAction: 'Rerun with a narrower audience and stronger import CTA.',
      now: new Date('2026-05-21T04:00:00.000Z'),
    });

    expect(result.receipt).toEqual(
      expect.objectContaining({
        kind: 'unisane.marketing.experiment-decision-receipt',
        experimentId: 'exp-true-resume-search-cpa',
        decision: 'iterate',
        result: 'inconclusive',
        decidedBy: 'growth-lead',
        followUpAction: 'Rerun with a narrower audience and stronger import CTA.',
        policy: expect.objectContaining({
          recordsCompletedExperimentDecision: true,
          liveMutationRequiresRecommendationAndApplyReceipts: true,
          preservesBaseline: true,
        }),
      }),
    );
    expect(result.receipt.experiment).toEqual(
      expect.objectContaining({
        baseline: expect.objectContaining({ metric: 'cost_with_zero_conversions' }),
        minimumSignalRule: expect.stringContaining('14 days'),
      }),
    );
    expect(JSON.parse(readFileSync(result.path, 'utf8'))).toEqual(result.receipt);
  });

  it('writes alert acknowledgement receipts without deleting alert evidence', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);
    writeRegistryFiles(cwd);
    mkdirSync(path.join(cwd, 'src'), { recursive: true });
    writeFileSync(
      path.join(cwd, 'src', 'marketing.ts'),
      [
        "import '@unisane/web-runtime/tracking';",
        "import '@unisane/web-runtime/conversions';",
        "emit('resume_import_started');",
        "emit('resume_import_completed');",
      ].join('\n'),
      'utf8',
    );
    const loaded = await loadMarketingConfig({ cwd });
    writeMarketingProviderReportPull(loaded.config, {
      cwd,
      provider: 'googleAds',
      inputPath: writeZeroConversionProviderReport(cwd),
    });
    const recommendationArtifact = await buildMarketingRecommendations(loaded.config, {
      cwd,
      now: new Date('2026-05-21T00:00:00.000Z'),
      targetCpa: 100,
      spendSpikeAmount: 500,
    });
    const recommendationPath = path.join(cwd, 'recommendations.json');
    writeFileSync(
      recommendationPath,
      `${JSON.stringify(recommendationArtifact, null, 2)}\n`,
      'utf8',
    );

    expect(() =>
      writeMarketingAlertAcknowledgementReceipt({
        cwd,
        inputPath: recommendationPath,
        alertId: 'alert-zero-conversion-ads',
        acknowledgedBy: 'marketing-ops',
      }),
    ).toThrow(/MARKETING_ALERT_ACK_REASON_REQUIRED/);

    const receipt = writeMarketingAlertAcknowledgementReceipt({
      cwd,
      inputPath: recommendationPath,
      alertId: 'alert-zero-conversion-ads',
      acknowledgedBy: 'marketing-ops',
      reason: 'Known launch-test alert; scaling remains blocked.',
      now: new Date('2026-05-21T03:00:00.000Z'),
    });

    expect(receipt.receipt).toEqual(
      expect.objectContaining({
        kind: 'unisane.marketing.alert-acknowledgement-receipt',
        alertId: 'alert-zero-conversion-ads',
        status: 'acknowledged',
        acknowledgedBy: 'marketing-ops',
        severity: 'critical',
        rootCauseKey: 'ads-zero-conversion',
        policy: expect.objectContaining({
          deletesEvidence: false,
          highSeverityReasonRequired: true,
          recurringAlertsGroupedByRootCause: true,
        }),
      }),
    );
    expect(receipt.receipt.alert).toEqual(
      expect.objectContaining({
        id: 'alert-zero-conversion-ads',
        rootCauseKey: 'ads-zero-conversion',
      }),
    );
    expect(JSON.parse(readFileSync(receipt.path, 'utf8'))).toEqual(receipt.receipt);
  });

  it('blocks config paths outside cwd', async () => {
    const cwd = createTempProject(configSource());
    tempProjects.push(cwd);

    await expect(loadMarketingConfig({ cwd, configPath: '../marketing.mjs' })).rejects.toThrow(
      /MARKETING_CONFIG_PATH_OUTSIDE_CWD/,
    );
  });

  it('reports missing config as a doctor error', async () => {
    const cwd = createTempProject();
    tempProjects.push(cwd);

    const report = await runMarketingDoctor({ cwd });

    expect(report.ok).toBe(false);
    expect(report.checks).toContainEqual(
      expect.objectContaining({
        id: 'marketing.config',
        status: 'error',
      }),
    );
  });
});
