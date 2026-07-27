---
name: openclaw-debugging
description: Debug OpenClaw model, provider, tool-surface, code-mode, streaming, and live behavior with targeted logs and direct repository proof.
---

# OpenClaw Debugging

Use this skill when the next step should be a narrow debug signal rather than a guess. Keep executable proof on trusted, assigned CrawDevAi source and fail closed when direct requirements are unavailable.

## Read First

- Read docs/logging.md for targeted logs and docs/reference/test.md for supported direct commands.
- Use the openclaw-testing skill to select the smallest trusted direct proof.

## Default Loop

1. State the suspected boundary: config, tool construction, provider payload,
   fetch, stream/SSE, transcript replay, worker/runtime, package/dist, or CI.
2. Add or enable the narrowest signal that proves that boundary.
3. Reproduce with the same provider/model/config. Do not randomly switch models
   unless the model itself is the variable being tested.
4. Compare configured state with actual run activation.
5. Patch the root cause.
6. Rerun the exact failing probe, then broaden only if the contract requires it.

## Model Transport Logs

Use targeted env flags instead of global debug when the model request shape or
stream timing matters:

```bash
OPENCLAW_DEBUG_MODEL_TRANSPORT=1 openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=tools OPENCLAW_DEBUG_SSE=events openclaw gateway
OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted OPENCLAW_DEBUG_SSE=peek openclaw gateway
```

Useful flags:

- `OPENCLAW_DEBUG_MODEL_TRANSPORT=1`: request start, fetch response, SDK
  headers, first SSE event, stream done, and transport errors at `info`.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=summary`: bounded payload summary.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=tools`: all model-facing tool names.
- `OPENCLAW_DEBUG_MODEL_PAYLOAD=full-redacted`: capped, redacted JSON payload.
  Use only while debugging; prompts/message text may still appear.
- `OPENCLAW_DEBUG_SSE=events`: first-event and stream-completion timing.
- `OPENCLAW_DEBUG_SSE=peek`: first five redacted SSE events.
- `OPENCLAW_DEBUG_CODE_MODE=1`: code-mode tool-surface diagnostics.

Watch logs with:

```bash
openclaw logs --follow
```

## Common Boundaries

- **Config vs activation:** config can be enabled while the run disables tools,
  is raw, has an empty allowlist, or lacks model tool support. Check the actual
  visible tools before enforcing provider payload invariants.
- **Tool surface:** inspect final model-visible tool names, not only the tool
  registry or config. Code mode means exactly `exec` and `wait` only after it
  actually activates.
- **Provider payload:** log fields, model id, service tier, reasoning, input
  size, metadata keys, prompt-cache key presence, and tool names before SDK
  call.
- **Fetch vs SSE:** fetch response proves HTTP headers arrived; first SSE event
  proves provider body progress. A gap here is a stream/body/provider issue, not
  tool execution.
- **Worker/dist:** run `pnpm build` when touching workers, dynamic imports,
  package exports, lazy runtime boundaries, or published paths.
- **Live keys:** use the configured secret workflow for missing provider keys
  before saying live proof is blocked. Env checks are presence-only; never print
  secrets.

## Code Pointers

- Model payload + Responses stream:
  `src/agents/openai-transport-stream.ts`
- Guarded fetch/timing:
  `src/agents/provider-transport-fetch.ts`
- OpenAI/Codex provider wrappers:
  `src/llm/providers/stream-wrappers/openai.ts`
- Tool construction, Tool Search, code-mode activation:
  `src/agents/embedded-agent-runner/run/attempt.ts`
- Code-mode runtime and worker:
  `src/agents/code-mode.ts`
  `src/agents/code-mode.worker.ts`
- Tool Search catalog:
  `src/agents/tool-search.ts`

## Proof Choice

Use the narrowest direct command that proves the suspected boundary. Run repository-controlled code only from trusted assigned CrawDevAi source; if required dependencies, resources, credentials, or interfaces are unavailable, stop with the precise blocker and do not select another runner.

## Output Habit

Report:

- boundary tested
- exact command/env shape, redacted
- observed signal, such as tool names or first SSE event timing
- fix location
- narrow proof and any remaining risk
