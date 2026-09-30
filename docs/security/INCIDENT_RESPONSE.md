# Initial incident response

Owner is initial incident commander and engineering operator. Before launch, record
private owner/backup operator/provider support/legal contacts and an out-of-band
channel. Do not put real contacts, evidence or secrets in public Git issues.

1. Detect and triage: record UTC time, reporter, affected hostname/releases, symptoms,
   backup freshness and suspected data scope. Distinguish outage from compromise;
   prioritize active exfiltration/account takeover. Confirm through independent health,
   host journal and container state; never paste raw env/requests into tickets.
2. Preserve evidence: restricted incident directory; collect sanitized relevant Docker
   logs, SSH journal, network/process state, image digests/Git SHA, DB ledger and
   provider events. Hash exported files, note collector/time, retain original evidence
   securely. Full disk/memory evidence may contain secrets; restrict/encrypt access.
   Avoid patching/rebooting/deleting containers before capture unless stopping harm
   takes priority; document that tradeoff. Never expose Docker inspection env output.
3. Contain: use provider console/firewall or remove proxy exposure to stop harmful
   public traffic; Docker publication can bypass UFW. Preserve console and known-good
   SSH access before isolation. Stop affected API if needed; do not `down -v` or wipe
   media. For host compromise use trusted console, isolate network and rebuild a new
   trusted host; do not trust commands/evidence from compromised OS alone.
4. Revoke: delete affected user session rows with reviewed parameterized SQL (or all
   sessions if confirmed widespread compromise); logout alone is insufficient. Revoke
   exposed SSH/GitHub/registry/provider/DB credentials from a trusted device. Test new
   access before removing last recovery path. Rotate backups/TLS keys if exposed.
   Password hash disclosure may require user password resets; no reset flow exists,
   so plan controlled remediation and communications rather than pretending automated.
5. Content abuse/takedown: unpublish/archive removes discovery but retains public
   audio/artwork. For urgent containment block affected public resolver URLs in reviewed
   proxy config or temporarily isolate service. Preserve evidence, do not delete rows
   or bypass immutable-history triggers ad hoc. Review shared representations/aliases
   and test all affected IDs; permanent takedown needs a designed operation.
6. Assess impact: establish earliest/latest exposure, user/data categories including
   unpublished media and backups, evidence of access vs uncertainty, integrity changes,
   downstream downloaded/cached content, and affected vendors. Engineering records
   facts and uncertainties; legal/owner determines jurisdiction-specific breach and
   notification obligations. Seek qualified counsel; this runbook states no legal deadline.
7. Recover: select known-good pre-compromise matched recovery set; verify checksum and
   isolated SQL/media restore, deploy patched reviewed images on clean host, rotate
   secrets before reconnection. Verify scoped private access, sessions, feeds, media
   HEAD/Range, TLS and backup completion. Owner signs off on traffic reopening.
8. Communicate/escalate: owner coordinates provider, counsel and impacted users using
   verified facts and appropriate private channels. Preserve communication decisions;
   do not publish exploit details or secrets during containment.
9. Review: record timeline, cause, detection gaps, data impact/uncertainties, recovery
   evidence and corrective actions/owners. Test improved controls and run tabletop
   exercises. Restore service is not proof of eradication or legal closure.
