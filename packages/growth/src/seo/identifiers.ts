export function normalizeSeoOpportunityId(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/^[.-]+|[.-]+$/g, '') || 'seo'
  );
}

export function seoOpportunityIdsMatch(left: string, right: string): boolean {
  return normalizeSeoOpportunityId(left) === normalizeSeoOpportunityId(right);
}
