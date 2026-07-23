#!/usr/bin/env node
import { createIsolatedValidationSession } from "./lib/validation-session.mjs";

const SUPPORTED_OPTIONS = new Set(["agent", "base-url", "purpose", "service"]);

function readArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const name = argv[index];
    if (!name?.startsWith("--")) {
      throw new Error(`unexpected argument: ${name ?? ""}`);
    }
    const option = name.slice(2);
    if (!SUPPORTED_OPTIONS.has(option)) {
      throw new Error(`unknown option: ${name}`);
    }
    if (Object.hasOwn(values, option)) {
      throw new Error(`duplicate option: ${name}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`${name} requires a value`);
    }
    values[option] = value;
    index += 1;
  }
  return values;
}

try {
  const args = readArgs(process.argv.slice(2));
  if (!args.service || !args.purpose) {
    throw new Error(
      "usage: node scripts/create-validation-session.mjs --service <service> --purpose <purpose> [--agent <agent>] [--base-url <url>]",
    );
  }
  const result = createIsolatedValidationSession({
    agentId: args.agent,
    baseUrl: args["base-url"],
    purpose: args.purpose,
    service: args.service,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
