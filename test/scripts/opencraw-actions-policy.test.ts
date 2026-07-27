import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflowDirectory = ".github/workflows";
const workflowFiles = () =>
  readdirSync(workflowDirectory)
    .filter((file) => /\.ya?ml$/u.test(file))
    .toSorted();

describe("OpenCraw GitHub Actions policy", () => {
  it("retains exactly Docs and OpenCraw CI", () => {
    expect(workflowFiles()).toEqual(["docs.yml", "opencraw-ci.yml"]);
  });

  it("uses no schedule or unapproved runner", () => {
    for (const file of workflowFiles()) {
      const source = readFileSync(`${workflowDirectory}/${file}`, "utf8");
      const workflow = parse(source) as {
        jobs?: Record<string, { "runs-on"?: string }>;
        on?: Record<string, unknown>;
      };
      expect(workflow.on?.schedule, file).toBeUndefined();
      for (const job of Object.values(workflow.jobs ?? {})) {
        expect(job["runs-on"], file).toBe("ubuntu-24.04");
      }
      expect(source, file).not.toMatch(
        /(?:testbox|crabbox|blacksmith|self-hosted|aws.*runner|azure.*runner)/iu,
      );
    }
  });
});
