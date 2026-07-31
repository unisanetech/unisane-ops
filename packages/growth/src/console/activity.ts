import type {
  MarketingConsoleActivity,
  MarketingConsoleActivityCategory,
  MarketingConsoleActivityItem,
  MarketingConsoleFreshnessCell,
  MarketingConsoleReceiptEvent,
  MarketingConsoleStatus,
} from './contracts.js';

function providerLabel(provider: MarketingConsoleFreshnessCell['provider']): string {
  if (provider === 'googleAds') return 'Google Ads';
  if (provider === 'ga4') return 'Google Analytics';
  if (provider === 'searchConsole') return 'Search Console';
  if (provider === 'metaAds') return 'Meta Ads';
  if (provider === 'confirmedConversions') return 'Unisane';
  return 'Growth workspace';
}

export function activityTitleForReceipt(receipt: MarketingConsoleReceiptEvent): string {
  const action = receipt.action.toLowerCase();
  if (action === 'gtm.preview') return 'Tag Manager preview checked';
  if (action === 'gtm.apply') return 'Tag Manager workspace updated';
  if (action === 'gtm.version') return 'Tag Manager version created';
  if (action === 'gtm.publish') return 'Tag Manager changes published';
  if (action === 'gtm.rollback') return 'Tag Manager changes rolled back';
  if (action === 'recommendation.accepted') return 'Recommendation accepted for planning';
  if (action === 'recommendation.dismissed') return 'Recommendation dismissed';
  if (action.includes('maximize-conversions') && action.includes('open-targeting')) {
    return 'Advertising targeting restored for Maximize Conversions';
  }
  if (action.includes('targeting-restore')) return 'Advertising targeting restored';
  if (action.includes('cpa') && action.includes('budget') && action.includes('update')) {
    return 'Advertising budget and target cost updated';
  }
  if (receipt.lane === 'ads' || action.includes('ads')) return 'Advertising settings updated';
  if (receipt.lane === 'gtm' || action.includes('gtm')) return 'Tag Manager activity recorded';
  return 'Growth workspace updated';
}

export function activitySummaryForStatus(status: MarketingConsoleStatus): string {
  if (status === 'ready') return 'The change completed successfully.';
  if (status === 'blocked') return 'The change did not complete and needs attention.';
  if (status === 'warn') return 'The change completed with an item to review.';
  return 'The result of this change is not available yet.';
}

function activitySummaryForReceipt(receipt: MarketingConsoleReceiptEvent): string {
  const action = receipt.action.toLowerCase();
  if (action === 'gtm.preview' && receipt.status === 'ready') {
    return 'The Tag Manager workspace passed its preview check.';
  }
  if (action === 'gtm.apply' && receipt.status === 'ready') {
    return 'Changes were applied to the Tag Manager workspace.';
  }
  if (action === 'gtm.version' && receipt.status === 'ready') {
    return 'A Tag Manager container version was created.';
  }
  if (action === 'gtm.publish' && receipt.status === 'ready') {
    return 'The Tag Manager changes were published.';
  }
  if (action === 'gtm.rollback' && receipt.status === 'ready') {
    return 'The Tag Manager changes were rolled back.';
  }
  if (action === 'recommendation.accepted') {
    return 'The recommendation was recorded as planning input; no provider change was made.';
  }
  if (action === 'recommendation.dismissed') {
    return 'The recommendation was dismissed with a recorded reason.';
  }
  if (receipt.lane === 'ads' || action.includes('ads')) {
    if (receipt.status === 'ready') {
      return 'The advertising configuration change completed successfully.';
    }
    if (receipt.status === 'blocked') {
      return 'The advertising configuration change did not complete and needs attention.';
    }
  }
  return activitySummaryForStatus(receipt.status);
}

function categoryForReceipt(
  receipt: MarketingConsoleReceiptEvent,
): MarketingConsoleActivityCategory {
  if (receipt.status === 'blocked') return 'errors';
  if (/approve|publish|recommendation\.(accepted|dismissed)/i.test(receipt.action)) {
    return 'approvals';
  }
  return 'changes';
}

