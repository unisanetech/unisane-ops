import { createHash } from 'node:crypto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeMetaCapiEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeMetaCapiPhoneNumber(value: string): string {
  return value.replace(/[^\d+]/g, '').trim();
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
