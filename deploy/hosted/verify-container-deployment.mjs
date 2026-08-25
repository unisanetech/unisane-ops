import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const root = resolve(import.meta.dirname, '../../..');
const composeFile = resolve(import.meta.dirname, 'compose.integration.yaml');
const project = `unisane-ops-hosted-${process.pid}`;
const runtimeImage = 'unisane-ops-hosted-runtime:verification';
const integrationImage = 'unisane-ops-hosted-runtime:integration';
const secrets = await mkdtemp(join(tmpdir(), 'unisane-ops-hosted-'));
const passwordPath = join(secrets, 'postgres-password');
const urlPath = join(secrets, 'postgres-url');
const recoveryAdminUrlPath = join(secrets, 'postgres-recovery-admin-url');
await writeFile(passwordPath, 'integration-only\n', { mode: 0o600 });
await writeFile(urlPath, 'postgresql://ops:integration-only@postgres:5432/ops\n', { mode: 0o600 });
await writeFile(
  recoveryAdminUrlPath,
  'postgresql://ops:integration-only@postgres:5432/postgres\n',
  {
    mode: 0o600,
  },
);

const environment = {
  ...process.env,
  OPS_HOSTED_TEST_IMAGE: integrationImage,
  OPS_HOSTED_TEST_POSTGRES_PASSWORD_FILE: passwordPath,
  OPS_HOSTED_TEST_POSTGRES_URL_FILE: urlPath,
  OPS_HOSTED_TEST_POSTGRES_RECOVERY_ADMIN_URL_FILE: recoveryAdminUrlPath,
};

function run(command, arguments_) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, {
      cwd: root,
      env: environment,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code) =>
      code === 0 ? resolvePromise() : reject(new Error(`Container verification exited ${code}.`)),
    );
  });
}

function compose(arguments_) {
  return run('docker', ['compose', '-p', project, '-f', composeFile, ...arguments_]);
}

try {
  await compose(['build']);
  await run('docker', [
    'build',
    '--target',
    'runtime',
    '--tag',
    runtimeImage,
    '--file',
    'apps/hosted-runtime/Dockerfile',
    '.',
  ]);
  await run('docker', [
    'run',
    '--rm',
    '--entrypoint',
    'node',
    runtimeImage,
    '-e',
    "const fs=require('fs');const expected=['ops-engine','ops-hosted-postgresql','ops-hosted-runtime'];const actual=fs.readdirSync('/app/node_modules/@unisane').sort();if(process.getuid?.()!==1000||fs.existsSync('/app/test-fixtures')||JSON.stringify(actual)!==JSON.stringify(expected))process.exit(1);for(const file of ['gateway.js','migrate.js','probe.js','worker.js'])fs.accessSync('/app/dist/bin/'+file);",
  ]);
  await compose(['up', '--detach', '--wait', 'gateway', 'worker']);
  await compose(['run', '--rm', '--no-deps', 'verify']);
  await compose(['run', '--rm', '--no-deps', 'backup']);
  await compose(['run', '--rm', '--no-deps', 'restore']);
  await compose(['run', '--rm', '--no-deps', 'verify-restore']);
} finally {
  await compose(['down', '--volumes', '--remove-orphans']).catch(() => undefined);
  await rm(secrets, { recursive: true, force: true });
}
