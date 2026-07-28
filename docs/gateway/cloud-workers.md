---
summary: "OpenCraw fork status for inherited cloud-worker compatibility surfaces"
title: "Cloud Workers"
sidebarTitle: "Cloud Workers"
---

# Cloud workers

## OpenCraw fork status

OpenCraw does not ship or enable a cloud-worker provider. The inherited bundled
lease provider and the QA static-SSH provider have been removed from this fork.
The stock OpenCraw distribution therefore has no supported profile that can
provision or connect to an external worker.

OpenCraw validation runs directly on the assigned BBM-controlled development
host or in the two retained workflows of the BBM-controlled GitHub repository.
Missing dependencies, insufficient resources, or local validation failures fail
locally. They cannot select, provision, hydrate, or fall back to an external
worker.

Do not install or configure a third-party worker provider as an OpenCraw
validation path. Such a change requires separate U/D authorization and a new
security and compatibility review.

## Compatibility boundary

Gateway protocol names, configuration types, and restricted worker-runtime code
may remain so OpenCraw can track upstream interfaces without an executable
provider. Their presence does not enable worker provisioning and does not grant
authorization to contact an external host or provider. The historical
[cloud-worker plan](/plan/cloud-workers) is retained only as upstream design
context and is inactive in OpenCraw.
