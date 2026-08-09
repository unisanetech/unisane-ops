import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const opsRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const umbrellaRoot = resolve(opsRoot, '..');
const policyPath = join(opsRoot, 'tools/repository/extraction-proof-policy.json');
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));
const historySpecPath = join(opsRoot, policy.historySpec);
const safetySpecPath = join(opsRoot, policy.safetySpec);
const historySpec = JSON.parse(readFileSync(historySpecPath, 'utf8'));
const safetySpec = JSON.parse(readFileSync(safetySpecPath, 'utf8'));
const candidateRoot = resolve(policy.candidateRoot);
const candidateRepo = join(candidateRoot, 'repository');
const callbackPath = join(candidateRoot, 'filter-callback.py');
const receiptDirectory = join(opsRoot, policy.receiptDirectory);
const execute = process.argv.includes('--execute');
const check = process.argv.includes('--check');

if (execute === check) throw new Error('Choose exactly one of --execute or --check.');
if (!candidateRoot.startsWith('/tmp/unisane-ops-extraction-') || !candidateRoot.endsWith(policy.taskId)) {
  throw new Error(`Refusing unsafe candidate path: ${candidateRoot}`);
}
if (resolve(candidateRoot) === resolve('/tmp') || resolve(candidateRoot) === resolve(umbrellaRoot)) {
  throw new Error(`Refusing broad candidate path: ${candidateRoot}`);
}
if (historySpec.filterContract.historicalPathMappings.length !== 507 || historySpec.discovery.additionCount !== 91) {
  throw new Error('Integrated history specification no longer has the approved 507 mappings and 91 additions.');
}
if (historySpec.sourceCheckpoint !== policy.freezeCheckpoint || historySpec.introductionCommit !== policy.stagingIntroductionCommit) {
  throw new Error('Extraction proof policy differs from the integrated history specification.');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function run(command, args, cwd = umbrellaRoot, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: options.encoding ?? 'utf8',
    input: options.input,
    env: { ...process.env, ...options.env },
    maxBuffer: options.maxBuffer ?? 256 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString('utf8') : result.stderr;
    const stdout = Buffer.isBuffer(result.stdout) ? result.stdout.toString('utf8') : result.stdout;
    throw new Error(`${command} ${args.join(' ')} failed (${result.status}): ${(stderr || stdout || '').trim()}`);
  }
  return result.stdout;
}

