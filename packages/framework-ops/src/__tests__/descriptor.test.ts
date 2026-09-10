import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FRAMEWORK_COMPILER_VERSION,
  FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE,
  FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID,
  FrameworkProjectDescriptorValidationError,
  mapFrameworkProjectDescriptorToOps,
  parseFrameworkProjectDescriptor,
  validateAndMapFrameworkProjectDescriptor,
  validateFrameworkProjectDescriptorAssets,
  type FrameworkProjectDescriptorExpectation,
  type FrameworkProjectDescriptorValidationCode,
} from '../index.js';

const fixtureRoot = new URL(
  '../../tests/fixtures/project-descriptor-contract/v1/',
  import.meta.url,
);
const contractText = readFileSync(new URL('contract.json.fixture', fixtureRoot), 'utf8');
const schemaText = readFileSync(
  new URL('framework-project-descriptor.schema.json.fixture', fixtureRoot),
  'utf8',
);

function fixture(name: string): string {
  return readFileSync(new URL(`fixtures/${name}.json`, fixtureRoot), 'utf8');
}

function expectation(
  overrides: Partial<FrameworkProjectDescriptorExpectation> = {},
): FrameworkProjectDescriptorExpectation {
  return {
    compilerVersion: '0.1.0',
    projectId: 'fixture-project',
    allowedCapabilityIds: ['simple'],
    requiredCapabilities: [{ id: 'simple' }],
    ...overrides,
  };
}

function expectValidationError(
  run: () => unknown,
  code: FrameworkProjectDescriptorValidationCode,
): void {
  try {
    run();
    throw new Error(`Expected ${code}.`);
  } catch (error) {
    expect(error).toBeInstanceOf(FrameworkProjectDescriptorValidationError);
    expect(error).toMatchObject({ code });
  }
}

describe('Framework project descriptor assets', () => {
  it('admits only the exact portable V1 contract and JSON Schema bytes', () => {
    expect(validateFrameworkProjectDescriptorAssets({ contractText, schemaText })).toEqual({
      coordinate: FRAMEWORK_PROJECT_DESCRIPTOR_CONTRACT_COORDINATE,
      contractFormat: 'unisane.framework-project-descriptor-contract',
      contractVersion: 1,
      contractSha256: 'af269188a83a2f7a27a815738f34377887311b1e49e349a5bff2a6322d9f5d9a',
      schemaId: FRAMEWORK_PROJECT_DESCRIPTOR_SCHEMA_ID,
      schemaSha256: '6f78377766bb0baeabb863efe37577692aa9a007b4ea257576b190c6eed73db4',
      descriptorFormat: 'unisane.framework-project-descriptor',
      descriptorSchemaVersion: 1,
    });
  });

  it('rejects unsupported contract and schema identities before descriptor parsing', () => {
    expectValidationError(
      () =>
        validateFrameworkProjectDescriptorAssets({
          contractText: contractText.replace('"contractVersion": 1', '"contractVersion": 2'),
          schemaText,
        }),
      'project-descriptor-contract-unsupported',
    );
    expectValidationError(
      () =>
        validateFrameworkProjectDescriptorAssets({
          contractText: contractText.replace(
            `"version": "${FRAMEWORK_COMPILER_VERSION}"`,
            '"version": "9.9.9"',
          ),
          schemaText,
        }),
      'project-descriptor-contract-unsupported',
    );
    expectValidationError(
      () =>
        validateFrameworkProjectDescriptorAssets({
          contractText,
          schemaText: schemaText.replace(
            'framework-project-descriptor.v1.json',
            'framework-project-descriptor.v2.json',
          ),
        }),
      'project-descriptor-schema-unsupported',
    );
  });
});

