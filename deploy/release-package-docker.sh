#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"

log() {
  printf '[oldseadogs-release] %s\n' "$*" >&2
}

die() {
  log "ERROR: $*"
  exit 1
}

if ! command -v docker >/dev/null 2>&1; then
  die "Docker is not available. On a Mac, install Docker Desktop, or use the GitHub Actions workflow Build release package instead. See RELEASE_DEPLOYMENT.md."
fi

mkdir -p "$ROOT/outputs"

log "Building a linux/amd64 package in Docker. This does not touch the Droplet."
docker run --rm --platform linux/amd64 \
  -e DEBIAN_FRONTEND=noninteractive \
  -v "$ROOT":/src:ro \
  -v "$ROOT/outputs":/outputs \
  -w /work \
  node:22-bookworm \
  bash -lc 'set -euo pipefail
apt-get update
apt-get install -y --no-install-recommends git ca-certificates
tar -C /src \
  --exclude node_modules \
  --exclude dist \
  --exclude outputs \
  --exclude .next \
  --exclude .wrangler \
  --exclude work \
  --exclude coverage \
  -cf - . | tar -C /work -xf -
cd /work
npm ci --include=dev --no-audit --no-fund
npm run build:do
npm run package:release -- --output-dir /outputs
'

log "Package files are in $ROOT/outputs"
log "Open the .manifest.json file and check gitCommit before copying anything to the server."
