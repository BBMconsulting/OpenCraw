---
summary: "OpenCraw direct validation commands, manifests, lint shards, test classes, and timeout evidence"
title: "OpenCraw validation infrastructure"
read_when:
  - Running or changing OpenCraw validation
  - Adding lint-eligible files or tests
  - Investigating test timeouts or runner policy
---

# OpenCraw validation infrastructure

This record describes the repository implementation and measured evidence for
direct validation. Governing project policy remains outside this document.

## Full type-aware lint

`pnpm lint:full` is the complete repository proof. It validates the generated
inventory, runs all declared shards serially, samples process-tree RSS on
Linux, and writes one JSON result per shard under
`.artifacts/opencraw-validation/lint/<commit>/`.

`pnpm lint:full:list` lists the definitions and file counts.
`pnpm lint:core` runs all core shards. `pnpm check:changed` remains the
ordinary changed-file path and is not full-repository proof.

The authoritative files are:

- `config/validation/type-aware-lint-shards.json`
- `config/validation/type-aware-lint-inventory.json`
- `scripts/opencraw-validation-manifests.mjs`
- `scripts/run-opencraw-lint.mjs`

Each execution derives a shard-specific TypeScript project from the exact
inventory assignments. This avoids loading the former single broad project
graph while preserving type-aware analysis of imported dependencies.

| Shard                               | Files |
| ----------------------------------- | ----: |
| core-agents-embedded                |   434 |
| core-agents-tools                   |   210 |
| core-agents-sessions                |   116 |
| core-agents-cli                     |    52 |
| core-agents-rest                    | 1,593 |
| core-auto-reply                     |   665 |
| core-gateway                        | 1,260 |
| core-plugin-platform                | 1,369 |
| core-channels                       |   414 |
| core-system-agent                   |    74 |
| core-config                         |   550 |
| core-infra                          | 1,038 |
| core-security                       |   240 |
| core-commands-cli                   | 1,392 |
| core-automation                     |   604 |
| core-media                          |   308 |
| core-src-rest                       | 1,306 |
| core-ui                             | 1,227 |
| core-packages                       |   680 |
| extensions-channel-discord-telegram | 1,088 |
| extensions-channel-collaboration    | 1,621 |
| extensions-channel-messaging        | 1,262 |
| extensions-model-providers          | 1,015 |
| extensions-qa-platform              | 1,013 |
| extensions-rest                     | 1,522 |
| scripts                             |   852 |
| tests-tooling                       |   412 |
| tests-runtime                       |   337 |

The generated coverage proof starts from 22,658 tracked source candidates.
It records four files excluded by `.oxlintrc.json`, leaving 22,654 lint-eligible
files with 22,654 exact assignments, zero missing assignments, and zero
duplicate assignments. Configured exclusions are kept in the generated
inventory so changes to the lint configuration make the inventory stale.

## Test-root lint policy

The root `test/**` tree was outside the inherited full type-aware lint path.
It is now covered by two explicit ownership shards: `tests-tooling` for
repository-tooling tests and `tests-runtime` for the remaining root runtime and
integration tests.

The shard manifest declares the inherited test-only rule findings that remain
outside this correction, together with the reason and this tracking record.
Those allowances are scoped only to the two test shards; production,
extension, package, and script shards retain their existing rule sets.
Deliberate lint-violation fixtures also require unused-disable reporting to
remain off in these test shards. Any cleanup that eliminates an allowed rule
must remove it from the manifest, regenerate the inventory, and rerun
`pnpm lint:full` so the complete coverage proof remains current.

## Test-suite classification

`pnpm test:opencraw` is the authoritative normal supported suite. It reads
the classification inventory and executes only `normal-supported` files
through their declared Vitest projects. A clean result contains no skipped or
expected-failure tests.

`pnpm validation:manifests` fails on an unclassified tracked test, stale
classification rule, stale inventory, unsupported declaration in the normal
suite, or stale lint assignment. Regenerate after intentional classification
changes with `pnpm validation:manifests:update`.

Machine-readable records:

- `config/validation/test-suite-classification.json`
- `config/validation/test-suite-inventory.json`
- `config/validation/test-skip-ledger.json`

The classifications are normal supported, local integration,
upstream compatibility, platform-specific, live-provider, release/publication,
expensive/manual, quarantine, and inherited project diagnostic. Each
non-normal entry records its condition, reason, and this tracking reference.
The current inventory contains 9,125 tracked test files. The skip ledger
contains 811 non-normal declarations and no quarantine. It is the complete
line-addressed ledger; no separate hand-maintained copy is authoritative.

| Classification         | Files |
| ---------------------- | ----: |
| Normal supported       | 1,186 |
| Local integration      |   288 |
| Upstream compatibility |    37 |
| Platform-specific      |   531 |
| Live provider          |    84 |
| Release/publication    |    79 |
| Expensive/manual       |     1 |
| Quarantined            |     0 |
| Project diagnostic     | 6,919 |

The six skips previously seen in the inherited fast Linux aggregate were
platform declarations: two tests in
`src/agents/sessions/windows-git-bash-path.test.ts`, one in
`src/process/exec.windows.integration.test.ts`, and three macOS/Windows cases
in `src/infra/exec-allowlist-pattern.test.ts`. Those files now run only under
the documented platform-specific condition.

## TUI timeout correction

The cold `src/system-agent/tui-backend.test.ts` baseline spent 134,922 ms in
`runs OpenClaw inside the shared TUI shell` and completed the file in
161.67 seconds only under a temporary 180-second diagnostic budget. The route
had already been verified, but display-label enrichment awaited prepared-model
runtime activation. That activation has an exact 120,000 ms build timeout.

The TUI now reads the current published catalog snapshot without starting or
waiting for discovery. With the maintained 120-second test timeout, the slow
assertion measured 137 ms, the file's nine tests completed in 24.86 seconds,
and the repository wrapper completed in 41.66 seconds. The hanging-process
reporter identified no residual handle or process.

Evidence is retained locally under
`.artifacts/opencraw-validation/tui-before/` and
`.artifacts/opencraw-validation/tui-after/`.

## Bundled schema facade cold-load budget

The normal supported suite exercises
`src/plugin-sdk/bundled-channel-config-schema.test.ts` against the real
plugin-owned Telegram and iMessage schema surfaces. On CrawDevAi, a cold run
spent 114,430 ms in the single assertion; a filesystem-cache-disabled proof
measured 174,353 ms. Stage profiling attributed 88,609 ms to the first
synchronous JITI transformation of the Telegram schema
graph; the warmed iMessage graph then loaded in 64 ms or less. Process evidence
showed the Vitest child waiting in `do_epoll_wait` with no external connection or
child-process dependency.

`pnpm test:opencraw` therefore runs this exact file as its own supported project
with a 240,000 ms test timeout and a 300,000 ms no-output watchdog. The ordinary
`unit-fast` project retains the repository-wide 120,000 ms defaults. This
preserves real cold-source facade coverage while keeping the exceptional budget
limited to the measured workload.

## Runner policy

`pnpm validation:policy` proves that the direct validation commands contain
no external-delegation selector, obsolete worker configuration is absent, the
inherited QA worker compatibility adapter fails every execution entry point
closed, and exactly `docs.yml` and `opencraw-ci.yml` remain under
`.github/workflows`. Missing local requirements fail locally.

OpenCraw ships no external worker provider. Inherited worker protocol and
configuration types remain compatibility surfaces, not validation routes.
