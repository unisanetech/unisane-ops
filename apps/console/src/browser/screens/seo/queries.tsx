import { useMemo, useState } from 'react';
import type { MarketingConsoleSeoQuery } from '@unisane/growth/console';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { FilterToolbar } from '../../shared/controls.js';
import { SeoQueriesDataTable } from './seo-performance-data-tables.js';
import { SeoSourceNote } from './source-note.js';

type QuerySort = 'clicks' | 'views' | 'position';

export function SeoQueriesScreen({ state, navigate }: ConsoleScreenProps) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<QuerySort>('clicks');
  const queries = useMemo(
    () =>
      state.seo.queries
        .filter((item) => item.query.toLowerCase().includes(search.toLowerCase()))
        .sort((left, right) => querySortValue(right, sort) - querySortValue(left, sort)),
    [search, sort, state.seo.queries],
  );
  return (
    <>
      <Summary
        headline={
          state.seo.queries.length
            ? `${state.seo.queries.length} searches are visible in the available data.`
            : 'No search query evidence is available yet.'
        }
        detail={state.seo.comparisonLabel}
      />
      <ContentSection>
        <FilterToolbar
          resultCount={queries.length}
          totalCount={state.seo.queries.length}
          resultLabel="queries"
          isFiltered={Boolean(search.trim())}
          onClear={() => setSearch('')}
        >
          <TextField
            label="Search queries"
            placeholder="Search query text"
            value={search}
            onValueChange={setSearch}
          />
          <SelectField
            label="Sort by"
            value={sort}
            onValueChange={(value) => setSort(value as QuerySort)}
            options={[
              { value: 'clicks', label: 'Clicks' },
              { value: 'views', label: 'Search views' },
              { value: 'position', label: 'Average position' },
            ]}
          />
        </FilterToolbar>
      </ContentSection>
      <ContentSection>
        {queries.length ? (
          <SeoQueriesDataTable queries={queries} />
        ) : (
          <DataState
            title="No query matches this search."
            description="Clear the search or review the active Search Console connection."
            actionLabel="Review connection"
            onAction={() => navigate('/connections')}
          />
        )}
        <SeoSourceNote state={state} />
      </ContentSection>
    </>
  );
}

function querySortValue(query: MarketingConsoleSeoQuery, sort: QuerySort) {
  if (sort === 'views') return query.searchViews;
  if (sort === 'position') return -(query.averagePosition ?? Number.MAX_SAFE_INTEGER);
  return query.clicks;
}
