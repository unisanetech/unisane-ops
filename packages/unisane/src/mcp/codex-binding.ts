import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const START_MARKER = '# >>> unisane ops mcp:codex >>>';
const END_MARKER = '# <<< unisane ops mcp:codex <<<';
const SERVER_NAME = 'unisane_ops';
const TOOL_NAMES = [
  'review_growth_health',
  'research_seo_opportunities',
  'prepare_seo_implementation',
  'verify_seo_publication',
  'audit_growth_measurement',
  'plan_campaign_pause',
  'review_campaign_pause',
  'apply_approved_campaign_pause',
  'verify_campaign_pause',
] as const;

export type CodexMcpBindingOperation = 'install' | 'remove';

export interface CodexMcpBindingInput {
  projectRoot: string;
  operation: CodexMcpBindingOperation;
  environmentId?: string;
  actorId?: string;
  actorName?: string;
}

export interface CodexMcpBindingPlan {
  operation: CodexMcpBindingOperation;
  configPath: string;
  serverName: typeof SERVER_NAME;
  changed: boolean;
  before: string;
  after: string;
  managedBlock?: string;
}

function tomlString(value: string): string {
  return JSON.stringify(value);
}

function stableId(value: string | undefined, name: string): string {
  if (!value) throw new Error(`[OPS_CLI_ARGUMENT_REQUIRED] ${name} is required.`);
  if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(value)) {
    throw new Error(`[OPS_MCP_CODEX_ID_INVALID] ${name} must be a stable lowercase id.`);
  }
  return value;
}

function absoluteProjectRoot(projectRoot: string): string {
  if (!path.isAbsolute(projectRoot)) {
    throw new Error('[OPS_MCP_CODEX_PROJECT_INVALID] --project must be an absolute path.');
  }
  const resolved = path.resolve(projectRoot);
  if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
    throw new Error(
      '[OPS_MCP_CODEX_PROJECT_INVALID] --project must identify an existing directory.',
    );
  }
  return resolved;
}

export function renderCodexMcpBinding(input: {
  projectRoot: string;
  environmentId: string;
  actorId: string;
  actorName?: string;
}): string {
  const args = [
    'mcp',
    'serve',
    '--project',
    input.projectRoot,
    '--environment',
    input.environmentId,
    '--actor',
    input.actorId,
    ...(input.actorName ? ['--actor-name', input.actorName] : []),
  ];
  return [
    START_MARKER,
    `[mcp_servers.${SERVER_NAME}]`,
    'command = "unisane"',
    `args = ${JSON.stringify(args)}`,
    `cwd = ${tomlString(input.projectRoot)}`,
    'enabled = true',
    'required = false',
    'default_tools_approval_mode = "writes"',
    `enabled_tools = ${JSON.stringify(TOOL_NAMES)}`,
    END_MARKER,
  ].join('\n');
}

function managedSpan(source: string): { start: number; end: number } | undefined {
  const start = source.indexOf(START_MARKER);
  const endMarker = source.indexOf(END_MARKER);
  if (start === -1 && endMarker === -1) return undefined;
  if (start === -1 || endMarker === -1 || endMarker < start) {
    throw new Error('[OPS_MCP_CODEX_BLOCK_INVALID] The managed Codex MCP block is incomplete.');
  }
  if (
    source.indexOf(START_MARKER, start + START_MARKER.length) !== -1 ||
    source.indexOf(END_MARKER, endMarker + END_MARKER.length) !== -1
  ) {
    throw new Error('[OPS_MCP_CODEX_BLOCK_INVALID] Multiple managed Codex MCP blocks exist.');
  }
  let end = endMarker + END_MARKER.length;
  if (source.slice(end, end + 2) === '\r\n') end += 2;
  else if (source[end] === '\n') end += 1;
  return { start, end };
}

export function planCodexMcpBinding(input: CodexMcpBindingInput): CodexMcpBindingPlan {
  const projectRoot = absoluteProjectRoot(input.projectRoot);
  const configPath = path.join(projectRoot, '.codex', 'config.toml');
  const before = existsSync(configPath) ? readFileSync(configPath, 'utf8') : '';
  const span = managedSpan(before);
  if (input.operation === 'remove') {
    const after = span ? `${before.slice(0, span.start)}${before.slice(span.end)}` : before;
    return {
      operation: input.operation,
      configPath,
      serverName: SERVER_NAME,
      changed: after !== before,
      before,
      after,
    };
  }

  const environmentId = stableId(input.environmentId, '--environment');
  const actorId = stableId(input.actorId, '--actor');
  const managedBlock = renderCodexMcpBinding({
    projectRoot,
    environmentId,
    actorId,
    ...(input.actorName ? { actorName: input.actorName } : {}),
  });
  const replacement = `${managedBlock}\n`;
  const after = span
    ? `${before.slice(0, span.start)}${replacement}${before.slice(span.end)}`
    : `${replacement}${before}`;
  return {
    operation: input.operation,
    configPath,
    serverName: SERVER_NAME,
    changed: after !== before,
    before,
    after,
    managedBlock,
  };
}

export function applyCodexMcpBinding(plan: CodexMcpBindingPlan): void {
  if (!plan.changed) return;
  if (plan.operation === 'remove' && plan.after.length === 0) {
    if (existsSync(plan.configPath)) unlinkSync(plan.configPath);
    return;
  }
  const directory = path.dirname(plan.configPath);
  mkdirSync(directory, { recursive: true });
  const temporaryPath = `${plan.configPath}.${process.pid}.tmp`;
  const mode = existsSync(plan.configPath) ? statSync(plan.configPath).mode & 0o777 : 0o600;
  writeFileSync(temporaryPath, plan.after, { encoding: 'utf8', mode });
  renameSync(temporaryPath, plan.configPath);
}

export const CODEX_MCP_BINDING = Object.freeze({
  serverName: SERVER_NAME,
  toolNames: TOOL_NAMES,
  startMarker: START_MARKER,
  endMarker: END_MARKER,
});
