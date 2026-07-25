import { marketingStatus } from '../../marketing/status/run.js';
import type { AnalyticsCliOptions } from '../options.js';

export async function analyticsStatus(options: AnalyticsCliOptions): Promise<number> {
  return marketingStatus(options, 'analytics');
}
