# Market Navigator — C4 / C5 Decision Record

Status: APPROVED ANALYTICAL REDESIGN RECORD
Date: 2026-09-23
Application baseline during analysis: `market-navigator-turn26-ship.html`, blob `fc61e29d76f1a7ecf1226f74e0884865dca04684`, 231,792 bytes

## C4 — information time / vintage

**Disposition: PASS WITH ONE PROSPECTIVE-ONLY SOURCE.**

The governed FRED/ALFRED sidecar was executed against the official API. The original collector failed because one request exceeded FRED's 2,000-vintage-date ceiling and the revision-oriented NFCI response exceeded the 60-second read window. The corrected collector:

- uses bounded two-year real-time windows;
- uses `output_type=1` real-time validity periods rather than duplicated new/revised payloads;
- retries bounded network timeouts;
- classifies the earliest real-time period for each observation as its initial release;
- retains later periods as revisions;
- records unsupported ALFRED history explicitly rather than aborting or substituting current values.

Result:

- 11 FRED components qualified through ALFRED;
- 204,602 qualified availability/revision events;
- observation date, `availableFrom`, `availableUntil`, initial-release, and revision contracts validated;
- no-look-ahead selector contract passed;
- `hySpread` (`BAMLH0A0HYM2`) is not available in ALFRED and is the sole blocked historical-vintage source.

Governed HY Spread rule:

- pre-effective history may appear only inside a clearly labeled **RETROSPECTIVE CURRENT-VINTAGE BACKCAST**;
- it may not be described as the value known or published on that historical date;
- canonical published operation requires prospective capture from model launch forward;
- no six-of-seven calculation or silent reduced-component renormalization is allowed.

The normal latest-value Market Navigator path remains no-key. The FRED credential is backend-only and was not stored in source, generated evidence, Git history, or the application.

## C5 — component registry

**Disposition: PASS / APPROVED FOR THE PERSISTENT-INDEX CANDIDATE.**

`data/market-backend/component-registry-v1.json` merges:

- C3 `S2A_EVENT_FREQ` transform/scaling records;
- fixed model-version launch calibration;
- 21 components across RSK, GRW, and MAC;
- seven equal nominal coefficients per index;
- corrected Treasury-curve direction `−1` under MAC pressure semantics;
- C4 availability modes and the explicit HY Spread constraint;
- no horizon-dependent scales or weights;
- no adaptive reweighting;
- no silent reduced-set renormalization.

Registry status is `C5_APPROVED_NOT_YET_PRODUCTION`. Production activation remains contingent on the Turn 27 application qualification and owner disposition.

## I1 handoff

I1 is authorized to use model version `MN-PERSISTENT-1.0.0` under `MARKET-NAVIGATOR-PERSISTENT-INDEX-SPEC.md`.

The accepted analytical rule is:

`index(t) = 100 + (1/7) × Σ governed_component_signal_i(t)`

with fixed reference date `2016-09-01`, frozen scales, viewport-only horizons, display-only Rebase 100, explicit retrospective-backcast labeling, immutable published values, and versioned chain-linking for future methodology changes.
