import path from 'node:path';
import { publicControlPlaneEnvEntry, type ControlPlaneSetupStatus } from '@unisane/ops-engine';
import {
  getGoogleAuthStatus,
  googleAuthEnvEntries,
  googleAuthStatusToControlPlaneProfile,
} from '../../auth.js';
import { resolveGoogleProjectId, resolveGoogleRequiredApis } from '../shared/project.js';
import { googleAuthRuntimeFromOptions } from '../shared/runtime.js';
import {
  GOOGLE_CONTROL_PLANE_SCOPE,
  type GoogleProviderCliOptions,
  type GoogleProviderSetupStatusReport,
} from '../shared/types.js';

function authNamespaceFlag(options: GoogleProviderCliOptions): string {
  return options.authNamespace ? ` --auth-namespace ${options.authNamespace}` : '';
}

export async function buildGoogleSetupStatus(
  options: GoogleProviderCliOptions,
  deps?: { env?: Record<string, string | undefined> },
): Promise<GoogleProviderSetupStatusReport> {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const environment = options.env ?? 'dev';
  const projectId = resolveGoogleProjectId({ project: options.project, env: deps?.env });
  const desiredApis = resolveGoogleRequiredApis(options.api);
  const runtime = googleAuthRuntimeFromOptions(options);
  const status = await getGoogleAuthStatus({ profile: options.profile, runtime });
  const authProfile = googleAuthStatusToControlPlaneProfile({
    provider: 'google',
    status,
    requiredScopes: [GOOGLE_CONTROL_PLANE_SCOPE],
  });
  const envEntries = [
    publicControlPlaneEnvEntry({
      name: 'GOOGLE_CLOUD_PROJECT',
      kind: 'provider-resource-ref',
      required: true,
      secret: false,
      value: projectId ?? undefined,
      description: 'Google Cloud project id used by provider setup and API enablement.',
      example: '<google-cloud-project-id>',
    }),
    ...googleAuthEnvEntries({ runtime, env: deps?.env }),
  ];
  const checks: ControlPlaneSetupStatus['checks'] = [
    {
      id: 'google.project',
      status: projectId ? 'pass' : 'fail',
      title: 'Google project',
      message: projectId
        ? `Using Google project ${projectId}.`
        : 'Set GOOGLE_CLOUD_PROJECT or pass --project before Google provider commands can run.',
    },
    {
      id: 'google.auth',
      status: authProfile.status === 'ready' ? 'pass' : 'fail',
      title: 'Google auth profile',
      message:
        authProfile.status === 'ready'
          ? `Profile ${authProfile.profile} has stored credentials and required scopes.`
          : 'Run google auth login with the cloud-platform scope so Codex can inspect Google setup.',
    },
    {
      id: 'google.apis',
      status: projectId && authProfile.status === 'ready' ? 'unknown' : 'blocked',
      title: 'Google APIs',
      message:
        projectId && authProfile.status === 'ready'
          ? 'Run google apis inventory or google apis plan to verify enabled APIs.'
          : 'API readiness is blocked until project and auth are ready.',
    },
  ];
  const nextActions: ControlPlaneSetupStatus['nextActions'] = [];
  if (!projectId) {
    nextActions.push({
      id: 'google.project.set',
      owner: 'developer',
      title: 'Choose Google project',
      message: 'Set GOOGLE_CLOUD_PROJECT locally or pass --project with the target project id.',
      command: null,
      risk: 'none',
    });
  }
  if (authProfile.status !== 'ready') {
    nextActions.push({
      id: 'google.auth.login',
      owner: 'developer',
      title: 'Authorize Google provider access',
      message: 'Codex can run this command and give you the consent URL; you approve in Google.',
      command: `unisane provider google auth login${authNamespaceFlag(options)} --profile ${status.profile} --scopes "${GOOGLE_CONTROL_PLANE_SCOPE}"`,
      risk: 'none',
    });
  }
  if (projectId && authProfile.status === 'ready') {
    nextActions.push({
      id: 'google.apis.plan',
      owner: 'codex',
      title: 'Plan missing Google APIs',
      message: 'Generate a no-mutation API enablement plan for this project.',
      command: `unisane provider google apis plan${authNamespaceFlag(options)} --project ${projectId}`,
      risk: 'none',
    });
  }
  nextActions.push({
    id: 'google.ads.developer-token',
    owner: 'provider',
    title: 'Google Ads approval remains provider-side',
    message:
      'Developer token approval, billing, terms, and ads policy reviews must be completed in Google surfaces.',
    command: null,
    risk: 'blocked',
  });
  const generatedAt = new Date().toISOString();
  const appId = options.app?.trim() || path.basename(cwd);
  return {
    schemaVersion: 1,
    kind: 'google.setup-status',
    provider: 'google',
    appId,
    environment,
    generatedAt,
    projectId,
    authProfile,
    envReport: {
      schemaVersion: 1,
      kind: 'control-plane.env-report',
      provider: 'google',
      appId,
      environment,
      generatedAt,
      entries: envEntries,
    },
    setupStatus: {
      schemaVersion: 1,
      kind: 'control-plane.setup-status',
      provider: 'google',
      appId,
      environment,
      generatedAt,
      ready: checks.every(
        (check) => check.status === 'pass' || check.status === 'warn' || check.status === 'unknown',
      ),
      checks,
      nextActions,
    },
    desiredApis,
  };
}
