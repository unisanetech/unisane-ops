import * as fsp from 'node:fs/promises';
import * as path from 'node:path';

async function ensureDir(dirPath: string): Promise<void> {
  await fsp.mkdir(dirPath, { recursive: true });
}

export async function readJson<T = unknown>(filePath: string): Promise<T> {
  return JSON.parse(await fsp.readFile(filePath, 'utf8')) as T;
}

export async function writeJson(filePath: string, data: unknown, indent = 2): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fsp.writeFile(filePath, `${JSON.stringify(data, null, indent)}\n`, 'utf8');
}