function git(args, cwd = umbrellaRoot, options = {}) {
  return run('git', args, cwd, options);
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseTree(buffer, prefixToRemove = '') {
  const records = [];
  for (const entry of buffer.toString('utf8').split('\0').filter(Boolean)) {
    const tab = entry.indexOf('\t');
    const [mode, type, oid] = entry.slice(0, tab).split(' ');
    let path = entry.slice(tab + 1);
    if (prefixToRemove && path.startsWith(prefixToRemove)) path = path.slice(prefixToRemove.length);
    records.push({ path, mode, type, oid });
  }
  return records.sort((a, b) => a.path.localeCompare(b.path));
}

function treeRecords(cwd, revision, path, prefixToRemove = '') {
  const args = ['ls-tree', '-r', '-z', revision];
  if (path) args.push('--', path);
  return parseTree(git(args, cwd, { encoding: 'buffer' }), prefixToRemove);
}

function compactRefInventory(cwd, namespace = '') {
  const args = ['for-each-ref', '--format=%(objectname)%00%(objecttype)%00%(refname)'];
  if (namespace) args.push(namespace);
  const raw = git(args, cwd).split('\n').filter(Boolean).sort();
  const typeCounts = {};
  for (const line of raw) {
    const type = line.split('\0')[1] ?? 'unknown';
    typeCounts[type] = (typeCounts[type] ?? 0) + 1;
  }
  return { count: raw.length, typeCounts, digest: sha256(raw.join('\n')) };
}

function signatureInventory(cwd, revision = '--all') {
  const args = revision === '--all' ? ['log', '--all', '--format=%G?'] : ['log', revision, '--format=%G?'];
  const statuses = git(args, cwd).split('\n').filter(Boolean);
  const counts = {};
  for (const status of statuses) counts[status] = (counts[status] ?? 0) + 1;
  return { inspectedCommitCount: statuses.length, statusCounts: counts };
}

function objectInventory(cwd) {
  const objectLines = git(['rev-list', '--objects', '--all'], cwd).split('\n').filter(Boolean);
  const objectIds = [...new Set(objectLines.map((line) => line.split(' ', 1)[0]))].sort();
  const batch = objectIds.length
    ? git(['cat-file', '--batch-check=%(objectname) %(objecttype) %(objectsize)'], cwd, { input: `${objectIds.join('\n')}\n` })
    : '';
  const counts = {};
  let totalBytes = 0;
  const blobs = [];
  for (const line of batch.split('\n').filter(Boolean)) {
    const [oid, type, sizeText] = line.split(' ');
    const size = Number(sizeText);
    counts[type] = (counts[type] ?? 0) + 1;
    totalBytes += size;
    if (type === 'blob') blobs.push({ oid, size });
  }
  const pathByObject = new Map();
  for (const line of objectLines) {
    const space = line.indexOf(' ');
    if (space === -1) continue;
    const oid = line.slice(0, space);
    const path = line.slice(space + 1);
    if (!pathByObject.has(oid)) pathByObject.set(oid, path);
  }
  return {
    summary: {
      reachableObjectCount: objectIds.length,
      typeCounts: counts,
      totalInflatedBytes: totalBytes,
      digest: sha256(batch.split('\n').filter(Boolean).sort().join('\n')),
    },
    blobs,
    pathByObject,
  };
}

function shannonEntropy(value) {
  const counts = new Map();
  for (const character of value) counts.set(character, (counts.get(character) ?? 0) + 1);
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

function scanCandidate(cwd) {
  const findings = new Map();
  const addFinding = (category, ruleId, subjectType, subjectDigest) => {
    const id = `PF-${sha256(`${category}\0${ruleId}\0${subjectType}\0${subjectDigest}`).slice(0, 16)}`;
    findings.set(id, { id, category, ruleId, subjectType, subjectDigest });
  };
  const secretRules = policy.scanPolicy.secretRules.map((rule) => ({ ...rule, regex: new RegExp(rule.pattern, 'g') }));
  const privacyRules = policy.scanPolicy.privacyRules.map((rule) => ({ ...rule, regex: new RegExp(rule.pattern, 'gi') }));
  const pathRules = policy.scanPolicy.sensitivePathRules.map((rule) => ({ ...rule, regex: new RegExp(rule.pattern, 'i') }));
  const objects = objectInventory(cwd);
  for (const { oid, size } of objects.blobs) {
    const buffer = git(['cat-file', 'blob', oid], cwd, { encoding: 'buffer', maxBuffer: Math.max(256 * 1024 * 1024, size + 1024) });
    const path = objects.pathByObject.get(oid) ?? '';
    const pathDigest = sha256(path);
    if (buffer.includes(0)) addFinding('binary-and-size', 'binary-nul-byte', 'blob', oid);
    if (size > policy.scanPolicy.largeBlobThresholdBytes) addFinding('binary-and-size', 'large-blob-technical-threshold', 'blob', oid);
    const text = buffer.toString('utf8');
    for (const rule of secretRules) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(text)) addFinding('secrets', rule.id, 'blob', oid);
    }
    for (const rule of privacyRules) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(text)) addFinding('privacy', rule.id, 'blob', oid);
    }
    const tokens = text.match(/[A-Za-z0-9+/=_-]{32,}/g) ?? [];
    if (tokens.some((token) => shannonEntropy(token) >= policy.scanPolicy.entropyThresholdBitsPerCharacter)) {
      addFinding('secrets', 'high-entropy-technical-threshold', 'blob', oid);
    }
    if (path) {
      for (const rule of pathRules) {
        if (rule.regex.test(path)) addFinding(rule.id === 'asset-fixture-dataset-path' ? 'license-and-provenance' : 'generated-cache-state', rule.id, 'path', pathDigest);
      }
    }
  }
  const historicalPaths = git(['log', '--all', '--name-only', '-z', '--format='], cwd)
    .split('\0').map((path) => path.trim()).filter(Boolean);
  const uniqueHistoricalPaths = [...new Set(historicalPaths)].sort();
  for (const path of uniqueHistoricalPaths) {
    const pathDigest = sha256(path);
    for (const rule of pathRules) {
      if (!rule.regex.test(path)) continue;
      const category = rule.id === 'asset-fixture-dataset-path' || rule.id === 'license-notice-path'
        ? 'license-and-provenance'
        : rule.id === 'archive-or-database-path'
          ? 'binary-and-size'
          : 'generated-cache-state';
      addFinding(category, rule.id, 'path', pathDigest);
    }
  }
  const commitRecords = git(['log', '--all', '--format=%H%x00%an%x00%ae%x00%cn%x00%ce%x00%B%x00%x1e'], cwd)
    .split('\x1e').map((record) => record.trim()).filter(Boolean);
  const contributorDigests = new Set();
  let signedOffCommitCount = 0;
  for (const record of commitRecords) {
    const [commit, authorName, authorEmail, committerName, committerEmail, ...messageParts] = record.split('\0');
    const message = messageParts.join('\0');
    contributorDigests.add(sha256(`${authorName}\0${authorEmail}`));
    contributorDigests.add(sha256(`${committerName}\0${committerEmail}`));
    if (/^Signed-off-by:/im.test(message)) signedOffCommitCount += 1;
    for (const rule of secretRules) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(message)) addFinding('secrets', `${rule.id}-commit-message`, 'commit', commit);
    }
    for (const rule of privacyRules) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(message)) addFinding('privacy', `${rule.id}-commit-message`, 'commit', commit);
    }
  }
  const categoryNames = safetySpec.requiredDetectors.map(({ category }) => category);
  const categories = {};
  for (const category of categoryNames) {
    const ids = [...findings.values()].filter((finding) => finding.category === category).map(({ id }) => id).sort();
    categories[category] = {
      technicalStatus: ids.length ? 'redacted-findings-require-owner-review' : 'no-technical-detector-hit',
      findingCount: ids.length,
      findingIds: ids,
      findingDigest: sha256(ids.join('\n')),
    };
  }
  const allFindingIds = [...findings.keys()].sort();
  return {
    schemaVersion: 1,
    state: 'technical-scan-complete-owner-certification-blocked',
    sourceCommit: policy.sourceCommit,
    filteredTip: git(['rev-parse', 'HEAD^'], cwd).trim(),
    candidateTip: git(['rev-parse', 'HEAD'], cwd).trim(),
    scanInput: {
      reachableCommitCount: Number(git(['rev-list', '--all', '--count'], cwd).trim()),
      reachableBlobCount: objects.blobs.length,
      reachableObjectInventory: objects.summary,
      historicalPathCount: uniqueHistoricalPaths.length,
      refInventory: compactRefInventory(cwd),
      workingTreeStatusDigest: sha256(git(['status', '--porcelain=v1', '--untracked-files=all'], cwd)),
      commitMessageCount: commitRecords.length,
      contributorIdentityCount: contributorDigests.size,
      contributorIdentityDigest: sha256([...contributorDigests].sort().join('\n')),
      signedOffCommitCount,
    },
    scannerTools: [
      {
        name: 'unisane-ops-deterministic-technical-scanner',
        version: '1',
        runtime: process.version,
        implementationSha256: sha256(readFileSync(fileURLToPath(import.meta.url))),
        configurationSha256: sha256(readFileSync(policyPath)),
        approvalState: policy.scanPolicy.approvalState,
      },
    ],
    categories,
    totalFindingCount: allFindingIds.length,
    totalFindingDigest: sha256(allFindingIds.join('\n')),
    allowlist: { state: 'not-approved', entryCount: 0, digest: sha256('') },
    remediations: { state: 'none-authorized-or-applied', entryCount: 0, digest: sha256('') },
    certification: {
      publicHistorySafe: false,
      reason: 'Technical detectors completed, but findings and scanner, threshold, allowlist, legal, asset, contributor, and provider-data policies lack accountable owner approval.',
    },
  };
}

