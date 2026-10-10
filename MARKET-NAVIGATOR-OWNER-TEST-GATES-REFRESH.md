# Owner gates: refresh lifecycle recovery

Prior candidate d148664 is owner-rejected by the October 10 phone recording. Automated PASS does not override that rejection.

Candidate: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-candidate.html?refresh=20261010
Custom displays: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-custom.html?refresh=20261010
Baseline: https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html

These URLs qualify the new build only after publication is independently confirmed.

1. Open NOW and select a component. Open its information card and use the visible Analyze control. Analyze should open immediately with its sole selected anchor.
2. Watch the chart during background refresh. No opaque refresh cover or rapid flashing should appear; chart controls remain usable.
3. Add a comparison, change horizon and Fixed/Horizon, then navigate to Library. Keep a draft chat input. NOW restores the same Analyze session; only X closes it.
4. Generate an AI POV and inspect the saved verification provenance. A delayed verification must be described as a historical snapshot with its actual verification timestamp. Test Plain, Standard and Technical separately; actual provider prose is not qualified by synthetic tests.
5. In Health, inspect heartbeat, source verification dates, recovery run and the next recovery window. Open an evidence chevron and keep it open through refresh.
6. Retest the preliminarily accepted small multiples. Module drawing mathematics and the frozen Turn 28 baseline remain unchanged.

Fixed qualification matrix: Chrome/Edge 1440x900 and 1887x800; Android/Chrome 800x1280 and 412x915. Local phone/tablet browser emulation is distinct from real-device acceptance. Owner acceptance remains pending until these checks are performed on the actual devices.

Automated regression injects an expired lease, delayed status response, unchanged generation, hash-corrupt incoming data, temporary outage and a later verified generation. It uses the actual broker and application with synthetic source transport, and checks no unexpected page errors in Chrome and Edge.
