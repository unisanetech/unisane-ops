import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const MODE = process.argv.includes('--write') ? 'write' : process.argv.includes('--check') ? 'check' : null;
const OUTPUT_DIR = path.join(ROOT, 'docs', 'reference', 'generated', 'llm', 'scopes');
const PACKAGE_ROOT = path.join(ROOT, 'packages');
const REPOSITORY_NAME = readJson(path.join(ROOT, 'package.json')).name;
const REPOSITORY_OWNER = REPOSITORY_NAME.startsWith('unisane-ops')
  ? 'unisane-ops'
  : REPOSITORY_NAME;
const SCOPE_PREFIX = REPOSITORY_NAME === 'unisane-pro' ? 'pro' : 'ops';

if (!MODE) {
  throw new Error('Usage: node scripts/commands/references/generate-scope-reference.mjs --write|--check');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function repoPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(filePath);
    return entry.isFile() ? [filePath] : [];
  });
}

function strings(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

function sourceEntryPoints(packageDir, manifest) {
  const candidates = new Set([
    path.join(packageDir, 'src', 'index.ts'),
    path.join(packageDir, 'src', 'index.tsx'),
    path.join(packageDir, 'src', 'module.ts'),
  ]);
  for (const exportedPath of strings(manifest.exports)) {
    if (!exportedPath.startsWith('./src/')) continue;
    candidates.add(path.join(packageDir, exportedPath.slice(2)));
  }
  return [...candidates].filter((candidate) => fs.existsSync(candidate)).map(repoPath).sort();
}

function descriptorProjection(packageDir) {
  const descriptorPath = path.join(packageDir, 'compiler-descriptor.json');
  if (!fs.existsSync(descriptorPath)) return { operations: [], tokens: [] };
  const descriptor = readJson(descriptorPath);
  const routes = (descriptor.httpExposure ?? []).flatMap((exposure) => exposure.routes ?? []);
  const operations = routes
    .map((route) => route.operation?.opKey ?? route.metadata?.operation)
    .filter((value) => typeof value === 'string')
    .sort();
  const tokens = [
    ...routes.map((route) => route.metadata?.token?.name),
    ...strings(descriptor.bindingPlan),
  ]
    .filter((value) => typeof value === 'string' && /^[A-Z][A-Z0-9_]+$/u.test(value))
    .sort();
  return { operations: [...new Set(operations)], tokens: [...new Set(tokens)] };
}

function buildCard(packageDir) {
  const manifestPath = path.join(packageDir, 'package.json');
  const manifest = readJson(manifestPath);
  const packageId = path.basename(packageDir);
  const scopeId = `${SCOPE_PREFIX}/${packageId}`;
  const contractFiles = listFiles(path.join(packageDir, 'src', 'contracts'))
    .filter((filePath) => /\.[cm]?[jt]sx?$/u.test(filePath))
    .map(repoPath)
    .sort();
  const readmePath = path.join(packageDir, 'README.md');
  const relevantDocs = fs.existsSync(readmePath) ? [repoPath(readmePath)] : [];
  const { operations, tokens } = descriptorProjection(packageDir);
  const aliases = [...new Set([packageId, manifest.name].filter(Boolean))].sort();
  const entryPoints = sourceEntryPoints(packageDir, manifest);
  const validationCapabilities = Object.keys(manifest.scripts ?? {}).sort();
  const packageDirPath = repoPath(packageDir);
  const base = {
    schemaVersion: 1,
    source: {
      packageManifest: repoPath(manifestPath),
      compilerDescriptor: fs.existsSync(path.join(packageDir, 'compiler-descriptor.json'))
        ? repoPath(path.join(packageDir, 'compiler-descriptor.json'))
        : null,
    },
    summary: {
      scopeId,
      kind: SCOPE_PREFIX === 'pro' ? 'pro-module' : 'ops-tooling',
      operationCount: operations.length,
      tokenCount: tokens.length,
      aliasCount: aliases.length,
      validationCapabilityCount: validationCapabilities.length,
      relevantDocCount: relevantDocs.length,
    },
    owner: REPOSITORY_OWNER,
    status: 'generated',
    generatorScript: 'scripts/commands/references/generate-scope-reference.mjs',
    generatorVersion: 1,
    sourceCommit: process.env.GIT_COMMIT_SHA ?? 'workspace',
    sourceFiles: [
      repoPath(manifestPath),
      ...(fs.existsSync(path.join(packageDir, 'compiler-descriptor.json'))
        ? [repoPath(path.join(packageDir, 'compiler-descriptor.json'))]
        : []),
      ...contractFiles,
    ].sort(),
    records: {
      scope: {
        scopeId,
        kind: SCOPE_PREFIX === 'pro' ? 'pro-module' : 'ops-tooling',
        packageName: manifest.name,
        packageDir: packageDirPath,
        deployableId: null,
        deployableKind: null,
      },
      aliases,
      operations,
      tokens,
      entryPoints,
      validationCapabilities,
      relevantDocs,
      contractFiles,
      paths: [packageDirPath],
    },
  };
  const digest = crypto.createHash('sha256').update(JSON.stringify(base)).digest('hex').slice(0, 12);
  return { fileName: `${scopeId.replaceAll('/', '__')}.json`, payload: { ...base, generatedAt: `content-hash:${digest}` } };
}

function packageDirs() {
  if (!fs.existsSync(PACKAGE_ROOT)) return [];
  return fs.readdirSync(PACKAGE_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(PACKAGE_ROOT, entry.name))
    .filter((packageDir) => fs.existsSync(path.join(packageDir, 'package.json')) && fs.existsSync(path.join(packageDir, 'src')))
    .sort();
}

function applyCard({ fileName, payload }) {
  const filePath = path.join(OUTPUT_DIR, fileName);
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  if (MODE === 'write') {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(filePath, content, 'utf8');
    return;
  }
  if (!fs.existsSync(filePath) || fs.readFileSync(filePath, 'utf8') !== content) {
    throw new Error(`Generated scope reference is missing or stale: ${repoPath(filePath)}`);
  }
}

const cards = packageDirs().map(buildCard);
if (MODE === 'write' && fs.existsSync(OUTPUT_DIR)) {
  const expected = new Set(cards.map(({ fileName }) => fileName));
  for (const fileName of fs.readdirSync(OUTPUT_DIR)) {
    if (fileName.startsWith(`${SCOPE_PREFIX}__`) && !expected.has(fileName)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, fileName));
    }
  }
}
for (const card of cards) applyCard(card);
console.log(MODE === 'write' ? `Generated ${cards.length} local scope references.` : `Verified ${cards.length} local scope references.`);
