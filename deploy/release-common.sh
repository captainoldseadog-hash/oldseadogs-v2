#!/usr/bin/env bash

set -Eeuo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/var/www/oldseadogs}"
RELEASES_DIR="${RELEASES_DIR:-${DEPLOY_ROOT}/releases}"
SHARED_DIR="${SHARED_DIR:-${DEPLOY_ROOT}/shared}"
CURRENT_LINK="${CURRENT_LINK:-${DEPLOY_ROOT}/current}"
DATA_DIR="${DATA_DIR:-/var/www/oldseadogs-data}"
ENV_FILE="${ENV_FILE:-/etc/oldseadogs/oldseadogs.env}"
BACKUP_ROOT="${BACKUP_ROOT:-/var/www/Oldseadogsbackups/release-deployments}"
HEALTH_BASE_URL="${HEALTH_BASE_URL:-http://127.0.0.1:3000}"
PM2_APP_NAME="${PM2_APP_NAME:-oldseadogs-web}"

log() {
  printf '[oldseadogs-release] %s\n' "$*" >&2
}

die() {
  log "ERROR: $*"
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command is unavailable: $1"
}

load_runtime_environment() {
  [[ -r "$ENV_FILE" ]] || die "Runtime environment file is not readable: $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  export NODE_ENV=production
  export OLDSEADOGS_ENV=production
  export OLDSEADOGS_DATA_DIR="$DATA_DIR"
}

assert_release_path() {
  local requested="$1"
  local resolved
  resolved="$(readlink -f "$requested")" || die "Cannot resolve release path: $requested"
  case "$resolved" in
    "${RELEASES_DIR}/"*) ;;
    *) die "Refusing path outside the releases directory: $resolved" ;;
  esac
  printf '%s\n' "$resolved"
}

validate_runnable_release() {
  local release_path
  release_path="$(assert_release_path "$1")"

  [[ -f "$release_path/package.json" ]] || die "Release is missing package.json: $release_path"
  [[ -f "$release_path/package-lock.json" ]] || die "Release is missing package-lock.json: $release_path"
  [[ -f "$release_path/ecosystem.config.cjs" ]] || die "Release is missing ecosystem.config.cjs: $release_path"
  [[ -d "$release_path/dist" ]] || die "Release is missing compiled dist/: $release_path"
  [[ -f "$release_path/dist/server/index.js" ]] || die "Release is missing dist/server/index.js: $release_path"
  [[ -x "$release_path/node_modules/.bin/vinext" ]] || die "Release is not independently runnable; vinext is absent: $release_path. Dependencies will not be installed. Use a release folder that can already start."
}

find_forbidden_runtime_file() {
  local root="$1"
  find "$root" \
    \( -path '*/node_modules' -o -path '*/.git' \) -prune -o \
    -type f \( \
      -name 'editor-store.json' -o \
      -name '.env' -o \
      -name '.env.*' -o \
      -name '*.log' -o \
      -name '*.tar.gz' -o \
      -name '*.tgz' \
    \) -print -quit
}

