export type GoogleTagManagerPublishPolicy = 'never' | 'manual-approval' | 'ci-approved';

export type GoogleTagManagerDeletionPolicy = 'tombstone-required' | 'allow-delete';

export type GoogleTagManagerDriftPolicy = 'block' | 'warn';

export type GoogleTagManagerConsentMode = 'basic' | 'advanced';

export type GoogleTagManagerConsentValue = 'granted' | 'denied';

export type GoogleTagManagerConsentType =
  | 'ad_storage'
  | 'analytics_storage'
  | 'ad_user_data'
  | 'ad_personalization'
  | 'functionality_storage'
  | 'personalization_storage'
  | 'security_storage'
  | (string & {});

export type GoogleTagManagerSecretRef = {
  secretRef: string;
};

export type GoogleTagManagerVariableRef = {
  variable: string;
};

export type GoogleTagManagerParameterValue =
  | string
  | number
  | boolean
  | readonly string[]
  | GoogleTagManagerSecretRef
  | GoogleTagManagerVariableRef;

export type GoogleTagManagerParameter = {
  key: string;
  value: GoogleTagManagerParameterValue;
};

export type GoogleTagManagerEnvironmentConfig = {
  workspacePrefix: string;
  publishPolicy?: GoogleTagManagerPublishPolicy;
  allowedVendorDomains?: readonly string[];
  deletionPolicy?: GoogleTagManagerDeletionPolicy;
  driftPolicy?: GoogleTagManagerDriftPolicy;
  credentialProfile?: string;
};

export type GoogleTagManagerConsentConfig = {
  mode: GoogleTagManagerConsentMode;
  defaults: Partial<Record<GoogleTagManagerConsentType, GoogleTagManagerConsentValue>>;
  customTypes?: readonly GoogleTagManagerConsentType[];
};

export type GoogleTagManagerFolder = {
  slug: string;
  name: string;
};

export type GoogleTagManagerVariableType =
  | 'constant'
  | 'data_layer'
  | 'environment'
  | 'lookup_table';

export type GoogleTagManagerVariable = {
  slug: string;
  name?: string;
  type: GoogleTagManagerVariableType;
  folderSlug?: string;
  parameters?: readonly GoogleTagManagerParameter[];
};

export type GoogleTagManagerTriggerType =
  | 'all_pages'
  | 'data_layer_event'
  | 'page_path'
  | 'consent_initialization';

export type GoogleTagManagerTrigger = {
  slug: string;
  name?: string;
  type: GoogleTagManagerTriggerType;
  folderSlug?: string;
  eventName?: string;
  filters?: readonly GoogleTagManagerParameter[];
};

export type GoogleTagManagerBuiltInTrigger = {
  slug: string;
  triggerId: string;
  name?: string;
};

export type GoogleTagManagerTagType =
  | 'google_tag'
  | 'ga4_pageview'
  | 'ga4_event'
  | 'google_ads_conversion_linker'
  | 'google_ads_conversion'
  | 'consent_default'
  | 'clarity'
  | 'meta_pixel'
  | 'custom_template'
  | 'custom_html';

export type GoogleTagManagerRawParameter = {
  type: string;
  key?: string;
  value?: string;
  list?: readonly GoogleTagManagerRawParameter[];
  map?: readonly GoogleTagManagerRawParameter[];
};

export type GoogleTagManagerGalleryTemplateReference = {
  tagType: string;
  templateId: string;
  host: string;
  owner: string;
  repository: string;
  version: string;
};

export type GoogleTagManagerTagConsent = {
  noAdditionalConsentRequired?: boolean;
  requiredConsent?: readonly GoogleTagManagerConsentType[];
};

export type GoogleTagManagerTagApproval = {
  customHtml?: boolean;
  customTemplate?: boolean;
  reason?: string;
};

export type GoogleTagManagerConversionDedupeStrategy = {
  eventIdVariableSlug?: string;
  serverConversion?: boolean;
};

export type GoogleTagManagerTag = {
  slug: string;
  name?: string;
  type: GoogleTagManagerTagType;
  folderSlug?: string;
  triggerSlugs: readonly string[];
  parameters?: readonly GoogleTagManagerParameter[];
  rawParameters?: readonly GoogleTagManagerRawParameter[];
  template?: GoogleTagManagerGalleryTemplateReference;
  tagFiringOption?: string;
  consent?: GoogleTagManagerTagConsent;
  vendorDomains?: readonly string[];
  approval?: GoogleTagManagerTagApproval;
  dedupeStrategy?: GoogleTagManagerConversionDedupeStrategy;
  paused?: boolean;
};

