import { adsDoctor } from '../doctor/run.js';
import type { AdsCliOptions } from '../options.js';

export async function adsValidate(options: AdsCliOptions): Promise<number> {
  return adsDoctor(options);
}
