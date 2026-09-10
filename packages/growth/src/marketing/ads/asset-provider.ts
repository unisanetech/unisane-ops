import { z } from 'zod';

export const googleCampaignAssetLinkRequestSchema = z
  .object({
    customerId: z.string().regex(/^\d+$/),
    loginCustomerId: z.string().regex(/^\d+$/).optional(),
    campaignResourceName: z.string().regex(/^customers\/\d+\/campaigns\/\d+$/),
    fieldType: z.enum(['MARKETING_IMAGE', 'AD_IMAGE']),
    providerAssetIds: z.array(z.string().regex(/^customers\/\d+\/assets\/\d+$/)).min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const prefix = `customers/${value.customerId}/`;
    if (
      !value.campaignResourceName.startsWith(prefix) ||
      value.providerAssetIds.some((id) => !id.startsWith(prefix))
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Campaign and assets must belong to the selected customer.',
      });
    if (new Set(value.providerAssetIds).size !== value.providerAssetIds.length)
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Asset links must be unique.' });
  });
export type GoogleCampaignAssetLinkRequest = z.infer<typeof googleCampaignAssetLinkRequestSchema>;
export const googleCampaignAssetLinkResultSchema = z
  .object({
    providerResourceNames: z.array(z.string().regex(/^customers\/\d+\/campaignAssets\/.+$/)).min(1),
  })
  .strict();
export type GoogleCampaignAssetLinkResult = z.infer<typeof googleCampaignAssetLinkResultSchema>;
export type GoogleCampaignAssetLinker = (
  request: GoogleCampaignAssetLinkRequest,
) => Promise<GoogleCampaignAssetLinkResult>;
