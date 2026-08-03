import {
  opsWorkflowContextBriefSchema,
  opsWorkflowHandoffSchema,
  opsWorkflowResumeResultSchema,
} from '@unisane/ops-engine/workflows';
import type {
  OpsMcpAgentProfile,
  OpsMcpEvaluationCheck,
  OpsMcpEvaluationReport,
  OpsMcpEvaluationScenario,
  OpsMcpToolResponse,
} from './contracts.js';

function textContent(response: OpsMcpToolResponse): string {
  return (response.content ?? [])
    .filter(
      (item): item is { type: 'text'; text: string } =>
        item.type === 'text' && typeof item.text === 'string',
    )
    .map((item) => item.text)
    .join('\n');
}

function check(id: string, passed: boolean, detail: string): OpsMcpEvaluationCheck {
  return { id, passed, detail };
}

export function evaluateOpsMcpScenario(input: {
  profile: OpsMcpAgentProfile;
  scenario: OpsMcpEvaluationScenario;
  response: OpsMcpToolResponse;
}): OpsMcpEvaluationReport {
  const checks: OpsMcpEvaluationCheck[] = [];
  checks.push(
    check(
      'profile.tool-discovery',
      input.profile.capabilities.toolDiscovery,
      'The profile must support MCP tool discovery.',
    ),
    check(
      'profile.structured-content',
      input.profile.capabilities.structuredContent,
      'The profile must preserve structured MCP results.',
    ),
    check(
      'profile.handoff-resume',
      input.profile.capabilities.handoffResume,
      'The profile must return structured handoffs to the same tool.',
    ),
    check('response.success', input.response.isError !== true, 'The workflow call must succeed.'),
  );

  const structured = input.response.structuredContent;
  if (!structured || typeof structured !== 'object') {
    checks.push(check('response.structured', false, 'Structured content is missing.'));
    return {
      schemaVersion: 1,
      profileId: input.profile.id,
      profileEvidenceLevel: input.profile.evidenceLevel,
      scenarioId: input.scenario.id,
      passed: false,
      checks,
    };
  }

  const workflow = (structured as { workflow?: unknown }).workflow;
  const resume = (structured as { resume?: unknown }).resume;
  try {
    if (!workflow || typeof workflow !== 'object') throw new Error('Workflow is missing.');
    const contextBrief = opsWorkflowContextBriefSchema.parse(
      (workflow as { contextBrief?: unknown }).contextBrief,
    );
    const handoff = opsWorkflowHandoffSchema.parse((workflow as { handoff?: unknown }).handoff);
    const resumeResult = opsWorkflowResumeResultSchema.parse(resume);
    const evidenceIds = new Set(contextBrief.evidence.map((evidence) => evidence.evidenceId));
    const text = textContent(input.response);
    const normalizedText = text.toLowerCase();

    checks.push(
      check(
        'context.target',
        contextBrief.context.projectId === input.scenario.projectId &&
          contextBrief.context.environmentId === input.scenario.environmentId,
        'The context brief must identify the requested project and environment.',
      ),
      check(
        'context.actor',
        contextBrief.context.principal.kind === 'agent',
        'The context brief must retain the bound agent principal.',
      ),
      check(
        'context.bounds',
        contextBrief.evidence.length <= 20 && handoff.evidenceRevisions.length <= 20,
        'Context and handoff evidence must remain bounded.',
      ),
      check(
        'evidence.expected',
        input.scenario.expectedEvidenceIds.every((id) => evidenceIds.has(id)),
        'All scenario-required evidence references must be present.',
      ),
      check(
        'handoff.identity',
        handoff.runId === contextBrief.runId && handoff.contextBriefId === contextBrief.briefId,
        'The handoff must reference the returned run and context brief.',
      ),
      check(
        'handoff.resume-status',
        resumeResult.status === input.scenario.expectedResumeStatus,
        `Resume status must be ${input.scenario.expectedResumeStatus}.`,
      ),
      check(
        'guidance.deep-link',
        contextBrief.presentation.nextStep.deepLink === input.scenario.expectedDeepLink,
        'The safe next step must deep-link to the expected console destination.',
      ),
      check(
        'guidance.required-text',
        input.scenario.expectedText.every((fragment) =>
          normalizedText.includes(fragment.toLowerCase()),
        ),
        'The response must state the expected outcome and next step.',
      ),
      check(
        'guidance.forbidden-text',
        input.scenario.forbiddenText.every(
          (fragment) => !normalizedText.includes(fragment.toLowerCase()),
        ),
        'The response must avoid unsupported claims and internal workflow vocabulary.',
      ),
      check(
        'guidance.bounds',
        text.length <= (input.scenario.maximumTextCharacters ?? 1_200),
        'The plain-language response must remain within the scenario context budget.',
      ),
    );
  } catch (error) {
    checks.push(
      check(
        'response.contract',
        false,
        error instanceof Error ? error.message : 'The workflow response is invalid.',
      ),
    );
  }

  return {
    schemaVersion: 1,
    profileId: input.profile.id,
    profileEvidenceLevel: input.profile.evidenceLevel,
    scenarioId: input.scenario.id,
    passed: checks.every((item) => item.passed),
    checks,
  };
}

export function evaluateOpsMcpDenial(input: {
  profile: OpsMcpAgentProfile;
  scenarioId: string;
  response: OpsMcpToolResponse;
  expectedCode?: string;
}): OpsMcpEvaluationReport {
  const text = textContent(input.response);
  const checks = [
    check('denial.error', input.response.isError === true, 'The unsafe call must fail.'),
    check(
      'denial.no-structured-content',
      input.response.structuredContent === undefined,
      'Denied calls must not return workflow data.',
    ),
    check(
      'denial.code',
      !input.expectedCode || text.includes(input.expectedCode),
      input.expectedCode
        ? `The denial must expose safe code ${input.expectedCode}.`
        : 'Schema-level denial must return no workflow data.',
    ),
  ];
  return {
    schemaVersion: 1,
    profileId: input.profile.id,
    profileEvidenceLevel: input.profile.evidenceLevel,
    scenarioId: input.scenarioId,
    passed: checks.every((item) => item.passed),
    checks,
  };
}

export function assertOpsMcpEvaluationPassed(report: OpsMcpEvaluationReport): void {
  if (report.passed) return;
  const failures = report.checks
    .filter((item) => !item.passed)
    .map((item) => `${item.id}: ${item.detail}`)
    .join('; ');
  throw new Error(
    `[OPS_MCP_EVALUATION_FAILED] ${report.profileId}/${report.scenarioId}: ${failures}`,
  );
}
