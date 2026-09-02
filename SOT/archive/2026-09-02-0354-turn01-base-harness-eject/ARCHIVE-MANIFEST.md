# SOT Turn 01 Base harness-eject archive

- Archived: 2026-09-02 03:54 PDT
- Reason: owner terminated the WSL-to-Windows Edge qualification harness after repeated harness-only failures blocked product progress.
- Main observed immediately before archive: `22a19fc2957bedc94ba4eeebf44b599a09dbd8fe`
- `SOT-TURN01-BASE-PLAN.md` blob before change: `e7fd77061c35b3cc77ab89aceb5699bf20ee2da0`
- `install-SOT-turn01-base.sh` blob before change: `7ef1842ce39395ddefa352c2cf29c57dc39d311e`
- Product candidate SHA-256 remains: `48c3f1ccb8af820331816cdfb94fbfcfd546ba078c9c4e28642eda54513d645c`
- Clean product lineage remains unchanged: accepted pre-base -> Base22 integrator -> Base24 integrator -> canonical AI/storage-default integrator.
- Rejected infrastructure: Windows Edge/Chrome launch from WSL, temporary Windows profile lifecycle, DOM-dump harness self-test, browser-process cleanup as a release gate.
- Retained QA: deterministic clean generation, Python integrator parse, per-inline-script JavaScript parse, combined JavaScript parse, async hazard rejection, product-contract checks, backend health, exact public byte identity, rollback on failed cutover/readback.
- Owner remains the browser/device product tester.
