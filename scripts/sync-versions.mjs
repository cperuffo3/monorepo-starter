#!/usr/bin/env node
// Sync a single version across the root package.json and every workspace
// package (apps/*, packages/*). Invoked by release-it's `after:bump` hook so
// that all components are always versioned together.
//
//   node scripts/sync-versions.mjs 1.2.3

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
if (!version) {
  console.error('Usage: node scripts/sync-versions.mjs <version>');
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Collect package.json paths: the root, plus every immediate child of the
// workspace roots that has its own manifest.
const manifests = [join(root, 'package.json')];
for (const workspace of ['apps', 'packages']) {
  const dir = join(root, workspace);
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(dir, entry.name, 'package.json');
    if (existsSync(manifest)) manifests.push(manifest);
  }
}

for (const file of manifests) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'));
  if (pkg.version === version) continue;
  pkg.version = version;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`  ${pkg.name ?? file} → ${version}`);
}
