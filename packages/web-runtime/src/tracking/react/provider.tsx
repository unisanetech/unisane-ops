'use client';

import type { ReactNode } from 'react';
import { WebTrackingClientContext } from './context';
import type { WebTrackingClient } from '../types';

export function WebTrackingProvider({
  client,
  children,
}: {
  client: WebTrackingClient;
  children: ReactNode;
}) {
  return (
    <WebTrackingClientContext.Provider value={client}>{children}</WebTrackingClientContext.Provider>
  );
}
