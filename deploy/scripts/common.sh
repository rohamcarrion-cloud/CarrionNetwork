#!/usr/bin/env bash
set -euo pipefail
umask 077
ROOT=/srv/carrionnetwork
CONFIG="$ROOT/config/production.env"
COMPOSE="$ROOT/deployment/compose.production.yaml"
[[ -f "$CONFIG" && -f "$COMPOSE" ]] || { echo 'Missing installed configuration' >&2; exit 1; }
[[ $(id -un) == deploy ]] || { echo 'Run as deploy, not root' >&2; exit 1; }
for file in "$CONFIG" "$ROOT/config/api.env" "$ROOT/config/migrate.env" "$ROOT/config/postgres-admin.secret"; do
  [[ -f "$file" && ! -L "$file" && $(stat -c %a "$file") == 600 && $(stat -c %U "$file") == deploy ]] || { echo 'Secret/config ownership or mode invalid' >&2; exit 1; }
done
if grep -Eq 'REPLACE_|example\.invalid' "$CONFIG" "$ROOT/config/api.env" "$ROOT/config/migrate.env" "$ROOT/config/postgres-admin.secret"; then
  echo 'Unfilled production placeholders' >&2; exit 1
fi
for key in API_IMAGE PROXY_IMAGE POSTGRES_IMAGE; do
  grep -Eq "^${key}=.+@sha256:[a-f0-9]{64}$" "$CONFIG" || { echo 'Immutable image digest required' >&2; exit 1; }
done
compose() { docker compose --env-file "$CONFIG" -f "$COMPOSE" "$@"; }
compose config --quiet
