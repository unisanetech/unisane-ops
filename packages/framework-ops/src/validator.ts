import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import {
  FRAMEWORK_COMPILER_PACKAGE,
  FRAMEWORK_COMPILER_VERSION,
  FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION,
  FRAMEWORK_PROJECT_CAPABILITY_FEATURES,
  FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE,
  FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_FORMAT,
  FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_SHA256,
  FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION,
  FRAMEWORK_PROJECT_DESCRIPTOR_CORE_KEY_ORDER,
  FRAMEWORK_PROJECT_DESCRIPTOR_DOCUMENT_KEY_ORDER,
  FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT,
  FRAMEWORK_PROJECT_DESCRIPTOR_NESTED_KEY_ORDER,
  FRAMEWORK_PROJECT_DESCRIPTOR_OUTPUT_PATH,
  FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID,
  FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_SHA256,
  FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION,
  FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION,
  FrameworkProjectDescriptorValidationError,
  type FrameworkProjectApiAudience,
  type FrameworkProjectApiCompatibility,
  type FrameworkProjectApiDeprecation,
  type FrameworkProjectApiHost,
  type FrameworkProjectApiLifecycle,
  type FrameworkProjectCapability,
  type FrameworkProjectCapabilityRequirement,
  type FrameworkProjectDescriptor,
  type FrameworkProjectDescriptorAssetsInput,
  type FrameworkProjectDescriptorExpectation,
  type FrameworkProjectDescriptorValidationCode,
  type ValidatedFrameworkProjectDescriptorAssets,
} from './contracts.js';

type DataObject = Readonly<Record<string, unknown>>;

const SHA256 = /^[a-f0-9]{64}$/u;
const IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*|[a-z0-9][a-z0-9._-]*)$/u;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u;
const API_AUDIENCES = Object.freeze([
  'first-party',
  'partner',
  'public',
  'operator',
  'protocol',
  'provider-ingress',
] as const);
const API_HOSTS = Object.freeze([
  'application',
  'external-api',
  'operator',
  'protocol',
  'provider-ingress',
] as const);
const API_LIFECYCLES = Object.freeze([
  'internal',
  'preview',
  'stable',
  'deprecated',
  'retired',
] as const);

function fail(
  path: string,
  message: string,
  code: FrameworkProjectDescriptorValidationCode = 'project-descriptor-invalid',
): never {
  throw new FrameworkProjectDescriptorValidationError({ path, message, code });
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function propertyPath(path: string, property: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(property)
    ? `${path}.${property}`
    : `${path}[${JSON.stringify(property)}]`;
}

function parseJsonText(
  content: unknown,
  path: string,
  code: FrameworkProjectDescriptorValidationCode,
): unknown {
  if (typeof content !== 'string') return fail(path, 'must be serialized JSON text.', code);
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return fail(path, 'must be valid JSON.', code);
  }
}

function readObject(value: unknown, path: string, properties: readonly string[]): DataObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return fail(path, 'must be a plain object.');
  }
  const prototype = Reflect.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return fail(path, 'must be a plain object.');
  }
  const allowed = new Set(properties);
  const result: Record<string, unknown> = {};
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key === 'symbol') return fail(path, 'must not contain symbol keys.');
    if (!allowed.has(key)) return fail(propertyPath(path, key), 'is not a supported property.');
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !descriptor.enumerable || !('value' in descriptor)) {
      return fail(propertyPath(path, key), 'must be an enumerable static data property.');
    }
    result[key] = descriptor.value as unknown;
  }
  return result;
}

function required(object: DataObject, property: string, path: string): unknown {
  if (!Object.hasOwn(object, property)) return fail(propertyPath(path, property), 'is required.');
  return object[property];
}

function nestedObject(value: unknown, path: string): DataObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return fail(path, 'must be an object.');
  }
  return value as DataObject;
}

function text(value: unknown, path: string): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value !== value.trim() ||
    /\p{Cc}/u.test(value)
  ) {
    return fail(path, 'must be one exact non-blank string without control characters.');
  }
  return value;
}

function nullableText(value: unknown, path: string): string | null {
  return value === null ? null : text(value, path);
}

