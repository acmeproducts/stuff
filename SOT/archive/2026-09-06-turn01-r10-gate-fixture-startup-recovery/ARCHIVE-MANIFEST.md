# GY-034 — R10 qualification fixture invalidated by startup recovery

Date: 2026-09-06
Stage: Turn 01 Base R10
Status: pre-cutover qualification failure; rejected candidate not installed

## Host evidence

Installer commit used: `3e3e5b20f3dcfde58a692c208a009dd69e734ad9`

Qualification archive:
`/home/support/.openclaw/workspace/https/report/SOT/archive/20260906-153305-turn01-r10-operating-intelligence-release`

Observed failure:

`Error: global duplicate truth undefined`

The failure occurred in `DEV_INTELLIGENCE` before Manager, Red-team, cutover, public identity, or release-ready gates.

## Root cause

The intelligence fixture copied the live database, inserted synthetic R10 observations, and only then required/called the backend. The first `rows(...)` call lazily runs `ensureSchema()` and startup recovery. This repeats the already-governed fixture-ordering problem recorded in GY-031: synthetic state inserted before backend initialization can be mutated or invalidated before the behavioral assertion executes.

The R10 storage-intelligence source correction from GY-033 remains valid. This failure is in the qualifier ordering, not a reason to patch forward from a failed generated runtime.

## Required correction

Initialize the candidate backend and force an actual database read first. Only after the same Node process reports ready should the installer insert the synthetic intelligence fixture. Then query `storageIntelligence()` in that already-initialized process and assert duplicate cardinality, cross-project membership, reclaimable bytes, locations, project-local duplicate math, and missing-copy risk.

Do not suppress startup recovery with a shim or alternate worker mode. Preserve the same-process behavioral test pattern already established by GY-030/GY-031.
