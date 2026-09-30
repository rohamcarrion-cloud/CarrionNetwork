# 008A.2 human-reviewed VPS bootstrap runbook

**DO NOT EXECUTE in 008A.1.** Commands below are manual review steps, not an automatic
bootstrap script. Begin as `root@srv1655152` only in the authorized next milestone.
Owner supplied IPv4 93.188.167.84; verify hostname/IP and SSH host key fingerprint
through Hostinger console before first connection. IPv6 address is not yet recorded.
No remote command is necessary to review these files locally.

## 0. Recovery and inventory checkpoint

Verify Hostinger account MFA/recovery codes and browser console access. Confirm you
can obtain a root shell via console (root recovery credential stored securely).
Record host SSH fingerprint privately. Keep an original root terminal open throughout
SSH/firewall changes. Test login from a second Mac terminal before closing original.
Back up existing sshd/UFW configuration privately, inspect all drop-ins/cloud-init and
current listeners with `ss -lntup`, `ufw status verbose`, `docker ps`, `docker compose ls`,
`df -h`, OS/kernel and reboot status. Compare owner inventory; stop if unexpected apps,
data/users/listeners appear. Run bootstrap-check.sh only after inspecting its code.

## 1. OS maintenance and reboot checkpoint

Review `apt update`, `apt list --upgradable`; apply reviewed Ubuntu security updates
with `apt upgrade`, no unattended major distribution upgrade. Docker already exists;
do not reinstall blindly. Record `docker version`, `docker compose version`, kernel,
`systemctl status ssh docker`. If `/var/run/reboot-required` exists, confirm console
root recovery and second root key session BEFORE reboot. Reboot intentionally, then
reconnect through both SSH and console and confirm host, kernel, services/listeners.
Do not continue if independent recovery fails. Do not perform remote reboot during
this milestone.

## 2. Establish deploy access (keep root unchanged)

As root, after ensuring user does not already exist:

```sh
adduser --disabled-password --gecos '' deploy
install -d -o deploy -g deploy -m 0700 /home/deploy/.ssh
install -o deploy -g deploy -m 0600 /dev/null /home/deploy/.ssh/authorized_keys
```

Place only the verified owner public key in authorized_keys using a reviewed editor.
Do not overwrite an existing user's keys. On Mac create/store an Ed25519 key with
passphrase (or use approved hardware key); private key remains on trusted device.
No `ssh-copy-id` relying on a password or assumed root authorized_keys copy.
Verify permissions/owner, key fingerprint, and no broad sudo grants.

**Checkpoint:** from second terminal use explicit deploy key and password-disabled
client authentication, for example (replace the local key path):

```sh
ssh -i /PATH/TO/OWNER_KEY -o IdentitiesOnly=yes -o PasswordAuthentication=no -o KbdInteractiveAuthentication=no deploy@93.188.167.84
```

Verify `whoami`, `id`, successful fresh reconnection. Original
root session stays open. If deploy is locked by PAM/account policy, inspect and fix
before touching root/password login. Confirm console recovery again.

## 3. SSH hardening, validate before reload

Inspect `/etc/ssh/sshd_config` and ALL `/etc/ssh/sshd_config.d/*.conf`, Include order,
cloud-init configuration and Match blocks. OpenSSH takes the first obtained value
for most settings; a late `99-...` drop-in is not guaranteed to override defaults.
Create an early, reviewed managed drop-in only after confirming precedence:

```text
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitEmptyPasswords no
PermitRootLogin no
AllowUsers deploy
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
```

No SSH port change. AllowUsers is only appropriate after checking there are no other
legitimate admin users; preserve them if discovered. Keep PAM's normal account checks.
Before applying, validate `sshd -t`, and `sshd -T -C user=deploy,host=srv1655152,addr=OWNER_CLIENT_IP`
AND root context. Confirm effective key/password/root settings, not only file contents.
Restore saved config if syntax/effective settings differ. Only then `systemctl reload ssh`
(never needlessly restart). Ubuntu socket activation may affect listeners; inspect
`systemctl status ssh ssh.socket`, actual listening port and connection, not assumptions.

**Checkpoint:** original root session remains open; third/fresh terminal deploy key
login succeeds; a fresh root login and password attempt are denied; console root still
works. If new deploy access fails, restore config from original root/console, validate
and reload; retest. Do not close original session until these tests pass.

## 4. Lockout-safe firewall

