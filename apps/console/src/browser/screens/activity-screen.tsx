import { useMemo, useState } from 'react';
import { SelectField } from '@unisane/ui/select-field';
import type { ConsoleScreenProps } from '../contracts.js';
import { ContentSection, EmptyState, Summary } from '../shared/content.js';
import { FilterBar } from '../shared/controls.js';
import { ActivityItemCard } from '../shared/activity-item-card.js';

export function ActivityScreen({ state }: ConsoleScreenProps) {
  const [category, setCategory] = useState('all');
  const [provider, setProvider] = useState('all');
  const providerOptions = useMemo(
    () => [...new Set(state.activity.items.map((item) => item.providerLabel))].sort(),
    [state.activity.items],
  );
  const visible = state.activity.items.filter(
    (item) =>
      (category === 'all' || item.category === category) &&
      (provider === 'all' || item.providerLabel === provider),
  );

  return (
    <>
      <Summary headline={state.activity.headline} detail={state.activity.summary} />
      <ContentSection>
        <FilterBar>
          <SelectField
            label="Activity type"
            value={category}
            onValueChange={setCategory}
            options={[
              { value: 'all', label: 'All activity' },
              { value: 'changes', label: 'Changes' },
              { value: 'syncs', label: 'Data updates' },
              { value: 'errors', label: 'Errors' },
              { value: 'approvals', label: 'Approvals' },
            ]}
          />
          <SelectField
            label="Provider"
            value={provider}
            onValueChange={setProvider}
            options={[
              { value: 'all', label: 'All providers' },
              ...providerOptions.map((label) => ({ value: label, label })),
            ]}
          />
        </FilterBar>
      </ContentSection>
      <ContentSection title="History" description={`${visible.length} matching events.`}>
        {visible.length ? (
          <div className="grid gap-3">
            {visible.map((item) => (
              <ActivityItemCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No activity matches these filters."
            description="Choose a different activity type or provider to review the available history."
          />
        )}
      </ContentSection>
    </>
  );
}
