import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(
  readFileSync(join(root, 'tools/repository/standalone-integrity-policy.json'), 'utf8'),
);
const manifests = [];
for (const group of ['apps', 'packages']) {
  for (const entry of readdirSync(join(root, group), { withFileTypes: true })) {
    const path = join(root, group, entry.name, 'package.json');
    if (entry.isDirectory() && existsSync(path))
      manifests.push({ path, value: JSON.parse(readFileSync(path, 'utf8')) });
  }
}

const byName = new Map(manifests.map((entry) => [entry.value.name, entry]));
const errors = [];
if (manifests.length !== 14)
  errors.push(`expected 14 app/package manifests, found ${manifests.length}`);
for (const name of policy.acceptedPrivatePackages) {
  const entry = byName.get(name);
  if (!entry) errors.push(`accepted private package is absent: ${name}`);
  else if (entry.value.private === true)
    errors.push(`accepted private package is private: ${name}`);
  else if (entry.value.publishConfig?.access !== 'restricted')
    errors.push(`private package must use restricted access: ${name}`);
  else if (!entry.value.version) errors.push(`accepted private package lacks a version: ${name}`);
  else if (!entry.value.exports) errors.push(`accepted private package lacks exports: ${name}`);
}
for (const [name, admission] of Object.entries(policy.packageAdmissions)) {
  const entry = byName.get(name);
  if (!entry) errors.push(`admission package is absent: ${name}`);
  else if (admission.requiredPrivate === true && entry.value.private !== true)
    errors.push(`${name} must remain private`);
  else if (admission.registryAdmission === 'owner-decision' && admission.requiredPrivate !== null)
    errors.push(`${name} owner decision must not be pre-resolved`);
}
for (const name of byName.keys()) {
  if (!policy.acceptedPrivatePackages.includes(name) && !policy.packageAdmissions[name])
    errors.push(`package has no explicit admission disposition: ${name}`);
}

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  const privatePackageCount = policy.acceptedPrivatePackages.length;
  const privateCount = Object.values(policy.packageAdmissions).filter(
    (admission) => admission.requiredPrivate === true,
  ).length;
  const ownerDecisionCount = Object.values(policy.packageAdmissions).filter(
    (admission) => admission.registryAdmission === 'owner-decision',
  ).length;
  console.log(
    `Unisane Ops package contents verified: ${privatePackageCount} restricted packages, ${privateCount} private packages/apps, ${ownerDecisionCount} fail-closed owner decisions.`,
  );
}
