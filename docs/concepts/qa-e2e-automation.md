---
doc-schema-version: 1
summary: "OpenCraw fork status for inherited QA Lab diagnostics"
read_when:
  - Reviewing QA Lab compatibility or test classification
title: "QA overview"
---

# QA overview

QA Lab, QA Channel, and their repo-backed fixtures remain inherited diagnostic
surfaces. They are not the authoritative normal OpenCraw suite and no dedicated
QA GitHub Actions workflow is retained.

Deterministic local QA tests run only under their machine-readable
classification conditions. Live-transport, credential-dependent, platform,
release, and manual scenarios remain outside the supported command. Missing
requirements fail locally and cannot provision, hydrate, or select an external
worker.

The external desktop-provider compatibility adapter is deliberately fail-closed
at every command entry point and starts no child process. OpenCraw ships no
static SSH or cloud lease provider. Historical QA designs and results are
preserved in immutable Git history without remaining current operating
instructions.

The required clean result is `pnpm test:opencraw`; the broader inherited
aggregate is diagnostic only.

See [Testing](/help/testing), [Mantis](/concepts/mantis), and
[OpenCraw validation infrastructure](/development/opencraw-validation).
