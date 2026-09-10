import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import type { GtmReleaseCommand, GtmReleaseReview } from '@unisane/growth/gtm';
export function GtmReleaseControls() {
  const [review, setReview] = useState<GtmReleaseReview>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [runId, setRunId] = useState('');
  async function call(input: GtmReleaseCommand) {
    setBusy(true);
    setMessage('');
    if (input.operation.startsWith('plan-') || input.operation === 'review') setReview(undefined);
    try {
      const response = await fetch('/api/console/gtm/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = (await response.json()) as { result?: unknown; error?: string };
      if (!response.ok) throw new Error(body.error ?? 'Release operation failed.');
      if (input.operation.startsWith('plan-') || input.operation === 'review') {
        setReview(body.result as GtmReleaseReview);
        setRunId('');
      } else if (input.operation === 'approve') setMessage('This exact release plan is approved.');
      else if (input.operation === 'apply') {
        const result = body.result as {
          runId: string;
          disposition: string;
          versionId: string | null;
        };
        setRunId(result.runId);
        setMessage(
          `Execution ${result.disposition}. Version: ${result.versionId ?? 'unknown; recover before retrying'}. Recover after settlement to verify state.`,
        );
      } else if (input.operation === 'preview') {
        const result = body.result as { evidence: { contentDigest: string } };
        setMessage(
          `Compiler preview succeeded. Content revision: ${result.evidence.contentDigest}. Event delivery remains unverified.`,
        );
      } else {
        const result = body.result as { status: string; message: string; versionId: string | null };
        setMessage(
          `${result.status}: ${result.message} Version: ${result.versionId ?? 'unknown'}.`,
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Release operation failed.');
    } finally {
      setBusy(false);
    }
  }
  const field = 'block w-full rounded border p-2';
  return (
    <div className="mt-6 grid min-w-0 gap-4">
      <h3 className="font-semibold">Preview, version and publish</h3>
      <p>
        Creating a version removes its source workspace. Publishing changes the live container.
        Review each exact plan separately; compiler success does not prove tracking delivery.
      </p>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void call({
            operation: 'plan-version',
            connectionId: String(data.get('connectionId')),
            workspaceId: String(data.get('workspaceId')),
            name: String(data.get('name')),
          });
        }}
      >
        <label>
          Google connection
          <input className={field} name="connectionId" required disabled={busy} />
        </label>
        <label>
          Workspace ID
          <input className={field} name="workspaceId" pattern="[0-9]+" required disabled={busy} />
        </label>
        <label>
          Version name
          <input className={field} name="name" maxLength={120} required disabled={busy} />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            disabled={busy}
            type="button"
            onClick={(event) => {
              const form = event.currentTarget.closest('form');
              if (!form) return;
              const data = new FormData(form);
              void call({
                operation: 'preview',
                connectionId: String(data.get('connectionId')),
                workspaceId: String(data.get('workspaceId')),
              });
            }}
          >
            Compile preview
          </Button>
          <Button disabled={busy} type="submit">
            Plan version creation
          </Button>
        </div>
      </form>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          void call({
            operation: 'plan-publish',
            connectionId: String(data.get('connectionId')),
            versionId: String(data.get('versionId')),
          });
        }}
      >
        <label>
          Publish connection
          <input className={field} name="connectionId" required disabled={busy} />
        </label>
        <label>
          Version to publish
          <input className={field} name="versionId" pattern="[0-9]+" required disabled={busy} />
        </label>
        <Button disabled={busy} type="submit">
          Plan publication
        </Button>
      </form>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void call({
            operation: 'review',
            planHash: String(new FormData(event.currentTarget).get('planHash')),
          });
        }}
      >
        <label className="min-w-0 flex-1">
          Release plan hash
          <input
            className={field}
            name="planHash"
            pattern="[a-f0-9]{64}"
            required
            disabled={busy}
          />
        </label>
        <Button disabled={busy} type="submit">
          Load release plan
        </Button>
      </form>
      {review && (
        <div className="grid min-w-0 gap-3 rounded border p-3">
          <p className="break-all">
            {review.plan.projectId} / {review.plan.environment} · {review.plan.targetIdentity}
          </p>
          <p className="break-all">
            Plan: {review.plan.planHash} · Expires {review.plan.expiresAt}
          </p>
          <ul className="list-disc pl-5">
            {review.effects.map((effect) => (
              <li className="break-words" key={effect}>
                {effect}
              </li>
            ))}
          </ul>
          <details>
            <summary>Reviewed content and live revision</summary>
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(review.evidence, null, 2)}
            </pre>
          </details>
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
              Approve exact release plan
            </Button>
            <Button
              disabled={busy}
              onClick={() => void call({ operation: 'apply', planHash: review.plan.planHash })}
            >
              Apply approved release
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
          Release run ID
          <input
            className={field}
            value={runId}
            onChange={(event) => setRunId(event.target.value)}
            pattern="gtmrelease\.[a-f0-9]{64}"
            required
            disabled={busy}
          />
        </label>
        <Button disabled={busy} type="submit">
          Recover release outcome
        </Button>
      </form>
      {message && (
        <p role="status" className="break-all">
          {message}
        </p>
      )}
    </div>
  );
}