export type GoogleTagManagerContainerManifest = {
  appId: string;
  accountId: string;
  containerId: string;
  namespace: string;
  environments: Record<string, GoogleTagManagerEnvironmentConfig>;
  consent?: GoogleTagManagerConsentConfig;
  folders?: readonly GoogleTagManagerFolder[];
  builtInVariables?: readonly string[];
  variables?: readonly GoogleTagManagerVariable[];
  builtInTriggers?: readonly GoogleTagManagerBuiltInTrigger[];
  triggers?: readonly GoogleTagManagerTrigger[];
  tags?: readonly GoogleTagManagerTag[];
};

export type GoogleTagManagerResourceKind =
  | 'folder'
  | 'built_in_variable'
  | 'variable'
  | 'trigger'
  | 'tag';

export type GoogleTagManagerDesiredResource = {
  kind: GoogleTagManagerResourceKind;
  slug: string;
  name: string;
  payload: unknown;
};

export type GoogleTagManagerRemoteResource = {
  kind: GoogleTagManagerResourceKind;
  slug: string;
  remoteId: string;
  fingerprint?: string;
  payload: unknown;
  raw?: GoogleTagManagerJsonObject;
  managed?: boolean;
};

export type GoogleTagManagerRemoteSnapshot = {
  containerPath: string;
  workspacePath?: string;
  pulledAt?: string;
  resources: readonly GoogleTagManagerRemoteResource[];
  raw?: GoogleTagManagerApiSnapshot;
};

export type GoogleTagManagerPlanOperationType =
  | 'create_resource'
  | 'update_resource'
  | 'pause_tag'
  | 'retain_unmanaged_resource';

export type GoogleTagManagerPlanOperation = {
  type: GoogleTagManagerPlanOperationType;
  kind: GoogleTagManagerResourceKind;
  slug: string;
  remoteId?: string;
  fingerprint?: string;
  before?: unknown;
  after?: unknown;
};

export type GoogleTagManagerPlan = {
  containerPath?: string;
  operations: readonly GoogleTagManagerPlanOperation[];
};

export type GoogleTagManagerAppliedOperation = {
  type: GoogleTagManagerPlanOperationType | 'skip_noop';
  kind: GoogleTagManagerResourceKind;
  slug: string;
  remoteId?: string;
  fingerprint?: string;
  path?: string;
  skipped?: boolean;
};

export type GoogleTagManagerApplyReceipt = {
  appId: string;
  environment: string;
  accountId: string;
  containerId: string;
  containerPath: string;
  workspacePath: string;
  workspaceName?: string;
  appliedAt: string;
  operationCount: number;
  appliedOperations: readonly GoogleTagManagerAppliedOperation[];
  skippedOperations: readonly GoogleTagManagerAppliedOperation[];
  syncStatus?: GoogleTagManagerJsonObject;
  workspaceStatus?: GoogleTagManagerJsonObject;
  plan: GoogleTagManagerPlan;
};

export type GoogleTagManagerApplyOptions = {
  manifest: GoogleTagManagerContainerManifest;
  environment: string;
  workspaceId?: string;
  workspaceName?: string;
  workspaceDescription?: string;
};

export type GoogleTagManagerPreviewReceipt = {
  appId: string;
  environment: string;
  accountId: string;
  containerId: string;
  containerPath: string;
  workspacePath: string;
  previewedAt: string;
  contentDigest: string;
  compilerError: boolean;
  syncStatus?: GoogleTagManagerJsonObject;
  containerVersion?: GoogleTagManagerJsonObject;
  raw: GoogleTagManagerJsonObject;
};

export type GoogleTagManagerCreateVersionReceipt = {
  appId: string;
  environment: string;
  accountId: string;
  containerId: string;
  containerPath: string;
  workspacePath: string;
  versionPath?: string;
  versionId?: string;
  versionedAt: string;
  compilerError: boolean;
  syncStatus?: GoogleTagManagerJsonObject;
  containerVersion?: GoogleTagManagerJsonObject;
  newWorkspacePath?: string;
  raw: GoogleTagManagerJsonObject;
};

