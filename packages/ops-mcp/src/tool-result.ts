import { OpsMcpSafeError } from './contracts.js';
import { OpsActionExecutionError } from '@unisane/ops-engine/actions';

const SECRET_PATTERN =
  /(?:-----BEGIN [A-Z ]*PRIVATE KEY-----|\bBearer\s+[A-Za-z0-9._~+/-]+=*|\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{16,})/i;

type Presentation = {
  headline?: unknown;
  whyItMatters?: unknown;
  nextStep?: { label?: unknown; reason?: unknown };
};

type ResumeView = { status?: unknown };

function presentation(output: Record<string, unknown>): Presentation {
  if (output.presentation && typeof output.presentation === 'object')
    return output.presentation as Presentation;
  const workflow = output.workflow;
  if (workflow && typeof workflow === 'object') {
    const value = (workflow as { presentation?: unknown }).presentation;
    if (value && typeof value === 'object') return value as Presentation;
  }
  const review = output.review;
  if (!review || typeof review !== 'object') return {};
  const value = review as {
    headline?: unknown;
    explanation?: unknown;
    nextStep?: Presentation['nextStep'];
  };
  return {
    headline: value.headline,
    whyItMatters: value.explanation,
    nextStep: value.nextStep,
  };
}

export function createOpsMcpToolResult(
  output: Record<string, unknown>,
  maximumResultBytes: number,
) {
  const serialized = JSON.stringify(output);
  if (Buffer.byteLength(serialized, 'utf8') > maximumResultBytes) {
    throw new OpsMcpSafeError(
      'result_too_large',
      'The workflow result exceeds this server’s safe response limit. Request fewer results.',
    );
  }
  if (SECRET_PATTERN.test(serialized)) {
    throw new OpsMcpSafeError(
      'sensitive_result_blocked',
      'The workflow result was blocked because it appears to contain sensitive material.',
    );
  }
  const view = presentation(output);
  const resume = output.resume as ResumeView | undefined;
  const resumeMessage =
    resume?.status === 'resumable'
      ? 'The earlier handoff is still current and can continue.'
      : resume?.status === 'evidence-changed'
        ? 'Supporting evidence changed. Review the refreshed result before continuing.'
        : resume?.status === 'run-changed'
          ? 'The workflow changed. Review the refreshed next step before continuing.'
          : undefined;
  const lines = [
    view.headline,
    view.whyItMatters,
    view.nextStep?.label,
    view.nextStep?.reason,
    resumeMessage,
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return {
    content: [
      {
        type: 'text' as const,
        text: lines.length ? lines.join('\n\n') : 'The Growth workflow completed successfully.',
      },
    ],
    structuredContent: output,
  };
}

export function createOpsMcpErrorResult(error: unknown) {
  const safe =
    error instanceof OpsMcpSafeError
      ? error
      : error instanceof OpsActionExecutionError
        ? new OpsMcpSafeError(error.code, error.safeMessage)
        : new OpsMcpSafeError(
            'workflow_failed',
            'The Growth workflow could not complete. Review the project evidence and try again.',
          );
  return {
    content: [{ type: 'text' as const, text: `${safe.code}: ${safe.safeMessage}` }],
    isError: true as const,
  };
}
