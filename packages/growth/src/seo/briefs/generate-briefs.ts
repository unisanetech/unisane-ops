import path from 'node:path';
import { writeJson, writeText } from '../../utils/fs.js';
import {
  contentBriefIndexSchema,
  type ContentBriefIndex,
  type ContentBriefIndexItem,
} from '../schema/brief.js';
import {
  pageOpportunityFileSchema,
  type PageOpportunity,
  type PageOpportunityFile,
} from '../schema/opportunity.js';
import { renderContentBrief } from './render-brief.js';

export type ContentBriefStatusFilter = 'all' | 'candidate' | 'approved' | 'rejected' | 'built';

export type GenerateContentBriefsOptions = {
  opportunityFile: PageOpportunityFile;
  outputDir: string;
  indexOutputDir?: string;
  generatedFrom: string;
  status?: ContentBriefStatusFilter;
  dryRun?: boolean;
};

export type GenerateContentBriefsResult = {
  outputDir: string;
  indexPath: string;
  platformId: string;
  sourcePatternPack: string;
  briefCount: number;
  dryRun: boolean;
};

export async function generateContentBriefs(
  options: GenerateContentBriefsOptions,
): Promise<GenerateContentBriefsResult> {
  const opportunityFile = pageOpportunityFileSchema.parse(options.opportunityFile);
  const status = options.status ?? 'all';
  const opportunities = opportunityFile.opportunities.filter((opportunity) =>
    status === 'all' ? opportunity.status !== 'rejected' : opportunity.status === status,
  );
  const indexPath = path.join(options.outputDir, 'briefs.index.json');
  const index = createBriefIndex({
    opportunityFile,
    opportunities,
    outputDir: options.indexOutputDir ?? options.outputDir,
    generatedFrom: options.generatedFrom,
  });

  if (!options.dryRun) {
    for (const opportunity of opportunities) {
      await writeText(
        path.join(options.outputDir, `${opportunity.slug}.md`),
        renderContentBrief(opportunity),
      );
    }
    await writeJson(indexPath, index);
  }

  return {
    outputDir: options.outputDir,
    indexPath,
    platformId: opportunityFile.platformId,
    sourcePatternPack: opportunityFile.sourcePatternPack,
    briefCount: opportunities.length,
    dryRun: options.dryRun === true,
  };
}

function createBriefIndex(options: {
  opportunityFile: PageOpportunityFile;
  opportunities: PageOpportunity[];
  outputDir: string;
  generatedFrom: string;
}): ContentBriefIndex {
  const briefs: ContentBriefIndexItem[] = options.opportunities.map((opportunity) => ({
    id: `${opportunity.id}:brief`,
    opportunityId: opportunity.id,
    slug: opportunity.slug,
    routePath: opportunity.routePath,
    title: opportunity.title,
    primaryKeyword: opportunity.primaryKeyword,
    priority: opportunity.priority,
    status: opportunity.status,
    filePath: path.join(options.outputDir, `${opportunity.slug}.md`),
  }));

  return contentBriefIndexSchema.parse({
    version: 1,
    platformId: options.opportunityFile.platformId,
    sourcePatternPack: options.opportunityFile.sourcePatternPack,
    generatedFrom: options.generatedFrom,
    briefs,
  });
}
