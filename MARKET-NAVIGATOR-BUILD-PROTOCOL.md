# Market Navigator — Clean Build / Blocker Protocol

Status: BINDING BUILD GOVERNANCE
Updated: 2026-09-04
Applies to: Market Navigator reconstruction and every successor release stage

## 1. Core rule
Every release stage advances from a known, clean, mechanically qualified baseline by applying a deliberate diff to create the next candidate.

**baseline N → defined diff → candidate N+1 → qualify → accept as new baseline or reject/rollback**

The clean accepted baseline is always preserved.

## 2. No patch-forward without explicit owner approval
A failed, rejected, partially working, or unqualified candidate must **not** become the implementation ancestor of another candidate.

If a candidate fails or is rejected:
1. record the failure/root cause in the Graveyard;
2. return to the last accepted/qualified baseline;
3. correct the intended diff;
4. create a fresh candidate from that baseline;
5. rerun qualification.

**Under no circumstances may the builder patch forward from a failed/rejected candidate unless the owner gives explicit approval to do so.**

Silence is not approval. General publishing permission is not patch-forward approval.

## 3. Purity of construction
Do not solve blockers by introducing architectural detours.

Prohibited unless explicitly approved:
- wrapper releases;
- iframe recovery shells;
- compatibility overlays;
- runtime monkey patches;
- stacked patch scripts used to preserve a broken candidate;
- duplicate chart engines;
- duplicate state models;
- alternate hidden data paths;
- temporary production fallbacks that become ancestors;
- exotic deployment constructs used to avoid fixing the actual source;
- any mechanism whose purpose is to keep a failed candidate alive rather than rebuild cleanly from baseline.

Use the simplest direct source change that preserves the intended architecture.

## 4. Blocker protocol
When the builder encounters an obstacle, do not invent an elaborate workaround and do not stop with a diagnosis.

Use this sequence:
1. State the blocker in one plain sentence.
2. Identify the last clean baseline and the exact intended next-stage diff.
3. Identify the simplest direct way to remove the blocker without changing architecture.
4. If the current candidate has become contaminated by failed experiments, discard it and return to the clean baseline.
5. Apply the corrected diff to the clean baseline.
6. Re-run the stage's mechanical qualification.
7. Advance only after qualification passes.

If execution must pass to another session/agent, write a prompt for the future builder using §5.

## 5. Required future-self / successor prompt
When blocked, create and use a prompt in this form:

> Continue Market Navigator from the last clean qualified baseline. Do not patch forward from the failed candidate. The blocker is: **[plain-language blocker]**. The intended stage change is only: **[exact intended diff]**. Return to **[baseline file/commit]**, make the smallest direct source-code change that removes the blocker, then recreate the candidate from that baseline. Do not introduce wrappers, overlays, compatibility layers, alternate runtimes, duplicate implementations, or architectural workarounds. Run the required syntax, boot, functional, responsive, data-integrity, and stage-specific qualification gates. If the rebuilt candidate fails, discard it, record the failure in the Graveyard, and repeat from the same clean baseline with a corrected diff. Do not patch the failed candidate unless the owner explicitly approves patch-forward. Return only when the stage is mechanically qualified or when a concrete external tool/permission blocker makes execution impossible.

The prompt must be adapted with the actual baseline, blocker, intended diff, files, and qualification gates. Keep it plain and executable.

## 6. Stage advancement contract
Before changing code for a stage, identify:
- exact baseline commit/blob;
- exact target files;
- exact product delta for the stage;
- explicit non-goals;
- required mechanical gates.

After the stage passes, record:
- candidate commit/blob;
- diff from baseline;
- gate results;
- whether the candidate is now the accepted baseline for the next stage.

A candidate becomes the next baseline only after the required qualification and owner acceptance level defined by the Master Plan.

## 7. Relationship to the Master Plan and Graveyard
`MARKET-NAVIGATOR-MASTER-PLAN.md` defines what to build and the ordered construction/qualification stages.

`MARKET-NAVIGATOR-GRAVEYARD.md` defines rejected approaches and permanent negative requirements.

This file defines **how each stage is advanced cleanly and how blockers are handled**.

Where a historical implementation or donor is used, first extract the intended capability into the clean stage diff. Do not preserve obsolete surrounding architecture merely because the donor contains useful code.

## 8. Default decision rule
When choosing between:
- a direct clean change to the accepted baseline, or
- a clever mechanism that preserves/patches a failed candidate,

choose the direct clean change to the accepted baseline.

When in doubt, rebuild the stage from the clean baseline rather than patching forward.
