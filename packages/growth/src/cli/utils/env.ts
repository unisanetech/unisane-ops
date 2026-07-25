import * as fs from 'node:fs';
import * as path from 'node:path';

export interface LoadEnvLocalOptions {
  appDir?: string;
}

const loadedDirs = new Set<string>();
const ENV_FILE_NAMES = ['.env.local', '.env'] as const;

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) return;
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(filePath);
    return;
  }
  const text = fs.readFileSync(filePath, 'utf8');
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function loadFromDirectory(directory: string): void {
  const resolved = path.resolve(directory);
  if (loadedDirs.has(resolved)) return;
  loadedDirs.add(resolved);
  for (const fileName of ENV_FILE_NAMES) loadEnvFile(path.join(resolved, fileName));
}

export function loadEnvLocal(options: LoadEnvLocalOptions = {}): void {
  try {
    if (options.appDir) loadFromDirectory(options.appDir);
    loadFromDirectory(process.cwd());
    if (process.env.INIT_CWD) loadFromDirectory(process.env.INIT_CWD);
  } catch {
    // Local CLI environment discovery is best-effort.
  }
}
