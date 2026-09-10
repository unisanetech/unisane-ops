import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { metaConnectionRecordSchema, type MetaConnectionRecord } from './connection.js';

function resolveRecordPath(projectRoot: string, recordPath: string): string {
  const root = path.resolve(projectRoot);
  const absolute = path.resolve(root, recordPath);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `[META_CONNECTION_PATH_OUTSIDE_PROJECT] Connection record must stay inside the project: ${recordPath}`,
    );
  }
  return absolute;
}

export function readMetaConnectionRecord(args: {
  projectRoot: string;
  recordPath: string;
}): MetaConnectionRecord | null {
  const absolute = resolveRecordPath(args.projectRoot, args.recordPath);
  if (!existsSync(absolute)) return null;
  return metaConnectionRecordSchema.parse(JSON.parse(readFileSync(absolute, 'utf8')) as unknown);
}

export function writeMetaConnectionRecord(args: {
  projectRoot: string;
  recordPath: string;
  connection: MetaConnectionRecord;
}): string {
  const absolute = resolveRecordPath(args.projectRoot, args.recordPath);
  const connection = metaConnectionRecordSchema.parse(args.connection);
  mkdirSync(path.dirname(absolute), { recursive: true });
  const temporary = `${absolute}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(connection, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  renameSync(temporary, absolute);
  return absolute;
}

export function removeMetaConnectionRecord(args: {
  projectRoot: string;
  recordPath: string;
}): boolean {
  const absolute = resolveRecordPath(args.projectRoot, args.recordPath);
  if (!existsSync(absolute)) return false;
  rmSync(absolute);
  return true;
}
