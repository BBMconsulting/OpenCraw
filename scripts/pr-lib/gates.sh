ci_dispatch() {
  local pr="$1"
  local record head_ref head_sha is_cross_repository
  record=$(gh pr view "$pr" --json headRefName,headRefOid,isCrossRepository)
  head_ref=$(printf '%s\n' "$record" | jq -r .headRefName)
  head_sha=$(printf '%s\n' "$record" | jq -r .headRefOid)
  is_cross_repository=$(printf '%s\n' "$record" | jq -r .isCrossRepository)
  if [ -z "$head_ref" ] || [ "$head_ref" = "null" ] || [ -z "$head_sha" ] || [ "$head_sha" = "null" ]; then
    echo "PR #$pr is missing remote headRefName/headRefOid metadata." >&2
    return 1
  fi
  if [ "$is_cross_repository" = "true" ]; then
    echo "PR #$pr comes from a fork; release-gate workflow dispatch requires a base-repository branch at $head_sha." >&2
    return 1
  fi

  mark_pr_operation_side_effects_if_available
  node "$script_parent_dir/pr-lib/ci-dispatch.mjs" "$pr" "$head_ref" "$head_sha" false
}

mark_pr_operation_side_effects_if_available() {
  # scripts/pr sources operation-lock.sh first. Policy tests may source this
  # library alone, where advancing a lock phase is neither possible nor needed.
  if declare -F mark_pr_operation_side_effects_started >/dev/null; then
    mark_pr_operation_side_effects_started
  fi
}

pin_worktree_bundled_plugins_dir() {
  # Nested .worktrees/<pr> checkouts resolve vitest tooling from the primary
  # checkout's node_modules; pin bundled plugin discovery to this worktree so
  # PR branches without the openclaw-root node_modules-boundary fix still test
  # their own extensions instead of the primary checkout's stale trees.
  export OPENCLAW_BUNDLED_PLUGINS_DIR="${OPENCLAW_BUNDLED_PLUGINS_DIR:-$PWD/extensions}"
}

resolve_pr_gates_remote_mode() {
  printf 'local\n'
}

PR_GATES_LOCK_PID=""
PR_GATES_LOCK_STATUS_FILE=""

acquire_pr_gates_lock() {
  # Serialize whole gate blocks across .worktrees on the shared heavy-check
  # lock; a queued gate run waits here, before its first command, instead of
  # dying on child lock timeouts or shard no-output watchdog kills mid-test.
  if [ "${OPENCLAW_TEST_HEAVY_CHECK_LOCK_HELD:-}" = "1" ]; then
    return 0
  fi

  PR_GATES_LOCK_STATUS_FILE=$(mktemp)
  # Use the canonical helper: the PR branch under test may predate it.
  local scripts_dir="${script_parent_dir:-}"
  if [ -z "$scripts_dir" ]; then
    scripts_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
  fi
  node "$scripts_dir/pr-gates-lock.mjs" --status-file "$PR_GATES_LOCK_STATUS_FILE" &
  PR_GATES_LOCK_PID=$!
  while [ ! -s "$PR_GATES_LOCK_STATUS_FILE" ]; do
    if ! kill -0 "$PR_GATES_LOCK_PID" 2>/dev/null; then
      wait "$PR_GATES_LOCK_PID" 2>/dev/null || true
      PR_GATES_LOCK_PID=""
      echo "Failed to acquire the shared local heavy-check lock for prepare gates."
      exit 1
    fi
    sleep 0.2
  done
  # Same held-lock contract check-changed uses for its children: gate stages
  # must not re-acquire the lock the block holder already owns.
  export OPENCLAW_TEST_HEAVY_CHECK_LOCK_HELD=1
  export OPENCLAW_TSGO_HEAVY_CHECK_LOCK_HELD=1
  export OPENCLAW_OXLINT_SKIP_LOCK=1
}

prepare_local_gate_workspace() {
  pin_worktree_bundled_plugins_dir
  acquire_pr_gates_lock
  bootstrap_deps_if_needed
}

release_pr_gates_lock() {
  if [ -z "${PR_GATES_LOCK_PID:-}" ]; then
    return 0
  fi
  kill "$PR_GATES_LOCK_PID" 2>/dev/null || true
  wait "$PR_GATES_LOCK_PID" 2>/dev/null || true
  PR_GATES_LOCK_PID=""
  rm -f "$PR_GATES_LOCK_STATUS_FILE"
  PR_GATES_LOCK_STATUS_FILE=""
  unset OPENCLAW_TEST_HEAVY_CHECK_LOCK_HELD OPENCLAW_TSGO_HEAVY_CHECK_LOCK_HELD OPENCLAW_OXLINT_SKIP_LOCK
}

