import { mkdtemp, rm, writeFile, readdir, symlink, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, it, expect } from 'vitest';
import { hashOpsValue } from '@unisane/ops-engine';
import { createGrowthReportEvidence } from '@unisane/growth/actions';
import { LocalMetaReportStore } from './meta-report-store.js';
const binding = {
  projectId: 'store',
  environmentId: 'production',
  connectionId: 'meta',
  accountId: 'act_123',
};
const report = {
  ...binding,
  schemaVersion: 1,
  actionId: 'growth.reports.read',
  reportType: 'campaign',
  startDate: '2026-09-01',
  endDate: '2026-09-05',
  capturedAt: '2026-09-06T00:00:00Z',
  timeZoneBasis: 'unavailable',
  attributionBasis: 'provider-default-not-verified',
  persisted: false,
  partial: false,
  observedRowCount: 0,
  rowsTruncated: false,
  rows: [],
  presentation: { headline: 'No rows', whyItMatters: 'Not tracking proof' },
};
const roots: string[] = [];
async function root() {
  const value = await mkdtemp(path.join(tmpdir(), 'meta-history-test-'));
  roots.push(value);
  return value;
}
afterEach(async () => {
  for (const value of roots.splice(0)) await rm(value, { recursive: true, force: true });
});
describe('local Meta evidence store', () => {
  it('survives a new instance and concurrent identical writes without losing history', async () => {
    const cwd = await root();
    const store = new LocalMetaReportStore(cwd, binding);
    const evidence = createGrowthReportEvidence(report, report.capturedAt);
    await Promise.all([store.put(evidence), store.put(evidence)]);
    expect(await new LocalMetaReportStore(cwd, binding).list()).toEqual([evidence]);
    expect(
      await new LocalMetaReportStore(cwd, { ...binding, environmentId: 'test' }).list(),
    ).toEqual([]);
    expect(
      await new LocalMetaReportStore(cwd, { ...binding, accountId: 'act_999' }).list(),
    ).toEqual([]);
  });
  it('rejects corrupted records and ignores interrupted temporary writes', async () => {
    const cwd = await root();
    const store = new LocalMetaReportStore(cwd, binding);
    const evidence = createGrowthReportEvidence(report, report.capturedAt);
    await store.put(evidence);
    const directory = path.join(cwd, '.unisane/ops/growth/reports', hashOpsValue(binding));
    await writeFile(path.join(directory, 'interrupted.tmp'), 'partial');
    expect(await store.list()).toHaveLength(1);
    await writeFile(path.join(directory, `${evidence.evidenceId}.json`), '{}');
    await expect(store.list()).rejects.toThrow();
    expect((await readdir(directory)).length).toBe(2);
  });
  it('refuses symlink storage roots and foreign report records', async () => {
    const cwd = await root();
    const elsewhere = await root();
    await symlink(elsewhere, path.join(cwd, '.unisane'));
    const store = new LocalMetaReportStore(cwd, binding);
    await expect(store.put(createGrowthReportEvidence(report, report.capturedAt))).rejects.toThrow(
      'local directories',
    );
    const other = await root();
    await mkdir(path.join(other, '.unisane'));
    await expect(
      new LocalMetaReportStore(other, { ...binding, projectId: 'other' }).put(
        createGrowthReportEvidence(report, report.capturedAt),
      ),
    ).rejects.toThrow();
  });
});
