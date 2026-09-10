import { z } from 'zod';
import type { GtmTrackingSetupInput } from './input.js';
import { hashOpsValue } from '@unisane/ops-engine';
import { defineOpsReadAction } from '@unisane/ops-engine/actions';
import type {
  GoogleTagManagerContainerManifest,
  GoogleTagManagerTag,
  GoogleTagManagerVariable,
} from '../contracts.js';
import {
  allPagesTrigger,
  dataLayerEventTrigger,
  consentInitializationTrigger,
  consentDefaultTag,
  googleTag,
  googleAnalytics4EventTag,
  googleAdsConversionTag,
  googleAdsConversionLinkerTag,
  metaPixelEventTag,
} from '../recipes.js';
import { googleTagManagerDiagnosisAction } from '../diagnosis.js';
import { gtmTrackingSetupInputSchema, gtmTrackingSetupResultSchema } from './contracts.js';
export const gtmTrackingSetupAction = defineOpsReadAction({
  id: 'growth.gtm.setup.generate',
  schemaVersion: 1,
  maximumEffect: 'offline',
  inputSchema: z.custom<GtmTrackingSetupInput>(
    (value) => gtmTrackingSetupInputSchema.safeParse(value).success,
  ),
  outputSchema: gtmTrackingSetupResultSchema,
  execute: async (raw, context) => {
    const input = gtmTrackingSetupInputSchema.parse(raw);
    if (input.projectId !== context.projectId || input.environment !== context.environmentId)
      throw new Error(
        '[GTM_SETUP_TARGET_MISMATCH] Setup must use the selected project/environment.',
      );
    const triggers = [allPagesTrigger(), consentInitializationTrigger()];
    const variables: GoogleTagManagerVariable[] = [];
    const tags: GoogleTagManagerTag[] = [consentDefaultTag({ defaults: input.consentDefaults })];
    if (input.ga4MeasurementId)
      tags.push(
        googleTag({
          slug: 'ga4_configuration',
          tagId: input.ga4MeasurementId,
          triggerSlugs: ['all_pages'],
          sendPageView: false,
        }),
      );
    if (input.events.some((event) => event.googleAds))
      tags.push(
        googleAdsConversionLinkerTag({
          slug: 'ads_conversion_linker',
          triggerSlugs: ['all_pages'],
        }),
      );
    for (const event of input.events) {
      const trigger = `event_${event.slug}`;
      triggers.push(dataLayerEventTrigger({ slug: trigger, eventName: event.sourceEvent }));
      const reference = (key: string, path: string) => {
        const slug = `${event.slug}_${key}`;
        variables.push({ slug, type: 'data_layer', parameters: [{ key: 'name', value: path }] });
        return { variable: slug };
      };
      const eventId = reference('event_id', event.eventIdPath);
      const value = event.valuePath ? reference('value', event.valuePath) : undefined;
      const currency = event.currencyPath ? reference('currency', event.currencyPath) : undefined;
      const transactionId = event.transactionIdPath
        ? reference('transaction_id', event.transactionIdPath)
        : undefined;
      const parameters = [
        { key: 'event_id', value: eventId },
        ...(value ? [{ key: 'value', value }] : []),
        ...(currency ? [{ key: 'currency', value: currency }] : []),
        ...(transactionId ? [{ key: 'transaction_id', value: transactionId }] : []),
      ];
      if (event.ga4EventName)
        tags.push(
          googleAnalytics4EventTag({
            slug: `ga4_${event.slug}`,
            eventName: event.ga4EventName,
            measurementId: input.ga4MeasurementId!,
            triggerSlugs: [trigger],
            parameters,
          }),
        );
      if (event.metaEventName)
        tags.push(
          metaPixelEventTag({
            slug: `meta_${event.slug}`,
            pixelId: input.metaPixelId!,
            eventName: event.metaEventName,
            eventId,
            value,
            currency,
            triggerSlugs: [trigger],
          }),
        );
      if (event.googleAds) {
        const labelSlug = `${event.slug}_ads_label`;
        variables.push({
          slug: labelSlug,
          type: 'constant',
          parameters: [{ key: 'value', value: event.googleAds.conversionLabel }],
        });
        const tag = googleAdsConversionTag({
          slug: `ads_${event.slug}`,
          conversionId: event.googleAds.conversionId,
          conversionLabel: { variable: labelSlug },
          triggerSlugs: [trigger],
          value,
          currency,
          dedupeStrategy: { eventIdVariableSlug: eventId.variable, serverConversion: false },
        });
        tags.push({
          ...tag,
          parameters: [...(tag.parameters ?? []), { key: 'orderId', value: transactionId! }],
        });
      }
    }
    const manifest: GoogleTagManagerContainerManifest = {
      appId: input.appId,
      accountId: input.accountId,
      containerId: input.containerId,
      namespace: input.namespace,
      environments: {
        [input.environment]: {
          workspacePrefix: input.workspacePrefix,
          publishPolicy: 'manual-approval',
        },
      },
      consent: { mode: 'basic', defaults: input.consentDefaults },
      variables,
      triggers,
      tags,
    };
    const diagnosis = await googleTagManagerDiagnosisAction.execute(
      { projectId: input.projectId, environment: input.environment, manifest },
      context,
    );
    return gtmTrackingSetupResultSchema.parse({
      actionId: 'growth.gtm.setup.generate',
      projectId: input.projectId,
      environment: input.environment,
      revision: hashOpsValue(manifest),
      manifest,
      diagnosis,
      requiredObservations: input.events.map((event) => ({
        event: event.sourceEvent,
        eventIdPath: event.eventIdPath,
        valuePath: event.valuePath,
        currencyPath: event.currencyPath,
        transactionIdPath: event.transactionIdPath,
      })),
      trackingVerified: false,
      nextSteps: [
        'Review and merge this proposal into the canonical manifest; existing resources were not inspected or replaced.',
        'The adopter must emit each declared data-layer event with valid values, currency and stable identifiers.',
        'Integrate CMP consent updates before conversion events; the generated defaults alone do not implement a consent journey.',
        'Share each event ID with the corresponding server delivery; a transaction ID does not equate orders with provider-attributed conversions.',
        'Read the selected workspace, review and approve its exact changes, compile preview, then separately review publication.',
        'Verify real browser/server delivery and destination acceptance after publication.',
      ],
    });
  },
});
