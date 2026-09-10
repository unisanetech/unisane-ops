import type { MarketingConsoleState } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import { formatDateTime, formatNumber } from '../../lib/format.js';
import {
  ResearchBulletList,
  ResearchDetailFact,
  ResearchDetailMetric,
  ResearchDetailPane,
  ResearchDetailSection,
  ResearchInlineList,
} from './research-detail-pane-primitives.js';

type KeywordCluster = MarketingConsoleState['keywordResearch']['clusters'][number];
type KeywordMarket = MarketingConsoleState['keywordResearch']['markets'][number];
type CompetitorDomain = MarketingConsoleState['competitorResearch']['domains'][number];
type SerpSnapshot = MarketingConsoleState['seoIntelligence']['serp']['snapshots'][number];
type MetadataExperiment =
  MarketingConsoleState['seoIntelligence']['metadata']['experiments'][number];

export function ClusterResearchDetailsPane({ cluster }: { cluster: KeywordCluster }) {
  return (
    <ResearchDetailPane
      ariaLabel="Keyword cluster details"
      badges={
        <>
          <Badge variant="tonal" color="primary" size="sm">
            Planning evidence
          </Badge>
          <Badge variant="tonal" color="secondary" size="sm">
            {cluster.bestMarket ?? 'Market unavailable'}
          </Badge>
        </>
      }
      summary="Review the recorded demand, market fit, competition, and intended use before choosing this focus area."
    >
      <ResearchDetailSection title="Planning summary">
        <div className="ops-research-detail-pane__metrics">
          <ResearchDetailMetric label="Keywords" value={formatNumber(cluster.metricCount)} />
          <ResearchDetailMetric
            label="Estimated demand"
            value={formatNumber(cluster.totalKnownVolume)}
            note="Combined provider estimate"
          />
          <ResearchDetailMetric label="Best market" value={cluster.bestMarket ?? 'Not available'} />
          <ResearchDetailMetric
            label="Competition"
            value={
              cluster.averageCompetitionIndex === undefined
                ? 'Not available'
                : `${Math.round(cluster.averageCompetitionIndex)}/100`
            }
            note="Provider estimate"
          />
        </div>
      </ResearchDetailSection>

      <ResearchDetailSection title="Leading keywords">
        <ResearchInlineList
          items={cluster.topKeywords.map((item) => item.term)}
          emptyMessage="No leading keyword was recorded for this cluster."
        />
      </ResearchDetailSection>

      <ResearchDetailSection title="Planning context">
        <dl className="grid gap-4">
          <ResearchDetailFact label="Intent" value={cluster.intent} />
          <ResearchDetailFact
            label="Market evidence"
            value={
              <ResearchInlineList
                items={Object.entries(cluster.marketVolumes).map(
                  ([market, volume]) => `${market}: ${formatNumber(volume)}`,
                )}
                emptyMessage="No market-level demand was recorded for this cluster."
              />
            }
          />
        </dl>
      </ResearchDetailSection>

      <ResearchDetailSection title="Recommended use">
        <Card variant="low" padding="sm" className="border-outline-weak border">
          <Typography variant="bodyMedium">{cluster.recommendedUse}</Typography>
        </Card>
      </ResearchDetailSection>

      <ResearchDetailSection title="Evidence limits">
        <Typography variant="bodySmall" className="text-on-surface-variant">
          Demand and competition are provider estimates. They identify a possible focus area, not
          observed rankings, traffic, conversions, or guaranteed results.
        </Typography>
      </ResearchDetailSection>
    </ResearchDetailPane>
  );
}

