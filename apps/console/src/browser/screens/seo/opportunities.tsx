import { useState } from 'react';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
import { ConsoleCardGrid, ContentSection, DataState, Summary } from '../../shared/content.js';
import { FilterToolbar } from '../../shared/controls.js';
import { SeoOpportunityCard } from './seo-opportunity-card.js';
import { SeoOpportunityReviewPane } from './seo-opportunity-review-pane.js';

export function SeoOpportunitiesScreen({
  state,
  navigate,
  openOverlay,
  openSupportingPane,
  closeSupportingPane,
}: ConsoleScreenProps) {
  const [search, setSearch] = useState('');
  const [confidence, setConfidence] = useState('all');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>();
  const review = state.seo.opportunityReview;
  const presentation = review.workflow.presentation;
  const visible = review.opportunities.filter(
    (item) =>
      (confidence === 'all' || item.confidence === confidence) &&
      `${item.title} ${item.rationale} ${item.primaryKeyword ?? ''}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const closeReview = () => closeSupportingPane();
  const reviewOpportunity = (opportunityId: string) => {
    if (selectedOpportunityId === opportunityId) {
      closeReview();
      return;
    }
    const opportunity = review.opportunities.find((item) => item.id === opportunityId);
    const workflow = state.seo.opportunityWorkflows.find(
      (item) => item.opportunityId === opportunityId,
    );
    if (!opportunity || !workflow) return;
    setSelectedOpportunityId(opportunityId);
    openSupportingPane({
      id: `seo-opportunity-${opportunityId}`,
      title: 'Review opportunity',
      subtitle: `#${opportunity.rank} · ${opportunity.confidence} confidence`,
      onClose: () => setSelectedOpportunityId(undefined),
      content: (
        <SeoOpportunityReviewPane
          opportunity={opportunity}
          evidence={review.evidence}
          workflow={workflow}
          onReviewAction={(action) => openOverlay({ kind: 'command', action })}
          onResearch={() => {
            closeReview();
            navigate('/seo/research');
          }}
          onClose={closeReview}
        />
      ),
    });
  };
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
        <div className="mt-4">
          {visible.length ? (
            <ConsoleCardGrid minItemWidth="lg">
              {visible.map((item) => (
                <SeoOpportunityCard
                  key={item.id}
                  opportunity={item}
                  selected={selectedOpportunityId === item.id}
                  actionLabel={
                    selectedOpportunityId === item.id ? 'Close review' : 'Review opportunity'
                  }
                  onAction={() => reviewOpportunity(item.id)}
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
        </div>
      </ContentSection>
    </>
  );
}
