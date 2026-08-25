import path from 'node:path';

export const ROOT = path.resolve(process.cwd());

function fromRoot(...segments) {
  return path.join(ROOT, ...segments);
}

export function toRepoPath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

export const DOCS_ROOT = fromRoot('docs');
export const ARCHITECTURE_DOCS_DIR = path.join(DOCS_ROOT, 'architecture');
export const ARCHITECTURE_EXECUTION_DIR = path.join(ARCHITECTURE_DOCS_DIR, 'execution');
export const ARCHITECTURE_SSOT_PATH = path.join(ARCHITECTURE_DOCS_DIR, '00-architecture.md');

export const CORE_DOCS_DIR = DOCS_ROOT;
export const CORE_SSOT_DIR = path.join(DOCS_ROOT, 'standards');
export const CORE_HOWTO_DIR = path.join(DOCS_ROOT, 'guides');
export const CORE_REFERENCE_DIR = path.join(DOCS_ROOT, 'reference');
export const GENERATED_REFERENCE_DIR = path.join(CORE_REFERENCE_DIR, 'generated');

export const CORE_START_HERE_PATH = path.join(DOCS_ROOT, '00-start-here.md');
export const SSOT_OWNERSHIP_MAP_PATH = path.join(CORE_SSOT_DIR, '01-ssot-ownership-map.md');
export const COMMAND_WORKFLOW_CONTRACT_PATH = path.join(
  CORE_HOWTO_DIR,
  'command-workflow-contract.md',
);
export const ADD_ADAPTER_GUIDE_PATH = path.join(CORE_HOWTO_DIR, 'add-adapter.md');

export const GENERATED_ARCHITECTURE_DIR = path.join(GENERATED_REFERENCE_DIR, 'architecture');
export const GENERATED_OPERATIONS_DIR = path.join(GENERATED_REFERENCE_DIR, 'operations');
export const GENERATED_MODULES_DIR = path.join(GENERATED_REFERENCE_DIR, 'modules');
export const GENERATED_ADAPTERS_DIR = path.join(GENERATED_REFERENCE_DIR, 'adapters');
export const GENERATED_EXTENSIONS_DIR = path.join(GENERATED_REFERENCE_DIR, 'extensions');
export const GENERATED_COMPATIBILITY_DIR = path.join(GENERATED_REFERENCE_DIR, 'compatibility');
export const GENERATED_ERRORS_DIR = path.join(GENERATED_REFERENCE_DIR, 'errors');
export const GENERATED_QUALITY_DIR = path.join(GENERATED_REFERENCE_DIR, 'quality');
export const GENERATED_LLM_DIR = path.join(GENERATED_REFERENCE_DIR, 'llm');
export const GENERATED_SYMBOLS_DIR = path.join(GENERATED_REFERENCE_DIR, 'symbols');
export const GENERATED_PACKAGE_METADATA_DIR = path.join(
  GENERATED_REFERENCE_DIR,
  'package-metadata',
);

export const ARCHITECTURE_INDEX_JSON_PATH = path.join(
  GENERATED_ARCHITECTURE_DIR,
  'architecture-index.json',
);
export const ARCHITECTURE_INDEX_MD_PATH = path.join(
  GENERATED_ARCHITECTURE_DIR,
  'architecture-index.md',
);
export const IMPACT_MAP_JSON_PATH = path.join(GENERATED_ARCHITECTURE_DIR, 'impact-map.json');
export const IMPACT_MAP_MD_PATH = path.join(GENERATED_ARCHITECTURE_DIR, 'impact-map.md');
export const LLM_CONTEXT_INDEX_JSON_PATH = path.join(
  GENERATED_ARCHITECTURE_DIR,
  'llm-context-index.json',
);
export const LLM_CONTEXT_INDEX_MD_PATH = path.join(
  GENERATED_ARCHITECTURE_DIR,
  'llm-context-index.md',
);
export const ID_PREFIX_INDEX_JSON_PATH = path.join(
  GENERATED_ARCHITECTURE_DIR,
  'id-prefix-index.json',
);
export const ID_PREFIX_INDEX_MD_PATH = path.join(GENERATED_ARCHITECTURE_DIR, 'id-prefix-index.md');

export const OPERATION_OWNERSHIP_INDEX_JSON_PATH = path.join(
  GENERATED_OPERATIONS_DIR,
  'operation-ownership-index.json',
);
export const OPERATION_OWNERSHIP_INDEX_MD_PATH = path.join(
  GENERATED_OPERATIONS_DIR,
  'operation-ownership-index.md',
);

export const MODULES_INDEX_JSON_PATH = path.join(GENERATED_MODULES_DIR, 'modules-index.json');
export const MODULES_INDEX_MD_PATH = path.join(GENERATED_MODULES_DIR, 'modules-index.md');

export const ADAPTER_TOKEN_REGISTRATION_INDEX_JSON_PATH = path.join(
  GENERATED_ADAPTERS_DIR,
  'adapter-token-registration-index.json',
);
export const ADAPTER_TOKEN_REGISTRATION_INDEX_MD_PATH = path.join(
  GENERATED_ADAPTERS_DIR,
  'adapter-token-registration-index.md',
);

