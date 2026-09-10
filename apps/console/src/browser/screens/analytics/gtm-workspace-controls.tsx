import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import type { GtmWorkspaceReview } from '@unisane/growth/gtm';
export function GtmWorkspaceControls() {
  const [review, setReview] = useState<GtmWorkspaceReview>();
  const [message, setMessage] = useState('');
  const [runId, setRunId] = useState('');
  const [busy, setBusy] = useState(false);
  async function call(input: Record<string, unknown>) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/console/gtm/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as { result?: unknown; error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Workspace request failed.');
      if (input.operation === 'plan' || input.operation === 'review') {
        setReview(payload.result as GtmWorkspaceReview);
        setRunId('');
      } else if (input.operation === 'approve')
        setMessage('This exact workspace plan is approved. Apply uses the recorded approval.');
      else if (input.operation === 'apply') {
        const result = payload.result as { runId: string; disposition: string };
        setRunId(result.runId);
        setMessage(
          `Execution ${result.disposition}. Recover after the verification delay to inspect provider state.`,
        );
      } else {
        const result = payload.result as { status: string; message: string };
        setMessage(`${result.status}: ${result.message}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Workspace request failed.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-5 grid gap-4">
      <h3 className="font-semibold">Reviewed workspace changes</h3>
      <p>
        Use the canonical project manifest to prepare an exact plan. Workspace apply does not
        publish the container.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void call({
            operation: 'plan',
            connectionId: data.get('connectionId'),
            workspaceId: data.get('workspaceId'),
          });
        }}
      >
        <label>
          Google connection
          <input
            name="connectionId"
            required
            disabled={busy}
            className="block rounded border p-2"
          />
        </label>
        <label>
          Workspace ID
          <input
            name="workspaceId"
            pattern="[0-9]+"
            required
            disabled={busy}
            className="block rounded border p-2"
          />
        </label>
        <Button disabled={busy} type="submit">
          Prepare workspace plan
        </Button>
      </form>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void call({
            operation: 'review',
            planHash: new FormData(event.currentTarget).get('planHash'),
          });
        }}
      >
        <label className="min-w-0 flex-1">
          Existing plan hash
          <input
            name="planHash"
            required
            pattern="[a-f0-9]{64}"
            disabled={busy}
            className="block w-full rounded border p-2"
          />
        </label>
        <Button disabled={busy} type="submit">
          Load workspace plan
        </Button>
      </form>
      {review && (
        <div className="min-w-0 grid gap-3 rounded border p-3">
          <p className="break-all">
            {review.plan.projectId} / {review.plan.environment} · {review.plan.targetIdentity}
          </p>
          <p className="break-all">
            Plan: {review.plan.planHash} · Expires {review.plan.expiresAt}
          </p>
          {review.changes.operations.map((operation, index) => (
            <details key={index}>
              <summary>
                {operation.type} · {operation.kind}: {operation.slug}
              </summary>
              <pre className="overflow-auto whitespace-pre-wrap break-all">
                {JSON.stringify({ before: operation.before, after: operation.after }, null, 2)}
              </pre>
            </details>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={busy}
              onClick={() =>
                void call({
                  operation: 'approve',
                  planHash: review.plan.planHash,
                  confirmPlanHash: review.plan.planHash,
                })
              }
            >
              Approve this exact plan
            </Button>
            <Button
              disabled={busy}
              onClick={() => void call({ operation: 'apply', planHash: review.plan.planHash })}
            >
              Apply approved workspace plan
            </Button>
          </div>
        </div>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void call({ operation: 'recover', runId });
        }}
      >
        <label className="min-w-0 flex-1">
          Workspace run ID
          <input
            value={runId}
            onChange={(event) => setRunId(event.target.value)}
            pattern="gtm\.[a-f0-9]{64}"
            required
            disabled={busy}
            className="block w-full rounded border p-2"
          />
        </label>
        <Button disabled={busy} type="submit">
          Recover workspace outcome
        </Button>
      </form>
      {message && (
        <p role="status" className="break-words">
          {message}
        </p>
      )}
    </div>
  );
}
