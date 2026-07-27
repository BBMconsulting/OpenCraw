import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getUnitFastIsolatedTestFiles,
  getUnitFastTestFiles,
  getUnitFastTimerTestFiles,
} from "../test/vitest/vitest.unit-fast-paths.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const update = process.argv.includes("--update");
const lintManifestPath = "config/validation/type-aware-lint-shards.json";
const lintInventoryPath = "config/validation/type-aware-lint-inventory.json";
const testManifestPath = "config/validation/test-suite-classification.json";
const testInventoryPath = "config/validation/test-suite-inventory.json";
const skipLedgerPath = "config/validation/test-skip-ledger.json";
const lintExtension = /\.[cm]?[jt]sx?$/u;
const scriptTest = /(?:^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/u;
const skipDeclaration = /\b(?:describe|suite|test|it)\s*\.\s*(?:skip|todo|skipIf|runIf|fails)\b/u;

function readJson(file) {
  return JSON.parse(readFileSync(path.join(root, file), "utf8"));
}
function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}
function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean)
    .toSorted();
}
function underPrefix(file, prefix) {
  return file === prefix || file.startsWith(`${prefix}/`);
}
function writeOrCheck(file, value, errors) {
  const rendered = stableJson(value);
  const absolute = path.join(root, file);
  if (update) {
    writeFileSync(absolute, rendered);
    return;
  }
  let current;
  try {
    current = readFileSync(absolute, "utf8");
  } catch {
    errors.push(`${file}: missing; run pnpm validation:manifests:update`);
    return;
  }
  if (current !== rendered) errors.push(`${file}: stale; run pnpm validation:manifests:update`);
}

function buildLintInventory(files, errors) {
  const manifest = readJson(lintManifestPath);
  const eligible = files.filter(
    (file) =>
      lintExtension.test(file) &&
      manifest.eligibleRoots.some((prefix) => underPrefix(file, prefix)),
  );
  const counts = new Map(manifest.shards.map((shard) => [shard.id, 0]));
  const inventory = eligible.map((file) => {
    const owners = manifest.shards.filter(
      (shard) =>
        shard.includePrefixes.some((prefix) => underPrefix(file, prefix)) &&
        !(shard.excludePrefixes ?? []).some((prefix) => underPrefix(file, prefix)),
    );
    if (owners.length !== 1) {
      errors.push(
        `${file}: lint assignment count ${owners.length}; expected exactly one (${owners.map((owner) => owner.id).join(", ")})`,
      );
      return { path: file, shard: owners.map((owner) => owner.id).join("+") || "UNASSIGNED" };
    }
    counts.set(owners[0].id, (counts.get(owners[0].id) ?? 0) + 1);
    return { path: file, shard: owners[0].id };
  });
  for (const [shard, count] of counts)
    if (count === 0) errors.push(`${lintManifestPath}: shard ${shard} has no eligible files`);
  const unassigned = inventory.filter((entry) => entry.shard === "UNASSIGNED").length;
  return {
    schemaVersion: 1,
    eligibleFileCount: inventory.length,
    coverage: {
      assignedExactlyOnce: inventory.length - unassigned,
      duplicateAssignments: 0,
      unassigned,
    },
    shards: manifest.shards.map((shard) => ({
      id: shard.id,
      fileCount: counts.get(shard.id) ?? 0,
    })),
    files: inventory,
  };
}

