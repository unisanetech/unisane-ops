import {
  FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE,
  FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION,
  FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID,
  type FrameworkOpsProjectIntegration,
  type FrameworkProjectApiCompatibility,
  type FrameworkProjectDescriptor,
  type ValidateAndMapFrameworkProjectDescriptorInput,
} from './contracts.js';
import {
  parseFrameworkProjectDescriptor,
  validateFrameworkProjectDescriptorAssets,
} from './validator.js';

function mapApiCompatibility(
  record: FrameworkProjectApiCompatibility,
): FrameworkProjectApiCompatibility {
  return Object.freeze({
    operation: record.operation,
    audience: record.audience,
    host: record.host,
    lifecycle: record.lifecycle,
    apiMajor: record.apiMajor,
    compatibilityBaselineId: record.compatibilityBaselineId,
    supportPolicyId: record.supportPolicyId,
    deprecation: record.deprecation
      ? Object.freeze({
          announcedOn: record.deprecation.announcedOn,
          sunsetOn: record.deprecation.sunsetOn,
          replacement: record.deprecation.replacement,
          migration: record.deprecation.migration,
        })
      : null,
  });
}

export function mapFrameworkProjectDescriptorToOps(
  descriptor: FrameworkProjectDescriptor,
): FrameworkOpsProjectIntegration {
  return Object.freeze({
    schemaVersion: 1,
    kind: 'unisane.framework-ops-project',
    projectId: descriptor.project.id,
    source: Object.freeze({
      contractCoordinate: FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE,
      contractVersion: FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_VERSION,
      schemaId: FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID,
      descriptorFormat: descriptor.format,
      descriptorSchemaVersion: descriptor.schemaVersion,
      descriptorDigest: descriptor.digest,
    }),
    compiler: Object.freeze({
      package: descriptor.compatibility.compiler.package,
      version: descriptor.compatibility.compiler.version,
      projectModelSchemaVersion: descriptor.compatibility.projectModelSchemaVersion,
      moduleDescriptorSchemaVersion: descriptor.compatibility.moduleDescriptorSchemaVersion,
    }),
    capabilities: Object.freeze(
      descriptor.capabilities.map((capability) =>
        Object.freeze({
          id: capability.id,
          owner: capability.owner,
          packageName: capability.package.name,
          packageVersion: capability.package.version,
          features: Object.freeze([...capability.features]),
          operations: Object.freeze([...capability.operations]),
        }),
      ),
    ),
    apiCompatibility: Object.freeze(descriptor.compatibility.api.map(mapApiCompatibility)),
  });
}

export function validateAndMapFrameworkProjectDescriptor(
  input: ValidateAndMapFrameworkProjectDescriptorInput,
): FrameworkOpsProjectIntegration {
  validateFrameworkProjectDescriptorAssets({
    contractText: input.contractText,
    schemaText: input.schemaText,
  });
  return mapFrameworkProjectDescriptorToOps(
    parseFrameworkProjectDescriptor(input.descriptorText, input.expectation),
  );
}