write_gates_env_stamp() {
  local pr="$1"
  local docs_only="$2"
  local changelog_required="$3"
  local gates_mode="$4"
  local last_verified_head="$5"
  local full_gates_head="$6"
  local hosted_gates_head="$7"
  local remote_provider="$8"
  local remote_lease_id="$9"
  local remote_run_url="${10}"

  # Security: shell-escape values to prevent command injection when sourced.
  printf '%s=%q\n' \
    PR_NUMBER "$pr" \
    DOCS_ONLY "$docs_only" \
    CHANGELOG_REQUIRED "$changelog_required" \
    GATES_MODE "$gates_mode" \
    LAST_VERIFIED_HEAD_SHA "$last_verified_head" \
    FULL_GATES_HEAD_SHA "$full_gates_head" \
    HOSTED_GATES_TARGET_HEAD_SHA "$hosted_gates_head" \
    REMOTE_GATES_PROVIDER "$remote_provider" \
    REMOTE_GATES_LEASE_ID "$remote_lease_id" \
    REMOTE_GATES_RUN_URL "$remote_run_url" \
    GATES_PASSED_AT "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    > .local/gates.env
}

derive_prepare_gate_change_plan() {
  PREPARE_GATE_CHANGED_FILES=$(git diff --name-only origin/main...HEAD)
  PREPARE_GATE_DOCS_ONLY=false
  if file_list_is_docsish_only "$PREPARE_GATE_CHANGED_FILES"; then
    PREPARE_GATE_DOCS_ONLY=true
  fi
  PREPARE_GATE_CHANGELOG_ONLY=false
  if [ "$PREPARE_GATE_CHANGED_FILES" = "CHANGELOG.md" ]; then
    PREPARE_GATE_CHANGELOG_ONLY=true
  fi
  PREPARE_GATE_CHANGELOG_REQUIRED=false
  if changelog_required_for_changed_files "$PREPARE_GATE_CHANGED_FILES"; then
    PREPARE_GATE_CHANGELOG_REQUIRED=true
  fi
}

run_prepare_push_retry_gates() {
  local docs_only="${1:-false}"

  prepare_local_gate_workspace
  run_quiet_logged "pnpm build (lease-retry)" ".local/lease-retry-build.log" pnpm build
  run_quiet_logged "pnpm check (lease-retry)" ".local/lease-retry-check.log" pnpm check

  local retry_head
  retry_head=$(git rev-parse HEAD)
  local gates_mode="full"
  local full_gates_head="$retry_head"

  if [ "$docs_only" = "true" ]; then
    release_pr_gates_lock
    gates_mode="docs_only"
    full_gates_head="${FULL_GATES_HEAD_SHA:-}"
  else
    run_quiet_logged "pnpm test:opencraw (lease-retry)" ".local/lease-retry-test.log" pnpm test:opencraw
    release_pr_gates_lock
  fi

  write_gates_env_stamp \
    "${PR_NUMBER:-}" \
    "$docs_only" \
    "${CHANGELOG_REQUIRED:-false}" \
    "$gates_mode" \
    "$retry_head" \
    "$full_gates_head" \
    "" "" "" ""
}