function identifier(value: unknown, path: string): string {
  const parsed = text(value, path);
  if (!IDENTIFIER.test(parsed)) return fail(path, 'must be one lowercase kebab-case identifier.');
  return parsed;
}

function packageName(value: unknown, path: string): string {
  const parsed = text(value, path);
  if (!PACKAGE_NAME.test(parsed)) return fail(path, 'must be one exact npm package name.');
  return parsed;
}

function digest(value: unknown, path: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    return fail(path, 'must be one lowercase SHA-256 digest.');
  }
  return value;
}

function array<T>(
  value: unknown,
  path: string,
  parse: (item: unknown, itemPath: string) => T,
): readonly T[] {
  if (!Array.isArray(value) || Reflect.getPrototypeOf(value) !== Array.prototype) {
    return fail(path, 'must be a plain array.');
  }
  return Object.freeze(value.map((item, index) => parse(item, `${path}[${index}]`)));
}

function oneOf<T extends string>(value: unknown, path: string, values: readonly T[]): T {
  const parsed = text(value, path);
  if (!values.includes(parsed as T)) {
    return fail(path, `must be one of ${values.map((entry) => JSON.stringify(entry)).join(', ')}.`);
  }
  return parsed as T;
}

function sortedUnique<T extends string>(
  value: unknown,
  path: string,
  parse: (item: unknown, itemPath: string) => T,
): readonly T[] {
  const parsed = [...array(value, path, parse)].sort(compareStrings);
  for (let index = 1; index < parsed.length; index += 1) {
    if (parsed[index - 1] === parsed[index]) return fail(path, 'must not contain duplicates.');
  }
  return Object.freeze(parsed);
}

function assertExactValue(
  actual: unknown,
  expected: unknown,
  path: string,
  code: FrameworkProjectDescriptorValidationCode,
): void {
  if (!isDeepStrictEqual(actual, expected)) {
    fail(path, `must equal ${JSON.stringify(expected)}.`, code);
  }
}

function validateContractIdentity(contract: unknown): void {
  const code = 'project-descriptor-contract-unsupported';
  const object = nestedObject(contract, '$contract');
  assertExactValue(
    object.format,
    FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_FORMAT,
    '$contract.format',
    code,
  );
  assertExactValue(
    object.contractVersion,
    FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION,
    '$contract.contractVersion',
    code,
  );
  const descriptor = nestedObject(object.descriptor, '$contract.descriptor');
  assertExactValue(
    descriptor.outputPath,
    FRAMEWORK_PROJECT_DESCRIPTOR_OUTPUT_PATH,
    '$contract.descriptor.outputPath',
    code,
  );
  assertExactValue(
    descriptor.format,
    FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT,
    '$contract.descriptor.format',
    code,
  );
  assertExactValue(
    descriptor.schemaVersion,
    FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION,
    '$contract.descriptor.schemaVersion',
    code,
  );
  assertExactValue(
    descriptor.jsonSchema,
    './framework-project-descriptor.schema.json',
    '$contract.descriptor.jsonSchema',
    code,
  );
  const compiler = nestedObject(descriptor.compiler, '$contract.descriptor.compiler');
  assertExactValue(
    compiler.package,
    FRAMEWORK_COMPILER_PACKAGE,
    '$contract.descriptor.compiler.package',
    code,
  );
  assertExactValue(
    compiler.version,
    FRAMEWORK_COMPILER_VERSION,
    '$contract.descriptor.compiler.version',
    code,
  );
  assertExactValue(
    descriptor.projectModelSchemaVersion,
    FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION,
    '$contract.descriptor.projectModelSchemaVersion',
    code,
  );
  assertExactValue(
    descriptor.moduleDescriptorSchemaVersion,
    FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION,
    '$contract.descriptor.moduleDescriptorSchemaVersion',
    code,
  );
  const canonicalization = nestedObject(object.canonicalization, '$contract.canonicalization');
  assertExactValue(
    canonicalization.coreKeyOrder,
    FRAMEWORK_PROJECT_DESCRIPTOR_CORE_KEY_ORDER,
    '$contract.canonicalization.coreKeyOrder',
    code,
  );
  assertExactValue(
    canonicalization.documentKeyOrder,
    FRAMEWORK_PROJECT_DESCRIPTOR_DOCUMENT_KEY_ORDER,
    '$contract.canonicalization.documentKeyOrder',
    code,
  );
  assertExactValue(
    canonicalization.nestedObjectKeyOrder,
    FRAMEWORK_PROJECT_DESCRIPTOR_NESTED_KEY_ORDER,
    '$contract.canonicalization.nestedObjectKeyOrder',
    code,
  );
  const digestContract = nestedObject(canonicalization.digest, '$contract.canonicalization.digest');
  assertExactValue(
    digestContract.algorithm,
    'sha256',
    '$contract.canonicalization.digest.algorithm',
    code,
  );
  assertExactValue(
    digestContract.inputExpression,
    'JSON.stringify(core)',
    '$contract.canonicalization.digest.inputExpression',
    code,
  );
  assertExactValue(
    digestContract.excludedProperties,
    ['digest'],
    '$contract.canonicalization.digest.excludedProperties',
    code,
  );
  assertExactValue(
    digestContract.outputEncoding,
    'lowercase-hex',
    '$contract.canonicalization.digest.outputEncoding',
    code,
  );
  assertExactValue(
    canonicalization.serializationExpression,
    'JSON.stringify(descriptor, null, 2) + "\\n"',
    '$contract.canonicalization.serializationExpression',
    code,
  );
}

