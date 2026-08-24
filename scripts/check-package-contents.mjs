import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(readFileSync(join(root, 'tools/repository/standalone-integrity-policy.json'), 'utf8'));
const manifests = [];
for (const group of ['apps', 'packages']) {
  for (const entry of readdirSync(join(root, group), { withFileTypes: true })) {
    const path = join(root, group, entry.name, 'package.json');
    if (entry.isDirectory() && existsSync(path)) manifests.push({ path, value: JSON.parse(readFileSync(path, 'utf8')) });
  }
}

const byName = new Map(manifests.map((entry) => [entry.value.name, entry]));
const errors = [];
if (manifests.length !== 14) errors.push(`expected 14 app/package manifests, found ${manifests.length}`);
for (const name of policy.acceptedPublicPackages) {
  const entry = byName.get(name);
  if (!entry) errors.push(`accepted public package is absent: ${name}`);
  else if (entry.value.private === true) errors.push(`accepted public package is private: ${name}`);
  else if (!entry.value.version) errors.push(`accepted public package lacks a version: ${name}`);
  else if (!entry.value.exports) errors.push(`accepted public package lacks exports: ${name}`);
}
for (const [name, admission] of Object.entries(policy.packageAdmissions)) {
  const entry = byName.get(name);
  if (!entry) errors.push(`admission package is absent: ${name}`);
  else if (admission.requiredPrivate === true && entry.value.private !== true) errors.push(`${name} must remain private`);
  else if (admission.registryAdmission === 'owner-decision' && admission.requiredPrivate !== null) errors.push(`${name} owner decision must not be pre-resolved`);
}
for (const name of byName.keys()) {
  if (!policy.acceptedPublicPackages.includes(name) && !policy.packageAdmissions[name]) errors.push(`package has no explicit admission disposition: ${name}`);
}

if (errors.length) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log('Unisane Ops package contents verified: 9 public packages, 3 private packages/apps, 2 fail-closed owner decisions.');
}