describe('Framework project descriptor validation and mapping', () => {
  it('validates canonical descriptor bytes and maps static facts into the Ops model', () => {
    const mapped = validateAndMapFrameworkProjectDescriptor({
      contractText,
      schemaText,
      descriptorText: fixture('valid'),
      expectation: expectation({
        digest: 'a0a86a54494b569cf434820eff2a2a3bac79fdf1b64a0788261516a5e416edb8',
      }),
    });

    expect(mapped).toEqual({
      schemaVersion: 1,
      kind: 'unisane.framework-ops-project',
      projectId: 'fixture-project',
      source: {
        contractCoordinate: '@unisane/compiler/project-descriptor-contract/v1',
        contractVersion: 1,
        schemaId: 'https://unisane.dev/schemas/framework-project-descriptor.v1.json',
        descriptorFormat: 'unisane.framework-project-descriptor',
        descriptorSchemaVersion: 1,
        descriptorDigest: 'a0a86a54494b569cf434820eff2a2a3bac79fdf1b64a0788261516a5e416edb8',
      },
      compiler: {
        package: '@unisane/compiler',
        version: '0.1.0',
        projectModelSchemaVersion: 3,
        moduleDescriptorSchemaVersion: 2,
      },
      capabilities: [
        {
          id: 'simple',
          owner: '@fixture/simple',
          packageName: '@fixture/simple',
          packageVersion: '1.2.3',
          features: [],
          operations: [],
        },
      ],
      apiCompatibility: [
        {
          operation: 'simple.create',
          audience: 'public',
          host: 'external-api',
          lifecycle: 'stable',
          apiMajor: 1,
          compatibilityBaselineId: 'simple-v1',
          supportPolicyId: 'standard',
          deprecation: null,
        },
      ],
    });
    expect(Object.isFrozen(mapped)).toBe(true);
    expect(Object.isFrozen(mapped.capabilities)).toBe(true);
    expect(Object.isFrozen(mapped.apiCompatibility)).toBe(true);
    expect(JSON.stringify(mapped)).not.toMatch(/handler|command|argv|cwd|sourcePath/u);
  });

  it('keeps parsing and Ops mapping as separate deterministic operations', () => {
    const descriptor = parseFrameworkProjectDescriptor(fixture('valid'), expectation());
    expect(mapFrameworkProjectDescriptorToOps(descriptor)).toEqual(
      validateAndMapFrameworkProjectDescriptor({
        contractText,
        schemaText,
        descriptorText: fixture('valid'),
        expectation: expectation(),
      }),
    );
  });

  it('rejects tampered descriptor content through the canonical SHA-256 digest', () => {
    expectValidationError(
      () => parseFrameworkProjectDescriptor(fixture('tampered-digest'), expectation()),
      'project-descriptor-digest-mismatch',
    );
  });

  it('rejects unsupported descriptor schema versions', () => {
    expectValidationError(
      () => parseFrameworkProjectDescriptor(fixture('unsupported-schema'), expectation()),
      'project-descriptor-version-unsupported',
    );
  });

  it('rejects contradictory project identity', () => {
    expectValidationError(
      () => parseFrameworkProjectDescriptor(fixture('identity-mismatch'), expectation()),
      'project-descriptor-identity-mismatch',
    );
  });

  it('rejects missing requested and unrecognized provided capabilities', () => {
    expectValidationError(
      () => parseFrameworkProjectDescriptor(fixture('missing-capability'), expectation()),
      'project-descriptor-capability-missing',
    );
    expectValidationError(
      () =>
        parseFrameworkProjectDescriptor(
          fixture('valid'),
          expectation({ allowedCapabilityIds: [], requiredCapabilities: [] }),
        ),
      'project-descriptor-capability-unrecognized',
    );
  });

  it('rejects unsupported compatibility versions and lifecycle contradictions', () => {
    expectValidationError(
      () => parseFrameworkProjectDescriptor(fixture('unsupported-compatibility'), expectation()),
      'project-descriptor-compatibility-unsupported',
    );
    expectValidationError(
      () => parseFrameworkProjectDescriptor(fixture('contradictory-compatibility'), expectation()),
      'project-descriptor-compatibility-unsupported',
    );
    expectValidationError(
      () =>
        parseFrameworkProjectDescriptor(
          fixture('valid'),
          expectation({ compilerVersion: '9.9.9' }),
        ),
      'project-descriptor-compatibility-unsupported',
    );

    const descriptor = JSON.parse(fixture('valid')) as Record<string, unknown> & {
      compatibility: { compiler: { version: string } };
      digest: string;
    };
    descriptor.compatibility.compiler.version = '9.9.9';
    const { digest: ignoredDigest, ...core } = descriptor;
    void ignoredDigest;
    descriptor.digest = createHash('sha256').update(JSON.stringify(core), 'utf8').digest('hex');
    expectValidationError(
      () =>
        parseFrameworkProjectDescriptor(
          `${JSON.stringify(descriptor, null, 2)}\n`,
          expectation({ compilerVersion: '9.9.9' }),
        ),
      'project-descriptor-compatibility-unsupported',
    );
  });
  it('rejects obsolete module compatibility even with a valid updated digest', () => {
    const descriptor = JSON.parse(fixture('valid')) as {
      compatibility: { moduleDescriptorSchemaVersion: number };
      digest: string;
    };
    descriptor.compatibility.moduleDescriptorSchemaVersion = 1;
    const { digest: ignoredDigest, ...core } = descriptor;
    void ignoredDigest;
    descriptor.digest = createHash('sha256').update(JSON.stringify(core), 'utf8').digest('hex');
    expectValidationError(
      () => parseFrameworkProjectDescriptor(`${JSON.stringify(descriptor, null, 2)}\n`, expectation()),
      'project-descriptor-compatibility-unsupported',
    );
  });

});
