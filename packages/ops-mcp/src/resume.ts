import {
  opsWorkflowRunSchema,
  resumeOpsWorkflowHandoff,
  type OpsWorkflowHandoff,
} from '@unisane/ops-engine/workflows';
import { OpsMcpSafeError } from './contracts.js';

export function attachWorkflowResume(
  output: Record<string, unknown>,
  handoff?: OpsWorkflowHandoff,
): Record<string, unknown> {
  if (!handoff) return output;
  const workflow = output.workflow;
  if (!workflow || typeof workflow !== 'object' || !('run' in workflow)) {
    throw new OpsMcpSafeError(
      'workflow_contract_invalid',
      'The refreshed workflow did not return resumable run state.',
    );
  }
  const run = opsWorkflowRunSchema.parse((workflow as { run: unknown }).run);
  return {
    ...output,
    resume: resumeOpsWorkflowHandoff({ handoff, run }),
  };
}
