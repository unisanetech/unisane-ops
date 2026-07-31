import type {
  MarketingConsoleAdvertisingView,
  MarketingConsoleState,
} from '@unisane/growth/console';
import type { AdvertisingPlatform, ConsoleRoute } from '../../../routes.js';

export function advertisingView(
  state: MarketingConsoleState,
  route: ConsoleRoute,
): MarketingConsoleAdvertisingView {
  if (route.advertisingPlatform === 'googleAds') {
    return state.advertising.providers.find((view) => view.scope === 'googleAds')!;
  }
  if (route.advertisingPlatform === 'metaAds') {
    return state.advertising.providers.find((view) => view.scope === 'metaAds')!;
  }
  return state.advertising.combined;
}

export function advertisingConnectionPath(platform: AdvertisingPlatform | undefined): string {
  if (platform === 'googleAds') return '/connections/google/overview';
  if (platform === 'metaAds') return '/connections/meta/overview';
  return '/connections';
}