function validateSchemaIdentity(schema: unknown): void {
  const code = 'project-descriptor-schema-unsupported';
  const object = nestedObject(schema, '$schema');
  assertExactValue(
    object.$schema,
    'https://json-schema.org/draft/2020-12/schema',
    '$schema.$schema',
    code,
  );
  assertExactValue(object.$id, FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID, '$schema.$id', code);
  assertExactValue(
    object.required,
    ['format', 'schemaVersion', 'project', 'capabilities', 'compatibility', 'digest'],
    '$schema.required',
    code,
  );
  const properties = nestedObject(object.properties, '$schema.properties');
  assertExactValue(
    nestedObject(properties.format, '$schema.properties.format').const,
    FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT,
    '$schema.properties.format.const',
    code,
  );
  assertExactValue(
    nestedObject(properties.schemaVersion, '$schema.properties.schemaVersion').const,
    FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION,
    '$schema.properties.schemaVersion.const',
    code,
  );
  const definitions = nestedObject(object.$defs, '$schema.$defs');
  const compatibility = nestedObject(definitions.compatibility, '$schema.$defs.compatibility');
  const compatibilityProperties = nestedObject(
    compatibility.properties,
    '$schema.$defs.compatibility.properties',
  );
  assertExactValue(
    nestedObject(
      compatibilityProperties.projectModelSchemaVersion,
      '$schema.$defs.compatibility.properties.projectModelSchemaVersion',
    ).const,
    FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION,
    '$schema.$defs.compatibility.properties.projectModelSchemaVersion.const',
    code,
  );
  assertExactValue(
    nestedObject(
      compatibilityProperties.moduleDescriptorSchemaVersion,
      '$schema.$defs.compatibility.properties.moduleDescriptorSchemaVersion',
    ).const,
    FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION,
    '$schema.$defs.compatibility.properties.moduleDescriptorSchemaVersion.const',
    code,
  );
}

export function validateFrameworkProjectDescriptorAssets(
  input: FrameworkProjectDescriptorAssetsInput,
): ValidatedFrameworkProjectDescriptorAssets {
  const contract = parseJsonText(
    input.contractText,
    '$contract',
    'project-descriptor-contract-unsupported',
  );
  validateContractIdentity(contract);
  if (sha256(input.contractText) !== FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_SHA256) {
    fail(
      '$contract',
      `bytes do not match ${FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE}.`,
      'project-descriptor-contract-unsupported',
    );
  }

  const schema = parseJsonText(
    input.schemaText,
    '$schema',
    'project-descriptor-schema-unsupported',
  );
  validateSchemaIdentity(schema);
  if (sha256(input.schemaText) !== FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_SHA256) {
    fail(
      '$schema',
      `bytes do not match ${FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID}.`,
      'project-descriptor-schema-unsupported',
    );
  }

  return Object.freeze({
    coordinate: FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE,
    contractFormat: FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_FORMAT,
    contractVersion: FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION,
    contractSha256: FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_SHA256,
    schemaId: FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID,
    schemaSha256: FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_SHA256,
    descriptorFormat: FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT,
    descriptorSchemaVersion: FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION,
  });
}

