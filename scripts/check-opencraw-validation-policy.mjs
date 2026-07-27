#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const forbidden =
  /(?:testbox|crabbox|blacksmith|OPENCLAW_CHECK_CHANGED_REMOTE_CHILD|OPENCLAW_CHANGED_LANES_RAW_SYNC|OPENCLAW_PR_GATES_REMOTE)/iu;
const prohibitedPaths = [
  ".crabbox.yaml",
  "extensions/crabbox",
  "scripts/crabbox-wrapper.mjs",
  "scripts/crabbox-untrusted-bootstrap.sh",
  "scripts/ci-hydrate-testbox-env.sh",
];
const directPaths = [
  "package.json",
  "scripts/check-changed.mjs",
  "scripts/changed-lanes.mjs",
  "scripts/run-opencraw-lint.mjs",
  "scripts/run-opencraw-supported-tests.mjs",
  "scripts/pr-lib/gates.sh",
  "scripts/run-oxlint-shards.mjs",
];

for (const relative of prohibitedPaths) {
  if (existsSync(path.join(root, relative)))
    errors.push(`${relative}: prohibited active path exists`);
}
for (const relative of directPaths) {
  const text = readFileSync(path.join(root, relative), "utf8");
  if (forbidden.test(text)) errors.push(`${relative}: contains an external-delegation selector`);
}

const workflowDir = path.join(root, ".github/workflows");
const workflows = readdirSync(workflowDir)
  .filter((file) => /\.ya?ml$/u.test(file))
  .toSorted();
const expected = ["docs.yml", "opencraw-ci.yml"];
if (JSON.stringify(workflows) !== JSON.stringify(expected)) {
  errors.push(
    `.github/workflows: expected only ${expected.join(", ")}, found ${workflows.join(", ")}`,
  );
}
for (const file of workflows) {
  const text = readFileSync(path.join(workflowDir, file), "utf8");
  if (
    forbidden.test(text) ||
    /runs-on:\s*(?:self-hosted|\[[^\]]*(?:aws|azure)[^\]]*\])/iu.test(text)
  ) {
    errors.push(`.github/workflows/${file}: unauthorized runner or delegation selector`);
  }
  const runnerLines = text.match(/^\s*runs-on:\s*.+$/gmu) ?? [];
  for (const line of runnerLines) {
    if (line.trim() !== "runs-on: ubuntu-24.04")
      errors.push(`.github/workflows/${file}: unapproved runner ${line.trim()}`);
  }
}

const adapter = readFileSync(
  path.join(root, "extensions/qa-lab/src/mantis/crabbox-runtime.ts"),
  "utf8",
);
if (!adapter.includes("function disabled(): never") || /\bspawn\s*\(/u.test(adapter)) {
  errors.push("QA-lab compatibility adapter is not completely fail-closed");
}

const autoreview = readFileSync(
  path.join(root, ".agents/skills/autoreview/scripts/autoreview"),
  "utf8",
);
if (
  !autoreview.includes("reject_external_validation_delegation()") ||
  !autoreview.includes("OPENCLAW_TESTBOX is disabled in OpenCraw") ||
  autoreview.includes("copy_blacksmith_testbox_credentials")
) {
  errors.push("autoreview does not fail closed against inherited external-runner mode");
}

if (errors.length > 0) {
  for (const error of errors) console.error(`[validation-policy] ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    "[validation-policy] ok: direct CrawDevAi validation and exactly two retained workflows",
  );
}