function ownerDecisionLedger(scanReceipt) {
  const count = (category) => scanReceipt.categories[category]?.findingCount ?? 0;
  return {
    schemaVersion: 1,
    state: 'fail-closed',
    sourceCommit: policy.sourceCommit,
    candidateTip: scanReceipt.candidateTip,
    decisions: [
      { id: 'OPS-PROOF-R01', owner: 'security-owner', state: 'unresolved', subject: 'Approve scanner tools, versions, thresholds, entropy policy, and allowlist.', evidence: { redactedFindingCount: scanReceipt.totalFindingCount, digest: scanReceipt.totalFindingDigest } },
      { id: 'OPS-PROOF-R02', owner: 'security-owner', state: 'unresolved', subject: 'Review redacted secret and private-data detector findings and authorize any remediation.', evidence: { redactedFindingCount: count('secrets'), digest: scanReceipt.categories.secrets.findingDigest } },
      { id: 'OPS-PROOF-R03', owner: 'privacy-and-provider-data-owner', state: 'unresolved', subject: 'Review PII, provider account, tenant, URL, fixture, and topology findings.', evidence: { redactedFindingCount: count('privacy'), digest: scanReceipt.categories.privacy.findingDigest } },
      { id: 'OPS-PROOF-R04', owner: 'security-and-repository-owner', state: 'unresolved', subject: 'Approve binary, large-object, cache, generated-output, and provider-state dispositions.', evidence: { binaryAndSizeFindings: count('binary-and-size'), generatedStateFindings: count('generated-cache-state') } },
      { id: 'OPS-PROOF-R05', owner: 'legal-owner', state: 'unresolved', subject: 'Approve LICENSE, NOTICE, dependency/source-copy provenance, provider terms, trademarks, assets, fixtures, fonts, and datasets.', evidence: { redactedFindingCount: count('license-and-provenance'), digest: scanReceipt.categories['license-and-provenance'].findingDigest } },
      { id: 'OPS-PROOF-R06', owner: 'legal-owner', state: 'unresolved', subject: 'Approve contributor identities, email publication, terms, and sign-off policy.', evidence: { identityCount: scanReceipt.scanInput.contributorIdentityCount, identityDigest: scanReceipt.scanInput.contributorIdentityDigest, signedOffCommitCount: scanReceipt.scanInput.signedOffCommitCount } },
      { id: 'OPS-PROOF-R07', owner: 'migration-owner', state: 'unresolved', subject: 'Approve git-filter-repo executable/version digest and the exact technical filter receipt for materialization.' },
      { id: 'OPS-PROOF-R08', owner: 'founder-and-release-owner', state: 'unresolved', subject: 'Approve remote visibility, signing, rulesets, CODEOWNERS, target authority, and final materialization route.' },
      { id: 'OPS-PROOF-R09', owner: 'ops-tooling-security-legal', state: 'unresolved', subject: 'Implement and approve real generated-drift, security, and license CI gates before standalone CI or public readiness certification.' },
      { id: 'OPS-R03-UI', owner: 'unisane-ui', state: 'open', subject: '@unisane/ops-console -> @unisane/ui workspace:*' },
      { id: 'OPS-R03-DATA-TABLE', owner: 'unisane-ui', state: 'open', subject: '@unisane/ops-console -> @unisane/data-table workspace:*' },
      { id: 'OPS-R04-FRAMEWORK-DEVTOOLS', owner: 'unisane-framework', state: 'open', subject: '@unisane/framework-ops -> @unisane/devtools workspace:*' },
    ],
    prohibitedConclusions: [
      'Do not certify public-history, public-release, standalone-CI, remote-authority, or production readiness.',
      'Do not invent dependency versions, copy sibling source, add file/link/workspace fallbacks, or weaken the exact blockers.',
      'Do not materialize a final repository without separate reviewer approval and resolved blockers or an explicitly approved fail-closed materialization contract.',
    ],
  };
}

