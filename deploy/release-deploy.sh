#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=release-common.sh
source "$SCRIPT_DIR/release-common.sh"

ARCHIVE=""
CHECKSUM_FILE=""
RELEASE_ID=""
SMOKE_PORT="${SMOKE_PORT:-3099}"
SMOKE_PID=""
SMOKE_DATA_DIR=""
STAGING_ROOT=""
DRY_RUN=0
LEGACY_SERVER_INSTALL=0
PROMOTED=0
STORE_CHECKSUM=""

usage() {
  cat <<'EOF'
Usage: release-deploy.sh --archive PATH --checksum PATH [--release-id ID] [--smoke-port PORT] [--dry-run] [--legacy-server-install]

Stages a finished release, checks it, and atomically promotes it. The default
mode is prebuilt: the archive must already contain linux-x64 node_modules,
including node_modules/.bin/vinext and sharp's glibc binary. This mode does
not run npm ci, npm install, or a build.

--dry-run checks the archive and leaves current unchanged.
--legacy-server-install runs npm ci for an old archive that has no
node_modules. Do not use that flag on the production Droplet.

The script never writes to the live CMS data directory.
EOF
}

cleanup() {
  if [[ -n "$SMOKE_PID" ]] && kill -0 "$SMOKE_PID" 2>/dev/null; then
    kill "$SMOKE_PID" 2>/dev/null || true
    wait "$SMOKE_PID" 2>/dev/null || true
  fi
  if [[ -n "$SMOKE_DATA_DIR" && -d "$SMOKE_DATA_DIR" ]]; then
    rm -rf "$SMOKE_DATA_DIR"
  fi
  if [[ "$PROMOTED" != "1" && -n "$STAGING_ROOT" && -e "$STAGING_ROOT" ]]; then
    case "$STAGING_ROOT" in
      "${RELEASES_DIR}/."*) rm -rf "$STAGING_ROOT" || true ;;
    esac
  fi
}
trap cleanup EXIT

