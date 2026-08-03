import {
  campaignPauseApprovalHeader,
  campaignPauseApprovalHeaderValue,
  campaignPauseApprovalPath,
  type CampaignPauseApprovalResponse,
} from '../../../campaign-pause-approval-contract.js';

export type CampaignPauseApprovalClient = (input: {
  runId: string;
  planHash: string;
}) => Promise<Extract<CampaignPauseApprovalResponse, { ok: true }>['result']>;

export const approveCampaignPausePlan: CampaignPauseApprovalClient = async (input) => {
  const response = await fetch(campaignPauseApprovalPath, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      [campaignPauseApprovalHeader]: campaignPauseApprovalHeaderValue,
    },
    body: JSON.stringify(input),
  });
  let body: CampaignPauseApprovalResponse;
  try {
    body = (await response.json()) as CampaignPauseApprovalResponse;
  } catch {
    throw new Error('Approval could not be recorded. Reload the console and try again.');
  }
  if (!response.ok || !body.ok) {
    throw new Error(body.ok ? 'Approval could not be recorded.' : body.error.message);
  }
  return body.result;
};
