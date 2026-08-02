import { useMemo, useState } from 'react';
import type { MarketingConsoleSeoPage } from '@unisane/growth/console';
import { SelectField } from '@unisane/ui/select-field';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
import { ContentSection, DataState, Summary } from '../../shared/content.js';
import { FilterToolbar } from '../../shared/controls.js';
import { SeoPagesDataTable } from './seo-performance-data-tables.js';
import { SeoSourceNote } from './source-note.js';

type PageSort = 'clicks' | 'views' | 'position';

export function SeoPagesScreen({ state, navigate }: ConsoleScreenProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState<PageSort>('clicks');
  const pages = useMemo(
    () =>
      state.seo.pages
        .filter(
          (page) =>
            (status === 'all' || page.status === status) &&
            `${page.title} ${page.path}`.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((left, right) => pageSortValue(right, sort) - pageSortValue(left, sort)),
    [search, sort, state.seo.pages, status],
  );
  return (
    <>
      <Summary
        headline={
          state.seo.pages.length
            ? `${state.seo.pages.length} pages have current search evidence.`
            : 'No page-level search evidence is available yet.'
        }
        detail={state.seo.comparisonLabel}
      />
      <ContentSection>
        <FilterToolbar
          resultCount={pages.length}
          totalCount={state.seo.pages.length}
          resultLabel="pages"
          isFiltered={Boolean(search.trim()) || status !== 'all'}
          onClear={() => {
            setSearch('');
            setStatus('all');
          }}
        >
          <TextField
            label="Search pages"
            placeholder="Search page title or URL"
            value={search}
            onValueChange={setSearch}
          />
          <SelectField
            label="Status"
            value={status}
            onValueChange={setStatus}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'Review', label: 'Review' },
              { value: 'Not indexed', label: 'Not indexed' },
            ]}
          />
          <SelectField
            label="Sort by"
            value={sort}
            onValueChange={(value) => setSort(value as PageSort)}
            options={[
              { value: 'clicks', label: 'Clicks' },
              { value: 'views', label: 'Search views' },
              { value: 'position', label: 'Average position' },
            ]}
          />
        </FilterToolbar>
      </ContentSection>
      <ContentSection>
        {pages.length ? (
          <SeoPagesDataTable pages={pages} />
        ) : (
          <DataState
            title="No page matches these filters."
            description="Clear the filters or review the active Search Console connection."
            actionLabel="Review connection"
            onAction={() => navigate('/connections')}
          />
        )}
        <SeoSourceNote state={state} />
      </ContentSection>
    </>
  );
}

function pageSortValue(page: MarketingConsoleSeoPage, sort: PageSort) {
  if (sort === 'views') return page.searchViews;
  if (sort === 'position') return -(page.averagePosition ?? Number.MAX_SAFE_INTEGER);
  return page.clicks;
}
