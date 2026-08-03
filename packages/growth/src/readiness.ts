import { defineOpsReadinessFinding, type OpsReadinessFinding } from '@unisane/ops-engine/readiness';
import type { GrowthCapability, GrowthConfig } from './config.js';

export type GrowthDataObservation = {
  environmentId: string;
  state: 'warming' | 'ready' | 'stale' | 'delayed' | 'permission-blocked';
  observedAt: string;
  source: string;
  summary: string;
};

const GOOGLE_SERVICE_BY_CAPABILITY: Partial<Record<GrowthCapability, readonly string[]>> = {
  seo: ['search-console'],
  analytics: ['analytics'],
  'tag-manager': ['tag-manager'],
  advertising: ['ads'],
  experiments: ['analytics'],
  recommendations: ['analytics', 'search-console'],
};

export function requiredGrowthProviderServices(config: GrowthConfig, provider: 'google'): string[] {
  void provider;
  return [
    ...new Set(
      config.capabilities.flatMap((capability) => GOOGLE_SERVICE_BY_CAPABILITY[capability] ?? []),
    ),
  ];
}

export function buildGrowthConfigReadiness(input: {
  projectId: string;
  config: GrowthConfig;
  observedAt: string;
  dataObservations?: readonly GrowthDataObservation[];
}): OpsReadinessFinding[] {
  const services = requiredGrowthProviderServices(input.config, 'google');
  const findings: OpsReadinessFinding[] = [
    defineOpsReadinessFinding({
      schemaVersion: 1,
      code: 'growth.project.intent.ready',
      dimension: 'project',
      state: 'ready',
      severity: 'info',
      projectId: input.projectId,
      summary: `${input.config.capabilities.length} Growth capabilities are selected.`,
      blocking: false,
      observedAt: input.observedAt,
      evidence: [
        {
          kind: 'project-config',
          source: 'unisane.config.ts',
          observedAt: input.observedAt,
          freshness: 'fresh',
          summary: `Growth uses ${input.config.adoptionMode} adoption.`,
        },
      ],
    }),
  ];

  for (const [environmentId, environment] of Object.entries(input.config.environments)) {
    const googleConnection = environment.connections.google;
    if (services.length > 0 && !googleConnection) {
      findings.push(
        defineOpsReadinessFinding({
          schemaVersion: 1,
          code: 'growth.connection.google.missing',
          dimension: 'connection',
          state: 'not-connected',
          severity: 'error',
          projectId: input.projectId,
          environmentId,
          summary: 'Selected Growth capabilities require a Google connection.',
          blocking: true,
          observedAt: input.observedAt,
          evidence: [
            {
              kind: 'project-config',
              source: 'unisane.config.ts',
              observedAt: input.observedAt,
              freshness: 'fresh',
              summary: 'No Google connection is selected for this environment.',
            },
          ],
          nextAction: {
            id: 'growth.connection.google.connect',
            label: 'Connect Google',
            description: 'Connect only the Google services required by selected capabilities.',
            command: {
              path: ['connect', 'google'],
              args: ['--environment', environmentId],
              json: false,
              maximumEffect: 'write',
            },
            requiresConfirmation: true,
            requiresApproval: false,
          },
        }),
      );
    }

    for (const service of services) {
      const selected = environment.resources.some(
        (resource) =>
          resource.provider === 'google' &&
          resource.connection === googleConnection &&
          resource.service === service,
      );
      findings.push(
        defineOpsReadinessFinding({
          schemaVersion: 1,
          code: `growth.resource.google.${service}.${selected ? 'selected' : 'missing'}`,
          dimension: 'resource',
          state: selected ? 'ready' : 'missing',
          severity: selected ? 'info' : 'warning',
          projectId: input.projectId,
          environmentId,
          ...(googleConnection ? { connectionId: googleConnection } : {}),
          summary: selected
            ? `A Google ${service} resource is selected.`
            : `Google ${service} still needs a resource selection.`,
          blocking: false,
          observedAt: input.observedAt,
          evidence: [
            {
              kind: 'project-config',
              source: 'unisane.config.ts',
              observedAt: input.observedAt,
              freshness: 'fresh',
              summary: selected
                ? 'Resource selection is present.'
                : 'No matching resource selection is present.',
            },
          ],
          ...(!selected
            ? {
                nextAction: {
                  id: `growth.resource.google.${service}.select`,
                  label: `Select Google ${service} resource`,
                  description: `Discover and select the Google ${service} resource for ${environmentId}.`,
                  command: {
                    path: ['connect', 'google'],
                    args: ['--environment', environmentId, '--service', service],
                    json: false,
                    maximumEffect: 'write',
                  },
                  requiresConfirmation: true,
                  requiresApproval: false,
                },
              }
            : {}),
        }),
      );
    }

    const dataObservation = input.dataObservations?.find(
      (observation) => observation.environmentId === environmentId,
    );
    const dataState = dataObservation?.state ?? 'no-signal';
    const instrumentationReady =
      input.config.runtime.integration !== 'none' && dataObservation?.state === 'ready';
    findings.push(
      defineOpsReadinessFinding({
        schemaVersion: 1,
        code: `growth.instrumentation.${instrumentationReady ? 'ready' : input.config.runtime.integration}`,
        dimension: 'instrumentation',
        state:
          input.config.runtime.integration === 'none'
            ? 'not-selected'
            : instrumentationReady
              ? 'ready'
              : 'no-signal',
        severity: instrumentationReady ? 'info' : 'warning',
        projectId: input.projectId,
        environmentId,
        summary: instrumentationReady
          ? 'Configured Growth instrumentation has current observed evidence.'
          : input.config.runtime.integration === 'none'
            ? 'No Growth runtime integration is selected.'
            : 'Runtime intent is selected; observed instrumentation proof is still pending.',
        blocking: false,
        observedAt: input.observedAt,
        evidence: [
          {
            kind: instrumentationReady ? 'growth-data' : 'project-config',
            source: instrumentationReady ? dataObservation.source : 'unisane.config.ts',
            observedAt: instrumentationReady ? dataObservation.observedAt : input.observedAt,
            freshness: 'fresh',
            summary: instrumentationReady
              ? dataObservation.summary
              : `Runtime integration is ${input.config.runtime.integration}.`,
          },
        ],
        ...(!instrumentationReady && input.config.runtime.integration !== 'none'
          ? {
              nextAction: {
                id: 'growth.instrumentation.verify',
                label: 'Verify Growth instrumentation',
                description: 'Audit the selected runtime integration for observed signals.',
                command: {
                  path: ['growth', 'marketing', 'audit'],
                  args: ['--cwd', '.'],
                  json: false,
                  maximumEffect: 'offline',
                },
                requiresConfirmation: false,
                requiresApproval: false,
              },
            }
          : !instrumentationReady
            ? {
                nextAction: {
                  id: 'growth.instrumentation.select',
                  label: 'Select Growth instrumentation',
                  description: 'Choose the project runtime integration in canonical Growth intent.',
                  file: 'unisane.config.ts',
                  requiresConfirmation: false,
                  requiresApproval: false,
                },
              }
            : {}),
      }),
      defineOpsReadinessFinding({
        schemaVersion: 1,
        code: `growth.data.${dataState}`,
        dimension: 'data',
        state: dataState,
        severity:
          dataState === 'ready' ? 'info' : dataState === 'permission-blocked' ? 'error' : 'warning',
        projectId: input.projectId,
        environmentId,
        summary:
          dataObservation?.summary ?? 'No current Growth data evidence has been observed yet.',
        blocking: dataState === 'permission-blocked',
        observedAt: dataObservation?.observedAt ?? input.observedAt,
        evidence: [
          {
            kind: dataObservation ? 'growth-data' : 'readiness',
            source: dataObservation?.source ?? 'growth',
            observedAt: dataObservation?.observedAt ?? input.observedAt,
            freshness:
              dataState === 'ready'
                ? 'fresh'
                : dataState === 'warming'
                  ? 'warming'
                  : dataState === 'stale' || dataState === 'delayed'
                    ? 'stale'
                    : 'unknown',
            summary:
              dataObservation?.summary ??
              'Provider and runtime evidence checks have not completed.',
          },
        ],
        ...(dataState !== 'ready'
          ? {
              nextAction: {
                id: 'growth.data.refresh',
                label: 'Refresh Growth data',
                description: 'Refresh provider evidence through the selected connections.',
                command: {
                  path: ['growth', 'marketing', 'report'],
                  args: ['--cwd', '.'],
                  json: false,
                  maximumEffect: 'offline',
                },
                requiresConfirmation: false,
                requiresApproval: false,
              },
            }
          : {}),
      }),
      defineOpsReadinessFinding({
        schemaVersion: 1,
        code: `growth.mutation.${input.config.policy.mutation}`,
        dimension: 'mutation',
        state:
          input.config.policy.mutation === 'disabled' ||
          input.config.policy.mutation === 'plan-only'
            ? 'ready'
            : 'approval-required',
        severity: input.config.policy.mutation === 'disabled' ? 'info' : 'warning',
        projectId: input.projectId,
        environmentId,
        summary: `Growth mutation policy is ${input.config.policy.mutation}.`,
        blocking: false,
        observedAt: input.observedAt,
        evidence: [
          {
            kind: 'project-config',
            source: 'unisane.config.ts',
            observedAt: input.observedAt,
            freshness: 'fresh',
            summary: 'Mutation policy comes from canonical project intent.',
          },
        ],
      }),
    );
  }
  return findings;
}
