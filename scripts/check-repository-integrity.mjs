import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policyPath = join(root, 'tools/repository/standalone-integrity-policy.json');
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const outputPath = join(root, policy.generatedOutput);
const mode = process.argv.includes('--write')
  ? 'write'
  : process.argv.includes('--check-generated')
    ? 'generated'
    : 'check';
const ignoredDirectories = new Set([
  '.git',
  '.tmp',
  '.pnpm-store',
  '.skopos',
  '.unisane',
  '.turbo',
  'node_modules',
  'dist',
  'coverage',
]);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function walk(directory, prefix = '') {
  const paths = [];
  for (const entry of readdirSync(join(directory, prefix), { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) paths.push(...walk(directory, path));
    else if (entry.isFile() || entry.isSymbolicLink()) paths.push(path);
  }
  return paths.sort();
}

function sourceEligible(path) {
  return (
    path !== policy.generatedOutput &&
    !path.startsWith('docs/reference/generated/') &&
    !path.startsWith('docs/work/tasks/') &&
    !path.startsWith('docs/work/archive/tasks/')
  );
}

const allPaths = walk(root);
const generatedPaths = allPaths.filter((path) => path.startsWith('docs/reference/generated/'));
const expectedGeneratedPaths = [...policy.generatedOutputs].sort();
const unexpectedGeneratedPaths = generatedPaths.filter(
  (path) => !expectedGeneratedPaths.includes(path),
);
const missingGeneratedPaths = expectedGeneratedPaths.filter(
  (path) => !generatedPaths.includes(path),
);
const sourcePaths = allPaths.filter(sourceEligible);
const sourceRecords = sourcePaths.map((path) => {
  const absolute = join(root, path);
  return {
    path,
    mode: statSync(absolute).mode & 0o111 ? '100755' : '100644',
    sha256: sha256(readFileSync(absolute)),
  };
});
const manifestPaths = allPaths.filter((path) =>
  /^(?:apps|packages)\/[^/]+\/package\.json$/.test(path),
);
const manifests = manifestPaths.map((path) => ({
  path,
  manifest: JSON.parse(readFileSync(join(root, path), 'utf8')),
}));
const localNames = new Set(manifests.map(({ manifest }) => manifest.name));
const foreignWorkspaceEdges = [];
const fileOrLinkEdges = [];
const dependencyEdges = [];
for (const { path, manifest } of manifests) {
  for (const section of [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ]) {
    for (const [dependency, specifier] of Object.entries(manifest[section] ?? {})) {
      if (typeof specifier !== 'string') continue;
      dependencyEdges.push({ consumer: manifest.name, dependency, specifier, section, path });
      if (/^(?:file|link):/.test(specifier))
        fileOrLinkEdges.push({ consumer: manifest.name, dependency, specifier, section, path });
      if (specifier.startsWith('workspace:') && !localNames.has(dependency)) {
        foreignWorkspaceEdges.push({
          consumer: manifest.name,
          dependency,
          specifier,
          section,
          path,
        });
      }
    }
  }
}
foreignWorkspaceEdges.sort((a, b) =>
  `${a.consumer}\0${a.dependency}`.localeCompare(`${b.consumer}\0${b.dependency}`),
);
const expectedBlockers = [...policy.externalBlockers].sort((a, b) =>
  `${a.consumer}\0${a.dependency}`.localeCompare(`${b.consumer}\0${b.dependency}`),
);
const blockerProjection = foreignWorkspaceEdges.map(({ consumer, dependency, specifier }) => ({
  consumer,
  dependency,
  specifier,
}));
const expectedProjection = expectedBlockers.map(({ consumer, dependency, specifier }) => ({
  consumer,
  dependency,
  specifier,
}));
const releasedEdgeKey = ({ consumer, dependency }) => `${consumer}\0${dependency}`;
const expectedReleasedEdges = [...policy.admittedReleasedEdges].sort((a, b) =>
  releasedEdgeKey(a).localeCompare(releasedEdgeKey(b)),
);
const admittedReleasedCoordinates = new Set(expectedReleasedEdges.map(releasedEdgeKey));
const admittedReleasedEdges = dependencyEdges
  .filter((edge) => admittedReleasedCoordinates.has(releasedEdgeKey(edge)))
  .sort((a, b) => releasedEdgeKey(a).localeCompare(releasedEdgeKey(b)));
const releasedPolicyHasDuplicates =
  admittedReleasedCoordinates.size !== expectedReleasedEdges.length;
const packageTextPaths = sourcePaths.filter((path) =>
  /^(?:apps|packages)\/.+\.(?:[cm]?[jt]sx?|json)$/.test(path),
);
const foreignRelativeReferences = packageTextPaths.filter((path) =>
  /(?:\.\.\/){2,}(?:unisane|unisane-ui|unisane-tools|unisane-pro|unisane-platforms|unisane-infrastructure)\//.test(
    readFileSync(join(root, path), 'utf8'),
  ),
);
const prohibitedTrackedPaths = allPaths.filter((path) =>
  /(?:^|\/)(?:node_modules|dist|coverage|\.turbo|\.skopos|\.unisane)(?:\/|$)/.test(path),
);
const topLevel = readdirSync(root)
  .filter((name) => !ignoredDirectories.has(name) && name !== '.git')
  .sort();
