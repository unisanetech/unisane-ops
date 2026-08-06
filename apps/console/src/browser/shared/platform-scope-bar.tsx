import type { ConsoleRoute } from '../../routes.js';
import { AdvertisingPlatformSelector } from './advertising-platform-selector.js';

export function PlatformScopeBar({
  route,
  navigate,
}: {
  route: ConsoleRoute;
  navigate: (path: string) => void;
}) {
  if (!route.advertisingPlatform) return null;

  return (
    <div className="px-layout-page-x mx-auto w-full max-w-7xl shrink-0 pt-2 pb-4">
      <AdvertisingPlatformSelector route={route} navigate={navigate} />
    </div>
  );
}