function project(value: unknown, path: string): FrameworkProjectDescriptor['project'] {
  const object = readObject(value, path, ['id']);
  return Object.freeze({ id: identifier(required(object, 'id', path), `${path}.id`) });
}

function capability(value: unknown, path: string): FrameworkProjectCapability {
  const object = readObject(value, path, [
    'id',
    'kind',
    'owner',
    'package',
    'features',
    'operations',
  ]);
  const kind = required(object, 'kind', path);
  if (kind !== 'module') return fail(`${path}.kind`, 'must be "module".');
  const packagePath = `${path}.package`;
  const packageObject = readObject(required(object, 'package', path), packagePath, [
    'name',
    'version',
  ]);
  const owner = packageName(required(object, 'owner', path), `${path}.owner`);
  const name = packageName(required(packageObject, 'name', packagePath), `${packagePath}.name`);
  if (owner !== name) return fail(`${path}.owner`, 'must match package.name exactly.');
  return Object.freeze({
    id: identifier(required(object, 'id', path), `${path}.id`),
    kind,
    owner,
    package: Object.freeze({
      name,
      version: text(required(packageObject, 'version', packagePath), `${packagePath}.version`),
    }),
    features: sortedUnique(
      required(object, 'features', path),
      `${path}.features`,
      (item, itemPath) => oneOf(item, itemPath, FRAMEWORK_PROJECT_CAPABILITY_FEATURES),
    ),
    operations: sortedUnique(required(object, 'operations', path), `${path}.operations`, text),
  });
}

function capabilities(value: unknown, path: string): readonly FrameworkProjectCapability[] {
  const parsed = [...array(value, path, capability)].sort((left, right) =>
    compareStrings(left.id, right.id),
  );
  for (let index = 1; index < parsed.length; index += 1) {
    if (parsed[index - 1]?.id === parsed[index]?.id) {
      return fail(
        path,
        `must not contain duplicate capability ${JSON.stringify(parsed[index]?.id)}.`,
      );
    }
  }
  return Object.freeze(parsed);
}

function deprecation(value: unknown, path: string): FrameworkProjectApiDeprecation | null {
  if (value === null) return null;
  const object = readObject(value, path, ['announcedOn', 'sunsetOn', 'replacement', 'migration']);
  return Object.freeze({
    announcedOn: text(required(object, 'announcedOn', path), `${path}.announcedOn`),
    sunsetOn: text(required(object, 'sunsetOn', path), `${path}.sunsetOn`),
    replacement: nullableText(required(object, 'replacement', path), `${path}.replacement`),
    migration: nullableText(required(object, 'migration', path), `${path}.migration`),
  });
}

function exactIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateApiCompatibilityLifecycle(
  record: FrameworkProjectApiCompatibility,
  path: string,
): void {
  const incompatible = (property: string, message: string): never =>
    fail(`${path}.${property}`, message, 'project-descriptor-compatibility-unsupported');
  const external = record.audience === 'public' || record.audience === 'partner';
  if (external) {
    if (record.host !== 'external-api') {
      incompatible('host', `${record.audience} exposure requires host "external-api".`);
    }
    if (record.apiMajor === null) {
      incompatible('apiMajor', `${record.audience} exposure requires a positive apiMajor.`);
    }
    if (record.lifecycle === 'internal' || record.lifecycle === 'retired') {
      incompatible(
        'lifecycle',
        `${record.audience} exposure cannot use lifecycle ${JSON.stringify(record.lifecycle)}.`,
      );
    }
    if (record.lifecycle === 'preview') {
      if (
        record.compatibilityBaselineId !== null ||
        record.supportPolicyId !== null ||
        record.deprecation !== null
      ) {
        incompatible(
          'lifecycle',
          'preview exposure cannot declare stable baseline, support, or deprecation facts.',
        );
      }
      return;
    }
    if (record.compatibilityBaselineId === null) {
      incompatible(
        'compatibilityBaselineId',
        `${record.lifecycle} exposure requires compatibilityBaselineId.`,
      );
    }
    if (record.supportPolicyId === null) {
      incompatible('supportPolicyId', `${record.lifecycle} exposure requires supportPolicyId.`);
    }
    if (record.lifecycle === 'stable') {
      if (record.deprecation !== null) {
        incompatible('deprecation', 'stable exposure cannot declare deprecation facts.');
      }
      return;
    }
    const lifecycleDeprecation = record.deprecation;
    if (lifecycleDeprecation === null) {
      return incompatible('deprecation', 'deprecated exposure requires deprecation facts.');
    }
    if (
      !exactIsoDate(lifecycleDeprecation.announcedOn) ||
      !exactIsoDate(lifecycleDeprecation.sunsetOn) ||
      lifecycleDeprecation.sunsetOn <= lifecycleDeprecation.announcedOn
    ) {
      incompatible(
        'deprecation',
        'deprecated exposure requires exact ISO announcement and later sunset dates.',
      );
    }
    if (lifecycleDeprecation.replacement === null && lifecycleDeprecation.migration === null) {
      incompatible(
        'deprecation',
        'deprecated exposure requires an exact replacement or migration reference.',
      );
    }
    return;
  }

  const expectedHost = {
    'first-party': 'application',
    operator: 'operator',
    protocol: 'protocol',
    'provider-ingress': 'provider-ingress',
  } as const;
  if (record.host !== expectedHost[record.audience]) {
    incompatible(
      'host',
      `${record.audience} exposure requires host ${JSON.stringify(expectedHost[record.audience])}.`,
    );
  }
  if (record.lifecycle !== 'internal') {
    incompatible('lifecycle', `${record.audience} exposure requires lifecycle "internal".`);
  }
  if (
    record.apiMajor !== null ||
    record.compatibilityBaselineId !== null ||
    record.supportPolicyId !== null ||
    record.deprecation !== null
  ) {
    incompatible(
      'lifecycle',
      `${record.audience} internal lifecycle cannot declare external compatibility facts.`,
    );
  }
}

function apiCompatibility(value: unknown, path: string): FrameworkProjectApiCompatibility {
  const object = readObject(value, path, [
    'operation',
    'audience',
    'host',
    'lifecycle',
    'apiMajor',
    'compatibilityBaselineId',
    'supportPolicyId',
    'deprecation',
  ]);
  const apiMajorValue = required(object, 'apiMajor', path);
  if (
    apiMajorValue !== null &&
    (!Number.isSafeInteger(apiMajorValue) || (apiMajorValue as number) < 1)
  ) {
    return fail(`${path}.apiMajor`, 'must be null or one positive safe integer.');
  }
  const result = Object.freeze({
    operation: text(required(object, 'operation', path), `${path}.operation`),
    audience: oneOf(
      required(object, 'audience', path),
      `${path}.audience`,
      API_AUDIENCES,
    ) as FrameworkProjectApiAudience,
    host: oneOf(
      required(object, 'host', path),
      `${path}.host`,
      API_HOSTS,
    ) as FrameworkProjectApiHost,
    lifecycle: oneOf(
      required(object, 'lifecycle', path),
      `${path}.lifecycle`,
      API_LIFECYCLES,
    ) as FrameworkProjectApiLifecycle,
    apiMajor: apiMajorValue as number | null,
    compatibilityBaselineId: nullableText(
      required(object, 'compatibilityBaselineId', path),
      `${path}.compatibilityBaselineId`,
    ),
    supportPolicyId: nullableText(
      required(object, 'supportPolicyId', path),
      `${path}.supportPolicyId`,
    ),
    deprecation: deprecation(required(object, 'deprecation', path), `${path}.deprecation`),
  });
  validateApiCompatibilityLifecycle(result, path);
  return result;
}

