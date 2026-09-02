# SOT Turn 01 Base browser-harness cleanup failure archive

- Archived before patch: 2026-09-02 03:41 PDT
- Stage: `base`
- Main ref observed immediately before archive/write: `618cac1906dc13635bc780b44d609c89f376961f`
- Governed installer: `install-SOT-turn01-base.sh`
- Installer blob SHA before patch: `0f78d2c5d945139f7197221ab0e99fe8252b6ddd`
- Installer release commit used by host: `0ac5325d70d3597746207e6998df84b165b8ed52`
- Qualification run: `/home/support/.openclaw/workspace/https/report/SOT/archive/20260902-033825-turn01-base-qualification/`
- Persistent runtime log: `/home/support/.openclaw/workspace/https/report/SOT/archive/20260902-033825-turn01-base-qualification/qualification.log`
- Candidate SHA-256: `48c3f1ccb8af820331816cdfb94fbfcfd546ba078c9c4e28642eda54513d645c`

## Mechanical result

The clean candidate passed deterministic generation, static product contracts, async-hazard rejection, per-inline-script JavaScript parse, and combined-script JavaScript parse. Qualification then failed before candidate cutover in the browser harness self-test because Windows Edge profile cleanup reported a remaining profile process (`PID 80136`) and returned cleanup `rc=4`.

Failure gates:

- `FAIL JS_BROWSER_HARNESS_SELFTEST execution-failed`
- `FAIL FINAL qualification failed rc=1`

No mechanically-qualified Base handoff occurred. The failed qualification run is evidence only. No failed generated HTML becomes an implementation ancestor.

## Patch scope

Patch only the canonical installer's Windows browser-profile cleanup mechanism so that browser process-tree teardown is deterministic and cleanup success is proven. Preserve all existing candidate-generation, JavaScript parse, browser-boot, product-contract, volume, identity, rollback, backend-health, and public-readback gates. The product candidate source lineage and candidate SHA remain unchanged unless a later qualification proves otherwise.
