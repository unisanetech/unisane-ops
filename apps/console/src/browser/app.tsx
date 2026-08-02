import { useState } from 'react';
import type { ConsoleOverlay } from './contracts.js';
import { readConsoleBootData } from './bootstrap.js';
import { useConsoleRoute } from './routing/use-console-route.js';
import { ConsoleShell } from './shell/console-shell.js';
import { PageContent, PageHeader, type PageDensity } from './shared/content.js';
import { ConsoleOverlayDialog } from './shared/overlays.js';
import { RouteTabs } from './shared/route-tabs.js';
import { AdvertisingPlatformSelector } from './shared/advertising-platform-selector.js';
import { ConnectionsScreen } from './screens/connections-screen.js';
import { OverviewScreen } from './screens/overview-screen.js';
import { SeoScreen } from './screens/seo/seo-screen.js';
import { SupportScreen } from './screens/support-screen.js';
import { AdvertisingScreen } from './screens/advertising/advertising-screen.js';
import { AnalyticsScreen } from './screens/analytics/analytics-screen.js';
import { ExperimentsScreen } from './screens/experiments/experiments-screen.js';

const boot = readConsoleBootData();

export function App() {
  const [overlay, setOverlay] = useState<ConsoleOverlay>();
  const { route, navigate } = useConsoleRoute(boot.state.capabilities);
  const screenProps = {
    state: boot.state,
    route,
    navigate,
    openOverlay: setOverlay,
  };
  const density: PageDensity =
    route.id === 'help' || route.id === 'settings'
      ? 'reading'
      : route.id === 'activity' ||
          route.id === 'seo.pages' ||
          route.id === 'seo.queries' ||
          route.id === 'seo.research' ||
          route.advertisingSection === 'campaigns' ||
          route.advertisingSection === 'ad-sets' ||
          route.advertisingSection === 'ads-creatives'
        ? 'data-dense'
        : 'standard';
  return (
    <>
      <ConsoleShell state={boot.state} shell={boot.shell} route={route} navigate={navigate}>
        <PageHeader
          route={route}
          state={boot.state}
          actions={<AdvertisingPlatformSelector route={route} navigate={navigate} />}
        />
        <RouteTabs route={route} navigate={navigate} />
        <PageContent density={density}>
          {route.family === 'overview' ? <OverviewScreen {...screenProps} /> : null}
          {route.family === 'seo' ? <SeoScreen {...screenProps} /> : null}
          {route.family === 'advertising' ? <AdvertisingScreen {...screenProps} /> : null}
          {route.family === 'analytics' ? <AnalyticsScreen {...screenProps} /> : null}
          {route.family === 'experiments' ? <ExperimentsScreen {...screenProps} /> : null}
          {route.family === 'connections' || route.family === 'connection-detail' ? (
            <ConnectionsScreen {...screenProps} />
          ) : null}
          {![
            'overview',
            'seo',
            'advertising',
            'analytics',
            'experiments',
            'connections',
            'connection-detail',
          ].includes(route.family) ? (
            <SupportScreen {...screenProps} />
          ) : null}
        </PageContent>
      </ConsoleShell>
      <ConsoleOverlayDialog
        overlay={overlay}
        state={boot.state}
        onClose={() => setOverlay(undefined)}
        onReplace={setOverlay}
      />
    </>
  );
}
