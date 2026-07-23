---
summary: "OpenCraw GitHub Actions triggers, operating classes, dependencies, and upstream reconciliation rules"
title: "OpenCraw GitHub Actions policy"
read_when:
  - Changing, adding, or restoring a GitHub Actions workflow
  - Reconciling workflow changes from openclaw/openclaw
  - Investigating unexpected Actions cost, failure notifications, or publication risk
---

# OpenCraw GitHub Actions policy

OpenCraw uses a deliberately smaller GitHub Actions surface than
`openclaw/openclaw`. Only fork-owned core validation and documentation checks
run automatically. Comprehensive, release, native-platform, external-service,
agent, and maintainer workflows require an explicit dispatch. Reusable
components run only when called. Upstream organization automation that cannot
operate safely or usefully in the fork is absent from the active workflow
directory.

This policy was established after unchanged `main` commits repeatedly started
an hourly PR CI repair bot, a roughly 132-job CI graph, documentation checks,
and plugin npm release previews. Failures produced notification email without
providing proportional independent validation.

## Operating rules

### Automatic core validation

`OpenCraw CI` runs on non-documentation pushes to `main`, relevant pull request
updates, and manual dispatch. Its four GitHub-hosted Ubuntu jobs provide:

- frozen-lockfile dependency installation;
- formatting, lint, and production-project typechecking;
- fast unit tests and focused workflow-policy integration tests;
- a production build and built-CLI smoke test;
- a bounded TruffleHog commit scan, private-key detection, production
  dependency audit, `actionlint`, `zizmor`, and repository workflow guards.

`Docs` runs on `main` pushes and pull requests that change Markdown,
documentation, documentation tooling, the workflow itself, or its dependency
inputs. It also supports manual dispatch. The job checks formatting,
Markdown/MDX, glossary state, internal links, and the generated documentation
map using only the OpenCraw checkout. It does not check out ClawHub or another
external repository.

Both automatic workflows have top-level `contents: read`, use pinned actions,
cancel superseded work, require no repository secret or release environment,
and contain no publish step.

### Manual and release-only automation

Every retained workflow outside automatic core validation and reusable-only
components requires `workflow_dispatch`. A manual workflow may retain
credential, environment, registry, native runner, or external repository
requirements for future deliberate use. Its presence does not establish that
those dependencies are configured in OpenCraw.

Publication workflows are inert until explicitly dispatched. A publication
still requires its workflow-specific exact-ref checks, approval environment,
and configured authentication. This policy does not authorize a release,
package, container, installer, native artifact, or external-repository update.

### Schedules, repository events, and reusable workflows

No active OpenCraw workflow has a `schedule` trigger. No maintainer bot,
translation job, live test, release job, cache warmer, performance agent, or
external synchronization job responds automatically to repository activity.

Reusable-only components expose `workflow_call` and no independent event.
Some release/QA workflows expose both `workflow_dispatch` and `workflow_call`;
they are class B because a deliberate standalone run is part of their
maintained interface.

### Secrets, permissions, cost, and notification noise

Automatic validation must not depend on an upstream GitHub App, organization
runner, organization environment, release credential, live provider account,
or external repository. Manual workflows keep their existing job-level
permissions and named secret interfaces; they are not made automatic until
OpenCraw establishes the need, access, least-privilege permissions, and a
passing dry run.

Cost codes in the matrix are:

- `L`: one inexpensive GitHub-hosted job;
- `M`: several jobs or one build/test job;
- `H`: native, Blacksmith, live-service, agent, or broad matrix work;
- `X`: release/full-suite scale or publication-capable work.

Dependency codes are:

- `R`: repository read-only;
- `W`: writes repository, issue, pull request, action, or security state;
- `S`: one or more named secrets;
- `A`: upstream GitHub App or organization-maintainer identity;
- `E`: protected GitHub environment or approval;
- `X`: external repository or third-party service;
- `P`: registry, package, container, installer, or release publication;
- `N`: native or specialized runner;
- `B`: Blacksmith/Testbox infrastructure.

Secret names and values are not reproduced here. Workflow source is the
authoritative interface; secret values must never enter source, logs, or
reconciliation records.

## Complete workflow reconciliation matrix

