import type {
  GoogleTagManagerApplyOptions,
  GoogleTagManagerApplyReceipt,
  GoogleTagManagerCreateVersionOptions,
  GoogleTagManagerCreateVersionReceipt,
  GoogleTagManagerDesiredResource,
  GoogleTagManagerPlan,
  GoogleTagManagerPreviewReceipt,
  GoogleTagManagerPublishOptions,
  GoogleTagManagerPublishReceipt,
  GoogleTagManagerReadSnapshotOptions,
  GoogleTagManagerRemoteSnapshot,
  GoogleTagManagerRollbackReceipt,
  GoogleTagManagerWorkspaceVersionOptions,
} from './contracts.js';

export type GoogleTagManagerReadRequest = GoogleTagManagerReadSnapshotOptions & {
  desiredResources: readonly GoogleTagManagerDesiredResource[];
};

export type GoogleTagManagerApplyRequest = GoogleTagManagerApplyOptions & {
  desiredResources: readonly GoogleTagManagerDesiredResource[];
  plan(remote: GoogleTagManagerRemoteSnapshot): GoogleTagManagerPlan;
};

export interface GoogleTagManagerProvider {
  readSnapshot(options: GoogleTagManagerReadRequest): Promise<GoogleTagManagerRemoteSnapshot>;
  applyPlan(options: GoogleTagManagerApplyRequest): Promise<GoogleTagManagerApplyReceipt>;
  preview(
    options: GoogleTagManagerWorkspaceVersionOptions,
  ): Promise<GoogleTagManagerPreviewReceipt>;
  createVersion(
    options: GoogleTagManagerCreateVersionOptions,
  ): Promise<GoogleTagManagerCreateVersionReceipt>;
  publish(options: GoogleTagManagerPublishOptions): Promise<GoogleTagManagerPublishReceipt>;
  rollback(options: GoogleTagManagerPublishOptions): Promise<GoogleTagManagerRollbackReceipt>;
}
