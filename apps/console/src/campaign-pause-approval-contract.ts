import type { GrowthCampaignPauseWorkflowResult } from '@unisane/growth';

export const campaignPauseApprovalPath = '/api/actions/campaign-pause/approve';
export const campaignPauseApprovalHeader = 'x-unisane-console-action';
export const campaignPauseApprovalHeaderValue = 'approve-exact-campaign-pause-plan';

export type CampaignPauseApprovalRequest = {
  runId: string;
  planHash: string;
};

export type CampaignPauseApprovalResponse =
  | {
      ok: true;
      result: GrowthCampaignPauseWorkflowResult;
    }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
      };
    };
