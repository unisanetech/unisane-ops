import { validateGrowthReportEvidence } from '@unisane/growth/actions';
import { constants } from 'node:fs';
import { lstat, mkdir, open, readdir, link, unlink } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { hashOpsValue } from '@unisane/ops-engine';
import { type GrowthReportBinding, type GrowthReportEvidence } from '@unisane/growth/contracts';

const maximumBytes = 4 * 1024 * 1024;
const maximumRecords = 1000;
export class LocalMetaReportStore {
  constructor(
    private readonly root: string,
    private readonly binding: GrowthReportBinding,
  ) {}
  private async directory(create: boolean): Promise<string | undefined> {
    let current = path.resolve(this.root);
    for (const segment of ['.unisane', 'ops', 'growth', 'reports', hashOpsValue(this.binding)]) {
      current = path.join(current, segment);
      if (create)
        await mkdir(current, { mode: 0o700 }).catch((error) => {
          if (error.code !== 'EEXIST') throw error;
        });
      let info;
      try {
        info = await lstat(current);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT' && !create) return undefined;
        throw error;
      }
      if (!info.isDirectory() || info.isSymbolicLink())
        throw new Error('Report storage must use local directories.');
    }
    return current;
  }
  private async readFile(directory: string, name: string): Promise<GrowthReportEvidence> {
    const file = await open(path.join(directory, name), constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
      const info = await file.stat();
      if (!info.isFile() || info.size > maximumBytes)
        throw new Error('Report evidence exceeds storage limits.');
      const value = validateGrowthReportEvidence(
        JSON.parse(await file.readFile('utf8')),
        this.binding,
      );
      if (name !== `${value.evidenceId}.json`)
        throw new Error('Report evidence filename does not match revision.');
      return value;
    } finally {
      await file.close();
    }
  }
  async put(input: GrowthReportEvidence): Promise<GrowthReportEvidence> {
    const record = validateGrowthReportEvidence(input, this.binding);
    const directory = (await this.directory(true))!;
    const bytes = JSON.stringify(record);
    if (Buffer.byteLength(bytes) > maximumBytes)
      throw new Error('Report evidence exceeds storage limits.');
    const temporary = path.join(directory, `${randomUUID()}.tmp`);
    const file = await open(temporary, 'wx', 0o600);
    try {
      await file.writeFile(bytes);
      await file.sync();
    } finally {
      await file.close();
    }
    try {
      await link(temporary, path.join(directory, `${record.evidenceId}.json`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    } finally {
      await unlink(temporary);
    }
    return this.readFile(directory, `${record.evidenceId}.json`);
  }
  async list(): Promise<GrowthReportEvidence[]> {
    const directory = await this.directory(false);
    if (!directory) return [];
    const names = await readdir(directory);
    if (names.length > maximumRecords)
      throw new Error(
        'Report history exceeds the bounded scan limit. Archive evidence before retrying.',
      );
    const records: GrowthReportEvidence[] = [];
    let totalBytes = 0;
    for (const name of names) {
      if (name.endsWith('.tmp')) continue;
      if (!/^[a-f0-9]{64}\.json$/.test(name)) throw new Error('Unexpected report evidence file.');
      const record = await this.readFile(directory, name);
      totalBytes += Buffer.byteLength(JSON.stringify(record));
      if (totalBytes > 16 * 1024 * 1024)
        throw new Error('Report history exceeds the bounded byte limit.');
      records.push(record);
    }
    return records;
  }
}
