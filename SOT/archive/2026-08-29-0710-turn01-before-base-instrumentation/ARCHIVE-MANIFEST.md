# Turn 01 checkpoint before Base instrumentation upgrade

Timestamp: 2026-08-29 07:10 PT

Current live runtime remains accepted Base-9. Base-15 has not been owner-run and is superseded before testing.

Archived repository state by immutable reference:
- `install-SOT-turn01-base15.sh` blob `3e371a1216fdbfd7e9f3136e902c934de491d1d4`, commit `e2cc98aa214aaa6b8a8588f3de7779dce37b14e7`.
- `SOT-TURN01-BASE-PLAN.md` blob `635f9e7899c117046a3f657a82e48fae14d8755c`.
- Frozen accepted UI/backend sources remain unchanged.

Reason for supersession: before another owner run, qualification instrumentation must comprehensively log every gate, every discovered drive, every browse result, persistence round-trip, source/build identity, cutover health, rollback outcome, and final PASS/FAIL summary. Good and bad results must be retained in a persistent qualification log.