import { z } from 'zod';
import {
  rankedSeoOpportunitySchema,
  seoOpportunityEvidenceSchema,
  type RankedSeoOpportunity,
  type SeoOpportunityEvidence,
} from './seo-opportunity-research.js';
import {
  seoOpportunityResearchPlanSchema,
  seoResearchRequestSchema,
  type SeoOpportunityResearchPlan,
} from './seo-opportunity-research-plan.js';
import { pageOpportunitySchema, type PageOpportunity } from '../seo/schema/opportunity.js';
import { seoOpportunityIdsMatch } from '../seo/identifiers.js';

const conciseTextSchema = z.string().trim().min(1).max(280);

export const seoImplementationPacketSchema = z
  .object({
    kind: z.literal('unisane.growth.seo-implementation-packet'),
    version: z.literal(1),
    packetId: z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/),
    projectId: z.string().min(1),
    environmentId: z.string().min(1),
    preparedAt: z.string().datetime({ offset: true }),
    source: z
      .object({
        opportunityFile: z.string().min(1),
        opportunityReviewObservedAt: z.string().datetime({ offset: true }),
      })
      .strict(),
    selection: z
      .object({
        opportunityId: z.string().min(1),
        opportunityStatus: z.literal('approved'),
        eligibility: z.literal('approved-opportunity-record'),
        implementationApproval: z.literal('not-granted'),
      })
      .strict(),
    opportunity: rankedSeoOpportunitySchema,
    pageSpecification: z
      .object({
        routePath: z.string().startsWith('/'),
        title: z.string().min(1),
        h1: z.string().min(1),
        metaDescription: z.string().min(1),
        primaryKeyword: z.string().min(1),
        supportingKeywords: z.array(z.string().min(1)),
        sections: pageOpportunitySchema.shape.sections,
        internalLinks: pageOpportunitySchema.shape.internalLinks,
        cta: pageOpportunitySchema.shape.cta,
      })
      .strict(),
    evidence: z.array(seoOpportunityEvidenceSchema).min(1).max(5),
    recommendedResearch: z.array(seoResearchRequestSchema).max(12),
    constraints: z.array(conciseTextSchema).min(1).max(16),
    acceptanceCriteria: z.array(conciseTextSchema).min(1).max(20),
    measurementPlan: z
      .object({
        baseline: z.discriminatedUnion('status', [
          z
            .object({
              status: z.literal('recorded'),
              observedAt: z.string().datetime({ offset: true }),
              evidenceIds: z.array(z.string().min(1)).min(1).max(5),
              values: z
                .object({
                  clicks: z.number().int().nonnegative().optional(),
                  impressions: z.number().int().nonnegative().optional(),
                  ctr: z.number().min(0).max(1).optional(),
                  averagePosition: z.number().positive().optional(),
                })
                .strict(),
            })
            .strict(),
          z
            .object({
              status: z.literal('not-available'),
              evidenceIds: z.array(z.string().min(1)).min(1).max(5),
              reason: conciseTextSchema,
            })
            .strict(),
        ]),
        metrics: z
          .array(
            z.enum([
              'search-clicks',
              'search-impressions',
              'search-ctr',
              'search-average-position',
            ]),
          )
          .min(1),
        comparisonMode: z.enum(['compare-to-recorded-baseline', 'establish-first-observed-result']),
        verificationWindow: z
          .object({
            notBeforeDaysAfterPublication: z.number().int().positive(),
            expiresDaysAfterPublication: z.number().int().positive(),
          })
          .refine(
            (value) => value.expiresDaysAfterPublication > value.notBeforeDaysAfterPublication,
            'Verification window must end after it begins.',
          ),
        publicationStatus: z.literal('not-recorded'),
        successRule: z.literal('review-relative-change-with-limitations'),
        limitations: z.array(conciseTextSchema).min(1).max(12),
      })
      .strict(),
    delivery: z
      .object({
        level: z.literal('prepare'),
        audience: z.enum(['content-team', 'coding-agent']),
        effect: z.literal('offline-artifact-only'),
        prohibitedEffects: z
          .array(
            z.enum([
              'repository-edit',
              'cms-publication',
              'provider-mutation',
              'production-deployment',
            ]),
          )
          .length(4),
      })
      .strict(),
  })
  .strict();

export type SeoImplementationPacket = z.infer<typeof seoImplementationPacketSchema>;

function stableId(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'packet'
  );
}

function selectedEvidence(input: {
  opportunity: RankedSeoOpportunity;
  evidence: readonly SeoOpportunityEvidence[];
}): SeoOpportunityEvidence[] {
  const byId = new Map(input.evidence.map((item) => [item.evidenceId, item]));
  const selected = input.opportunity.evidenceIds.map((id) => byId.get(id));
  if (selected.some((item) => item === undefined)) {
    throw new Error('The selected opportunity is missing referenced evidence.');
  }
  return selected as SeoOpportunityEvidence[];
}

