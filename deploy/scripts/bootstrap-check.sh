#!/usr/bin/env bash
# Read-only host inventory. No SSH, firewall changes, downloads or service starts.
set -euo pipefail
[[ $(uname -s) == Linux ]] || { echo 'Target is Linux; do not run bootstrap on macOS' >&2; exit 1; }
cat /etc/os-release
id
command -v docker ufw sshd
docker version --format '{{.Server.Version}}'
docker compose version
docker ps --format '{{.Names}} {{.Ports}}'
docker compose ls
ss -lntup
df -h / /srv
systemctl is-active ssh docker
[[ ! -f /var/run/reboot-required ]] || { echo 'Reboot verification required' >&2; exit 1; }
echo 'Inventory only; owner must inspect IPv4/IPv6, SSH effective config, UFW and console recovery.'
