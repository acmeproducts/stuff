# Chart contract audit — October 20, 2026

Owner authorization: audit the entire active chart specification, add missing release checks, and prevent owner testing from being the exploratory QA process.

## Authority and conflicts

Read: Frozen Contract; NOW/Explore Contract; Market View Chart Acceptance Matrix; Persistent Index Spec; Chart Owner Clarifications; latest Master Plan recovery/release entries; correction documentation and all active test source.

The later owner-approved ee38 chart baseline and direct clarifications govern current NOW/Analyze behavior. Do not restore the earlier stacked V1/V2 design, V4/V5 pages, mandatory EXPLORE entrance, series-colored axes, active-chip-only Y2, positional palettes or silent native-to-index fallback. Keep one reusable chart, independent Analyze, exact source observations and frozen Library evidence. The older full-product frozen contract also contains economic classification/prose requirements outside this chart correction; a passing chart suite does not qualify them.

## Concrete gaps found

1. The retained Library/close/geometry suite existed but was absent from the hosted publication workflow and hardcoded local browser/runtime paths. Wire it into every qualified chart publication.
2. No tablet portrait/landscape contract checks were active. Add both to the new suite alongside desktop and phone.
3. Plot-context checks did not cover all edge points and hold/touch combinations. Check first/last/min/max observations, compact popup containment, click/context/hold/tap behavior, legend-only information and Escape.
4. Export paths did not collectively prove JSON/CSV/Markdown values and package qualification identity in both consumers. Add actual downloads and a Print preparation/state invariant.
5. Verified resource metadata was overwritten as delayed when expiry was absent. Preserve resource-hash-verified integrity explicitly; this is not a claim of provider freshness.
6. Separate passing scripts lacked one traceable cumulative release receipt. Require every enumerated suite to run successfully on unchanged application bytes, record suite/source hashes and authority hashes, map every requirement, and fail before publication on absent/failed evidence.
7. Scope limits were scattered through old documents. Keep external physical-device and AI prose acceptance explicitly pending in the cumulative report.

## Active automated matrix

| ID | Requirement | Witness |
| --- | --- | --- |
| C01 | Seven horizons share governed viewport; no source expands time | market-navigator-chart-correction-tests.cjs |
| C02 | Index availability is independent of raw-source cadence | market-navigator-chart-contract-tests.cjs |
| C03 | Empty raw-series chips stay visible and disabled | market-navigator-chart-contract-tests.cjs |
| C04 | Index and compatible USD axes are family-owned independent of insertion/highlight | market-navigator-chart-correction-tests.cjs |
| C05 | Y2 availability and requested choices persist across context/navigation/reload | market-navigator-chart-selector-tests.cjs |
| C06 | Fixed September 1 2016 references and disclosed later starts | market-navigator-chart-correction-reference-tests.cjs |
| C07 | Horizon changes every normalized series; actual native prices invariant | market-navigator-chart-correction-tests.cjs |
| C08 | All catalog point dates, values and real source clocks | market-navigator-chart-correction-date-tests.cjs |
| C09 | Full-observation compact linked-date crosshair; native USD formatting | market-navigator-chart-correction-date-tests.cjs |
| C10 | Plot click/context/hold/touch cannot open information; legend can | market-navigator-chart-contract-tests.cjs |
| C11 | Edge inspection contained at left/right/min/max; Escape dismisses | market-navigator-chart-contract-tests.cjs |
| C12 | Desktop, phone and tablet geometry; no chart scroll hunt | market-navigator-chart-contract-tests.cjs |
| C13 | NOW isolation, parked Analyze/Library restoration, close destroys instance | market-navigator-chart-correction-retained.cjs |
| C14 | Every source has persistent preset/custom styles; RSK-only red; readable neutral axes | market-navigator-chart-correction-config-tests.cjs |
| C15 | Exports preserve plotted/native/indexed values and verified package identity; Print prepares a real frozen chart without mutating NOW | market-navigator-chart-contract-tests.cjs |
| C16 | Data uses same reference and real canonical source history | market-navigator-chart-correction-reference-tests.cjs |
| C17 | Seven signed/scaled component contributions reconcile all indices/horizons/displays | market-navigator-chart-correction-calculation-tests.cjs |
| C18 | ETL receipts, package IDs, fault isolation and bounded integrity failure behavior | market-navigator-chart-correction-etl-tests.cjs |
| C19 | All-index chart modes and common component lifecycle smoke | market-navigator-sync/browser.cjs |
| C20 | WTI/IWM/QQQ selection cannot alter values or either axis | market-navigator-sync/test_axis_focus.cjs |

Level 0/1/3 independent qualification remains in run.py and runs before this chart gate. It verifies all enabled source native-response identities/revisions, every source-horizon aggregate, and every governed historical component/index calculation. The release-probe integration test must remain scheduled/non-force; the app cannot substitute held dates for fresh releases. Existing negative controls reject provider-response/revision failures, resource substitution, invalid package identity and failed publication.

## Gate implementation

The machine-readable contract is market-navigator-acceptance/contract.json. The runner executes every listed suite, hashes the exact test source and application bytes, records package identity, and writes .evidence/chart-cumulative-acceptance.json. The new interaction/export suite writes .evidence/chart-contract-tests.json. The hosted workflow retains both and refuses publication after a failure. A missing mapped witness fails closed.

PASS means the enumerated automated assertions passed. It is not an assertion that arbitrary future defects are impossible. Physical Windows 11/Android interaction and AI narrative review remain separate pending acceptance, not synthetic PASS rows. No owner retest request is part of this audit.
