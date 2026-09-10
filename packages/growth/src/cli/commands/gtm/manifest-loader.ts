import { loadGoogleTagManagerManifestFile } from '../../../gtm/manifest-file.js';
import { loadGrowthProjectContext } from '../../project-context.js';
export type LoadedGoogleTagManagerManifest = Awaited<
  ReturnType<typeof loadGoogleTagManagerManifestFile>
>;
export async function loadGoogleTagManagerManifest(args: {
  cwd?: string;
  manifestPath?: string;
  app?: string;
}): Promise<LoadedGoogleTagManagerManifest> {
  const context = await loadGrowthProjectContext();
  const selected = args.manifestPath ?? context.growth.runtime.manifest;
  if (!selected)
    throw new Error('[GTM_MANIFEST_SELECTION_MISSING] Select the Growth runtime manifest.');
  const result = await loadGoogleTagManagerManifestFile(args.cwd ?? context.projectRoot, selected);
  if (args.app && args.app !== result.manifest.appId)
    throw new Error('[GTM_MANIFEST_APP_MISMATCH] Requested app differs from the manifest.');
  return result;
}
