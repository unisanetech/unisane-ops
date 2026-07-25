import { closeSync, mkdirSync, openSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export async function withMarketingAdsApplyLock<T>(args: {
  cwd: string;
  environment: string;
  run: (lockPath: string) => Promise<T>;
}): Promise<T> {
  const safeEnvironment = args.environment.replace(/[^a-zA-Z0-9_.-]+/g, '_');
  const lockDirectory = path.join(args.cwd, '.unisane', 'marketing', safeEnvironment, 'locks');
  const lockPath = path.join(lockDirectory, 'ads-apply.lock.json');
  mkdirSync(lockDirectory, { recursive: true });

  let fd: number | null = null;
  try {
    fd = openSync(lockPath, 'wx');
    writeFileSync(
      fd,
      `${JSON.stringify(
        {
          family: 'ads-apply',
          environment: args.environment,
          startedAt: new Date().toISOString(),
          processId: process.pid,
        },
        null,
        2,
      )}\n`,
      'utf8',
    );
    return await args.run(lockPath);
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'EEXIST'
    ) {
      throw new Error(
        `[ADS_APPLY_LOCKED] Another ads apply is already running for environment '${args.environment}'.`,
      );
    }
    throw error;
  } finally {
    if (fd !== null) {
      closeSync(fd);
      unlinkSync(lockPath);
    }
  }
}