function compatibility(value: unknown, path: string): FrameworkProjectDescriptor['compatibility'] {
  const object = readObject(value, path, [
    'compiler',
    'projectModelSchemaVersion',
    'moduleDescriptorSchemaVersion',
    'api',
  ]);
  const compilerPath = `${path}.compiler`;
  const compiler = readObject(required(object, 'compiler', path), compilerPath, [
    'package',
    'version',
  ]);
  if (required(compiler, 'package', compilerPath) !== FRAMEWORK_COMPILER_PACKAGE) {
    return fail(
      `${compilerPath}.package`,
      `must be ${JSON.stringify(FRAMEWORK_COMPILER_PACKAGE)}.`,
      'project-descriptor-compatibility-unsupported',
    );
  }
  if (
    required(object, 'projectModelSchemaVersion', path) !== FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION
  ) {
    return fail(
      `${path}.projectModelSchemaVersion`,
      `unsupported ProjectModel schema; supported version is ${FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION}.`,
      'project-descriptor-compatibility-unsupported',
    );
  }
  if (
    required(object, 'moduleDescriptorSchemaVersion', path) !==
    FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION
  ) {
    return fail(
      `${path}.moduleDescriptorSchemaVersion`,
      `unsupported module descriptor schema; supported version is ${FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION}.`,
      'project-descriptor-compatibility-unsupported',
    );
  }
  const api = [...array(required(object, 'api', path), `${path}.api`, apiCompatibility)].sort(
    (left, right) => compareStrings(JSON.stringify(left), JSON.stringify(right)),
  );
  for (let index = 1; index < api.length; index += 1) {
    if (JSON.stringify(api[index - 1]) === JSON.stringify(api[index])) {
      return fail(`${path}.api`, 'must not contain duplicate compatibility records.');
    }
  }
  return Object.freeze({
    compiler: Object.freeze({
      package: FRAMEWORK_COMPILER_PACKAGE,
      version: text(required(compiler, 'version', compilerPath), `${compilerPath}.version`),
    }),
    projectModelSchemaVersion: FRAMEWORK_PROJECT_MODEL_SCHEMA_VERSION,
    moduleDescriptorSchemaVersion: FRAMEWORK_MODULE_DESCRIPTOR_SCHEMA_VERSION,
    api: Object.freeze(api),
  });
}

function descriptorCore(descriptor: FrameworkProjectDescriptor) {
  return {
    format: descriptor.format,
    schemaVersion: descriptor.schemaVersion,
    project: descriptor.project,
    capabilities: descriptor.capabilities,
    compatibility: descriptor.compatibility,
  } as const;
}

function serializeDescriptor(descriptor: FrameworkProjectDescriptor): string {
  return `${JSON.stringify(descriptor, null, 2)}\n`;
}

function parseRequirement(value: unknown, path: string): FrameworkProjectCapabilityRequirement {
  const object = readObject(value, path, ['id', 'features', 'operations']);
  const id = identifier(required(object, 'id', path), `${path}.id`);
  const featuresValue = object.features;
  const operationsValue = object.operations;
  const features = featuresValue
    ? sortedUnique(featuresValue, `${path}.features`, (item, itemPath) =>
        oneOf(item, itemPath, FRAMEWORK_PROJECT_CAPABILITY_FEATURES),
      )
    : undefined;
  const operations = operationsValue
    ? sortedUnique(operationsValue, `${path}.operations`, text)
    : undefined;
  return Object.freeze({
    id,
    ...(features ? { features } : {}),
    ...(operations ? { operations } : {}),
  });
}

