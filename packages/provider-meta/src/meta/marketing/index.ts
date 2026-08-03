export { collectMetaSocialInventory } from './inventory.js';
export { pullMetaAdsReport } from './report-pull.js';
export { uploadMetaAdsAsset } from './asset-uploader.js';
export {
  executeMetaAdsLiveOperation,
  createMetaAdsCampaignControlAdapter,
  pauseMetaAdsCampaign,
  readMetaAdsCampaignStatus,
  type MetaAdsCampaignControlInput,
  type MetaAdsCampaignControlAdapterOptions,
  type MetaAdsCampaignPauseResult,
} from './live-ads-executor.js';
export type {
  MetaSocialInventory,
  MetaSocialInventoryResource,
  MetaSocialInventoryResourceType,
} from './inventory.js';
