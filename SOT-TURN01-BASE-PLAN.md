# SOT Turn 01 Base Plan

**Stage:** `base`  
**Status:** ACTIVE — PRODUCT DELIVERY  
**Date:** 2026-09-02

## Recovery anchor

- Accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Accepted pre-base backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`.
- Clean Base UI integrators: Base-22 at `603e8a331b13b72a097e9ebb9640e33707279777` and Base-24 at `083aa1334208b1e6995fa18852e82722a815f331`.
- Canonical AI/storage-default integrator: `5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5/integrate-SOT-turn01-base-ai.py`.
- Live backend remains build `2026.08.30.sot-turn01-base-22`, schema `4`.
- Canonical target remains `SOT/SOT-turn01-base.html`.
- Canonical generated candidate SHA-256 remains `48c3f1ccb8af820331816cdfb94fbfcfd546ba078c9c4e28642eda54513d645c`.

## Governance

1. `SOT-turn01-pre-base.html` remains the frozen recovery anchor. Failed generated HTML is evidence only and never becomes an implementation ancestor.
2. `install-SOT-turn01-base.sh` is the only active Base installer. Numbered installers are history only.
3. Before governed SOT files change, archive the current commit/path/blob state under `SOT/archive/`.
4. Product development proceeds from the pinned clean lineage above. Do not patch failed generated HTML forward.
5. The owner is the browser/device product tester. Mechanical QA exists to prevent obviously broken handoffs, not to replace owner testing.

## Base product contract

The canonical Base must retain all of the following:

1. Stable completed Index with `2-copy`, `3-copy`, and `4+ copy` findings and drill-down.
2. Current versus stale Plan separation with explicit re-index recovery.
3. One Source/Target/Backup/default selector with independent Available/Selected scrolling, local search, true move semantics, and footer commit action.
4. Default Target and Default Backup configuration.
5. Dynamic Windows volume inventory shared across Source, Target, Backup, and defaults; operation-boundary validation remains deterministic.
6. Operational Venice/OpenRouter model discovery, real completion validation, browser-local keys, and explicit active provider/model state.
7. Every inference begins with the SOT supervisor prompt, then exact project/evidence context, then conversation history and operator request.
8. AI remains advisory: `Inference -> structured proposal -> deterministic validation -> SOT Plan -> approval -> execution`.

## Canonical source correction

The rejected Base-28 integrator inserted helpers at the inner `function` token of `async function openConfig`, leaving a standalone `async` expression that parsed but failed at runtime. The canonical integrator inserts at the complete function declaration boundary, rejects standalone/line-terminated `async` hazards, proves replaced functions unique/structurally balanced, and emits directly from clean Base-24 behavior.

## Mechanical QA floor

The release path is intentionally lightweight. Before owner handoff, the exact generated candidate and the exact public read-back must pass:

- pinned source SHA verification;
- Python integrator parse;
- deterministic generated candidate SHA verification;
- protected product-contract checks;
- standalone/line-terminated `async` hazard rejection;
- per-inline-script JavaScript parse with `node --check`;
- combined inline-script JavaScript parse with `node --check`;
- backend health/build/schema verification before and after cutover;
- exact SHA-256 identity between generated candidate and canonical public read-back;
- automatic rollback if install/read-back/post-health fails.

The WSL-to-Windows Chrome/Edge DOM harness, Windows browser-profile lifecycle, browser-process cleanup, and headless browser self-test are **not release gates**. They were removed after repeatedly blocking product progress with harness-only failures. Browser/device behavior is tested by the owner at the canonical URL.

## Handoff rule

A Base handoff occurs after the lightweight mechanical QA succeeds and the canonical public URL serves the exact parsed candidate bytes. The installer emits:

`=== TURN 01 BASE READY FOR OWNER TEST ===`

At that point the owner tests actual product behavior in the normal browser/device environment. Base remains the stage until owner acceptance.
