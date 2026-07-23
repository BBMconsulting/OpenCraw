---
summary: "Recover valid unindexed session histories and isolate deployment validation traffic"
read_when:
  - You are migrating legacy JSONL histories into the SQLite session store
  - You found transcript JSONL files that have no legacy session index entry
  - You are validating a live Control UI or agent without polluting a working conversation
title: "Session integrity recovery and validation isolation"
---

# Session integrity recovery and validation isolation

OpenClaw 2026.7.2 and earlier session-SQLite migration code imported only
transcripts named by the legacy `sessions.json` index. A valid transcript that
was present beside that index but was not referenced by it was moved to the
archive tier without a SQLite session entry. The history bytes survived, but
the session became undiscoverable through normal session lists and the Control
UI.

This document records two separate requirements:

1. Valid unindexed legacy histories must remain discoverable after migration.
2. Deployment and interface validation must never use a working conversation's
   session key.

Browser-local failed-message dismissal state is not part of either correction.
It must be reproduced independently before its compare-and-swap behavior or
session-storage semantics are changed.

## Unindexed history recovery

The session-SQLite Doctor importer now inspects unreferenced `*.jsonl` files
before archive-tier cleanup. A file is eligible for recovery only when every
non-empty JSONL line parses as an object and the first event is a session header
with a non-empty header identifier. The legacy storage session identifier comes
from the transcript filename; the embedded header identifier is retained
separately in the receipt. Trajectory sidecars, empty files,
non-session JSONL, and malformed or partially written JSONL are not treated as
recoverable conversation history.

For each valid history, Doctor creates:

- a deterministic recovery session key containing the agent, sanitized source
  identifier, full source-identifier SHA-256, and full content SHA-256;
- a distinct SQLite session entry, route, transcript generation, and active
  event projection;
- a neutral display label that identifies the entry as recovered rather than
  claiming an original title;
- a receipt containing the source filename identifier, embedded header
  identifier, content hash, event count, resulting key and storage identifier,
  collision status, and an explicit `metadataReconstructed` marker.

The original event stream goes through the same legacy normalization boundary
as indexed histories. Event order, roles, timestamps, tool results, and other
recoverable event metadata are retained. After the imported rows validate, the
source JSONL is moved into the normal migration archive and remains covered by
the migration manifest. Content hashing uses bounded streaming reads so a
large valid history is not buffered in memory. `sessionStartedAt` is preserved
only when the session header supplies it; a later event timestamp is never
presented as the original session start.

### Collision and repeat behavior

The recovery key is content-addressed. Repeating an import for the same bytes
selects the same session key and deduplicates the same transcript rows. If the
legacy header identifier is already used by another session—especially the
agent's working `main` session—the importer derives a deterministic alternate
SQLite storage identifier. It never rebinds or overwrites the occupied entry.

Two histories with the same source identifier but different content receive
different recovery keys. Distinct source identifiers also remain distinct when
their readable sanitized prefixes and content happen to match. An unresolved
collision in the full deterministic identity is blocking and must be
investigated; Doctor does not guess a target.
If the selected legacy store path does not establish an owning agent, valid
unindexed history recovery is also blocked rather than assigned across agents.
The path-derived owner must match the selected target agent; a mismatch is a
blocking issue rather than an implicit reassignment.

Malformed or incomplete JSONL produces a warning and is not imported as a
conversation. Non-session JSONL continues through the existing archive-tier
path. This preserves evidence without fabricating session metadata.

### Supported migration sequence

Use the targeted session-SQLite modes described in
[Session management deep dive](/reference/session-management-compaction):

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents
```

Back up the complete agent state and all SQLite sidecars before import. Stop the
owning Gateway for an offline mutation, validate a copied state first, and keep
other service identities and stores separate. The generic importer does not
infer that two agents should share histories or credentials.

## Isolated validation sessions

Health checks remain nondelivering. Any validation that sends a model prompt
through CLI, Playwright, Control UI, WebChat, migration, or deployment tooling
must use a generated key with this shape:

```text
agent:<agent>:validation:<service>:<purpose>:<UTC>:<nonce>
```

Generate the key and optional Control UI URL with:

```bash
pnpm validation:session --service rescue --purpose control-ui \
  --base-url http://127.0.0.1:3000
```

The output includes the exact `--agent` and `--session-key` arguments for an
agent turn. The helper rejects `agent:main:main`, incomplete validation keys,
unknown or duplicate CLI options, and URLs containing credentials or query
parameters. Primary, rescue, staging, and other service roles must use
different service labels. Each validation run gets a timestamp and random
nonce, so temporary browser state cannot append to or relabel an active
conversation.

Validation session rows are retained as attributable evidence and follow the
normal session retention policy. Removing a temporary browser pairing or
browser data must not delete, remap, or clean conversation state.

## Tests and compatibility

Focused importer tests cover one and multiple orphaned histories, large
histories, absent title/index metadata, identifier collisions, repeat imports,
malformed input, interrupted imports, event ordering and roles, protection of
an existing `main` session, and discoverability through the active projection.
Validation-helper tests cover service separation, key rejection, safe Control
UI URL construction, and label normalization.

The correction adds no database schema and does not change indexed-history
imports. The public behavior is the functional requirement: an upstream
implementation may supersede this code when it provides equally safe,
idempotent discovery, explicit reconstructed-metadata receipts, collision
protection, archive evidence, and working-session isolation.

## Known limitations

- Recovery cannot recreate a historical title or legacy index fields that were
  never retained. Such fields remain explicitly reconstructed.
- Corrupt or incomplete histories require separate evidence-led repair; the
  importer intentionally does not salvage or guess missing events.
- Caller-supplied session keys remain a supported OpenClaw capability. The
  validation helper governs validation procedures; it does not prohibit an
  operator from deliberately selecting an existing session for a normal task.
- Browser-local Retry/X behavior is deferred until its stale-version failure
  can be reproduced without using a person's browser profile.
