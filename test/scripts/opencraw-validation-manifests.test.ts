import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  measureOxlintCoverage,
  parseOxlintReport,
} from "../../scripts/lib/opencraw-lint-report.mjs";

type Shard = { id: string; includePrefixes: string[]; excludePrefixes?: string[] };
const under = (file: string, prefix: string) => file === prefix || file.startsWith(`${prefix}/`);
const owners = (file: string, shards: Shard[]) =>
  shards.filter(
    (shard) =>
      shard.includePrefixes.some((prefix) => under(file, prefix)) &&
      !(shard.excludePrefixes ?? []).some((prefix) => under(file, prefix)),
  );

describe("OpenCraw validation manifests", () => {
  it("is current and proves exact lint coverage", () => {
    const result = spawnSync("node", ["scripts/opencraw-validation-manifests.mjs"], {
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
    const inventory = JSON.parse(
      readFileSync("config/validation/type-aware-lint-inventory.json", "utf8"),
    ) as {
      candidateFileCount: number;
      eligibleFileCount: number;
      configuredIgnoredFileCount: number;
      coverage: {
        assignedExactlyOnce: number;
        duplicateAssignments: number;
        unassigned: number;
      };
      configuredIgnoredFiles: Array<{ path: string; source: string }>;
      files: Array<{ path: string; shard: string }>;
    };
    expect(inventory.coverage).toEqual({
      assignedExactlyOnce: inventory.eligibleFileCount,
      duplicateAssignments: 0,
      unassigned: 0,
    });
    expect(new Set(inventory.files.map((entry) => entry.path)).size).toBe(
      inventory.eligibleFileCount,
    );
    expect(inventory.candidateFileCount).toBe(
      inventory.eligibleFileCount + inventory.configuredIgnoredFileCount,
    );
    expect(new Set(inventory.configuredIgnoredFiles.map((entry) => entry.path)).size).toBe(
      inventory.configuredIgnoredFileCount,
    );
    expect(
      inventory.configuredIgnoredFiles.some((ignored) =>
        inventory.files.some((eligible) => eligible.path === ignored.path),
      ),
    ).toBe(false);
    expect(new Set(inventory.configuredIgnoredFiles.map((entry) => entry.source))).toEqual(
      new Set([".oxlintrc.json"]),
    );
  });

  it("detects synthetic missing and duplicated assignments", () => {
    const manifest = JSON.parse(
      readFileSync("config/validation/type-aware-lint-shards.json", "utf8"),
    ) as { shards: Shard[] };
    const sample = "src/system-agent/tui-backend.ts";
    expect(owners(sample, manifest.shards)).toHaveLength(1);
    expect(
      owners(
        sample,
        manifest.shards.filter((shard) => shard.id !== "core-system-agent"),
      ),
    ).toHaveLength(0);
    expect(
      owners(sample, [
        ...manifest.shards,
        { id: "synthetic-duplicate", includePrefixes: ["src/system-agent"] },
      ]),
    ).toHaveLength(2);
  });

  it("lists every local shard and rejects an unknown shard", () => {
    const listed = spawnSync("node", ["scripts/run-opencraw-lint.mjs", "--list"], {
      encoding: "utf8",
    });
    expect(listed.status, listed.stderr).toBe(0);
    const unknown = spawnSync(
      "node",
      ["scripts/run-opencraw-lint.mjs", "--shard", "not-a-real-shard"],
      { encoding: "utf8" },
    );
    expect(unknown.status).toBe(2);
  });

  it("parses Oxlint reports and detects incomplete processed-file coverage", () => {
    const parsed = parseOxlintReport(
      'artifact preparation complete\n{"diagnostics":[],"number_of_files":3}',
    );
    expect(parsed.prelude).toBe("artifact preparation complete\n");
    expect(measureOxlintCoverage(parsed.report, 3)).toEqual({
      processedFileCount: 3,
      coverageMatches: true,
    });
    expect(measureOxlintCoverage(parsed.report, 4)).toEqual({
      processedFileCount: 3,
      coverageMatches: false,
    });
    expect(() => parseOxlintReport("no structured report")).toThrow(
      "Oxlint JSON report was not found",
    );
    expect(() => measureOxlintCoverage({ number_of_files: -1 }, 1)).toThrow(
      "number_of_files is missing or invalid",
    );
  });
});
