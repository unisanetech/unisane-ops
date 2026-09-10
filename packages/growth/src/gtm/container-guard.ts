import { z } from 'zod';
import {
  hashOpsValue,
  type OpsExecutionState,
  type OpsMutationRunStore,
} from '@unisane/ops-engine';
export function gtmContainerLock(manifest: { accountId: string; containerId: string }) {
  return `google-gtm:accounts/${manifest.accountId}/containers/${manifest.containerId}`;
}
function pointerId(manifest: { accountId: string; containerId: string }) {
  return `gtm.container.${hashOpsValue(gtmContainerLock(manifest))}`;
}
export async function assertGtmContainerReconciled(
  state: OpsExecutionState,
  runs: OpsMutationRunStore,
  manifest: { accountId: string; containerId: string },
) {
  const pointer = await state.artifacts.get(pointerId(manifest));
  if (!pointer) return;
  const { runId } = z.object({ runId: z.string() }).strict().parse(pointer.value);
  const run = await runs.get(runId);
  const attempt =
    run &&
    z
      .object({
        review: z.object({
          parameters: z.object({
            manifest: z.object({ accountId: z.string(), containerId: z.string() }),
          }),
        }),
        verification: z
          .object({ status: z.enum(['verified', 'not-matched', 'unavailable']) })
          .optional(),
      })
      .parse(run.actionState);
  if (
    !attempt ||
    gtmContainerLock(attempt.review.parameters.manifest) !== gtmContainerLock(manifest) ||
    !attempt.verification ||
    attempt.verification.status === 'unavailable'
  )
    throw new Error(
      '[GTM_WORKSPACE_UNRECONCILED] Recover the previous container operation before any workspace or release write.',
    );
}
export async function recordGtmContainerAttempt(
  state: OpsExecutionState,
  manifest: { accountId: string; containerId: string },
  runId: string,
  createdAt: string,
) {
  await state.artifacts.put({
    id: pointerId(manifest),
    kind: 'state',
    value: { runId },
    createdAt,
    expiresAt: null,
  });
}
