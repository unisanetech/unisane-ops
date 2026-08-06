import { useMemo, useState } from 'react';
import type { MarketingConsoleState } from '@unisane/growth/console';
import type { Column } from '@unisane/data-table';
import { Badge } from '@unisane/ui/badge';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatNumber, healthStatusLabel, statusColor } from '../../lib/format.js';
import { ConsoleDataTable } from '../../shared/console-data-table.js';
import {
  DataTableListPreview,
  DataTablePrimaryText,
  DataTableWrappedText,
  ExpandedDataSection,
  ExpandedDataTableRow,
} from '../../shared/data-table-content.js';
import { NarrativeDataTable } from '../../shared/narrative-data-table.js';
import {
  CompetitorAnalysisDataTable,
  MetadataExperimentsDataTable,
  openMetadataDetailsPane,
  openSerpDetailsPane,
  SerpLandscapeDataTable,
} from './research-analysis-data-tables.js';
import { ClusterResearchDetailsPane, MarketResearchDetailsPane } from './research-detail-panes.js';

type KeywordResearch = MarketingConsoleState['keywordResearch'];
type KeywordRow = KeywordResearch['matrix'][number];
type FaqResearch = MarketingConsoleState['faqResearch'];
type CompetitorResearch = MarketingConsoleState['competitorResearch'];
type SeoIntelligence = MarketingConsoleState['seoIntelligence'];

export function KeywordTable({ rows }: { rows: KeywordRow[] }) {
  const tableRows = useMemo(() => rows.map((row) => ({ ...row, id: row.normalizedTerm })), [rows]);
  const columns = useMemo<Column<(typeof tableRows)[number]>[]>(
    () => [
      {
        key: 'term',
        header: 'Keyword',
        width: 280,
        minWidth: 220,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTablePrimaryText>{row.term}</DataTablePrimaryText>,
      },
      {
        key: 'clusterLabel',
        header: 'Cluster',
        width: 220,
        minWidth: 180,
        sortable: true,
        responsivePriority: 1,
      },
      numericColumn('totalKnownVolume', 'Total demand', (row) => row.totalKnownVolume),
      {
        key: 'bestMarket',
        header: 'Best market',
        width: 140,
        minWidth: 120,
        minVisibleWidth: 620,
        responsivePriority: 2,
        render: (row) => row.bestMarket ?? 'Not available',
      },
      numericColumn('marketCount', 'Markets', (row) => row.marketCount, 760, 3),
      {
        key: 'competition',
        header: 'Advertiser competition',
        width: 190,
        minWidth: 170,
        align: 'end',
        minVisibleWidth: 900,
        responsivePriority: 4,
        render: formatCompetition,
      },
    ],
    [],
  );
  return (
    <ConsoleDataTable
      tableId="ops-seo-keyword-research"
      data={tableRows}
      columns={columns}
      emptyMessage="No keyword research was recorded"
      emptyIcon="key"
    />
  );
}

