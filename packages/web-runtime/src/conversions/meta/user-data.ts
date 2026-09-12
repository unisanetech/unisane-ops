import { createHash } from 'node:crypto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeMetaCapiEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeMetaCapiPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeMetaCapiExternalId(value: string): string {
  return value.trim();
}

export function hashMetaCapiEmail(value: string): string {
  return sha256(normalizeMetaCapiEmail(value));
}

export function hashMetaCapiPhoneNumber(value: string): string {
  return sha256(normalizeMetaCapiPhoneNumber(value));
}

export function hashMetaCapiExternalId(value: string): string {
  return sha256(normalizeMetaCapiExternalId(value));
}

export function hashMetaCapiName(value: string): string {
  return sha256(
    value
      .trim()
      .toLowerCase()
      .replace(/[\p{P}\p{S}\s]/gu, ''),
  );
}
export function hashMetaCapiLocation(value: string): string {
  return sha256(
    value
      .trim()
      .toLowerCase()
      .replace(/[\s\p{P}]/gu, ''),
  );
}
export function hashMetaCapiCountry(value: string): string {
  if (!/^[a-z]{2}$/i.test(value.trim())) throw new Error('Country must be an ISO two-letter code.');
  return sha256(value.trim().toLowerCase());
}
