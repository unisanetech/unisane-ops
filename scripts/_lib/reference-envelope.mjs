import { createHash } from 'node:crypto';

const DEFAULT_OWNER = 'architecture-program';
const DEFAULT_STATUS = 'generated';
const DEFAULT_GENERATOR_VERSION = 1;
const DEFAULT_SOURCE_COMMIT = process.env.GIT_COMMIT_SHA ?? 'workspace';

function isSourcePathLike(value) {
  if (typeof value !== 'string') return false;
  return (
    value.includes('/') ||
    value.includes('\\') ||
    value.endsWith('.json') ||
    value.endsWith('.md') ||
    value.endsWith('.mjs') ||
    value.endsWith('.ts')
  );
}

function collectSourcePaths(value, out) {
  if (Array.isArray(value)) {
    for (const item of value) collectSourcePaths(item, out);
    return;
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectSourcePaths(item, out);
    return;
  }

  if (isSourcePathLike(value)) out.add(String(value));
}

function toSortedSourceFiles(source) {
  const values = new Set();
  collectSourcePaths(source, values);
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function withReferenceEnvelope(
  payload,
  {
    generatorScript = null,
    generatorVersion = DEFAULT_GENERATOR_VERSION,
    owner = DEFAULT_OWNER,
    status = DEFAULT_STATUS,
    sourceCommit = DEFAULT_SOURCE_COMMIT,
  } = {},
) {
  const { schemaVersion, source = {}, summary = {}, generatedAt: _generatedAt, ...rest } = payload;
  const sourceFiles = toSortedSourceFiles(source);

  const base = {
    schemaVersion,
    source,
    summary,
    owner,
    status,
    generatorScript,
    generatorVersion,
    sourceCommit,
    sourceFiles,
    ...rest,
  };

  const digest = createHash('sha256').update(JSON.stringify(base)).digest('hex').slice(0, 12);

  return {
    ...base,
    generatedAt: `content-hash:${digest}`,
  };
}

export function withGeneratedMarkdownEnvelope(
  content,
  filePath,
  {
    owner = 'unisane',
    scope = 'workspace',
    provenance = 'declared',
    view = 'current',
  } = {},
) {
  const repoPath = String(filePath)
    .replaceAll('\\', '/')
    .replace(`${process.cwd().replaceAll('\\', '/')}/`, '');
  const id = createHash('sha256').update(repoPath).digest('hex').slice(0, 12);

  return [
    '---',
    `id: "DOC-${id}"`,
    `owner: "${owner}"`,
    `scope: ${scope}`,
    'role: reference',
    'lifecycle: durable',
    'authority: generated',
    `provenance: ${provenance}`,
    `view: ${view}`,
    '---',
    content.replace(/^---\n[\s\S]*?\n---\n/, '').trimStart(),
  ].join('\n');
}
