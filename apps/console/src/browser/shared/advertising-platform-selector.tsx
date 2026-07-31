import { SegmentedButton } from '@unisane/ui/segmented-button';
import { SelectField } from '@unisane/ui/select-field';
import { Typography } from '@unisane/ui/typography';
import {
  advertisingPlatformLabel,
  advertisingPlatformRoutes,
  type ConsoleRoute,
} from '../../routes.js';

export function AdvertisingPlatformSelector({
  route,
  navigate,
}: {
  route: ConsoleRoute;
  navigate: (path: string) => void;
}) {
  const tabs = advertisingPlatformRoutes(route);
  if (!route.advertisingPlatform || tabs.length < 2) return null;
  const options = tabs.map((tab) => ({
    value: tab.advertisingPlatform!,
    label: advertisingPlatformLabel(tab.advertisingPlatform!),
  }));
  const selectPlatform = (platform: string) => {
    const next = tabs.find((item) => item.advertisingPlatform === platform);
    if (next) navigate(next.path);
  };
  return (
    <div className="medium:w-auto w-full shrink-0">
      <div className="medium:hidden">
        <SelectField
          label="Advertising platform"
          value={route.advertisingPlatform}
          options={options}
          size="sm"
          onValueChange={selectPlatform}
        />
      </div>
      <div className="medium:flex hidden items-center gap-3">
        <Typography variant="labelMedium" className="text-on-surface-variant">
          Platform
        </Typography>
        <SegmentedButton
          value={route.advertisingPlatform}
          size="sm"
          aria-label="Advertising platform"
          options={options}
          onValueChange={selectPlatform}
        />
      </div>
    </div>
  );
}
