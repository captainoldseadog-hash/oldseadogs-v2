#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=release-common.sh
source "$SCRIPT_DIR/release-common.sh"

SOURCE=""
OUTPUT_DIR=""
NAME=""
STAGE_ROOT=""
SUMS_FILE=""

usage() {
  cat <<'EOF'
Usage: release-package.sh [--source DIR] [--output-dir DIR] [--name NAME]

Builds a prebuilt release archive from a checkout that already has:

  npm ci
  npm run build:do

The archive includes node_modules. Those modules must be the linux-x64 glibc
builds, including node_modules/.bin/vinext and sharp's linux-x64 binary.
Run this on Linux x86_64 (a cloud machine, GitHub Actions ubuntu-latest, or
Docker --platform linux/amd64). A Mac checkout cannot produce this package.

Writes three files:

  <name>.tar.gz
  <name>.tar.gz.sha256
  <name>.manifest.json

The manifest records gitCommit. The archive does not contain CMS data, media,
.env files, or .git.
EOF
}

cleanup() {
  if [[ -n "$STAGE_ROOT" && -d "$STAGE_ROOT" ]]; then
    rm -rf "$STAGE_ROOT"
  fi
  if [[ -n "$SUMS_FILE" && -f "$SUMS_FILE" ]]; then
    rm -f "$SUMS_FILE"
  fi
}
trap cleanup EXIT

