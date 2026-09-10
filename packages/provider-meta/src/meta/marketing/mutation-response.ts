/** Provider error bodies can echo credentials or request fields; never expose them. */
export async function readMetaMutationResponse(
  response: Response,
  code: string,
  label: string,
): Promise<unknown> {
  if (!response.ok) throw new Error(`[${code}] ${label} failed (HTTP ${response.status}).`);
  const text = await response.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(
      `[${code}] ${label} returned unreadable evidence. Recover the outcome before retrying.`,
    );
  }
}
