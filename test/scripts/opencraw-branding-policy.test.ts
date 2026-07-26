import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function readText(relativePath: string): string {
  return readFileSync(path.join(ROOT, relativePath), "utf8");
}

function readBytes(relativePath: string): Buffer {
  return readFileSync(path.join(ROOT, relativePath));
}

function sha256(relativePath: string): string {
  return createHash("sha256").update(readBytes(relativePath)).digest("hex");
}

describe("OpenCraw visible-branding policy", () => {
  it("keeps the approved visual source and every generated asset deterministic", () => {
    expect(sha256("docs/assets/opencraw/opencraw-crawcraw-source.png")).toBe(
      "7dc41edc8522df5badb7e73e1d91908e2c8a80fff9216c4ad5bcfc8c1b8f3aaf",
    );

    const result = spawnSync(
      process.execPath,
      ["scripts/generate-opencraw-assets.mjs", "--check"],
      {
        cwd: ROOT,
        encoding: "utf8",
      },
    );
    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain("OpenCraw generated assets are current and valid.");

    expect(readBytes("ui/public/opencraw-mark.png")).toEqual(
      readBytes("docs/assets/opencraw/opencraw-mark-180.png"),
    );
    expect(readBytes("ui/public/apple-touch-icon.png")).toEqual(
      readBytes("docs/assets/opencraw/opencraw-mark-180.png"),
    );
    expect(readBytes("ui/public/favicon-32.png")).toEqual(
      readBytes("docs/assets/opencraw/opencraw-mark-32.png"),
    );
    expect(readBytes("ui/public/favicon.ico")).toEqual(
      readBytes("docs/assets/opencraw/opencraw-favicon.ico"),
    );
  });

  it("uses OpenCraw identity on the approved passive browser and UI surfaces", () => {
    const index = readText("ui/index.html");
    const manifest = JSON.parse(readText("ui/public/manifest.webmanifest")) as {
      name: string;
      short_name: string;
      icons: Array<{ src: string }>;
    };
    const locale = readText("ui/src/i18n/locales/en.ts");
    const topbar = readText("ui/src/components/app-topbar.ts");
    const login = readText("ui/src/components/login-gate.ts");
    const about = readText("ui/src/pages/about/view.ts");
    const systemAgentPrompts = readText("src/system-agent/assistant-prompts.ts");
    const systemAgentCli = readText("src/system-agent/system-agent.ts");

    expect(index).toContain("<title>OpenCraw Control</title>");
    expect(index).toContain("OpenCraw Control UI");
    expect(manifest.name).toBe("OpenCraw Control");
    expect(manifest.short_name).toBe("OpenCraw");
    expect(manifest.icons.map((icon) => icon.src)).toEqual([
      "./favicon-32.png",
      "./opencraw-mark.png",
    ]);
    expect(topbar).toContain('aria-label="OpenCraw Control"');
    expect(topbar).toContain('class="topbar-brand__title">OpenCraw Control</span>');
    expect(topbar).toContain('controlUiPublicAssetPath("opencraw-mark.png", this.basePath)');
    expect(login).toContain('alt="OpenCraw"');
    expect(login).toContain('class="login-gate__title">OpenCraw Control</div>');
    expect(about).toContain('controlUiPublicAssetPath("opencraw-mark.png", props.basePath)');
    expect(systemAgentPrompts).toContain("You are OpenCraw, the system agent");
    expect(systemAgentPrompts).not.toContain("You are OpenClaw");
    expect(systemAgentCli).toContain('label: "Loading OpenCraw overview…"');
    expect(systemAgentCli).toContain(
      '"OpenCraw needs an interactive TTY. Use --message for one command."',
    );
    expect(locale).toContain('productName: "OpenCraw"');
    expect(locale).toContain('askOpenClaw: "Ask OpenCraw"');
    expect(locale).toContain('openInOpenClaw: "Open in OpenCraw"');
  });

  it("does not restore primary OpenClaw artwork on approved passive surfaces", () => {
    const approvedFiles = [
      "ui/index.html",
      "ui/public/manifest.webmanifest",
      "ui/src/app/app-host.ts",
      "ui/src/components/app-topbar.ts",
      "ui/src/components/login-gate.ts",
      "ui/src/pages/about/view.ts",
      "ui/src/pages/approval/approval-page.ts",
    ];
    const approvedSource = approvedFiles.map(readText).join("\n");

    expect(approvedSource).not.toContain("favicon.svg");
    expect(approvedSource).not.toContain("renderCrimsonClawdSvg");
    expect(approvedSource).not.toContain("about-hero__clawd");
    expect(approvedSource).not.toContain('apple-touch-icon.png" alt="OpenClaw');
  });

  it("preserves compatibility-sensitive OpenClaw contracts", () => {
    const packageJson = JSON.parse(readText("package.json")) as {
      name: string;
      bin: Record<string, string>;
    };
    const serviceWorker = readText("ui/public/sw.js");
    const aboutPage = readText("ui/src/pages/about/about-page.ts");

    expect(packageJson.name).toBe("openclaw");
    expect(packageJson.bin).toEqual({ openclaw: "openclaw.mjs" });
    expect(readText("openclaw.mjs")).toContain("OPENCLAW_");
    expect(serviceWorker).toContain('CACHE_PREFIX = "openclaw-control-"');
    expect(serviceWorker).toContain('tag: data.tag || "openclaw-notification"');
    expect(aboutPage).toContain('customElements.define("openclaw-about-page", AboutPage)');
    expect(readText("src/config/paths.ts")).toContain(".openclaw");
    expect(readText("src/system-agent/agent-id.ts")).toContain('SYSTEM_AGENT_ID = "openclaw"');
  });

  it("preserves upstream attribution while labeling fork-owned destinations", () => {
    const license = readText("LICENSE");
    const notices = readText("THIRD_PARTY_NOTICES.md");
    const readme = readText("README.md");
    const aboutLocale = readText("ui/src/i18n/locales/en.ts");
    const dockerfile = readText("Dockerfile");

    expect(license).toContain("MIT License");
    expect(license).toContain("OpenClaw");
    expect(notices).toContain("OpenClaw");
    expect(readme).toContain("https://github.com/openclaw/openclaw");
    expect(readme).toContain("https://docs.openclaw.ai");
    expect(aboutLocale).toContain("OpenCraw is based on OpenClaw");
    expect(dockerfile).toContain(
      'org.opencontainers.image.source="https://github.com/Branded-Business-Models/OpenCraw"',
    );
    expect(dockerfile).toContain(
      'org.opencontainers.image.documentation="https://docs.openclaw.ai/install/docker"',
    );
  });
});
