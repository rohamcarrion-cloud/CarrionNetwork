# Backup and recovery

Proposed, not configured/tested on VPS. Weekly Hostinger snapshots supplement logical
backups; they are not the sole DB backup or independent protection from provider/host
account compromise. [PostgreSQL pg_dump](https://www.postgresql.org/docs/17/backup-dump.html)
provides consistent logical SQL state; it does not capture concurrent filesystem files.

Target initial RPO <=24 hours after daily matched sets run; target RTO one working day
is provisional until measured. Daily SQL-only dumps and daily matched sets have 14-day retention; weekly
matched recovery sets retain four weeks. Monthly/off-server longer retention requires
cost/privacy review. Host disk capacity must include media plus recovery sets; don't
silently keep multiplying 100 MiB files until disk fills. Alert on failure, backup age over 26 hours, disk/inodes, checksum failure and export lag.
Scheduling/alerts are 008A.2 work: use systemd timer (Persistent=true, daily UTC) and
service as deploy, absolute script path, no secrets in unit. Failed services must notify
the owner through a tested channel; journal-only failure is not sufficient. No external
service purchased here.

## Complete recovery set

During an owner-approved maintenance window acquire operation.lock BEFORE stopping
API (blocks writes and asset deletion) and migration/deployment operations; leave DB running. Ensure no other writer exists.
Run SQL backup, copy/archive private media while writes remain stopped, encrypted
config/secret/certificate backup, copy deployment manifests (commit/image/base digests,
Compose checksum, schema ledger and UTC times). Hold operation.lock around the complete
set, not just SQL. The SQL helper owns its own flock; the complete-set wrapper must
perform the same pg_dump/checksum commands directly under its single outer lock,
not invoke that helper recursively or leave a gap between SQL and media capture. Restart API only after checksums
and manifest complete; failure traps must restore service and report incomplete set.
A concurrent online media copy can omit a deleted/uploaded object and is not an atomic
recovery set. SQL-only online backup remains useful but insufficient.

Files and dumps contain personal data. Encrypt before off-server export; backup key
must survive server loss and be separately held in owner password manager/offline
recovery kit. Initially copy encrypted sets to an owner-controlled separate device;
verify receipt/checksum/decryption. Future object storage should use scoped credentials,
versioning/immutability and separate administration. On-server unencrypted 0600 backups
are accessible to deploy/root and do not resist ransomware. Do not copy .env into Git,
store keys beside encrypted backups, or blindly sync deletion to all destinations.
Backup config includes runtime/migrator/admin secrets and Caddy ACME state. Source is
in GitHub, but unpushed release metadata and image registry availability also matter.
Do not use raw live PostgreSQL directory tar as a consistent logical backup.

## Restore rehearsal (required before production acceptance)

Use a separate isolated Compose project/host without public ports, separate data paths,
restore-only credentials and no outbound email/payment integrations. Prepared restore
script is deliberately limited to a new `carrion_recovery_*` database on installed
stack; it never drops/cleans/replaces `carrion_network`. Verify checksums and known-good
backup provenance before treating the dump as executable database content. Restore
scripts/SQL can execute arbitrary functions; do not load untrusted dumps.

1. Retrieve encrypted complete set and key through separate channels; decrypt on trusted
   restricted host, verify every manifest/checksum and image/commit provenance.
2. Start compatible PostgreSQL 17 with empty separate data directory; create admin,
   migrator/app roles using roles.sql adapted to recovery DB, set fresh credentials.
   For same-stack rehearsal roles already exist. Use restore-postgres.sh with new
   recovery name; failure retains the new DB for investigation, never retries by drop.
3. Restore with no owners/ACLs under carrion_migrator, grant runtime DML using reviewed
   runtime-grants.sql connected to recovery database. The restore helper revokes public database CONNECT before loading; grant only
   intended recovery-app access when validating isolated application behavior.
4. Restore media to separate UID1000 directory, config/deployment/cert state to selected
   paths. For rehearsal use test canonical URL; never overwrite live secrets/media.
   Reapply permissions. A new host should rotate recovered production credentials.
5. Point isolated API at recovery DB/media; run migrator `--check` (do not automatically
   migrate restored data). Check counts/relationships/ledger, publication UUID/GUIDs,
   file inventory + bytes/checksums, scoped account access using dedicated test account,
   anonymous private-media denial, enabled RSS, artwork and audio GET/HEAD/Range.
6. Record measured restore duration, oldest recoverable point, missing objects and
   operator findings. Repeat monthly and after backup/schema/storage changes. Archive
   private proof; remove rehearsal data through separately reviewed cleanup.

## Live recovery/cutover

Owner confirms outage/data-loss scope, captures current evidence and preserves current
cluster/media before replacement. Restore a separate clean deployment first. For host
compromise, rebuild OS and rotate all credentials on trusted devices. Verify restored
URLs/IDs with original canonical HTTPS (rehearsal URLs never become permanent), validate
private isolation and TLS, then explicitly switch reviewed config/traffic. No automatic
promotion in restore script. Keep previous data quarantined through incident review.
Re-enable backup schedule and complete a fresh matched set. Rollback an application
image only if compatible with current schema; migrations have no automatic down path.
