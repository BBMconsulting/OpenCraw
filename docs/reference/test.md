---
summary: "OpenCraw supported and classified test commands"
title: "OpenCraw tests"
---

# OpenCraw tests

The required normal command is:

```bash
pnpm test:opencraw
```

It validates the machine-readable inventories and runs only tests classified
as `normal-supported`. A passing result is green with zero expected skips.

Before changing classifications:

```bash
pnpm validation:manifests
```

After intentionally adding or reclassifying a test:

```bash
pnpm validation:manifests:update
pnpm validation:manifests
```

The broader inherited `pnpm test` command remains useful as a local aggregate
diagnostic. It runs the repository's Vitest projects, including tests classified
outside `normal-supported`, so platform or environment conditions can produce
expected skips. Live-provider, E2E, Docker, release, and publication lanes use
separate opt-in commands; they are not implicitly run by `pnpm test`. Neither
the diagnostic aggregate nor those opt-in lanes replace the authoritative
supported OpenCraw gate.

Category definitions, conditions, the complete skip ledger, and current
evidence are maintained in
[OpenCraw validation infrastructure](/development/opencraw-validation).