prepare_gates() {
  local pr="$1"

  enter_worktree "$pr" false

  mark_pr_operation_side_effects_if_available
  refresh_prep_branch_for_reviewed_head "$pr"
  checkout_prep_branch "$pr"
  require_artifact .local/pr-meta.env
  # shellcheck disable=SC1091
  source .local/pr-meta.env

  derive_prepare_gate_change_plan
  local changed_files="$PREPARE_GATE_CHANGED_FILES"
  local docs_only="$PREPARE_GATE_DOCS_ONLY"
  local changelog_only="$PREPARE_GATE_CHANGELOG_ONLY"
  local changelog_required="$PREPARE_GATE_CHANGELOG_REQUIRED"

  local has_changelog_update=false
  local unsupported_changelog_fragments=""
  local changed_path
  while IFS= read -r changed_path; do
    [ -n "$changed_path" ] || continue
    case "$changed_path" in
      CHANGELOG.md)
        has_changelog_update=true
        ;;
      changelog/fragments/*)
        unsupported_changelog_fragments="${unsupported_changelog_fragments}${changed_path}"$'\n'
        ;;
    esac
  done <<<"$changed_files"
  if [ -n "$unsupported_changelog_fragments" ]; then
    echo "Unsupported changelog fragment files detected:"
    printf '%s\n' "$unsupported_changelog_fragments"
    echo "Move changelog fragment content into CHANGELOG.md and remove changelog/fragments files."
    exit 1
  fi

  if [ "$has_changelog_update" = "true" ]; then
    if ! root_changelog_update_allowed_for_pr; then
      echo "CHANGELOG.md is release-owned; normal PRs should put release-note context in the PR body or commit message."
      echo "Set OPENCLAW_ALLOW_ROOT_CHANGELOG_PR=1 only for explicit release automation or maintainer release closeout."
      exit 1
    fi
    normalize_pr_changelog_entries "$pr"
    validate_changelog_attribution_policy
  fi

  if [ "$changelog_required" = "true" ]; then
    local contrib="${PR_AUTHOR:-}"
    validate_changelog_merge_hygiene
    validate_changelog_entry_for_pr "$pr" "$contrib"
  else
    echo "Changelog not required for this changed-file set."
  fi

  local current_head
  current_head=$(git rev-parse HEAD)
  local previous_last_verified_head=""
  local previous_full_gates_head=""
  local remote_gates_provider=""
  local remote_gates_lease_id=""
  local remote_gates_run_url=""
  if [ -s .local/gates.env ]; then
    # shellcheck disable=SC1091
    source .local/gates.env
    previous_last_verified_head="${LAST_VERIFIED_HEAD_SHA:-}"
    previous_full_gates_head="${FULL_GATES_HEAD_SHA:-}"
    # Carried alongside FULL_GATES_HEAD_SHA: they describe how that full-suite
    # proof was produced; a fresh full run below overwrites them.
    remote_gates_provider="${REMOTE_GATES_PROVIDER:-}"
    remote_gates_lease_id="${REMOTE_GATES_LEASE_ID:-}"
    remote_gates_run_url="${REMOTE_GATES_RUN_URL:-}"
  fi

  local gates_mode="full"
  local hosted_gates_head=""
  local reuse_gates=false
  if [ "$docs_only" = "true" ] && [ -n "$previous_last_verified_head" ] && git merge-base --is-ancestor "$previous_last_verified_head" HEAD 2>/dev/null; then
    local delta_since_verified
    delta_since_verified=$(git diff --name-only "$previous_last_verified_head"..HEAD)
    if [ -z "$delta_since_verified" ] || file_list_is_docsish_only "$delta_since_verified"; then
      reuse_gates=true
    fi
  fi

  if [ "$reuse_gates" = "true" ]; then
    gates_mode="reused_docs_only"
    echo "Docs/changelog-only delta since last verified head $previous_last_verified_head; reusing prior gates."
  else
    prepare_local_gate_workspace
    run_quiet_logged "pnpm build" ".local/gates-build.log" pnpm build
    run_quiet_logged "pnpm check" ".local/gates-check.log" pnpm check

    if [ "$docs_only" = "true" ]; then
      release_pr_gates_lock
      gates_mode="docs_only"
      previous_full_gates_head=""
      remote_gates_provider=""
      remote_gates_lease_id=""
      remote_gates_run_url=""
      echo "Docs-only change detected with high confidence; skipping pnpm test:opencraw."
    else
      gates_mode="full"
      if [ -n "${OPENCLAW_VITEST_MAX_WORKERS:-}" ]; then
        echo "Running pnpm test:opencraw with OPENCLAW_VITEST_MAX_WORKERS=$OPENCLAW_VITEST_MAX_WORKERS."
        run_quiet_logged \
          "pnpm test:opencraw" \
          ".local/gates-test.log" \
          env OPENCLAW_VITEST_MAX_WORKERS="$OPENCLAW_VITEST_MAX_WORKERS" pnpm test:opencraw
      else
        echo "Running pnpm test:opencraw with host-aware scheduling defaults."
        run_quiet_logged "pnpm test:opencraw" ".local/gates-test.log" pnpm test:opencraw
      fi
      release_pr_gates_lock
      remote_gates_provider=""
      remote_gates_lease_id=""
      remote_gates_run_url=""
      previous_full_gates_head="$current_head"
    fi
  fi

  write_gates_env_stamp \
    "$pr" \
    "$docs_only" \
    "$changelog_required" \
    "$gates_mode" \
    "$current_head" \
    "${previous_full_gates_head:-}" \
    "$hosted_gates_head" \
    "$remote_gates_provider" \
    "$remote_gates_lease_id" \
    "$remote_gates_run_url"

  echo "docs_only=$docs_only"
  echo "changelog_only=$changelog_only"
  echo "changelog_required=$changelog_required"
  echo "gates_mode=$gates_mode"
  echo "wrote=.local/gates.env"
}
