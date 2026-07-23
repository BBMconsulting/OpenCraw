# OpenCraw Fork Reconciliation Record

This record captures reusable source-integration decisions for the OpenCraw
fork. Instance-specific paths, credentials, service state, backups, and
validation session identifiers remain in the private instance log.

## 2026-07-23 session integrity correction

### Defect and continuing requirements

The session-SQLite importer enumerated legacy histories only through
`sessions.json`. Its later unreferenced-file pass archived every other JSONL
artifact. A structurally valid transcript whose index entry had already been
lost therefore retained its bytes but had no discoverable SQLite session,
route, title projection, generation, or active-event projection.

A separate validation-procedure defect allowed interface and model checks to
use an existing production session key. Those prompts became legitimate
persisted history inside working conversations. This was not a database key
collision or an importer overwrite; the validation caller selected the wrong
session scope.

The continuing requirements are:

- valid unindexed histories remain discoverable without overwriting occupied
  sessions or fabricating original metadata;
- recovery is deterministic, collision-resistant, idempotent, and evidenced;
- invalid or ambiguous histories are warned about rather than guessed;
- every delivering validation run uses an attributable, service-specific
  validation key and never defaults to a working session;
- browser-local Retry/X semantics remain unchanged until the stale-version
  failure is independently reproduced.

### Downstream resolution

The Doctor importer now strictly classifies unreferenced JSONL before archive
cleanup. Valid session histories receive content-addressed recovery keys and
canonical SQLite entries, routes, generations, and active projections. A
collision with an existing storage identifier produces a deterministic
alternate identifier; a collision that cannot be resolved safely is blocking.
Receipts expose source and resulting identifiers, the content SHA-256, event
count, collision adjustment, and reconstructed-metadata status. The original
JSONL remains in the migration archive after validation.

The public validation helper generates keys under
`agent:<agent>:validation:<service>:<purpose>:<UTC>:<nonce>` and provides the
corresponding CLI arguments and optional Control UI URL. It rejects production
keys and credential-bearing URLs. Instance ports, service paths, recovered
identifiers, and operational evidence remain in the private record.

The implementation and test matrix are documented in [Session integrity
recovery and validation isolation](/reference/session-integrity-recovery).

### Upstream relationship and future reconciliation

The fixed upstream merge target
`85fda04df765639c2e2695035f8d99b7d8f7319b` and the later upstream history
reviewed on 2026-07-23 did not contain an equivalent unindexed-history import
or validation-key procedure. This is therefore a maintained downstream
functional requirement.

At the next upstream synchronization, compare behavior rather than patch
shape. Upstream may supersede the implementation only if it preserves valid
unindexed content, creates a discoverable projection, prevents occupied-session
rebinding, remains idempotent, distinguishes malformed input, records
reconstructed metadata and archive evidence, and keeps delivering validation
out of working sessions. A change that merely archives unindexed histories,
silently selects `main`, bypasses the recovery scan, or weakens collision checks
reintroduces the defect.

No database schema change is part of this correction. Historical private-state
recovery and validation-event separation are operational migrations and do not
belong in public commits.

## 2026-07-22 upstream synchronization

### Outcome

OpenCraw was reconciled with the fixed upstream target
`85fda04df765639c2e2695035f8d99b7d8f7319b` by a normal two-parent merge.
The reconciled tree was preserved exactly while the integration method was
changed from a proposed squash to an ancestry-preserving merge.

| Item                                  | Reference                                  |
| ------------------------------------- | ------------------------------------------ |
| First parent (prior OpenCraw `main`)  | `2becef135a33bfb4ba2b26767c13d195dd1e2164` |
| Second parent (fixed upstream target) | `85fda04df765639c2e2695035f8d99b7d8f7319b` |
| Prior `origin/main`                   | `c4075cda9efa1d78cd8e6bd8dc0e4fc6048d53c8` |
| Prior merge base                      | `d4819948f37d45fe8f1428401316eaae456cdf16` |
| Reconciled merge commit               | `209f05dc8daafce348247726c57cb60c0b6e6144` |
| Reconciled tree                       | `60a58e65c32b17522d1fc640f14b2d60a5da6135` |
| Resulting upstream merge base         | `85fda04df765639c2e2695035f8d99b7d8f7319b` |

The merge commit has the prior OpenCraw `main` as its first parent and the
fixed upstream target as its second parent. The upstream target is therefore
an ancestor of the reconciled branch, and future synchronization starts from
that target rather than replaying the same upstream range.

### Integration policy

The proposed `git merge --squash upstream/main` method was rejected for this
cycle. A squash would have reproduced the reconciled tree but would not have
recorded the upstream target as a parent. Its future merge base would have
remained `d4819948f37d45fe8f1428401316eaae456cdf16`; the next synchronization
would consequently reconsider the already-integrated upstream range and
recreate avoidable conflicts.

Upstream synchronization is a narrow exception to the repository rule that
keeps `main` linear. A two-parent merge may be used when it is required to
preserve upstream ancestry and establish the correct merge base. Ordinary
OpenCraw feature, repair, and documentation commits remain linear.

### Reconciliation decisions

The merge produced 21 conflict paths. Each conflict was resolved against the
combined intent of the upstream target and the downstream customization,
rather than by selecting either side wholesale.

| Area                                   | Decision                                                                                                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upstream source and dependency changes | Accept the fixed upstream target except where a documented downstream behavior required reconciliation.                                                                                                                                                       |
| Fork identity and attribution          | Retain the OpenCraw name, purpose, and downstream attribution while preserving upstream attribution.                                                                                                                                                          |
| Configuration last-good recovery       | Retain recovery and adapt it to the upstream observer implementation. External config paths use a bounded, collision-resistant full SHA-256 sidecar name; legacy recovery candidates require a matching promoted-content hash before migration.               |
| Workflow scheduling                    | Retain downstream schedule suppression in `control-ui-locale-refresh.yml`, `install-smoke.yml`, `openclaw-performance.yml`, `openclaw-scheduled-live-checks.yml`, `qa-live-transports-convex.yml`, and `stale.yml`. Other workflow triggers remain available. |
| Concrete-task execution guard          | Retain the downstream requirement that an acknowledgment alone is not transformed into authorization to begin tool execution.                                                                                                                                 |
| Documentation and evidence             | Keep reusable reconciliation decisions public and instance-specific deployment evidence private.                                                                                                                                                              |

No downstream customization required removal. The ancestry exception was the
only required U/D policy decision, and it was approved for upstream
synchronization commits.

### Validation

The preserved reconciled tree passed the following gates:

- Focused configuration-observer recovery suite: 42 tests passed.
- Workflow validation: passed, including the six schedule suppressions.
- Changed-scope validation: all 24 stages passed.
- Production build: passed; build metadata and runtime stamp identify
  `209f05dc8daafce348247726c57cb60c0b6e6144`.
- Automated review: no remaining findings; patch-correctness confidence 0.97.
- Secret scan: no verified secret finding.
- Both configured deployment roles passed read-only health checks and an
  isolated, nondelivering model turn on the built commit.

Operational paths, service configuration, rollback material, and detailed
runtime evidence are intentionally excluded from this public record.

## 2026-07-19 baseline assessment

The earlier assessment found that `upstream/main` still resolved to
`d4819948f37d45fe8f1428401316eaae456cdf16`, which was already the downstream
merge base. No new upstream delta existed, so no merge was created. The
material downstream customizations recorded at that point were fork identity,
historical upstream integrations, last-good configuration recovery, workflow
schedule suppression, and the concrete-task execution guard. Those decisions
formed the inventory used in the 2026-07-22 reconciliation.
