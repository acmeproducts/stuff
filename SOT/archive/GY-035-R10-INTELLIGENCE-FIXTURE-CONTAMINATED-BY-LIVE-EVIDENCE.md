# GY-035 — R10 intelligence qualifier contaminated by live evidence

Date: 2026-09-06

Status: rejected pre-cutover qualification attempt; evidence only.

Observed failure:

- Developer backend parse passed.
- Developer UI parse passed.
- `DEV_INTELLIGENCE` failed after 10 seconds.
- The failure output showed the synthetic `r10a` / `r10b` sources had been inserted, but the global intelligence result was dominated by the copied live SSOT dataset and its top-N duplicate/risk rows.
- The synthetic duplicate fingerprint was only 100 bytes, so it was excluded from the global `duplicate_groups` top-100 result even though the fixture itself existed.
- No cutover occurred; live R9 remained untouched.

Root cause:

The behavioral intelligence qualifier used a backup of the production database as its fixture database. After correctly initializing the candidate backend before inserting the fixture, it still left all pre-existing live evidence in that temporary database. Because `storageIntelligence('',100)` returns ranked top-N results, the synthetic rows were not guaranteed to appear. The qualifier therefore tested fixture visibility through a live-data ranking window instead of against an isolated deterministic fixture.

Correction:

- Keep the copied database only to preserve the exact governed schema and migrations.
- Initialize the candidate backend first so startup recovery is complete.
- Before seeding the intelligence fixture, clear all data tables in the temporary database while preserving only `schema_migrations` and `settings`.
- Gate the candidate process on a `seeded` marker so it does not evaluate intelligence until the isolated fixture is fully committed.
- Preserve the existing duplicate/shared/risk assertions.

Governance rule:

Behavioral qualification fixtures must be isolated from live evidence whenever the asserted API is ranked, paginated, limited, or otherwise selection-sensitive. A copied production DB may be used as a schema carrier, but live rows must not influence deterministic fixture assertions.