All files marked `U` existed in `openclaw/openclaw`; `L` is OpenCraw-local.
The “before” event is the event present at reconciliation start. “Now” is the
enforced event after reconciliation. Validation is the source-policy test plus
YAML, `actionlint`, `zizmor`, and repository workflow checks unless a more
specific check is named.

### A. Automatic core validation

| Origin | Workflow                        | Before → now                                | Purpose and dependencies                                                             | Cost/value/status                              | Decision                                                          |
| ------ | ------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------- |
| U/F    | `docs.yml` — Docs               | `push` → `dispatch,push,PR(paths)`          | Docs format, Markdown/MDX, glossary, links, map; `R`                                 | L; high; earlier failure was README formatting | Keep automatic; remove ClawHub checkout; add PR/manual/path scope |
| L      | `opencraw-ci.yml` — OpenCraw CI | new → `dispatch,push,PR(paths-ignore docs)` | Lockfile, format, lint, types, focused tests, build, secrets/security/workflows; `R` | M; high; replaces 132-job default              | Four bounded jobs; fork-safe GitHub-hosted runners                |

### B. Manual or release-only

| Origin | Workflow                                                              | Before → now                              | Purpose and dependencies                                     | Cost/value/status                                 | Decision                                             |
| ------ | --------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | ---------------------------------------------------- |
| U      | `android-release.yml` — Android Release                               | `dispatch` → same                         | Android signing/release; `S,E,P,N,X`                         | X; future release                                 | Retain explicit release machinery                    |
| U      | `ci-build-artifacts-testbox.yml` — Blacksmith Build Artifacts Testbox | `dispatch,PR` → `dispatch`                | Hydrated build Testbox; provider secrets, `S,B`              | H; operator proof                                 | Remove automatic workflow-change probe               |
| U      | `ci-check-arm-testbox.yml` — Blacksmith ARM Testbox                   | `dispatch,PR` → `dispatch`                | Hydrated ARM Testbox; provider secrets, `S,B,N`              | H; operator proof                                 | Remove automatic workflow-change probe               |
| U      | `ci-check-testbox.yml` — Blacksmith Testbox                           | `dispatch,PR` → `dispatch`                | Hydrated Linux Testbox; provider secrets, `S,B`              | H; operator proof                                 | Remove automatic workflow-change probe               |
| U/F    | `ci.yml` — OpenCraw Full CI (Manual)                                  | `dispatch,push,PR` → `dispatch`           | Upstream full Linux/Windows/macOS/iOS/Android graph; `R,N,B` | X; comprehensive fallback; recent 132-job failure | Preserve coverage without automatic cost             |
| U      | `codeql-android-critical-security.yml`                                | `dispatch,daily` → `dispatch`             | Android CodeQL; security upload, `W,N,B`                     | H; focused security                               | Remove daily schedule                                |
| U      | `codeql-critical-quality.yml`                                         | `dispatch,PR,daily` → `dispatch`          | 16-profile CodeQL quality matrix; `W`                        | X; specialist analysis                            | Remove PR and daily execution                        |
| U      | `codeql-macos-critical-security.yml`                                  | `dispatch,weekly` → `dispatch`            | Swift CodeQL; security upload, `W,N,B`                       | H; focused security                               | Remove weekly schedule                               |
| U      | `codeql.yml` — CodeQL                                                 | `dispatch,PR,push,daily` → `dispatch`     | Broad CodeQL matrix; security upload, `W,N`                  | X; deep security                                  | Automatic security remains in OpenCraw CI            |
| U/F    | `control-ui-locale-refresh.yml`                                       | `push,release,dispatch` → `dispatch`      | Generated locale PR; model/App credentials, `S,A,W`          | H; optional maintenance                           | Prevent automatic generated PR activity              |
| U      | `crabbox-hydrate.yml` — Crabbox Hydrate                               | `dispatch` → same                         | Credential-hydrated Testbox; `S,B`                           | H; trusted operator use                           | Retain explicit infrastructure entry                 |
| U      | `docker-release.yml` — Docker Release                                 | `push,dispatch` → `dispatch`              | Docker Hub/GHCR release; `S,E,P,N`                           | X; publication                                    | Remove tag/push publication trigger                  |
| U      | `docs-agent.yml` — Docs Agent                                         | `workflow_run,dispatch` → `dispatch`      | Codex documentation agent; `S,W,X`                           | H; optional maintenance                           | Remove post-CI agent execution                       |
| U      | `docs-sync-publish.yml`                                               | `push,dispatch` → `dispatch`              | Publish docs to `openclaw/clawhub`; `S,W,X`                  | H; upstream-only                                  | Retain only as deliberate future machinery           |
| U      | `docs-translate-trigger-release.yml`                                  | `release` → `dispatch`                    | Translation dispatch; `S,W,X`                                | M; upstream-only                                  | Remove release event trigger                         |
| U      | `duplicate-after-merge.yml`                                           | `dispatch` → same                         | Duplicate PR cleanup; `W`                                    | L; maintainer utility                             | Retain explicit dry-run/apply workflow               |
| U      | `full-release-validation.yml`                                         | `dispatch` → same                         | Release validation umbrella; `S,B,X`                         | X; release proof                                  | Retain explicit release machinery                    |
| U/F    | `install-smoke.yml` — Install Smoke                                   | `dispatch` → same                         | Calls reusable install proof; `R`                            | H; release/manual proof                           | Keep schedule absent and remove stale schedule logic |
| U      | `ios-periphery.yml`                                                   | `PR,dispatch` → `dispatch`                | iOS dead-code scan; `N`                                      | H; specialist check                               | Remove automatic native runner use                   |
| U      | `linux-app-release.yml`                                               | `dispatch` → same                         | Linux desktop artifacts/signing; `S,P,N`                     | X; release                                        | Retain explicit release machinery                    |
| U      | `linux-app.yml`                                                       | `PR,dispatch` → `dispatch`                | Linux desktop build; `N`                                     | H; specialist check                               | Remove automatic platform job                        |
| U      | `live-media-runner-image.yml`                                         | `dispatch,push` → `dispatch`              | Live-media runner image build; `B,P`                         | H; infrastructure                                 | Remove push image behavior                           |
| U      | `macos-periphery.yml`                                                 | `PR,dispatch` → `dispatch`                | macOS dead-code scan; `N,B`                                  | H; specialist check                               | Remove automatic native runner use                   |
| U      | `macos-release.yml`                                                   | `dispatch` → same                         | macOS release orchestration; `P,N,X`                         | X; release                                        | Retain explicit release machinery                    |
| U      | `mantis-discord-smoke.yml`                                            | `dispatch` → same                         | Live Discord proof; `S,E,X,B`                                | H; live QA                                        | Retain explicit external-service test                |
| U      | `mantis-discord-status-reactions.yml`                                 | `comment,dispatch` → `dispatch`           | Mantis reaction automation; `S,A,E,W,X,B`                    | H; upstream operations                            | Remove comment trigger                               |
| U      | `mantis-discord-thread-attachment.yml`                                | `comment,dispatch` → `dispatch`           | Mantis attachment proof; `S,A,E,W,X,B`                       | H; upstream operations                            | Remove comment trigger                               |
| U      | `mantis-scenario.yml`                                                 | `dispatch` → same                         | Manual Mantis scenario; `B`                                  | H; live QA                                        | Retain explicit test                                 |
| U      | `mantis-slack-desktop-smoke.yml`                                      | `dispatch` → same                         | Live Slack desktop proof; `S,E,X`                            | H; live QA                                        | Retain explicit test                                 |
| U      | `mantis-telegram-desktop-proof.yml`                                   | `comment,PR-target,dispatch` → `dispatch` | Telegram desktop agent proof; `S,A,E,W,X,B`                  | H; upstream operations                            | Remove comment and PR-target triggers                |
| U      | `mantis-telegram-live.yml`                                            | `comment,dispatch` → `dispatch`           | Telegram live proof; `S,A,E,W,X`                             | H; live QA                                        | Remove comment trigger                               |
| U      | `mantis-web-ui-chat-proof.yml`                                        | `comment,dispatch` → `dispatch`           | Browser chat proof; `S,A,E,W,X,B`                            | H; live QA                                        | Remove comment trigger                               |
| U      | `maturity-scorecard.yml`                                              | `dispatch,call` → same                    | QA scorecard and profile evidence; `S,W,X`                   | H; manual/release evidence                        | Independent manual run is maintained                 |
| U/F    | `native-app-locale-refresh.yml`                                       | `push,dispatch` → `dispatch`              | Generated native locale PR; `S,A,W`                          | H; optional maintenance                           | Prevent automatic generated PR activity              |
| U      | `node22-compat.yml`                                                   | `weekly,dispatch` → `dispatch`            | Node 22 build/package compatibility; `N`                     | H; compatibility                                  | Remove weekly schedule                               |
| U      | `openclaw-npm-release.yml`                                            | `dispatch` → same                         | Core npm release; `E,P`                                      | X; publication                                    | Retain explicit approved release path                |
| U/F    | `openclaw-performance.yml`                                            | `dispatch` → same                         | Performance/agent profiling; `S,A,B,X`                       | H; specialist evidence                            | Keep schedule absent                                 |
| U      | `openclaw-release-checks.yml`                                         | `dispatch` → same                         | Full release checks and reusable callers; `S,E,B,X`          | X; release proof                                  | Retain explicit release machinery                    |
| U      | `openclaw-release-publish.yml`                                        | `dispatch` → same                         | npm/GitHub release publication; `E,P,W`                      | X; publication                                    | Retain explicit approved release path                |
| U      | `openclaw-release-telegram-qa.yml`                                    | `call,dispatch` → same                    | Release Telegram proof; `S,E,X`                              | H; release proof                                  | Parent dispatch interface justifies class B          |
| U/F    | `openclaw-scheduled-live-checks.yml`                                  | `dispatch` → same                         | Live/E2E wrapper; `S,X,B`                                    | X; live QA                                        | Keep schedule absent; explicit only                  |
| U      | `openclaw-stable-main-closeout.yml`                                   | `push,dispatch` → `dispatch`              | Stable release closeout; `W,P`                               | X; release administration                         | Remove automatic main activity                       |
| U      | `opengrep-precise-full.yml`                                           | `dispatch` → same                         | Full OpenGrep scan; `B`                                      | H; deep security                                  | Retain explicit scan                                 |
| U      | `opengrep-precise.yml`                                                | `PR` → `dispatch`                         | Diff OpenGrep scan; `B`                                      | M; focused security                               | Automatic security remains in OpenCraw CI            |
| U      | `package-acceptance.yml`                                              | `dispatch,call` → same                    | Candidate package/live acceptance; `S,X,P`                   | X; release proof                                  | Independent manual release proof retained            |
| U      | `plugin-clawhub-new.yml`                                              | `dispatch` → same                         | Create/publish ClawHub plugin; `S,E,P,X`                     | X; publication                                    | Retain explicit approved release path                |
| U      | `plugin-clawhub-release.yml`                                          | `dispatch` → same                         | ClawHub cross-repository publication; `E,P,X`                | X; publication                                    | Retain explicit approved release path                |
| U      | `plugin-init-scaffold-validation.yml`                                 | `dispatch,push,PR` → `dispatch`           | Plugin scaffold validation; `R`                              | M; useful focused check                           | Manual coverage retained                             |
| U      | `plugin-npm-release.yml`                                              | `push,dispatch` → `dispatch`              | Plugin npm preflight/publish; `S,E,P`                        | X; recent preview failed before publish           | Remove ordinary-push trigger; keep approvals         |
| U      | `plugin-prerelease.yml`                                               | `dispatch` → same                         | Plugin prerelease matrix; `X,B`                              | X; release proof                                  | Retain explicit release validation                   |
| U/F    | `qa-live-transports-convex.yml`                                       | `call,dispatch` → same                    | Multi-lane live QA; `S,E,X,B`                                | X; live QA                                        | Keep schedule absent; independent manual use         |
| U      | `qa-profile-evidence.yml`                                             | `dispatch,call` → same                    | QA profile evidence; `S,E,X,B`                               | H; evidence component                             | Independent manual use retained                      |
| U      | `sandbox-common-smoke.yml`                                            | `push,PR` → `dispatch`                    | Docker sandbox build smoke; `B`                              | H; focused platform check                         | Remove automatic container build                     |
| U      | `shared-openclawkit-periphery.yml`                                    | `PR,dispatch` → `dispatch`                | Shared Swift dead-code scan; `N,B`                           | H; specialist check                               | Remove automatic native runner use                   |
| U/F    | `stale.yml`                                                           | `dispatch` → same                         | Issue/PR stale maintenance; `S,A,W`                          | M; upstream maintainer bot                        | Keep schedule absent; explicit only                  |
| U      | `sticky-disk-cleanup.yml`                                             | `dispatch` → same                         | Exact Blacksmith disk cleanup; `B,W`                         | L; infrastructure maintenance                     | Retain confirmation-gated manual utility             |
| U      | `test-performance-agent.yml`                                          | `workflow_run,dispatch` → `dispatch`      | Codex test optimization; `S,W,X`                             | X; optional maintenance                           | Remove post-CI agent execution                       |
| U      | `update-migration.yml`                                                | `dispatch` → same                         | Upgrade migration acceptance caller; `X`                     | H; release/upgrade proof                          | Retain explicit test                                 |
| U      | `vitest-cache-warm.yml`                                               | `repository_dispatch,daily` → `dispatch`  | Protected Vitest cache seed; `B`                             | H; upstream optimization                          | Remove dispatch event and daily schedule             |
| U      | `website-installer-sync.yml`                                          | `PR,push,dispatch` → `dispatch`           | Installer checks and `openclaw.ai` sync; `S,W,X,N`           | H; upstream website                               | Remove automatic checks/sync                         |
| U      | `windows-blacksmith-testbox.yml`                                      | `dispatch` → same                         | Windows Testbox lease; `B,N`                                 | H; operator proof                                 | Retain explicit infrastructure entry                 |
| U      | `windows-node-release.yml`                                            | `dispatch` → same                         | Windows standalone Node artifact; `P,N`                      | H; release                                        | Retain explicit release machinery                    |
| U      | `windows-testbox-probe.yml`                                           | `dispatch` → same                         | Windows Testbox diagnostics; `B,N`                           | M; operator proof                                 | Retain explicit diagnostic                           |
| U      | `workflow-sanity.yml`                                                 | `PR,push,dispatch` → `dispatch`           | Full workflow/config baseline checks; `R`                    | M; comprehensive manual audit                     | Automatic subset moved into OpenCraw CI              |

