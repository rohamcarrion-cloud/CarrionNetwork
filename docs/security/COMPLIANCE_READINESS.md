# Compliance engineering readiness

This is an engineering gap register, not legal advice or a compliance certification.
No GDPR, CCPA, TDPSA, SOC 2, PCI DSS, HIPAA or other compliance is claimed.
Jurisdiction, users, entity roles and applicable laws require qualified review.

| Capability                                       | Status          | Evidence / next work                                                                                                      |
| ------------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Authentication, scoped authorization             | IMPLEMENTED     | scrypt/hash sessions, workspace/show checks; MFA/email verification/throttling absent                                     |
| Public/private media separation                  | IMPLEMENTED     | Explicit feed/public resolvers; publication retention documented                                                          |
| Data inventory / threat / incident documentation | IMPLEMENTED     | Local docs only; operational procedures not deployed                                                                      |
| Recoverable production backup                    | PARTIAL         | Scripts/design; schedule, encrypted off-server copies and rehearsal pending                                               |
| Account deletion and retention enforcement       | NOT IMPLEMENTED | No API/workflow; historical FK/triggers need reviewed erasure/takedown design                                             |
| Personal-data export                             | NOT IMPLEMENTED | No owner export workflow or identity verification process                                                                 |
| Consent/preferences/privacy notices              | NOT IMPLEMENTED | No consent ledger/preferences or reviewed notice artifacts                                                                |
| Security audit events / logs                     | PARTIAL         | Basic errors + planned host logs; no structured audit ledger; raw error sanitization required                             |
| Session revocation / recovery                    | PARTIAL         | Current-session logout/expiry; no owner all-session UI, password reset or MFA                                             |
| Vendor/subprocessor inventory                    | PARTIAL         | Intended Hostinger/GitHub/container registry/ACME CA; contracting/data locations/roles to assess; future vendors separate |
| Incident process                                 | PARTIAL         | Written engineering runbook; contacts/tabletop/legal applicability pending                                                |
| Copyright/DMCA workflow                          | NOT IMPLEMENTED | No notice/counter-notice case management; public-media emergency takedown absent                                          |
| Acceptable use / moderation                      | NOT IMPLEMENTED | Format validation is not enforcement; reporting, quotas, investigation/appeals needed                                     |
| Age eligibility                                  | NOT IMPLEMENTED | No age gate or eligibility policy                                                                                         |
| Payments / payment compliance boundary           | FUTURE          | No payments stored; use hosted provider boundary with separately reviewed obligations                                     |
| Analytics / marketing choices                    | FUTURE          | No analytics collection routes or campaigns; evaluate choices before adding                                               |

Before broad onboarding: owner/legal review of notices, eligible audiences, abuse
process and legal requests; engineering auth/logging protection, deletion/export plan,
retention exceptions and secure recovery. Legal counsel determines notification,
retention, copyright and age rules; do not invent universal statutory deadlines.
