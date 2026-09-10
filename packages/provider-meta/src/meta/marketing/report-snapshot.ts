import { z } from 'zod';
import {
  growthReportReadInputSchema,
  growthReportSnapshotSchema,
  type GrowthReportBinding,
  type GrowthReportReadInput,
} from '@unisane/growth/contracts';
const numeric = z
  .union([
    z.number(),
    z
      .string()
      .regex(/^-?\d+(?:\.\d+)?$/)
      .transform(Number),
  ])
  .pipe(z.number().finite());
const action = z.object({ action_type: z.string().min(1).max(300), value: numeric });
const row = z.object({
  account_id: z.string().regex(/^(?:act_)?\d+$/),
  account_name: z.string().optional(),
  campaign_id: z.string().optional(),
  campaign_name: z.string().optional(),
  adset_id: z.string().optional(),
  adset_name: z.string().optional(),
  ad_id: z.string().optional(),
  ad_name: z.string().optional(),
  account_currency: z.string().optional(),
  impressions: numeric.optional(),
  clicks: numeric.optional(),
  spend: numeric.optional(),
  actions: z.array(action).max(100).optional(),
  action_values: z.array(action).max(100).optional(),
});
export function normalizeMetaReportSnapshot(input: {
  binding: GrowthReportBinding;
  request: GrowthReportReadInput;
  payload: unknown;
  capturedAt: string;
}) {
  const request = growthReportReadInputSchema.parse(input.request);
  const payload = z
    .object({
      accountId: z.string(),
      inputFormat: z.literal('meta-ads'),
      reportType: z.string().optional(),
      value: z.object({
        data: z.array(row).max(1000),
        partial: z.boolean(),
        reportType: z.string(),
        window: z.object({ startDate: z.string(), endDate: z.string() }),
      }),
    })
    .parse(input.payload);
  const account = (value: string) => `act_${value.replace(/^act_/, '')}`;
  if (
    account(payload.accountId) !== input.binding.accountId ||
    payload.value.reportType !== request.reportType ||
    (payload.reportType && payload.reportType !== request.reportType) ||
    payload.value.window.startDate !== request.startDate ||
    payload.value.window.endDate !== request.endDate
  )
    throw new Error(
      '[META_REPORT_TARGET_MISMATCH] Provider report routing does not match the requested account and window.',
    );
  const rows = payload.value.data.map((value) => {
    if (account(value.account_id) !== input.binding.accountId)
      throw new Error('[META_REPORT_ACCOUNT_MISMATCH] A report row belongs to another account.');
    const id =
      request.reportType === 'account'
        ? value.account_id
        : request.reportType === 'campaign'
          ? value.campaign_id
          : request.reportType === 'adSet'
            ? value.adset_id
            : value.ad_id;
    const name =
      request.reportType === 'account'
        ? value.account_name
        : request.reportType === 'campaign'
          ? value.campaign_name
          : request.reportType === 'adSet'
            ? value.adset_name
            : value.ad_name;
    const actions = new Map<string, { type: string; count?: number; value?: number }>();
    for (const [kind, values] of [
      ['count', value.actions],
      ['value', value.action_values],
    ] as const) {
      for (const item of values ?? []) {
        const current = actions.get(item.action_type) ?? { type: item.action_type };
        if (current[kind] !== undefined)
          throw new Error(
            '[META_REPORT_ACTION_DUPLICATE] Provider returned repeated values for one action type.',
          );
        current[kind] = item.value;
        actions.set(item.action_type, current);
      }
    }
    return {
      id,
      name,
      accountId: input.binding.accountId,
      accountName: value.account_name,
      currency: value.account_currency,
      impressions: value.impressions,
      clicks: value.clicks,
      spend: value.spend,
      actions: [...actions.values()],
    };
  });
  return growthReportSnapshotSchema.parse({
    binding: input.binding,
    reportType: request.reportType,
    startDate: request.startDate,
    endDate: request.endDate,
    capturedAt: input.capturedAt,
    partial: payload.value.partial,
    rows,
  });
}