### C. Reusable `workflow_call` components

| Origin | Workflow                                        | Before → now             | Purpose and dependencies                         | Cost/value/status    | Decision                   |
| ------ | ----------------------------------------------- | ------------------------ | ------------------------------------------------ | -------------------- | -------------------------- |
| U      | `install-smoke-reusable.yml`                    | `call` → same            | Package/install artifact proof; `R`              | H; release component | Callable only              |
| U      | `npm-telegram-beta-e2e.yml`                     | `dispatch,call` → `call` | Package Telegram live proof; `S,E,X,B`           | H; release component | Remove independent trigger |
| U      | `openclaw-cross-os-release-checks-reusable.yml` | `dispatch,call` → `call` | Cross-OS release proof; `S,X,N`                  | X; release component | Remove independent trigger |
| U      | `openclaw-live-and-e2e-checks-reusable.yml`     | `dispatch,call` → `call` | Shared live/E2E lanes; provider secrets, `S,X,B` | X; release component | Remove independent trigger |

### D. Removed from the active workflow set

These files remain recoverable from repository and upstream history. Removal is
more accurate than a nonfunctional manual shell because their event payload,
App identity, or upstream maintainer policy is the workflow's purpose.

| Origin | Workflow                           | Before → now                             | Purpose and unavailable dependency                   | Cost/status                | Decision                                        |
| ------ | ---------------------------------- | ---------------------------------------- | ---------------------------------------------------- | -------------------------- | ----------------------------------------------- |
| U      | `auto-response.yml`                | issues/comments/PR-target → removed      | Upstream Barnacle response bot; `A,S,W`              | L; would fail without App  | No current OpenCraw need                        |
| U      | `clawsweeper-dispatch.yml`         | issues/comments/push/PR events → removed | Dispatch to upstream ClawSweeper; `A,S,W,X`          | M; upstream-only           | No fork-owned receiver/identity                 |
| U      | `dependency-guard.yml`             | PR-target → removed                      | Upstream dependency approval bot; `A,S,W`            | L; upstream policy         | Not OpenCraw maintainer policy                  |
| U      | `ios-periphery-comment.yml`        | workflow-run → removed                   | Comment follow-up for automatic iOS scan; `W`        | L; orphaned                | Parent scan is manual                           |
| U      | `labeler.yml`                      | PR-target/issues/dispatch → removed      | Upstream label policy; `A,S,W`                       | M; App unavailable         | Avoid event failures/mutations                  |
| U      | `maintainer-command-reactions.yml` | comments → removed                       | Upstream command reaction bot; `W`                   | L; notification automation | No fork need                                    |
| U      | `pr-ci-sweeper.yml`                | hourly/dispatch → removed                | Repairs upstream PR-volume CI; `A,S,W`               | L; failed every hour       | App keys unavailable; no fork value             |
| U      | `real-behavior-proof.yml`          | PR-target → removed                      | Upstream contributor/maintainer proof policy; `A,S`  | L; App unavailable         | Not OpenCraw policy                             |
| U      | `security-sensitive-guard.yml`     | PR-target → removed                      | Upstream team/approver labels and enforcement; `W,X` | L; wrong org assumptions   | OpenCraw CI retains independent security checks |

