import { useState } from 'react';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { SelectField } from '@unisane/ui/select-field';
import { useSidebar } from '@unisane/ui/sidebar';
import { Switch } from '@unisane/ui/switch';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { humanize } from '../../lib/format.js';
import {
  consoleHomeOptions,
  readConsoleHomePath,
  resetConsolePreferences,
  type ConsoleHomePath,
  writeConsoleHomePath,
} from '../../preferences.js';
import { ContentSection } from '../../shared/content.js';

export function SettingsScreen({ state, navigate }: ConsoleScreenProps) {
  const sidebar = useSidebar();
  const [homePath, setHomePath] = useState<ConsoleHomePath>(() => readConsoleHomePath());
  const [announcement, setAnnouncement] = useState('');

  function updateHomePath(value: string) {
    const next = value as ConsoleHomePath;
    setHomePath(next);
    writeConsoleHomePath(next);
    setAnnouncement('Home page preference saved.');
  }

  function resetPreferences() {
    resetConsolePreferences();
    setHomePath('/overview');
    sidebar.setExpanded(true);
    setAnnouncement('Local Console preferences were reset.');
  }

  return (
    <>
      <ContentSection
        title="Console preferences"
        description="These preferences apply only in this browser and do not change provider accounts or project configuration."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="outlined" padding="md">
            <Typography variant="panelTitle">Home page</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
              Choose where the Console opens when no page is specified.
            </Typography>
            <div className="mt-4">
              <SelectField
                label="Default home page"
                value={homePath}
                onValueChange={updateHomePath}
                options={consoleHomeOptions}
              />
            </div>
            <Button className="mt-4" variant="tonal" size="sm" onClick={() => navigate(homePath)}>
              Open selected home
            </Button>
          </Card>
          <Card variant="outlined" padding="md">
            <Typography variant="panelTitle">Navigation</Typography>
            <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
              Keep the full navigation visible or collapse it to give reports more room.
            </Typography>
            <Switch
              className="mt-5"
              checked={sidebar.expanded}
              onChange={(event) => sidebar.setExpanded(event.currentTarget.checked)}
              label="Keep navigation expanded"
            />
          </Card>
        </div>
      </ContentSection>
      <ContentSection title="Active workspace">
        <Card variant="outlined" padding="md">
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <Detail label="Project" value={humanize(state.platformId)} />
            <Detail label="App" value={humanize(state.appId)} />
            <Detail label="Environment" value={humanize(state.environment)} />
          </dl>
          <Typography variant="bodySmall" className="text-on-surface-variant mt-4">
            Provider accounts and selected resources are managed under Connections.
          </Typography>
          <Button
            className="mt-4"
            variant="tonal"
            size="sm"
            onClick={() => navigate('/connections')}
          >
            Manage connections
          </Button>
        </Card>
      </ContentSection>
      <ContentSection title="Reset local preferences">
        <Card variant="outlined" padding="md">
          <Typography variant="bodySmall" className="text-on-surface-variant">
            Restore Growth overview as the home page and expand the navigation.
          </Typography>
          <Button className="mt-4" variant="outlined" size="sm" onClick={resetPreferences}>
            Reset Console preferences
          </Button>
          <Typography
            aria-live="polite"
            variant="bodySmall"
            className="text-on-surface-variant mt-3"
          >
            {announcement}
          </Typography>
        </Card>
      </ContentSection>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-on-surface-variant">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
