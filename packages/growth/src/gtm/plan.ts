import { getGoogleTagManagerDesiredResources } from './normalize';
import { stableJson } from './stable-json';
import type {
  GoogleTagManagerContainerManifest,
  GoogleTagManagerPlan,
  GoogleTagManagerPlanOperation,
  GoogleTagManagerRemoteResource,
  GoogleTagManagerRemoteSnapshot,
  GoogleTagManagerResourceKind,
} from './contracts';

function resourceKey(kind: GoogleTagManagerResourceKind, slug: string): string {
  return `${kind}:${slug}`;
}

function indexRemoteResources(
  snapshot: GoogleTagManagerRemoteSnapshot | undefined,
): Map<string, GoogleTagManagerRemoteResource> {
  return new Map(
    (snapshot?.resources ?? []).map((resource) => [
      resourceKey(resource.kind, resource.slug),
      resource,
    ]),
  );
}

export function planGoogleTagManagerChanges(args: {
  manifest: GoogleTagManagerContainerManifest;
  remote?: GoogleTagManagerRemoteSnapshot;
}): GoogleTagManagerPlan {
  const operations: GoogleTagManagerPlanOperation[] = [];
  const desired = getGoogleTagManagerDesiredResources(args.manifest);
  const remoteByKey = indexRemoteResources(args.remote);
  const desiredKeys = new Set<string>();

  for (const resource of desired) {
    const key = resourceKey(resource.kind, resource.slug);
    desiredKeys.add(key);
    const remote = remoteByKey.get(key);
    if (!remote) {
      operations.push({
        type: 'create_resource',
        kind: resource.kind,
        slug: resource.slug,
        after: resource.payload,
      });
      continue;
    }

    if (stableJson(remote.payload) !== stableJson(resource.payload)) {
      operations.push({
        type: 'update_resource',
        kind: resource.kind,
        slug: resource.slug,
        remoteId: remote.remoteId,
        fingerprint: remote.fingerprint,
        before: remote.payload,
        after: resource.payload,
      });
    }
  }

  for (const remote of args.remote?.resources ?? []) {
    const key = resourceKey(remote.kind, remote.slug);
    if (desiredKeys.has(key)) continue;
    if (remote.managed === false) {
      operations.push({
        type: 'retain_unmanaged_resource',
        kind: remote.kind,
        slug: remote.slug,
        remoteId: remote.remoteId,
        fingerprint: remote.fingerprint,
        before: remote.payload,
      });
      continue;
    }
    if (remote.kind === 'tag') {
      operations.push({
        type: 'pause_tag',
        kind: remote.kind,
        slug: remote.slug,
        remoteId: remote.remoteId,
        fingerprint: remote.fingerprint,
        before: remote.payload,
      });
    }
  }

  return {
    containerPath: args.remote?.containerPath,
    operations,
  };
}
