import type {
  MarketingConsoleConnection,
  MarketingConsoleConnectionAction,
  MarketingConsoleState,
} from '@unisane/growth/console';
import type { ConsoleNavigationGroup, ConsoleRoute } from '../routes.js';

export type ConsoleShellModel = {
  routes: readonly ConsoleRoute[];
  navigation: readonly ConsoleNavigationGroup[];
};

export type ConsoleOverlay =
  | { kind: 'command'; action: MarketingConsoleConnectionAction }
  | { kind: 'disconnect'; connection: MarketingConsoleConnection };

export type ConsoleScreenProps = {
  state: MarketingConsoleState;
  route: ConsoleRoute;
  navigate: (path: string) => void;
  openOverlay: (overlay: ConsoleOverlay) => void;
};
