---
summary: "OpenCraw fork status for inherited Mantis QA surfaces"
title: "Mantis"
read_when:
  - Reviewing inherited visual QA compatibility
---

# Mantis

Mantis source remains as an inherited diagnostic and compatibility surface.
OpenCraw retains no Mantis GitHub Actions workflow and ships no external desktop
worker provider. Commands that require a lease or remote desktop fail closed in
the provider compatibility adapter before any process or network operation is
started.

Mantis is not part of the authoritative normal OpenCraw test gate. A local,
deterministic Mantis test may run only under its recorded test classification
condition. No missing binary, credential, fixture, or resource condition can
select an external worker.

Historical upstream Mantis designs and results remain in Git history and dated
project records. They do not authorize contacting their providers or replaying
their external workflows.

See [QA overview](/concepts/qa-e2e-automation),
[Testing](/help/testing), and
[OpenCraw validation infrastructure](/development/opencraw-validation).
