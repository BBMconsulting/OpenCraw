---
summary: "OpenCraw classification boundary for update and plugin diagnostics"
read_when:
  - Testing update or plugin behavior in OpenCraw
title: "Testing updates and plugins"
sidebarTitle: "Update and plugin tests"
---

# Testing updates and plugins

Update, package, publication, and plugin-distribution tests are inherited
diagnostic surfaces. OpenCraw retains no release or publication workflow, and
those tests are not part of the normal supported gate.

Use `pnpm test:opencraw` for the required clean result. Run an inherited update
or plugin diagnostic only when its machine-readable classification condition is
satisfied and the task explicitly requires that surface. Missing services,
credentials, packages, or platform support fail locally; they cannot delegate
to an external runner.

General upstream packaging and release instructions remain in upstream
OpenClaw documentation rather than being duplicated as current OpenCraw
procedure.

See [Testing](/help/testing) and
[OpenCraw validation infrastructure](/development/opencraw-validation).
