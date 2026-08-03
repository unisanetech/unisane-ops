import type { OPS_MCP_TOOL_NAMES, OPS_MCP_WORKFLOW_CONTRACTS } from '../server.js';

export type OpsMcpToolName = (typeof OPS_MCP_TOOL_NAMES)[number];
export type OpsMcpWorkflowToolName = keyof typeof OPS_MCP_WORKFLOW_CONTRACTS;

export type OpsMcpAgentProfile = {
  id: string;
  label: string;
  family: 'codex' | 'claude' | 'gemini' | 'ci';
  evidenceLevel: 'contract-profile';
  capabilities: {
    toolDiscovery: boolean;
    structuredContent: boolean;
    textPresentation: boolean;
    handoffResume: boolean;
  };
};

export type OpsMcpEvaluationScenario = {
  id: string;
  title: string;
  userQuestion: string;
  toolName: OpsMcpWorkflowToolName;
  projectId: string;
  environmentId: string;
  expectedEvidenceIds: readonly string[];
  expectedText: readonly string[];
  forbiddenText: readonly string[];
  expectedDeepLink: string;
  expectedResumeStatus: 'resumable' | 'run-changed' | 'evidence-changed';
  maximumTextCharacters?: number;
};

export type OpsMcpEvaluationCheck = {
  id: string;
  passed: boolean;
  detail: string;
};

export type OpsMcpEvaluationReport = {
  schemaVersion: 1;
  profileId: string;
  profileEvidenceLevel: 'contract-profile';
  scenarioId: string;
  passed: boolean;
  checks: readonly OpsMcpEvaluationCheck[];
};

export type OpsMcpToolResponse = {
  isError?: boolean;
  content?: readonly { type?: unknown; text?: unknown }[];
  structuredContent?: unknown;
};