function buildCallback() {
  const mappings = {};
  for (const { source, target } of historySpec.filterContract.historicalPathMappings) {
    (mappings[source] ??= []).push(target);
  }
  for (const targets of Object.values(mappings)) targets.sort();
  const currentCommits = git(['rev-list', policy.sourceCommit, '--not', `${policy.stagingIntroductionCommit}^`], umbrellaRoot)
    .split('\n').filter(Boolean).sort();
  return [
    `historical = ${JSON.stringify(mappings)}`,
    `current_commits = set(${JSON.stringify(currentCommits)})`,
    "original = commit.original_id.decode('ascii')",
    'rewritten = []',
    'for change in commit.file_changes:',
    "  if change.type == b'DELETEALL':",
    '    continue',
    "  source = change.filename.decode('utf8')",
    '  if original in current_commits:',
    "    targets = [source[len('unisane-ops/'):]] if source.startswith('unisane-ops/') else []",
    '  else:',
    '    targets = historical.get(source, [])',
    '  for target in dict.fromkeys(targets):',
    "    rewritten.append(type(change)(change.type, target.encode('utf8'), change.blob_id, change.mode))",
    'commit.file_changes = rewritten',
    '',
  ].join('\n');
}

function executeProof() {
  if (existsSync(candidateRoot)) throw new Error(`Disposable candidate already exists; refusing to overwrite: ${candidateRoot}`);
  mkdirSync(candidateRoot, { recursive: false });
  const sourceHead = git(['rev-parse', 'dev'], umbrellaRoot).trim();
  if (sourceHead !== policy.sourceCommit) throw new Error(`Local dev is ${sourceHead}, expected ${policy.sourceCommit}`);
  const sourceTree = treeRecords(umbrellaRoot, policy.sourceCommit, 'unisane-ops', 'unisane-ops/');
  const sourceTreeDigest = sha256(sourceTree.map(({ path, mode, type, oid }) => `${path}\0${mode}\0${type}\0${oid}`).join('\n'));
  const filterExecutableDigest = sha256(readFileSync(policy.filterExecutable));
  const callback = buildCallback();
  writeFileSync(callbackPath, callback);
  const filterInput = {
    sourceCommit: policy.sourceCommit,
    sourceTreeDigest,
    freezeCheckpoint: policy.freezeCheckpoint,
    introductionCommit: policy.stagingIntroductionCommit,
    historySpecSha256: sha256(readFileSync(historySpecPath)),
    safetySpecSha256: sha256(readFileSync(safetySpecPath)),
    filterExecutable: policy.filterExecutable,
    filterExecutableSha256: filterExecutableDigest,
    filterVersion: run(policy.filterExecutable, ['--version'], umbrellaRoot).trim(),
    callbackSha256: sha256(callback),
    mappingCount: historySpec.filterContract.historicalPathMappings.length,
    uniqueOriginCount: historySpec.filterContract.includeHistoricalOrigins.length,
    directAdditionCount: historySpec.filterContract.directAdditionTargets.length,
    tags: 'none-admitted',
  };
  const filterInputDigest = sha256(`${JSON.stringify(filterInput)}\n`);
  const sourceRefs = compactRefInventory(umbrellaRoot);
  const sourceTags = compactRefInventory(umbrellaRoot, 'refs/tags');
  const sourceSignatures = signatureInventory(umbrellaRoot, policy.sourceCommit);
  run('git', ['clone', '--no-local', '--no-tags', '--single-branch', '--branch', 'dev', umbrellaRoot, candidateRepo], candidateRoot);
  if (git(['rev-parse', 'HEAD'], candidateRepo).trim() !== policy.sourceCommit) throw new Error('Disposable clone did not resolve to the exact source commit.');
  git(['branch', '-m', 'extraction-proof'], candidateRepo);
  git(['remote', 'remove', 'origin'], candidateRepo);
  run(policy.filterExecutable, ['--force', '--commit-callback', callbackPath], candidateRepo);
  const commitMapPath = join(candidateRepo, '.git/filter-repo/commit-map');
  if (!existsSync(commitMapPath)) throw new Error('git-filter-repo did not produce a commit map.');
  const commitMapLines = readFileSync(commitMapPath, 'utf8').split('\n').filter((line) => line && !line.startsWith('old'));
  const commitMap = commitMapLines.map((line) => {
    const [source, filtered] = line.trim().split(/\s+/);
    return { source, filtered: /^0+$/.test(filtered) ? null : filtered };
  });
  const sourceTipMapping = commitMap.find(({ source }) => source === policy.sourceCommit);
  if (!sourceTipMapping?.filtered) throw new Error('Source tip was not preserved by the filter.');
  const filteredBaseTip = git(['rev-parse', 'HEAD'], candidateRepo).trim();
  if (filteredBaseTip !== sourceTipMapping.filtered) throw new Error('Candidate HEAD differs from the source-tip commit map entry.');
  const filteredTree = treeRecords(candidateRepo, filteredBaseTip);
  const filteredTreeDigest = sha256(filteredTree.map(({ path, mode, type, oid }) => `${path}\0${mode}\0${type}\0${oid}`).join('\n'));
  const parityMismatches = [];
  const sourceByPath = new Map(sourceTree.map((record) => [record.path, record]));
  const filteredByPath = new Map(filteredTree.map((record) => [record.path, record]));
  for (const path of [...new Set([...sourceByPath.keys(), ...filteredByPath.keys()])].sort()) {
    const source = sourceByPath.get(path);
    const filtered = filteredByPath.get(path);
    if (!source || !filtered || source.mode !== filtered.mode || source.type !== filtered.type || source.oid !== filtered.oid) {
      parityMismatches.push({ pathDigest: sha256(path), source: source ? { mode: source.mode, type: source.type, oid: source.oid } : null, filtered: filtered ? { mode: filtered.mode, type: filtered.type, oid: filtered.oid } : null });
    }
  }
  if (parityMismatches.length > 0) throw new Error(`Current-tree parity failed for ${parityMismatches.length} paths.`);
  const allowedHistoricalPaths = new Set([
    ...sourceTree.map(({ path }) => path),
    ...historySpec.filterContract.historicalPathMappings.map(({ target }) => target),
    ...historySpec.filterContract.directAdditionTargets,
    ...git(['log', policy.sourceCommit, '--name-only', '-z', '--format=', '--', 'unisane-ops'], umbrellaRoot)
      .split('\0').map((path) => path.trim()).filter((path) => path.startsWith('unisane-ops/')).map((path) => path.slice('unisane-ops/'.length)),
    ...policy.proofOverlayPaths,
  ]);
  const filteredHistoricalPaths = git(['log', '--all', '--name-only', '-z', '--format='], candidateRepo)
    .split('\0').map((path) => path.trim()).filter(Boolean);
  const excludedHistoricalPaths = [...new Set(filteredHistoricalPaths.filter((path) => !allowedHistoricalPaths.has(path)))].sort();
  if (excludedHistoricalPaths.length > 0) throw new Error(`Filtered history contains ${excludedHistoricalPaths.length} excluded paths.`);
  for (const path of policy.proofOverlayPaths) {
    if (path === 'docs/reference/generated/repository/standalone-repository-integrity.json') continue;
    const sourcePath = join(opsRoot, path);
    if (!existsSync(sourcePath)) throw new Error(`Proof overlay source is missing: ${path}`);
    const destination = join(candidateRepo, path);
    mkdirSync(dirname(destination), { recursive: true });
    cpSync(sourcePath, destination, { recursive: true });
  }
  run('node', ['scripts/check-repository-integrity.mjs', '--write'], candidateRepo);
  git(['add', ...policy.proofOverlayPaths], candidateRepo);
  git(
    ['-c', 'user.name=Unisane Ops Disposable Proof', '-c', 'user.email=ops-proof@invalid', 'commit', '-m', 'chore: apply disposable standalone proof overlay'],
    candidateRepo,
    {
      env: {
        GIT_AUTHOR_DATE: '2000-01-01T00:00:00Z',
        GIT_COMMITTER_DATE: '2000-01-01T00:00:00Z',
      },
    },
  );
  const overlayTip = git(['rev-parse', 'HEAD'], candidateRepo).trim();
  const overlayTree = git(['rev-parse', 'HEAD^{tree}'], candidateRepo).trim();
  const overlayPatch = git(['diff', '--binary', filteredBaseTip, overlayTip], candidateRepo);
  run('node', ['scripts/check-repository-integrity.mjs', '--check'], candidateRepo);
  const scanReceipt = scanCandidate(candidateRepo);
  const ownerLedger = ownerDecisionLedger(scanReceipt);
  const commitMapReceipt = {
    schemaVersion: 1,
    sourceCommit: policy.sourceCommit,
    filteredBaseTip,
    mappingCount: commitMap.length,
    preservedCount: commitMap.filter(({ filtered }) => filtered).length,
    prunedCount: commitMap.filter(({ filtered }) => !filtered).length,
    digest: sha256(commitMapLines.join('\n')),
    mappings: commitMap,
  };
  const preCleanup = {
    filterMetadataPresent: existsSync(join(candidateRepo, '.git/filter-repo')),
    remoteCount: git(['remote'], candidateRepo).split('\n').filter(Boolean).length,
    refInventory: compactRefInventory(candidateRepo),
    tagInventory: compactRefInventory(candidateRepo, 'refs/tags'),
    signatureInventory: signatureInventory(candidateRepo),
    objectInventory: objectInventory(candidateRepo).summary,
  };
  rmSync(join(candidateRepo, '.git/filter-repo'), { recursive: true, force: false });
  git(['reflog', 'expire', '--expire=now', '--all'], candidateRepo);
  git(['gc', '--prune=now'], candidateRepo);
  const fsckOutput = git(['fsck', '--full', '--strict', '--no-progress'], candidateRepo);
  const unreachableOutput = git(['fsck', '--unreachable', '--no-reflogs', '--no-progress'], candidateRepo);
  const alternatesPath = join(candidateRepo, '.git/objects/info/alternates');
  const postCleanup = {
    filterMetadataPresent: existsSync(join(candidateRepo, '.git/filter-repo')),
    remoteCount: git(['remote'], candidateRepo).split('\n').filter(Boolean).length,
    reflogEntryCount: git(['reflog', 'show', '--all'], candidateRepo).split('\n').filter(Boolean).length,
    alternatesPresent: existsSync(alternatesPath) && readFileSync(alternatesPath, 'utf8').trim().length > 0,
    originalRefCount: compactRefInventory(candidateRepo, 'refs/original').count,
    tagInventory: compactRefInventory(candidateRepo, 'refs/tags'),
    refInventory: compactRefInventory(candidateRepo),
    signatureInventory: signatureInventory(candidateRepo),
    objectInventory: objectInventory(candidateRepo).summary,
    fsckOutputDigest: sha256(fsckOutput),
    fsckClean: fsckOutput.trim().length === 0,
    unreachableOutputDigest: sha256(unreachableOutput),
    unreachableObjectCount: unreachableOutput.split('\n').filter(Boolean).length,
    workingTreeClean: git(['status', '--porcelain=v1', '--untracked-files=all'], candidateRepo).trim().length === 0,
  };
  if (postCleanup.filterMetadataPresent || postCleanup.remoteCount || postCleanup.reflogEntryCount || postCleanup.alternatesPresent || postCleanup.originalRefCount || postCleanup.tagInventory.count || !postCleanup.fsckClean || postCleanup.unreachableObjectCount || !postCleanup.workingTreeClean) {
    throw new Error('Disposable candidate cleanup or integrity proof failed.');
  }
  mkdirSync(receiptDirectory, { recursive: true });
  writeJson(join(receiptDirectory, 'commit-map.json'), commitMapReceipt);
  writeJson(join(receiptDirectory, 'public-safety-scan-receipt.json'), scanReceipt);
  writeJson(join(receiptDirectory, 'owner-decision-ledger.json'), ownerLedger);
  const provenanceReceipt = {
    schemaVersion: 1,
    state: 'technical-extraction-certified-public-promotion-blocked',
    taskId: policy.taskId,
    source: {
      integratedCommit: policy.sourceCommit,
      freezeCheckpoint: policy.freezeCheckpoint,
      stagingIntroductionCommit: policy.stagingIntroductionCommit,
      currentTreePathCount: sourceTree.length,
      currentTreeDigest: sourceTreeDigest,
      refInventoryAtExecution: sourceRefs,
      tagInventoryAtExecution: sourceTags,
      signatureInventory: sourceSignatures,
    },
    filter: {
      input: filterInput,
      inputDigest: filterInputDigest,
      normalizedCommand: `${policy.filterExecutable} --force --commit-callback <callback:${sha256(callback)}>`,
      commitMap: { path: 'commit-map.json', sha256: sha256(readFileSync(join(receiptDirectory, 'commit-map.json'))) },
      filteredBaseTip,
      filteredBaseTree: git(['rev-parse', `${filteredBaseTip}^{tree}`], candidateRepo).trim(),
      filteredCurrentTreeDigest: filteredTreeDigest,
      currentParity: { state: 'exact', mismatchCount: 0, contentAndModePathCount: filteredTree.length },
      excludedPathAbsence: { state: 'pass', historicalPathCount: new Set(filteredHistoricalPaths).size, excludedPathCount: 0 },
      tags: { admittedCount: 0, sourceTagInventory: sourceTags, candidateTagInventory: postCleanup.tagInventory },
    },
    proofOverlay: {
      state: 'disposable-candidate-only-not-authority',
      base: filteredBaseTip,
      tip: overlayTip,
      tree: overlayTree,
      paths: policy.proofOverlayPaths,
      patchSha256: sha256(overlayPatch),
      purpose: 'Correct CI Corepack ordering, replace the umbrella-only transition gate with a standalone integrity/generated-drift gate, and preserve the check-types command contract for proof.',
    },
    candidate: {
      path: candidateRepo,
      head: overlayTip,
      tree: overlayTree,
      branch: git(['branch', '--show-current'], candidateRepo).trim(),
      preCleanup,
      postCleanup,
    },
    safety: {
      receipt: { path: 'public-safety-scan-receipt.json', sha256: sha256(readFileSync(join(receiptDirectory, 'public-safety-scan-receipt.json'))) },
      ownerDecisionLedger: { path: 'owner-decision-ledger.json', sha256: sha256(readFileSync(join(receiptDirectory, 'owner-decision-ledger.json'))) },
      publicHistorySafe: false,
      standaloneCiReady: false,
      publicReleaseReady: false,
    },
    materializationRoute: [
      'Obtain reviewer approval for this technical receipt and proof-overlay corrections.',
      'Resolve the three exact dependency blockers or approve a specific fail-closed materialization contract.',
      'Obtain security/legal approval for scanners, findings, contributor identities, license/NOTICE, dependencies, assets, fixtures, provider terms, and remediation policy.',
      'Integrate the proof-overlay source corrections into the umbrella authority and rerun extraction from the newly approved immutable dev commit.',
      'Only then materialize into the designated final local path, generate its lockfile, adopt target-local Skopos, and verify one-writable-authority cutover under a separately approved Task.',
    ],
  };
  writeJson(join(receiptDirectory, 'provenance-receipt.json'), provenanceReceipt);
  writeJson(join(receiptDirectory, 'receipt-bundle.json'), {
    schemaVersion: 1,
    taskId: policy.taskId,
    files: readdirSync(receiptDirectory).filter((name) => name !== 'receipt-bundle.json').sort().map((name) => ({ name, sha256: sha256(readFileSync(join(receiptDirectory, name))) })),
  });
  console.log(JSON.stringify({ candidate: provenanceReceipt.candidate, filter: provenanceReceipt.filter, scan: { state: scanReceipt.state, totalFindingCount: scanReceipt.totalFindingCount, totalFindingDigest: scanReceipt.totalFindingDigest }, ownerDecisionCount: ownerLedger.decisions.length }, null, 2));
}

