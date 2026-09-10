import type {
  GoogleTagManagerContainerManifest,
  GoogleTagManagerIssue,
  GoogleTagManagerValidationResult,
} from './contracts';

function addIssue(
  issues: GoogleTagManagerIssue[],
  code: string,
  message: string,
  path?: string,
): void {
  issues.push({ severity: 'error', code, message, path });
}

function requireNonEmpty(
  issues: GoogleTagManagerIssue[],
  value: string | undefined,
  code: string,
  message: string,
  path: string,
): void {
  if (!value || value.trim().length === 0) {
    addIssue(issues, code, message, path);
  }
}

function checkUniqueSlugs(
  issues: GoogleTagManagerIssue[],
  family: string,
  resources: readonly { slug: string }[],
): void {
  const seen = new Set<string>();
  for (const resource of resources) {
    if (seen.has(resource.slug)) {
      addIssue(
        issues,
        'duplicate_slug',
        `Duplicate ${family} slug "${resource.slug}".`,
        `${family}.${resource.slug}`,
      );
    }
    seen.add(resource.slug);
  }
}

function collectVariableRefs(value: unknown, refs: string[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectVariableRefs(item, refs);
    return;
  }
  if ('variable' in value && typeof value.variable === 'string') {
    refs.push(value.variable);
  }
  for (const child of Object.values(value)) {
    collectVariableRefs(child, refs);
  }
}

function checkParameterVariableRefs(args: {
  issues: GoogleTagManagerIssue[];
  family: string;
  slug: string;
  parameters: readonly { key: string; value: unknown }[] | undefined;
  variableSlugs: Set<string>;
}): void {
  for (const parameter of args.parameters ?? []) {
    const refs: string[] = [];
    collectVariableRefs(parameter.value, refs);
    for (const variableRef of refs) {
      if (args.variableSlugs.has(variableRef)) continue;
      addIssue(
        args.issues,
        'unknown_parameter_variable',
        `${args.family} "${args.slug}" references unknown variable "${variableRef}" in parameter "${parameter.key}".`,
        `${args.family}.${args.slug}.parameters.${parameter.key}`,
      );
    }
  }
}

