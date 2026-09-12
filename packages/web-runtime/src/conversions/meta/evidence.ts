import { describeConversionRequest } from '../delivery/evidence';
import type { MetaCapiEvent } from './types';

export function describeMetaConversion(event: MetaCapiEvent) {
  const user = event.user_data;
  return describeConversionRequest({
    customer: {
      email: user.em,
      phone: user.ph,
      firstName: user.fn,
      lastName: user.ln,
      city: user.ct,
      region: user.st,
      postcode: user.zp,
      country: user.country,
      externalId: user.external_id,
    },
    transport: {
      fbp: user.fbp,
      fbc: user.fbc,
      clientIp: user.client_ip_address,
      userAgent: user.client_user_agent,
      sourceUrl: event.event_source_url,
    },
    parameters: {
      event_name: event.event_name,
      event_time: event.event_time,
      event_id: event.event_id,
      action_source: event.action_source,
      ...event.custom_data,
    },
    value: event.custom_data?.value,
    currency: event.custom_data?.currency,
    hasItems: Boolean(event.custom_data?.contents?.length),
  });
}
