import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  assertIsolatedValidationSessionKey,
  createControlUiValidationUrl,
  createIsolatedValidationSession,
} from "../../scripts/lib/validation-session.mjs";

describe("isolated validation sessions", () => {
  it("creates distinct, attributable keys for each service", () => {
    const common = {
      agentId: "main",
      nonce: "0123456789abcdef",
      now: new Date("2026-07-23T02:30:45.678Z"),
      purpose: "control-ui",
    };
    const primary = createIsolatedValidationSession({ ...common, service: "primary" });
    const rescue = createIsolatedValidationSession({ ...common, service: "rescue" });

    expect(primary.sessionKey).toBe(
      "agent:main:validation:primary:control-ui:20260723T023045678Z:0123456789abcdef",
    );
    expect(rescue.sessionKey).toContain(":validation:rescue:");
    expect(primary.sessionKey).not.toBe(rescue.sessionKey);
    expect(primary.agentArgs).toEqual(["--agent", "main", "--session-key", primary.sessionKey]);
  });

  it("creates a Control UI chat URL carrying only the isolated key", () => {
    const result = createIsolatedValidationSession({
      agentId: "main",
      baseUrl: "http://127.0.0.1:28789/control/",
      nonce: "fedcba9876543210",
      now: new Date("2026-07-23T02:30:45.678Z"),
      purpose: "deployment",
      service: "primary",
    });

    expect(result.controlUiUrl).toBe(
      "http://127.0.0.1:28789/control/chat?session=agent%3Amain%3Avalidation%3Aprimary%3Adeployment%3A20260723T023045678Z%3Afedcba9876543210",
    );
  });

  it("rejects production and malformed session keys", () => {
    expect(() => assertIsolatedValidationSessionKey("agent:main:main")).toThrow(
      "validation session key must use",
    );
    expect(() =>
      assertIsolatedValidationSessionKey("agent:main:validation:primary:manual"),
    ).toThrow("validation session key must use");
  });

  it("rejects URLs that could disclose or depend on temporary authentication state", () => {
    const key = "agent:main:validation:primary:control-ui:20260723T023045678Z:0123456789abcdef";
    const credentialUrl = new URL("http://localhost/");
    credentialUrl.username = "fixture-user";
    credentialUrl.password = "fixture-password";
    expect(() => createControlUiValidationUrl(credentialUrl.href, key)).toThrow(
      "must not contain credentials",
    );
    expect(() => createControlUiValidationUrl("http://localhost/?token=secret", key)).toThrow(
      "must not contain credentials",
    );
  });

  it("normalizes labels but refuses empty or oversized namespaces", () => {
    expect(
      createIsolatedValidationSession({
        nonce: "0123456789abcdef",
        now: new Date("2026-07-23T02:30:45.678Z"),
        purpose: "Control UI",
        service: "Rescue G/A",
      }).sessionKey,
    ).toContain(":validation:rescue-g-a:control-ui:");
    expect(() =>
      createIsolatedValidationSession({
        nonce: "0123456789abcdef",
        purpose: "---",
        service: "primary",
      }),
    ).toThrow("purpose must resolve");
  });

  it("fails closed when a CLI option is misspelled", () => {
    const result = spawnSync(
      process.execPath,
      [
        "scripts/create-validation-session.mjs",
        "--service",
        "rescue",
        "--purpose",
        "control-ui",
        "--agnt",
        "work",
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );

    expect(result.status).toBe(1);
    expect(result.stdout).toBe("");
    expect(result.stderr).toContain("unknown option: --agnt");
  });
});
