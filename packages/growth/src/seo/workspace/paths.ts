import path from 'node:path';

export type SeoResearchWorkspacePaths = {
  root: string;
  config: string;
  gitignore: string;
  seeds: string;
  raw: string;
  normalized: string;
  clusters: string;
  competitors: string;
  faqs: string;
  serp: string;
  metadata: string;
  pageAudits: string;
  opportunities: string;
  briefs: string;
  internalLinks: string;
  ads: string;
  reports: string;
  manualSeeds: string;
};

export function resolveSeoResearchWorkspacePaths(
  cwd: string,
  researchRoot = 'docs/domains/seo/keyword-research',
): SeoResearchWorkspacePaths {
  const root = path.resolve(cwd, researchRoot);
  return {
    root,
    config: path.join(root, 'seo-research.config.json'),
    gitignore: path.join(root, '.gitignore'),
    seeds: path.join(root, 'seeds'),
    raw: path.join(root, 'raw'),
    normalized: path.join(root, 'normalized'),
    clusters: path.join(root, 'clusters'),
    competitors: path.join(root, 'competitors'),
    faqs: path.join(root, 'faqs'),
    serp: path.join(root, 'serp'),
    metadata: path.join(root, 'metadata'),
    pageAudits: path.join(root, 'page-audits'),
    opportunities: path.join(root, 'opportunities'),
    briefs: path.join(root, 'briefs'),
    internalLinks: path.join(root, 'internal-links'),
    ads: path.join(root, 'ads'),
    reports: path.join(root, 'reports'),
    manualSeeds: path.join(root, 'seeds', 'manual.seed.json'),
  };
}