validate_prebuilt_runtime() {
  local release_path="$1"
  local vinext sharp_dir libvips_dir sharp_node libvips resolved_vinext resolved_root hint libvips_target
  release_path="$(readlink -f "$release_path")" || die "Cannot resolve release path: $1"
  vinext="$release_path/node_modules/.bin/vinext"
  sharp_dir="$release_path/node_modules/@img/sharp-linux-x64"
  libvips_dir="$release_path/node_modules/@img/sharp-libvips-linux-x64"

  [[ -d "$release_path/node_modules" ]] || die "Prebuilt runtime is missing node_modules at $release_path. This script does not run npm ci, npm install, or npm rebuild."
  if [[ ! -e "$vinext" ]]; then
    die "node_modules/.bin/vinext is missing at $release_path. The release cannot start. Rebuild with npm ci and npm run build:do on linux-x64, then run deploy/release-package.sh. npm will not be run here."
  fi
  if [[ ! -x "$vinext" ]]; then
    die "node_modules/.bin/vinext is not executable at $release_path. The release cannot start."
  fi
  resolved_vinext="$(readlink -f "$vinext")" || die "Cannot resolve node_modules/.bin/vinext in $release_path"
  resolved_root="$(readlink -f "$release_path/node_modules")" || die "Cannot resolve node_modules in $release_path"
  case "$resolved_vinext" in
    "$resolved_root"/*) ;;
    *) die "node_modules/.bin/vinext resolves outside the package: $resolved_vinext" ;;
  esac
  [[ -f "$release_path/node_modules/sharp/package.json" ]] || die "The sharp package is missing at $release_path/node_modules/sharp. Image derivatives cannot run. Rebuild node_modules for linux-x64 glibc."

  sharp_node=""
  libvips=""
  if [[ -d "$sharp_dir" ]]; then
    sharp_node="$(find "$sharp_dir" -type f -name '*.node' -print -quit)"
  fi
  if [[ -d "$libvips_dir" ]]; then
    libvips="$(find "$libvips_dir" \( -type f -o -type l \) -name 'libvips*.so*' -print -quit)"
  fi
  if [[ -z "$sharp_node" || -z "$libvips" ]]; then
    hint=""
    if [[ -d "$release_path/node_modules/@img/sharp-darwin-arm64" || -d "$release_path/node_modules/@img/sharp-darwin-x64" ]]; then
      hint=" The package contains Mac sharp binaries, which do not run on the Ubuntu Droplet."
    elif [[ -d "$release_path/node_modules/@img/sharp-linuxmusl-x64" || -d "$release_path/node_modules/@img/sharp-linuxmusl-arm64" ]]; then
      hint=" The package contains musl sharp binaries. The Droplet is Ubuntu glibc, not Alpine."
    fi
    die "sharp's linux-x64 glibc binary is missing under $release_path/node_modules/@img.${hint} Rebuild node_modules with npm ci inside a linux/amd64 glibc environment (Docker --platform linux/amd64, or the GitHub Actions workflow Build release package), then run deploy/release-package.sh. This machine will not install or rebuild sharp."
  fi
  if [[ -L "$libvips" ]]; then
    libvips_target="$(readlink -f "$libvips")" || die "sharp libvips symlink is broken: $libvips"
    case "$libvips_target" in
      "$resolved_root"/*) ;;
      *) die "sharp libvips resolves outside the package: $libvips_target" ;;
    esac
  fi
}

read_prebuilt_manifest_commit() {
  local manifest="$1"
  local commit error_file status line
  error_file="$(mktemp /tmp/oldseadogs-manifest.XXXXXX)"
  status=0
  commit="$(node -e '
    const fs = require("node:fs");
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    } catch (error) {
      console.error("RELEASE_MANIFEST.json is not valid JSON");
      process.exit(2);
    }
    function fail(message, code) {
      console.error(message);
      process.exit(code);
    }
    if (manifest.prebuilt !== true) fail("RELEASE_MANIFEST.json must set prebuilt to true", 3);
    if (manifest.productionDataIncluded !== false) fail("RELEASE_MANIFEST.json must set productionDataIncluded to false. CMS data and media must not be in the package.", 4);
    if (manifest.dependenciesIncluded !== true) fail("RELEASE_MANIFEST.json must set dependenciesIncluded to true", 5);
    if (manifest.platform !== "linux" || manifest.arch !== "x64" || manifest.libc !== "glibc") {
      fail("RELEASE_MANIFEST.json platform is " + manifest.platform + "/" + manifest.arch + "/" + manifest.libc + ". linux/x64/glibc is required for the Ubuntu Droplet.", 6);
    }
    if (typeof manifest.gitCommit !== "string" || !/^[0-9a-f]{7,40}$/i.test(manifest.gitCommit)) {
      fail("RELEASE_MANIFEST.json is missing a gitCommit", 7);
    }
    if (manifest.npmOnServer !== false) fail("RELEASE_MANIFEST.json must set npmOnServer to false", 8);
    process.stdout.write(manifest.gitCommit);
  ' "$manifest" 2>"$error_file")" || status=$?
  if [[ "$status" -ne 0 ]]; then
    while IFS= read -r line; do
      log "$line"
    done <"$error_file"
    rm -f "$error_file"
    return 1
  fi
  rm -f "$error_file"
  printf '%s\n' "$commit"
}

atomic_switch_current() {
  local target
  local pending_link
  target="$(assert_release_path "$1")"
  pending_link="${DEPLOY_ROOT}/.current-$PPID-$$"

  [[ ! -e "$pending_link" && ! -L "$pending_link" ]] || die "Temporary current link already exists: $pending_link"
  ln -s "$target" "$pending_link"
  mv -Tf "$pending_link" "$CURRENT_LINK"
  log "current now points to $target"
}

start_or_reload_release() {
  local release_path
  local pm2_state_file
  local current_cwd
  local state_status
  release_path="$(assert_release_path "$1")"
  load_runtime_environment

  pm2_state_file="$(mktemp /tmp/oldseadogs-pm2-state.XXXXXX)"
  if ! pm2 jlist >"$pm2_state_file"; then
    rm -f "$pm2_state_file"
    log "Could not inspect PM2 before starting $PM2_APP_NAME"
    return 1
  fi

  state_status=0
  current_cwd="$(node -e '
    const fs = require("node:fs");
    const processes = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const appName = process.argv[2];
    const matches = processes.filter((entry) => entry.name === appName);
    if (matches.length === 0) process.exit(3);
    if (matches.length !== 1) throw new Error(`Expected one PM2 process named ${appName}, found ${matches.length}`);
    const cwd = matches[0].pm2_env?.pm_cwd;
    if (typeof cwd !== "string" || cwd.length === 0) throw new Error(`PM2 process ${appName} has no pm_cwd`);
    process.stdout.write(fs.realpathSync(cwd));
  ' "$pm2_state_file" "$PM2_APP_NAME")" || state_status=$?
  rm -f "$pm2_state_file"

  case "$state_status" in
    0)
      if [[ "$current_cwd" == "$release_path" ]]; then
        pm2 startOrReload "$release_path/ecosystem.config.cjs" --only "$PM2_APP_NAME" --env production --update-env || return 1
      else
        log "Recreating $PM2_APP_NAME to change cwd from $current_cwd to $release_path"
        pm2 delete "$PM2_APP_NAME" || return 1
        pm2 start "$release_path/ecosystem.config.cjs" --only "$PM2_APP_NAME" --env production --update-env || return 1
      fi
      ;;
    3)
      pm2 start "$release_path/ecosystem.config.cjs" --only "$PM2_APP_NAME" --env production --update-env || return 1
      ;;
    *)
      log "Could not determine the current PM2 cwd for $PM2_APP_NAME"
      return 1
      ;;
  esac

  pm2 describe "$PM2_APP_NAME" >/dev/null || return 1
}

wait_for_http_200() {
  local url="$1"
  local output_file="$2"
  local attempts="${3:-30}"
  local delay_seconds="${4:-1}"
  local status
  local attempt

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    status="$(curl --silent --show-error --output "$output_file" --write-out '%{http_code}' "$url" 2>/dev/null || true)"
    if [[ "$status" == "200" ]]; then
      return 0
    fi
    sleep "$delay_seconds"
  done

  log "Health request did not return HTTP 200: $url (last status: ${status:-none})"
  return 1
}

release_build_timestamp() {
  local release_path="$1"
  node -e '
    const fs = require("node:fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    const match = text.match(/["'"'"'`]?buildTimestamp["'"'"'`]?\s*[:=]\s*["'"'"'`]([^"'"'"'`]+)["'"'"'`]/);
    if (!match) process.exit(2);
    process.stdout.write(match[1]);
  ' "$release_path/lib/generated-build-info.ts"
}

run_content_health_checks() {
  local release_path
  local base_url="$2"
  local expected_data_path="$3"
  local expected_build
  local temp_dir
  local featured_slug
  release_path="$(assert_release_path "$1")"
  expected_build="$(release_build_timestamp "$release_path")" || {
    log "Cannot read the release build timestamp"
    return 1
  }
  temp_dir="$(mktemp -d /tmp/oldseadogs-health.XXXXXX)"

  if ! wait_for_http_200 "${base_url}/" "$temp_dir/homepage.html"; then
    rm -rf "$temp_dir"
    return 1
  fi
  if ! wait_for_http_200 "${base_url}/editor" "$temp_dir/editor.html"; then
    rm -rf "$temp_dir"
    return 1
  fi
  if ! wait_for_http_200 "${base_url}/api/editor/health" "$temp_dir/health.json"; then
    rm -rf "$temp_dir"
    return 1
  fi

  featured_slug="$(node -e '
    const fs = require("node:fs");
    const health = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const expectedBuild = process.argv[2];
    const expectedDataPath = process.argv[3];
    if (health.ok !== true) throw new Error("API health is not OK");
    if (health.buildTimestamp !== expectedBuild) throw new Error(`wrong build: ${health.buildTimestamp}`);
    if (health.dataDirectory !== expectedDataPath) throw new Error(`wrong data path: ${health.dataDirectory}`);
    if (!health.homepageFeaturedSlug) throw new Error("featured story slug is empty");
    process.stdout.write(health.homepageFeaturedSlug);
  ' "$temp_dir/health.json" "$expected_build" "$expected_data_path")" || {
    log "API health payload did not validate"
    rm -rf "$temp_dir"
    return 1
  }

  if ! wait_for_http_200 "${base_url}/stories/${featured_slug}" "$temp_dir/featured-story.html"; then
    rm -rf "$temp_dir"
    return 1
  fi
  if ! grep -Fq "/stories/${featured_slug}" "$temp_dir/homepage.html"; then
    log "Homepage does not link to the reported featured story: $featured_slug"
    rm -rf "$temp_dir"
    return 1
  fi

  rm -rf "$temp_dir"
  log "Content health checks passed for build $expected_build and featured story $featured_slug"
}

run_production_liveness_checks() {
  local release_path
  local temp_dir
  release_path="$(assert_release_path "$1")"
  temp_dir="$(mktemp -d /tmp/oldseadogs-liveness.XXXXXX)"

  if ! pm2 jlist >"$temp_dir/pm2.json"; then
    rm -rf "$temp_dir"
    return 1
  fi
  if ! node -e '
    const fs = require("node:fs");
    const path = require("node:path");
    const processes = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const appName = process.argv[2];
    const expectedCwd = fs.realpathSync(process.argv[3]);
    const app = processes.find((entry) => entry.name === appName);
    if (!app) throw new Error(`PM2 process is missing: ${appName}`);
    if (app.pm2_env?.status !== "online") throw new Error(`PM2 process is not online: ${app.pm2_env?.status}`);
    const actualCwd = fs.realpathSync(app.pm2_env?.pm_cwd || ".");
    if (actualCwd !== expectedCwd) throw new Error(`PM2 cwd is ${actualCwd}, expected ${expectedCwd}`);
  ' "$temp_dir/pm2.json" "$PM2_APP_NAME" "$release_path"; then
    log "PM2 did not report the expected online release directory"
    rm -rf "$temp_dir"
    return 1
  fi

  if ! wait_for_http_200 "${HEALTH_BASE_URL}/editor" "$temp_dir/editor.html"; then
    rm -rf "$temp_dir"
    return 1
  fi

  rm -rf "$temp_dir"
  log "Production liveness passed: PM2 is online in $release_path and /editor returns HTTP 200"
}

write_release_state() {
  local current_path="$1"
  local previous_path="$2"
  local state_file

  state_file="${SHARED_DIR}/.release-state-$$"
  printf '%s\n' "$current_path" >"${state_file}.current"
  printf '%s\n' "$previous_path" >"${state_file}.previous"
  mv -f "${state_file}.current" "${SHARED_DIR}/current-release"
  mv -f "${state_file}.previous" "${SHARED_DIR}/previous-release"
}
