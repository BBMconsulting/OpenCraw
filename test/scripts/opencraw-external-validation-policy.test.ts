import { spawnSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import {
  defaultCommandRunner,
  inspectCrabbox,
  resolveCrabboxBin,
  runCommand,
  sshCommand,
  stopCrabbox,
  warmupCrabbox,
} from "../../extensions/qa-lab/src/mantis/crabbox-runtime.js";

const disabled = /disables external validation workers/u;
const params = {
  crabboxBin: "unavailable",
  cwd: process.cwd(),
  env: {},
  idleTimeout: "1m",
  leaseId: "disabled",
  machineClass: "disabled",
  provider: "disabled",
  runner: vi.fn(),
  ttl: "1m",
};

describe("OpenCraw external validation policy", () => {
  it("passes the repository policy checker", () => {
    const result = spawnSync("node", ["scripts/check-opencraw-validation-policy.mjs"], {
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
  });

  it("fails every inherited worker entry point closed without invoking a runner", async () => {
    await expect(defaultCommandRunner("", [], {})).rejects.toThrow(disabled);
    await expect(
      resolveCrabboxBin({ env: {}, envName: "DISABLED", repoRoot: process.cwd() }),
    ).rejects.toThrow(disabled);
    await expect(
      runCommand({ args: [], command: "", cwd: process.cwd(), env: {}, runner: params.runner }),
    ).rejects.toThrow(disabled);
    await expect(warmupCrabbox(params)).rejects.toThrow(disabled);
    await expect(inspectCrabbox(params)).rejects.toThrow(disabled);
    await expect(stopCrabbox(params)).rejects.toThrow(disabled);
    expect(() => sshCommand({ inspect: {} })).toThrow(disabled);
    expect(params.runner).not.toHaveBeenCalled();
  });
});
