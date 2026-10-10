# Market Navigator owner test gates — d148664

Candidate: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-candidate.html?chartfix=d148664

Small multiples: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-custom.html?chartfix=d148664

Immutable historical baseline: https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html

Candidate source: d148664668e37c3e18b151e55e02498be4d22e5a. PR: https://github.com/acmeproducts/stuff/pull/856. Full rebuild gates: https://github.com/acmeproducts/stuff/actions/runs/37999918201 (PASS). Assurance gates: https://github.com/acmeproducts/stuff/actions/runs/37999918208 (PASS). Public publication and independent native/index verification: https://github.com/acmeproducts/stuff/actions/runs/38045596276 (PASS). Hosted main and custom displays pass, and their entire application source matches the canonical uploaded build. Proof: market-navigator-rebuild-evidence/owner-chart-review-d148664/publication/.

## Owner acceptance

- [ ] **Data and Health:** QQQ and other available daily series plot the latest completed source session. On weekends that may be Friday; monthly/quarterly dates follow source cadence. Health shows verification, actual source dates, limitations and repair evidence. Open its disclosure, wait at least 35 seconds, and confirm it stays open while verification continues.
- [ ] **1D availability:** Open Analyze for QQQ and select 1D. If only daily observations are available, its legend is dimmed/disabled; no intraday line is invented. Select 5D or YTD and verify the series returns.
- [ ] **Axes and Add:** From Risk, add QQQ and SPY, then use Y1 + Y2 with QQQ selected. QQQ and SPY share the USD scale; Risk uses the indexed axis. Use Indexed 100 to compare relative changes. Add three successive series, confirm each adds once and closes the picker, and remove/re-add without changing unrelated selections. Adding Risk to a native-only QQQ chart adapts automatic axes.
- [ ] **Window and references:** Check 5D, YTD and 1YR. The shared right edge is the latest actual observation among the plotted series; an earlier-ending individual series retains its own earlier date. Fixed/Horizon changes the reference used for indexed values. Native-only values do not change; autoscaling a single curve can preserve its visual shape. Crosshair inspection preserves actual dates and does not open an information card.
- [ ] **Analyze lifecycle:** Launch from a visible NOW control; its sole initial anchor is the chosen series. Add a comparison, change horizon/display, go to Library, type in existing chat, and click NOW. The parked session restores exactly. Library cannot launch or retarget Analyze. Close with X, select a different NOW anchor, and launch again.
- [ ] **Library reports and exports:** Generate one report with the configured AI provider. Plain, Standard and Technical should differ in depth while retaining essential conclusions/dates/caveats. Interpret correlations and their limitations, rather than merely list values. Change levels after a chat response; both sides of chat remain. Listen and Markdown use the selected report variant. Chart information supports Copy and Markdown download. Further reading excludes undated reporting placeholders.
- [ ] **Small multiples:** Change horizon, selection, display and Add in one of the three custom charts. The other two preserve their state. Resize/rotate and check the canvas, axes and controls remain usable. For a shared date, the latest actual plotted observation reaches the shared right axis.

## Qualification matrix

Owner physical-device review: Windows 11 with current Chrome/Edge at 1440×900 and 1887×800; Android/Chrome tablet at 800×1280 and phone at 412×915. Automated installed-browser and touch/viewport emulation results are evidence, not physical-device acceptance. Actual AI-provider prose requires owner review; automated provider transport/facts tests use synthetic responses.

Keep the PR draft until owner acceptance. The default app, immutable baseline, prior snapshots and Library history are preserved. The review publisher runs twice hourly and retains verified source/repair evidence; it does not fabricate source-omitted historical periods.
