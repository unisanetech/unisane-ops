import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { MarketingExecutionContext } from '../schema/execution-context.js';
import {
  marketingResearchMemoryFileSchema,
  type MarketingResearchAction,
  type MarketingResearchDecision,
  type MarketingResearchMemoryFile,
  type MarketingResearchOpportunity,
  type MarketingResearchPriority,
  type MarketingResearchRecord,
} from '../schema/research-memory.js';

export type MarketingResearchStatusSummary = {
  ok: boolean;
  root: string;
  fileCount: number;
  recordCount: number;
  activeCount: number;
  decisionCount: number;
  opportunityCount: number;
  rejectedIdeaCount: number;
  nextActionCount: number;
  records: MarketingResearchRecord[];
  topPriorities: MarketingResearchRecord[];
  decisions: MarketingResearchDecision[];
  opportunities: MarketingResearchOpportunity[];
  rejectedIdeas: MarketingResearchDecision[];
  nextActions: MarketingResearchAction[];
  files: Array<{
    path: string;
    title: string;
    source: string;
    capturedAt: string;
    recordCount: number;
    updatedAt: string;
  }>;
  errors: Array<{
    path: string;
    message: string;
  }>;
  nextWorkflowStep: string;
};

export type MarketingResearchStatusOptions = {
  cwd?: string;
  researchRoot?: string;
};

export function marketingResearchRoot(config: MarketingExecutionContext, cwd: string): string {
  return path.resolve(cwd, config.paths.marketingRoot, 'research');
}

export function readMarketingResearchMemoryFiles(
  config: MarketingExecutionContext,
  options: MarketingResearchStatusOptions = {},
): Array<{ path: string; file: MarketingResearchMemoryFile; updatedAt: string }> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const root = options.researchRoot
    ? path.resolve(cwd, options.researchRoot)
    : marketingResearchRoot(config, cwd);
  if (!existsSync(root)) return [];

  return listJsonFiles(root).flatMap((filePath) => {
    const parsed = marketingResearchMemoryFileSchema.parse(
      JSON.parse(readFileSync(filePath, 'utf8')),
    );
    return [
      {
        path: filePath,
        file: parsed,
        updatedAt: statSync(filePath).mtime.toISOString(),
      },
    ];
  });
}

export function readMarketingResearchStatus(
  config: MarketingExecutionContext,
  options: MarketingResearchStatusOptions = {},
): MarketingResearchStatusSummary {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const root = options.researchRoot
    ? path.resolve(cwd, options.researchRoot)
    : marketingResearchRoot(config, cwd);
  const errors: MarketingResearchStatusSummary['errors'] = [];
  const files: Array<{ path: string; file: MarketingResearchMemoryFile; updatedAt: string }> = [];

  if (existsSync(root)) {
    for (const filePath of listJsonFiles(root)) {
      try {
        const parsed = marketingResearchMemoryFileSchema.parse(
          JSON.parse(readFileSync(filePath, 'utf8')),
        );
        files.push({
          path: filePath,
          file: parsed,
          updatedAt: statSync(filePath).mtime.toISOString(),
        });
      } catch (error) {
        errors.push({
          path: filePath,
          message: error instanceof Error ? error.message : 'Unknown research file parse error',
        });
      }
    }
  }

  const records = files.flatMap((entry) => entry.file.records);
  const decisions = records.flatMap((record) => record.decisions);
  const opportunities = records.flatMap((record) => record.opportunities);
  const rejectedIdeas = records.flatMap((record) => record.rejectedIdeas);
  const nextActions = records.flatMap((record) => record.nextActions);
  const activeRecords = records.filter((record) => record.status !== 'archived');
  const topPriorities = [...activeRecords].sort(prioritySort).slice(0, 8);

  return {
    ok: errors.length === 0 && records.length > 0,
    root,
    fileCount: files.length,
    recordCount: records.length,
    activeCount: activeRecords.length,
    decisionCount: decisions.length,
    opportunityCount: opportunities.length,
    rejectedIdeaCount: rejectedIdeas.length,
    nextActionCount: nextActions.filter((action) => action.status !== 'done').length,
    records: [...activeRecords].sort(prioritySort),
    topPriorities,
    decisions,
    opportunities: [...opportunities].sort(prioritySort),
    rejectedIdeas,
    nextActions: [...nextActions].filter((action) => action.status !== 'done').sort(prioritySort),
    files: files.map((entry) => ({
      path: entry.path,
      title: entry.file.title,
      source: entry.file.source.label,
      capturedAt: entry.file.source.capturedAt,
      recordCount: entry.file.records.length,
      updatedAt: entry.updatedAt,
    })),
    errors,
    nextWorkflowStep: nextWorkflowStep(records.length, errors.length, nextActions.length),
  };
}

function listJsonFiles(root: string): string[] {
  const entries = readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const filePath = path.join(root, entry.name);
    if (entry.isDirectory()) return listJsonFiles(filePath);
    return entry.isFile() && entry.name.endsWith('.json') ? [filePath] : [];
  });
}

function priorityValue(priority: MarketingResearchPriority): number {
  return { p0: 0, p1: 1, p2: 2, later: 3 }[priority];
}

function prioritySort(
  left: { priority: MarketingResearchPriority; title?: string; id: string },
  right: { priority: MarketingResearchPriority; title?: string; id: string },
): number {
  return (
    priorityValue(left.priority) - priorityValue(right.priority) ||
    (left.title ?? left.id).localeCompare(right.title ?? right.id)
  );
}

function nextWorkflowStep(recordCount: number, errorCount: number, actionCount: number): string {
  if (errorCount > 0) {
    return 'Fix invalid research memory files before using the dashboard for planning decisions.';
  }
  if (recordCount === 0) {
    return 'Add a structured research memory record before planning SEO pages or landing pages.';
  }
  if (actionCount > 0) {
    return 'Review open research actions and promote accepted page plans into the SEO opportunity workflow.';
  }
  return 'Research memory is available; use decisions and opportunities to choose the next build.';
}
