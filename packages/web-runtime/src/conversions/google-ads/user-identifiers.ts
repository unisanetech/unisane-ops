import { createHash } from 'node:crypto';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeGoogleAdsEmail(value: string): string {
  const email = value.trim().toLowerCase().replace(/\s/g, '');
  const [local, domain] = email.split('@');
  return domain === 'gmail.com' || domain === 'googlemail.com'
    ? `${local?.replace(/\./g, '')}@${domain}`
    : email;
}

export function normalizeGoogleAdsPhoneNumber(value: string): string {
  const phone = value.trim().replace(/[\s().-]/g, '');
  if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
    throw new Error('Google Ads phone numbers require an explicit international E.164 number.');
  }
  return phone;
}

export function hashGoogleAdsEmail(value: string): string {
  return sha256(normalizeGoogleAdsEmail(value));
}

export function hashGoogleAdsPhoneNumber(value: string): string {
  return sha256(normalizeGoogleAdsPhoneNumber(value));
}
