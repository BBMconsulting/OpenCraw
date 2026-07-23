import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflowDirectory = ".github/workflows";
const removedUpstreamAutomation = [
  "auto-response.yml",
  "clawsweeper-dispatch.yml",
  "dependency-guard.yml",
  "ios-periphery-comment.yml",
  "labeler.yml",
  "maintainer-command-reactions.yml",
  "pr-ci-sweeper.yml",
  "real-behavior-proof.yml",
  "security-sensitive-guard.yml",
] as const;

type Workflow = {
  jobs?: Record<string, unknown>;
  name?: string;
  on?: Record<string, unknown>;
};

function workflowFiles(): string[] {
  return readdirSync(workflowDirectory)
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .toSorted();
}

function workflow(file: string): Workflow {
  return parse(readFileSync(`${workflowDirectory}/${file}`, "utf8")) as Workflow;
}

describe("OpenCraw GitHub Actions policy", () => {
  it("keeps exactly the fork core and docs workflows automatic", () => {
    const automatic = workflowFiles()
      .map((file) => ({ file, events: Object.keys(workflow(file).on ?? {}) }))
      .filter(({ events }) =>
        events.some((event) => !["workflow_call", "workflow_dispatch"].includes(event)),
      );

    expect(automatic).toEqual([
      {
        file: "docs.yml",
        events: ["workflow_dispatch", "push", "pull_request"],
      },
      {
        file: "opencraw-ci.yml",
        events: ["workflow_dispatch", "push", "pull_request"],
      },
    ]);
  });

  it("contains no scheduled workflow", () => {
    for (const file of workflowFiles()) {
      expect(workflow(file).on?.schedule, file).toBeUndefined();
    }
  });

  it("keeps publication and release workflows manual", () => {
    for (const file of workflowFiles().filter((candidate) =>
      /(?:release|publish|installer-sync|locale-refresh)/u.test(candidate),
    )) {
      const events = Object.keys(workflow(file).on ?? {});
      expect(
        events.every((event) => ["workflow_call", "workflow_dispatch"].includes(event)),
        `${file}: ${events.join(",")}`,
      ).toBe(true);
    }
  });

  it("removes upstream organization automation from the active set", () => {
    const active = new Set(workflowFiles());
    for (const file of removedUpstreamAutomation) {
      expect(active.has(file), file).toBe(false);
    }
  });

  it("keeps reusable-only components callable and non-automatic", () => {
    for (const file of [
      "install-smoke-reusable.yml",
      "npm-telegram-beta-e2e.yml",
      "openclaw-cross-os-release-checks-reusable.yml",
      "openclaw-live-and-e2e-checks-reusable.yml",
    ]) {
      expect(Object.keys(workflow(file).on ?? {}), file).toEqual(["workflow_call"]);
    }
  });

  it("makes plugin npm publication manual-only", () => {
    expect(Object.keys(workflow("plugin-npm-release.yml").on ?? {})).toEqual(["workflow_dispatch"]);
  });
});