while (($#)); do
  case "$1" in
    --archive)
      [[ $# -ge 2 ]] || die "--archive needs a path"
      ARCHIVE="$2"
      shift 2
      ;;
    --checksum)
      [[ $# -ge 2 ]] || die "--checksum needs a path"
      CHECKSUM_FILE="$2"
      shift 2
      ;;
    --release-id)
      [[ $# -ge 2 ]] || die "--release-id needs a value"
      RELEASE_ID="$2"
      shift 2
      ;;
    --smoke-port)
      [[ $# -ge 2 ]] || die "--smoke-port needs a value"
      SMOKE_PORT="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --legacy-server-install)
      LEGACY_SERVER_INSTALL=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *) die "Unknown argument: $1" ;;
  esac
done

[[ -n "$ARCHIVE" ]] || die "--archive is required"
[[ -n "$CHECKSUM_FILE" ]] || die "--checksum is required"
ARCHIVE="$(readlink -f "$ARCHIVE")"
CHECKSUM_FILE="$(readlink -f "$CHECKSUM_FILE")"
[[ -f "$ARCHIVE" ]] || die "Archive does not exist: $ARCHIVE"
[[ -f "$CHECKSUM_FILE" ]] || die "Checksum file does not exist: $CHECKSUM_FILE"
[[ "$SMOKE_PORT" =~ ^[0-9]+$ ]] || die "Smoke port must be numeric"
((SMOKE_PORT >= 1024 && SMOKE_PORT <= 65535)) || die "Smoke port must be between 1024 and 65535"

if [[ -z "$RELEASE_ID" ]]; then
  archive_name="$(basename "$ARCHIVE")"
  archive_name="${archive_name%.tar.gz}"
  RELEASE_ID="$(date -u +%Y%m%dT%H%M%SZ)-${archive_name}"
fi
[[ "$RELEASE_ID" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || die "Unsafe release ID: $RELEASE_ID"

if [[ "$DRY_RUN" == "1" ]]; then
  for command_name in node tar sha256sum readlink flock awk find; do
    require_command "$command_name"
  done
else
  for command_name in node npm tar sha256sum curl pm2 rsync readlink flock awk find; do
    require_command "$command_name"
  done
fi
node -e '
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    throw new Error(`Node 22.13+ is required; found ${process.versions.node}`);
  }
'

if [[ "$DRY_RUN" != "1" ]]; then
  pm2_preflight="$(mktemp /tmp/oldseadogs-pm2-preflight.XXXXXX)"
  pm2 jlist >"$pm2_preflight"
  if ! node -e '
    const fs = require("node:fs");
    const processes = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const legacy = processes.find((entry) => entry.name === "oldseadogs" && entry.pm2_env?.status === "online");
    if (legacy) process.exit(2);
  ' "$pm2_preflight"; then
    rm -f "$pm2_preflight"
    die "Legacy PM2 process oldseadogs is online; establish oldseadogs-web as the sole production process before release deployment"
  fi
  rm -f "$pm2_preflight"
fi

[[ -d "$DATA_DIR" ]] || die "Production data directory is missing: $DATA_DIR"
[[ -r "$DATA_DIR/editor-store.json" ]] || die "Production editor store is not readable"
[[ -r "$ENV_FILE" ]] || die "Runtime environment file is not readable: $ENV_FILE"
STORE_CHECKSUM="$(sha256sum "$DATA_DIR/editor-store.json" | awk 'NR==1 { print $1 }')"

assert_editor_store_unchanged() {
  local now
  now="$(sha256sum "$DATA_DIR/editor-store.json" | awk 'NR==1 { print $1 }')"
  [[ "$now" == "$STORE_CHECKSUM" ]] || die "editor-store.json changed during the deploy. The live CMS file must not be written."
}

mkdir -p "$RELEASES_DIR" "$SHARED_DIR/logs" "$BACKUP_ROOT"
exec 9>"$SHARED_DIR/deployment.lock"
flock -n 9 || die "Another deployment or rollback is already running"
FINAL_RELEASE="${RELEASES_DIR}/${RELEASE_ID}"
STAGING_ROOT="${RELEASES_DIR}/.${RELEASE_ID}.staging"
[[ ! -e "$FINAL_RELEASE" ]] || die "Release already exists: $FINAL_RELEASE"
[[ ! -e "$STAGING_ROOT" ]] || die "Staging path already exists: $STAGING_ROOT"

log "Verifying archive SHA-256"
mapfile -t checksum_matches < <(awk -v expected="$(basename "$ARCHIVE")" '
  {
    name = $2
    sub(/^\*/, "", name)
    if (name == expected && $1 ~ /^[0-9A-Fa-f]{64}$/) print tolower($1)
  }
' "$CHECKSUM_FILE")
[[ ${#checksum_matches[@]} -eq 1 ]] || die "Checksum file must contain exactly one valid entry for $(basename "$ARCHIVE")"
actual_archive_checksum="$(sha256sum "$ARCHIVE")"
actual_archive_checksum="${actual_archive_checksum%% *}"
[[ "$actual_archive_checksum" == "${checksum_matches[0]}" ]] || die "Archive SHA-256 does not match the supplied checksum"
log "Archive SHA-256 passed: $actual_archive_checksum"

log "Inspecting archive paths before extraction"
if tar -tzf "$ARCHIVE" | grep -Eq '(^/|(^|/)\.\.(/|$))'; then
  die "Archive contains an unsafe absolute or parent path"
fi
mapfile -t archive_roots < <(tar -tzf "$ARCHIVE" | sed '/^$/d' | cut -d/ -f1 | sort -u)
[[ ${#archive_roots[@]} -eq 1 ]] || die "Archive must contain exactly one top-level directory"

mkdir "$STAGING_ROOT"
tar -xzf "$ARCHIVE" -C "$STAGING_ROOT" --no-same-owner --no-same-permissions
STAGED_RELEASE="${STAGING_ROOT}/${archive_roots[0]}"
[[ -d "$STAGED_RELEASE" ]] || die "Archive top-level directory is missing after extraction"

for required_path in package.json package-lock.json ecosystem.config.cjs dist dist/server/index.js public scripts lib/generated-build-info.ts SHA256SUMS; do
  [[ -e "$STAGED_RELEASE/$required_path" ]] || die "Package is incomplete; missing $required_path"
done

log "Verifying the package's internal payload manifest"
(
  cd "$STAGED_RELEASE"
  sha256sum --check SHA256SUMS
)

forbidden_file="$(find_forbidden_runtime_file "$STAGED_RELEASE")"
if [[ -n "$forbidden_file" ]]; then
  die "Package contains runtime data, an environment file, a log, or a nested archive: $forbidden_file"
fi
if [[ -e "$STAGED_RELEASE/.git" || -e "$STAGED_RELEASE/.next/cache" ]]; then
  die "Package contains excluded build-host or repository state"
fi

if [[ "$LEGACY_SERVER_INSTALL" == "1" ]]; then
  if [[ -e "$STAGED_RELEASE/node_modules" ]]; then
    die "Legacy install refuses a package that already contains node_modules. Use the default prebuilt mode instead."
  fi
  if [[ "$DRY_RUN" == "1" ]]; then
    assert_editor_store_unchanged
    log "Dry run: legacy server install was not executed. npm ci was not run. Nothing was promoted."
    exit 0
  fi
  log "WARNING: --legacy-server-install runs npm ci on this machine. Do not use this flag on the production Droplet."
  load_runtime_environment
  (
    cd "$STAGED_RELEASE"
    npm ci --include=dev --no-audit --no-fund
  )
  validate_prebuilt_runtime "$STAGED_RELEASE"
else
  [[ -d "$STAGED_RELEASE/node_modules" ]] || die "Prebuilt mode is the default and does not run npm ci, npm install, or a build. This package has no node_modules, so it cannot start. Build it on linux-x64 with deploy/release-package.sh. --legacy-server-install is an emergency override and is not for the production Droplet."
  [[ -f "$STAGED_RELEASE/RELEASE_MANIFEST.json" ]] || die "Prebuilt package is missing RELEASE_MANIFEST.json"
  manifest_commit="$(read_prebuilt_manifest_commit "$STAGED_RELEASE/RELEASE_MANIFEST.json")" || die "Package manifest is not a linux-x64 glibc prebuilt release"
  validate_prebuilt_runtime "$STAGED_RELEASE"
  log "Prebuilt package gitCommit: $manifest_commit"
  if [[ "$DRY_RUN" == "1" ]]; then
    assert_editor_store_unchanged
    log "Dry run passed for release $RELEASE_ID (gitCommit $manifest_commit). npm ci was not run. Nothing was promoted. editor-store.json was not changed."
    exit 0
  fi
  load_runtime_environment
fi

log "Running compiled-package verification before promotion"
(
  cd "$STAGED_RELEASE"
  node scripts/check-digitalocean-build.mjs
  npm run check:bridge
  npm run check:controlled-media
)

if [[ -d "$STAGED_RELEASE/logs" ]] && [[ -z "$(find "$STAGED_RELEASE/logs" -mindepth 1 -print -quit)" ]]; then
  rmdir "$STAGED_RELEASE/logs"
fi
[[ ! -e "$STAGED_RELEASE/logs" ]] || die "Release contains a non-empty logs path"
ln -s "$SHARED_DIR/logs" "$STAGED_RELEASE/logs"

if curl --silent --show-error --max-time 2 "http://127.0.0.1:${SMOKE_PORT}/" >/dev/null 2>&1; then
  die "Smoke-test port is already serving HTTP: $SMOKE_PORT"
fi

SMOKE_DATA_DIR="$(mktemp -d /tmp/oldseadogs-release-smoke.XXXXXX)"
cp --preserve=mode,timestamps "$DATA_DIR/editor-store.json" "$SMOKE_DATA_DIR/editor-store.json"
mkdir "$SMOKE_DATA_DIR/media"
assert_editor_store_unchanged
log "Starting the staged release on isolated port $SMOKE_PORT with a disposable production-data snapshot"
(
  cd "$STAGED_RELEASE"
  OLDSEADOGS_DATA_DIR="$SMOKE_DATA_DIR" \
    OLDSEADOGS_ENV=production \
    OLDSEADOGS_RUNTIME=node \
    HOST=127.0.0.1 \
    PORT="$SMOKE_PORT" \
    npm run start:do
) >"$STAGING_ROOT/smoke-server.log" 2>&1 &
SMOKE_PID=$!

SMOKE_BASE_URL="http://127.0.0.1:${SMOKE_PORT}"
if ! run_content_health_checks "$STAGED_RELEASE" "$SMOKE_BASE_URL" "$SMOKE_DATA_DIR/editor-store.json"; then
  log "Staged server output follows:"
  tail -n 100 "$STAGING_ROOT/smoke-server.log" >&2 || true
  die "Staged release failed content health checks"
fi
kill "$SMOKE_PID"
wait "$SMOKE_PID" 2>/dev/null || true
SMOKE_PID=""
rm -rf "$SMOKE_DATA_DIR"
SMOKE_DATA_DIR=""
rm -f "$STAGING_ROOT/smoke-server.log"
log "Staged release passed homepage, editor, API, and featured-story checks"
assert_editor_store_unchanged

log "Creating a read-only-source backup of the production editor store"
BACKUP_DIR="${BACKUP_ROOT}/${RELEASE_ID}"
mkdir "$BACKUP_DIR"
cp --preserve=mode,timestamps "$DATA_DIR/editor-store.json" "$BACKUP_DIR/editor-store.json"
node -e '
  const fs = require("node:fs");
  JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
' "$DATA_DIR/editor-store.json" "$BACKUP_DIR/editor-store.json"
(
  cd "$BACKUP_DIR"
  sha256sum editor-store.json >editor-store.json.sha256
  sha256sum --check editor-store.json.sha256
)
assert_editor_store_unchanged

if [[ -L "$CURRENT_LINK" ]]; then
  PREVIOUS_RELEASE="$(assert_release_path "$CURRENT_LINK")"
  validate_runnable_release "$PREVIOUS_RELEASE"
elif [[ -e "$CURRENT_LINK" ]]; then
  die "current exists but is not a symlink: $CURRENT_LINK"
else
  BOOTSTRAP_ID="bootstrap-$(date -u +%Y%m%dT%H%M%SZ)"
  PREVIOUS_RELEASE="${RELEASES_DIR}/${BOOTSTRAP_ID}"
  [[ ! -e "$PREVIOUS_RELEASE" ]] || die "Bootstrap release already exists: $PREVIOUS_RELEASE"
  log "Creating the one-time complete rollback copy of the currently running application"
  mkdir "$PREVIOUS_RELEASE"
  rsync -a \
    --exclude '/current' \
    --exclude '/releases' \
    --exclude '/shared' \
    "$DEPLOY_ROOT/" "$PREVIOUS_RELEASE/"
  validate_runnable_release "$PREVIOUS_RELEASE"
fi

log "Finalising validated release directory"
mv "$STAGED_RELEASE" "$FINAL_RELEASE"
rmdir "$STAGING_ROOT"
validate_runnable_release "$FINAL_RELEASE"

rollback_failed_promotion() {
  log "Promotion failed; switching back to the intact previous release"
  atomic_switch_current "$PREVIOUS_RELEASE"
  if ! start_or_reload_release "$PREVIOUS_RELEASE"; then
    die "Automatic rollback restored the symlink but PM2 could not start the previous release"
  fi
  run_production_liveness_checks "$PREVIOUS_RELEASE" || die "Automatic rollback also failed liveness checks; operator intervention is required"
  die "New release failed after promotion and was rolled back"
}

log "Atomically promoting $FINAL_RELEASE"
PROMOTED=1
atomic_switch_current "$FINAL_RELEASE"
if ! start_or_reload_release "$FINAL_RELEASE"; then
  rollback_failed_promotion
fi
if ! run_production_liveness_checks "$FINAL_RELEASE"; then
  rollback_failed_promotion
fi

write_release_state "$FINAL_RELEASE" "$PREVIOUS_RELEASE"
pm2 save
assert_editor_store_unchanged
log "Deployment complete. Previous release retained at: $PREVIOUS_RELEASE"
log "Data backup retained at: $BACKUP_DIR"
if [[ "$LEGACY_SERVER_INSTALL" == "1" ]]; then
  log "This promotion used --legacy-server-install and ran npm ci in the new release folder."
else
  log "npm ci was not used for this promotion."
fi