export function validateGoogleTagManagerManifest(
  manifest: GoogleTagManagerContainerManifest,
): GoogleTagManagerValidationResult {
  const issues: GoogleTagManagerIssue[] = [];
  requireNonEmpty(
    issues,
    manifest.appId,
    'missing_app_id',
    'GTM manifest requires appId.',
    'appId',
  );
  requireNonEmpty(
    issues,
    manifest.accountId,
    'missing_account_id',
    'GTM manifest requires accountId.',
    'accountId',
  );
  requireNonEmpty(
    issues,
    manifest.containerId,
    'missing_container_id',
    'GTM manifest requires containerId.',
    'containerId',
  );
  requireNonEmpty(
    issues,
    manifest.namespace,
    'missing_namespace',
    'GTM manifest requires namespace.',
    'namespace',
  );

  if (!Object.keys(manifest.environments).length) {
    addIssue(
      issues,
      'missing_environment',
      'GTM manifest requires at least one environment.',
      'environments',
    );
  }

  for (const [environment, config] of Object.entries(manifest.environments)) {
    requireNonEmpty(
      issues,
      config.workspacePrefix,
      'missing_workspace_prefix',
      `GTM environment "${environment}" requires workspacePrefix.`,
      `environments.${environment}.workspacePrefix`,
    );
  }

  checkUniqueSlugs(issues, 'folders', manifest.folders ?? []);
  checkUniqueSlugs(issues, 'variables', manifest.variables ?? []);
  checkUniqueSlugs(issues, 'builtInTriggers', manifest.builtInTriggers ?? []);
  checkUniqueSlugs(issues, 'triggers', manifest.triggers ?? []);
  checkUniqueSlugs(issues, 'tags', manifest.tags ?? []);

  const folderSlugs = new Set((manifest.folders ?? []).map((folder) => folder.slug));
  const triggerSlugs = new Set([
    ...(manifest.triggers ?? []).map((trigger) => trigger.slug),
    ...(manifest.builtInTriggers ?? []).map((trigger) => trigger.slug),
  ]);
  const variableSlugs = new Set([
    ...(manifest.variables ?? []).map((variable) => variable.slug),
    ...(manifest.builtInVariables ?? []),
  ]);

  for (const variable of manifest.variables ?? []) {
    if (variable.folderSlug && !folderSlugs.has(variable.folderSlug)) {
      addIssue(
        issues,
        'unknown_folder',
        `Variable "${variable.slug}" references unknown folder "${variable.folderSlug}".`,
        `variables.${variable.slug}.folderSlug`,
      );
    }
    checkParameterVariableRefs({
      issues,
      family: 'variables',
      slug: variable.slug,
      parameters: variable.parameters,
      variableSlugs,
    });
  }

  for (const trigger of manifest.triggers ?? []) {
    if (trigger.folderSlug && !folderSlugs.has(trigger.folderSlug)) {
      addIssue(
        issues,
        'unknown_folder',
        `Trigger "${trigger.slug}" references unknown folder "${trigger.folderSlug}".`,
        `triggers.${trigger.slug}.folderSlug`,
      );
    }
    if (trigger.type === 'data_layer_event') {
      requireNonEmpty(
        issues,
        trigger.eventName,
        'missing_data_layer_event_name',
        `Data-layer trigger "${trigger.slug}" requires eventName.`,
        `triggers.${trigger.slug}.eventName`,
      );
    }
    checkParameterVariableRefs({
      issues,
      family: 'triggers',
      slug: trigger.slug,
      parameters: trigger.filters,
      variableSlugs,
    });
  }

  for (const tag of manifest.tags ?? []) {
    if (tag.folderSlug && !folderSlugs.has(tag.folderSlug)) {
      addIssue(
        issues,
        'unknown_folder',
        `Tag "${tag.slug}" references unknown folder "${tag.folderSlug}".`,
        `tags.${tag.slug}.folderSlug`,
      );
    }
    if (!tag.triggerSlugs.length) {
      addIssue(
        issues,
        'missing_tag_trigger',
        `Tag "${tag.slug}" requires at least one trigger.`,
        `tags.${tag.slug}.triggerSlugs`,
      );
    }
    if (tag.type === 'custom_template') {
      if (!tag.template) {
        addIssue(
          issues,
          'missing_custom_template_reference',
          `Custom-template tag "${tag.slug}" requires a pinned template reference.`,
          `tags.${tag.slug}.template`,
        );
      }
      if (tag.parameters?.length) {
        addIssue(
          issues,
          'custom_template_parameters_must_be_raw',
          `Custom-template tag "${tag.slug}" must use rawParameters for lossless nested values.`,
          `tags.${tag.slug}.parameters`,
        );
      }
    } else if (tag.rawParameters?.length || tag.template) {
      addIssue(
        issues,
        'raw_parameters_require_custom_template',
        `Tag "${tag.slug}" may use template and rawParameters only with type custom_template.`,
        `tags.${tag.slug}.rawParameters`,
      );
    }
    for (const triggerSlug of tag.triggerSlugs) {
      if (!triggerSlugs.has(triggerSlug)) {
        addIssue(
          issues,
          'unknown_trigger',
          `Tag "${tag.slug}" references unknown trigger "${triggerSlug}".`,
          `tags.${tag.slug}.triggerSlugs`,
        );
      }
    }
    if (
      tag.dedupeStrategy?.eventIdVariableSlug &&
      !variableSlugs.has(tag.dedupeStrategy.eventIdVariableSlug)
    ) {
      addIssue(
        issues,
        'unknown_dedupe_variable',
        `Tag "${tag.slug}" references unknown dedupe variable "${tag.dedupeStrategy.eventIdVariableSlug}".`,
        `tags.${tag.slug}.dedupeStrategy.eventIdVariableSlug`,
      );
    }
    checkParameterVariableRefs({
      issues,
      family: 'tags',
      slug: tag.slug,
      parameters: tag.parameters,
      variableSlugs,
    });
  }

  return { ok: issues.length === 0, issues };
}

export function assertValidGoogleTagManagerManifest(
  manifest: GoogleTagManagerContainerManifest,
): void {
  const result = validateGoogleTagManagerManifest(manifest);
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => issue.message).join('\n'));
  }
}