export function ClusterTable({
  research,
  openSupportingPane,
}: {
  research: KeywordResearch;
  openSupportingPane: ConsoleScreenProps['openSupportingPane'];
}) {
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const columns = useMemo<Column<KeywordResearch['clusters'][number]>[]>(
    () => [
      {
        key: 'label',
        header: 'Focus area',
        width: 260,
        minWidth: 210,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTablePrimaryText>{row.label}</DataTablePrimaryText>,
      },
      numericColumn('metricCount', 'Keywords', (row) => row.metricCount),
      numericColumn('totalKnownVolume', 'Est. demand', (row) => row.totalKnownVolume),
      {
        key: 'bestMarket',
        header: 'Best market',
        width: 140,
        minWidth: 120,
        minVisibleWidth: 640,
        responsivePriority: 2,
        render: (row) => row.bestMarket ?? 'Not available',
      },
      {
        key: 'averageCompetitionIndex',
        header: 'Competition',
        width: 132,
        minWidth: 116,
        align: 'end',
        minVisibleWidth: 760,
        responsivePriority: 3,
        render: (row) =>
          row.averageCompetitionIndex === undefined
            ? 'Not available'
            : `${Math.round(row.averageCompetitionIndex)}/100`,
      },
      {
        key: 'topKeywords',
        header: 'Leading keywords',
        width: 320,
        minWidth: 240,
        minVisibleWidth: 920,
        responsivePriority: 4,
        render: (row) => <DataTableListPreview items={row.topKeywords.map((item) => item.term)} />,
      },
    ],
    [],
  );
  const showClusterDetails = (row: KeywordResearch['clusters'][number]) => {
    setSelectedRowId(row.id);
    openSupportingPane({
      id: `seo.cluster.${row.id}`,
      title: row.label,
      subtitle: `${formatNumber(row.metricCount)} keywords · ${row.bestMarket ?? 'Market unavailable'}`,
      content: <ClusterResearchDetailsPane cluster={row} />,
      onClose: () => setSelectedRowId(undefined),
    });
  };
  return (
    <ConsoleDataTable
      tableId="ops-seo-keyword-clusters"
      data={research.clusters}
      columns={columns}
      emptyMessage="No keyword clusters were recorded"
      emptyIcon="account_tree"
      activeRowId={selectedRowId}
      callbacks={{ onRowClick: showClusterDetails }}
    />
  );
}

export function MarketTable({
  research,
  openSupportingPane,
}: {
  research: KeywordResearch;
  openSupportingPane: ConsoleScreenProps['openSupportingPane'];
}) {
  const [selectedRowId, setSelectedRowId] = useState<string>();
  const rows = useMemo(
    () => research.markets.map((row) => ({ ...row, id: row.market })),
    [research.markets],
  );
  const columns = useMemo<Column<(typeof rows)[number]>[]>(
    () => [
      {
        key: 'market',
        header: 'Market',
        width: 200,
        minWidth: 170,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTablePrimaryText>{row.market}</DataTablePrimaryText>,
      },
      numericColumn('metricCount', 'Measurements', (row) => row.metricCount),
      numericColumn('totalKnownVolume', 'Est. demand', (row) => row.totalKnownVolume),
      {
        key: 'averageCompetitionIndex',
        header: 'Avg. competition',
        width: 164,
        minWidth: 148,
        align: 'end',
        minVisibleWidth: 650,
        responsivePriority: 3,
        render: (row) =>
          row.averageCompetitionIndex === undefined
            ? 'Not available'
            : `${Math.round(row.averageCompetitionIndex)}/100`,
      },
      {
        key: 'topKeywords',
        header: 'Leading keywords',
        width: 360,
        minWidth: 260,
        minVisibleWidth: 820,
        responsivePriority: 4,
        render: (row) => (
          <DataTableListPreview items={row.topKeywords.map((item) => item.term)} visibleCount={3} />
        ),
      },
    ],
    [],
  );
  const showMarketDetails = (row: (typeof rows)[number]) => {
    const totalDemand = research.markets.reduce((total, item) => total + item.totalKnownVolume, 0);
    const demandRank = [...research.markets]
      .sort(
        (left, right) =>
          right.totalKnownVolume - left.totalKnownVolume || left.market.localeCompare(right.market),
      )
      .findIndex((item) => item.market === row.market);
    const demandShare =
      totalDemand > 0 ? `${((row.totalKnownVolume / totalDemand) * 100).toFixed(1)}%` : undefined;
    setSelectedRowId(row.id);
    openSupportingPane({
      id: `seo.market.${row.id}`,
      title: row.market,
      subtitle: `${demandRank >= 0 ? `#${demandRank + 1} by demand` : 'Demand rank unavailable'}${demandShare ? ` · ${demandShare} of recorded demand` : ''}`,
      content: <MarketResearchDetailsPane market={row} markets={research.markets} />,
      onClose: () => setSelectedRowId(undefined),
    });
  };
  return (
    <ConsoleDataTable
      tableId="ops-seo-keyword-markets"
      data={rows}
      columns={columns}
      emptyMessage="No keyword markets were recorded"
      emptyIcon="public"
      activeRowId={selectedRowId}
      callbacks={{ onRowClick: showMarketDetails }}
    />
  );
}

