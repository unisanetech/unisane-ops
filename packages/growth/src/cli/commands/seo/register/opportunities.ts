import type { Command } from 'commander';
import {
  seoOpportunitiesPlan,
  seoOpportunitiesStatus,
  type SeoOpportunityPlanCliOptions,
  type SeoOpportunityStatusCliOptions,
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
