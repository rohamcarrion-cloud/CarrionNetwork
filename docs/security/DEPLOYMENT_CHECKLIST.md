# 008A.2 review and acceptance checklist

008A.1 prepares artifacts only. Human review is still required before any VPS work.

- [ ] Owner approves architecture/tradeoff of deploy Docker root-equivalent access.
- [ ] Confirm live VPS inventory/host fingerprint/provider MFA/console and root recovery.
- [ ] Complete [lockout-safe bootstrap](VPS_BOOTSTRAP.md), keeping original access until
      independent new access works after every SSH/firewall change and reboot.
- [ ] Resolve canonical DNS/domain and IPv6 address; publish AAAA only after v6 works.
- [ ] Review/pin compatible Node/Caddy/Postgres base digests; build linux/amd64 images,
      npm ci, audit, tests, provenance and registry immutable custom image digests.
- [ ] Verify files/secrets/UID permissions, mounted paths, no privileged/socket/host-net;
      Compose config --quiet, no public API/DB ports; do not print expanded secrets.
- [ ] Deliberately provision DB roles/passwords, migrations, runtime grants; test runtime
      registration/workspace trigger/publishing and DDL denial in disposable local DB.
- [ ] Stage Caddy configuration validation and Studio browser CSP checks; configure TLS
      only after DNS approval. Test HTTP redirects, canonical HTTPS and certificate renewal.
- [ ] External IPv4 AND IPv6 scans: only 22/80/443; 5432/3010/5173/2019 inaccessible.
      UFW status alone is not acceptance of Docker port security.
- [ ] Verify auth, cross-account isolation, private-media anonymous denial and RSS opt-in;
      public feeds/artwork/audio GET/HEAD/ranges/304 remain correct under /api prefix.
- [ ] Configure daily logical/matched backups, encrypted off-server export, owner failure
      alerts; record isolated restore rehearsal and measured RPO/RTO before acceptance.
- [ ] Record daily operational checks, patch schedule, TLS expiry, disk thresholds,
      backup-age alerts, incident contacts/tabletop and release/rollback metadata.
- [ ] Resolve or explicitly gate broad creator onboarding: auth throttling, sanitized
      error logs, resource/abuse quotas, emergency takedown, email recovery and reviewed
      privacy/data lifecycle. Host hardening does not close application launch risks.

Stop on unexpected data, incompatible versions, failed login/health/restore or unknown
image provenance. Do not deploy merely because Compose renders. Run no integration
suite against production; it requires database creation permissions reserved for tests.
