import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { GoogleTagManagerCliOptions, LoadedCommandContext } from './shared.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf8')) as unknown;
}

export function assertPreviewReceipt(args: {
  context: LoadedCommandContext;
  receiptPath: string | undefined;
}): void {
  if (!args.receiptPath) {
    throw new Error(
      '[GTM_PREVIEW_RECEIPT_REQUIRED] Pass --preview-receipt from a successful gtm preview before create-version.',
    );
  }
  const receipt = readJsonFile(path.resolve(args.context.cwd, args.receiptPath));
  if (!isRecord(receipt)) {
    throw new Error('[GTM_PREVIEW_RECEIPT_INVALID] Preview receipt must be a JSON object.');
  }
  if (
    receipt.appId !== args.context.manifest.appId ||
    receipt.environment !== args.context.environment
  ) {
    throw new Error(
      '[GTM_PREVIEW_RECEIPT_MISMATCH] Preview receipt app/environment does not match this command.',
    );
  }
  if (
    receipt.accountId !== args.context.manifest.accountId ||
    receipt.containerId !== args.context.manifest.containerId
  ) {
    throw new Error(
      '[GTM_PREVIEW_RECEIPT_CONTAINER_MISMATCH] Preview receipt account/container does not match this command.',
    );
  }
  if (receipt.compilerError === true) {
    throw new Error('[GTM_PREVIEW_RECEIPT_COMPILER_ERROR] Preview receipt has compiler errors.');
  }
}

export function assertVersionReceipt(args: {
  context: LoadedCommandContext;
  receiptPath: string | undefined;
  versionId: string;
}): void {
  if (!args.receiptPath) {
    throw new Error(
      '[GTM_VERSION_RECEIPT_REQUIRED] Pass --version-receipt from a successful gtm create-version before publish.',
    );
  }
  const receipt = readJsonFile(path.resolve(args.context.cwd, args.receiptPath));
  if (!isRecord(receipt)) {
    throw new Error('[GTM_VERSION_RECEIPT_INVALID] Version receipt must be a JSON object.');
  }
  if (
    receipt.appId !== args.context.manifest.appId ||
    receipt.environment !== args.context.environment
  ) {
    throw new Error(
      '[GTM_VERSION_RECEIPT_MISMATCH] Version receipt app/environment does not match this command.',
    );
  }
  if (
    receipt.accountId !== args.context.manifest.accountId ||
    receipt.containerId !== args.context.manifest.containerId
  ) {
    throw new Error(
      '[GTM_VERSION_RECEIPT_CONTAINER_MISMATCH] Version receipt account/container does not match this command.',
    );
  }
  if (receipt.compilerError === true) {
    throw new Error('[GTM_VERSION_RECEIPT_COMPILER_ERROR] Version receipt has compiler errors.');
  }
  if (typeof receipt.versionId === 'string' && receipt.versionId !== args.versionId) {
    throw new Error(
      '[GTM_VERSION_RECEIPT_VERSION_MISMATCH] Version receipt versionId does not match --version.',
    );
  }
}

export function assertRollbackSource(args: {
  context: LoadedCommandContext;
  options: GoogleTagManagerCliOptions;
  versionId: string;
}): { emergency: boolean; reason?: string; actor?: string; reconciliationTask?: string } {
  if (args.options.versionReceipt) {
    assertVersionReceipt({
      context: args.context,
      receiptPath: args.options.versionReceipt,
      versionId: args.versionId,
    });
    return { emergency: false };
  }

  const reason = args.options.emergencyReason?.trim();
  if (!reason) {
    throw new Error(
      '[GTM_ROLLBACK_RECEIPT_REQUIRED] Pass --version-receipt for normal rollback, or --emergency-reason with --actor and --reconciliation-task for an emergency rollback exception.',
    );
  }

  const actor = args.options.actor?.trim();
  if (!actor) {
    throw new Error('[GTM_ROLLBACK_EMERGENCY_ACTOR_REQUIRED] Emergency rollback requires --actor.');
  }

  const reconciliationTask = args.options.reconciliationTask?.trim();
  if (!reconciliationTask) {
    throw new Error(
      '[GTM_ROLLBACK_EMERGENCY_RECONCILIATION_REQUIRED] Emergency rollback requires --reconciliation-task.',
    );
  }

  return { emergency: true, reason, actor, reconciliationTask };
}
