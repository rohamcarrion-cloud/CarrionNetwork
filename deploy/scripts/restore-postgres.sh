#!/usr/bin/env bash
# Restore ONLY to a new recovery database. Never drop/clean the live database.
set -euo pipefail
[[ $# == 3 && $1 == --new-recovery-database && $3 =~ ^carrion_recovery_[a-z0-9_]+$ ]] || { echo 'Usage: restore-postgres.sh --new-recovery-database DUMP carrion_recovery_NAME' >&2; exit 1; }
[[ ${#3} -le 63 ]] || { echo 'Recovery database name too long' >&2; exit 1; }
[[ -f "$2" && ! -L "$2" && -s "$2" && -f "$2.sha256" ]] || exit 1
source "$(dirname "$0")/common.sh"
exec 9>"$ROOT/deployment/operation.lock"
flock -n 9 || { echo 'Another deployment/backup/restore is active' >&2; exit 1; }
expected=$(awk 'NR == 1 {print $1}' "$2.sha256")
[[ "$expected" =~ ^[a-f0-9]{64}$ ]] || exit 1
actual=$(sha256sum "$2")
[[ ${actual%% *} == "$expected" ]] || { echo 'Dump checksum mismatch' >&2; exit 1; }
compose exec -T postgres pg_restore --list < "$2" > /dev/null
# createdb fails if target already exists. Retain failed restore for investigation.
compose exec -T postgres createdb -U carrion_admin --owner=carrion_migrator "$3"
compose exec -T postgres psql -U carrion_admin -d postgres -v ON_ERROR_STOP=1 -c "REVOKE CONNECT ON DATABASE \"$3\" FROM PUBLIC;"
compose exec -T postgres pg_restore -U carrion_admin --role=carrion_migrator --dbname="$3" --exit-on-error --single-transaction --no-owner --no-privileges < "$2"
echo 'New recovery database restored. Runtime grants, media/config restore and isolated validation still required; live database unchanged.'
