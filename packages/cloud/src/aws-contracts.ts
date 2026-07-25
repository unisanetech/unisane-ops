export type AwsOpsDataClass =
  | 'public-assets'
  | 'private-user-data'
  | 'generated-private'
  | 'temporary'
  | 'logs'
  | string;

export interface AwsOpsAccountConfig {
  accountId: string;
  profile?: string;
  defaultRegion?: string;
}

export interface AwsOpsEnvironmentConfig {
  account: string;
  region?: string;
  production?: boolean;
}

export interface AwsOpsBucketPrefixConfig {
  path: string;
  dataClass: AwsOpsDataClass;
}

export interface AwsOpsBucketCorsConfig {
  allowedOrigins: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposeHeaders?: string[];
  maxAgeSeconds?: number;
}

export interface AwsOpsBucketConfig {
  environment: string;
  name: string;
  adoptExisting?: boolean;
  blockPublicAccess?: boolean;
  objectOwnership?: string;
  encryption?: {
    type: string;
  };
  prefixes?: AwsOpsBucketPrefixConfig[];
  cors?: AwsOpsBucketCorsConfig;
}

export interface AwsOpsCdnAccessLogsConfig {
  bucket: string;
  prefix?: string;
  includeCookies?: boolean;
}

export interface AwsOpsCdnConfig {
  environment: string;
  originBucket: string;
  access: string;
  certificate?: string;
  aliases?: string[];
  publicPrefixes?: string[];
  accessLogs?: AwsOpsCdnAccessLogsConfig;
}

export interface AwsOpsAppConfig {
  environment: string;
  storageBucket?: string;
  objectDeliveryPublicBaseUrlFromCdn?: string;
  mailIdentity?: string;
}

export interface AwsOpsAppEnvironmentConfig {
  environments: Record<string, Omit<AwsOpsAppConfig, 'environment'>>;
}

export interface AwsOpsMailIdentityConfig {
  environment: string;
  domain: string;
  mailFromDomain?: string;
  configurationSet?: string;
  eventDestinations?: AwsOpsMailEventDestinationConfig[];
  bimi?: AwsOpsMailBimiConfig;
}

export interface AwsOpsMailBimiConfig {
  selector?: string;
  logoUrl: string;
  certificateUrl?: string;
  hostedZone?: string;
}

export interface AwsOpsMailEventDestinationConfig {
  name: string;
  type: 'sns' | string;
  matchingEventTypes: string[];
  enabled?: boolean;
  topicArn?: string;
  subscriptions?: AwsOpsSnsSubscriptionConfig[];
}

export interface AwsOpsSnsSubscriptionConfig {
  protocol: 'https' | string;
  endpoint: string;
}

export interface AwsOpsCertificateConfig {
  environment: string;
  domainName: string;
  subjectAlternativeNames?: string[];
  usage?: 'cloudfront' | 'regional' | string;
  region?: string;
  hostedZone?: string;
}

export interface AwsOpsDnsZoneConfig {
  environment: string;
  name: string;
  hostedZoneId?: string;
  provider?: 'route53' | 'external' | string;
  privateZone?: boolean;
}

export interface AwsOpsConfig {
  defaults?: {
    tags?: Record<string, string>;
    publicAssetCache?: {
      strategy?: string;
      defaultMaxAgeSeconds?: number;
    };
    locking?: {
      provider?: string;
    };
  };
  accounts: Record<string, AwsOpsAccountConfig>;
  environments: Record<string, AwsOpsEnvironmentConfig>;
  buckets?: Record<string, AwsOpsBucketConfig>;
  cdn?: Record<string, AwsOpsCdnConfig>;
  apps?: Record<string, AwsOpsAppConfig | AwsOpsAppEnvironmentConfig>;
  mailIdentities?: Record<string, AwsOpsMailIdentityConfig>;
  certificates?: Record<string, AwsOpsCertificateConfig>;
  dnsZones?: Record<string, AwsOpsDnsZoneConfig>;
}

export interface LoadedAwsOpsConfig {
  config: AwsOpsConfig;
  path: string;
}

export interface AwsCommandOptions {
  cwd?: string;
  configPath?: string;
  env?: string;
  json?: boolean;
}

export interface AwsCommandContext {
  cwd: string;
  configPath: string;
  environment: string;
  config: AwsOpsConfig;
  account: {
    key: string;
    expectedAccountId: string;
    actualAccountId: string | null;
    profile: string | null;
    region: string;
    production: boolean;
  };
}

export interface AwsDoctorOptions {
  cwd?: string;
  configPath?: string;
  env?: string;
  json?: boolean;
}

