#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=release-common.sh
source "$SCRIPT_DIR/release-common.sh"

TARGET_RELEASE=""

usage() {
  cat <<'EOF'
Usage: release-rollback.sh [--release RELEASE_ID]

Atomically switches to an already-installed, independently runnable release.
No package installation, build, data restore, or network download is performed.
Without --release, the recorded previous release is selected.
EOF
}

while (($#)); do
  case "$1" in
    --release)
      [[ $# -ge 2 ]] || die "--release needs an ID"
      [[ "$2" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || die "Unsafe release ID: $2"
      TARGET_RELEASE="${RELEASES_DIR}/$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *) die "Unknown argument: $1" ;;
  esac
done

for command_name in node curl pm2 readlink flock; do
  require_command "$command_name"
done
mkdir -p "$SHARED_DIR"
exec 9>"$SHARED_DIR/deployment.lock"
flock -n 9 || die "Another deployment or rollback is already running"
[[ -L "$CURRENT_LINK" ]] || die "current is not a release symlink: $CURRENT_LINK"
CURRENT_RELEASE="$(assert_release_path "$CURRENT_LINK")"
validate_runnable_release "$CURRENT_RELEASE"

if [[ -z "$TARGET_RELEASE" ]]; then
  [[ -r "$SHARED_DIR/previous-release" ]] || die "No recorded previous release is available"
  IFS= read -r TARGET_RELEASE <"$SHARED_DIR/previous-release"
fi
TARGET_RELEASE="$(assert_release_path "$TARGET_RELEASE")"
validate_runnable_release "$TARGET_RELEASE"
[[ "$TARGET_RELEASE" != "$CURRENT_RELEASE" ]] || die "Requested rollback release is already current"

restore_current_after_failure() {
  log "Rollback target failed; restoring the release that was current at invocation"
  atomic_switch_current "$CURRENT_RELEASE"
  if ! start_or_reload_release "$CURRENT_RELEASE"; then
    die "Original symlink was restored but PM2 could not start the original release"
  fi
  run_production_liveness_checks "$CURRENT_RELEASE" || die "Both rollback target and original release failed liveness checks; operator intervention is required"
  die "Rollback target failed liveness checks; original release was restored"
}

log "Atomically switching from $CURRENT_RELEASE to $TARGET_RELEASE"
atomic_switch_current "$TARGET_RELEASE"
if ! start_or_reload_release "$TARGET_RELEASE"; then
  restore_current_after_failure
fi
if ! run_production_liveness_checks "$TARGET_RELEASE"; then
  restore_current_after_failure
fi

write_release_state "$TARGET_RELEASE" "$CURRENT_RELEASE"
pm2 save
log "Rollback complete. The replaced release remains intact at: $CURRENT_RELEASE"
