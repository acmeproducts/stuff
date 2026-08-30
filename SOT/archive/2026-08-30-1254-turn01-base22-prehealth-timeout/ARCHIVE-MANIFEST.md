# Turn 01 Base-22 qualification pre-health timeout

**Stage:** base
**Candidate:** Base-22
**Installer:** `39f3b0d27a06c7ad75ac084284ca8917a8a83e0d/install-SOT-turn01-base22.sh`
**Owner run:** 2026-08-30 12:54 PDT

## Evidence

The qualification run created its manifest and verified installer identity, then the very first pre-cutover health request to `http://127.0.0.1:18080/api/sot/health` timed out after 5 seconds with HTTP `000`.

Observed terminal evidence:

- `PASS RUN_MANIFEST`
- `PASS INSTALLER_IDENTITY 39f3b0d27a06c7ad75ac084284ca8917a8a83e0d`
- `curl: (28) Operation timed out after 5002 milliseconds with 0 bytes received`
- `FAIL PRE_HEALTH_HTTP HTTP=000`
- `FAIL FINAL qualification failed rc=1 rollback_attempted=0`

Persistent user-machine run directory:
`/home/support/.openclaw/workspace/https/report/SOT/archive/20260830-125444-turn01-base22-qualification`

## Interpretation

No Base-22 build input was fetched, generated, installed, or cut over. `rollback_attempted=0` confirms the live runtime was not mutated by this qualification attempt.

This evidence does **not** reject the Base-22 product architecture. It proves the qualification harness used a single 5-second pre-health request and therefore could not distinguish a transient/busy existing runtime from a genuinely unavailable service before beginning a non-mutating qualification.

## Required correction

Keep the Base-22 product build lineage unchanged. Correct only the qualification harness so the pre-health gate:

1. retries for a bounded interval;
2. records every attempt;
3. requires the expected live build/schema/status before any build or cutover work;
4. does not restart or mutate the service merely to satisfy pre-health;
5. still fails closed if the live service never becomes healthy.

This is qualification-harness evidence, not a new runtime baseline and not permission to patch Base-21/Base-22 generated runtime forward.
