import { useState } from 'react';
import type { MarketingConsoleState } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { Dialog } from '@unisane/ui/dialog';
import { Icon } from '@unisane/ui/icon';
import { Typography } from '@unisane/ui/typography';
import { formatDateTime, humanize } from '../../lib/format.js';
import {
  approveCampaignPausePlan,
  type CampaignPauseApprovalClient,
} from './campaign-pause-approval-client.js';

type CampaignPauseReview = MarketingConsoleState['advertising']['campaignPauseReviews'][number];

export function selectCampaignPauseReviews(
  reviews: readonly CampaignPauseReview[],
  platform: 'all' | 'googleAds' | 'metaAds' | undefined,
  campaigns: readonly { id: string; provider: 'googleAds' | 'metaAds' }[],
): CampaignPauseReview[] {
  const availableCampaigns = new Set(campaigns.map((campaign) => campaign.id));
  return reviews.filter(
    (review) =>
      (platform === undefined || platform === 'all' || review.target.provider === platform) &&
      availableCampaigns.has(`${review.target.provider}:${review.target.campaignId}`),
  );
}

const statusLabels: Record<CampaignPauseReview['status'], string> = {
  'plan-stale': 'Plan needs refresh',
  'approval-required': 'Approval required',
  'ready-to-apply': 'Ready to apply',
  'verification-pending': 'Waiting to verify',
  verified: 'Verified',
  'needs-attention': 'Needs attention',
  'outcome-unknown': 'Outcome not confirmed',
};

function reviewColor(
  status: CampaignPauseReview['status'],
): 'success' | 'warning' | 'error' | 'info' | 'primary' {
  if (status === 'verified') return 'success';
  if (status === 'needs-attention') return 'error';
  if (status === 'ready-to-apply') return 'primary';
  if (status === 'verification-pending' || status === 'outcome-unknown') return 'info';
  return 'warning';
}

function approvalLabel(review: CampaignPauseReview): string {
  if (review.approval.status === 'valid') return 'Approved';
  if (review.approval.status === 'expired') return 'Approval expired';
  if (review.approval.status === 'invalid') return 'Approval does not match';
  return 'Approval required';
}

function executionLabel(review: CampaignPauseReview): string {
  if (review.execution.status === 'not-started') return 'Not applied';
  if (review.execution.status === 'succeeded') return 'Request recorded';
  if (review.execution.status === 'failed') return 'Provider rejected request';
  return 'Provider outcome unknown';
}

function verificationLabel(review: CampaignPauseReview): string {
  if (review.verification.status === 'not-started') return 'Not checked';
  if (review.verification.status === 'pending') return 'Check window pending';
  if (review.verification.status === 'verified') return 'Provider reports paused';
  if (review.verification.status === 'needs-attention') return 'Pause not confirmed';
  return 'Provider state unknown';
}

function ReviewFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0">
      <Typography variant="labelMedium" className="text-on-surface-variant">
        {label}
      </Typography>
      <Typography variant="bodyMedium" className="mt-1 font-medium">
        {value}
      </Typography>
      <Typography variant="labelSmall" className="text-on-surface-variant mt-1 break-words">
        {detail}
      </Typography>
    </div>
  );
}

type ApprovalState = 'idle' | 'pending' | 'succeeded' | 'failed';

function canApprove(review: CampaignPauseReview, approvalAvailable: boolean): boolean {
  return (
    approvalAvailable &&
    review.status === 'approval-required' &&
    review.evidence.status === 'current' &&
    review.execution.status === 'not-started'
  );
}

export function CampaignPauseApprovalDialog({
  review,
  open,
  state,
  error,
  onClose,
  onApprove,
}: {
  review: CampaignPauseReview;
  open: boolean;
  state: ApprovalState;
  error?: string;
  onClose: () => void;
  onApprove: () => void;
}) {
  const pending = state === 'pending';
  const copy = campaignPauseApprovalCopy(review);
  return (
    <Dialog
      open={open}
      role="alertdialog"
      title={copy.title}
      description={copy.description}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !pending) onClose();
      }}
      actions={
        <>
          <Button variant="text" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={onApprove}>
            {pending ? 'Recording approval…' : 'Approve exact plan'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <div className="bg-surface-container-low rounded-lg p-4">
          <Typography variant="bodyMedium" className="font-semibold">
            This records approval only.
          </Typography>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
            {copy.noEffectExplanation}
          </Typography>
        </div>
        <ReviewFact
          label="Effect"
          value={review.effect.title}
          detail={`${review.effect.summary} ${review.effect.reversibility}`}
        />
        <ReviewFact
          label="Evidence"
          value="Current when this dialog opened"
          detail={`Revision ${review.evidence.currentRevision}`}
        />
        <div>
          <Typography variant="labelMedium" className="text-on-surface-variant">
            Exact plan
          </Typography>
          <code className="bg-surface-container-low mt-1 block rounded-sm p-3 text-sm break-all">
            {review.action.planHash}
          </code>
        </div>
        {error ? (
          <Typography role="alert" aria-live="assertive" variant="bodySmall" className="text-error">
            {error}
          </Typography>
        ) : null}
      </div>
    </Dialog>
  );
}

export function campaignPauseApprovalCopy(review: CampaignPauseReview) {
  return {
    title: 'Approve this exact campaign pause?',
    description: `${review.target.providerLabel} account ${review.target.providerAccountId} · Campaign ${review.target.campaignId}`,
    noEffectExplanation: `It does not contact ${review.target.providerLabel} or pause the campaign. A separately guarded action is still required to apply the change.`,
  };
}

