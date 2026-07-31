import type { ConsoleScreenProps } from '../../contracts.js';
import { AdvertisingCampaigns } from './campaigns.js';
import { AdvertisingChangeHistory } from './change-history.js';
import { AdvertisingConversions } from './conversions.js';
import { AdvertisingOverview } from './overview.js';
import { AdvertisingRecommendations } from './recommendations.js';
import { MetaAdSets, MetaAdsAndCreatives } from './meta-entities.js';

export function AdvertisingScreen(props: ConsoleScreenProps) {
  switch (props.route.advertisingSection) {
    case 'campaigns':
      return <AdvertisingCampaigns {...props} />;
    case 'ad-sets':
      return <MetaAdSets {...props} />;
    case 'ads-creatives':
      return <MetaAdsAndCreatives {...props} />;
    case 'conversions':
      return <AdvertisingConversions {...props} />;
    case 'recommendations':
      return <AdvertisingRecommendations {...props} />;
    case 'change-history':
      return <AdvertisingChangeHistory {...props} />;
    default:
      return <AdvertisingOverview {...props} />;
  }
}
