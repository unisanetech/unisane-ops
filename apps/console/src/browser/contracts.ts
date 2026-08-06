import type {
  MarketingConsoleConnection,
  MarketingConsoleConnectionAction,
  MarketingConsoleState,
} from '@unisane/growth/console';
import type { ReactNode } from 'react';
import type { ConsoleNavigationGroup, ConsoleRoute } from '../routes.js';

export type ConsoleShellModel = {
  routes: readonly ConsoleRoute[];
  navigation: readonly ConsoleNavigationGroup[];
};

export type ConsoleOverlay =
  | { kind: 'command'; action: MarketingConsoleConnectionAction }
  | { kind: 'disconnect'; connection: MarketingConsoleConnection };

export type ConsoleSupportingPane = {
  id: string;
  title: string;
  subtitle?: string;
  content: ReactNode;
  onClose?: () => void;
};

export type ConsoleScreenProps = {
  state: MarketingConsoleState;
  route: ConsoleRoute;
  navigate: (path: string) => void;
  openOverlay: (overlay: ConsoleOverlay) => void;
  openSupportingPane: (pane: ConsoleSupportingPane) => void;
  closeSupportingPane: () => void;
};