export const EXTENSIONS_INDEX_JSON_PATH = path.join(
  GENERATED_EXTENSIONS_DIR,
  'extensions-index.json',
);
export const EXTENSIONS_INDEX_MD_PATH = path.join(GENERATED_EXTENSIONS_DIR, 'extensions-index.md');

export const COMPATIBILITY_MATRIX_JSON_PATH = path.join(
  GENERATED_COMPATIBILITY_DIR,
  'compatibility-matrix.json',
);
export const COMPATIBILITY_MATRIX_MD_PATH = path.join(
  GENERATED_COMPATIBILITY_DIR,
  'compatibility-matrix.md',
);

export const ERROR_CATALOG_JSON_PATH = path.join(GENERATED_ERRORS_DIR, 'error-catalog.json');
export const ERROR_CATALOG_MD_PATH = path.join(GENERATED_ERRORS_DIR, 'error-catalog.md');

export const LLM_BOOTSTRAP_JSON_PATH = path.join(GENERATED_LLM_DIR, 'bootstrap.json');
export const LLM_BOOTSTRAP_MD_PATH = path.join(GENERATED_LLM_DIR, 'bootstrap.md');
export const LLM_SCOPES_LITE_JSON_PATH = path.join(GENERATED_LLM_DIR, 'scopes-lite.json');
export const LLM_SCOPES_INDEX_JSON_PATH = path.join(GENERATED_LLM_DIR, 'scopes-index.json');
export const LLM_SCOPES_DIR = path.join(GENERATED_LLM_DIR, 'scopes');
export const LLM_SKOPOS_SCOPE_BINDINGS_JSON_PATH = path.join(
  GENERATED_LLM_DIR,
  'skopos-scope-bindings.json',
);
export const LLM_OPERATIONS_LITE_JSON_PATH = path.join(GENERATED_LLM_DIR, 'operations-lite.json');
export const LLM_TOKENS_LITE_JSON_PATH = path.join(GENERATED_LLM_DIR, 'tokens-lite.json');
export const LLM_CHECKS_LITE_JSON_PATH = path.join(GENERATED_LLM_DIR, 'checks-lite.json');

export const SKOPOS_SCOPES_SOURCE_PATH = fromRoot('tools', 'skopos', 'scopes.yaml');

export const SYMBOLS_INDEX_JSON_PATH = path.join(GENERATED_SYMBOLS_DIR, 'symbols-index.json');
export const SYMBOLS_INDEX_MD_PATH = path.join(GENERATED_SYMBOLS_DIR, 'symbols-index.md');
export const SYMBOLS_PACKAGES_DIR = path.join(GENERATED_SYMBOLS_DIR, 'packages');

export const PACKAGE_METADATA_INDEX_JSON_PATH = path.join(
  GENERATED_PACKAGE_METADATA_DIR,
  'package-metadata-index.json',
);
export const PACKAGE_METADATA_INDEX_MD_PATH = path.join(
  GENERATED_PACKAGE_METADATA_DIR,
  'package-metadata-index.md',
);
export const PACKAGE_SUPPORT_MATURITY_MATRIX_JSON_PATH = path.join(
  GENERATED_PACKAGE_METADATA_DIR,
  'package-support-maturity-matrix.json',
);
export const PACKAGE_SUPPORT_MATURITY_MATRIX_MD_PATH = path.join(
  GENERATED_PACKAGE_METADATA_DIR,
  'package-support-maturity-matrix.md',
);
export const PACKAGE_PRO_OVERLAY_COMPOSITION_MATRIX_JSON_PATH = path.join(
  GENERATED_PACKAGE_METADATA_DIR,
  'pro-overlay-composition-matrix.json',
);
export const PACKAGE_PRO_OVERLAY_COMPOSITION_MATRIX_MD_PATH = path.join(
  GENERATED_PACKAGE_METADATA_DIR,
  'pro-overlay-composition-matrix.md',
);

export const MODULE_COMPLEXITY_BUDGET_BASELINE_JSON_PATH = path.join(
  GENERATED_QUALITY_DIR,
  'module-complexity-budget-baseline.json',
);
export const STATIC_CONTRACT_COVERAGE_BASELINE_JSON_PATH = path.join(
  GENERATED_QUALITY_DIR,
  'static-contract-coverage-baseline.json',
);

export const CONFIG_PLATFORM_SOURCE = fromRoot(
  'unisane',
  'packages',
  'foundation',
  'config',
  'src',
  'platform.ts',
);

export const LEGACY_ARCHITECTURE_ALIAS_REPO_PATHS = [
  toRepoPath(path.join(ARCHITECTURE_DOCS_DIR, 'how-to-add-endpoint.md')),
  toRepoPath(path.join(ARCHITECTURE_DOCS_DIR, 'how-to-add-adapter.md')),
  toRepoPath(path.join(ARCHITECTURE_DOCS_DIR, 'how-to-add-admin-surface.md')),
  toRepoPath(path.join(ARCHITECTURE_DOCS_DIR, 'how-to-run-migrations.md')),
  toRepoPath(path.join(ARCHITECTURE_DOCS_DIR, 'how-to-run-commands-golden-patterns.md')),
];