export type AwsDoctorCheckStatus = 'ok' | 'warn' | 'error';

export interface AwsDoctorCheck {
  id: string;
  status: AwsDoctorCheckStatus;
  message: string;
}

export interface AwsCallerIdentity {
  accountId: string | null;
  arn: string | null;
  userId: string | null;
}

export interface AwsIdentityReader {
  read(args: { profile?: string; region: string }): Promise<AwsCallerIdentity>;
}

export interface AwsDoctorReport {
  ok: boolean;
  environment: string;
  configPath: string | null;
  account: {
    key: string | null;
    expectedAccountId: string | null;
    actualAccountId: string | null;
    profile: string | null;
    region: string | null;
    production: boolean;
  };
  credentialSource: string;
  checks: AwsDoctorCheck[];
  nextSteps: string[];
}

export interface AwsJsonArtifact {
  path: string;
  relativePath: string;
}

export interface AwsS3PublicAccessBlockInventory {
  blockPublicAcls: boolean | null;
  ignorePublicAcls: boolean | null;
  blockPublicPolicy: boolean | null;
  restrictPublicBuckets: boolean | null;
}

export interface AwsS3LifecycleRuleInventory {
  id: string | null;
  status: string | null;
  prefix: string | null;
  expirationDays: number | null;
}

export interface AwsS3CorsRuleInventory {
  allowedMethods: string[];
  allowedOrigins: string[];
  allowedHeaders: string[];
  exposeHeaders: string[];
  maxAgeSeconds: number | null;
}

export interface AwsS3BucketInventory {
  key: string;
  name: string;
  environment: string;
  exists: boolean;
  expectedRegion: string;
  publicAccessBlock: AwsS3PublicAccessBlockInventory | null;
  objectOwnership: string | null;
  encryption: string | null;
  tags: Record<string, string>;
  corsConfigured: boolean | null;
  corsRules: AwsS3CorsRuleInventory[];
  lifecycleRules: AwsS3LifecycleRuleInventory[];
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface AwsS3InventoryReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  buckets: AwsS3BucketInventory[];
  artifact?: AwsJsonArtifact;
}

export interface AwsS3InventoryReader {
  readBucket(args: {
    bucketKey: string;
    bucket: AwsOpsBucketConfig;
    context: AwsCommandContext;
  }): Promise<AwsS3BucketInventory>;
}

export interface AwsS3InventoryOptions extends AwsCommandOptions {
  output?: string;
}

export type AwsS3PlanAction = 'create' | 'update' | 'blocked' | 'no-op';

export interface AwsS3PlanOperation {
  action: AwsS3PlanAction;
  bucketKey: string;
  bucketName: string;
  check: string;
  message: string;
  current: unknown;
  desired: unknown;
}

export interface AwsS3PlanReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  operations: AwsS3PlanOperation[];
  summary: Record<AwsS3PlanAction, number>;
  artifact?: AwsJsonArtifact;
}

export interface AwsS3PlanOptions extends AwsCommandOptions {
  inventoryPath?: string;
  output?: string;
}

export type AwsS3ApplyOperationStatus = 'succeeded' | 'failed' | 'skipped';

export interface AwsS3ApplyOperationResult {
  operation: AwsS3PlanOperation;
  status: AwsS3ApplyOperationStatus;
  message: string;
}

export interface AwsS3ApplyReceipt {
  version: 1;
  kind: 'unisane.aws.s3-apply-receipt';
  status: 'succeeded' | 'failed';
  environment: string;
  account: AwsCommandContext['account'];
  planPath: string;
  planHash: string;
  planGeneratedAt: string;
  appliedAt: string;
  completedAt: string;
  lockPath: string;
  results: AwsS3ApplyOperationResult[];
}

export interface AwsS3ApplyReport {
  ok: boolean;
  receipt: AwsS3ApplyReceipt;
  artifact: AwsJsonArtifact;
}

export interface AwsS3ApplyExecutor {
  applyOperation(args: {
    context: AwsCommandContext;
    operation: AwsS3PlanOperation;
  }): Promise<AwsS3ApplyOperationResult>;
}

export interface AwsS3ApplyOptions extends AwsCommandOptions {
  planPath: string;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  force?: boolean;
  yes?: boolean;
}

export interface AwsCloudFrontOriginAccessControlInventory {
  id: string;
  name: string;
  originType: string | null;
  signingBehavior: string | null;
  signingProtocol: string | null;
}

