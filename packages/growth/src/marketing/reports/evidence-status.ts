import { existsSync } from 'node:fs';
import path from 'node:path';
import type {
  MarketingExecutionContext,
  MarketingProviderAvailability,
} from '../schema/execution-context.js';
import {
  type MarketingProviderReportType,
  type MarketingReportProvider,
} from '../schema/report.js';
import { readMarketingConfirmedConversionStatus } from './confirmed-conversions.js';
import { readMarketingProviderReportStatus } from './provider-pulls.js';
import { readMarketingStrategyMapStatus } from './strategy-map.js';
import {
  marketingGoogleConnectionReadyForProvider,
  type MarketingGoogleConnectionStatus,
} from '../connections/google.js';
import {
  marketingMetaConnectionReady,
  type MarketingMetaConnectionStatus,
} from '../connections/meta.js';

export type MarketingEvidenceProvider =
  | 'gtm'
  | 'googleAds'
  | 'metaAds'
  | 'ga4'
  | 'searchConsole'
  | 'confirmedConversions'
  | 'strategyMap';

export type MarketingEvidenceState = 'pass' | 'warn' | 'error' | 'pending' | 'skip';

export type MarketingEvidenceReportFamilyStatus = {
  provider: MarketingReportProvider;
  reportType: MarketingProviderReportType;
  status: MarketingEvidenceState;
  message: string;
  path?: string;
  recordCount?: number;
  ageDays?: number;
};

export type MarketingEvidenceCommand = {
  id: string;
  provider?: MarketingEvidenceProvider;
  reportType?: MarketingProviderReportType;
  command: string;
  purpose: string;
};

export type MarketingEvidenceProviderStatus = {
  provider: MarketingEvidenceProvider;
  state?: MarketingProviderAvailability;
  reportFamilies: MarketingEvidenceReportFamilyStatus[];
  evidenceStatus: MarketingEvidenceState;
  evidenceMessage: string;
  evidencePath?: string;
  evidenceCommands: MarketingEvidenceCommand[];
};

export type MarketingEvidenceStatusReport = {
  kind: 'unisane.marketing.evidence-status';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  readyForScheduledPulls: boolean;
  cwd: string;
  configPath?: string;
  platformId: string;
  appId: string;
  defaultEnvironment: string;
  maxAgeDays: number;
  providers: MarketingEvidenceProviderStatus[];
  nextWorkflowStep: string;
};

export type MarketingEvidenceStatusOptions = {
  cwd?: string;
  configPath?: string;
  maxAgeDays?: number;
  now?: Date;
  googleAuth?: MarketingGoogleConnectionStatus;
  metaAuth?: MarketingMetaConnectionStatus;
};

const reportProviders: MarketingReportProvider[] = ['googleAds', 'metaAds', 'ga4', 'searchConsole'];

const requiredReportFamilies: Record<MarketingReportProvider, MarketingProviderReportType[]> = {
  googleAds: ['campaign', 'keyword', 'conversion'],
  metaAds: ['campaign', 'adSet', 'ad', 'creative'],
  ga4: ['landingPage', 'channel', 'sourceMedium'],
  searchConsole: ['queryPage', 'page', 'query'],
};

function evidenceState(status: string): MarketingEvidenceState {
  if (status === 'fresh') return 'pass';
  if (status === 'error') return 'error';
  if (status === 'missing' || status === 'stale' || status === 'partial') return 'pending';
  return 'warn';
}

function reportFamilies(input: {
  cwd: string;
  provider: MarketingReportProvider;
  maxAgeDays: number;
  now: Date;
}): MarketingEvidenceReportFamilyStatus[] {
  return requiredReportFamilies[input.provider].map((reportType) => {
    const report = readMarketingProviderReportStatus({
      cwd: input.cwd,
      provider: input.provider,
      reportType,
      maxAgeDays: input.maxAgeDays,
      now: input.now,
    }).providers[0];
    return {
      provider: input.provider,
      reportType,
      status: evidenceState(report?.status ?? 'missing'),
      message:
        report?.message ?? `${input.provider}/${reportType} has no current provider evidence.`,
      ...(report?.path ? { path: report.path } : {}),
      ...(report?.recordCount !== undefined ? { recordCount: report.recordCount } : {}),
      ...(report?.ageDays !== undefined ? { ageDays: report.ageDays } : {}),
    };
  });
}

function commands(
  provider: MarketingReportProvider,
  googleAuth?: MarketingGoogleConnectionStatus,
  metaAuth?: MarketingMetaConnectionStatus,
): MarketingEvidenceCommand[] {
  const connection =
    provider === 'metaAds'
      ? marketingMetaConnectionReady(metaAuth)
        ? metaAuth.connectionId
        : undefined
      : googleAuth && marketingGoogleConnectionReadyForProvider(googleAuth, provider)
        ? googleAuth.connectionId
        : undefined;
  return requiredReportFamilies[provider].map((reportType) => ({
    id: `marketing.pull-api.${provider}.${reportType}`,
    provider,
    reportType,
    command: `unisane growth marketing pull-api --provider ${provider} --report ${reportType} --start-date <YYYY-MM-DD> --end-date <YYYY-MM-DD>${connection ? ` --connection ${connection}` : ''}`,
    purpose: `Refresh ${provider}/${reportType} through the selected connection.`,
  }));
}

