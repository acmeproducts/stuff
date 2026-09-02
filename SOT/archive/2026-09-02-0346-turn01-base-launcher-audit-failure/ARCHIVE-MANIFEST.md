# SOT Turn 01 Base launcher audit failure

- Archived: 2026-09-02 03:46 PDT
- Stage: `base`
- Result: qualification launcher failed before canonical qualifier execution.
- Failure: `patched canonical qualifier missing JS_GENERATED_PER_SCRIPT_PARSE`.
- Root cause: the launcher audited for the literal runtime gate name `JS_GENERATED_PER_SCRIPT_PARSE`, but the canonical qualifier constructs that name dynamically as `JS_${tag^^}_PER_SCRIPT_PARSE`; the underlying generated-script parse gate remains present and had passed in the immediately preceding host run.
- No product candidate cutover occurred in this launcher attempt.
- Current main before correction: `91c26b626c4f72f756c3cf562e62719d2c9267f3`.
- Governed file before correction: `install-SOT-turn01-base.sh` blob `8e79996c4ef833c4632bb33712d71c465a3333b1`.
- Source canonical qualifier remains pinned to commit `0ac5325d70d3597746207e6998df84b165b8ed52`, blob `0f78d2c5d945139f7197221ab0e99fe8252b6ddd`.
- Correction scope: launcher structural audit only. Product lineage, candidate bytes, browser cleanup R2 logic, backend contract, and release floor are unchanged.
