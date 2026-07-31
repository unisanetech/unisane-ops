import type { OpsReadinessFinding } from '@unisane/ops-engine/readiness';

export type MarketingTrackingAuditStatus = 'pass' | 'warn' | 'error';

export type MarketingTrackingAuditMode = 'audit-only';

export type MarketingTrackingEmitterId =
  | 'web-runtime'
  | 'gtm'
  | 'gtag'
  | 'meta-pixel'
  | 'meta-capi'
  | 'google-ads'
  | 'other';

export type MarketingTrackingEmitter = {
  id: MarketingTrackingEmitterId;
  label: string;
  channels: Array<'browser' | 'server'>;
  detectedBy: Array<'source' | 'manifest' | 'observation'>;
  paths: string[];
  direct: boolean;
};

export type MarketingTrackingFindingCategory =
  | 'competing-emitter'
  | 'consent-suppression'
  | 'duplicate-event'
  | 'environment-mismatch'
  | 'invalid-payload'
  | 'missing-event'
  | 'missing-parameter'
  | 'unknown-event';

export type MarketingTrackingFinding = {
  id: string;
  category: MarketingTrackingFindingCategory;
  severity: 'warning' | 'error';
  title: string;
  detail: string;
  eventName?: string;
  conversionId?: string;
  path?: string;
};

export type MarketingTrackingCoverage = {
  expectedEventCount: number;
  observedEventCount: number;
  expectedConversionCount: number;
  observedConversionCount: number;
  observationCount: number;
};

export type MarketingTrackingAuditSummary = {
  status: 'ready' | 'attention' | 'blocked';
  emitterCount: number;
  findingCount: number;
  errorCount: number;
  warningCount: number;
};

export type MarketingTrackingAuditCheck = {
  id: string;
  status: MarketingTrackingAuditStatus;
  message: string;
  path?: string;
};

export type MarketingTrackingAuditReport = {
  kind: 'unisane.growth.tracking-audit';
  version: 1;
  mode: MarketingTrackingAuditMode;
  generatedAt: string;
  ok: boolean;
  cwd: string;
  environment: string;
  scannedFileCount: number;
  observationArtifactPath?: string;
  summary: MarketingTrackingAuditSummary;
  coverage: MarketingTrackingCoverage;
  emitters: MarketingTrackingEmitter[];
  findings: MarketingTrackingFinding[];
  readiness: OpsReadinessFinding;
  checks: MarketingTrackingAuditCheck[];
};

export type MarketingTrackingAuditOptions = {
  cwd?: string;
  sourceRoots?: string[];
  observationsPath?: string;
  now?: Date;
};

export type SourceFile = {
  path: string;
  source: string;
};
