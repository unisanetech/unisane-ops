import type React from 'react';

export function FilterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))] items-end gap-3">
      {children}
    </div>
  );
}

export function TableFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="border-outline-soft bg-surface focus-visible:outline-primary overflow-x-auto rounded-sm border focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
    </div>
  );
}