function scopeForReceipt(receipt: MarketingConsoleReceiptEvent): {
  providerLabel: string;
  resourceLabel: string;
} {
  if (receipt.lane === 'ads' || /ads/i.test(receipt.action)) {
    return { providerLabel: 'Google Ads', resourceLabel: 'Advertising configuration' };
  }
  if (receipt.lane === 'gtm' || /gtm/i.test(receipt.action)) {
    return { providerLabel: 'Tag Manager', resourceLabel: 'Measurement workspace' };
  }
  return { providerLabel: 'Unisane', resourceLabel: 'Growth workspace' };
}

function receiptItem(receipt: MarketingConsoleReceiptEvent): MarketingConsoleActivityItem {
  const scope = scopeForReceipt(receipt);
  return {
    id: `change.${receipt.id}`,
    category: categoryForReceipt(receipt),
    title: activityTitleForReceipt(receipt),
    summary: activitySummaryForReceipt(receipt),
    status: receipt.status,
    providerLabel: receipt.providerLabel ?? scope.providerLabel,
    resourceLabel: receipt.resourceLabel ?? scope.resourceLabel,
    actorLabel: receipt.actorLabel ?? 'Not recorded',
    approvalLabel:
      receipt.approvalLabel ??
      (/approve|publish|apply|live/i.test(receipt.action)
        ? 'Review technical evidence'
        : 'Not required or not recorded'),
    ...(receipt.timestamp ? { occurredAt: receipt.timestamp } : {}),
    ...(receipt.previousValue ? { previousValue: receipt.previousValue } : {}),
    ...(receipt.newValue ? { newValue: receipt.newValue } : {}),
    technical: {
      action: receipt.action,
      sourcePath: receipt.path,
      ...(receipt.timestamp ? { rawTimestamp: receipt.timestamp } : {}),
    },
  };
}

function syncItem(cell: MarketingConsoleFreshnessCell): MarketingConsoleActivityItem | undefined {
  if (!cell.path || !cell.pulledAt) return undefined;
  const status = cell.status;
  return {
    id: `sync.${cell.id}`,
    category: status === 'blocked' ? 'errors' : 'syncs',
    title:
      status === 'ready'
        ? `${cell.label} updated`
        : status === 'blocked'
          ? `${cell.label} update failed`
          : `${cell.label} needs an update`,
    summary:
      status === 'ready'
        ? `The latest ${cell.label.toLowerCase()} data is available.`
        : cell.message,
    status,
    providerLabel: providerLabel(cell.provider),
    resourceLabel: cell.label,
    actorLabel: 'Provider connection',
    approvalLabel: 'Read-only update',
    occurredAt: cell.pulledAt,
    technical: {
      action: `sync.${cell.id}`,
      sourcePath: cell.path,
      rawTimestamp: cell.pulledAt,
    },
  };
}

export function buildMarketingConsoleActivity(input: {
  receipts: readonly MarketingConsoleReceiptEvent[];
  freshness: readonly MarketingConsoleFreshnessCell[];
}): MarketingConsoleActivity {
  const items = [
    ...input.receipts.map(receiptItem),
    ...input.freshness.map(syncItem).filter((item): item is MarketingConsoleActivityItem => !!item),
  ]
    .sort((left, right) => (right.occurredAt ?? '').localeCompare(left.occurredAt ?? ''))
    .slice(0, 50);
  const errorCount = items.filter((item) => item.category === 'errors').length;
  return {
    status: errorCount > 0 ? 'warn' : items.length > 0 ? 'ready' : 'missing',
    headline:
      errorCount > 0
        ? `${errorCount} recent ${errorCount === 1 ? 'event needs' : 'events need'} attention.`
        : items.length > 0
          ? 'Recent growth activity is available.'
          : 'No activity has been recorded yet.',
    summary:
      items.length > 0
        ? 'Review readable provider updates and managed changes. Exact operation evidence stays inside Technical details.'
        : 'Provider updates and managed changes will appear here after they occur.',
    items,
  };
}
