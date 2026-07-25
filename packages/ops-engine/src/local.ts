import { randomUUID } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  promises as fs,
  type MakeDirectoryOptions,
} from 'node:fs';
import path from 'node:path';
import { resolveControlPlaneArtifactPath, type ControlPlaneJsonArtifact } from './control-plane.js';
import type {
  ApprovalStore,
  ArtifactStore,
  LockStore,
  OpsArtifactRecord,
  OpsExecutionState,
  OpsLockRequest,
} from './ports.js';
import {
  hashOpsValue,
  opsApprovalRecordSchema,
  opsLockLeaseSchema,
  opsMutationReceiptSchema,
  type OpsApprovalRecord,
  type OpsLockLease,
  type OpsMutationReceipt,
} from './safety.js';

const loadedEnvironmentDirectories = new Set<string>();
const LOCAL_ENVIRONMENT_FILES = ['.env.local', '.env'] as const;

function loadEnvironmentFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile(filePath);
    return;
  }
  const text = readFileSync(filePath, 'utf8');
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

function loadEnvironmentDirectory(directory: string): void {
  const resolved = path.resolve(directory);
  if (loadedEnvironmentDirectories.has(resolved)) return;
  loadedEnvironmentDirectories.add(resolved);
  for (const fileName of LOCAL_ENVIRONMENT_FILES) {
    loadEnvironmentFile(path.join(resolved, fileName));
  }
}

export function loadLocalEnvironment(options: { appDir?: string } = {}): void {
  try {
    if (options.appDir) loadEnvironmentDirectory(options.appDir);
    loadEnvironmentDirectory(process.cwd());
    if (process.env.INIT_CWD) loadEnvironmentDirectory(process.env.INIT_CWD);
  } catch {
    // Local command environment discovery is best-effort.
  }
}