function validateSelection(input: {
  opportunity: RankedSeoOpportunity;
  pageOpportunity: PageOpportunity;
  evidence: readonly SeoOpportunityEvidence[];
  researchPlan: SeoOpportunityResearchPlan;
  projectId: string;
}) {
  if (input.pageOpportunity.platformId !== input.projectId) {
    throw new Error('The approved opportunity platform does not match the selected project.');
  }
  if (!seoOpportunityIdsMatch(input.pageOpportunity.id, input.opportunity.id)) {
    throw new Error('The approved opportunity id does not match the ranked opportunity.');
  }
  if (input.pageOpportunity.status !== 'approved') {
    throw new Error('The opportunity must be explicitly approved before preparation.');
  }
  if (
    input.pageOpportunity.routePath !== input.opportunity.routePath ||
    input.pageOpportunity.primaryKeyword !== input.opportunity.primaryKeyword
  ) {
    throw new Error('The approved opportunity target does not match the ranked evidence.');
  }
  if (input.opportunity.confidence === 'low') {
    throw new Error('Low-confidence opportunities cannot produce an implementation packet.');
  }
  if (input.evidence.some((item) => item.sampleData)) {
    throw new Error('Sample evidence cannot produce an implementation packet.');
  }
  if (input.evidence.some((item) => item.status === 'conflicting' || item.freshness !== 'fresh')) {
    throw new Error('Conflicting, stale, or unknown evidence must be resolved before preparation.');
  }
  if (
    input.researchPlan.requests.some(
      (request) =>
        request.opportunityId === input.opportunity.id && request.priority === 'required',
    )
  ) {
    throw new Error('Required research must be completed before preparation.');
  }
}

function measurementPlan(input: {
  opportunity: RankedSeoOpportunity;
  evidence: readonly SeoOpportunityEvidence[];
  observedAt: string;
  notBeforeDays: number;
  expiresDays: number;
}): SeoImplementationPacket['measurementPlan'] {
  const signals = input.opportunity.signals;
  const values = {
    ...(signals.currentClicks !== undefined ? { clicks: signals.currentClicks } : {}),
    ...(signals.currentImpressions !== undefined
      ? { impressions: signals.currentImpressions }
      : {}),
    ...(signals.currentCtr !== undefined ? { ctr: signals.currentCtr } : {}),
    ...(signals.currentPosition !== undefined ? { averagePosition: signals.currentPosition } : {}),
  };
  const hasBaseline = Object.keys(values).length > 0;
  const evidenceIds = input.evidence.map((item) => item.evidenceId);
  return {
    baseline: hasBaseline
      ? {
          status: 'recorded',
          observedAt: input.observedAt,
          evidenceIds,
          values,
        }
      : {
          status: 'not-available',
          evidenceIds,
          reason:
            'No current page-level search metrics are recorded; the first post-publication window establishes the observed result.',
        },
    metrics: ['search-clicks', 'search-impressions', 'search-ctr', 'search-average-position'],
    comparisonMode: hasBaseline
      ? 'compare-to-recorded-baseline'
      : 'establish-first-observed-result',
    verificationWindow: {
      notBeforeDaysAfterPublication: input.notBeforeDays,
      expiresDaysAfterPublication: input.expiresDays,
    },
    publicationStatus: 'not-recorded',
    successRule: 'review-relative-change-with-limitations',
    limitations: [
      'Search performance varies by query, market, device, season, and provider aggregation.',
      'The packet sets no guaranteed ranking, traffic, conversion, or revenue outcome.',
      'The verification window starts only after a separate publication record exists.',
    ],
  };
}

