import type { Command } from 'commander';
import { registerSeoAdsCommands } from './register/ads.js';
import { registerSeoBriefCommands } from './register/briefs.js';
import { registerSeoCompetitorCommands } from './register/competitors.js';
import { registerSeoInternalLinkCommands } from './register/internal-links.js';
import { registerSeoKeywordCommands } from './register/keywords.js';
import { registerSeoOpportunityCommands } from './register/opportunities.js';
import { registerSeoPerformanceCommands } from './register/performance.js';
import { registerSeoReportCommands } from './register/reports.js';
import { registerSeoTrendCommands } from './register/trends.js';
import { registerSeoSiteCommands } from './register/site.js';
import { registerSeoPageCommands } from './register/pages.js';

export function registerSeoCommands(program: Command): void {
  const seo = program.command('seo').description('SEO research and acquisition planning');

  registerSeoAdsCommands(seo);
  registerSeoSiteCommands(seo);
  registerSeoPageCommands(seo);
  registerSeoKeywordCommands(seo);
  registerSeoCompetitorCommands(seo);
  registerSeoOpportunityCommands(seo);
  registerSeoBriefCommands(seo);
  registerSeoInternalLinkCommands(seo);
  registerSeoPerformanceCommands(seo);
  registerSeoTrendCommands(seo);
  registerSeoReportCommands(seo);
}
