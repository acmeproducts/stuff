# Market Navigator chart-surface release retry â€” October 10

Owner rejection of 86e3aff remains authoritative. The plan and Graveyard were updated before chart implementation. The additional d09430c close-button failure found on the public custom page is also preserved; it is not an accepted release.

Candidate source: `2114b608977d8a1399e02a345f253ac83317e4b8`. Chart correction commit: `5a18827309ea83fbdacf6b2d064f2898cb2706d0`. Integration retains current main and the active publisher without rewriting either history. It copies only the 410 intended Market Navigator changes, removes no files, and preserves the live workflow from main.

The local and public immutable Turn 28 baseline matched blob `9ce7f67451f9e1b7804927ce5c56adb667614724` from commit `996e9a71b72db5bfbea3ba77750077daaa2fb7ab`. The source baseline was correct; its inherited interaction needed to change to the owner's explicit requirement.

Visible changes:
- A direct hit on a rendered line or step selects and emphasizes that series in NOW, Analyze and custom charts, publishes focus once and carries the native-axis selection into Y1+Y2. It does not open the information card.
- Inspection shows native cadence, actual observation/reference date, cursor date for steps, held-value explanation, native/indexed values, normalization reference and sampling density when applicable. The native monthly/weekly steps remain; data is not smoothed or invented.
- Owned custom surfaces follow requested canvas widths, preserve both footer controls, fit narrow parents and contain inspection. The inspection body permits underlying line clicks; only X owns close-button pointer handling.

[Full rebuild qualification](https://github.com/acmeproducts/stuff/actions/runs/38089383639) and [data assurance qualification](https://github.com/acmeproducts/stuff/actions/runs/38089383676) must pass for this source. Qualification covers independent baseline comparisons, roots/horizons, 560 value/coordinate cases, lifecycle/state isolation, data repair and the focused new owner regressions. Browser matrix: Chrome/Edge at 1440Ã—900 and 1887Ã—800, plus 800Ã—1280 and 412Ã—915 touch/viewport emulation. Actual Windows 11 and Android are not qualified by these tests.

Hosted data independently verified at 21:40 UTC: all 290 delivered files, all 39 datasets, stored/source replay and frozen index mathematics. The disclosed state remains verified-with-limitations: three source omissions and 16 retained histories, zero datasets needing attention. The existing 20-minute recovery/five-minute source-failure retry policy continues. The preceding publisher's collection/publication succeeded while its delivery check encountered HTTP 503 downloading a proof file; local independent hosted replay subsequently passed. This is not presented as an all-green publisher run.

Public delivery and browser results will be appended only after verification. Real-device owner acceptance and actual provider AI prose review remain pending. The default production alias is not promoted and PR 856 is not merged.

Owner test checklist: [MARKET-NAVIGATOR-OWNER-TEST-GATES-SURFACE.md](MARKET-NAVIGATOR-OWNER-TEST-GATES-SURFACE.md).

## Verified public delivery

Chart-only publication commit `a7313349f915b96f18a9499d9eadfe69c18b0307` passed [Pages deployment](https://github.com/acmeproducts/stuff/actions/runs/38089671653). Public candidate/custom application bytes, broker and Health script match the qualified local source. Visible QQQ launch, Library parking/restoration, X, Health disclosure persistence and zero-console-error checks passed in Chrome/Edge. All eight custom-surface checks passed, including actual emulated touch input, owned surface widths, footer controls, independent snapshots, inspection and X. Public desktop and phone screenshots were visually reviewed.

The latest hosted generation `46d2dce3aecd26fb2c80` independently passed all 290 file hashes, 39 dataset checks, source replay and index mathematics at 22:01 UTC. [Operational delivery evidence](https://github.com/acmeproducts/stuff/actions/runs/38088341729) also passed its independent delivery step.

- [NOW / Analyze owner candidate](https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-candidate.html?refresh=2114b60)
- [Custom displays owner candidate](https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-custom.html?surface=2114b60)
- [Immutable Turn 28 baseline](https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html)

Full chart and assurance qualification passed for source `2114b608977d8a1399e02a345f253ac83317e4b8`. All 18 handoff gates and the additional direct-selection, native-inspection, close-control and custom-geometry checks are covered by the completed runs and public proof. Final publisher activation `d1226f1e9da5941cd593257988e8c54560c76eb5` pins this exact source, preserving existing cadence and permissions. No owner acceptance is implied by automated PASS.

Final proof files: `surface-release-qualification.json`, `surface-ci-final.json`, `surface-public-qualification.json`, `refresh-public-delivery.json`, `surface-hosted-data-proof-final.json`, and public Chrome desktop/phone screenshots in `market-navigator-rebuild-evidence/`. Previous rejected commits and data generations remain reachable.
