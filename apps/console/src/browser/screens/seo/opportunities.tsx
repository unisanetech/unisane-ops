import { useState } from 'react';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { Card } from '@unisane/ui/card';
import { CardGrid } from '@unisane/ui/card-grid';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { humanize } from '../../lib/format.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { FilterBar } from '../../shared/controls.js';

export function SeoOpportunitiesScreen({ state, openOverlay, navigate }: ConsoleScreenProps) {
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState('all');
  const visible = state.seo.opportunities.filter(
    (item) =>
      (kind === 'all' || item.kind === kind) &&
      `${item.title} ${item.reason}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <Summary
        headline={
          state.seo.opportunities.length
            ? `${state.seo.opportunities.length} search improvements are supported by available evidence.`
            : 'No search improvement is supported by available evidence yet.'
        }
        detail="Start with the first priority. Every item comes from recorded page, query, or technical health evidence."
      />
      <ContentSection>
        <FilterBar>
          <TextField
            label="Search opportunities"
            placeholder="Search outcome or evidence"
            value={search}
            onValueChange={setSearch}
          />
          <SelectField
            label="Type"
            value={kind}
            onValueChange={setKind}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'high-impact', label: 'High impact' },
              { value: 'quick-win', label: 'Quick wins' },
              { value: 'problem', label: 'Problems' },
            ]}
          />
        </FilterBar>
      </ContentSection>
      <ContentSection>
        {visible.length ? (
          <CardGrid minItemWidth="md">
            {visible.map((item) => (
              <Card variant="low" padding="md" key={item.id}>
                <Badge
                  variant="tonal"
                  color={item.kind === 'problem' ? 'error' : 'primary'}
                  size="sm"
                >
                  {humanize(item.kind)}
                </Badge>
                <Typography variant="cardTitle" className="mt-3">
                  {item.title}
                </Typography>
                <Typography variant="bodySmall" className="mt-2">
                  <strong>Expected outcome:</strong> {item.expectedOutcome}
                </Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
                  {item.reason}
                </Typography>
                <Typography variant="labelSmall" className="text-on-surface-variant mt-3">
                  {item.confidenceLabel} · {item.effortLabel}
                </Typography>
                <Button
                  className="mt-5"
                  variant="tonal"
                  size="sm"
                  onClick={() =>
                    openOverlay({ kind: 'seo', detail: { kind: 'opportunity', id: item.id } })
                  }
                >
                  Open details
                </Button>
              </Card>
            ))}
          </CardGrid>
        ) : (
          <EmptyState
            title="No opportunity matches these filters."
            description="Clear the search or type filter to review the complete evidence-backed list."
            actionLabel="Review all SEO"
            onAction={() => navigate('/seo/overview')}
          />
        )}
      </ContentSection>
    </>
  );
}