export function MarketResearchDetailsPane({
  market,
  markets,
}: {
  market: KeywordMarket;
  markets: KeywordMarket[];
}) {
  const rankedMarkets = [...markets].sort(
    (left, right) =>
      right.totalKnownVolume - left.totalKnownVolume || left.market.localeCompare(right.market),
  );
  const demandRank = rankedMarkets.findIndex((item) => item.market === market.market) + 1;
  const totalRecordedDemand = markets.reduce((total, item) => total + item.totalKnownVolume, 0);
  const demandShare =
    totalRecordedDemand > 0 ? (market.totalKnownVolume / totalRecordedDemand) * 100 : undefined;
  const recordedCompetition = markets
    .map((item) => item.averageCompetitionIndex)
    .filter((value): value is number => value !== undefined);
  const comparedMarketAverage =
    recordedCompetition.length > 0
      ? recordedCompetition.reduce((total, value) => total + value, 0) / recordedCompetition.length
      : undefined;
  const currencies = [
    ...new Set(
      [market.currencyCode, ...market.topKeywords.map((keyword) => keyword.currencyCode)].filter(
        (currency): currency is string => Boolean(currency),
      ),
    ),
  ];

  return (
    <ResearchDetailPane
      ariaLabel="Keyword market details"
      badges={
        <>
          <Badge variant="tonal" color="primary" size="sm">
            Provider market evidence
          </Badge>
          <Badge variant="tonal" color="secondary" size="sm">
            {currencies.length === 0
              ? 'Currency unavailable'
              : currencies.length <= 2
                ? currencies.join(' · ')
                : `${currencies.length} currencies`}
          </Badge>
        </>
      }
      summary="Use this comparison to understand relative demand and advertiser competition before adapting a keyword, content, or campaign plan for this market."
    >
      <ResearchDetailSection title="Market position">
        <div className="ops-research-detail-pane__metrics">
          <ResearchDetailMetric
            label="Demand rank"
            value={demandRank > 0 ? `#${demandRank} of ${markets.length}` : 'Not available'}
            note="Among recorded markets"
          />
          <ResearchDetailMetric
            label="Share of demand"
            value={demandShare === undefined ? 'Not available' : `${demandShare.toFixed(1)}%`}
            note="Of recorded provider estimates"
          />
          <ResearchDetailMetric
            label="Estimated demand"
            value={formatNumber(market.totalKnownVolume)}
            note="Combined monthly estimate"
          />
          <ResearchDetailMetric
            label="Measurements"
            value={formatNumber(market.metricCount)}
            note="Recorded keyword-market rows"
          />
        </div>
      </ResearchDetailSection>

      <ResearchDetailSection title="Competition context">
        <dl className="grid gap-4">
          <ResearchDetailFact
            label="Average advertiser competition"
            value={
              market.averageCompetitionIndex === undefined
                ? 'Not available'
                : `${Math.round(market.averageCompetitionIndex)}/100`
            }
          />
          <ResearchDetailFact
            label="Compared with other recorded markets"
            value={competitionComparison(market.averageCompetitionIndex, comparedMarketAverage)}
          />
          <ResearchDetailFact
            label="Currencies recorded"
            value={currencies.length > 0 ? currencies.join(', ') : 'Not recorded'}
          />
        </dl>
        {currencies.length > 1 ? (
          <Card variant="low" padding="sm" className="border-outline-weak mt-4 border">
            <Typography variant="bodySmall" className="text-on-surface-variant">
              Provider rows use multiple currencies. Compare bid estimates only when their currency
              matches; no currency conversion is applied here.
            </Typography>
          </Card>
        ) : null}
      </ResearchDetailSection>

      <ResearchDetailSection
        title="Leading keyword evidence"
        description="Provider estimates recorded for this country and language."
      >
        <ul className="grid gap-2">
          {market.topKeywords.map((keyword) => {
            const bidRange = formatBidRange(keyword, market.currencyCode);
            return (
              <li
                key={`${keyword.normalizedTerm ?? keyword.term}-${keyword.country}-${keyword.language}-${keyword.currencyCode}`}
              >
                <Card variant="low" padding="sm" className="border-outline-weak border">
                  <Typography variant="bodyMedium" className="font-medium">
                    {keyword.term}
                  </Typography>
                  <Typography variant="bodySmall" className="text-on-surface-variant mt-1">
                    {keyword.avgMonthlySearches === undefined
                      ? 'Demand not recorded'
                      : `${formatNumber(keyword.avgMonthlySearches)} estimated monthly searches`}
                    {' · '}
                    {keyword.competitionIndex === undefined
                      ? 'Competition not recorded'
                      : `Competition ${Math.round(keyword.competitionIndex)}/100`}
                  </Typography>
                  {bidRange ? (
                    <Typography variant="labelSmall" className="text-on-surface-variant mt-1">
                      {bidRange}
                    </Typography>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      </ResearchDetailSection>

      <ResearchDetailSection title="Safe next step">
        <Card variant="low" padding="sm" className="border-outline-weak border">
          <Typography variant="bodyMedium">
            Compare these terms with Search Console country evidence and the intended audience of
            the target page or campaign. Use the market rank as a planning signal, not as automatic
            approval to localize content or increase spend.
          </Typography>
        </Card>
      </ResearchDetailSection>

      <ResearchDetailSection title="Evidence limits">
        <Typography variant="bodySmall" className="text-on-surface-variant">
          Demand, competition, and bid ranges are provider estimates. They do not prove current
          rankings, qualified traffic, conversions, or product-market fit in this country.
        </Typography>
      </ResearchDetailSection>
    </ResearchDetailPane>
  );
}

export function CompetitorResearchDetailsPane({ competitor }: { competitor: CompetitorDomain }) {
  return (
    <ResearchDetailPane
      ariaLabel="Competitor research details"
      badges={
        <Badge variant="tonal" color="primary" size="sm">
          Recorded competitor evidence
        </Badge>
      }
      summary="Review patterns found in the recorded competitor pages and the opportunities directly supported by that evidence."
    >
      <ResearchDetailSection title="Recorded coverage">
        <div className="ops-research-detail-pane__metrics">
          <ResearchDetailMetric label="Pages" value={formatNumber(competitor.pageCount)} />
          <ResearchDetailMetric label="Keywords" value={formatNumber(competitor.keywordCount)} />
          <ResearchDetailMetric
            label="Best position"
            value={
              competitor.bestPosition === undefined
                ? 'Not available'
                : formatNumber(competitor.bestPosition)
            }
          />
          <ResearchDetailMetric
            label="Patterns"
            value={formatNumber(competitor.topPatterns.length)}
          />
        </div>
      </ResearchDetailSection>

      <ResearchDetailSection title="Content patterns">
        <ResearchInlineList
          items={competitor.topPatterns}
          emptyMessage="No content pattern was recorded for this domain."
        />
      </ResearchDetailSection>

      <ResearchDetailSection title="Recorded page types">
        <ResearchInlineList
          items={competitor.pageTypes}
          emptyMessage="No page type was recorded for this domain."
        />
      </ResearchDetailSection>

      <ResearchDetailSection title="Supported opportunities">
        <ResearchBulletList
          items={competitor.opportunities}
          emptyMessage="No specific opportunity was supported for this domain."
        />
      </ResearchDetailSection>

      <ResearchDetailSection title="Evidence limits">
        <Typography variant="bodySmall" className="text-on-surface-variant">
          This analysis covers only recorded pages and keywords. It does not infer the domain’s full
          strategy, authority, traffic, or conversion performance.
        </Typography>
      </ResearchDetailSection>
    </ResearchDetailPane>
  );
}

export function SerpResearchDetailsPane({ snapshot }: { snapshot: SerpSnapshot }) {
  return (
    <ResearchDetailPane
      ariaLabel="Search-result landscape details"
      badges={
        <>
          <Badge variant="tonal" color="primary" size="sm">
            Recorded SERP evidence
          </Badge>
          <Badge variant="tonal" color="secondary" size="sm">
            {snapshot.country} · {snapshot.language}
          </Badge>
        </>
      }
      summary="Use the recorded result landscape to understand intent and page expectations before planning content or an experiment."
    >
      <ResearchDetailSection title="Snapshot context">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <ResearchDetailFact label="Target page" value={snapshot.routePath ?? 'Not recorded'} />
          <ResearchDetailFact
            label="Captured"
            value={snapshot.capturedAt ? formatDateTime(snapshot.capturedAt) : 'Not recorded'}
          />
          <ResearchDetailFact label="Results recorded" value={formatNumber(snapshot.resultCount)} />
          <ResearchDetailFact
            label="Competitor domains"
            value={formatNumber(snapshot.competitorCount)}
          />
        </dl>
      </ResearchDetailSection>

      <ResearchDetailSection title="Observed intent">
        <Typography variant="bodyMedium">{snapshot.intent}</Typography>
      </ResearchDetailSection>

      <ResearchDetailSection title="Top domains">
        <ResearchInlineList
          items={snapshot.topDomains}
          emptyMessage="No top domain was recorded in this snapshot."
        />
      </ResearchDetailSection>

      <ResearchDetailSection title="People also ask">
        <ResearchBulletList
          items={snapshot.peopleAlsoAsk}
          emptyMessage="No related question was recorded in this snapshot."
        />
      </ResearchDetailSection>

      <ResearchDetailSection title="Supported opportunities">
        <ResearchBulletList
          items={snapshot.opportunities}
          emptyMessage="No specific opportunity was supported by this snapshot."
        />
      </ResearchDetailSection>

      <ResearchDetailSection title="Evidence limits">
        <Typography variant="bodySmall" className="text-on-surface-variant">
          Search results can change. This is recorded evidence for one market and language, not a
          live ranking guarantee or proof that a proposed page will perform.
        </Typography>
      </ResearchDetailSection>
    </ResearchDetailPane>
  );
}

export function MetadataExperimentDetailsPane({ experiment }: { experiment: MetadataExperiment }) {
  return (
    <ResearchDetailPane
      ariaLabel="Metadata experiment details"
      badges={
        <>
          <Badge
            variant="tonal"
            color={experiment.priority === 'p0' ? 'warning' : 'info'}
            size="sm"
          >
            {experiment.priority.toUpperCase()}
          </Badge>
          <Badge variant="tonal" color="secondary" size="sm">
            Proposed experiment
          </Badge>
        </>
      }
      summary="Review the proposed metadata, its rationale, and the measurement boundary before treating it as an approved change."
    >
      <ResearchDetailSection title="Experiment target">
        <dl className="grid gap-4">
          <ResearchDetailFact label="Page" value={experiment.routePath} />
          <ResearchDetailFact label="Primary keyword" value={experiment.primaryKeyword} />
          <ResearchDetailFact
            label="Current title"
            value={experiment.currentTitle ?? 'Not captured'}
          />
          <ResearchDetailFact label="Proposed title" value={experiment.proposedTitle} />
          <ResearchDetailFact
            label="Current description"
            value={experiment.currentDescription ?? 'Not captured'}
          />
          <ResearchDetailFact label="Proposed description" value={experiment.proposedDescription} />
        </dl>
      </ResearchDetailSection>

      <ResearchDetailSection title="Why test this">
        <Typography variant="bodyMedium">{experiment.rationale}</Typography>
      </ResearchDetailSection>

      <ResearchDetailSection title="Expected impact">
        <Typography variant="bodyMedium">{experiment.expectedImpact}</Typography>
      </ResearchDetailSection>

      <ResearchDetailSection title="Measurement boundary">
        <Typography variant="bodySmall" className="text-on-surface-variant">
          This proposal remains a hypothesis until it is reviewed, published through the page-owning
          workflow, and measured against an explicit baseline and verification window.
        </Typography>
      </ResearchDetailSection>
    </ResearchDetailPane>
  );
}

function competitionComparison(current?: number, average?: number): string {
  if (current === undefined || average === undefined) return 'Not enough recorded evidence';
  const difference = Math.round(current - average);
  if (Math.abs(difference) < 3) return 'Close to the compared-market average';
  return `${Math.abs(difference)} points ${difference > 0 ? 'higher' : 'lower'} than the compared-market average`;
}

function formatBidRange(
  keyword: KeywordMarket['topKeywords'][number],
  fallbackCurrency?: string,
): string | undefined {
  if (keyword.lowTopOfPageBidMicros === undefined || keyword.highTopOfPageBidMicros === undefined) {
    return undefined;
  }
  const currency = keyword.currencyCode ?? fallbackCurrency;
  if (!currency) return undefined;
  try {
    const formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    });
    return `Estimated top-of-page bid ${formatter.format(keyword.lowTopOfPageBidMicros / 1_000_000)}–${formatter.format(keyword.highTopOfPageBidMicros / 1_000_000)}`;
  } catch {
    return undefined;
  }
}
