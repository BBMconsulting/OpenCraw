---
summary: "Retained GitHub Actions policy for the BBM-controlled OpenCraw repository"
title: "OpenCraw GitHub Actions policy"
read_when:
  - Changing files under .github/workflows
  - Reviewing remote validation or publication behavior
---

# OpenCraw GitHub Actions policy

The BBM-controlled OpenCraw repository retains exactly two workflows:

| Workflow          | Automatic scope                                       | Purpose                                                                                                              |
| ----------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `docs.yml`        | Documentation changes on `main` and pull requests     | Documentation structure, links, formatting, and generated-map checks                                                 |
| `opencraw-ci.yml` | Non-documentation changes on `main` and pull requests | Manifests, full lint, typecheck, supported tests, build, secrets, workflow security, and production dependency audit |

Both workflows may also be invoked manually. Neither is scheduled. Both use
GitHub-hosted `ubuntu-24.04` runners, pinned checkout actions, read-only
default contents permission, frozen dependencies, and repository-local
validation commands.

All other inherited workflow definitions are removed from the active fork.
Release, publication, signing, native packaging, live-provider, and
third-party runner workflows are not retained. Their absence does not weaken
the two supported gates: required local and retained-CI checks are defined in
[OpenCraw validation infrastructure](/development/opencraw-validation).

`pnpm validation:policy` and
`test/scripts/opencraw-actions-policy.test.ts` fail if another workflow,
schedule, unapproved runner, or external-delegation selector is introduced.
Future upstream reconciliation must classify workflow files before accepting
them and must not restore an inherited workflow by filename alone.
