import type { Server } from 'node:http';
import type { MarketingConsoleState } from './marketing-console-state.js';

export type MarketingConsoleBuildResult = {
  workspaceRoot: string;
  outputDirectory: string;
  entryHtmlPath: string;
  statePath: string;
  assetPaths: string[];
  writeStatus: 'dry-run' | 'written';
  generatedAt: string;
  readiness: MarketingConsoleState['readiness'];
  state: MarketingConsoleState;
};

export type MarketingConsoleServeResult = MarketingConsoleBuildResult & {
  host: string;
  port: number;
  url: string;
  server: Server;
};
