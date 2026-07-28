---
summary: "Inactive inherited full-release validation reference"
title: "Full release validation"
read_when:
  - Reviewing historical upstream release-validation behavior
---

# Full release validation

The inherited Full Release Validation process is inactive in OpenCraw. Its
parent and child workflows are not retained, and it is not a supported local or
remote gate for this fork.

Current required validation consists of the direct repository commands and the
two retained BBM-controlled workflows documented in
[OpenCraw validation infrastructure](/development/opencraw-validation). Missing
requirements fail locally and cannot dispatch another workflow or external
runner.

Historical upstream workflow structure and evidence remain available through
Git history and upstream documentation for compatibility research. They are not
current OpenCraw operating instructions.

See [Release status](/reference/RELEASING) and
[OpenCraw GitHub Actions policy](/reference/github-actions-policy).
