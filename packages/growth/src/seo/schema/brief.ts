import { z } from 'zod';

export const contentBriefIndexItemSchema = z.object({
  id: z.string().min(1),
  opportunityId: z.string().min(1),
  slug: z.string().min(1),
  routePath: z.string().min(1),
  title: z.string().min(1),
  primaryKeyword: z.string().min(1),
  priority: z.string().min(1),
  status: z.string().min(1),
  filePath: z.string().min(1),
});

export const contentBriefIndexSchema = z.object({
  version: z.literal(1),
  platformId: z.string().min(1),
  sourcePatternPack: z.string().min(1),
  generatedFrom: z.string().min(1),
  briefs: z.array(contentBriefIndexItemSchema),
});

export type ContentBriefIndex = z.infer<typeof contentBriefIndexSchema>;
export type ContentBriefIndexItem = z.infer<typeof contentBriefIndexItemSchema>;
