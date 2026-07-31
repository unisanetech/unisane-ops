import { useMemo, useState } from 'react';
import { SelectField } from '@unisane/ui/select-field';
import { Tabs, TabsList, TabsTrigger } from '@unisane/ui/tabs';
import { TextField } from '@unisane/ui/text-field';
import type { ConsoleScreenProps } from '../../contracts.js';
import { formatCompactNumber, formatNumber } from '../../lib/format.js';
import { ContentSection, MetricCard, MetricGrid, Summary } from '../../shared/content.js';
import { FilterBar } from '../../shared/controls.js';
import {
  ClusterTable,
  CompetitorTables,
  KeywordTable,
  MarketTable,
  QuestionTable,
  SerpTables,
} from './research-tables.js';

type ResearchView = 'clusters' | 'keywords' | 'markets' | 'questions' | 'competitors' | 'serp';

export function SeoResearchScreen({ state }: ConsoleScreenProps) {
  const [view, setView] = useState<ResearchView>('clusters');
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState('all');
  const [cluster, setCluster] = useState('all');
  const [sort, setSort] = useState<'volume' | 'competition' | 'markets' | 'keyword'>('volume');
  const research = state.keywordResearch;
  const rows = useMemo(
    () =>
      research.matrix
        .filter(
          (row) =>
            (market === 'all' || market in row.markets) &&
            (cluster === 'all' || row.clusterId === cluster) &&
            `${row.term} ${row.clusterLabel}`.toLowerCase().includes(search.toLowerCase()),
        )
        .sort((left, right) => compareKeywordRows(left, right, sort)),
    [cluster, market, research.matrix, search, sort],
  );
  return (
    <>
      <Summary
        headline={
          research.matrix.length
            ? `${formatNumber(research.matrix.length)} researched keywords are ready to compare and prioritize.`
            : 'No keyword research is available yet.'
        }
        detail="Research defines where growth may exist. Search Console separately validates current visibility."
      />
      <ContentSection>
        <MetricGrid>
          <MetricCard
            label="Researched keywords"
            value={formatNumber(research.matrix.length)}
            helper="Keywords with recorded research evidence."
          />
          <MetricCard
            label="Provider-estimated demand"
            value={formatCompactNumber(research.totalKnownVolume)}
            helper="Combined known monthly search estimates."
          />
          <MetricCard
            label="Keyword clusters"
            value={formatNumber(research.clusters.length)}
            helper="Related terms grouped by target use."
          />
          <MetricCard
            label="Markets compared"
            value={formatNumber(research.markets.length)}
            helper="Country and language markets represented."
          />
        </MetricGrid>
      </ContentSection>
      <ContentSection>
        <Tabs value={view} size="sm" onValueChange={(value) => setView(value as ResearchView)}>
          <TabsList className="gap-1" aria-label="Research views">
            <TabsTrigger value="clusters">Clusters</TabsTrigger>
            <TabsTrigger value="keywords">All keywords</TabsTrigger>
            <TabsTrigger value="markets">Markets</TabsTrigger>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="competitors">Competitors &amp; gaps</TabsTrigger>
            <TabsTrigger value="serp">SERP &amp; experiments</TabsTrigger>
          </TabsList>
        </Tabs>
      </ContentSection>
      {view === 'keywords' ? (
        <>
          <ContentSection>
            <FilterBar>
              <TextField
                label="Search keywords"
                placeholder="Search keyword or cluster"
                value={search}
                onValueChange={setSearch}
              />
              <SelectField
                label="Market"
                value={market}
                onValueChange={setMarket}
                options={[
                  { value: 'all', label: 'All markets' },
                  ...research.markets.map((item) => ({
                    value: item.market,
                    label: item.market,
                  })),
                ]}
              />
              <SelectField
                label="Cluster"
                value={cluster}
                onValueChange={setCluster}
                options={[
                  { value: 'all', label: 'All clusters' },
                  ...research.clusters.map((item) => ({
                    value: item.id,
                    label: item.label,
                  })),
                ]}
              />
              <SelectField
                label="Sort by"
                value={sort}
                onValueChange={(value) => setSort(value as typeof sort)}
                options={[
                  { value: 'volume', label: 'Demand' },
                  { value: 'competition', label: 'Advertiser competition' },
                  { value: 'markets', label: 'Market coverage' },
                  { value: 'keyword', label: 'Keyword A–Z' },
                ]}
              />
            </FilterBar>
          </ContentSection>
          <ContentSection>
            <KeywordTable rows={rows} />
          </ContentSection>
        </>
      ) : null}
      {view === 'clusters' ? (
        <ContentSection
          title="Where to focus next"
          description="Start with clusters that combine meaningful demand, market fit, and a clear page or campaign use."
        >
          <ClusterTable research={research} />
        </ContentSection>
      ) : null}
      {view === 'markets' ? (
        <ContentSection
          title="Market comparison"
          description="Compare provider-estimated demand before reusing the same keyword and content strategy in every country."
        >
          <MarketTable research={research} />
        </ContentSection>
      ) : null}
      {view === 'questions' ? (
        <ContentSection
          title="Question and FAQ plan"
          description="Demand alone is not enough: every question keeps its page role, evidence, and answer intent."
        >
          <QuestionTable research={state.faqResearch} />
        </ContentSection>
      ) : null}
      {view === 'competitors' ? (
        <ContentSection
          title="Competitor landscape"
          description="Patterns and gaps are drawn from recorded pages, not assumed from brand reputation."
        >
          <CompetitorTables research={state.competitorResearch} />
        </ContentSection>
      ) : null}
      {view === 'serp' ? (
        <ContentSection
          title="SERP and page experiments"
          description="Recorded result landscapes validate intent; proposed metadata remains a hypothesis until measured."
        >
          <SerpTables intelligence={state.seoIntelligence} />
        </ContentSection>
      ) : null}
    </>
  );
}

function compareKeywordRows(
  left: ConsoleScreenProps['state']['keywordResearch']['matrix'][number],
  right: ConsoleScreenProps['state']['keywordResearch']['matrix'][number],
  sort: 'volume' | 'competition' | 'markets' | 'keyword',
) {
  if (sort === 'keyword') return left.term.localeCompare(right.term);
  if (sort === 'markets') return right.marketCount - left.marketCount;
  if (sort === 'competition') return averageCompetition(right) - averageCompetition(left);
  return right.totalKnownVolume - left.totalKnownVolume;
}

function averageCompetition(row: ConsoleScreenProps['state']['keywordResearch']['matrix'][number]) {
  const values = Object.values(row.markets)
    .map((item) => item.competitionIndex)
    .filter((value): value is number => value !== undefined);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : -1;
}
