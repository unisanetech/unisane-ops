import type { ConsoleScreenProps } from '../../contracts.js';
import { ContentSection, EmptyState, Summary } from '../../shared/content.js';
import { RecommendationList } from '../../shared/recommendation-list.js';
import { advertisingConnectionPath } from './view.js';

export function AdvertisingRecommendations(props: ConsoleScreenProps) {
  const recommendations = props.state.recommendations.items.filter(
    (item) =>
      item.lane === 'advertising' &&
      (props.route.advertisingPlatform === 'all' ||
        !item.provider ||
        item.provider === props.route.advertisingPlatform),
  );
  return (
    <>
      <Summary
        headline={
          recommendations.length
            ? `${recommendations.length} evidence-backed advertising ${recommendations.length === 1 ? 'recommendation is' : 'recommendations are'} available.`
            : 'No advertising recommendation is supported by the current evidence.'
        }
        detail={props.state.recommendations.summary}
      />
      <ContentSection title="Prioritized recommendations">
        {recommendations.length ? (
          <RecommendationList items={recommendations} {...props} />
        ) : (
          <EmptyState
            title="Refresh the evidence before optimizing spend."
            description="Recommendations appear only when the cross-channel evidence supports a specific next action."
            actionLabel="Review connection"
            onAction={() =>
              props.navigate(advertisingConnectionPath(props.route.advertisingPlatform))
            }
          />
        )}
      </ContentSection>
    </>
  );
}
