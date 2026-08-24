import { describe, expect, it } from 'vitest';
import {
  assertPackCommandResult,
  mergeCommandEffects,
  resolveAddItemContributor,
  resolvePackCommand,
  resolveProviderBindingContributor,
  sealPackManifest,
  validatePackGraph,
  verifyPackManifestIntegrity,
  type PackManifestPayload,
} from '../pack.js';

function payload(packId = 'core'): PackManifestPayload {
  return {
    schemaVersion: 1,
    kind: 'unisane.pack-manifest',
    packId,
    packageName: packId === 'core' ? 'unisane-ops' : `@unisane/${packId}`,
    version: '0.1.0',
    packApiVersion: 1,
    trust: 'first-party',
    commands: [
      {
        id: `${packId}.status`,
        path: [packId === 'core' ? 'status' : packId],
        handler: { exportPath: './handlers/status', exportName: 'runStatus' },
        maximumEffect: 'offline',
        writeTargets: [],
        artifactClasses: [],
        riskGuards: [],
        json: true,
      },
    ],
    configNamespaces: [packId],
    addItemTypes: [],
    capabilities: [],
    providerBindings: [],
    reservedRootNames: [],
  };
}

describe('pack contracts', () => {
  it('seals and verifies a trusted exact package/version manifest', () => {
    const manifest = sealPackManifest(payload());
    expect(
      verifyPackManifestIntegrity(manifest, {
        packageName: 'unisane-ops',
        installedVersion: '0.1.0',
        trustedPackageNames: ['unisane-ops'],
      }),
    ).toEqual(manifest);
  });

  it('rejects integrity, trust, package, and installed-version mismatch', () => {
    const manifest = sealPackManifest(payload());
    expect(() =>
      verifyPackManifestIntegrity(
        { ...manifest, integrity: { ...manifest.integrity, manifestHash: '0'.repeat(64) } },
        {
          packageName: 'unisane-ops',
          installedVersion: '0.1.0',
          trustedPackageNames: ['unisane-ops'],
        },
      ),
    ).toThrow('OPS_PACK_INTEGRITY_MISMATCH');
    expect(() =>
      verifyPackManifestIntegrity(manifest, {
        packageName: 'unisane-ops',
        installedVersion: '0.1.0',
        trustedPackageNames: [],
      }),
    ).toThrow('OPS_PACK_UNTRUSTED');
    expect(() =>
      verifyPackManifestIntegrity(manifest, {
        packageName: '@unisane/cloud',
        installedVersion: '0.1.0',
        trustedPackageNames: ['unisane-ops'],
      }),
    ).toThrow('OPS_PACK_PACKAGE_MISMATCH');
    expect(() =>
      verifyPackManifestIntegrity(manifest, {
        packageName: 'unisane-ops',
        installedVersion: '0.2.0',
        trustedPackageNames: ['unisane-ops'],
      }),
    ).toThrow('OPS_PACK_VERSION_MISMATCH');
  });

  it('rejects every graph collision before command resolution', () => {
    const first = sealPackManifest(payload());
    expect(() => validatePackGraph([first, first])).toThrow('Duplicate pack id');
    const second = sealPackManifest({
      ...payload('cloud'),
      commands: [{ ...payload('cloud').commands[0]!, id: first.commands[0]!.id }],
    });
    expect(() => validatePackGraph([first, second])).toThrow('Duplicate command id');

    const reserved = sealPackManifest({
      ...payload('cloud'),
      commands: [],
      reservedRootNames: ['status'],
    });
    expect(() => validatePackGraph([first, reserved])).toThrow("Command root 'status' is reserved");
  });

  it('allows only the exact pack named by a reserved-root contributor binding', () => {
    const core = sealPackManifest({
      ...payload(),
      reservedRootNames: ['build'],
      reservedRootContributors: [{ root: 'build', packId: 'framework' }],
    });
    const framework = sealPackManifest({
      ...payload('framework'),
      commands: [
        {
          ...payload('framework').commands[0]!,
          id: 'framework.build',
          path: ['build'],
        },
      ],
    });
    expect(validatePackGraph([core, framework])).toEqual([core, framework]);

    const other = sealPackManifest({
      ...payload('cloud'),
      commands: [
        {
          ...payload('cloud').commands[0]!,
          id: 'cloud.build',
          path: ['build'],
        },
      ],
    });
    expect(() => validatePackGraph([core, other])).toThrow("Command root 'build' is reserved");
  });

  it('rejects invalid or duplicate reserved-root contributor bindings', () => {
    expect(() =>
      validatePackGraph([
        sealPackManifest({
          ...payload(),
          reservedRootContributors: [{ root: 'build', packId: 'framework' }],
        }),
      ]),
    ).toThrow('OPS_PACK_RESERVATION_INVALID');
    expect(() =>
      validatePackGraph([
        sealPackManifest({
          ...payload(),
          reservedRootNames: ['build'],
          reservedRootContributors: [
            { root: 'build', packId: 'framework' },
            { root: 'build', packId: 'framework' },
          ],
        }),
      ]),
    ).toThrow('Duplicate reserved root contributor');
  });

  it('resolves the longest exact command and merges delegated effects safely', () => {
    const manifest = sealPackManifest({
      ...payload(),
      commands: [
        payload().commands[0]!,
        {
          ...payload().commands[0]!,
          id: 'core.inspect-packs',
          path: ['inspect', 'packs'],
          maximumEffect: 'write',
          writeTargets: ['project'],
          riskGuards: ['production'],
        },
      ],
    });
    expect(resolvePackCommand([manifest], ['inspect', 'packs', '--json'])?.args).toEqual([
      '--json',
    ]);
    expect(mergeCommandEffects(manifest.commands)).toEqual({
      maximumEffect: 'write',
      writeTargets: ['project'],
      riskGuards: ['production'],
    });
  });

  it('resolves root add and connect contributions from exact manifest declarations', () => {
    const growth = sealPackManifest({
      ...payload('growth'),
      addItemTypes: ['growth'],
    });
    const google = sealPackManifest({
      ...payload('provider-google'),
      providerBindings: ['google'],
    });
    expect(resolveAddItemContributor([growth, google], 'growth')?.packId).toBe('growth');
    expect(resolveProviderBindingContributor([growth, google], 'google')?.packId).toBe(
      'provider-google',
    );
    expect(resolveAddItemContributor([growth, google], 'cloud')).toBeNull();
    expect(resolveProviderBindingContributor([growth, google], 'meta')).toBeNull();
  });

  it('rejects handler results that exceed the manifest effect boundary', () => {
    const descriptor = payload().commands[0]!;
    expect(() =>
      assertPackCommandResult(descriptor, {
        schemaVersion: 1,
        command: descriptor.id,
        pack: 'core',
        maximumEffect: descriptor.maximumEffect,
        actualEffect: 'write',
        writeTargets: ['remote'],
        riskGuards: [],
        status: 'ok',
        result: {},
        diagnostics: [],
        artifacts: [],
        nextActions: [],
      }),
    ).toThrow('OPS_PACK_HANDLER_EFFECT_EXCEEDED');
  });
});
