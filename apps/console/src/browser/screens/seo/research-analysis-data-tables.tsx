import { useMemo } from 'react';
import type { MarketingConsoleState } from '@unisane/growth/console';
import type { Column } from '@unisane/data-table';
import { Badge } from '@unisane/ui/badge';
import {
  DataTableListPreview,
  DataTablePrimaryText,
  DataTableWrappedText,
  ExpandedDataInlineList,
  ExpandedDataList,
  ExpandedDataSection,
  ExpandedDataTableRow,
} from '../../shared/data-table-content.js';
import { NarrativeDataTable } from '../../shared/narrative-data-table.js';

type CompetitorResearch = MarketingConsoleState['competitorResearch'];
type SeoIntelligence = MarketingConsoleState['seoIntelligence'];
type CompetitorRow = CompetitorResearch['domains'][number] & { id: string };
type SerpRow = SeoIntelligence['serp']['snapshots'][number];
type MetadataRow = SeoIntelligence['metadata']['experiments'][number];

export function CompetitorAnalysisDataTable({ research }: { research: CompetitorResearch }) {
  const rows = useMemo<CompetitorRow[]>(
    () => research.domains.map((item) => ({ ...item, id: item.domain })),
    [research.domains],
  );
  const columns = useMemo<Column<CompetitorRow>[]>(
    () => [
      {
        key: 'domain',
        header: 'Domain',
        width: 190,
        minWidth: 160,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTablePrimaryText>{row.domain}</DataTablePrimaryText>,
      },
      {
        key: 'pageCount',
        header: 'Pages',
        width: 92,
        minWidth: 84,
        align: 'end',
        sortable: true,
        responsivePriority: 1,
      },
      {
        key: 'keywordCount',
        header: 'Keywords',
        width: 104,
        minWidth: 92,
        align: 'end',
        sortable: true,
        responsivePriority: 2,
      },
      {
        key: 'bestPosition',
        header: 'Best position',
        width: 142,
        minWidth: 128,
        align: 'end',
        sortable: true,
        minVisibleWidth: 560,
        responsivePriority: 2,
        render: (row) => row.bestPosition ?? 'Not available',
      },
      {
        key: 'topPatterns',
        header: 'Key patterns',
        width: 360,
        minWidth: 280,
        minVisibleWidth: 820,
        responsivePriority: 4,
        render: (row) => <DataTableListPreview items={row.topPatterns} />,
        printValue: (row) => row.topPatterns.join('; '),
      },
    ],
    [],
  );

  return (
    <NarrativeDataTable
      tableId="ops-seo-competitor-landscape"
      data={rows}
      columns={columns}
      emptyMessage="No competitor domains were recorded"
      emptyIcon="travel_explore"
      renderExpandedRow={(row) => (
        <ExpandedDataTableRow
          title={`${row.domain} analysis`}
          description="Complete recorded patterns and evidence-backed opportunities for this domain."
        >
          <ExpandedDataSection title="Content patterns">
            <ExpandedDataInlineList items={row.topPatterns} />
          </ExpandedDataSection>
          <ExpandedDataSection title="Opportunities">
            <ExpandedDataList
              items={row.opportunities}
              emptyMessage="No specific opportunity was supported for this domain."
            />
          </ExpandedDataSection>
        </ExpandedDataTableRow>
      )}
    />
  );
}

export function SerpLandscapeDataTable({ intelligence }: { intelligence: SeoIntelligence }) {
  const columns = useMemo<Column<SerpRow>[]>(
    () => [
      {
        key: 'keyword',
        header: 'Keyword',
        width: 210,
        minWidth: 170,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTablePrimaryText>{row.keyword}</DataTablePrimaryText>,
      },
      {
        key: 'market',
        header: 'Market',
        width: 116,
        minWidth: 104,
        responsivePriority: 1,
        render: (row) => `${row.country} · ${row.language}`,
        printValue: (row) => `${row.country} · ${row.language}`,
      },
      {
        key: 'intent',
        header: 'Intent summary',
        width: 360,
        minWidth: 280,
        minVisibleWidth: 680,
        responsivePriority: 3,
        render: (row) => <DataTableWrappedText>{row.intent}</DataTableWrappedText>,
      },
      {
        key: 'topDomains',
        header: 'Top domains',
        width: 300,
        minWidth: 240,
        minVisibleWidth: 920,
        responsivePriority: 4,
        render: (row) => <DataTableListPreview items={row.topDomains} visibleCount={3} />,
        printValue: (row) => row.topDomains.join('; '),
      },
    ],
    [],
  );

  return (
    <NarrativeDataTable
      tableId="ops-seo-serp-landscapes"
      data={intelligence.serp.snapshots}
      columns={columns}
      emptyMessage="No search-result landscape was recorded"
      emptyIcon="manage_search"
      renderExpandedRow={(row) => (
        <ExpandedDataTableRow
          title={`${row.keyword} search landscape`}
          description={`${row.country} · ${row.language} · Complete recorded evidence.`}
        >
          <ExpandedDataSection title="Observed intent" span="full">
            <p>{row.intent}</p>
          </ExpandedDataSection>
          <ExpandedDataSection title="Top domains">
            <ExpandedDataInlineList items={row.topDomains} />
          </ExpandedDataSection>
          <ExpandedDataSection title="People also ask">
            <ExpandedDataList items={row.peopleAlsoAsk} />
          </ExpandedDataSection>
          <ExpandedDataSection title="Opportunities">
            <ExpandedDataList items={row.opportunities} />
          </ExpandedDataSection>
        </ExpandedDataTableRow>
      )}
    />
  );
}

export function MetadataExperimentsDataTable({ intelligence }: { intelligence: SeoIntelligence }) {
  const columns = useMemo<Column<MetadataRow>[]>(
    () => [
      {
        key: 'routePath',
        header: 'Page',
        width: 160,
        minWidth: 140,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTablePrimaryText>{row.routePath}</DataTablePrimaryText>,
      },
      {
        key: 'priority',
        header: 'Priority',
        width: 104,
        minWidth: 96,
        sortable: true,
        responsivePriority: 1,
        render: (row) => (
          <Badge variant="tonal" color={row.priority === 'p0' ? 'warning' : 'info'} size="sm">
            {row.priority.toUpperCase()}
          </Badge>
        ),
      },
      {
        key: 'primaryKeyword',
        header: 'Primary keyword',
        width: 220,
        minWidth: 180,
        sortable: true,
        minVisibleWidth: 560,
        responsivePriority: 2,
      },
      {
        key: 'proposedTitle',
        header: 'Proposed title',
        width: 420,
        minWidth: 320,
        minVisibleWidth: 760,
        responsivePriority: 3,
        render: (row) => <DataTableWrappedText>{row.proposedTitle}</DataTableWrappedText>,
      },
    ],
    [],
  );

  return (
    <NarrativeDataTable
      tableId="ops-seo-metadata-experiments"
      data={intelligence.metadata.experiments}
      columns={columns}
      emptyMessage="No metadata experiment was recorded"
      emptyIcon="experiment"
      renderExpandedRow={(row) => (
        <ExpandedDataTableRow
          title={row.proposedTitle}
          description={`${row.routePath} · ${row.primaryKeyword}`}
        >
          <ExpandedDataSection title="Rationale">
            <p>{row.rationale}</p>
          </ExpandedDataSection>
          <ExpandedDataSection title="Expected impact">
            <p>{row.expectedImpact}</p>
          </ExpandedDataSection>
        </ExpandedDataTableRow>
      )}
    />
  );
}
