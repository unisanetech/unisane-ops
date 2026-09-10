import { z } from 'zod';
import { defineOpsReadAction } from '@unisane/ops-engine/actions';
import { validateGoogleTagManagerManifest } from './validation.js';
import { evaluateGoogleTagManagerPolicies } from './policies.js';
import { planGoogleTagManagerChanges } from './plan.js';
import type { GoogleTagManagerContainerManifest } from './contracts.js';

const resourceKind = z.enum(['folder', 'built_in_variable', 'variable', 'trigger', 'tag']);
const manifestSchema = z.custom<GoogleTagManagerContainerManifest>((value) => {
  try {
    return validateGoogleTagManagerManifest(value as GoogleTagManagerContainerManifest).ok;
  } catch {
    return false;
  }
}, 'Provide a structurally valid GTM desired-state manifest.');
export const googleTagManagerDiagnosisInputSchema = z
  .object({
    projectId: z.string().min(1),
    manifest: manifestSchema,
    environment: z.string().min(1),
    snapshot: z
      .object({
        containerPath: z.string().min(1),
        workspacePath: z.string().optional(),
        pulledAt: z.string().datetime().optional(),
        resources: z
          .array(
            z
              .object({
                kind: resourceKind,
                slug: z.string().min(1),
                remoteId: z.string().min(1),
                fingerprint: z.string().optional(),
                payload: z.unknown(),
                managed: z.boolean().optional(),
              })
              .strip(),
          )
          .max(10000),
      })
      .strip()
      .optional(),
  })
  .strict();
const issue = z.object({
  severity: z.enum(['error', 'warning']),
  code: z.string(),
  message: z.string(),
  path: z.string().optional(),
});
export const googleTagManagerDiagnosisResultSchema = z.object({
  actionId: z.literal('growth.gtm.diagnose'),
  projectId: z.string(),
  appId: z.string(),
  environment: z.string(),
  containerPath: z.string(),
  evidence: z.enum(['missing', 'supplied-snapshot']),
  capturedAt: z.string().optional(),
  issues: z.array(issue),
  operations: z.array(
    z.object({
      type: z.enum([
        'create_resource',
        'update_resource',
        'pause_tag',
        'retain_unmanaged_resource',
      ]),
      kind: resourceKind,
      slug: z.string(),
    }),
  ),
  readyToPlan: z.boolean(),
  trackingVerified: z.literal(false),
  verificationGaps: z.array(z.string()),
});
export type GoogleTagManagerDiagnosisInput = z.input<typeof googleTagManagerDiagnosisInputSchema>;
export type GoogleTagManagerDiagnosisResult = z.infer<typeof googleTagManagerDiagnosisResultSchema>;
export const googleTagManagerDiagnosisAction = defineOpsReadAction({
  id: 'growth.gtm.diagnose',
  schemaVersion: 1,
  maximumEffect: 'offline',
  inputSchema: googleTagManagerDiagnosisInputSchema,
  outputSchema: googleTagManagerDiagnosisResultSchema,
  async execute(raw, context) {
    const input = googleTagManagerDiagnosisInputSchema.parse(raw);
    if (input.projectId !== context.projectId || input.environment !== context.environmentId)
      throw new Error(
        '[GTM_DIAGNOSIS_TARGET_MISMATCH] Diagnosis project/environment differs from this action target.',
      );
    const issues = [
      ...validateGoogleTagManagerManifest(input.manifest).issues,
      ...evaluateGoogleTagManagerPolicies({
        manifest: input.manifest,
        environment: input.environment,
      }).issues,
    ];
    let operations: GoogleTagManagerDiagnosisResult['operations'] = [];
    if (!input.snapshot)
      issues.push({
        severity: 'warning',
        code: 'snapshot_missing',
        message:
          'Supply a selected workspace snapshot to diagnose installed resources and ownership.',
      });
    else {
      const plan = planGoogleTagManagerChanges({
        manifest: input.manifest,
        remote: {
          ...input.snapshot,
          resources: input.snapshot.resources.map((resource) => ({
            ...resource,
            payload: resource.payload,
          })),
        },
      });
      operations = plan.operations.map(({ type, kind, slug }) => ({ type, kind, slug }));
      for (const operation of operations.filter(
        (item) => item.type === 'retain_unmanaged_resource',
      ))
        issues.push({
          severity: 'warning',
          code: 'unmanaged_resource',
          message: `Unmanaged ${operation.kind} ${operation.slug} is retained; inspect ownership before adopting or disabling it.`,
        });
    }
    return googleTagManagerDiagnosisResultSchema.parse({
      actionId: 'growth.gtm.diagnose',
      projectId: input.projectId,
      appId: input.manifest.appId,
      environment: input.environment,
      containerPath: `accounts/${input.manifest.accountId}/containers/${input.manifest.containerId}`,
      evidence: input.snapshot ? 'supplied-snapshot' : 'missing',
      capturedAt: input.snapshot?.pulledAt,
      issues,
      operations,
      readyToPlan: !!input.snapshot && !issues.some((item) => item.severity === 'error'),
      trackingVerified: false,
      verificationGaps: [
        'Snapshot diagnosis does not verify current remote state.',
        'Compiler preview does not verify site installation, consent or tag firing.',
        'Verify each business journey and destination receipt after publication.',
      ],
    });
  },
});
