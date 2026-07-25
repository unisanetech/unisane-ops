import type {
  ControlPlaneEnvReport,
  ControlPlaneInventoryArtifact,
  ControlPlaneSetupStatus,
} from '@unisane/ops-engine';
import type {
  MarketingMetaAuthRuntimeOptions,
  marketingMetaAuthStatusToControlPlaneProfile,
} from '../../../meta/auth.js';

export type MetaProviderCliOptions = MarketingMetaAuthRuntimeOptions & {
  cwd?: string;
  config?: string;
  profile?: string;
  env?: string;
  app?: string;
  output?: string;
  accountId?: string;
  accessTokenEnv?: string;
  apiVersion?: string;
  maxPages?: string;
  pageSize?: string;
  json?: boolean;
};

export type MetaProviderInventoryResource = {
  type: 'adAccount' | 'pixel' | 'business' | 'page' | 'instagramActor';
  id: string;
  title?: string;
  state: string;
  parentId?: string;
  metadata?: Record<string, string>;
};

export type MetaProviderSetupStatusReport = {
  schemaVersion: 1;
  kind: 'meta.setup-status';
  provider: 'meta';
  appId: string;
  environment: string;
  generatedAt: string;
  authProfile: ReturnType<typeof marketingMetaAuthStatusToControlPlaneProfile>;
  envReport: ControlPlaneEnvReport;
  setupStatus: ControlPlaneSetupStatus;
};

export type MetaProviderInventoryArtifact =
  ControlPlaneInventoryArtifact<MetaProviderInventoryResource> & {
    source: 'meta-discovery';
  };