export function prepareSeoImplementationPacket(input: {
  projectId: string;
  environmentId: string;
  preparedAt: string;
  opportunityReviewObservedAt: string;
  opportunitySource: string;
  opportunity: RankedSeoOpportunity;
  pageOpportunity: PageOpportunity;
  evidence: readonly SeoOpportunityEvidence[];
  researchPlan: SeoOpportunityResearchPlan;
  audience?: 'content-team' | 'coding-agent';
  notBeforeDaysAfterPublication?: number;
  expiresDaysAfterPublication?: number;
}): SeoImplementationPacket {
  const opportunity = rankedSeoOpportunitySchema.parse(input.opportunity);
  const pageOpportunity = pageOpportunitySchema.parse(input.pageOpportunity);
  const researchPlan = seoOpportunityResearchPlanSchema.parse(input.researchPlan);
  const evidence = selectedEvidence({ opportunity, evidence: input.evidence });
  validateSelection({
    opportunity,
    pageOpportunity,
    evidence,
    researchPlan,
    projectId: input.projectId,
  });
  const recommendedResearch = researchPlan.requests.filter(
    (request) => request.opportunityId === opportunity.id && request.priority === 'recommended',
  );

  return seoImplementationPacketSchema.parse({
    kind: 'unisane.growth.seo-implementation-packet',
    version: 1,
    packetId: stableId(`seo.packet.${opportunity.id}.${input.preparedAt}`),
    projectId: input.projectId,
    environmentId: input.environmentId,
    preparedAt: input.preparedAt,
    source: {
      opportunityFile: input.opportunitySource,
      opportunityReviewObservedAt: input.opportunityReviewObservedAt,
    },
    selection: {
      opportunityId: opportunity.id,
      opportunityStatus: 'approved',
      eligibility: 'approved-opportunity-record',
      implementationApproval: 'not-granted',
    },
    opportunity,
    pageSpecification: {
      routePath: pageOpportunity.routePath,
      title: pageOpportunity.title,
      h1: pageOpportunity.h1,
      metaDescription: pageOpportunity.metaDescription,
      primaryKeyword: pageOpportunity.primaryKeyword,
      supportingKeywords: pageOpportunity.supportingKeywords,
      sections: pageOpportunity.sections,
      internalLinks: pageOpportunity.internalLinks,
      cta: pageOpportunity.cta,
    },
    evidence,
    recommendedResearch,
    constraints: [
      'Use only the evidence and page specification recorded in this packet.',
      'Do not invent demand, ranking, traffic, conversion, revenue, or competitor-performance claims.',
      'Keep canonical outcomes separate from Analytics and provider-attributed conversions.',
      'Do not edit, publish, deploy, or mutate a provider without a separate authorized workflow.',
    ],
    acceptanceCriteria: [
      `The implementation serves the intended page at ${pageOpportunity.routePath}.`,
      `The page uses the approved title and H1 for ${pageOpportunity.primaryKeyword}.`,
      'Required sections, internal links, CTA, metadata, and indexability behavior match the packet.',
      'Content is readable, accessible, responsive, and free of unsupported claims.',
      'Repository-specific focused tests and checks pass before review.',
      'Publication and the verification window remain separate recorded steps.',
    ],
    measurementPlan: measurementPlan({
      opportunity,
      evidence,
      observedAt: input.opportunityReviewObservedAt,
      notBeforeDays: input.notBeforeDaysAfterPublication ?? 14,
      expiresDays: input.expiresDaysAfterPublication ?? 28,
    }),
    delivery: {
      level: 'prepare',
      audience: input.audience ?? 'coding-agent',
      effect: 'offline-artifact-only',
      prohibitedEffects: [
        'repository-edit',
        'cms-publication',
        'provider-mutation',
        'production-deployment',
      ],
    },
  });
}

export function renderSeoImplementationPacket(packet: SeoImplementationPacket): string {
  const value = seoImplementationPacketSchema.parse(packet);
  const lines = [
    `# ${value.opportunity.title}`,
    '',
    'Implementation packet — preparation only',
    '',
    `Route: \`${value.pageSpecification.routePath}\``,
    `Primary keyword: \`${value.pageSpecification.primaryKeyword}\``,
    `Confidence: ${value.opportunity.confidence}`,
    `Implementation approval: ${value.selection.implementationApproval}`,
    '',
    '## Why this opportunity',
    '',
    value.opportunity.rationale,
    '',
    '## Page specification',
    '',
    `- Title: ${value.pageSpecification.title}`,
    `- H1: ${value.pageSpecification.h1}`,
    `- Meta description: ${value.pageSpecification.metaDescription}`,
    `- CTA: ${value.pageSpecification.cta.label} → \`${value.pageSpecification.cta.target}\``,
    ...value.pageSpecification.sections.map(
      (section, index) =>
        `${index + 1}. ${section.heading} — ${section.purpose}${section.required ? ' (required)' : ''}`,
    ),
    '',
    '## Constraints',
    '',
    ...value.constraints.map((item) => `- ${item}`),
    '',
    '## Acceptance criteria',
    '',
    ...value.acceptanceCriteria.map((item) => `- ${item}`),
    '',
    '## Measurement',
    '',
    `Comparison: ${value.measurementPlan.comparisonMode}`,
    `Window: day ${value.measurementPlan.verificationWindow.notBeforeDaysAfterPublication} through day ${value.measurementPlan.verificationWindow.expiresDaysAfterPublication} after a separate publication record.`,
    ...value.measurementPlan.limitations.map((item) => `- ${item}`),
    '',
    'This packet does not authorize a repository edit, CMS publication, provider mutation, or production deployment.',
    '',
  ];
  return `${lines.join('\n')}\n`;
}
