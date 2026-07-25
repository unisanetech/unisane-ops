export function toSnakeCase(value: string): string {
  return value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[\s\-./]+/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function normalizeParamsToSnakeCase(
  params: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!params) return {};
  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    normalized[toSnakeCase(key)] = value;
  }
  return normalized;
}
