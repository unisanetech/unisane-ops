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

export type SeoDetail =
  | { kind: 'opportunity'; id: string }
  | { kind: 'page'; id: string }
  | { kind: 'query'; id: string };

export type ConsoleOverlay =
  | { kind: 'command'; action: MarketingConsoleConnectionAction }
  | { kind: 'disconnect'; connection: MarketingConsoleConnection }
  | { kind: 'seo'; detail: SeoDetail };

export type ConsoleScreenProps = {
  state: MarketingConsoleState;
  route: ConsoleRoute;
  navigate: (path: string) => void;
  openOverlay: (overlay: ConsoleOverlay) => void;
};
