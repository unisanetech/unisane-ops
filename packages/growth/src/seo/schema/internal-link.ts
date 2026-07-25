import { z } from 'zod';

export const internalLinkTypeSchema = z.enum(['hub', 'related', 'conversion']);

export const internalLinkEdgeSchema = z.object({
  fromPath: z.string().min(1),
  toPath: z.string().min(1),
  label: z.string().min(1),
  type: internalLinkTypeSchema,
  reason: z.string().min(1),
});

export const internalLinkPageSchema = z.object({
  routePath: z.string().min(1),
  title: z.string().min(1),
  primaryKeyword: z.string().min(1),
  priority: z.string().min(1),
  inboundCount: z.number().int().nonnegative(),
  outboundCount: z.number().int().nonnegative(),
  orphanRisk: z.boolean(),
});

export const internalLinkPlanFileSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  sourcePatternPack: z.string().min(1),
  hubPath: z.string().min(1),
  pages: z.array(internalLinkPageSchema),
  edges: z.array(internalLinkEdgeSchema),
  orphanPaths: z.array(z.string().min(1)),
});

export type InternalLinkEdge = z.infer<typeof internalLinkEdgeSchema>;
export type InternalLinkPlanFile = z.infer<typeof internalLinkPlanFileSchema>;
