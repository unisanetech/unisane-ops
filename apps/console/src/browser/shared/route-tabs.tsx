import { Tabs, TabsList, TabsTrigger } from '@unisane/ui/tabs';
import { tabsForRoute, type ConsoleRoute } from '../../routes.js';

export function RouteTabs({
  route,
  navigate,
}: {
  route: ConsoleRoute;
  navigate: (path: string) => void;
}) {
  const tabs = tabsForRoute(route);
  if (tabs.length < 2) return null;
  return (
    <div className="px-layout-page-x mx-auto w-full max-w-7xl min-w-0 shrink-0">
      <Tabs
        value={route.id}
        size="sm"
        onValueChange={(id) => {
          const next = tabs.find((item) => item.id === id);
          if (next) navigate(next.path);
        }}
      >
        <TabsList className="gap-1" aria-label={`${route.family} sections`}>
          {tabs.map((tab) => (
            <TabsTrigger value={tab.id} key={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