while (($#)); do
  case "$1" in
    --source)
      [[ $# -ge 2 ]] || die "--source needs a directory"
      SOURCE="$2"
      shift 2
      ;;
    --output-dir)
      [[ $# -ge 2 ]] || die "--output-dir needs a directory"
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --name)
      [[ $# -ge 2 ]] || die "--name needs a value"
      NAME="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *) die "Unknown argument: $1" ;;
  esac
done

if [[ -z "$SOURCE" ]]; then
  SOURCE="$(cd -- "$SCRIPT_DIR/.." && pwd)"
fi
SOURCE="$(readlink -f "$SOURCE")"
[[ -d "$SOURCE" ]] || die "Source directory does not exist: $SOURCE"
if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="${SOURCE}/outputs"
fi
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$(readlink -f "$OUTPUT_DIR")"

host_os="$(uname -s)"
host_arch="$(uname -m)"
if [[ "$host_os" != "Linux" || "$host_arch" != "x86_64" ]]; then
  die "Refusing to package on ${host_os}/${host_arch}. sharp and the rest of node_modules must be linux-x64 glibc builds for the Ubuntu Droplet. On a Mac, run bash deploy/release-package-docker.sh, or use the GitHub Actions workflow Build release package. See RELEASE_DEPLOYMENT.md."
fi

for command_name in git tar sha256sum find sort xargs node awk; do
  require_command "$command_name"
done
git -C "$SOURCE" rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "Packaging requires a git checkout: $SOURCE"

unexpected="$(git -C "$SOURCE" status --porcelain --untracked-files=all | awk '
  {
    path = substr($0, 4)
    if (path == "lib/generated-build-info.ts") next
    if (path == "outputs" || index(path, "outputs/") == 1) next
    print path
  }
')"
if [[ -n "$unexpected" ]]; then
  die "Working tree has changes besides lib/generated-build-info.ts. Commit or stash them before packaging: ${unexpected//$'\n'/, }"
fi

[[ -f "$SOURCE/dist/server/index.js" ]] || die "dist/server/index.js is missing. Run npm run build:do before packaging."
[[ -f "$SOURCE/lib/generated-build-info.ts" ]] || die "lib/generated-build-info.ts is missing. Run npm run build:do before packaging."
[[ -d "$SOURCE/node_modules" ]] || die "node_modules is missing. Run npm ci on linux-x64 before packaging."

full_commit="$(git -C "$SOURCE" rev-parse HEAD)"
short_commit="$(git -C "$SOURCE" rev-parse --short=12 HEAD)"
branch_name="$(git -C "$SOURCE" rev-parse --abbrev-ref HEAD)"
build_commit="$(node -e '
  const fs = require("node:fs");
  const text = fs.readFileSync(process.argv[1], "utf8");
  const match = text.match(/["'"'"'`]?gitCommit["'"'"'`]?\s*[:=]\s*["'"'"'`]([^"'"'"'`]+)["'"'"'`]/);
  if (!match) process.exit(2);
  process.stdout.write(match[1]);
' "$SOURCE/lib/generated-build-info.ts")" || die "Cannot read gitCommit from lib/generated-build-info.ts. Run npm run build:do first."
[[ "$build_commit" == "$short_commit" ]] || die "lib/generated-build-info.ts gitCommit is ${build_commit} but HEAD is ${short_commit}. Run npm run build:do in this checkout before packaging."
[[ "$full_commit" =~ ^[0-9a-f]{40}$ ]] || die "git HEAD is not a full commit sha: $full_commit"

if [[ -z "$NAME" ]]; then
  NAME="oldseadogs-${short_commit}-$(date -u +%Y%m%dT%H%M%SZ)"
fi
[[ "$NAME" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || die "Unsafe package name: $NAME"

archive_path="${OUTPUT_DIR}/${NAME}.tar.gz"
checksum_path="${archive_path}.sha256"
manifest_copy="${OUTPUT_DIR}/${NAME}.manifest.json"
[[ ! -e "$archive_path" ]] || die "Refusing to overwrite existing archive: $archive_path"
[[ ! -e "$checksum_path" ]] || die "Refusing to overwrite existing checksum: $checksum_path"
[[ ! -e "$manifest_copy" ]] || die "Refusing to overwrite existing manifest: $manifest_copy"

STAGE_ROOT="$(mktemp -d /tmp/oldseadogs-package.XXXXXX)"
package_dir="${STAGE_ROOT}/${NAME}"
mkdir -p "$package_dir"

log "Copying the built checkout into the package"
tar -C "$SOURCE" \
  --exclude=.git \
  --exclude=.next \
  --exclude=.wrangler \
  --exclude=.wrangler-config \
  --exclude=outputs \
  --exclude=logs \
  --exclude=work \
  --exclude=coverage \
  --exclude=.oldseadogs-data \
  --exclude=oldseadogs-data \
  --exclude=.DS_Store \
  --exclude=node_modules/.cache \
  --exclude=.env \
  --exclude='.env.*' \
  --exclude=editor-store.json \
  --exclude='*.log' \
  --exclude='*.tar.gz' \
  --exclude='*.tgz' \
  -cf - . | tar -C "$package_dir" -xf -

if [[ -e "$package_dir/.git" ]]; then
  log "Removing .git from the package staging directory"
  rm -rf "$package_dir/.git"
fi
while IFS= read -r forbidden; do
  [[ -n "$forbidden" ]] || continue
  log "Removing forbidden packaged file: $forbidden"
  rm -f "$forbidden"
done < <(find_forbidden_runtime_file "$package_dir")
remaining_forbidden="$(find_forbidden_runtime_file "$package_dir")"
[[ -z "$remaining_forbidden" ]] || die "Refusing to package forbidden file: $remaining_forbidden"
[[ ! -e "$package_dir/.git" ]] || die "Refusing to package .git"

for required_path in package.json package-lock.json ecosystem.config.cjs dist/server/index.js public scripts lib/generated-build-info.ts node_modules/.bin/vinext node_modules/sharp/package.json; do
  [[ -e "$package_dir/$required_path" ]] || die "Package is incomplete after copy; missing $required_path"
done
validate_prebuilt_runtime "$package_dir"

node_version="$(node -v)"
node -e '
  const fs = require("node:fs");
  const manifest = {
    releaseName: process.argv[1],
    createdAt: new Date().toISOString(),
    gitCommit: process.argv[2],
    gitCommitShort: process.argv[3],
    gitBranch: process.argv[4],
    buildInfoGitCommit: process.argv[5],
    platform: "linux",
    arch: "x64",
    libc: "glibc",
    nodeVersion: process.argv[6],
    prebuilt: true,
    dependenciesIncluded: true,
    productionDataIncluded: false,
    npmOnServer: false,
    buildCommand: "npm run build:do",
    packageCommand: "deploy/release-package.sh",
  };
  fs.writeFileSync(process.argv[7], JSON.stringify(manifest, null, 2) + "\n");
' "$NAME" "$full_commit" "$short_commit" "$branch_name" "$build_commit" "$node_version" "$package_dir/RELEASE_MANIFEST.json"

log "Writing SHA256SUMS for the package payload"
SUMS_FILE="$(mktemp /tmp/oldseadogs-sha256sums.XXXXXX)"
(
  cd "$package_dir"
  find . -type f -printf '%P\0' | sort -z | xargs -0 -r sha256sum --
) >"$SUMS_FILE"
mv "$SUMS_FILE" "$package_dir/SHA256SUMS"
SUMS_FILE=""

log "Creating $archive_path"
tar -C "$STAGE_ROOT" -czf "$archive_path" "$NAME"
archive_sha="$(sha256sum "$archive_path")"
archive_sha="${archive_sha%% *}"
printf '%s  %s\n' "$archive_sha" "$(basename "$archive_path")" >"$checksum_path"
cp "$package_dir/RELEASE_MANIFEST.json" "$manifest_copy"

log "Package: $archive_path"
log "Checksum: $checksum_path"
log "Manifest: $manifest_copy"
log "gitCommit: $full_commit"
printf '%s\n' "$archive_path"
