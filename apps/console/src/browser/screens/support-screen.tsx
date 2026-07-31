import type { ConsoleScreenProps } from '../contracts.js';
import { ActivityScreen } from './activity-screen.js';
import { AutomationsScreen } from './automations-screen.js';
import { HelpScreen } from './support/help-screen.js';
import { SettingsScreen } from './support/settings-screen.js';

export function SupportScreen(props: ConsoleScreenProps) {
  if (props.route.family === 'activity') return <ActivityScreen {...props} />;
  if (props.route.id === 'settings.automations') return <AutomationsScreen {...props} />;
  if (props.route.family === 'settings') return <SettingsScreen {...props} />;
  if (props.route.family === 'help') return <HelpScreen {...props} />;
  return null;
}
