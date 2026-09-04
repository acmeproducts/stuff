# SOT Turn 01 Base — Executable Qualification Prechange Manifest

**Timestamp:** 2026-09-04 14:05 PT  
**Repository:** `acmeproducts/stuff`  
**Branch:** `main`  
**Prechange main:** `141de8b2a46d705848462365473447e7e0827f45`

## Governed files before release-state updates

| Path | Blob SHA |
|---|---|
| `SOT-TURN01-BASE-PLAN.md` | `2bc423e828b996bbb57d787387d2975f8083c834` |
| `SOT-GRAVEYARD.md` | `91641ccb26d75c34c6e40a49cac710c53571dc13` |
| `install-SOT-turn01-base.sh` | `bef7609c0004d8d8f65afeed9a83ec60d0fa2bc2` |
| `.github/workflows/sot-coordination2-candidate-qualification.yml` | `f7d3e8307d3a9aad5d289c2df1ef7431e3f56bf6` |

## Recovery lineage

- Accepted pre-base UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`.
- Accepted pre-base backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`.
- Base-22 UI integrator: `603e8a331b13b72a097e9ebb9640e33707279777`.
- Base-24 UI integrator: `083aa1334208b1e6995fa18852e82722a815f331`.
- Canonical AI/storage-default integrator: `5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5/integrate-SOT-turn01-base-ai.py`.

Failed/generated candidates remain evidence only and are not implementation ancestors.

## Qualification evidence

Executable qualification run `33919314140` on commit `141de8b2a46d705848462365473447e7e0827f45` completed successfully. It generated the candidate from the governed clean lineage and passed:

1. same-project exclusion;
2. cross-project independence;
3. committed-state durability;
4. re-index atomicity;
5. plan truth during replacement indexing;
6. stale-generation protection;
7. pause/stop/restart durability;
8. activity reconstruction;
9. real Chromium operator-state reconciliation;
10. parse/schema/protected Base product-contract floor.

## Remaining release work

This manifest precedes governed plan/installer changes. The canonical installer must be aligned with the qualified clean-lineage candidate and must independently enforce host health, schema, public-byte identity, database integrity, and rollback before emitting owner-test readiness.
