import { existsSync } from 'node:fs';
import path from 'node:path';

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

  const callerRelative = path.resolve(baseCwd, input);
  if (existsSync(callerRelative)) return callerRelative;

  const workspaceRoot = findWorkspaceRoot(baseCwd);
  if (workspaceRoot) {
    const workspaceRelative = path.resolve(workspaceRoot, input);
    if (existsSync(workspaceRelative)) return workspaceRelative;
  }

  return callerRelative;
}