function checkProof() {
  const required = ['commit-map.json', 'owner-decision-ledger.json', 'provenance-receipt.json', 'public-safety-scan-receipt.json', 'receipt-bundle.json'];
  for (const name of required) if (!existsSync(join(receiptDirectory, name))) throw new Error(`Missing extraction proof receipt: ${name}`);
  if (!existsSync(candidateRepo)) throw new Error('Disposable candidate is missing.');
  const realCandidate = realpathSync(candidateRepo);
  if (!realCandidate.endsWith(`/unisane-ops-extraction-${policy.taskId}/repository`) || !/^\/(?:private\/)?tmp\//.test(realCandidate)) {
    throw new Error(`Disposable candidate resolved outside the exact task-local temporary path: ${realCandidate}`);
  }
  const provenance = readJson(join(receiptDirectory, 'provenance-receipt.json'));
  const scan = readJson(join(receiptDirectory, 'public-safety-scan-receipt.json'));
  const owners = readJson(join(receiptDirectory, 'owner-decision-ledger.json'));
  const bundle = readJson(join(receiptDirectory, 'receipt-bundle.json'));
  for (const { name, sha256: expected } of bundle.files) {
    const actual = sha256(readFileSync(join(receiptDirectory, name)));
    if (actual !== expected) throw new Error(`Receipt digest drift: ${name}`);
  }
  if (git(['rev-parse', 'HEAD'], candidateRepo).trim() !== provenance.candidate.head) throw new Error('Disposable candidate HEAD drifted.');
  if (git(['rev-parse', 'HEAD^{tree}'], candidateRepo).trim() !== provenance.candidate.tree) throw new Error('Disposable candidate tree drifted.');
  run('node', ['scripts/check-repository-integrity.mjs', '--check'], candidateRepo);
  const post = provenance.candidate.postCleanup;
  if (existsSync(join(candidateRepo, '.git/filter-repo')) || git(['remote'], candidateRepo).trim() || git(['reflog', 'show', '--all'], candidateRepo).trim() || post.unreachableObjectCount !== 0) throw new Error('Disposable candidate residue reappeared.');
  git(['fsck', '--full', '--strict', '--no-progress'], candidateRepo);
  if (scan.certification.publicHistorySafe !== false || owners.state !== 'fail-closed' || provenance.safety.standaloneCiReady !== false) throw new Error('Fail-closed readiness state drifted.');
  const blockerSubjects = owners.decisions.filter(({ id }) => ['OPS-R03-UI', 'OPS-R03-DATA-TABLE', 'OPS-R04-FRAMEWORK-DEVTOOLS'].includes(id)).map(({ subject }) => subject).sort();
  if (blockerSubjects.length !== 3) throw new Error('Exact external blocker ledger drifted.');
  console.log(`Disposable extraction proof verified at ${provenance.candidate.head}; public promotion remains blocked by ${owners.decisions.filter(({ state }) => state !== 'resolved').length} owner decisions.`);
}

if (execute) executeProof();
else checkProof();
