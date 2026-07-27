import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "config/validation/type-aware-lint-shards.json");
const inventoryPath = path.join(root, "config/validation/type-aware-lint-inventory.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const inventory = JSON.parse(readFileSync(inventoryPath, "utf8"));
const args = process.argv.slice(2);
const requestedShard = args.includes("--shard") ? args[args.indexOf("--shard") + 1] : undefined;
const requestedGroup = args.includes("--group") ? args[args.indexOf("--group") + 1] : undefined;
function commandOutput(command, commandArgs) {
  return spawnSync(command, commandArgs, { cwd: root, encoding: "utf8" }).stdout.trim();
}
function procNumbers(file, field) {
  try {
    const match = readFileSync(file, "utf8").match(new RegExp(`^${field}:\\s+(\\d+)`, "mu"));
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}
function childPids(pid) {
  try {
    return readFileSync(`/proc/${pid}/task/${pid}/children`, "utf8")
      .trim()
      .split(/\s+/u)
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}
function processTreeRssKiB(rootPid) {
  const pending = [rootPid];
  const seen = new Set();
  let total = 0;
  while (pending.length > 0) {
    const pid = pending.pop();
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    total += procNumbers(`/proc/${pid}/status`, "VmRSS");
    pending.push(...childPids(pid));
  }
  return total;
}
function validateInventory() {
  const result = spawnSync("node", ["scripts/opencraw-validation-manifests.mjs"], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code: code ?? 1, signal }));
  });
}
function writeShardProject(shard, files, context) {
  const projectDir = path.join(
    root,
    ".artifacts/opencraw-validation/lint",
    context.commit,
    "projects",
  );
  mkdirSync(projectDir, { recursive: true });
  const projectPath = path.join(projectDir, `${shard.id}.json`);
  const project = {
    extends: path.resolve(root, shard.tsconfig),
    include: [],
    files: files.map((file) => path.resolve(root, file)),
  };
  writeFileSync(projectPath, `${JSON.stringify(project, null, 2)}\n`);
  return projectPath;
}
async function runShard(shard, files, context) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  let peakRssKiB = 0;
  const projectPath = writeShardProject(shard, files, context);
  console.log(`[lint:full] start ${shard.id}: ${files.length} files (${shard.owner})`);
  const child = spawn(
    process.execPath,
    [
      "scripts/run-oxlint.mjs",
      "--tsconfig",
      projectPath,
      ...(shard.allowRules ?? []).flatMap((rule) => ["--allow", rule]),
      ...(shard.reportUnusedDisableDirectives === false
        ? ["--report-unused-disable-directives-severity=allow"]
        : []),
      ...files,
    ],
    {
      cwd: root,
      env: { ...process.env, OPENCLAW_LOCAL_CHECK_MODE: "low-memory" },
      stdio: "inherit",
    },
  );
  const monitor = setInterval(() => {
    peakRssKiB = Math.max(peakRssKiB, processTreeRssKiB(child.pid));
  }, 100);
  const result = await waitForExit(child);
  clearInterval(monitor);
  const elapsedMs = Math.round(performance.now() - started);
  const record = {
    schemaVersion: 1,
    commit: context.commit,
    manifestSha256: context.manifestSha256,
    shard: shard.id,
    shardDefinition: shard,
    projectConfig: path.relative(root, projectPath),
    fileCount: files.length,
    startedAt,
    elapsedMs,
    peakRssKiB,
    exitCode: result.code,
    signal: result.signal,
    result: result.code === 0 && !result.signal ? "passed" : "failed",
  };
  const recordDir = path.join(root, ".artifacts/opencraw-validation/lint", context.commit);
  mkdirSync(recordDir, { recursive: true });
  writeFileSync(path.join(recordDir, `${shard.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
  console.log(
    `[lint:full] ${record.result} ${shard.id}: elapsed=${(elapsedMs / 1000).toFixed(1)}s peak=${(peakRssKiB / 1024).toFixed(1)}MiB`,
  );
  return record;
}

validateInventory();
const shardFiles = new Map(manifest.shards.map((shard) => [shard.id, []]));
for (const entry of inventory.files) shardFiles.get(entry.shard)?.push(entry.path);
if (args.includes("--list")) {
  for (const shard of manifest.shards)
    console.log(`${shard.id}\t${shardFiles.get(shard.id).length}\t${shard.owner}`);
  process.exit(0);
}
const selected = requestedShard
  ? manifest.shards.filter((shard) => shard.id === requestedShard)
  : requestedGroup
    ? manifest.shards.filter((shard) => shard.id.startsWith(`${requestedGroup}-`))
    : manifest.shards;
if (selected.length === 0) {
  console.error(
    `[lint:full] no shards selected for ${requestedShard ?? requestedGroup ?? "full repository"}`,
  );
  process.exit(2);
}
const context = {
  commit: commandOutput("git", ["rev-parse", "HEAD"]),
  manifestSha256: createHash("sha256").update(readFileSync(manifestPath)).digest("hex"),
};
const records = [];
for (const shard of selected) {
  const record = await runShard(shard, shardFiles.get(shard.id), context);
  records.push(record);
  if (record.result !== "passed") {
    process.exitCode = record.exitCode || 1;
    break;
  }
}
if (records.every((record) => record.result === "passed"))
  console.log(
    `[lint:full] complete: ${records.length} shards, ${records.reduce((sum, record) => sum + record.fileCount, 0)} assigned files, serial execution`,
  );
