// Qa Lab tests cover Crabbox runtime behavior.
import { describe, expect, it } from "vitest";
import { defaultCommandRunner } from "./crabbox-runtime.js";

describe("Crabbox command runner", () => {
  it("fails closed before spawning an external validation worker", async () => {
    await expect(defaultCommandRunner("forbidden-runner", [], {})).rejects.toThrow(
      "fork policy disables external validation workers",
    );
  });
});
