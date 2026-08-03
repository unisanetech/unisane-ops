import { useState } from 'react';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
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
  const [confidence, setConfidence] = useState('all');
  const review = state.seo.opportunityReview;
  const presentation = review.workflow.presentation;
  const visible = review.opportunities.filter(
    (item) =>
      (confidence === 'all' || item.confidence === confidence) &&
      `${item.title} ${item.rationale} ${item.primaryKeyword ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <Summary headline={presentation.headline} detail={presentation.whyItMatters} />
      <ContentSection>
        <FilterToolbar
          resultCount={visible.length}
          totalCount={review.returnedOpportunityCount}
          resultLabel="opportunities"
          isFiltered={Boolean(search.trim()) || confidence !== 'all'}
          onClear={() => {
            setSearch('');
            setConfidence('all');
          }}
        >
          <TextField
            label="Search opportunities"
            placeholder="Search outcome or evidence"
            value={search}
            onValueChange={setSearch}
          />
          <SelectField
            label="Confidence"
            value={confidence}
            onValueChange={setConfidence}
            options={[
              { value: 'all', label: 'All types' },
              { value: 'high', label: 'High confidence' },
              { value: 'medium', label: 'Medium confidence' },
              { value: 'low', label: 'Low confidence' },
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
                badge={`#${item.rank} · ${item.confidence} confidence`}
                tone={
                  item.confidence === 'high'
                    ? 'success'
                    : item.confidence === 'low'
                      ? 'warning'
                      : 'info'
                }
                title={item.title}
                description={item.rationale}
                evidence={item.limitations[0] ?? `${item.provenance.length} recorded sources`}
                metadata={`${item.score}/100 · ${item.market ?? 'Market not recorded'}`}
              />
            ))}
          </ConsoleCardGrid>
        ) : (
          <DataState
            title="No opportunity matches these filters."
            description={
              review.status === 'blocked'
                ? presentation.nextStep.reason
                : 'Clear the search or confidence filter to review the complete ranked list.'
            }
            actionLabel={presentation.nextStep.label}
            onAction={() => navigate(presentation.nextStep.deepLink ?? '/seo/research')}
          />
        )}
      </ContentSection>
    </>
  );
}