export function QuestionTable({ research }: { research: FaqResearch }) {
  const columns = useMemo<Column<FaqResearch['questions'][number]>[]>(
    () => [
      {
        key: 'question',
        header: 'Question',
        width: 360,
        minWidth: 260,
        sortable: true,
        responsivePriority: 1,
        render: (row) => <DataTableWrappedText>{row.question}</DataTableWrappedText>,
      },
      {
        key: 'routePath',
        header: 'Target page',
        width: 220,
        minWidth: 180,
        responsivePriority: 1,
      },
      {
        key: 'priority',
        header: 'Priority',
        width: 100,
        minWidth: 88,
        sortable: true,
        responsivePriority: 1,
      },
      numericColumn('avgMonthlySearches', 'Demand', (row) => row.avgMonthlySearches, 650, 2),
      numericColumn('marketCount', 'Markets', (row) => row.marketCount, 760, 3),
      {
        key: 'proofStatus',
        header: 'Proof',
        width: 120,
        minWidth: 108,
        minVisibleWidth: 880,
        responsivePriority: 3,
        render: (row) => (
          <Badge variant="tonal" color={statusColor(row.proofStatus)} size="sm">
            {healthStatusLabel(row.proofStatus)}
          </Badge>
        ),
      },
    ],
    [],
  );
  return (
    <NarrativeDataTable
      tableId="ops-seo-question-plan"
      data={research.questions}
      columns={columns}
      emptyMessage="No FAQ questions were recorded"
      emptyIcon="quiz"
      renderExpandedRow={(row) => (
        <ExpandedDataTableRow title={row.question} description={row.routePath}>
          <ExpandedDataSection title="Answer intent" span="full">
            <p>{row.answerIntent}</p>
          </ExpandedDataSection>
        </ExpandedDataTableRow>
      )}
    />
  );
}

export function CompetitorTables({
  research,
  openSupportingPane,
}: {
  research: CompetitorResearch;
  openSupportingPane: ConsoleScreenProps['openSupportingPane'];
}) {
  return (
    <CompetitorAnalysisDataTable research={research} openSupportingPane={openSupportingPane} />
  );
}

export function SerpTables({
  intelligence,
  openSupportingPane,
}: {
  intelligence: SeoIntelligence;
  openSupportingPane: ConsoleScreenProps['openSupportingPane'];
}) {
  const [selection, setSelection] = useState<{ kind: 'serp' | 'metadata'; id: string }>();
  return (
    <div className="grid gap-6">
      <SerpLandscapeDataTable
        intelligence={intelligence}
        activeRowId={selection?.kind === 'serp' ? selection.id : undefined}
        onSelect={(row) => {
          setSelection({ kind: 'serp', id: row.id });
          openSerpDetailsPane(row, openSupportingPane, () => setSelection(undefined));
        }}
      />
      <MetadataExperimentsDataTable
        intelligence={intelligence}
        activeRowId={selection?.kind === 'metadata' ? selection.id : undefined}
        onSelect={(row) => {
          setSelection({ kind: 'metadata', id: row.id });
          openMetadataDetailsPane(row, openSupportingPane, () => setSelection(undefined));
        }}
      />
    </div>
  );
}

function formatCompetition(row: KeywordRow): string {
  const values = Object.values(row.markets)
    .map((item) => item.competitionIndex)
    .filter((value): value is number => value !== undefined);
  if (!values.length) return 'Not available';
  return `${Math.round(values.reduce((total, value) => total + value, 0) / values.length)}/100`;
}

function numericColumn<T extends { id: string }>(
  key: string,
  header: string,
  value: (row: T) => number | undefined,
  minVisibleWidth?: number,
  responsivePriority: 1 | 2 | 3 | 4 | 5 = 1,
): Column<T> {
  return {
    key,
    header,
    width: 132,
    minWidth: 112,
    align: 'end',
    sortable: true,
    minVisibleWidth,
    responsivePriority,
    render: (row) => {
      const result = value(row);
      return result === undefined ? 'Not available' : formatNumber(result);
    },
  };
}
