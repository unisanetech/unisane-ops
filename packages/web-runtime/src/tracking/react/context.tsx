'use client';

import { createContext, useContext } from 'react';
import type { WebTrackingClient } from '../types';

export const WebTrackingClientContext = createContext<WebTrackingClient | null>(null);

export function useOptionalWebTrackingClientContext(): WebTrackingClient | null {
  return useContext(WebTrackingClientContext);
}
