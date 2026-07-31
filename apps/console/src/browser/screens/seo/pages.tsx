import { useMemo, useState } from 'react';
import type { MarketingConsoleSeoPage } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Button } from '@unisane/ui/button';
import { SelectField } from '@unisane/ui/select-field';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unisane/ui/table';
import { TextField } from '@unisane/ui/text-field';
import { Typography } from '@unisane/ui/typography';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber } from '../../lib/format.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { FilterBar, TableFrame } from '../../shared/controls.js';
import { SeoSourceNote } from './source-note.js';

type PageSort = 'clicks' | 'views' | 'position';

export function SeoPagesScreen({ state, openOverlay, navigate }: ConsoleScreenProps) {
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
        <FilterBar>
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
        </FilterBar>
      </ContentSection>
      <ContentSection>
        {pages.length ? (
          <TableFrame label="Search pages">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>Search views</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>Average position</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <Button
                        variant="text"
                        size="sm"
                        onClick={() =>
                          openOverlay({ kind: 'seo', detail: { kind: 'page', id: page.id } })
                        }
                      >
                        {page.title}
                      </Button>
                      <Typography variant="labelSmall" className="text-on-surface-variant">
                        {page.path}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatNumber(page.clicks)}</TableCell>
                    <TableCell>{formatNumber(page.searchViews)}</TableCell>
                    <TableCell>
                      {page.clickThroughRate === undefined
                        ? 'Not available'
                        : `${page.clickThroughRate}%`}
                    </TableCell>
                    <TableCell>{page.averagePosition ?? 'Not available'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="tonal"
                        color={page.status === 'Not indexed' ? 'error' : 'warning'}
                        size="sm"
                      >
                        {page.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableFrame>
        ) : (
          <EmptyState
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