function validateExpectation(
  descriptor: FrameworkProjectDescriptor,
  expectation: FrameworkProjectDescriptorExpectation,
): void {
  const compilerVersion = text(expectation.compilerVersion, '$expectation.compilerVersion');
  const projectId = identifier(expectation.projectId, '$expectation.projectId');
  if (compilerVersion !== FRAMEWORK_COMPILER_VERSION) {
    fail(
      '$expectation.compilerVersion',
      `must equal admitted compiler version ${JSON.stringify(FRAMEWORK_COMPILER_VERSION)}.`,
      'project-descriptor-compatibility-unsupported',
    );
  }
  if (descriptor.compatibility.compiler.version !== compilerVersion) {
    fail(
      '$.compatibility.compiler.version',
      `must match admitted compiler version ${JSON.stringify(compilerVersion)}.`,
      'project-descriptor-compatibility-unsupported',
    );
  }
  if (descriptor.project.id !== projectId) {
    fail(
      '$.project.id',
      `must match expected project ${JSON.stringify(projectId)}.`,
      'project-descriptor-identity-mismatch',
    );
  }
  if (expectation.digest !== undefined) {
    const expectedDigest = digest(expectation.digest, '$expectation.digest');
    if (descriptor.digest !== expectedDigest) {
      fail(
        '$.digest',
        `must match expected digest ${JSON.stringify(expectedDigest)}.`,
        'project-descriptor-identity-mismatch',
      );
    }
  }

  const allowedCapabilityIds = sortedUnique(
    expectation.allowedCapabilityIds,
    '$expectation.allowedCapabilityIds',
    identifier,
  );
  const allowed = new Set(allowedCapabilityIds);
  for (const provided of descriptor.capabilities) {
    if (!allowed.has(provided.id)) {
      fail(
        '$.capabilities',
        `contains unrecognized capability ${JSON.stringify(provided.id)}.`,
        'project-descriptor-capability-unrecognized',
      );
    }
  }

  const requirements = expectation.requiredCapabilities
    ? array(expectation.requiredCapabilities, '$expectation.requiredCapabilities', parseRequirement)
    : [];
  const seen = new Set<string>();
  for (const requirement of requirements) {
    if (seen.has(requirement.id)) {
      fail('$expectation.requiredCapabilities', 'must not contain duplicate capability ids.');
    }
    seen.add(requirement.id);
    if (!allowed.has(requirement.id)) {
      fail(
        '$expectation.requiredCapabilities',
        `requests capability ${JSON.stringify(requirement.id)} outside the allowed capability set.`,
      );
    }
    const provided = descriptor.capabilities.find(({ id }) => id === requirement.id);
    const missingFeatures = requirement.features?.filter(
      (feature) => !provided?.features.includes(feature),
    );
    const missingOperations = requirement.operations?.filter(
      (operation) => !provided?.operations.includes(operation),
    );
    if (!provided || (missingFeatures?.length ?? 0) > 0 || (missingOperations?.length ?? 0) > 0) {
      const facts = [
        ...(missingFeatures ?? []).map((feature) => `feature ${JSON.stringify(feature)}`),
        ...(missingOperations ?? []).map((operation) => `operation ${JSON.stringify(operation)}`),
      ];
      fail(
        '$.capabilities',
        `does not provide requested capability ${JSON.stringify(requirement.id)}${facts.length > 0 ? ` with ${facts.join(', ')}` : ''}.`,
        'project-descriptor-capability-missing',
      );
    }
  }
}

export function parseFrameworkProjectDescriptor(
  content: string,
  expectation: FrameworkProjectDescriptorExpectation,
): FrameworkProjectDescriptor {
  const value = parseJsonText(content, '$', 'project-descriptor-invalid');
  const object = readObject(value, '$', [
    'format',
    'schemaVersion',
    'project',
    'capabilities',
    'compatibility',
    'digest',
  ]);
  const schemaVersion = required(object, 'schemaVersion', '$');
  if (schemaVersion !== FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION) {
    return fail(
      '$.schemaVersion',
      `unsupported descriptor schema; supported version is ${FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION}.`,
      'project-descriptor-version-unsupported',
    );
  }
  if (required(object, 'format', '$') !== FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT) {
    return fail('$.format', `must be ${JSON.stringify(FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT)}.`);
  }
  const descriptor = Object.freeze({
    format: FRAMEWORK_PROJECT_DESCRIPTOR_FORMAT,
    schemaVersion: FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_VERSION,
    project: project(required(object, 'project', '$'), '$.project'),
    capabilities: capabilities(required(object, 'capabilities', '$'), '$.capabilities'),
    compatibility: compatibility(required(object, 'compatibility', '$'), '$.compatibility'),
    digest: digest(required(object, 'digest', '$'), '$.digest'),
  });
  const expectedDigest = sha256(JSON.stringify(descriptorCore(descriptor)));
  if (descriptor.digest !== expectedDigest) {
    return fail(
      '$.digest',
      'does not match the canonical descriptor content.',
      'project-descriptor-digest-mismatch',
    );
  }
  if (content !== serializeDescriptor(descriptor)) {
    return fail('$', 'must use the canonical serialized byte representation.');
  }
  validateExpectation(descriptor, expectation);
  return descriptor;
}