## Removed schedules

| Former workflow                  | Former UTC cron | Treatment        |
| -------------------------------- | --------------- | ---------------- |
| PR CI Sweeper                    | `7 * * * *`     | Workflow removed |
| CodeQL                           | `0 6 * * *`     | Manual           |
| CodeQL Android Critical Security | `0 7 * * *`     | Manual           |
| CodeQL Critical Quality          | `30 6 * * *`    | Manual           |
| CodeQL macOS Critical Security   | `0 8 * * 1`     | Manual           |
| Node 22 Compat                   | `23 5 * * 1`    | Manual           |
| Vitest Cache Warm                | `17 8 * * *`    | Manual           |

Previously suppressed schedules for locale refresh, Install Smoke, performance,
scheduled live checks, QA live transports, and stale maintenance remain
suppressed.

## Failure diagnosis that established this policy

- **PR CI Sweeper:** the hourly job attempted to create an upstream GitHub App
  token. Both App private-key inputs were unavailable in the fork, so token
  creation failed in about 23 seconds. The workflow served upstream PR-volume
  repair and had no OpenCraw-specific value.
- **CI:** the 132-job expanded graph had four failed jobs. One dependency check
  found an unused exported type. Two tooling tests still expected Install Smoke
  scheduling even though the fork had already removed that schedule. The final
  gate correctly aggregated those failures. This was a mix of one source
  hygiene defect and two inherited policy-test mismatches, amplified by an
  unnecessarily broad automatic graph.
