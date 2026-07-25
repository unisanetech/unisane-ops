import type { Command } from 'commander';
import { seoDoctor, type SeoDoctorCliOptions } from './index.js';
import { registerSeoAdsCommands } from './register/ads.js';
import { registerSeoBriefCommands } from './register/briefs.js';
import { registerSeoCompetitorCommands } from './register/competitors.js';
import { registerSeoInternalLinkCommands } from './register/internal-links.js';
import { registerSeoKeywordCommands } from './register/keywords.js';
import { registerSeoOpportunityCommands } from './register/opportunities.js';
import { registerSeoPerformanceCommands } from './register/performance.js';
import { registerSeoReportCommands } from './register/reports.js';
import { registerSeoTrendCommands } from './register/trends.js';
import { runSeoCommand } from './register/helpers.js';

export function registerSeoCommands(program: Command): void {
  const seo = program.command('seo').description('SEO research and acquisition planning');

  seo
    .command('doctor')
    .description('Show SEO provider setup, artifact freshness, and next workflow step')
    .option('--cwd <path>', 'Platform app directory')
    .option('--platform <id>', 'Platform id for research artifacts')
    .option('--max-artifact-age-hours <hours>', 'Freshness threshold for artifacts')
    .option('--json', 'Emit machine-readable JSON output')
    .action(async (options: SeoDoctorCliOptions) => {
      await runSeoCommand(options, seoDoctor);
    });

  registerSeoAdsCommands(seo);
  registerSeoKeywordCommands(seo);
  registerSeoCompetitorCommands(seo);
  registerSeoOpportunityCommands(seo);
  registerSeoBriefCommands(seo);
  registerSeoInternalLinkCommands(seo);
  registerSeoPerformanceCommands(seo);
  registerSeoTrendCommands(seo);
  registerSeoReportCommands(seo);
}
