const digestPattern = /^([^\s@]+)@sha256:([a-f0-9]{64})$/;
const zeroDigest = '0'.repeat(64);

export function parseDigestReference(value, options = {}) {
  const match = digestPattern.exec(value ?? '');
  if (!match) {
    throw new Error('Hosted release images must use one exact sha256 digest reference.');
  }
  if (!options.allowPlaceholder && match[2] === zeroDigest) {
    throw new Error('The placeholder hosted release digest cannot be deployed.');
  }
  return { repository: match[1], digest: `sha256:${match[2]}` };
}

export function assertSignerPolicy(identity, issuer) {
  if (!identity || identity.trim() !== identity) {
    throw new Error('An exact hosted release signer identity is required.');
  }
  let url;
  try {
    url = new URL(issuer);
  } catch {
    throw new Error('A valid hosted release signer issuer is required.');
  }
  if (url.protocol !== 'https:') {
    throw new Error('The hosted release signer issuer must use HTTPS.');
  }
}

function valuesWithKey(value, key, result = []) {
  if (!value || typeof value !== 'object') return result;
  if (Object.hasOwn(value, key)) result.push(value[key]);
  for (const child of Object.values(value)) valuesWithKey(child, key, result);
  return result;
}

export function assertProvenance(value, expected) {
  if (!expected?.source || !expected?.revision) {
    throw new Error('The expected hosted release source and revision are required.');
  }
  const statements = valuesWithKey(value, 'SLSA');
  if (
    statements.length === 0 ||
    statements.some(
      (statement) =>
        !statement ||
        typeof statement !== 'object' ||
        typeof statement.buildDefinition?.buildType !== 'string' ||
        !Array.isArray(statement.buildDefinition?.resolvedDependencies) ||
        statement.buildDefinition.resolvedDependencies.length === 0 ||
        !statement.runDetails ||
        !valuesWithKey(statement, 'vcs:source').includes(expected.source) ||
        !valuesWithKey(statement, 'vcs:revision').includes(expected.revision),
    )
  ) {
    throw new Error('The hosted release is missing matching SLSA v1 provenance.');
  }
}

export function assertSbom(value) {
  const documents = valuesWithKey(value, 'SPDX');
  if (
    documents.length === 0 ||
    documents.some(
      (document) =>
        !document ||
        typeof document !== 'object' ||
        document.SPDXID !== 'SPDXRef-DOCUMENT' ||
        !Array.isArray(document.packages),
    )
  ) {
    throw new Error('The hosted release is missing a valid SPDX SBOM.');
  }
}

export function extractRenderedImages(...documents) {
  return documents.flatMap((document) =>
    [...document.matchAll(/^\s*(?:-\s*)?image:\s*['"]?([^\s'"]+)['"]?\s*$/gm)].map(
      (match) => match[1],
    ),
  );
}

export function assertDeploymentDigests(images, options = {}) {
  if (images.length === 0) throw new Error('No hosted workload images were rendered.');
  const parsed = images.map((image) => parseDigestReference(image, options));
  const expected = `${parsed[0].repository}@${parsed[0].digest}`;
  if (images.some((image) => image !== expected)) {
    throw new Error('Every hosted workload must use the same immutable release digest.');
  }
  return expected;
}