function findWorkspaceRoot(start: string): string | null {
  let current = path.resolve(start);
  while (true) {
    if (existsSync(path.join(current, 'pnpm-workspace.yaml'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function resolveControlPlaneWorkingDirectory(
  input?: string,
  options: { baseCwd?: string } = {},
): string {
  const baseCwd = path.resolve(options.baseCwd ?? process.cwd());
  if (!input?.trim()) return baseCwd;
  if (path.isAbsolute(input)) return path.resolve(input);

  const workspaceRoot = findWorkspaceRoot(baseCwd);
  if (workspaceRoot) {
    const workspaceRelative = path.resolve(workspaceRoot, input);
    if (existsSync(workspaceRelative)) return workspaceRelative;
  }

  return path.resolve(baseCwd, input);
}

export function writeControlPlaneJsonArtifact(args: {
  cwd: string;
  outputPath?: string;
  defaultRelativePath: string;
  value: unknown;
  errorCode?: string;
  label?: string;
}): ControlPlaneJsonArtifact {
  const artifact = resolveControlPlaneArtifactPath({
    cwd: args.cwd,
    outputPath: args.outputPath,
    defaultRelativePath: args.defaultRelativePath,
    errorCode: args.errorCode,
    label: args.label,
  });
  mkdirSync(path.dirname(artifact.path), { recursive: true });
  writeFileSync(artifact.path, `${JSON.stringify(args.value, null, 2)}\n`, 'utf8');
  return artifact;
}

async function ensureDirectory(directory: string, options?: MakeDirectoryOptions): Promise<void> {
  await fs.mkdir(directory, options ?? { recursive: true });
}

async function readJsonFile(filePath: string): Promise<unknown | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as unknown;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await ensureDirectory(path.dirname(filePath));
  const temporaryPath = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
    mode: 0o600,
  });
  await fs.rename(temporaryPath, filePath);
}

function stateFile(directory: string, identity: string): string {
  return path.join(directory, `${hashOpsValue(identity)}.json`);
}

export class LocalArtifactStore implements ArtifactStore {
  readonly durability = 'local' as const;
  private readonly artifactsDirectory: string;
  private readonly receiptsDirectory: string;

  constructor(baseDirectory: string) {
    this.artifactsDirectory = path.join(baseDirectory, 'artifacts');
    this.receiptsDirectory = path.join(baseDirectory, 'receipts');
  }

  async put<T>(record: OpsArtifactRecord<T>): Promise<void> {
    await writeJsonAtomic(stateFile(this.artifactsDirectory, record.id), record);
  }

  async get<T>(id: string): Promise<OpsArtifactRecord<T> | null> {
    return (await readJsonFile(
      stateFile(this.artifactsDirectory, id),
    )) as OpsArtifactRecord<T> | null;
  }

  async hasReceiptForPlan(planHash: string): Promise<boolean> {
    try {
      await fs.access(stateFile(this.receiptsDirectory, planHash));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }

  async recordReceipt(receiptInput: OpsMutationReceipt): Promise<void> {
    const receipt = opsMutationReceiptSchema.parse(receiptInput);
    const filePath = stateFile(this.receiptsDirectory, receipt.planHash);
    await ensureDirectory(this.receiptsDirectory);
    try {
      await fs.writeFile(filePath, `${JSON.stringify(receipt, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error('[OPS_RECEIPT_REPLAY] A receipt already exists for this plan.');
      }
      throw error;
    }
  }
}

export class LocalApprovalStore implements ApprovalStore {
  readonly durability = 'local' as const;

  constructor(private readonly directory: string) {}

  async put(approvalInput: OpsApprovalRecord): Promise<void> {
    const approval = opsApprovalRecordSchema.parse(approvalInput);
    await writeJsonAtomic(stateFile(this.directory, approval.approvalId), approval);
  }

  async get(approvalId: string): Promise<OpsApprovalRecord | null> {
    const value = await readJsonFile(stateFile(this.directory, approvalId));
    if (value === null) return null;
    return opsApprovalRecordSchema.parse(value);
  }
}

export class LocalLockStore implements LockStore {
  readonly durability = 'local' as const;
  readonly atomic = true;
  private readonly counterPath: string;

  constructor(private readonly directory: string) {
    this.counterPath = path.join(directory, 'fencing-counter');
  }

  private leasePath(lockId: string): string {
    return stateFile(this.directory, lockId);
  }

  private async nextFencingValue(previous: number): Promise<number> {
    const currentText = await fs.readFile(this.counterPath, 'utf8').catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '{"value":0}';
      throw error;
    });
    const currentInput = JSON.parse(currentText) as { value?: unknown };
    const current = typeof currentInput.value === 'number' ? currentInput.value : 0;
    const next = Math.max(Number.isFinite(current) ? current : 0, previous) + 1;
    await writeJsonAtomic(`${this.counterPath}.json`, { value: next });
    await fs.rename(`${this.counterPath}.json`, this.counterPath);
    return next;
  }

  async acquire(request: OpsLockRequest): Promise<OpsLockLease | null> {
    await ensureDirectory(this.directory);
    const leasePath = this.leasePath(request.lockId);
    const existingInput = await readJsonFile(leasePath);
    let previousFencingValue = 0;
    if (existingInput !== null) {
      const existing = opsLockLeaseSchema.parse(existingInput);
      previousFencingValue = existing.fencingValue;
      if (Date.parse(existing.expiresAt) > Date.parse(request.now)) return null;
      await fs.unlink(leasePath).catch((error: unknown) => {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      });
    }
    const lease: OpsLockLease = {
      schemaVersion: 1,
      kind: 'ops.lock-lease',
      lockId: request.lockId,
      owner: request.owner,
      leaseToken: randomUUID(),
      fencingValue: await this.nextFencingValue(previousFencingValue),
      acquiredAt: request.now,
      expiresAt: new Date(Date.parse(request.now) + request.ttlMs).toISOString(),
    };
    try {
      await fs.writeFile(leasePath, `${JSON.stringify(lease, null, 2)}\n`, {
        encoding: 'utf8',
        flag: 'wx',
        mode: 0o600,
      });
      return lease;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') return null;
      throw error;
    }
  }

  async renew(leaseInput: OpsLockLease, ttlMs: number, now: string): Promise<OpsLockLease> {
    const lease = opsLockLeaseSchema.parse(leaseInput);
    await this.assertCurrent(lease, now);
    const renewed = {
      ...lease,
      expiresAt: new Date(Date.parse(now) + ttlMs).toISOString(),
    };
    await writeJsonAtomic(this.leasePath(lease.lockId), renewed);
    return renewed;
  }

  async release(leaseInput: OpsLockLease): Promise<void> {
    const lease = opsLockLeaseSchema.parse(leaseInput);
    const currentInput = await readJsonFile(this.leasePath(lease.lockId));
    if (currentInput === null) {
      throw new Error('[OPS_LOCK_OWNER_MISMATCH] Lock ownership has changed.');
    }
    const current = opsLockLeaseSchema.parse(currentInput);
    if (
      current.leaseToken !== lease.leaseToken ||
      current.owner !== lease.owner ||
      current.fencingValue !== lease.fencingValue
    ) {
      throw new Error('[OPS_LOCK_OWNER_MISMATCH] Lock ownership has changed.');
    }
    await fs.unlink(this.leasePath(lease.lockId));
  }

  async assertCurrent(leaseInput: OpsLockLease, now: string): Promise<void> {
    const lease = opsLockLeaseSchema.parse(leaseInput);
    const currentInput = await readJsonFile(this.leasePath(lease.lockId));
    if (currentInput === null) {
      throw new Error('[OPS_LOCK_OWNER_MISMATCH] Lock ownership has changed.');
    }
    const current = opsLockLeaseSchema.parse(currentInput);
    if (
      current.leaseToken !== lease.leaseToken ||
      current.owner !== lease.owner ||
      current.fencingValue !== lease.fencingValue
    ) {
      throw new Error('[OPS_LOCK_OWNER_MISMATCH] Lock ownership has changed.');
    }
    if (Date.parse(current.expiresAt) <= Date.parse(now)) {
      throw new Error('[OPS_LOCK_EXPIRED] Lock lease is expired.');
    }
  }
}

export function createLocalOpsExecutionState(baseDirectory: string): OpsExecutionState {
  return {
    artifacts: new LocalArtifactStore(baseDirectory),
    approvals: new LocalApprovalStore(path.join(baseDirectory, 'approvals')),
    locks: new LocalLockStore(path.join(baseDirectory, 'locks')),
  };
}