Inspect existing UFW and Docker firewall backend/rules; preserve required owner access.
Verify `/etc/default/ufw` has `IPV6=yes` and discover actual VPS IPv6. Review defaults
and proposed rules BEFORE activation:

```sh
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw show added
```

Do not allow 5432, 3010, 5173 or Caddy admin 2019. Keep console and original SSH open;
verify allow-22 is present for IPv4 AND IPv6 before interactive `ufw enable`.
Avoid automated `--force`. Record `ufw status verbose` and `ufw status numbered`.
**Checkpoint:** independent fresh deploy SSH over v4 and v6 succeeds before closing
existing session. If v6 not reachable, use console/known-good v4 to correct and retest;
do not publish AAAA or accept a dual-stack deployment until verified. Rollback through
console can disable UFW temporarily, correct rules, then re-enable/retest.

Docker port publication bypasses normal UFW paths. Do not disable Docker iptables
management blindly. This design publishes only proxy 80/443, leaves DB/API unpublished.
Inspect `docker network inspect` without secret environment output and actual NAT/filter
rules on both protocols after deployment. Externally scan each public address; only
22/80/443 may accept connections. Host `ss` and UFW alone do not prove container privacy.
A provider firewall matching these ports is useful defense-in-depth if available and
reviewed later; do not configure one here or rely on it to correct unsafe Compose.

## 5. Docker identity decision

Owner explicitly reviews [ACCESS_CONTROL.md](ACCESS_CONTROL.md): membership is
root-equivalent, not limited privilege. Then as root `usermod -aG docker deploy`.
Fresh deploy session must show docker in `id` and succeed at `docker ps`; socket stays
root:docker, never world-writable and no public Docker TCP API. Do not mount socket
into API/proxy. No general sudo membership required. Re-test deploy login after group
change. Future automation requires separately scoped/approved credentials; no CI SSH
or owner agent forwarding introduced now.

## 6. Directories and ownership

As root prepare parent and deploy directories with install (inspect existing paths first):

```sh
install -d -o deploy -g deploy -m 0750 /srv/carrionnetwork
install -d -o deploy -g deploy -m 0750 /srv/carrionnetwork/app/releases /srv/carrionnetwork/deployment
install -d -o deploy -g deploy -m 0700 /srv/carrionnetwork/config /srv/carrionnetwork/backups/postgres /srv/carrionnetwork/backups/recovery /srv/carrionnetwork/logs
install -d -o 1000 -g 1000 -m 0700 /srv/carrionnetwork/data/media /srv/carrionnetwork/data/caddy /srv/carrionnetwork/config/caddy
```

Parent `data` must permit traversal by container UIDs; create root-owned 0755 parent,
private children. If deploy UID isn't 1000 this remains intentional numeric container
ownership; deploy can administer through Docker but should not widen media modes.
Inspect selected Postgres 17 image's postgres UID/GID from trusted image metadata or a
one-shot local inspection; create data/postgres 0700 for those numeric IDs. Never run
recursive chown over existing DB/media without backup and planned downtime.
Verify path traversal, no symlinks/unexpected mounts, available space and modes.

## 7. Secrets and release preparation

As deploy set `umask 077`; install clean reviewed release and deploy artifacts into
stable deployment/. Keep production config out of the checkout. Generate independent
32-byte hex passwords into protected local files, never shell tracing or shared
transcripts. Set config/api.env and migrate.env URLs for their separate roles; save
admin secret into config/postgres-admin.secret. Create config/production.env from
placeholder template, fill canonical domain/ACME contact and reviewed immutable image
digests. Check every secret file is deploy-owned 0600, config 0700. Secure encrypted
recovery copy/key outside VPS. Do not output full Compose config; use `config --quiet`.
Review DNS/TLS separately; neither is configured by this runbook's host bootstrap.

## 8. Pre-deployment checkpoint and handoff

As deploy verify fresh SSH, directory/secret permissions, pinned images/provenance,
Compose quiet validation, no placeholders or extra port mappings, backup path/write
capacity and no open application containers yet. As owner verify console/root recovery,
UFW v4/v6 and key-only SSH effective policy, OS reboot status and patch records.
Record reviewed configuration checksums/commit and approve application deployment
separately. Follow deploy/README.md for deliberate DB roles/migrations/grants and
BACKUP_RECOVERY.md for timer, matched backup/export and restore rehearsal.
008A.2 acceptance must record tests; no procedure here is claimed executed.