function isTrackedTest(file) {
  if (scriptTest.test(file)) return true;
  if (file.endsWith(".swift") && /(?:^|\/)Tests?(?:\/|$)/u.test(file)) return true;
  if (file.endsWith(".kt") && /\/src\/(?:test|androidTest)\//u.test(file)) return true;
  return file.endsWith(".sh") && /(?:^|\/)(?:e2e|tests?)(?:\/|[-_.])/u.test(file);
}
function matchesRule(file, rule) {
  return rule.patterns.some((pattern) => path.matchesGlob(file, pattern));
}
function buildTestInventory(files, errors) {
  const manifest = readJson(testManifestPath);
  const required = [
    "normal-supported",
    "integration-local",
    "upstream-compatibility",
    "platform-specific",
    "live-provider",
    "release-publication",
    "expensive-manual",
    "quarantined",
  ];
  for (const category of required)
    if (!manifest.categories[category])
      errors.push(`${testManifestPath}: missing required category ${category}`);
  const normalCandidates = new Set([
    ...getUnitFastTestFiles(),
    ...getUnitFastIsolatedTestFiles(),
    ...getUnitFastTimerTestFiles(),
  ]);
  const ruleCounts = new Map(manifest.rules.map((rule) => [rule.id, 0]));
  const inventory = [];
  for (const file of files.filter(isTrackedTest)) {
    const special = manifest.rules.find((rule) => !rule.fallback && matchesRule(file, rule));
    const rule =
      special ??
      (normalCandidates.has(file)
        ? { id: "curated-unit-fast", category: "normal-supported" }
        : manifest.rules.find((candidate) => candidate.fallback && matchesRule(file, candidate)));
    if (!rule || !manifest.categories[rule.category]) {
      errors.push(`${file}: unclassified test`);
      continue;
    }
    if (ruleCounts.has(rule.id)) ruleCounts.set(rule.id, (ruleCounts.get(rule.id) ?? 0) + 1);
    const category = manifest.categories[rule.category];
    inventory.push({
      path: file,
      category: rule.category,
      rule: rule.id,
      condition: category.condition,
      reason: category.reason,
      tracking: manifest.tracking,
    });
  }
  for (const rule of manifest.rules)
    if (!rule.allowEmpty && !rule.fallback && (ruleCounts.get(rule.id) ?? 0) === 0)
      errors.push(`${testManifestPath}: stale rule ${rule.id} matches no tracked test`);
  return {
    schemaVersion: 1,
    trackedTestFileCount: inventory.length,
    categories: Object.fromEntries(
      Object.keys(manifest.categories).map((category) => [
        category,
        inventory.filter((entry) => entry.category === category).length,
      ]),
    ),
    files: inventory,
  };
}

function buildSkipLedger(testInventory, errors) {
  const declarations = [];
  for (const entry of testInventory.files) {
    if (!scriptTest.test(entry.path)) continue;
    const lines = readFileSync(path.join(root, entry.path), "utf8").split("\n");
    for (const [index, line] of lines.entries()) {
      if (!skipDeclaration.test(line)) continue;
      if (entry.category === "normal-supported")
        errors.push(
          `${entry.path}:${index + 1}: skip declaration is not allowed in supported suite`,
        );
      declarations.push({
        file: entry.path,
        line: index + 1,
        declaration: line.trim(),
        category: entry.category,
        reason: entry.reason,
        condition: entry.condition,
        tracking: entry.tracking,
      });
    }
  }
  return {
    schemaVersion: 1,
    declarationCount: declarations.length,
    quarantinedCount: declarations.filter((entry) => entry.category === "quarantined").length,
    declarations,
  };
}

const errors = [];
const files = trackedFiles();
const lintInventory = buildLintInventory(files, errors);
const testInventory = buildTestInventory(files, errors);
const skipLedger = buildSkipLedger(testInventory, errors);
writeOrCheck(lintInventoryPath, lintInventory, errors);
writeOrCheck(testInventoryPath, testInventory, errors);
writeOrCheck(skipLedgerPath, skipLedger, errors);
if (errors.length > 0) {
  for (const error of errors) console.error(`[validation-manifest] ${error}`);
  process.exitCode = 1;
} else
  console.log(
    `[validation-manifest] ok: lint=${lintInventory.eligibleFileCount} tests=${testInventory.trackedTestFileCount} skip-declarations=${skipLedger.declarationCount}`,
  );
