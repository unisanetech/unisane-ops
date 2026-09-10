import { z } from 'zod';
import {
  googleTagManagerDiagnosisInputSchema,
  googleTagManagerDiagnosisResultSchema,
} from '../diagnosis.js';
export * from './input.js';
export const gtmTrackingSetupResultSchema = z
  .object({
    actionId: z.literal('growth.gtm.setup.generate'),
    projectId: z.string(),
    environment: z.string(),
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    manifest: googleTagManagerDiagnosisInputSchema.shape.manifest,
    diagnosis: googleTagManagerDiagnosisResultSchema,
    requiredObservations: z.array(
      z.object({
        event: z.string(),
        eventIdPath: z.string(),
        valuePath: z.string().optional(),
        currencyPath: z.string().optional(),
        transactionIdPath: z.string().optional(),
      }),
    ),
    nextSteps: z.array(z.string()),
    trackingVerified: z.literal(false),
  })
  .strict();
