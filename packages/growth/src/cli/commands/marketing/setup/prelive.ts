import { log } from '../../../log.js';
import type { MarketingSetupLifecycleReportWithControlPlane } from './status.js';
import { buildMarketingSetupStatusReport } from './status.js';
import type { MarketingCliOptions } from '../options.js';

type MarketingPreliveSectionStatus = 'pass' | 'warn' | 'fail' | 'blocked' | 'pending';

type MarketingPreliveCheck = {
  id: string;
  status: MarketingPreliveSectionStatus;
  message: string;
};

type MarketingPreliveSection = {
  id: string;
  title: string;
  status: MarketingPreliveSectionStatus;
  message: string;
  checks: MarketingPreliveCheck[];
};

type MarketingPreliveReport = {
  kind: 'unisane.marketing.prelive-readiness';
  version: 1;
  nonMutating: true;
  generatedAt: string;
  ok: boolean;
  readyForLiveAccountUse: boolean;
  cwd: string;
  configPath?: string;
  appId: string;
  platformId: string;
  currentStage: string;
  summary: {
    totalSections: number;
    passedSections: number;
    warningCount: number;
    blockerCount: number;
  };
  sections: MarketingPreliveSection[];
  nextActions: MarketingSetupLifecycleReportWithControlPlane['nextActions'];
};

function printJson(value: unknown): void {
  console.log(JSON.stringify(value, null, 2));
}

function lifecycleStatusToPrelive(
  status: MarketingSetupLifecycleReportWithControlPlane['stages'][number]['status'],
): MarketingPreliveSectionStatus {
  if (status === 'pass') return 'pass';
  if (status === 'current') return 'fail';
  return status;
}

function lifecycleCheckStatusToPrelive(
  status: 'pass' | 'warn' | 'error',
): MarketingPreliveSectionStatus {
  if (status === 'error') return 'fail';
  return status;
}

function providerSetupCheckStatusToPrelive(status: string): MarketingPreliveSectionStatus {
  if (status === 'pass') return 'pass';
  return 'warn';
}

function isBlocking(status: MarketingPreliveSectionStatus): boolean {
  return status === 'fail' || status === 'blocked';
}

function buildPreliveReport(
  setup: MarketingSetupLifecycleReportWithControlPlane,
): MarketingPreliveReport {
  const lifecycleSections: MarketingPreliveSection[] = setup.stages.map((stage) => ({
    id: stage.id,
    title: stage.title,
    status: lifecycleStatusToPrelive(stage.status),
    message: stage.message,
    checks: stage.checks.map((check) => ({
      id: check.id,
      status: lifecycleCheckStatusToPrelive(check.status),
      message: check.message,
    })),
  }));
  const providerSections: MarketingPreliveSection[] = setup.controlPlane.providerSetupStatuses.map(
    (provider) => ({
      id: `provider.${provider.provider}`,
      title: `${provider.provider} provider setup`,
      status: provider.ready ? 'pass' : 'warn',
      message: provider.ready
        ? `${provider.provider} setup is ready.`
        : `${provider.provider} setup still has provider-side or optional setup actions.`,
      checks: provider.checks.map((check) => ({
        id: check.id,
        status: providerSetupCheckStatusToPrelive(check.status),
        message: check.message,
      })),
    }),
  );
  const sections = [...lifecycleSections, ...providerSections];
  const warningCount = sections.reduce(
    (count, section) =>
      count +
      (section.status === 'warn' ? 1 : 0) +
      section.checks.filter((check) => check.status === 'warn').length,
    0,
  );
  const blockerCount = sections.reduce(
    (count, section) =>
      count +
      (isBlocking(section.status) ? 1 : 0) +
      section.checks.filter((check) => isBlocking(check.status)).length,
    0,
  );
  const passedSections = sections.filter((section) => section.status === 'pass').length;
  return {
    kind: 'unisane.marketing.prelive-readiness',
    version: 1,
    nonMutating: true,
    generatedAt: setup.generatedAt,
    ok: setup.ok && blockerCount === 0,
    readyForLiveAccountUse: setup.ok && blockerCount === 0,
    cwd: setup.cwd,
    configPath: setup.configPath,
    appId: setup.appId,
    platformId: setup.platformId,
    currentStage: setup.currentStage,
    summary: {
      totalSections: sections.length,
      passedSections,
      warningCount,
      blockerCount,
    },
    sections,
    nextActions: setup.nextActions,
  };
}

function printPreliveReport(report: MarketingPreliveReport): void {
  log.section('Marketing Pre-Live Readiness');
  log.info(`App: ${report.appId}`);
  log.info(`Platform: ${report.platformId}`);
  log.info(`Status: ${report.readyForLiveAccountUse ? 'ready' : 'needs action'}`);
  log.info(`Current stage: ${report.currentStage}`);
  log.info(
    `Sections: ${report.summary.passedSections}/${report.summary.totalSections} passed, ${report.summary.blockerCount} blockers, ${report.summary.warningCount} warnings`,
  );
  for (const section of report.sections) {
    log.info(`${section.status}: ${section.title}`);
    log.dim(`  ${section.message}`);
  }
  for (const action of report.nextActions.slice(0, 3)) {
    log.info(`Next: ${action.message}`);
    if (action.command) log.dim(`  ${action.command}`);
  }
}

export async function marketingSetupPrelive(options: MarketingCliOptions): Promise<number> {
  try {
    const setup = await buildMarketingSetupStatusReport(options);
    const report = buildPreliveReport(setup);
    if (options.json) printJson(report);
    else printPreliveReport(report);
    return report.readyForLiveAccountUse ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown marketing pre-live error';
    if (options.json) printJson({ ok: false, error: message });
    else console.error(message);
    return 1;
  }
}
