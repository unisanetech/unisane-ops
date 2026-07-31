import type { ConsoleScreenProps } from '../../contracts.js';
import { SeoHealthScreen } from './site-health.js';
import { SeoOverviewScreen } from './overview.js';
import { SeoOpportunitiesScreen } from './opportunities.js';
import { SeoPagesScreen } from './pages.js';
import { SeoQueriesScreen } from './queries.js';
import { SeoResearchScreen } from './research.js';

export function SeoScreen(props: ConsoleScreenProps) {
  switch (props.route.id) {
    case 'seo.opportunities':
      return <SeoOpportunitiesScreen {...props} />;
    case 'seo.pages':
      return <SeoPagesScreen {...props} />;
    case 'seo.queries':
      return <SeoQueriesScreen {...props} />;
    case 'seo.site-health':
      return <SeoHealthScreen {...props} />;
    case 'seo.research':
      return <SeoResearchScreen {...props} />;
    default:
      return <SeoOverviewScreen {...props} />;
  }
}
