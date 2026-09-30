#!/usr/bin/env bash
# Logical SQL backup only; complete recovery set requires media/config + manifest.
set -euo pipefail
source "$(dirname "$0")/common.sh"
exec 9>"$ROOT/deployment/operation.lock"
flock -n 9 || { echo 'Another deployment/backup/restore is active' >&2; exit 1; }
[[ -d "$ROOT/backups/postgres" && ! -L "$ROOT/backups/postgres" ]] || exit 1
stamp=$(date -u +%Y%m%dT%H%M%SZ)
temporary=$(mktemp "$ROOT/backups/postgres/.pending.XXXXXX")
trap 'rm -f -- "$temporary"' EXIT
# Official image local socket authentication; never place a password in argv.
compose exec -T postgres pg_dump -U carrion_admin -d carrion_network -Fc > "$temporary"
[[ -s "$temporary" ]]
compose exec -T postgres pg_restore --list < "$temporary" > /dev/null
final="$ROOT/backups/postgres/$stamp.dump"
[[ ! -e "$final" ]] || exit 1
mv "$temporary" "$final"
sha256sum "$final" > "$final.sha256"
# Only completed dumps and their checksum files; never pending or recovery sets.
find "$ROOT/backups/postgres" -maxdepth 1 -type f \( -name '*.dump' -o -name '*.dump.sha256' \) -mtime +13 -delete
echo "SQL backup completed: $stamp (not a complete recovery set)"
