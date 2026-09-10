import path from 'node:path';
import { createHash } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { googleTagManagerDiagnosisInputSchema } from './diagnosis.js';
export async function loadGoogleTagManagerManifestFile(projectRoot: string, selectedPath: string) {
  const root = await realpath(projectRoot);
  const file = await realpath(path.resolve(root, selectedPath));
  const relative = path.relative(root, file);
  if (relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative))
    throw new Error(
      '[GTM_MANIFEST_PATH_OUTSIDE_PROJECT] Manifest must remain inside the selected project.',
    );
  const url = pathToFileURL(file);
  url.searchParams.set(
    'revision',
    createHash('sha256')
      .update(await readFile(file))
      .digest('hex'),
  );
  const moduleValue = (await import(url.href)) as Record<string, unknown>;
  const manifest = googleTagManagerDiagnosisInputSchema.shape.manifest.parse(
    moduleValue.default ?? moduleValue.googleTagManagerContainer ?? moduleValue.gtmContainer,
  );
  return { manifest, path: file };
}
