# SOT Turn 01 R5 owner-rejection archive

Archived: 2026-09-05

## Repository state before R6

- main: `df4bf28db674e4388f64d6220c5015b0bc3d97d2`
- `SOT-TURN01-BASE-PLAN.md` blob: `3044a40297d0edec95a8c31e726b37533fcd6e99`
- current R5 UI source: `SOT-turn01-base.html`, build marker `SOT-turn01-base-r5-simple-protect`
- current canonical installer: `install-SOT-turn01-base.sh`
- qualified backend foundation remains `b58920f014960c9b18b705a0fdcf0406c621fd5f`, build `2026.09.03.sot-turn01-coordination-2`, schema 5.

## Owner rejection

R5 is rejected as a product/UI ancestor. The backend coordination foundation is not rejected.

Observed failures:

1. Expanded project sections collapse again under background refresh, so operator-owned expansion state is not durable.
2. Project cards collapse rich durable state into generic transient labels such as `Error`.
3. Failures are diagnostic rather than actionable. Example: an invalid or missing Target is surfaced as a machine error instead of `Needs Target` with a direct `Choose Target` action.
4. The project lifecycle and next step are not visually obvious.
5. The product lacks an explicit installation-wide SSOT management layer reconciling all project SOTs.
6. The current `Protect my files` wizard framing obscures the actual storage-reconciliation workflow.

## Recovery rule

Do not patch the rejected R5 UI forward. Build R6 as a clean UI source against the accepted qualified backend/API contract. Preserve the qualified backend, durable evidence semantics, project concurrency, shared storage authority, and canonical installer/rollback behavior.
