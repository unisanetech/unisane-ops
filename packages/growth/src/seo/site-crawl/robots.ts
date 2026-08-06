export type RobotsRule = {
  directive: 'allow' | 'disallow';
  path: string;
};

export type RobotsGroup = {
  userAgents: string[];
  rules: RobotsRule[];
};

export type RobotsPolicy = {
  groups: RobotsGroup[];
  sitemapUrls: string[];
};

export function parseRobotsText(text: string): RobotsPolicy {
  const groups: RobotsGroup[] = [];
  const sitemapUrls: string[] = [];
  let current: RobotsGroup | undefined;
  let hasRules = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const separator = line.indexOf(':');
    if (separator < 0) {
      continue;
    }
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === 'sitemap' && value) {
      sitemapUrls.push(value);
      continue;
    }
    if (field === 'user-agent') {
      if (!current || hasRules) {
        current = { userAgents: [], rules: [] };
        groups.push(current);
        hasRules = false;
      }
      if (value) {
        current.userAgents.push(value.toLowerCase());
      }
      continue;
    }
    if ((field === 'allow' || field === 'disallow') && current) {
      hasRules = true;
      if (value || field === 'allow') {
        current.rules.push({ directive: field, path: value });
      }
    }
  }

  return {
    groups: groups.filter((group) => group.userAgents.length > 0),
    sitemapUrls: [...new Set(sitemapUrls)].sort(),
  };
}

export function isRobotsAllowed(policy: RobotsPolicy, url: URL, userAgent: string): boolean {
  const normalizedAgent = userAgent.toLowerCase();
  const exactGroups = policy.groups.filter((group) =>
    group.userAgents.some((agent) => agent !== '*' && normalizedAgent.includes(agent)),
  );
  const groups = exactGroups.length
    ? exactGroups
    : policy.groups.filter((group) => group.userAgents.includes('*'));
  const target = `${url.pathname}${url.search}`;
  const matches = groups
    .flatMap((group) => group.rules)
    .filter((rule) => rule.path && matchesRobotsPath(target, rule.path))
    .sort((left, right) => {
      const specificity = robotsSpecificity(right.path) - robotsSpecificity(left.path);
      return specificity || (left.directive === 'allow' ? -1 : 1);
    });
  return matches[0]?.directive !== 'disallow';
}

function matchesRobotsPath(target: string, pattern: string): boolean {
  const endAnchored = pattern.endsWith('$');
  const source = pattern.replace(/\$$/, '').split('*').map(escapeRegExp).join('.*');
  return new RegExp(`^${source}${endAnchored ? '$' : ''}`).test(target);
}

function robotsSpecificity(pattern: string): number {
  return pattern.replace(/[*$]/g, '').length;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
