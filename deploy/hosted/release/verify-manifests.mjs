#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { assertDeploymentDigests, extractRenderedImages } from './policy.mjs';

const arguments_ = process.argv.slice(2);
const allowPlaceholder = arguments_.includes('--allow-placeholder');
const configuredRoots = arguments_.filter((argument) => argument !== '--allow-placeholder');
const defaultRoots = [
  'unisane-ops/deploy/hosted/kubernetes/migration',
  'unisane-ops/deploy/hosted/kubernetes/runtime',
  'unisane-ops/deploy/hosted/kubernetes/rollback-check',
];
const roots = configuredRoots.length === 0 ? defaultRoots : configuredRoots;

function main() {
  if (roots.length !== 3) {
    throw new Error('Provide the migration, runtime, and rollback-check deployment roots.');
  }
  const documents = roots.map((root) => {
    const result = spawnSync('kubectl', ['kustomize', root], { encoding: 'utf8' });
    if (result.status !== 0) {
      throw new Error(`Failed to render hosted deployment root ${root}.`);
    }
    return result.stdout;
  });
  const images = extractRenderedImages(...documents);
  const image = assertDeploymentDigests(images, { allowPlaceholder });

  process.stdout.write(
    `${JSON.stringify({
      schemaVersion: 1,
      kind: 'unisane.ops.hosted-deployment-image-verification',
      image,
      workloadCount: images.length,
      placeholder: allowPlaceholder,
    })}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : 'Hosted deployment verification failed.'}\n`,
  );
  process.exitCode = 1;
}
