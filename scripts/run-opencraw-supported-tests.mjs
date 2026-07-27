import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getUnitFastIsolatedTestFiles,
  getUnitFastTestFiles,
  getUnitFastTimerTestFiles,
} from "../test/vitest/vitest.unit-fast-paths.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run("node", ["scripts/opencraw-validation-manifests.mjs"]);
const inventory = JSON.parse(
  readFileSync(path.join(root, "config/validation/test-suite-inventory.json"), "utf8"),
);
const supported = new Set(
  inventory.files
    .filter((entry) => entry.category === "normal-supported")
    .map((entry) => entry.path),
);
const isolated = new Set(getUnitFastIsolatedTestFiles());
const timer = new Set(getUnitFastTimerTestFiles());
const fast = new Set(getUnitFastTestFiles());
const plans = [
  {
    id: "unit-fast",
    config: "test/vitest/vitest.unit-fast.config.ts",
    files: [...supported].filter(
      (file) => fast.has(file) && !isolated.has(file) && !timer.has(file),
    ),
  },
  {
    id: "unit-fast-isolated",
    config: "test/vitest/vitest.unit-fast-isolated.config.ts",
    files: [...supported].filter((file) => isolated.has(file)),
  },
  {
    id: "unit-fast-fake-timers",
    config: "test/vitest/vitest.unit-fast-fake-timers.config.ts",
    files: [...supported].filter((file) => timer.has(file)),
  },
  {
    id: "repository-policy",
    config: "test/vitest/vitest.tooling.config.ts",
    files: [...supported].filter(
      (file) => !fast.has(file) && !isolated.has(file) && !timer.has(file),
    ),
  },
];
const assigned = new Set(plans.flatMap((plan) => plan.files));
const unassigned = [...supported].filter((file) => !assigned.has(file));
if (unassigned.length > 0) {
  for (const file of unassigned)
    console.error(`[test:opencraw] supported file has no execution project: ${file}`);
  process.exit(1);
}
const includeDir = mkdtempSync(path.join(tmpdir(), "opencraw-supported-tests-"));
try {
  for (const plan of plans) {
    if (plan.files.length === 0) continue;
    const includeFile = path.join(includeDir, `${plan.id}.txt`);
    writeFileSync(includeFile, JSON.stringify(plan.files.toSorted()), "utf8");
    console.log(`[test:opencraw] ${plan.id}: ${plan.files.length} files`);
    run("node", ["scripts/run-vitest.mjs", "run", "--config", plan.config], {
      env: { ...process.env, OPENCLAW_VITEST_INCLUDE_FILE: includeFile },
    });
  }
} finally {
  rmSync(includeDir, { recursive: true, force: true });
}
console.log(
  `[test:opencraw] passed ${supported.size} classified supported files with zero expected skips`,
);
