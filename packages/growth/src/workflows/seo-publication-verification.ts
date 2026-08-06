import path from 'node:path';
import { readdir } from 'node:fs/promises';
import {
  seoImplementationPacketSchema,
  type SeoImplementationPacket,
} from '../playbooks/seo-opportunity-preparation.js';
import {
  recordSeoPublication,
  seoPublicationRecordSchema,
  verifySeoPublication,
  type SeoPublicationRecord,
  type SeoPublicationVerification,
} from '../playbooks/seo-publication-verification.js';
import {
  growthSeoOpportunityResearchOutputSchema,
  type GrowthSeoOpportunityResearchOutput,
} from '../actions/seo-opportunity-research.js';
import { readJson, writeJson } from '../utils/fs.js';

export type RecordSeoPublicationArtifactsOptions = {
  cwd: string;
  packetPath: string;
  outputPath: string;
  publishedUrl: string;
  publishedAt: string;
  recordedBy: string;
  confirmedReviewed: boolean;
  expectedProjectId?: string;
  expectedEnvironmentId?: string;
  packet?: SeoImplementationPacket;
  recordedAt?: Date;
  dryRun?: boolean;
};

export type RecordSeoPublicationArtifactsResult = {
  publication: SeoPublicationRecord;
  outputPath: string;
  dryRun: boolean;
};

export type VerifySeoPublicationArtifactsOptions = {
  cwd: string;
  publicationPath: string;
  outputPath: string;
  review: GrowthSeoOpportunityResearchOutput;
  publication?: SeoPublicationRecord;
  observedAt?: Date;
  dryRun?: boolean;
};

export type VerifySeoPublicationArtifactsResult = {
  verification: SeoPublicationVerification;
  outputPath: string;
  dryRun: boolean;
};

function resolvePath(cwd: string, value: string): string {
  return path.isAbsolute(value) ? value : path.resolve(cwd, value);
}

export async function loadSeoPublicationRecord(
  cwd: string,
  publicationPath: string,
): Promise<SeoPublicationRecord> {
  return seoPublicationRecordSchema.parse(await readJson(resolvePath(cwd, publicationPath)));
}

export async function findSeoPublicationRecord(input: {
  directory: string;
  publicationId: string;
  maximumFiles?: number;
}): Promise<{ filePath: string; publication: SeoPublicationRecord } | undefined> {
  const maximumFiles = input.maximumFiles ?? 100;
  if (!Number.isInteger(maximumFiles) || maximumFiles < 1 || maximumFiles > 500) {
    throw new Error('Publication lookup maximumFiles must be between 1 and 500.');
  }
  let names: string[];
  try {
    names = (await readdir(input.directory))
      .filter((name) => name.endsWith('.json'))
      .sort()
      .slice(0, maximumFiles + 1);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
  if (names.length > maximumFiles) {
    throw new Error(`Publication lookup exceeds the ${maximumFiles}-file safety bound.`);
  }
  for (const name of names) {
    const filePath = path.join(input.directory, name);
    const publication = seoPublicationRecordSchema.parse(await readJson(filePath));
    if (publication.publicationId === input.publicationId) return { filePath, publication };
  }
  return undefined;
}

export async function recordSeoPublicationArtifacts(
  options: RecordSeoPublicationArtifactsOptions,
): Promise<RecordSeoPublicationArtifactsResult> {
  const cwd = path.resolve(options.cwd);
  const packet = seoImplementationPacketSchema.parse(
    options.packet ?? (await readJson(resolvePath(cwd, options.packetPath))),
  );
  const publication = recordSeoPublication({
    packet,
    publishedUrl: options.publishedUrl,
    publishedAt: options.publishedAt,
    recordedAt: (options.recordedAt ?? new Date()).toISOString(),
    recordedBy: options.recordedBy,
    confirmedReviewed: options.confirmedReviewed,
    ...(options.expectedProjectId ? { expectedProjectId: options.expectedProjectId } : {}),
    ...(options.expectedEnvironmentId
      ? { expectedEnvironmentId: options.expectedEnvironmentId }
      : {}),
  });
  const outputPath = resolvePath(cwd, options.outputPath);
  if (!options.dryRun) await writeJson(outputPath, publication);
  return {
    publication,
    outputPath: path.relative(cwd, outputPath),
    dryRun: options.dryRun === true,
  };
}

export async function verifySeoPublicationArtifacts(
  options: VerifySeoPublicationArtifactsOptions,
): Promise<VerifySeoPublicationArtifactsResult> {
  const cwd = path.resolve(options.cwd);
  const publication =
    options.publication ?? (await loadSeoPublicationRecord(cwd, options.publicationPath));
  const review = growthSeoOpportunityResearchOutputSchema.parse(options.review);
  if (
    review.projectId !== publication.projectId ||
    review.environmentId !== publication.environmentId
  ) {
    throw new Error('Current research does not match the publication project and environment.');
  }
  const opportunity = review.opportunities.find((item) => item.id === publication.opportunity.id);
  const evidenceIds = new Set(opportunity?.evidenceIds ?? []);
  const evidence = review.evidence.filter((item) => evidenceIds.has(item.evidenceId));
  const verification = verifySeoPublication({
    publication,
    ...(opportunity ? { opportunity } : {}),
    evidence,
    observedAt: (options.observedAt ?? new Date()).toISOString(),
  });
  const outputPath = resolvePath(cwd, options.outputPath);
  if (!options.dryRun) await writeJson(outputPath, verification);
  return {
    verification,
    outputPath: path.relative(cwd, outputPath),
    dryRun: options.dryRun === true,
  };
}
