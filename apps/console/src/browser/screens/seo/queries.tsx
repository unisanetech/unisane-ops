import { useMemo, useState } from 'react';
import type { MarketingConsoleSeoQuery } from '@unisane/growth/console';
import { Button } from '@unisane/ui/button';
import { SelectField } from '@unisane/ui/select-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unisane/ui/table';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { FilterBar, TableFrame } from '../../shared/controls.js';
import { SeoSourceNote } from './source-note.js';

type QuerySort = 'clicks' | 'views' | 'position';

export function SeoQueriesScreen({ state, openOverlay, navigate }: ConsoleScreenProps) {
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
        <FilterBar>
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
        </FilterBar>
      </ContentSection>
      <ContentSection>
        {queries.length ? (
          <TableFrame label="Search queries">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Search</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Search views</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Average position</TableHead>
                  <TableHead>Best page</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((query) => (
                  <TableRow key={query.id}>
                    <TableCell>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() =>
                          openOverlay({ kind: 'seo', detail: { kind: 'query', id: query.id } })
                        }
                      >
                        {query.query}
                      </Button>
                    </TableCell>
                    <TableCell>{formatNumber(query.clicks)}</TableCell>
                    <TableCell>{formatNumber(query.searchViews)}</TableCell>
                    <TableCell>
                      {query.clickThroughRate === undefined
                        ? 'Not available'
                        : `${query.clickThroughRate}%`}
                    </TableCell>
                    <TableCell>{query.averagePosition ?? 'Not available'}</TableCell>
                    <TableCell>{query.bestPage?.title ?? 'Not available'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        ) : (
          <EmptyState
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
