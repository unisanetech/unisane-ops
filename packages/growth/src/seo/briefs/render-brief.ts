import type { PageOpportunity } from '../schema/opportunity.js';

export function renderContentBrief(opportunity: PageOpportunity): string {
  const lines = [
    `# ${opportunity.title}`,
    '',
    `Route: \`${opportunity.routePath}\``,
    `Primary keyword: \`${opportunity.primaryKeyword}\``,
    `Status: \`${opportunity.status}\``,
    `Priority: \`${opportunity.priority}\``,
    `Intent: \`${opportunity.intent}\``,
    '',
    '## Page Goal',
    '',
    opportunity.metaDescription,
    '',
    '## Search Target',
    '',
    `- H1: ${opportunity.h1}`,
    `- Primary keyword: ${opportunity.primaryKeyword}`,
    ...renderSupportingKeywords(opportunity),
    '',
    '## Required Sections',
    '',
    ...renderSections(opportunity),
    '',
    '## Internal Links',
    '',
    ...renderInternalLinks(opportunity),
    '',
    '## CTA',
    '',
    `- Label: ${opportunity.cta.label}`,
    `- Target: \`${opportunity.cta.target}\``,
    '',
    '## Writing Rules',
    '',
    '- Keep the copy simple, direct, and useful.',
    '- Match the user intent before adding product messaging.',
    '- Use concrete examples and avoid vague career advice.',
    '- Do not invent claims, salaries, success rates, or provider data.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function renderSupportingKeywords(opportunity: PageOpportunity): string[] {
  if (opportunity.supportingKeywords.length === 0) {
    return ['- Supporting keywords: none yet'];
  }

  return [
    '- Supporting keywords:',
    ...opportunity.supportingKeywords.map((keyword) => `  - ${keyword}`),
  ];
}

function renderSections(opportunity: PageOpportunity): string[] {
  return opportunity.sections.flatMap((section, index) => [
    `${index + 1}. ${section.heading}`,
    `   Purpose: ${section.purpose}`,
    `   Required: ${section.required ? 'yes' : 'no'}`,
  ]);
}

function renderInternalLinks(opportunity: PageOpportunity): string[] {
  if (opportunity.internalLinks.length === 0) {
    return ['- No internal links planned yet.'];
  }

  return opportunity.internalLinks.map((link) => `- ${link.label}: \`${link.path}\``);
}
