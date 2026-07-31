import type { MarketingConsoleState } from '@unisane/growth/console';
import { Badge } from '@unisane/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@unisane/ui/table';
import { formatNumber, healthStatusLabel, statusColor } from '../../lib/format.js';
import { TableFrame } from '../../shared/controls.js';

type KeywordResearch = MarketingConsoleState['keywordResearch'];
type KeywordRow = KeywordResearch['matrix'][number];
type FaqResearch = MarketingConsoleState['faqResearch'];
type CompetitorResearch = MarketingConsoleState['competitorResearch'];
type SeoIntelligence = MarketingConsoleState['seoIntelligence'];

export function KeywordTable({ rows }: { rows: KeywordRow[] }) {
  return (
    <TableFrame label="Keyword research">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Keyword</TableHead>
            <TableHead>Cluster</TableHead>
            <TableHead>Total demand</TableHead>
            <TableHead>Best market</TableHead>
            <TableHead>Markets</TableHead>
            <TableHead>Advertiser competition</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.normalizedTerm}-${row.clusterId}`}>
              <TableCell>{row.term}</TableCell>
              <TableCell>{row.clusterLabel}</TableCell>
              <TableCell>{formatNumber(row.totalKnownVolume)}</TableCell>
              <TableCell>{row.bestMarket ?? 'Not available'}</TableCell>
              <TableCell>{formatNumber(row.marketCount)}</TableCell>
              <TableCell>{formatCompetition(row)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableFrame>
  );
}

export function ClusterTable({ research }: { research: KeywordResearch }) {
  return (
    <TableFrame label="Keyword clusters">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Focus area</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead>Provider-estimated demand</TableHead>
            <TableHead>Best market</TableHead>
            <TableHead>Advertiser competition</TableHead>
            <TableHead>Leading keywords</TableHead>
            <TableHead>Recommended use</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {research.clusters.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.label}</TableCell>
              <TableCell>{formatNumber(item.metricCount)}</TableCell>
              <TableCell>{formatNumber(item.totalKnownVolume)}</TableCell>
              <TableCell>{item.bestMarket ?? 'Not available'}</TableCell>
              <TableCell>
                {item.averageCompetitionIndex === undefined
                  ? 'Not available'
                  : `${Math.round(item.averageCompetitionIndex)}/100`}
              </TableCell>
              <TableCell>
                {item.topKeywords
                  .slice(0, 3)
                  .map((row) => row.term)
                  .join(', ')}
              </TableCell>
              <TableCell>{item.recommendedUse}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableFrame>
  );
}

export function MarketTable({ research }: { research: KeywordResearch }) {
  return (
    <TableFrame label="Keyword markets">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>Keyword measurements</TableHead>
            <TableHead>Provider-estimated demand</TableHead>
            <TableHead>Average advertiser competition</TableHead>
            <TableHead>Leading keywords</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {research.markets.map((item) => (
            <TableRow key={item.market}>
              <TableCell>{item.market}</TableCell>
              <TableCell>{formatNumber(item.metricCount)}</TableCell>
              <TableCell>{formatNumber(item.totalKnownVolume)}</TableCell>
              <TableCell>
                {item.averageCompetitionIndex === undefined
                  ? 'Not available'
                  : `${Math.round(item.averageCompetitionIndex)}/100`}
              </TableCell>
              <TableCell>
                {item.topKeywords
                  .slice(0, 4)
                  .map((row) => row.term)
                  .join(', ')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableFrame>
  );
}

export function QuestionTable({ research }: { research: FaqResearch }) {
  return (
    <TableFrame label="Question and FAQ plan">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead>Target page</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Measured demand</TableHead>
            <TableHead>Markets</TableHead>
            <TableHead>Proof</TableHead>
            <TableHead>Answer intent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {research.questions.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.question}</TableCell>
              <TableCell>{item.routePath}</TableCell>
              <TableCell>{item.priority}</TableCell>
              <TableCell>
                {item.avgMonthlySearches === undefined
                  ? 'Not available'
                  : formatNumber(item.avgMonthlySearches)}
              </TableCell>
              <TableCell>{formatNumber(item.marketCount)}</TableCell>
              <TableCell>
                <Badge variant="tonal" color={statusColor(item.proofStatus)} size="sm">
                  {healthStatusLabel(item.proofStatus)}
                </Badge>
              </TableCell>
              <TableCell>{item.answerIntent}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableFrame>
  );
}

export function CompetitorTables({ research }: { research: CompetitorResearch }) {
  return (
    <TableFrame label="Competitor domains">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Domain</TableHead>
            <TableHead>Pages</TableHead>
            <TableHead>Keywords</TableHead>
            <TableHead>Best observed position</TableHead>
            <TableHead>Content patterns</TableHead>
            <TableHead>Opportunities</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {research.domains.map((item) => (
            <TableRow key={item.domain}>
              <TableCell>{item.domain}</TableCell>
              <TableCell>{item.pageCount}</TableCell>
              <TableCell>{item.keywordCount}</TableCell>
              <TableCell>{item.bestPosition ?? 'Not available'}</TableCell>
              <TableCell>{item.topPatterns.join(', ')}</TableCell>
              <TableCell>{item.opportunities.join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableFrame>
  );
}

export function SerpTables({ intelligence }: { intelligence: SeoIntelligence }) {
  return (
    <div className="grid gap-6">
      <TableFrame label="Search result landscapes">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Keyword</TableHead>
              <TableHead>Market</TableHead>
              <TableHead>Intent</TableHead>
              <TableHead>Top domains</TableHead>
              <TableHead>People also ask</TableHead>
              <TableHead>Opportunities</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intelligence.serp.snapshots.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.keyword}</TableCell>
                <TableCell>
                  {item.country} · {item.language}
                </TableCell>
                <TableCell>{item.intent}</TableCell>
                <TableCell>{item.topDomains.join(', ')}</TableCell>
                <TableCell>{item.peopleAlsoAsk.join(', ')}</TableCell>
                <TableCell>{item.opportunities.join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableFrame>
      <TableFrame label="Metadata experiments">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Page</TableHead>
              <TableHead>Primary keyword</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Proposed title</TableHead>
              <TableHead>Rationale</TableHead>
              <TableHead>Expected impact</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {intelligence.metadata.experiments.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.routePath}</TableCell>
                <TableCell>{item.primaryKeyword}</TableCell>
                <TableCell>{item.priority}</TableCell>
                <TableCell>{item.proposedTitle}</TableCell>
                <TableCell>{item.rationale}</TableCell>
                <TableCell>{item.expectedImpact}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableFrame>
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
