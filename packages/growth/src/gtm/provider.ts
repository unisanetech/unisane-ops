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
  GoogleTagManagerWorkspaceVersionOptions,
} from './contracts.js';

export type GoogleTagManagerReadRequest = GoogleTagManagerReadSnapshotOptions & {
  desiredResources: readonly GoogleTagManagerDesiredResource[];
};

export type GoogleTagManagerApplyRequest = GoogleTagManagerApplyOptions & {
  desiredResources: readonly GoogleTagManagerDesiredResource[];
  plan(remote: GoogleTagManagerRemoteSnapshot): GoogleTagManagerPlan;
  syncBeforeApply?: boolean;
  beforeWrite?: () => Promise<void>;
};

export interface GoogleTagManagerProvider {
  readVersion(
    accountId: string,
    containerId: string,
    versionId: string,
  ): Promise<import('./contracts.js').GoogleTagManagerJsonObject>;
  readLiveVersion(
    accountId: string,
    containerId: string,
  ): Promise<import('./contracts.js').GoogleTagManagerJsonObject | null>;
  listVersionHeaders(
    accountId: string,
    containerId: string,
  ): Promise<readonly import('./contracts.js').GoogleTagManagerJsonObject[]>;
  readSnapshot(options: GoogleTagManagerReadRequest): Promise<GoogleTagManagerRemoteSnapshot>;
  applyPlan(options: GoogleTagManagerApplyRequest): Promise<GoogleTagManagerApplyReceipt>;
  preview(
    options: GoogleTagManagerWorkspaceVersionOptions,
  ): Promise<GoogleTagManagerPreviewReceipt>;
  createVersion(
    options: GoogleTagManagerCreateVersionOptions,
  ): Promise<GoogleTagManagerCreateVersionReceipt>;
  publish(options: GoogleTagManagerPublishOptions): Promise<GoogleTagManagerPublishReceipt>;
}
