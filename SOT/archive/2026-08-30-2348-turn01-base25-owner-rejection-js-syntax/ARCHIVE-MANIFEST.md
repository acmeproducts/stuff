# SOT Turn 01 Base-25 Owner Rejection — JavaScript Syntax Failure

**Recorded:** 2026-08-30 23:48 PT  
**Stage:** Turn 01 `base`  
**Candidate:** Base-25  
**Disposition:** REJECTED — owner/device gate

## Evidence

Base-25 passed the installer-reported mechanical qualification, including `NODE_UI`, and was installed publicly. The owner then encountered a JavaScript syntax error in the actual browser surface.

This is a release-process failure even if the defect is browser-specific: a candidate with a JavaScript parse/boot failure must never reach owner testing.

## Recovery rule

Base-25 is failed evidence only and is not a patch-forward baseline. The next candidate must regenerate from the governed clean lineage and incorporate the AI delta only after a stronger exact-artifact syntax/boot gate passes.

## Quality-control correction

The prior `NODE_UI` gate is insufficient by itself. Effective immediately, every SOT handoff must prove the exact public artifact that the owner will load, not merely a temporary pre-cutover extraction.

Required release floor:

1. Generate candidate from the declared clean source lineage.
2. Extract **every executable inline script** from the complete generated HTML and syntax-check each script individually.
3. Syntax-check the combined executable script bundle.
4. Install/cut over only after pre-cutover syntax passes.
5. Fetch the exact public URL after cutover.
6. Verify the fetched public bytes identify the intended candidate.
7. Re-extract every executable script from the **publicly fetched HTML** and repeat syntax parsing on those exact bytes.
8. Execute a real browser/DOM boot smoke test against the public artifact and fail on any `SyntaxError`, uncaught exception, initialization abort, missing root application render, or console parse error.
9. Do not print the mechanical-qualification success marker and do not issue a test URL until all exact-public-artifact syntax and boot gates pass.
10. If the environment cannot perform the browser boot gate, qualification is blocked; it is not waived and owner testing is not substituted for it.

## Repository state before governance correction

Main head observed immediately before this archive: `6b7d8290e8cdb6f7d84cc3813ca363d516dfff11`.

Relevant candidate installer: `install-SOT-turn01-base25.sh` at commit `08724faeebeba2dfad82cd809909d3b3b7e8aa3c`.

The successful installer log reported by the owner was:

`/home/support/.openclaw/workspace/https/report/SOT/archive/20260830-151233-turn01-base25-qualification/qualification.log`

No Base-25 generated HTML is authorized as an implementation ancestor.