export interface AwsCloudFrontCachePolicyInventory {
  id: string;
  name: string;
  comment: string | null;
  defaultTtl: number | null;
  maxTtl: number | null;
  minTtl: number | null;
}

export interface AwsCloudFrontDistributionInventory {
  key: string;
  environment: string;
  originBucketKey: string;
  originBucketName: string | null;
  distributionId: string | null;
  domainName: string | null;
  enabled: boolean | null;
  status: string | null;
  aliases: string[];
  originDomainName: string | null;
  originAccessControlId: string | null;
  originAccessControlName: string | null;
  viewerProtocolPolicy: string | null;
  viewerCertificateArn: string | null;
  viewerCertificateSource: string | null;
  minimumProtocolVersion: string | null;
  cachePolicyId: string | null;
  cachePolicyName: string | null;
  accessLoggingEnabled: boolean | null;
  accessLogBucket: string | null;
  accessLogPrefix: string | null;
  accessLogIncludeCookies: boolean | null;
  s3BucketPolicyAllowsDistribution: boolean | null;
  matchedBy: 'alias' | 'origin' | 'none';
  desiredOriginDomainName: string | null;
  desiredOriginAccessControlName: string;
  desiredCachePolicyName: string;
  desiredCertificateKey: string | null;
  desiredViewerCertificateArn: string | null;
  desiredViewerCertificateStatus: string | null;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface AwsCloudFrontInventoryReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  distributions: AwsCloudFrontDistributionInventory[];
  originAccessControls: AwsCloudFrontOriginAccessControlInventory[];
  cachePolicies: AwsCloudFrontCachePolicyInventory[];
  artifact?: AwsJsonArtifact;
}

export interface AwsCloudFrontInventoryReader {
  read(args: { context: AwsCommandContext }): Promise<{
    distributions: AwsCloudFrontDistributionInventory[];
    originAccessControls: AwsCloudFrontOriginAccessControlInventory[];
    cachePolicies: AwsCloudFrontCachePolicyInventory[];
  }>;
}

export interface AwsCloudFrontInventoryOptions extends AwsCommandOptions {
  output?: string;
}

export type AwsCloudFrontPlanAction = 'create' | 'update' | 'blocked' | 'no-op';

export interface AwsCloudFrontPlanOperation {
  action: AwsCloudFrontPlanAction;
  cdnKey: string;
  distributionId: string | null;
  check: string;
  message: string;
  current: unknown;
  desired: unknown;
}

export interface AwsCloudFrontPlanReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  operations: AwsCloudFrontPlanOperation[];
  summary: Record<AwsCloudFrontPlanAction, number>;
  artifact?: AwsJsonArtifact;
}

export interface AwsCloudFrontPlanOptions extends AwsCommandOptions {
  inventoryPath?: string;
  output?: string;
}

export type AwsCloudFrontApplyOperationStatus = 'succeeded' | 'failed' | 'skipped';

export interface AwsCloudFrontApplyOperationResult {
  operation: AwsCloudFrontPlanOperation;
  status: AwsCloudFrontApplyOperationStatus;
  message: string;
}

export interface AwsCloudFrontApplyReceipt {
  version: 1;
  kind: 'unisane.aws.cloudfront-apply-receipt';
  status: 'succeeded' | 'failed';
  environment: string;
  account: AwsCommandContext['account'];
  planPath: string;
  planHash: string;
  planGeneratedAt: string;
  appliedAt: string;
  completedAt: string;
  lockPath: string;
  results: AwsCloudFrontApplyOperationResult[];
}

export interface AwsCloudFrontApplyReport {
  ok: boolean;
  receipt: AwsCloudFrontApplyReceipt;
  artifact: AwsJsonArtifact;
}

export interface AwsCloudFrontApplyExecutor {
  applyOperation(args: {
    context: AwsCommandContext;
    operation: AwsCloudFrontPlanOperation;
  }): Promise<AwsCloudFrontApplyOperationResult>;
}

export interface AwsCloudFrontApplyOptions extends AwsCommandOptions {
  planPath: string;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  force?: boolean;
  yes?: boolean;
}

export interface AwsCloudFrontInvalidationReceipt {
  version: 1;
  kind: 'unisane.aws.cloudfront-invalidation-receipt';
  status: 'succeeded' | 'failed';
  environment: string;
  account: AwsCommandContext['account'];
  cdnKey: string;
  distributionId: string;
  paths: string[];
  invalidationId: string | null;
  invalidationStatus: string | null;
  requestedAt: string;
  completedAt: string;
  lockPath: string;
  message: string;
}

