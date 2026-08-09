import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const umbrellaRoot = resolve(repositoryRoot, '..');
const policyPath = join(repositoryRoot, 'tools/repository/source-boundary-policy.json');
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const mode = process.argv.includes('--write') ? 'write' : 'check';
const ignoredDirectories = new Set(['.git', '.skopos', '.unisane', '.turbo', 'node_modules', 'dist', 'coverage']);
const taskArtifactPattern = new RegExp(`^docs/work/(?:tasks|archive/tasks|tasks/snapshots)/${policy.taskId}-`);
const umbrellaTaskArtifactPattern = new RegExp(`^docs/work/tasks/snapshots/${policy.taskId}-`);

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function git(args) {
  const result = spawnSync('git', args, { cwd: umbrellaRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  }
  return result.stdout;
}

function walk(root, prefix = '') {
  const paths = [];
  for (const entry of readdirSync(join(root, prefix), { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) paths.push(...walk(root, path));
    else if (entry.isFile() || entry.isSymbolicLink()) paths.push(path);
  }
  return paths.sort();
}

function ownerFor(path) {
  if (path.startsWith('apps/console/')) return 'ops-console';
  if (path.startsWith('apps/hosted-runtime/')) return 'ops-hosted-runtime';
  if (path.startsWith('packages/')) return path.split('/').slice(0, 2).join('/');
  if (path.startsWith('deploy/')) return 'ops-deployment-source';
  if (path.startsWith('plugins/')) return 'ops-agent-integration';
  if (path.startsWith('docs/')) return 'unisane-ops-memory';
  if (path.startsWith('tools/skopos/')) return 'unisane-ops-staged-skopos';
  if (path.startsWith('tools/')) return 'unisane-ops-tooling';
  if (path.startsWith('scripts/') || path.startsWith('tests/')) return 'unisane-ops-checks';
  return 'unisane-ops-repository-root';
}

function dispositionFor(path) {
  if (path.startsWith('docs/reference/generated/repository/')) return 'regenerate-target-reference';
  if (path.startsWith('docs/work/')) return 'migrate-by-skopos-adoption-and-task-disposition';
  if (path.startsWith('docs/')) return 'retain-target-memory';
  if (path.startsWith('tools/skopos/')) return 'activate-only-after-extracted-adoption';
  if (path.startsWith('deploy/')) return 'retain-source-deployment-contract-no-provider-state';
  return 'retain-target-source';
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function manifestInventory() {
  const paths = walk(repositoryRoot).filter(
    (path) => /^(apps|packages)\/[^/]+\/package\.json$/.test(path),
  );
  const manifests = paths.map((path) => ({ path, manifest: readJson(join(repositoryRoot, path)) }));
  const localNames = new Set(manifests.map(({ manifest }) => manifest.name));
  const workspaceEdges = [];
  const externalPackageContracts = [];
  for (const { path, manifest } of manifests) {
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const [dependency, specifier] of Object.entries(manifest[section] ?? {})) {
        if (typeof specifier !== 'string') continue;
        if (specifier.startsWith('workspace:') || specifier.startsWith('file:') || specifier.startsWith('link:')) {
          workspaceEdges.push({ consumer: manifest.name, dependency, specifier, section, path, local: localNames.has(dependency) });
        } else if (dependency.startsWith('@unisane/') && !localNames.has(dependency)) {
          externalPackageContracts.push({ consumer: manifest.name, dependency, specifier, section, path });
        }
      }
    }
  }
  return { manifests, localNames, workspaceEdges, externalPackageContracts };
}

function centralMemoryInventory() {
  const paths = git(['ls-files', 'docs']).trim().split('\n').filter(Boolean).filter((path) => !umbrellaTaskArtifactPattern.test(path));
  const signal = /(?:Unisane Ops|unisane-ops|@unisane\/(?:ops|growth|cloud|provider|web-runtime|framework-ops))/i;
  return paths.filter((path) => signal.test(readFileSync(join(umbrellaRoot, path), 'utf8'))).map((path) => ({
    path,
    sha256: sha256(readFileSync(join(umbrellaRoot, path))),
    owner: 'umbrella-project-memory',
    disposition: policy.centralMemoryDispositions[path] ?? 'split-by-deepest-canonical-owner',
  }));
}

function rootSurfaceInventory() {
  return Object.entries(policy.rootSurfaceDispositions).sort(([a], [b]) => a.localeCompare(b)).map(([path, disposition]) => {
    const absolutePath = join(umbrellaRoot, path);
    const isDirectory = existsSync(absolutePath) && statSync(absolutePath).isDirectory();
    const memberPaths = isDirectory ? git(['ls-files', path]).trim().split('\n').filter(Boolean) : [];
    const members = memberPaths.map((memberPath) => ({
      path: memberPath,
      sha256: sha256(readFileSync(join(umbrellaRoot, memberPath))),
    }));
    return {
      path,
      exists: existsSync(absolutePath),
      sha256: existsSync(absolutePath) && !isDirectory ? sha256(readFileSync(absolutePath)) : null,
      members,
      membersDigest: members.length ? sha256(members.map((member) => `${member.path}\0${member.sha256}`).join('\n')) : null,
      owner: 'umbrella-root-or-foreign-scope',
      disposition,
    };
  });
}

function historySpec() {
  const introduction = policy.stagingIntroductionCommit;
  const raw = git([
    '-c', 'diff.renameLimit=20000', 'diff-tree', '-r', '-M21%', '-C21%', '--find-copies-harder',
    '--no-commit-id', '--name-status', `${introduction}^`, introduction,
  ]);
  const origins = [];
  const additions = [];
  for (const line of raw.trim().split('\n').filter(Boolean)) {
    const fields = line.split('\t');
    if (/^[RC]/.test(fields[0]) && fields[2]?.startsWith('unisane-ops/')) {
      origins.push({ status: fields[0], source: fields[1], destination: fields[2] });
    } else if (fields[0] === 'A' && fields[1]?.startsWith('unisane-ops/')) {
      additions.push(fields[1]);
    }
  }
  if (origins.length !== 507 || additions.length !== 91) {
    throw new Error(`history origin freeze drifted: expected 507 origins and 91 additions, found ${origins.length} and ${additions.length}`);
  }
  return {
    schemaVersion: 1,
    state: 'specified-not-executed',
    executionAuthority: 'later-disposable-extracted-proof-task-only',
    sourceCheckpoint: policy.sourceCheckpoint,
    introductionCommit: introduction,
    discovery: {
      command: `git -c diff.renameLimit=20000 diff-tree -r -M21% -C21% --find-copies-harder --no-commit-id --name-status ${introduction}^ ${introduction}`,
      originMappingCount: origins.length,
      additionCount: additions.length,
      origins,
      additions,
    },
    filterContract: {
      includeCurrentPath: 'unisane-ops/',
      renameCurrentPathTo: '/',
      historicalPathMappings: origins.map(({ status, source, destination }) => ({
        status,
        source,
        target: destination.replace(/^unisane-ops\//, ''),
      })),
      includeHistoricalOrigins: [...new Set(origins.map(({ source }) => source))].sort(),
      directAdditionTargets: additions.map((destination) => destination.replace(/^unisane-ops\//, '')).sort(),
      excludeAllOtherPaths: true,
      tool: 'git-filter-repo',
      toolVersion: 'owner-approved-version-required-at-execution',
      implementationRule: 'preserve each recorded source-to-target lineage, including one-to-many copy lineages; reject a naive global path rename when mappings conflict',
      tags: 'import-none-unless-separately-approved-and-proved-ops-only',
      replaceTexts: 'none-without-reviewed-security-remediation-spec',
    },
    requiredProvenanceReceipt: [
      'immutable umbrella source commit and tree digest',
      'approved filter tool version and executable digest',
      'normalized filter input digest and command transcript',
      'source-to-filtered commit map',
      'current-file content and mode comparison',
      'excluded-path absence proof',
      'tag and signature disposition',
      'reviewer identity and approval',
    ],
  };
}

function safetySpec() {
  return {
    schemaVersion: 1,
    state: 'specified-not-executed',
    executionAuthority: 'security-and-legal-approved-disposable-filtered-checkout-only',
    scanInput: {
      commitSet: 'every commit reachable in the filtered Ops history candidate',
      blobSet: 'every unique blob reachable from that commit set, including deleted paths',
      refs: 'only refs admitted by the approved history filter receipt',
      workingTreeAndGitMetadata: 'scan the final checkout, refs, commit messages, authors, committers, notes, and tags',
    },
    requiredDetectors: [
      { category: 'secrets', checks: ['provider and cloud credential signatures', 'private keys and tokens', 'high-entropy candidates with reviewed allowlist'] },
      { category: 'privacy', checks: ['customer or user PII', 'raw phone/email/address data', 'provider account and tenant identifiers', 'production URLs and internal topology'] },
      { category: 'binary-and-size', checks: ['all binary MIME types', 'archives and database files', 'large blobs with explicit threshold receipt'] },
      { category: 'generated-cache-state', checks: ['cache and build outputs', 'provider state, plans, receipts, reports and locks', 'vendored dependency trees'] },
      { category: 'license-and-provenance', checks: ['source dependency licenses', 'copied code provenance', 'asset, font, fixture and dataset rights', 'provider terms and trademark use'] },
      { category: 'contributors', checks: ['author and committer identities', 'email publication consent', 'contributor terms and sign-off policy'] },
    ],
    failClosedRules: [
      'Any unresolved detector hit blocks public-history admission.',
      'A redaction requires an approved remediation map, a repeated full scan, and a new provenance receipt.',
      'No hit details containing suspected secrets or personal data may be committed; receipts contain redacted identifiers and digests only.',
      'Tool selection, versions, entropy thresholds, allowlists, license policy, and contributor policy require security or legal owner approval before execution.',
      'This specification grants no permission to rotate credentials, rewrite history, publish, or create a remote.',
    ],
    receiptSchema: {
      sourceCommit: 'full SHA',
      filteredTip: 'full SHA',
      commitAndBlobCounts: 'integers',
      scannerTools: 'name, exact version, configuration digest, executable/container digest',
      categoryResults: 'pass or redacted finding IDs',
      allowlist: 'reviewed redacted entries and policy digest',
      remediations: 'redacted finding IDs and replacement-map digest',
      approvals: 'security/legal owner and timestamp',
    },
  };
}

function ledger() {
  const selfGenerated = new Set(policy.selfGeneratedOutputs);
  const concretePaths = walk(repositoryRoot).filter((path) => !selfGenerated.has(path) && !taskArtifactPattern.test(path));
  const files = concretePaths.map((path) => {
    const absolutePath = join(repositoryRoot, path);
    const content = readFileSync(absolutePath);
    return { path, mode: statSync(absolutePath).mode & 0o111 ? 'executable' : 'regular', sha256: sha256(content), owner: ownerFor(path), disposition: dispositionFor(path) };
  });
  for (const path of policy.selfGeneratedOutputs) {
    files.push({ path, mode: 'regular', sha256: null, owner: 'unisane-ops-generated-reference', disposition: 'regenerate-from-source-policy', selfReferentialOutput: true });
  }
  files.push({
    path: `docs/work/{tasks,archive/tasks,tasks/snapshots}/${policy.taskId}-*`,
    mode: 'dynamic-skopos-artifact',
    sha256: null,
    owner: 'umbrella-skopos-until-cutover',
    disposition: 'migrate-or-archive-through-existing-project-adoption',
    dynamicTaskArtifact: true,
  });
  files.sort((a, b) => a.path.localeCompare(b.path));

  const { manifests, workspaceEdges, externalPackageContracts } = manifestInventory();
  const foreignWorkspaceEdges = workspaceEdges.filter(({ local }) => !local).map(({ local: _local, ...edge }) => edge);
  const unexpectedForeignWorkspaceEdges = foreignWorkspaceEdges.filter((edge) => !policy.externalBlockers.some(
    (blocker) => blocker.consumer === edge.consumer && blocker.dependency === edge.dependency && blocker.currentSpecifier === edge.specifier,
  ));
  const blockerEdgesMissing = policy.externalBlockers.filter((blocker) => !foreignWorkspaceEdges.some(
    (edge) => blocker.consumer === edge.consumer && blocker.dependency === edge.dependency && blocker.currentSpecifier === edge.specifier,
  ));
  const unexpectedExternalContracts = externalPackageContracts.filter((edge) => {
    const allowed = policy.allowedExternalPackageContracts[edge.dependency];
    return !allowed || allowed.consumer !== edge.consumer || allowed.range !== edge.specifier;
  });

  const sourceTextPaths = concretePaths.filter((path) => /\.(?:[cm]?[jt]sx?|json|ya?ml)$/.test(path));
  const packageSourceTextPaths = sourceTextPaths.filter((path) => /^(?:apps|packages)\//.test(path));
  const cliCoreReferences = packageSourceTextPaths.filter((path) => readFileSync(join(repositoryRoot, path), 'utf8').includes('@unisane/cli-core'));
  const foreignRelativeSourceReferences = packageSourceTextPaths.filter((path) => /(?:\.\.\/){2,}(?:unisane|unisane-ui|unisane-tools|unisane-pro|unisane-platforms)\//.test(readFileSync(join(repositoryRoot, path), 'utf8')));
  const dynamicUiCliReferences = packageSourceTextPaths.filter((path) => readFileSync(join(repositoryRoot, path), 'utf8').includes('@unisane/ui-cli'));
  const targetLockfilePresent = existsSync(join(repositoryRoot, 'pnpm-lock.yaml'));
  const nestedGitPresent = existsSync(join(repositoryRoot, '.git'));
  const privateAdmissionErrors = manifests.flatMap(({ path, manifest }) => {
    const admission = policy.packageAdmissions[manifest.name];
    return admission?.requiredPrivate === true && manifest.private !== true ? [{ path, name: manifest.name, expectedPrivate: true }] : [];
  });
  const violations = [
    ...unexpectedForeignWorkspaceEdges.map((edge) => `unexpected foreign workspace edge ${edge.consumer} -> ${edge.dependency}@${edge.specifier}`),
    ...blockerEdgesMissing.map((blocker) => `declared blocker no longer matches source ${blocker.consumer} -> ${blocker.dependency}`),
    ...unexpectedExternalContracts.map((edge) => `unexpected external first-party contract ${edge.consumer} -> ${edge.dependency}@${edge.specifier}`),
    ...cliCoreReferences.map((path) => `private cli-core reference remains in ${path}`),
    ...foreignRelativeSourceReferences.map((path) => `foreign relative source/config reference remains in ${path}`),
    ...privateAdmissionErrors.map(({ path, name }) => `${name} must be private in ${path}`),
    ...(targetLockfilePresent ? ['target pnpm-lock.yaml exists before disposable extraction proof'] : []),
    ...(nestedGitPresent ? ['nested .git exists inside umbrella staging'] : []),
  ];

  const dispositionCounts = Object.fromEntries(Object.entries(files.reduce((counts, file) => {
    counts[file.disposition] = (counts[file.disposition] ?? 0) + 1;
    return counts;
  }, {})).sort(([a], [b]) => a.localeCompare(b)));
  const inventoryDigest = sha256(files.filter(({ sha256: digest }) => digest).map(({ path, sha256: digest }) => `${path}\0${digest}`).join('\n'));
  const sourceTree = git(['ls-tree', '-r', '--full-tree', policy.sourceCheckpoint, '--', 'unisane-ops']).trim().split('\n').filter(Boolean);

  return {
    schemaVersion: 1,
    state: violations.length === 0 ? 'frozen-with-external-blocker' : 'invalid',
    sourceCheckpoint: policy.sourceCheckpoint,
    sourceCheckpointTrackedPathCount: sourceTree.length,
    sourceCheckpointTreeDigest: sha256(sourceTree.sort().join('\n')),
    generatedFromPolicySha256: sha256(readFileSync(policyPath)),
    inventory: {
      concreteFileCount: files.filter(({ sha256: digest }) => digest).length,
      coveredRecordCount: files.length,
      concreteInventoryDigest: inventoryDigest,
      excludedEphemeralPatterns: policy.excludedEphemeralPatterns,
      dispositionCounts,
      files,
    },
    packageBoundary: {
      manifestCount: manifests.length,
      manifests: manifests.map(({ path, manifest }) => ({ path, name: manifest.name, version: manifest.version, private: manifest.private === true })),
      acceptedPublicPackages: policy.acceptedPublicPackages,
      packageAdmissions: policy.packageAdmissions,
      workspaceEdges,
      externalPackageContracts,
      foreignWorkspaceEdges,
      externalBlockers: policy.externalBlockers,
      dynamicUiCliReferences,
      cliCoreReferences,
      foreignRelativeSourceReferences,
      checkpoint: foreignWorkspaceEdges.length === 0 ? 'no-foreign-workspace-edges' : 'blocked-by-exact-external-owner-edges',
    },
    centralMemory: centralMemoryInventory(),
    rootAndToolSurfaces: rootSurfaceInventory(),
    authoritySafety: {
      targetLockfilePresent,
      nestedGitPresent,
      independentTargetSkoposActive: false,
      umbrellaLockfileAuthority: true,
      umbrellaSkoposAuthority: true,
      excludedUmbrellaTaskArtifactPattern: policy.excludedUmbrellaTaskArtifactPattern,
    },
    violations,
  };
}

const outputDirectory = join(repositoryRoot, 'docs/reference/generated/repository');
const outputs = {
  'source-disposition-ledger.json': ledger(),
  'history-filter-spec.json': historySpec(),
  'public-safety-scan-spec.json': safetySpec(),
};

let failed = false;
for (const [name, value] of Object.entries(outputs)) {
  const path = join(outputDirectory, name);
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  if (mode === 'write') {
    writeFileSync(path, serialized);
  } else if (!existsSync(path) || readFileSync(path, 'utf8') !== serialized) {
    console.error(`${relative(repositoryRoot, path)} is missing or stale; run pnpm generate:source-boundary`);
    failed = true;
  }
}

if (outputs['source-disposition-ledger.json'].violations.length > 0) {
  for (const violation of outputs['source-disposition-ledger.json'].violations) console.error(violation);
  failed = true;
}

if (failed) process.exitCode = 1;
else console.log(`Unisane Ops source boundary ${mode === 'write' ? 'generated' : 'verified'} (${outputs['source-disposition-ledger.json'].inventory.concreteFileCount} concrete files).`);
