import path from 'node:path';
import { readJson, writeJson } from '../../utils/fs.js';
import { pageOpportunityFileSchema } from '../schema/opportunity.js';
import { updateOpportunityStatus, type OpportunityStatus } from './update-status.js';

export type UpdateOpportunityStatusFileOptions = {
  cwd?: string;
  opportunities: string;
  output: string;
  id?: string;
  slug?: string;
  routePath?: string;
  status: OpportunityStatus;
  dryRun?: boolean;
};

export type UpdateOpportunityStatusFileResult = {
  opportunities: string;
  output: string;
  platformId: string;
  updatedId: string;
  updatedSlug: string;
  updatedRoutePath: string;
  status: OpportunityStatus;
  dryRun: boolean;
};

export async function updateOpportunityStatusFile(
  options: UpdateOpportunityStatusFileOptions,
): Promise<UpdateOpportunityStatusFileResult> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const opportunityPath = resolvePath(cwd, options.opportunities);
  const outputPath = resolvePath(cwd, options.output);
  const opportunityFile = pageOpportunityFileSchema.parse(await readJson(opportunityPath));
  const result = updateOpportunityStatus({
    opportunityFile,
    match: {
      id: options.id,
      slug: options.slug,
      routePath: options.routePath,
    },
    status: options.status,
  });

  if (!options.dryRun) {
    await writeJson(outputPath, result.opportunityFile);
  }

  return {
    opportunities: path.relative(cwd, opportunityPath),
    output: path.relative(cwd, outputPath),
    platformId: result.opportunityFile.platformId,
    updatedId: result.updated.id,
    updatedSlug: result.updated.slug,
    updatedRoutePath: result.updated.routePath,
    status: result.updated.status,
    dryRun: options.dryRun === true,
  };
}

function resolvePath(cwd: string, maybeRelativePath: string): string {
  return path.isAbsolute(maybeRelativePath)
    ? maybeRelativePath
    : path.resolve(cwd, maybeRelativePath);
}
