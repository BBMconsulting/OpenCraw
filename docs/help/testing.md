---
summary: "Supported OpenCraw tests and classified diagnostic suites"
read_when:
  - Running tests locally or in CI
  - Adding or reclassifying a test
title: "Testing"
---

# Testing

The authoritative normal OpenCraw test command is:

```bash
pnpm test:opencraw
```

It validates the machine-readable classification and runs only
`normal-supported` files. A supported result is green with no expected skips.

Run the manifest check before committing test changes:

```bash
pnpm validation:manifests
```

After an intentional test addition or classification change, update and verify
the generated records:

```bash
pnpm validation:manifests:update
pnpm validation:manifests
```

The inherited `pnpm test` aggregate remains a local Vitest diagnostic. It
includes tests classified outside `normal-supported`, so platform or
environment conditions can produce expected skips; it is not the supported
gate. Live-provider, E2E, Docker, release, and publication lanes use separate
opt-in commands. Non-normal suites run only under the condition recorded in the
classification inventory; missing requirements fail locally and never
provision or select an external runner.

See [OpenCraw tests](/reference/test) and
[OpenCraw validation infrastructure](/development/opencraw-validation).
