import { useState } from 'react';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
import { humanize } from '../../lib/format.js';
import {
  ConsoleCardGrid,
  ContentSection,
  DataState,
  InsightCard,
  Summary,
} from '../../shared/content.js';
import { FilterToolbar } from '../../shared/controls.js';

export function SeoOpportunitiesScreen({ state, navigate }: ConsoleScreenProps) {
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
        <FilterToolbar
          resultCount={visible.length}
          totalCount={state.seo.opportunities.length}
          resultLabel="improvements"
          isFiltered={Boolean(search.trim()) || kind !== 'all'}
          onClear={() => {
            setSearch('');
            setKind('all');
          }}
        >
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
        </FilterToolbar>
      </ContentSection>
      <ContentSection>
        {visible.length ? (
          <ConsoleCardGrid minItemWidth="md">
            {visible.map((item) => (
              <InsightCard
                key={item.id}
                badge={humanize(item.kind)}
                tone={
                  item.kind === 'problem' ? 'error' : item.kind === 'quick-win' ? 'success' : 'info'
                }
                title={item.title}
                description={item.expectedOutcome}
                evidence={item.reason}
                metadata={`${item.confidenceLabel} · ${item.effortLabel}`}
              />
            ))}
          </ConsoleCardGrid>
        ) : (
          <DataState
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
