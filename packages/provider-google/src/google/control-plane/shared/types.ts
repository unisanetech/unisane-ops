import type {
  ControlPlaneApplyReceipt,
  ControlPlaneEnvReport,
  ControlPlaneInventoryArtifact,
  ControlPlaneSetupStatus,
  ControlPlanePlanArtifact,
} from '@unisane/ops-engine';
import type {
  GoogleAuthRuntimeOptions,
  googleAuthStatusToControlPlaneProfile,
} from '../../auth.js';
import type { GoogleServiceEnableResult } from '../client.js';

export const GOOGLE_CONTROL_PLANE_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
export const GOOGLE_TAG_MANAGER_READONLY_SCOPE =
  'https://www.googleapis.com/auth/tagmanager.readonly';
export const GOOGLE_ANALYTICS_READONLY_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
export const GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE =
  'https://www.googleapis.com/auth/webmasters.readonly';
export const GOOGLE_ADS_SCOPE = 'https://www.googleapis.com/auth/adwords';
export const GOOGLE_PRODUCT_DISCOVERY_SCOPES = [
  GOOGLE_TAG_MANAGER_READONLY_SCOPE,
  GOOGLE_ANALYTICS_READONLY_SCOPE,
  GOOGLE_SEARCH_CONSOLE_READONLY_SCOPE,
  GOOGLE_ADS_SCOPE,
] as const;

export const GOOGLE_PROVIDER_DEFAULT_REQUIRED_APIS = [
  {
    serviceName: 'serviceusage.googleapis.com',
    title: 'Service Usage API',
    reason: 'Required to inventory and enable Google APIs through the control plane.',
  },
  {
    serviceName: 'cloudresourcemanager.googleapis.com',
    title: 'Cloud Resource Manager API',
    reason: 'Required to read Google project identity and lifecycle status.',
  },
  {
    serviceName: 'tagmanager.googleapis.com',
    title: 'Tag Manager API',
    reason: 'Required for GTM inventory, diff, apply, preview, publish, and rollback workflows.',
  },
  {
    serviceName: 'analyticsadmin.googleapis.com',
    title: 'Google Analytics Admin API',
    reason: 'Required to discover GA4 accounts and properties.',
  },
  {
    serviceName: 'analyticsdata.googleapis.com',
    title: 'Google Analytics Data API',
    reason: 'Required to pull GA4 reporting evidence.',
  },
  {
    serviceName: 'searchconsole.googleapis.com',
    title: 'Search Console API',
    reason: 'Required to pull Search Console query and page evidence.',
  },
  {
    serviceName: 'googleads.googleapis.com',
    title: 'Google Ads API',
    reason: 'Required for Google Ads account discovery, reporting, and guarded ads workflows.',
  },
] as const;

export type GoogleProviderRequiredApi = {
  serviceName: string;
  title: string;
  reason: string;
};

export type GoogleProviderCliOptions = GoogleAuthRuntimeOptions & {
  cwd?: string;
  project?: string;
  profile?: string;
  env?: string;
  app?: string;
  config?: string;
  api?: string[];
  output?: string;
  inventory?: string;
  plan?: string;
  receiptOutput?: string;
  productionConfirm?: string;
  developerTokenEnv?: string;
  apiVersion?: string;
  yes?: boolean;
  json?: boolean;
};

export type GoogleProviderInventoryResource = {
  type:
    | 'project'
    | 'api'
    | 'gtmAccount'
    | 'gtmContainer'
    | 'ga4Property'
    | 'searchConsoleSite'
    | 'googleAdsCustomer'
    | 'googleAdsDeveloperToken';
  id: string;
  title?: string;
  state: string;
  reason?: string;
  parentId?: string;
  metadata?: Record<string, string>;
};

export type GoogleProviderInventoryArtifact =
  ControlPlaneInventoryArtifact<GoogleProviderInventoryResource> & {
    projectId: string;
    requiredApis: GoogleProviderRequiredApi[];
  };

export type GoogleProviderPlanArtifact = ControlPlanePlanArtifact & {
  projectId: string;
  requiredApis: GoogleProviderRequiredApi[];
};

export type GoogleProviderSetupStatusReport = {
  schemaVersion: 1;
  kind: 'google.setup-status';
  provider: 'google';
  appId: string;
  environment: string;
  generatedAt: string;
  projectId: string | null;
  authProfile: ReturnType<typeof googleAuthStatusToControlPlaneProfile>;
  envReport: ControlPlaneEnvReport;
  setupStatus: ControlPlaneSetupStatus;
  desiredApis: GoogleProviderRequiredApi[];
};

export type GoogleProviderApplyReceipt = ControlPlaneApplyReceipt & {
  projectId: string;
  enabledServices: GoogleServiceEnableResult[];
};

export type GoogleProviderProductsInventoryArtifact =
  ControlPlaneInventoryArtifact<GoogleProviderInventoryResource> & {
    requiredScopes: readonly string[];
    developerTokenEnv: string;
  };
