import type { MarketingReportProvider } from '@unisane/growth/contracts';

export function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function optionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  const parsed = Number.parseFloat(value.replaceAll(',', ''));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function requireConfigValue(value: string | undefined, code: string, label: string): string {
  if (value) return value;
  throw new Error(`[${code}] ${label} is required for read-only provider API pulls.`);
}

export function resolveEnv(
  env: Record<string, string | undefined>,
  envName: string | undefined,
  code: string,
  label: string,
): string {
  const resolvedName = requireConfigValue(envName, code, `${label} env name`);
  const value = env[resolvedName];
  if (value) return value;
  throw new Error(`[${code}] ${resolvedName} is not set.`);
}

export async function readJsonResponse(
  response: Response,
  provider: MarketingReportProvider,
): Promise<unknown> {
  if (response.ok) return response.json();
  let body = '';
  try {
    body = await response.text();
  } catch {
    body = '';
  }
  throw new Error(
    `[MARKETING_PROVIDER_API_PULL_FAILED] ${provider} API request failed with ${response.status} ${response.statusText}.${body ? ` Body: ${body.slice(0, 500)}` : ''}`,
  );
}
