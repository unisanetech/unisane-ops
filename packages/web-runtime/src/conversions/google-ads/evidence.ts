import { describeConversionRequest } from '../delivery/evidence';
import type { GoogleAdsClickConversion } from './types';

export function describeGoogleAdsConversion(conversion: GoogleAdsClickConversion) {
  return describeConversionRequest({
    customer: {
      email: conversion.userIdentifiers?.find((item) => item.hashedEmail)?.hashedEmail,
      phone: conversion.userIdentifiers?.find((item) => item.hashedPhoneNumber)?.hashedPhoneNumber,
    },
    transport: {},
    parameters: { ...conversion },
    value: conversion.conversionValue,
    currency: conversion.currencyCode,
  });
}
