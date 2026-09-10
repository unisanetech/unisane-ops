import path from 'node:path';
import { constants } from 'node:fs';
import { lstat, mkdir, readdir, open, realpath } from 'node:fs/promises';
import { createSqliteOpsExecutionState, type SqliteExecutionDatabase } from '@unisane/ops-engine';
import { createLocalOpsExecutionState, LocalOpsMutationRunStore } from '@unisane/ops-engine/local';
/** Store selection never silently discards attempts from another backend. */
export async function openScopedExecutionStore(
  projectRoot: string,
  backend: 'local' | 'sqlite',
  options: { segments: string[]; prefix: string; legacyRunDirectory?: string },
) {
  const prefix = options.prefix;
  let directory = await realpath(projectRoot);
  for (const segment of options.segments) {
    directory = path.join(directory, segment);
    await mkdir(directory, { mode: 0o700 }).catch((error) => {
      if (error.code !== 'EEXIST') throw error;
    });
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw new Error(
        `[${prefix}_STATE_PATH_INVALID] Execution state must use private local directories.`,
      );
  }
  const legacy = path.join(directory, 'execution');
  const databasePath = path.join(directory, 'execution.sqlite');
  const exists = async (file: string) =>
    lstat(file).then(
      () => true,
      (error) => {
        if (error.code === 'ENOENT') return false;
        throw error;
      },
    );
  if (backend === 'sqlite') {
    if (options.legacyRunDirectory) {
      const runs = path.join(directory, options.legacyRunDirectory);
      if (await exists(runs)) {
        const stat = await lstat(runs);
        if (!stat.isDirectory() || stat.isSymbolicLink() || (await readdir(runs)).length)
          throw new Error(
            `[${prefix}_STATE_MIGRATION_REQUIRED] Existing mutation runs require reviewed migration. Preserve existing history.`,
          );
      }
    }
    if (await exists(legacy)) {
      const stat = await lstat(legacy);
      if (!stat.isDirectory() || stat.isSymbolicLink() || (await readdir(legacy)).length)
        throw new Error(
          `[${prefix}_STATE_MIGRATION_REQUIRED] Existing local records require reviewed migration before selecting SQLite. Do not delete attempts to bypass this check.`,
        );
    }
  }
  if (backend === 'local' && (await exists(databasePath)))
    throw new Error(
      `[${prefix}_STATE_BACKEND_MISMATCH] SQLite state exists. Keep the current backend.`,
    );
  const selectionPath = path.join(directory, 'execution-backend.json');
  try {
    const marker = await open(
      selectionPath,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      0o600,
    );
    try {
      await marker.writeFile(JSON.stringify({ backend }));
      await marker.sync();
    } finally {
      await marker.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
  }
  const selection = await open(selectionPath, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const info = await selection.stat();
    if (!info.isFile() || info.nlink !== 1 || info.size > 256)
      throw new Error(`[${prefix}_STATE_PATH_INVALID] Invalid backend selection.`);
    const selected = JSON.parse(await selection.readFile('utf8')) as { backend?: unknown };
    if (selected.backend !== backend)
      throw new Error(
        `[${prefix}_STATE_MIGRATION_REQUIRED] Backend selection is persisted. Reviewed migration is required to change it.`,
      );
  } finally {
    await selection.close();
  }
  if (backend === 'local') {
    if (await exists(databasePath))
      throw new Error(
        `[${prefix}_STATE_BACKEND_MISMATCH] SQLite state exists. Keep the configured backend to preserve attempts and approvals.`,
      );
    if (await exists(legacy)) {
      const stat = await lstat(legacy);
      if (!stat.isDirectory() || stat.isSymbolicLink())
        throw new Error(`[${prefix}_STATE_PATH_INVALID] Invalid execution directory.`);
    }
    return {
      state: createLocalOpsExecutionState(legacy),
      runStore: new LocalOpsMutationRunStore(
        options.legacyRunDirectory
          ? path.join(directory, options.legacyRunDirectory)
          : path.join(legacy, 'runs'),
      ),
      close: () => {},
    };
  }

  for (const file of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) {
    if (await exists(file)) {
      const stat = await lstat(file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1)
        throw new Error(`[${prefix}_STATE_PATH_INVALID] Invalid execution database file.`);
    }
  }
  const file = await open(
    databasePath,
    constants.O_CREAT | constants.O_RDWR | constants.O_NOFOLLOW,
    0o600,
  );
  await file.chmod(0o600);
  await file.close();
  const sqliteModuleName = 'node:sqlite';
  const { DatabaseSync } = (await import(sqliteModuleName).catch(() => {
    throw new Error(
      `[${prefix}_SQLITE_RUNTIME_REQUIRED] SQLite execution requires Node.js 22.13 or newer.`,
    );
  })) as { DatabaseSync: new (file: string) => SqliteExecutionDatabase & { close(): void } };
  const database = new DatabaseSync(databasePath);
  try {
    const stores = createSqliteOpsExecutionState(database);
    return { ...stores, close: () => database.close() };
  } catch (error) {
    database.close();
    throw error;
  }
}
