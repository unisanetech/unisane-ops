import { serveStdio, type ServeStdioOptions } from '@modelcontextprotocol/server/stdio';
import { createLocalOpsMcpServer } from './server.js';
import type {
  LocalOpsMcpBinding,
  OpsMcpGrowthExecutors,
  OpsMcpGrowthWorkflows,
} from './contracts.js';

export function serveLocalOpsMcpStdio(
  binding: LocalOpsMcpBinding,
  workflows: OpsMcpGrowthWorkflows,
  executors?: OpsMcpGrowthExecutors,
  options?: ServeStdioOptions,
): ReturnType<typeof serveStdio> {
  return serveStdio(() => createLocalOpsMcpServer(binding, workflows, executors), options);
}
