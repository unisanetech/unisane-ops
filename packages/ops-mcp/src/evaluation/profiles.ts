import type { OpsMcpAgentProfile } from './contracts.js';

export const OPS_MCP_AGENT_CONTRACT_PROFILES = Object.freeze([
  {
    id: 'codex.local-mcp.contract',
    label: 'Codex local MCP contract profile',
    family: 'codex',
    evidenceLevel: 'contract-profile',
    capabilities: {
      toolDiscovery: true,
      structuredContent: true,
      textPresentation: true,
      handoffResume: true,
    },
  },
  {
    id: 'claude.local-mcp.contract',
    label: 'Claude local MCP contract profile',
    family: 'claude',
    evidenceLevel: 'contract-profile',
    capabilities: {
      toolDiscovery: true,
      structuredContent: true,
      textPresentation: true,
      handoffResume: true,
    },
  },
  {
    id: 'gemini.cli-mcp.contract',
    label: 'Gemini CLI MCP contract profile',
    family: 'gemini',
    evidenceLevel: 'contract-profile',
    capabilities: {
      toolDiscovery: true,
      structuredContent: true,
      textPresentation: true,
      handoffResume: true,
    },
  },
  {
    id: 'ci.structured-mcp.contract',
    label: 'CI structured MCP contract profile',
    family: 'ci',
    evidenceLevel: 'contract-profile',
    capabilities: {
      toolDiscovery: true,
      structuredContent: true,
      textPresentation: false,
      handoffResume: true,
    },
  },
] as const satisfies readonly OpsMcpAgentProfile[]);
