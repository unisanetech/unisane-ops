import { marketingValidate } from '../../marketing/validate/run.js';
import type { AdsCliOptions } from '../options.js';

export async function adsValidate(options: AdsCliOptions): Promise<number> {
  return marketingValidate(options);
}
