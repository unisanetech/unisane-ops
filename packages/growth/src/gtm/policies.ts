import type {
  GoogleTagManagerContainerManifest,
  GoogleTagManagerEnvironmentConfig,
  GoogleTagManagerIssue,
  GoogleTagManagerTag,
  GoogleTagManagerTrigger,
  GoogleTagManagerValidationResult,
} from './contracts';

function issue(
  severity: GoogleTagManagerIssue['severity'],
  code: string,
  message: string,
  path?: string,
): GoogleTagManagerIssue {
  return { severity, code, message, path };
}

function isSecretRef(value: unknown): boolean {
  return Boolean(value && typeof value === 'object' && 'secretRef' in value);
}

function isPausedPlaceholder(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('UNCONFIGURED');
}

function tagParameter(tag: GoogleTagManagerTag, key: string): unknown {
  return tag.parameters?.find((parameter) => parameter.key === key)?.value;
}

function triggerBySlug(
  manifest: GoogleTagManagerContainerManifest,
): Map<string, GoogleTagManagerTrigger> {
  return new Map((manifest.triggers ?? []).map((trigger) => [trigger.slug, trigger]));
}

function hasAllPagesTrigger(
  tag: GoogleTagManagerTag,
  triggers: Map<string, GoogleTagManagerTrigger>,
): boolean {
  return tag.triggerSlugs.some((triggerSlug) => triggers.get(triggerSlug)?.type === 'all_pages');
}

function environmentConfig(
  manifest: GoogleTagManagerContainerManifest,
  environment?: string,
): GoogleTagManagerEnvironmentConfig | undefined {
  if (!environment) return undefined;
  return manifest.environments[environment];
}

export function evaluateGoogleTagManagerPolicies(args: {
  manifest: GoogleTagManagerContainerManifest;
  environment?: string;
}): GoogleTagManagerValidationResult {
  const issues: GoogleTagManagerIssue[] = [];
  const triggers = triggerBySlug(args.manifest);
  const env = environmentConfig(args.manifest, args.environment);
  const allowedVendorDomains = new Set(env?.allowedVendorDomains ?? []);

  for (const tag of args.manifest.tags ?? []) {
    if (tag.type === 'custom_html' && tag.approval?.customHtml !== true) {
      issues.push(
        issue(
          'error',
          'custom_html_requires_approval',
          `Custom HTML tag "${tag.slug}" requires explicit approval metadata.`,
          `tags.${tag.slug}.approval`,
        ),
      );
    }

    if (hasAllPagesTrigger(tag, triggers) && !tag.consent) {
      issues.push(
        issue(
          'error',
          'all_pages_tag_requires_consent',
          `All-pages tag "${tag.slug}" requires consent metadata.`,
          `tags.${tag.slug}.consent`,
        ),
      );
    }

    for (const domain of tag.vendorDomains ?? []) {
      if (allowedVendorDomains.size > 0 && !allowedVendorDomains.has(domain)) {
        issues.push(
          issue(
            'error',
            'vendor_domain_not_allowed',
            `Tag "${tag.slug}" uses vendor domain "${domain}" outside the "${args.environment}" allowlist.`,
            `tags.${tag.slug}.vendorDomains`,
          ),
        );
      }
    }

    if (tag.type === 'google_ads_conversion') {
      const conversionLabel = tagParameter(tag, 'conversionLabel');
      if (
        !isSecretRef(conversionLabel) &&
        !(tag.paused === true && isPausedPlaceholder(conversionLabel))
      ) {
        issues.push(
          issue(
            'error',
            'conversion_label_must_use_secret_ref',
            `Google Ads conversion tag "${tag.slug}" must reference conversionLabel through secretRef.`,
            `tags.${tag.slug}.parameters.conversionLabel`,
          ),
        );
      }

      if (
        tag.dedupeStrategy?.serverConversion === true &&
        !tag.dedupeStrategy.eventIdVariableSlug
      ) {
        issues.push(
          issue(
            'error',
            'server_conversion_dedupe_requires_event_id',
            `Google Ads conversion tag "${tag.slug}" declares server conversion dedupe but no eventIdVariableSlug.`,
            `tags.${tag.slug}.dedupeStrategy`,
          ),
        );
      }
    }
  }

  return {
    ok: issues.every((entry) => entry.severity !== 'error'),
    issues,
  };
}
