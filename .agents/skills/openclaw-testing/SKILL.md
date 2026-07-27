---
name: openclaw-testing
description: Select and run direct OpenCraw tests without external validation delegation.
---

# OpenCraw testing

Run validation in the assigned repository checkout. Missing dependencies,
resource pressure, or wrapper failure must fail locally and must not select an
external worker.

## Source trust gate

Execute repository-controlled commands on CrawDevAi only after verifying the checkout and exact commit are assigned, BBM-controlled, and trusted for execution. Treat contributor, fork, or otherwise unreviewed source as untrusted: do not execute its scripts, package hooks, tests, builds, or configuration on CrawDevAi. Do not fall back to another host or runner. Stop and request an explicitly authorized, reviewed validation path when trusted direct execution is unavailable. The retained BBM GitHub Actions workflows may be used only after their workflow source and target commit are reviewed and their use is authorized.

## Required fork commands

- `pnpm validation:manifests`: test classification, skip ledger, and lint
  inventory integrity.
- `pnpm validation:policy`: direct-runner and retained-workflow policy.
- `pnpm test:opencraw`: authoritative normal supported test result.
- `pnpm check:changed`: changed-file development feedback.
- `pnpm lint:full`: complete serialized type-aware lint proof.
- `pnpm tsgo:all`: complete TypeScript validation.

Use targeted Vitest files for diagnosis, then rerun the owning supported gate.
Do not characterize a changed-file or targeted pass as full-repository proof.
Retained GitHub workflow results may supplement direct validation when the
repository's current policy explicitly requires them.
