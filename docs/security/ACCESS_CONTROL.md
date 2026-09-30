# Access control

## Host identities

Root is for initial system setup, emergency console recovery, SSH/firewall changes
and OS maintenance. Recommend one trusted owner-operated `deploy` account with
key-only SSH and Docker group membership for first VPS. Its scripts/config/source
are deploy-owned. Docker membership is explicitly root-equivalent: a Docker user
can mount host files or start privileged containers. It is an operational identity,
not a strong privilege boundary. Never grant it to creators, application processes
or untrusted CI. No passwordless unrestricted sudo rule; use owner root/console for
administration. Rootless Docker is a future stronger isolation option requiring
storage/network/port validation. A narrow sudo wrapper would only help if its image,
Compose and inputs are administrator-controlled; writable Compose defeats it.

Deploy key must be owner-controlled Ed25519 with passphrase/hardware-backed storage;
GitHub checkout key read-only and separate from host login, no agent forwarding.
Hostinger account uses MFA and recovery codes; its console/backups can bypass SSH
controls. Record key fingerprints, owner, scope, creation/revocation dates in private
operations inventory, no private keys in Git. Disable direct root SSH only after
second-terminal deploy login and Hostinger console root recovery are tested.

## Application identities (actual behavior)

Users have personal owner workspaces (migration 002 trigger). Workspace Library
routes require workspace owner. Shows permit owner or explicit show_members
editor/producer; both member roles have scoped show editing/publication permissions,
not separate fine-grained editorial policies. Destructive draft show/episode actions
have owner restrictions in domain code; never infer broader Library access from
show membership. No general admin portal, RBAC management UI, MFA, verified email,
password reset or creator invitation flow exists. Database composite FKs enforce
workspace/type relationships but are not tenant read isolation. Node permission
checks must remain on every private route; test cross-account access on releases.

Passwords use salted scrypt; sessions are random 32-byte bearer tokens with SHA-256
hashes in PostgreSQL, 14-day expiry, current-token logout deletion. Browser stores
raw token in sessionStorage (origin/tab scoped, readable by XSS). No refresh-token,
all-session revocation UI or auth rate limiting. Incident responder can delete
sessions for a specific user using parameterized administrative SQL or all sessions
in a confirmed compromise. Do not record raw tokens in tickets/logs. Expired-row
cleanup is not scheduled. No automatic cookie CSRF protection should be claimed.

Public listeners can resolve only enabled published feeds and explicitly created
artwork/audio representation IDs. Private asset IDs or storage keys must never become
public filesystem routes. Published audio/artwork retention survives withdrawal and
covers replacement; public availability is deliberate, but takedown is missing.
