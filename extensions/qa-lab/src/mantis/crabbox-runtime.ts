// Compatibility adapter retained for inherited QA-lab imports.
import type { SpawnOptions } from "node:child_process";

type CommandResult = {
  stderr: string;
  stdout: string;
};

export type CommandRunner = (
  command: string,
  args: readonly string[],
  options: SpawnOptions,
) => Promise<CommandResult>;

const disabledMessage =
  "OpenCraw fork policy disables external validation workers; run validation directly on CrawDevAi.";

export type CrabboxInspect = {
  host?: string;
  id?: string;
  provider?: string;
  ready?: boolean;
  slug?: string;
  sshKey?: string;
  sshPort?: string;
  sshUser?: string;
  state?: string;
};

function disabled(): never {
  throw new Error(disabledMessage);
}

export async function defaultCommandRunner(
  _command: string,
  _args: readonly string[],
  _options: SpawnOptions,
): Promise<CommandResult> {
  return disabled();
}

export async function resolveCrabboxBin(_params: {
  env: NodeJS.ProcessEnv;
  envName: string;
  explicit?: string;
  repoRoot: string;
}): Promise<string> {
  return disabled();
}

export async function runCommand(_params: {
  args: readonly string[];
  command: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  runner: CommandRunner;
  stdio?: "inherit" | "pipe";
}): Promise<CommandResult> {
  return disabled();
}

export async function warmupCrabbox(_params: {
  crabboxBin: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  idleTimeout: string;
  machineClass: string;
  market?: string;
  provider: string;
  runner: CommandRunner;
  ttl: string;
}): Promise<string> {
  return disabled();
}

export async function inspectCrabbox(_params: {
  crabboxBin: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  leaseId: string;
  provider: string;
  runner: CommandRunner;
}): Promise<CrabboxInspect> {
  return disabled();
}

export async function stopCrabbox(_params: {
  crabboxBin: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  leaseId: string;
  provider: string;
  runner: CommandRunner;
}): Promise<void> {
  return disabled();
}

export function shellQuote(_value: string): string {
  return disabled();
}

export function sshCommand(_params: { inspect: CrabboxInspect }): {
  host: string;
  sshArgs: string;
  sshUser: string;
} {
  return disabled();
}
