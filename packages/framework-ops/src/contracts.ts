export const FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE =
  '@unisane/compiler/project-descriptor-contract/v1' as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_FORMAT =
  'unisane.framework-project-descriptor-contract' as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION = 1 as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_SHA256 =
  '51ec7dfef1e3abf2ea91529e5c1f53aed40dc55aa7cbf5f3ab929398ea2b9c55' as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID =
  'https://unisane.dev/schemas/framework-project-descriptor.v1.json' as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_SHA256 =
  '230280eb2234b7298c27f0502e785a7a7dddb134e21ab9bbaa1459ca9ca1105d' as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT = 'unisane.framework-project-descriptor' as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION = 1 as const;
export const FRAMEWORK_PROJECT_DESCRIPTOR_OUTPUT_PATH =
  '.cache/unisane/project-descriptor.json' as const;
export const FRAMEWORK_COMPILER_PACKAGE = '@unisane/compiler' as const;
export const FRAMEWORK_COMPILER_VERSION = '0.1.0' as const;
export const FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION = 3 as const;
export const FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION = 1 as const;

export const FRAMEWORK_PROJECT_DESCRIPTOR_CORE_KEY_ORDER = Object.freeze([
  'format',
  'schemaVersion',
  'project',
  'capabilities',
  'compatibility',
] as const);

export const FRAMEWORK_PROJECT_DESCRIPTOR_DOCUMENT_KEY_ORDER = Object.freeze([
  ...FRAMEWORK_PROJECT_DESCRIPTOR_CORE_KEY_ORDER,
  'digest',
] as const);

export const FRAMEWORK_PROJECT_DESCRIPTOR_NESTED_KEY_ORDER = Object.freeze({
  project: Object.freeze(['id'] as const),
  'capabilities[]': Object.freeze([
    'id',
    'kind',
    'owner',
    'package',
    'features',
    'operations',
  ] as const),
  'capabilities[].package': Object.freeze(['name', 'version'] as const),
  compatibility: Object.freeze([
    'compiler',
    'projectModelSchemaVersion',
    'moduleDescriptorSchemaVersion',
    'api',
  ] as const),
  'compatibility.compiler': Object.freeze(['package', 'version'] as const),
  'compatibility.api[]': Object.freeze([
    'operation',
    'audience',
    'host',
    'lifecycle',
    'apiMajor',
    'compatibilityBaselineId',
    'supportPolicyId',
    'deprecation',
  ] as const),
  'compatibility.api[].deprecation': Object.freeze([
    'announcedOn',
    'sunsetOn',
    'replacement',
    'migration',
  ] as const),
});

export const FRAMEWORK_PROJECT_CAPABILITY_FEATURES = Object.freeze([
  'bulk',
  'persistence',
  'publishes-events',
  'subscribes-to-events',
] as const);

export type FrameworkProjectCapabilityFeature =
  (typeof FRAMEWORK_PROJECT_CAPABILITY_FEATURES)[number];
export type FrameworkProjectApiAudience =
  | 'first-party'
  | 'partner'
  | 'public'
  | 'operator'
  | 'protocol'
  | 'provider-ingress';
export type FrameworkProjectApiHost =
  | 'application'
  | 'external-api'
  | 'operator'
  | 'protocol'
  | 'provider-ingress';
export type FrameworkProjectApiLifecycle =
  | 'internal'
  | 'preview'
  | 'stable'
  | 'deprecated'
  | 'retired';

export interface FrameworkProjectApiDeprecation {
  readonly announcedOn: string;
  readonly sunsetOn: string;
  readonly replacement: string | null;
  readonly migration: string | null;
}

export interface FrameworkProjectApiCompatibility {
  readonly operation: string;
  readonly audience: FrameworkProjectApiAudience;
  readonly host: FrameworkProjectApiHost;
  readonly lifecycle: FrameworkProjectApiLifecycle;
  readonly apiMajor: number | null;
  readonly compatibilityBaselineId: string | null;
  readonly supportPolicyId: string | null;
  readonly deprecation: FrameworkProjectApiDeprecation | null;
}

export interface FrameworkProjectCapability {
  readonly id: string;
  readonly kind: 'module';
  readonly owner: string;
  readonly package: {
    readonly name: string;
    readonly version: string;
  };
  readonly features: readonly FrameworkProjectCapabilityFeature[];
  readonly operations: readonly string[];
}

