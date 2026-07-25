export type MarketingTrackingAuditStatus = 'pass' | 'warn' | 'error';

export type MarketingTrackingAuditCheck = {
  id: string;
  status: MarketingTrackingAuditStatus;
  message: string;
  path?: string;
};

export type MarketingTrackingAuditReport = {
  ok: boolean;
  cwd: string;
  scannedFileCount: number;
  checks: MarketingTrackingAuditCheck[];
};

export type MarketingTrackingAuditOptions = {
  cwd?: string;
  sourceRoots?: string[];
};

export type SourceFile = {
  path: string;
  source: string;
};