- **Docs:** the observed failed run checked out `openclaw/clawhub`, but the
  actual failure was repository documentation formatting in `README.md`.
  ClawHub was not the cause and was nevertheless an unnecessary external
  dependency. Later baseline Docs runs passed.
- **Plugin NPM Release:** an ordinary `main` push started a preview. The preview
  rejected a plugin whose bundled Codex dependency was behind the then-current
  npm version. Approval, packing, publishing, and verification jobs were
  skipped; nothing was published. The defect was an inappropriate push trigger
  for release infrastructure, not an OpenCraw runtime defect.

## Validation and upstream reconciliation

The policy is guarded by
`test/scripts/opencraw-actions-policy.test.ts`. It fails if an unapproved
automatic event or any schedule returns, if a publication/release workflow
becomes automatic, if a removed upstream workflow reappears, or if a
reusable-only component gains an independent trigger.

For every upstream synchronization:

1. Compare all upstream workflow additions and changes with this matrix.
2. Preserve OpenCraw triggers and operating classes before resolving job-body
   changes.
3. Add a new automatic workflow only when it is fork-safe, self-contained,
   proportionate in cost, credential-independent, and covered by the policy
   test.
4. Re-enable a removed/manual workflow only after OpenCraw documents a current
   need, access ownership, least privilege, runner/cost expectations, a
   non-publishing validation path, and a passing controlled run.
5. Never restore a schedule, organization App dependency, or automatic
   publication merely because it exists upstream.

The upstream job implementation may continue to evolve. OpenCraw preserves
useful manual/reusable machinery while maintaining this trigger policy as a
downstream requirement.