function providerStatus(input: {
  config: MarketingExecutionContext;
  provider: MarketingReportProvider;
  cwd: string;
  maxAgeDays: number;
  now: Date;
  googleAuth?: MarketingGoogleConnectionStatus;
  metaAuth?: MarketingMetaConnectionStatus;
}): MarketingEvidenceProviderStatus {
  const state = input.config.providers[input.provider].state;
  const families = reportFamilies(input);
  const connectionReady =
    input.provider === 'metaAds'
      ? marketingMetaConnectionReady(input.metaAuth)
      : marketingGoogleConnectionReadyForProvider(input.googleAuth, input.provider);
  const firstIncomplete = families.find((family) => family.status !== 'pass');
  const required = state === 'connected';
  const evidenceStatus: MarketingEvidenceState =
    state === 'disabled'
      ? 'skip'
      : required && !connectionReady
        ? 'error'
        : (firstIncomplete?.status ?? 'pass');
  return {
    provider: input.provider,
    state,
    reportFamilies: families,
    evidenceStatus,
    evidenceMessage:
      state === 'disabled'
        ? `${input.provider} is not selected.`
        : required && !connectionReady
          ? `${input.provider} requires its canonical provider connection.`
          : (firstIncomplete?.message ?? `${input.provider} report evidence is current.`),
    ...(firstIncomplete?.path ? { evidencePath: firstIncomplete.path } : {}),
    evidenceCommands: commands(input.provider, input.googleAuth, input.metaAuth),
  };
}

function localEvidenceStatus(input: {
  provider: 'confirmedConversions' | 'strategyMap';
  status: { status: string; message: string; path?: string };
  command: string;
}): MarketingEvidenceProviderStatus {
  return {
    provider: input.provider,
    reportFamilies: [],
    evidenceStatus: evidenceState(input.status.status),
    evidenceMessage: input.status.message,
    ...(input.status.path ? { evidencePath: input.status.path } : {}),
    evidenceCommands: [
      {
        id: `marketing.${input.provider}.refresh`,
        provider: input.provider,
        command: input.command,
        purpose: `Refresh ${input.provider} evidence.`,
      },
    ],
  };
}

function requiredEvidence(provider: MarketingEvidenceProviderStatus): boolean {
  if (provider.state === 'disabled' || provider.state === 'selected') return false;
  return provider.provider !== 'strategyMap';
}

export function buildMarketingEvidenceStatus(
  config: MarketingExecutionContext,
  options: MarketingEvidenceStatusOptions = {},
): MarketingEvidenceStatusReport {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const now = options.now ?? new Date();
  const maxAgeDays = options.maxAgeDays ?? 3;
  const gtmPath = path.resolve(cwd, config.paths.gtmManifest);
  const providers: MarketingEvidenceProviderStatus[] = [
    {
      provider: 'gtm',
      reportFamilies: [],
      evidenceStatus: existsSync(gtmPath) ? 'pass' : 'pending',
      evidenceMessage: existsSync(gtmPath)
        ? 'Tag Manager desired state is available.'
        : 'Tag Manager desired state is missing.',
      evidencePath: gtmPath,
      evidenceCommands: [
        {
          id: 'gtm.validate',
          provider: 'gtm',
          command: 'unisane growth gtm validate',
          purpose: 'Validate Tag Manager desired state.',
        },
      ],
    },
    ...reportProviders.map((provider) =>
      providerStatus({
        config,
        provider,
        cwd,
        maxAgeDays,
        now,
        googleAuth: options.googleAuth,
        metaAuth: options.metaAuth,
      }),
    ),
    localEvidenceStatus({
      provider: 'confirmedConversions',
      status: readMarketingConfirmedConversionStatus({ cwd, maxAgeDays, now }),
      command: 'unisane growth marketing conversion-pull --input <confirmed-conversions.json>',
    }),
    localEvidenceStatus({
      provider: 'strategyMap',
      status: readMarketingStrategyMapStatus({ cwd, maxAgeDays, now }),
      command: 'unisane growth marketing strategy-pull --input <strategy-map.json>',
    }),
  ];
  const required = providers.filter(requiredEvidence);
  const blocker = required.find((provider) => provider.evidenceStatus === 'error');
  const incomplete = required.find((provider) => provider.evidenceStatus !== 'pass');
  const next = blocker ?? incomplete;
  return {
    kind: 'unisane.marketing.evidence-status',
    version: 1,
    nonMutating: true,
    generatedAt: now.toISOString(),
    ok: !blocker,
    readyForScheduledPulls:
      required.length > 0 && required.every((provider) => provider.evidenceStatus === 'pass'),
    cwd,
    configPath: options.configPath,
    platformId: config.platformId,
    appId: config.appId,
    defaultEnvironment: config.defaultEnvironment,
    maxAgeDays,
    providers,
    nextWorkflowStep: next?.evidenceCommands[0]?.command
      ? `Run ${next.evidenceCommands[0].command}.`
      : (next?.evidenceMessage ??
        'Current Growth evidence is ready for scheduled read-only reporting.'),
  };
}
