# Chart-only candidate — owner review

**Automated qualification and public delivery passed. Owner real-device acceptance remains pending.** This review changes NOW/Analyze charts against the accepted **September data checkpoint**. It is not a current-market-data release.

| Handoff evidence | Status |
|---|---|
| Candidate SHA-256 | `6c16dc1c0278741bab1b979977b87a8165cc5ce80d278cf65c6e740af6eaaad7` |
| Source commit | `a16a73608cc35ae8f2285891e6cf360bb1fae823` |
| Exact-source CI | [Run 38753782070](https://github.com/acmeproducts/stuff/actions/runs/38753782070) — **PASS** |
| Completed CI artifacts / full matrix | **PASS** — [Complete CI artifact](https://github.com/acmeproducts/stuff/actions/runs/38753782070/artifacts/11982792266) |
| Publication commit / deployment | `0fd1ea1d223ef3643f64cca84f02ce6d3410724a` — [Deployment PASS](https://github.com/acmeproducts/stuff/actions/runs/38807831916) |
| Public byte and browser verification | **PASS** — all 138 served files match; compact crosshair and Analyze lifecycle passed |
| Owner Windows / physical Android acceptance | **PENDING** |

Verified review links:

- [Chart-only candidate](https://acmeproducts.github.io/stuff/market-navigator-chart-only-review/market-navigator-chart-only-candidate.html?chart=6c16dc1c)
- [Accepted comparison](https://acmeproducts.github.io/stuff/market-navigator-chart-only-review/market-navigator-turn28-post-ship.html)

Compare both on the same device, browser, orientation and display settings. A URL query is not proof that the new bytes have been deployed.

## What data is shown

The fixture preserves accepted commit `996e9a71b72db5bfbea3ba77750077daaa2fb7ab`, including HTML blob `9ce7f67451f9e1b7804927ce5c56adb667614724` and its original data. All 136 frozen files were checked against their pinned Git blobs.

The derived chart anchor is **September 22**; native QQQ/WTI histories end **September 25**. Historical Health classifications describe the original collection, not fresh October verification. Original local-date formatting remains: UTC-midnight observations can display the preceding date in Los Angeles, as in the accepted page.

No data recollection, index-history reconstruction, new evaluation calendar or new axes policy is included. The separate review publisher remains disabled.

## Expected visible changes

- NOW and full-page Analyze use the same chart module. **Analyze selected series** is inside NOW's existing **⋯ More** menu; no extra NOW header button is added. Existing explicit Analyze information controls remain.
- Analyze starts with the selected NOW series alone, inheriting the horizon and Fixed/Horizon choice. A sole anchor does not inherit an ineligible dual-axis combination.
- A plotted-series click focuses that series without opening an information card. In ENV, an index click opens that index. The compact date/value crosshair remains.
- Add stays open after adding. Added comparisons show green **Added** with **×** removal; the root anchor remains. Picker About buttons are removed; explicit information gestures outside the picker remain.
- Library parks Analyze; NOW returns to that session. Analyze's **×** destroys it and restores the underlying NOW chart. Original Library records and Library painting remain.
- On screens up to 700 CSS pixels, Analyze reserves room for its **⋯** and **×**, compressing its seven horizon buttons within the existing center grid. NOW's header geometry is unchanged.

Local Android-emulated checks at **412 and 800 pixels** physically tapped all seven Analyze horizons, More and X. All nine centers hit their own controls, with no overlapping button rectangles; NOW geometry matched the accepted page and was restored after X. Fresh Chrome/Edge race checks passed on the hash above. The full eight-profile local and exact-source CI matrices and public delivery checks also passed. Physical-device acceptance remains pending.

## Owner test sequence

Run on the owner's Windows desktop and actual Android phone.

1. Compare ENV **RSK/GRW/MAC** with the accepted page in **5D and 1D**, then the other horizons. All three traces should be present: this fixture has five/five/four points in 5D and two per index in 1D. Compare dates, shapes and axis labels.
2. Move/tap across the traces. Check the compact crosshair and its close control. Normal selection must not open an information card or cover the upper traces with a large disclosure.
3. Open each index, select a component/comparison, then choose **⋯ → Analyze selected series**. Confirm a sole initial anchor, inherited horizon/display and usable full-page controls.
4. In NOW and Analyze, add three comparisons successively. Confirm Add stays open, green Added markers prevent duplicates, and **×** removes the chosen comparison. Check direct line focus and eligible Y1+Y2 behavior.
5. On the phone, tap **all seven Analyze horizons**, then More and X. Confirm 5YR opens its horizon rather than More, and no added control overlaps the horizon row. Repeat in landscape.
6. Change Analyze state, visit Library, then NOW: the same Analyze session should return. Open/close Configuration and resize/rotate. Close Analyze with X: the original NOW chart should return.
7. From a raw-series Analyze session, inspect Data and exports. Print preview must show Analyze, not hidden NOW. Check an existing Library item, interpretation controls and chat refresh. Actual AI-provider prose needs a separate owner check.

## Known inherited phone limitation

At 412 CSS pixels, the accepted page's second footer selector extends beyond its card: measured right edge about **429.6**, versus card edge **407**. This candidate retains that limitation. Matching it is not a claim that phone controls are fully contained. Record whether it blocks use; a repair would be a separate visible change.

Record **accept/reject**, device/browser, root, horizon, display mode and the action sequence for any discrepancy. Acceptance concerns this frozen chart-only revision; it does not approve new market data or restart recurring publication.

## Completed qualification

Chrome and Edge each passed all four viewports: 448 NOW cases, 56 Analyze horizon cases, and 200 open/close cycles in total, with zero unexpected console errors. The 72 Analyze header controls passed 144 center-hit checks before/after 16 actual horizon transitions. The exact old A73 candidate fails the new phone gate and is superseded. Fresh source audit and race proofs match the qualified candidate.

Full identities, source comparisons, inherited limits and public proofs are in MARKET-NAVIGATOR-CHART-ONLY-QUALIFICATION.json. This review does not promote production or restart recovery.