export interface FrameworkProjectDescriptor {
  readonly format: typeof FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT;
  readonly schemaVersion: typeof FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION;
  readonly project: { readonly id: string };
  readonly capabilities: readonly FrameworkProjectCapability[];
  readonly compatibility: {
    readonly compiler: {
      readonly package: typeof FRAMEWORK_COMPILER_PACKAGE;
      readonly version: string;
    };
    readonly projectModelSchemaVersion: typeof FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION;
    readonly moduleDescriptorSchemaVersion: typeof FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION;
    readonly api: readonly FrameworkProjectApiCompatibility[];
  };
  readonly digest: string;
}

export interface FrameworkProjectCapabilityRequirement {
  readonly id: string;
  readonly features?: readonly FrameworkProjectCapabilityFeature[];
  readonly operations?: readonly string[];
}

export interface FrameworkProjectDescriptorExpectation {
  readonly compilerVersion: string;
  readonly projectId: string;
  readonly digest?: string;
  readonly requiredCapabilities?: readonly FrameworkProjectCapabilityRequirement[];
  readonly allowedCapabilityIds: readonly string[];
}

export interface FrameworkProjectDescriptorAssetsInput {
  readonly contractText: string;
  readonly schemaText: string;
}

export interface ValidatedFrameworkProjectDescriptorAssets {
  readonly coordinate: typeof FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE;
  readonly contractFormat: typeof FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_FORMAT;
  readonly contractVersion: typeof FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION;
  readonly contractSha256: typeof FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_SHA256;
  readonly schemaId: typeof FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID;
  readonly schemaSha256: typeof FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_SHA256;
  readonly descriptorFormat: typeof FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT;
  readonly descriptorSchemaVersion: typeof FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION;
}

export interface FrameworkOpsProjectCapability {
  readonly id: string;
  readonly owner: string;
  readonly packageName: string;
  readonly packageVersion: string;
  readonly features: readonly FrameworkProjectCapabilityFeature[];
  readonly operations: readonly string[];
}

export interface FrameworkOpsProjectIntegration {
  readonly schemaVersion: 1;
  readonly kind: 'unisane.framework-ops-project';
  readonly projectId: string;
  readonly source: {
    readonly contractCoordinate: typeof FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE;
    readonly contractVersion: typeof FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION;
    readonly schemaId: typeof FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID;
    readonly descriptorFormat: typeof FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT;
    readonly descriptorSchemaVersion: typeof FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION;
    readonly descriptorDigest: string;
  };
  readonly compiler: {
    readonly package: typeof FRAMEWORK_COMPILER_PACKAGE;
    readonly version: string;
    readonly projectModelSchemaVersion: typeof FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION;
    readonly moduleDescriptorSchemaVersion: typeof FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION;
  };
  readonly capabilities: readonly FrameworkOpsProjectCapability[];
  readonly apiCompatibility: readonly FrameworkProjectApiCompatibility[];
}

export interface ValidateAndMapFrameworkProjectDescriptorInput extends FrameworkProjectDescriptorAssetsInput {
  readonly descriptorText: string;
  readonly expectation: FrameworkProjectDescriptorExpectation;
}

export type FrameworkProjectDescriptorValidationCode =
  | 'project-descriptor-invalid'
  | 'project-descriptor-contract-unsupported'
  | 'project-descriptor-schema-unsupported'
  | 'project-descriptor-version-unsupported'
  | 'project-descriptor-digest-mismatch'
  | 'project-descriptor-identity-mismatch'
  | 'project-descriptor-capability-missing'
  | 'project-descriptor-capability-unrecognized'
  | 'project-descriptor-compatibility-unsupported';

export class FrameworkProjectDescriptorValidationError extends TypeError {
  readonly code: FrameworkProjectDescriptorValidationCode;
  readonly path: string;

  constructor(args: {
    readonly code?: FrameworkProjectDescriptorValidationCode;
    readonly path: string;
    readonly message: string;
  }) {
    super(`${args.path}: ${args.message}`);
    this.name = 'FrameworkProjectDescriptorValidationError';
    this.code = args.code ?? 'project-descriptor-invalid';
    this.path = args.path;
  }
}
