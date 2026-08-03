export function deriveEvidenceRevision(parts: readonly (string | number | boolean | undefined)[]) {
  let hash = 2_166_136_261;
  for (const character of parts.map((part) => String(part ?? '')).join('\u001f')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) + 1;
}