export type GoogleTagManagerPublishReceipt = {
  appId: string;
  environment: string;
  accountId: string;
  containerId: string;
  containerPath: string;
  versionPath: string;
  versionId: string;
  publishedAt: string;
  verification: 'verified';
  verifiedAt: string;
  observedLiveVersion: GoogleTagManagerJsonObject;
  compilerError: boolean;
  previousLiveVersion?: GoogleTagManagerJsonObject | null;
  targetVersion?: GoogleTagManagerJsonObject;
  containerVersion?: GoogleTagManagerJsonObject;
  raw: GoogleTagManagerJsonObject;
};

export type GoogleTagManagerWorkspaceVersionOptions = {
  manifest: GoogleTagManagerContainerManifest;
  environment: string;
  workspaceId?: string;
  workspaceName?: string;
};

export type GoogleTagManagerCreateVersionOptions = GoogleTagManagerWorkspaceVersionOptions & {
  name: string;
  notes?: string;
  expectedPreviewDigest: string;
  beforeWrite?: () => Promise<void>;
};

export type GoogleTagManagerPublishOptions = {
  manifest: GoogleTagManagerContainerManifest;
  environment: string;
  versionId: string;
  fingerprint?: string;
  expectedLiveRevision?: string | null;
  beforeWrite?: () => Promise<void>;
};

export type GoogleTagManagerIssueSeverity = 'error' | 'warning';

export type GoogleTagManagerIssue = {
  severity: GoogleTagManagerIssueSeverity;
  code: string;
  message: string;
  path?: string;
};

export type GoogleTagManagerValidationResult = {
  ok: boolean;
  issues: readonly GoogleTagManagerIssue[];
};

export type GoogleTagManagerOAuthScope =
  | 'https://www.googleapis.com/auth/tagmanager.readonly'
  | 'https://www.googleapis.com/auth/tagmanager.edit.containers'
  | 'https://www.googleapis.com/auth/tagmanager.delete.containers'
  | 'https://www.googleapis.com/auth/tagmanager.edit.containerversions'
  | 'https://www.googleapis.com/auth/tagmanager.publish'
  | 'https://www.googleapis.com/auth/tagmanager.manage.users'
  | 'https://www.googleapis.com/auth/tagmanager.manage.accounts';

export type GoogleTagManagerAccessTokenProvider = () => string | Promise<string>;

export type GoogleTagManagerJsonObject = Record<string, unknown>;

export type GoogleTagManagerWorkspace = GoogleTagManagerJsonObject & {
  path?: string;
  accountId?: string;
  containerId?: string;
  workspaceId?: string;
  name?: string;
  fingerprint?: string;
  expectedLiveRevision?: string | null;
  beforeWrite?: () => Promise<void>;
};

export type GoogleTagManagerApiSnapshot = {
  accountId: string;
  containerId: string;
  accountPath: string;
  containerPath: string;
  workspacePath: string;
  workspace?: GoogleTagManagerWorkspace;
  pulledAt: string;
  resources: {
    folders: readonly GoogleTagManagerJsonObject[];
    builtInVariables: readonly GoogleTagManagerJsonObject[];
    variables: readonly GoogleTagManagerJsonObject[];
    triggers: readonly GoogleTagManagerJsonObject[];
    tags: readonly GoogleTagManagerJsonObject[];
  };
  extended?: {
    workspaces?: readonly GoogleTagManagerJsonObject[];
    destinations?: readonly GoogleTagManagerJsonObject[];
    environments?: readonly GoogleTagManagerJsonObject[];
    versionHeaders?: readonly GoogleTagManagerJsonObject[];
    liveVersion?: GoogleTagManagerJsonObject | null;
    clients?: readonly GoogleTagManagerJsonObject[];
    gtagConfigs?: readonly GoogleTagManagerJsonObject[];
    templates?: readonly GoogleTagManagerJsonObject[];
    transformations?: readonly GoogleTagManagerJsonObject[];
    zones?: readonly GoogleTagManagerJsonObject[];
    userPermissions?: readonly GoogleTagManagerJsonObject[];
  };
};

export type GoogleTagManagerReadSnapshotOptions = {
  manifest: GoogleTagManagerContainerManifest;
  environment: string;
  workspaceId?: string;
  workspaceName?: string;
  includeExtendedResources?: boolean;
  includeUserPermissions?: boolean;
};
