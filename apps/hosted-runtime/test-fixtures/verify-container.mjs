const tokenResponse = await fetch('http://oidc:8090/token');
if (!tokenResponse.ok) throw new Error('OIDC integration token was not available.');
const { token } = await tokenResponse.json();
const authorization = `Bearer ${token}`;
const admission = await fetch('http://gateway:8080/internal/v1/read-actions', {
  method: 'POST',
  headers: { authorization, 'content-type': 'application/json' },
  body: JSON.stringify({
    schemaVersion: 1,
    audience: 'unisane.ops',
    evidenceRevision: 'evidence.container',
    action: {
      schemaVersion: 1,
      actionId: 'growth.health.review',
      actionSchemaVersion: 1,
      idempotencyKey: 'request.container',
      context: {
        requestId: 'request.container',
        scopeId: 'workspace.integration',
        projectId: 'project.integration',
        environmentId: 'production',
        principal: { kind: 'service', id: 'service.integration' },
        requestedAt: new Date().toISOString(),
      },
      input: { project: 'integration' },
    },
  }),
});
if (admission.status !== 202) throw new Error('Container admission was not accepted.');
const { job } = await admission.json();
const otherTokenResponse = await fetch('http://oidc:8090/token-other-project');
if (!otherTokenResponse.ok) throw new Error('Cross-project identity was not available.');
const { token: otherToken } = await otherTokenResponse.json();
const crossProjectRead = await fetch(`http://gateway:8080/internal/v1/read-actions/${job.jobId}`, {
  headers: { authorization: `Bearer ${otherToken}` },
});
if (crossProjectRead.status !== 404) {
  throw new Error('Cross-project job existence was disclosed.');
}
for (let attempt = 0; attempt < 100; attempt += 1) {
  await new Promise((resolve) => setTimeout(resolve, 50));
  const response = await fetch(`http://gateway:8080/internal/v1/read-actions/${job.jobId}`, {
    headers: { authorization },
  });
  if (!response.ok) throw new Error('Container job could not be read.');
  const state = await response.json();
  if (state.job.phase === 'succeeded') process.exit(0);
  if (state.job.phase === 'failed') throw new Error('Container job failed.');
}
throw new Error('Container job did not reach a terminal state.');
