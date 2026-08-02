import { useEffect, useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const active = scrollRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [route.id]);
  if (tabs.length < 2) return null;
  return (
    <div className="px-layout-page-x mx-auto w-full max-w-7xl min-w-0 shrink-0">
      <Tabs
        value={route.id}
        size="md"
        onValueChange={(id) => {
          const next = tabs.find((item) => item.id === id);
          if (next) navigate(next.path);
        }}
      >
        <div
          ref={scrollRef}
          className="overflow-x-auto overscroll-x-contain scroll-smooth [scrollbar-width:thin]"
        >
          <TabsList className="min-w-max gap-1" aria-label={`${route.family} sections`}>
            {tabs.map((tab) => (
              <TabsTrigger value={tab.id} key={tab.id} className="[&>span]:opacity-100">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
    </div>
  );
}
