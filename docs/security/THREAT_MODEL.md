# Initial threat model

Scope: single-host proposed production, current schema/code 001–007. No certification.
Assets: creator emails/display names/password hashes/session hashes, raw client
sessions, workspaces/editor grants, unpublished originals, published content/identities,
DB and media, production secrets, host/provider access, certificate keys and backups.

Trust boundaries: Internet → Caddy → Node → private PostgreSQL/storage; creator →
bearer-authenticated Studio → scoped workspace/show; anonymous listener → only RSS
and public resolvers. Deploy/Docker/Hostinger administrator can cross all boundaries.
A single VPS has no host-level redundancy; owner/device compromise can defeat controls.

| Threat                          | Existing evidence / mitigation                                                                         | Remaining production control                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Credential stuffing/brute force | scrypt + minimum 12-character registration password; generic login failure                             | Auth/IP/account throttling with trusted proxy boundary, abuse alerts, MFA/recovery; no rate limiter exists                  |
| Session theft                   | Random tokens; DB stores hash; logout/expiry                                                           | XSS-readable sessionStorage; CSP verification, session revocation tooling and sensitive log redaction                       |
| IDOR/authorization              | requireUser, domain.permission, owner-only media.workspace; composite FKs; integration isolation tests | Keep negative tests; review each new route; no DB RLS                                                                       |
| SQL injection                   | pg parameterized values; table/sort/direction from fixed allowlists                                    | Runtime role still has broad data DML; review dynamic SQL and migrations                                                    |
| XSS                             | React text escaping; RSS XML escaping; validated URL schemes                                           | CSP smoke test, dependency review; no unsafe HTML rendering should be introduced                                            |
| CSRF                            | Bearer headers rather than ambient auth cookie; exact WEB_ORIGIN                                       | Reassess cookie migration; CORS is not authorization                                                                        |
| Malicious uploads               | JPEG/PNG/WebP decode/dimension/pixel limits; MP3 worker full validation + timeout; opaque storage UUID | Native decoder vulnerabilities, moderation/quarantine, no malware scanning or quotas                                        |
| Oversized uploads/DoS           | 10 MiB images/100 MiB audio; two uploads; bounded JSON; paginated API                                  | Auth scrypt pressure, unbounded RSS catalog, slow clients/disk exhaustion; container budgets, capacity/rate limits          |
| Path traversal                  | storage key UUID regex; filename stripped to basename; no static media root                            | Never expose arbitrary path; audit adapters and symlinks/operator writes                                                    |
| SSRF                            | Current website URLs are validated metadata; no server URL fetch/import                                | Restrict outbound targets if imports/webhooks arrive; API edge permits egress                                               |
| Dependency compromise           | Lockfile/npm ci                                                                                        | Review updates/native modules, pinned image provenance, audit/scan and registry credentials                                 |
| Secret leakage                  | .env/private media ignored                                                                             | Environment inspection/root access; exclude build context, 0600 files, redaction and rotation                               |
| Exposed DB/Docker mistakes      | Proposed no DB/API ports, no socket/privileged containers                                              | UFW does not filter Docker published ports reliably; external v4/v6 scan, Compose review                                    |
| SSH compromise                  | Owner-provided host currently root SSH                                                                 | Key-only deploy, tested root restriction, provider MFA, key revocation                                                      |
| Server loss/ransomware          | Weekly owner-reported Hostinger backup                                                                 | Daily logical + matched media/config, encrypted off-server copy and isolated restore rehearsal                              |
| Backup failure                  | Prepared pg_dump script/list check/checksum                                                            | Scheduling/alerts and full restore not executed; listing is not restore validation                                          |
| Private-media disclosure        | Auth Library vs public representation mapping; explicit feed/artwork opt-in                            | SQL/host compromise; no media mount into proxy; test anonymous private access                                               |
| Abusive/illegal content         | File-format validation only                                                                            | Abuse contact, acceptable-use review, moderation/quota/takedown and appeals; publication retention blocks ordinary deletion |

Highest launch risks: unthrottled public authentication, unsanitized unexpected-error
logs, no emergency public-content revocation, no tested recovery/off-server copy,
no email ownership/recovery, no personal-data lifecycle. 008A.2 host preparation can
proceed after review; it must not be represented as approval for open public creator
onboarding. RSS public delivery acceptance is separate from account-service readiness.