export interface AwsCloudFrontInvalidationReport {
  ok: boolean;
  receipt: AwsCloudFrontInvalidationReceipt;
  artifact: AwsJsonArtifact;
}

export interface AwsCloudFrontInvalidationExecutor {
  createInvalidation(args: {
    context: AwsCommandContext;
    cdnKey: string;
    distributionId: string;
    paths: string[];
  }): Promise<{
    invalidationId: string | null;
    status: string | null;
    message: string;
  }>;
}

export interface AwsCloudFrontInvalidateOptions extends AwsCommandOptions {
  cdnKey: string;
  paths?: string[];
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  yes?: boolean;
}

export interface AwsEnvVariable {
  name: string;
  value: string;
  source: string;
  sensitive: boolean;
}

export interface AwsEnvOutputReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  appKey: string;
  variables: AwsEnvVariable[];
  artifact?: AwsJsonArtifact;
}

export interface AwsEnvOutputOptions extends AwsCommandOptions {
  appKey: string;
  output?: string;
}

export interface AwsDomainMailIdentityInventory {
  key: string;
  environment: string;
  domain: string;
  exists: boolean;
  identityType: string | null;
  verifiedForSending: boolean | null;
  verificationStatus: string | null;
  dkimStatus: string | null;
  dkimTokens: string[];
  dkimSigningHostedZone: string | null;
  mailFromDomain: string | null;
  mailFromStatus: string | null;
  configurationSetName: string | null;
  desiredMailFromDomain: string | null;
  desiredConfigurationSetName: string | null;
  configurationSetExists: boolean | null;
  configurationSetEventDestinations: AwsDomainSesEventDestinationInventory[];
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface AwsDomainSesEventDestinationInventory {
  name: string;
  enabled: boolean | null;
  matchingEventTypes: string[];
  destinationTypes: string[];
  snsTopicArn: string | null;
  snsSubscriptions: AwsDomainSnsSubscriptionInventory[];
}

export interface AwsDomainSnsSubscriptionInventory {
  protocol: string | null;
  endpoint: string | null;
  subscriptionArn: string | null;
  pendingConfirmation: boolean;
}

export interface AwsDomainSesAccountInventory {
  productionAccessEnabled: boolean | null;
  sendingEnabled: boolean | null;
  enforcementStatus: string | null;
  suppressedReasons: string[];
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface AwsDomainCertificateInventory {
  key: string;
  environment: string;
  domainName: string;
  certificateArn: string | null;
  region: string;
  status: string | null;
  subjectAlternativeNames: string[];
  validationMethod: string | null;
  renewalEligibility: string | null;
  inUseBy: string[];
  desiredSubjectAlternativeNames: string[];
  desiredHostedZone: string | null;
  validationRecords: Array<{
    name: string | null;
    type: string | null;
    value: string | null;
    status: string | null;
  }>;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface AwsDomainDnsRecordInventory {
  name: string;
  type: string;
  values: string[];
  ttl: number | null;
  aliasTarget?: {
    dnsName: string;
    hostedZoneId: string;
    evaluateTargetHealth: boolean | null;
  } | null;
}

export interface AwsDomainDnsZoneInventory {
  key: string;
  environment: string;
  name: string;
  hostedZoneId: string | null;
  exists: boolean;
  provider: string;
  privateZone: boolean | null;
  nameServers: string[];
  records: AwsDomainDnsRecordInventory[];
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface AwsDomainCloudFrontAliasInventory {
  cdnKey: string;
  environment: string;
  distributionId: string | null;
  domainName: string | null;
  status: string | null;
  enabled: boolean | null;
  aliases: string[];
  desiredAliases: string[];
  route53HostedZoneId: string;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

export interface AwsDomainsInventoryReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  sesAccount: AwsDomainSesAccountInventory;
  mailIdentities: AwsDomainMailIdentityInventory[];
  certificates: AwsDomainCertificateInventory[];
  dnsZones: AwsDomainDnsZoneInventory[];
  cloudFrontAliases: AwsDomainCloudFrontAliasInventory[];
  artifact?: AwsJsonArtifact;
}

export interface AwsDomainsInventoryReader {
  read(args: { context: AwsCommandContext }): Promise<{
    sesAccount?: AwsDomainSesAccountInventory;
    mailIdentities: AwsDomainMailIdentityInventory[];
    certificates: AwsDomainCertificateInventory[];
    dnsZones: AwsDomainDnsZoneInventory[];
    cloudFrontAliases?: AwsDomainCloudFrontAliasInventory[];
  }>;
}

export interface AwsDomainsInventoryOptions extends AwsCommandOptions {
  output?: string;
}

export type AwsDomainsPlanAction = 'create' | 'update' | 'manual' | 'blocked' | 'no-op';

export interface AwsDomainsPlanOperation {
  action: AwsDomainsPlanAction;
  resourceType: 'mail-identity' | 'certificate' | 'dns-zone' | 'dns-record';
  resourceKey: string;
  check: string;
  message: string;
  current: unknown;
  desired: unknown;
}

export interface AwsDomainsPlanReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  operations: AwsDomainsPlanOperation[];
  summary: Record<AwsDomainsPlanAction, number>;
  artifact?: AwsJsonArtifact;
}

export interface AwsDomainsPlanOptions extends AwsCommandOptions {
  inventoryPath?: string;
  output?: string;
}

export type AwsDomainsApplyOperationStatus = 'succeeded' | 'failed' | 'skipped';

export interface AwsDomainsApplyOperationResult {
  operation: AwsDomainsPlanOperation;
  status: AwsDomainsApplyOperationStatus;
  message: string;
}

export interface AwsDomainsApplyReceipt {
  version: 1;
  kind: 'unisane.aws.domains-apply-receipt';
  status: 'succeeded' | 'failed';
  environment: string;
  account: AwsCommandContext['account'];
  planPath: string;
  planHash: string;
  planGeneratedAt: string;
  appliedAt: string;
  completedAt: string;
  lockPath: string;
  results: AwsDomainsApplyOperationResult[];
}

export interface AwsDomainsApplyReport {
  ok: boolean;
  receipt: AwsDomainsApplyReceipt;
  artifact: AwsJsonArtifact;
}

export interface AwsDomainsApplyExecutor {
  applyOperation(args: {
    context: AwsCommandContext;
    operation: AwsDomainsPlanOperation;
  }): Promise<AwsDomainsApplyOperationResult>;
}

export interface AwsDomainsApplyOptions extends AwsCommandOptions {
  planPath: string;
  accountConfirm?: string;
  productionConfirm?: string;
  receiptOutput?: string;
  force?: boolean;
  yes?: boolean;
}

export interface AwsDomainsCertificateDeleteOptions extends AwsCommandOptions {
  certificateArn: string;
  accountConfirm?: string;
  domainName?: string;
  receiptOutput?: string;
  yes?: boolean;
}

export interface AwsDomainsCertificateDeleteTarget {
  certificateArn: string;
  domainName: string | null;
  status: string | null;
  inUseBy: string[];
  region: string;
}

export interface AwsDomainsCertificateDeleteExecutor {
  describeCertificate(args: {
    context: AwsCommandContext;
    certificateArn: string;
    region: string;
  }): Promise<AwsDomainsCertificateDeleteTarget>;
  deleteCertificate(args: {
    context: AwsCommandContext;
    certificateArn: string;
    region: string;
  }): Promise<void>;
}

export interface AwsDomainsCertificateDeleteReceipt {
  version: 1;
  kind: 'unisane.aws.domains-certificate-delete-receipt';
  status: 'succeeded' | 'failed';
  environment: string;
  account: AwsCommandContext['account'];
  certificateArn: string;
  domainName: string | null;
  certificateStatus: string | null;
  region: string;
  requestedAt: string;
  completedAt: string;
  lockPath: string;
  message: string;
}

export interface AwsDomainsCertificateDeleteReport {
  ok: boolean;
  receipt: AwsDomainsCertificateDeleteReceipt;
  artifact: AwsJsonArtifact;
}

export type AwsAuditCheckStatus = 'ok' | 'warn' | 'error';

export interface AwsAuditCheck {
  id: string;
  status: AwsAuditCheckStatus;
  message: string;
  scope: string;
}

export interface AwsAuditReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  checks: AwsAuditCheck[];
  summary: Record<AwsAuditCheckStatus, number>;
  artifact?: AwsJsonArtifact;
}

export interface AwsAuditOptions extends AwsCommandOptions {
  output?: string;
}

export interface AwsIamPolicyStatement {
  Sid: string;
  Effect: 'Allow';
  Action: string[];
  Resource: string[];
}

export interface AwsIamPolicyDocument {
  Version: '2012-10-17';
  Statement: AwsIamPolicyStatement[];
}

export interface AwsIamPolicyReport {
  ok: boolean;
  environment: string;
  generatedAt: string;
  configPath: string;
  account: AwsCommandContext['account'];
  policy: AwsIamPolicyDocument;
  notes: string[];
  artifact?: AwsJsonArtifact;
}

export interface AwsIamPolicyOptions extends AwsCommandOptions {
  output?: string;
}
