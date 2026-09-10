import type { GrowthCapabilityReview } from '@unisane/growth/console';
import { Card } from '@unisane/ui/card';
import { Typography } from '@unisane/ui/typography';
import { ContentSection } from '../../shared/content.js';

export function MetaCapabilityList({ review }: { review?: GrowthCapabilityReview }) {
  return (
    <ContentSection
      title="What Ops can do with Meta"
      description={
        review?.presentation.whyItMatters ??
        'Capability discovery is not supplied by this console host.'
      }
    >
      {review && (
        <>
          <Typography variant="bodyMedium">{review.presentation.headline}</Typography>
          <div className="grid gap-3">
            {review.capabilities.map((item) => (
              <Card key={item.id} variant="outlined" padding="md">
                <Typography variant="panelTitle">{item.title}</Typography>
                <Typography variant="bodyMedium">
                  {item.status === 'ready-to-read'
                    ? 'Recorded prerequisites satisfied for reading'
                    : item.status === 'not-implemented'
                      ? 'Not implemented yet'
                      : 'Not available for execution'}
                </Typography>
                {item.reasons.map((reason, index) => (
                  <Typography
                    key={`${item.id}-${index}`}
                    variant="bodySmall"
                    className="text-on-surface-variant mt-2"
                  >
                    {reason}
                  </Typography>
                ))}
                <Typography variant="bodyMedium" className="mt-2">
                  Next: {item.nextStep}
                </Typography>
                <Typography variant="bodySmall" className="text-on-surface-variant mt-2">
                  Execution interfaces: {item.executionSurfaces.join(', ') || 'None exposed'}. Live
                  verification has not been performed by this review.
                </Typography>
              </Card>
            ))}
          </div>
        </>
      )}
    </ContentSection>
  );
}
