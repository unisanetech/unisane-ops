import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '@unisane/ui/icon';
import { IconButton } from '@unisane/ui/icon-button';
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
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const scrollElement = useCallback(
    () => scrollRef.current?.querySelector<HTMLElement>('[role="tablist"]'),
    [],
  );
  const updateOverflow = useCallback(() => {
    const element = scrollElement();
    if (!element) return;
    setCanScrollBack(element.scrollLeft > 1);
    setCanScrollForward(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
  }, [scrollElement]);
  useEffect(() => {
    const element = scrollElement();
    const active = element?.querySelector<HTMLElement>('[aria-selected="true"]');
    active?.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'center' });
    updateOverflow();
    if (!element) return;
    const observer = new ResizeObserver(updateOverflow);
    observer.observe(element);
    element.addEventListener('scroll', updateOverflow, { passive: true });
    window.addEventListener('resize', updateOverflow);
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', updateOverflow);
      window.removeEventListener('resize', updateOverflow);
    };
  }, [route.id, scrollElement, updateOverflow]);
  if (tabs.length < 2) return null;
  const isDense = tabs.length > 6;
  const scrollTabs = (direction: -1 | 1) => {
    const element = scrollElement();
    element?.scrollBy({
      left: direction * Math.max(element.clientWidth * 0.65, 240),
      behavior: 'smooth',
    });
  };
  return (
    <nav
      className="border-outline-weak bg-surface min-w-0 shrink-0 border-b"
      aria-label={`${route.family} navigation`}
    >
      <div className="px-layout-page-x mx-auto w-full max-w-7xl min-w-0">
        <Tabs
          value={route.id}
          size={isDense ? 'sm' : 'md'}
          onValueChange={(id) => {
            const next = tabs.find((item) => item.id === id);
            if (next) navigate(next.path);
          }}
        >
          <div className="flex min-w-0 items-center">
            {canScrollBack ? (
              <div className="medium:block hidden shrink-0">
                <IconButton
                  aria-label="Show previous sections"
                  icon={<Icon symbol="chevron_left" />}
                  size="sm"
                  variant="tonal"
                  className="me-1"
                  onClick={() => scrollTabs(-1)}
                />
              </div>
            ) : null}
            <div ref={scrollRef} className="min-w-0 flex-1">
              <TabsList
                className={`ops-route-tabs__list ${isDense ? 'gap-0' : 'gap-1'}`}
                aria-label={`${route.family} sections`}
              >
                {tabs.map((tab) => (
                  <TabsTrigger value={tab.id} key={tab.id} className="[&>span]:opacity-100">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {canScrollForward ? (
              <div className="medium:block hidden shrink-0">
                <IconButton
                  aria-label="Show more sections"
                  icon={<Icon symbol="chevron_right" />}
                  size="sm"
                  variant="tonal"
                  className="ms-1"
                  onClick={() => scrollTabs(1)}
                />
              </div>
            ) : null}
          </div>
        </Tabs>
      </div>
    </nav>
  );
}
