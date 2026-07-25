import { createHash } from 'node:crypto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeGoogleAdsEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeGoogleAdsPhoneNumber(value: string): string {
  return value.trim();
}

export function hashGoogleAdsEmail(value: string): string {
  return sha256(normalizeGoogleAdsEmail(value));
}

export function hashGoogleAdsPhoneNumber(value: string): string {
  return sha256(normalizeGoogleAdsPhoneNumber(value));
}