export function CampaignPauseReviewPanel({
  review,
  approvalAvailable = false,
  approve = approveCampaignPausePlan,
}: {
  review: CampaignPauseReview;
  approvalAvailable?: boolean;
  approve?: CampaignPauseApprovalClient;
}) {
  const [currentReview, setCurrentReview] = useState(review);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [approvalState, setApprovalState] = useState<ApprovalState>('idle');
  const [approvalError, setApprovalError] = useState<string>();
  const titleId = `campaign-pause-review-${currentReview.action.planHash.slice(0, 12)}`;

  async function recordApproval() {
    if (approvalState === 'pending' || !canApprove(currentReview, approvalAvailable)) return;
    setApprovalState('pending');
    setApprovalError(undefined);
    try {
      const result = await approve({
        runId: currentReview.runId,
        planHash: currentReview.action.planHash,
      });
      if (
        result.runId !== currentReview.runId ||
        result.review.action.planHash !== currentReview.action.planHash
      ) {
        throw new Error('The approval response did not match this exact plan. Reload the console.');
      }
      setCurrentReview({ ...result.review, runId: result.runId });
      setApprovalState('succeeded');
      setDialogOpen(false);
    } catch (error) {
      setApprovalState('failed');
      setApprovalError(
        error instanceof Error
          ? error.message
          : 'Approval could not be recorded. Reload the console and try again.',
      );
    }
  }

  return (
    <>
      <Card variant="outlined" padding="none">
        <section aria-labelledby={titleId}>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl min-w-0">
              <Typography variant="labelMedium" className="text-on-surface-variant">
                {currentReview.target.providerLabel} · Account{' '}
                {currentReview.target.providerAccountId} · Campaign{' '}
                {currentReview.target.campaignId}
              </Typography>
              <Typography
                id={titleId}
                variant="titleLarge"
                component="h3"
                className="mt-1 font-semibold"
              >
                {currentReview.headline}
              </Typography>
              <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
                {currentReview.explanation}
              </Typography>
            </div>
            <div className="shrink-0">
              <Badge variant="tonal" color={reviewColor(currentReview.status)} size="sm">
                {statusLabels[currentReview.status]}
              </Badge>
            </div>
          </div>

          <div className="border-outline-weak grid gap-x-6 gap-y-4 border-y px-5 py-4 sm:grid-cols-2 xl:grid-cols-4">
            <ReviewFact
              label="Evidence"
              value={
                currentReview.evidence.status === 'current' ? 'Current' : 'Changed since planning'
              }
              detail={`Revision ${currentReview.evidence.plannedRevision}`}
            />
            <ReviewFact
              label="Approval"
              value={approvalLabel(currentReview)}
              detail={
                currentReview.approval.expiresAt
                  ? `${currentReview.approval.approvedBy ?? 'Recorded approver'} · Until ${formatDateTime(currentReview.approval.expiresAt)}`
                  : 'Exact-plan approval has not been recorded.'
              }
            />
            <ReviewFact
              label="Provider request"
              value={executionLabel(currentReview)}
              detail={
                currentReview.execution.completedAt
                  ? `${formatDateTime(currentReview.execution.completedAt)} · ${currentReview.execution.receiptId ?? 'Receipt recorded'}`
                  : 'No provider request has been made from this plan.'
              }
            />
            <ReviewFact
              label="Verification"
              value={verificationLabel(currentReview)}
              detail={
                currentReview.verification.checkedAt
                  ? `Checked ${formatDateTime(currentReview.verification.checkedAt)}`
                  : currentReview.verification.notBefore
                    ? `Available ${formatDateTime(currentReview.verification.notBefore)}`
                    : 'Verification begins only after a provider request.'
              }
            />
          </div>

          <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.65fr)]">
            <div>
              <Typography variant="labelMedium" className="text-on-surface-variant">
                Effect and risk
              </Typography>
              <Typography variant="bodyMedium" className="mt-1 font-medium">
                {currentReview.effect.title} · {humanize(currentReview.effect.risk)} risk
              </Typography>
              <Typography variant="bodyMedium" className="text-on-surface-variant mt-2">
                {currentReview.effect.summary}
              </Typography>
              <Typography variant="labelSmall" className="text-on-surface-variant mt-2">
                {currentReview.effect.reversibility}
              </Typography>
            </div>
            <div className="bg-surface-container-low flex items-start gap-3 rounded-lg p-4">
              <div className="text-primary shrink-0 pt-0.5" aria-hidden="true">
                <Icon
                  symbol={currentReview.nextStep.id === 'none' ? 'check_circle' : 'arrow_forward'}
                />
              </div>
              <div className="min-w-0">
                <Typography variant="labelMedium" className="text-on-surface-variant">
                  Next step
                </Typography>
                <Typography variant="bodyMedium" className="mt-1 font-semibold">
                  {currentReview.nextStep.label}
                </Typography>
                <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
                  {currentReview.nextStep.reason}
                </Typography>
                {canApprove(currentReview, approvalAvailable) ? (
                  <Button
                    variant="tonal"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setApprovalError(undefined);
                      setApprovalState('idle');
                      setDialogOpen(true);
                    }}
                  >
                    Review approval
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
          {approvalState === 'succeeded' ? (
            <Typography
              role="status"
              aria-live="polite"
              variant="bodySmall"
              className="text-success border-outline-weak border-t px-5 py-3"
            >
              Approval recorded for this exact plan. No provider request was made.
            </Typography>
          ) : null}
        </section>
      </Card>
      <CampaignPauseApprovalDialog
        review={currentReview}
        open={dialogOpen}
        state={approvalState}
        error={approvalError}
        onClose={() => setDialogOpen(false)}
        onApprove={recordApproval}
      />
    </>
  );
}
