import type { Command } from 'commander';
import {
  seoOpportunitiesPlan,
  seoOpportunitiesPrepare,
  seoOpportunitiesStatus,
  seoOpportunityRecordPublication,
  seoOpportunityVerifyPublication,
  type SeoOpportunityPlanCliOptions,
  type SeoOpportunityPrepareCliOptions,
  type SeoOpportunityStatusCliOptions,
  type SeoPublicationRecordCliOptions,
  type SeoPublicationVerifyCliOptions,
} from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';
import {
  seoOpportunitiesReview,
  type SeoOpportunityReviewCliOptions,
} from '../opportunities/review.js';

export function registerSeoOpportunityCommands(seo: Command): void {
  const opportunities = seo
    .command('opportunities')
    .description('SEO page opportunity planning commands');

  opportunities
    .command('review')
    .description('Rank recorded SEO opportunities and preserve evidence limitations')
    .option('--cwd <path>', 'Platform app directory')
    .option('--environment <id>', 'Growth environment')
    .option('--market <market>', 'Exact recorded country and language market')
    .option('--limit <count>', 'Maximum ranked opportunities to return', '10')
    .option('--max-age-days <days>', 'Freshness threshold for recorded research', '30')
    .option('--json', 'Emit the canonical machine-readable workflow result')
    .action(async (options: SeoOpportunityReviewCliOptions) => {
      process.exitCode = await seoOpportunitiesReview(options);
    });

  addSharedSeoOptions(
    opportunities
      .command('prepare')
      .description('Prepare an approved SEO opportunity for human or coding-agent review'),
  )
    .requiredOption('--opportunities <path>', 'Approved page opportunity JSON file')
    .requiredOption('--id <id>', 'Exact approved opportunity id')
    .requiredOption('--out-dir <path>', 'Directory for JSON and Markdown packets')
    .option('--environment <id>', 'Growth environment')
    .option('--market <market>', 'Exact recorded country and language market')
    .option('--max-age-days <days>', 'Freshness threshold for recorded research', '30')
    .option(
      '--audience <audience>',
      'Packet audience: content-team or coding-agent',
      'coding-agent',
    )
    .option('--not-before-days <days>', 'Earliest post-publication verification day', '14')
    .option('--expires-days <days>', 'Latest post-publication verification day', '28')
    .option('--dry-run', 'Preview the packet and paths without writing files')
    .action(async (options: SeoOpportunityPrepareCliOptions) => {
      await runSeoCommand(options, seoOpportunitiesPrepare);
    });

  addSharedSeoOptions(
    opportunities
      .command('record-publication')
      .description('Record an externally published approved SEO implementation'),
  )
    .requiredOption('--packet <path>', 'Implementation packet JSON file')
    .requiredOption('--published-url <url>', 'Exact externally published URL')
    .requiredOption('--published-at <timestamp>', 'ISO publication timestamp')
    .requiredOption('--recorded-by <identity>', 'Human reviewer identity')
    .requiredOption('--out <path>', 'Publication record JSON path')
    .option('--environment <id>', 'Growth environment')
    .option('--confirm-reviewed', 'Confirm a human reviewed the external publication')
    .option('--dry-run', 'Preview the publication record without writing')
    .action(async (options: SeoPublicationRecordCliOptions) => {
      await runSeoCommand(options, seoOpportunityRecordPublication);
    });

  addSharedSeoOptions(
    opportunities
      .command('verify-publication')
      .description('Measure an externally published SEO opportunity in its declared window'),
  )
    .requiredOption('--publication <path>', 'Publication record JSON file')
    .requiredOption('--out <path>', 'Verification result JSON path')
    .option('--environment <id>', 'Growth environment')
    .option('--max-age-days <days>', 'Freshness threshold for current evidence', '30')
    .option('--dry-run', 'Preview verification without writing')
    .action(async (options: SeoPublicationVerifyCliOptions) => {
      await runSeoCommand(options, seoOpportunityVerifyPublication);
    });

  addSharedSeoOptions(
    opportunities.command('plan').description('Plan SEO pages from keyword clusters'),
  )
    .requiredOption('--clusters <path>', 'Keyword cluster JSON file')
    .requiredOption('--out <path>', 'Page opportunity output path')
    .option('--base-path <path>', 'Public route base path for generated opportunities')
    .option('--cta-label <text>', 'Default CTA label for planned pages')
    .option('--cta-target <path>', 'Default CTA target for planned pages')
    .option('--dry-run', 'Preview page opportunities without writing')
    .action(async (options: SeoOpportunityPlanCliOptions) => {
      await runSeoCommand(options, seoOpportunitiesPlan);
    });

  addSharedSeoOptions(
    opportunities.command('status').description('Set an SEO page opportunity status'),
  )
    .requiredOption('--opportunities <path>', 'Page opportunity JSON file')
    .requiredOption('--out <path>', 'Updated page opportunity output path')
    .requiredOption('--status <status>', 'New status: candidate, approved, rejected, or built')
    .option('--id <id>', 'Opportunity id to update')
    .option('--slug <slug>', 'Opportunity slug to update')
    .option('--route-path <path>', 'Opportunity route path to update')
    .option('--dry-run', 'Preview status update without writing')
    .action(async (options: SeoOpportunityStatusCliOptions) => {
      await runSeoCommand(options, seoOpportunitiesStatus);
    });
}
