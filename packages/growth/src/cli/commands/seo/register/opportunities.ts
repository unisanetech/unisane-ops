import type { Command } from 'commander';
import {
  seoOpportunitiesPlan,
  seoOpportunitiesStatus,
  type SeoOpportunityPlanCliOptions,
  type SeoOpportunityStatusCliOptions,
} from '../index.js';
import { addSharedSeoOptions, runSeoCommand } from './helpers.js';

export function registerSeoOpportunityCommands(seo: Command): void {
  const opportunities = seo
    .command('opportunities')
    .description('SEO page opportunity planning commands');

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