const missingTopLevel = policy.expectedTopLevel.filter((path) => !topLevel.includes(path));
const unexpectedTopLevel = topLevel.filter((path) => !policy.expectedTopLevel.includes(path));
const violations = [
  ...(expectedGeneratedPaths.includes(policy.generatedOutput)
    ? []
    : ['generated receipt output is absent from the exact generated-output allowlist']),
  ...unexpectedGeneratedPaths.map(
    (path) => `generated output is not owned by the exact allowlist: ${path}`,
  ),
  ...missingGeneratedPaths.map((path) => `required generated output is missing: ${path}`),
  ...(JSON.stringify(blockerProjection) === JSON.stringify(expectedProjection)
    ? []
    : ['foreign workspace blockers differ from the exact accepted set']),
  ...(releasedPolicyHasDuplicates
    ? ['admitted released-edge policy contains duplicate consumer/dependency coordinates']
    : []),
  ...(JSON.stringify(admittedReleasedEdges) === JSON.stringify(expectedReleasedEdges)
    ? []
    : ['admitted released dependency edges differ from the exact accepted set']),
  ...fileOrLinkEdges.map(
    ({ consumer, dependency }) => `file/link dependency is forbidden: ${consumer} -> ${dependency}`,
  ),
  ...foreignRelativeReferences.map((path) => `foreign relative source reference: ${path}`),
  ...prohibitedTrackedPaths.map((path) => `generated/cache/runtime-state path is tracked: ${path}`),
  ...missingTopLevel.map((path) => `expected standalone root path is missing: ${path}`),
  ...unexpectedTopLevel.map((path) => `unexpected standalone root path: ${path}`),
];
const receipt = {
  schemaVersion: 1,
  state: violations.length === 0 ? 'valid-with-exact-released-edges' : 'invalid',
  generatedFromPolicySha256: sha256(readFileSync(policyPath)),
  source: {
    fileCount: sourceRecords.length,
    digest: sha256(
      sourceRecords
        .map(({ path, mode: fileMode, sha256: digest }) => `${path}\0${fileMode}\0${digest}`)
        .join('\n'),
    ),
    excludedGeneratedAndTaskMemory: policy.excludedSourcePatterns,
  },
  generatedOutputs: {
    expected: expectedGeneratedPaths,
    observed: generatedPaths,
    unexpected: unexpectedGeneratedPaths,
    missing: missingGeneratedPaths,
  },
  repositoryShape: {
    expectedTopLevel: policy.expectedTopLevel,
    observedTopLevel: topLevel,
    targetLockfilePresent: existsSync(join(root, 'pnpm-lock.yaml')),
    rootGitMetadataIgnored: true,
  },
  packageBoundary: {
    manifestCount: manifests.length,
    foreignWorkspaceEdges,
    exactExternalBlockers: expectedBlockers,
    admittedReleasedEdges,
    exactAdmittedReleasedEdges: expectedReleasedEdges,
    fileOrLinkEdges,
    foreignRelativeReferences,
  },
  prohibitedTrackedPaths,
  violations,
};
const serialized = `${JSON.stringify(receipt, null, 2)}\n`;
if (mode === 'write') writeFileSync(outputPath, serialized);
else if (!existsSync(outputPath) || readFileSync(outputPath, 'utf8') !== serialized) {
  console.error(
    `${relative(root, outputPath)} is missing or stale; run pnpm generate:repository-integrity`,
  );
  process.exitCode = 1;
}
if (violations.length > 0) {
  for (const violation of violations) console.error(violation);
  process.exitCode = 1;
}
if (!process.exitCode)
  console.log(
    `${mode === 'generated' ? 'Generated output drift' : 'Standalone repository integrity'} verified with ${sourceRecords.length} source files, ${generatedPaths.length} exact generated output, ${foreignWorkspaceEdges.length} external blockers, and ${admittedReleasedEdges.length} exact admitted released edges.`,
  );
