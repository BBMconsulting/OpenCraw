---
summary: "Supported OpenCraw local and retained-CI validation"
title: "OpenCraw continuous integration"
---

# OpenCraw continuous integration

OpenCraw validation runs directly in the checked-out repository or in the two
retained workflows of the BBM-controlled repository.

## Local gates

```bash
pnpm validation:manifests
pnpm validation:policy
pnpm lint:full
pnpm tsgo:all
pnpm test:opencraw
pnpm build
```

`pnpm check:changed` is the faster development path for changed files; it is
not a substitute for `pnpm lint:full`.

## Retained workflows

- **Docs** validates documentation-only changes.
- **OpenCraw CI** validates source changes with full lint, production
  typechecking, the classified supported suite, production build, secret and
  private-key detection, workflow analysis, and production dependency audit.

See [OpenCraw validation infrastructure](/development/opencraw-validation) and
[OpenCraw GitHub Actions policy](/reference/github-actions-policy).
