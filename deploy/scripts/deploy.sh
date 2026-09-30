#!/usr/bin/env bash
# Executes only in 008A.2 after review, role provisioning and deliberate migrations.
set -euo pipefail
[[ ${1:-} == --reviewed-release && $# == 2 && -s "$2" ]] || { echo 'Usage: deploy.sh --reviewed-release VERIFIED_BACKUP_MANIFEST' >&2; exit 1; }
source "$(dirname "$0")/common.sh"
exec 9>"$ROOT/deployment/operation.lock"
flock -n 9 || { echo 'Another deployment/backup/restore is active' >&2; exit 1; }
compose pull
compose up -d --wait postgres
compose --profile tools run --rm migrate node api/src/migrate.js --check
compose up -d --wait api proxy
compose ps
echo 'Verify canonical HTTPS, Studio, anonymous RSS/artwork/audio HEAD/Range and private isolation. Record image digests and git SHA.'
