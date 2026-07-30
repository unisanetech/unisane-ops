import {
  readMarketingResearchStatus,
  type MarketingResearchStatusSummary,
} from '@unisane/growth/marketing';
import { loadMarketingExecutionContext } from '../../../project-context.js';
import type { MarketingCliOptions } from '../options.js';

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function printStatus(status: MarketingResearchStatusSummary): void {
  console.log('# Marketing Research Memory');
  console.log('');
  console.log(`Root: ${status.root}`);
  console.log(`Files: ${status.fileCount}`);
  console.log(`Records: ${status.recordCount}`);
  console.log(`Decisions: ${status.decisionCount}`);
  console.log(`Opportunities: ${status.opportunityCount}`);
  console.log(`Open actions: ${status.nextActionCount}`);
  if (status.errors.length > 0) {
    console.log('');
    console.log('## Errors');
    for (const error of status.errors) {
      console.log(`- ${error.path}: ${error.message}`);
    }
  }
  if (status.topPriorities.length > 0) {
    console.log('');
    console.log('## Top Records');
    for (const record of status.topPriorities) {
      console.log(`- ${record.priority} · ${record.title}: ${record.summary}`);
    }
  }
  console.log('');
  console.log('## Next');
  console.log(status.nextWorkflowStep);
  console.log('');
}

export async function marketingResearchStatus(options: MarketingCliOptions): Promise<number> {
  try {
    const loaded = await loadMarketingExecutionContext();
    const status = readMarketingResearchStatus(loaded.config, {
      cwd: options.cwd,
      researchRoot: options.researchRoot,
    });
    if (options.json) printJson(status);
    else printStatus(status);
    return status.errors.length > 0 ? 1 : 0;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown marketing research status error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
