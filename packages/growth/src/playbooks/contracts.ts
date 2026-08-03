import { z } from 'zod';

const stableIdSchema = z.string().regex(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/);
const nonEmptySchema = z.string().trim().min(1);

export const growthGoalDescriptorSchema = z
  .object({
    id: stableIdSchema,
    version: z.number().int().positive(),
    title: nonEmptySchema.max(100),
    description: nonEmptySchema.max(280),
    outcome: nonEmptySchema.max(280),
    conversationStarters: z.array(nonEmptySchema.max(160)).min(1).max(5),
  })
  .strict();
export type GrowthGoalDescriptor = z.infer<typeof growthGoalDescriptorSchema>;

export const growthPlaybookActionReferenceSchema = z
  .object({
    id: stableIdSchema,
    schemaVersion: z.number().int().positive(),
  })
  .strict();
export type GrowthPlaybookActionReference = z.infer<typeof growthPlaybookActionReferenceSchema>;

export const growthPlaybookStageSchema = z
  .object({
    id: stableIdSchema,
    title: nonEmptySchema.max(100),
    guidance: nonEmptySchema.max(280),
    actionReferences: z.array(growthPlaybookActionReferenceSchema).max(5),
  })
  .strict();
export type GrowthPlaybookStage = z.infer<typeof growthPlaybookStageSchema>;

export const growthPlaybookDescriptorSchema = z
  .object({
    id: stableIdSchema,
    version: z.number().int().positive(),
    goal: z
      .object({
        id: stableIdSchema,
        version: z.number().int().positive(),
      })
      .strict(),
    title: nonEmptySchema.max(100),
    description: nonEmptySchema.max(280),
    stages: z.array(growthPlaybookStageSchema).min(1).max(12),
  })
  .strict()
  .superRefine((playbook, context) => {
    const stageIds = new Set(playbook.stages.map((stage) => stage.id));
    if (stageIds.size !== playbook.stages.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Growth playbook stage ids must be unique.',
      });
    }
  });
export type GrowthPlaybookDescriptor = z.infer<typeof growthPlaybookDescriptorSchema>;

export function defineGrowthGoal(input: GrowthGoalDescriptor): GrowthGoalDescriptor {
  return Object.freeze(growthGoalDescriptorSchema.parse(input));
}

export function defineGrowthPlaybook(input: GrowthPlaybookDescriptor): GrowthPlaybookDescriptor {
  return Object.freeze(growthPlaybookDescriptorSchema.parse(input));
}

export function validateGrowthPlaybookActionReferences(input: {
  playbook: GrowthPlaybookDescriptor;
  actions: readonly { id: string; schemaVersion: number }[];
}): void {
  const playbook = growthPlaybookDescriptorSchema.parse(input.playbook);
  const actions = new Map(input.actions.map((action) => [action.id, action.schemaVersion]));
  for (const stage of playbook.stages) {
    for (const reference of stage.actionReferences) {
      if (actions.get(reference.id) !== reference.schemaVersion) {
        throw new Error(
          `[GROWTH_PLAYBOOK_ACTION_UNAVAILABLE] ${playbook.id} references unavailable action ${reference.id}@${reference.schemaVersion}.`,
        );
      }
    }
  }
}
