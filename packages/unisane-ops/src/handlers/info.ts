import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { packCommandResultSchema, type PackCommandHandler } from '@unisane/ops-engine/pack';

type DependencyScope = 'dependency' | 'devDependency' | 'optionalDependency' | 'peerDependency';

interface ProjectPackageJson {
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
  optionalDependencies?: Record<string, unknown>;
  peerDependencies?: Record<string, unknown>;
}

interface UnisanePackageVersion {
  name: string;
  version: string;
  scope: DependencyScope;
}

const DEPENDENCY_SECTIONS: ReadonlyArray<[keyof ProjectPackageJson, DependencyScope]> = [
  ['dependencies', 'dependency'],
  ['devDependencies', 'devDependency'],
  ['optionalDependencies', 'optionalDependency'],
  ['peerDependencies', 'peerDependency'],
];

function readProjectPackages(cwd: string): readonly UnisanePackageVersion[] {
  const packagePath = resolve(cwd, 'package.json');
  if (!existsSync(packagePath)) {
    throw new Error(`[OPS_CLI_PACKAGE_JSON_MISSING] No package.json found at ${packagePath}.`);
  }
  const value = JSON.parse(readFileSync(packagePath, 'utf8')) as ProjectPackageJson;
  const packages: UnisanePackageVersion[] = [];
  for (const [section, scope] of DEPENDENCY_SECTIONS) {
    for (const [name, version] of Object.entries(value[section] ?? {})) {
      if ((name === 'unisane-ops' || name.startsWith('@unisane/')) && typeof version === 'string') {
        packages.push({ name, version, scope });
      }
    }
  }
  return packages.sort(
    (left, right) => left.name.localeCompare(right.name) || left.scope.localeCompare(right.scope),
  );
}

function renderHuman(cliVersion: string, packages: readonly UnisanePackageVersion[]): string {
  const lines = [`Unisane Ops CLI ${cliVersion}`, '', 'Installed Unisane packages:'];
  if (packages.length === 0) {
    lines.push('  None');
  } else {
    for (const entry of packages) {
      lines.push(`  ${entry.name} ${entry.version} (${entry.scope})`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export const runInfo: PackCommandHandler = (context) => {
  if (context.argv.length > 0) {
    throw new Error(`[OPS_CLI_ARGUMENT_UNKNOWN] info: ${context.argv.join(' ')}`);
  }
  const core = context.manifests.find((manifest) => manifest.packId === 'core');
  if (!core) {
    throw new Error('[OPS_CLI_CORE_MANIFEST_MISSING] The core pack manifest is unavailable.');
  }
  const packages = readProjectPackages(context.cwd);
  return packCommandResultSchema.parse({
    schemaVersion: 1,
    command: 'core.info',
    pack: 'core',
    maximumEffect: 'offline',
    actualEffect: 'offline',
    writeTargets: [],
    riskGuards: [],
    status: 'ok',
    result: {
      cli: { name: core.packageName, version: core.version },
      project: { cwd: context.cwd, packages },
    },
    diagnostics: [],
    artifacts: [],
    nextActions: [],
    ...(context.json
      ? {}
      : {
          presentation: {
            stdout: renderHuman(core.version, packages),
            stderr: '',
          },
        }),
  });
};
