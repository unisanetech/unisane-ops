import { useCallback, useEffect, useRef, useState } from 'react';
import type { ConsoleOverlay, ConsoleSupportingPane } from './contracts.js';
import { readConsoleBootData } from './bootstrap.js';
import { useConsoleRoute } from './routing/use-console-route.js';
import { ConsoleShell } from './shell/console-shell.js';
import { DataState, PageContent, PageHeader, type PageDensity } from './shared/content.js';
import { ConsoleOverlayDialog } from './shared/overlays.js';
import { PlatformScopeBar } from './shared/platform-scope-bar.js';
import { RouteTabs } from './shared/route-tabs.js';
import { TemporalContextBar } from './shared/temporal-context-bar.js';
import { useConsoleTemporalQuery } from './routing/use-console-temporal-query.js';
import { ConnectionsScreen } from './screens/connections-screen.js';
import { OverviewScreen } from './screens/overview-screen.js';
import { SeoScreen } from './screens/seo/seo-screen.js';
import { SupportScreen } from './screens/support-screen.js';
import { AdvertisingScreen } from './screens/advertising/advertising-screen.js';
import { AnalyticsScreen } from './screens/analytics/analytics-screen.js';
import { ExperimentsScreen } from './screens/experiments/experiments-screen.js';

const boot = readConsoleBootData();
const temporalStateCache = new Map<string, typeof boot.state>();

function temporalCacheKey(startDate: string, endDate: string): string {
  return `${startDate}:${endDate}`;
}

function stateMatchesQuery(
  state: typeof boot.state,
  query: { startDate: string; endDate: string },
): boolean {
  return (
    state.dateWindow.startDate === query.startDate && state.dateWindow.endDate === query.endDate
  );
}

export function App() {
  const [state, setState] = useState(boot.state);
  const [temporalLoading, setTemporalLoading] = useState(false);
  const [temporalError, setTemporalError] = useState<string>();
  const [overlay, setOverlay] = useState<ConsoleOverlay>();
  const [supportingPane, setSupportingPane] = useState<ConsoleSupportingPane>();
  const supportingPaneRef = useRef<ConsoleSupportingPane | undefined>(undefined);
  const { route, navigate } = useConsoleRoute(boot.state.capabilities);
  const temporal = useConsoleTemporalQuery(route, boot.state);
  const openSupportingPane = useCallback((pane: ConsoleSupportingPane) => {
    supportingPaneRef.current = pane;
    setSupportingPane(pane);
  }, []);
  const closeSupportingPane = useCallback(() => {
    const currentPane = supportingPaneRef.current;
    supportingPaneRef.current = undefined;
    currentPane?.onClose?.();
    setSupportingPane(undefined);
  }, []);
  useEffect(() => {
    closeSupportingPane();
  }, [closeSupportingPane, route.id]);
  useEffect(() => {
    if (!temporal.enabled) {
      setState(boot.state);
      setTemporalLoading(false);
      setTemporalError(undefined);
      return;
    }
    const cacheKey = temporalCacheKey(temporal.query.startDate, temporal.query.endDate);
    const cachedState = temporalStateCache.get(cacheKey);
    if (cachedState) {
      setState(cachedState);
      setTemporalLoading(false);
      setTemporalError(undefined);
      return;
    }
    if (stateMatchesQuery(boot.state, temporal.query)) {
      temporalStateCache.set(cacheKey, boot.state);
      setState(boot.state);
      setTemporalLoading(false);
      setTemporalError(undefined);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({
      from: temporal.query.startDate,
      to: temporal.query.endDate,
    });
    setTemporalLoading(true);
    setTemporalError(undefined);
    fetch(`/api/console/state?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Unable to query the selected reporting period.');
        const payload: unknown = await response.json();
        return payload as typeof boot.state;
      })
      .then((nextState) => {
        temporalStateCache.set(cacheKey, nextState);
        setState(nextState);
      })
      .catch((error) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setTemporalError('Could not update this view. The previous results are still shown.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setTemporalLoading(false);
      });
    return () => controller.abort();
  }, [temporal.enabled, temporal.query.endDate, temporal.query.startDate]);
  const temporalStateReady = !temporal.enabled || stateMatchesQuery(state, temporal.query);
  const screenProps = {
    state,
    route,
    navigate,
    openOverlay: setOverlay,
    openSupportingPane,
    closeSupportingPane,
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
      <ConsoleShell
        state={state}
        shell={boot.shell}
        route={route}
        navigate={navigate}
        primaryNavigation={<RouteTabs route={route} navigate={navigate} />}
        supportingPane={supportingPane}
        onCloseSupportingPane={closeSupportingPane}
      >
        <PageHeader route={route} state={state} />
        <PlatformScopeBar route={route} navigate={navigate} />
        <TemporalContextBar
          route={route}
          state={state}
          query={temporal.query}
          loading={temporalLoading}
          error={temporalError}
          onQueryChange={temporal.setQuery}
        />
        <PageContent density={density}>
          {!temporalStateReady ? (
            <DataState
              kind={temporalError ? 'error' : 'loading'}
              title={
                temporalError
                  ? 'The selected period could not be loaded.'
                  : 'Loading selected period'
              }
              description={
                temporalError
                  ? 'Choose another reporting period or try this period again. Results from different dates are not shown under the selected range.'
                  : 'Reading the recorded local evidence for these dates.'
              }
            />
          ) : (
            <>
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
            </>
          )}
        </PageContent>
      </ConsoleShell>
      <ConsoleOverlayDialog
        overlay={overlay}
        state={state}
        onClose={() => setOverlay(undefined)}
        onReplace={setOverlay}
      />
    </>
  );
}
