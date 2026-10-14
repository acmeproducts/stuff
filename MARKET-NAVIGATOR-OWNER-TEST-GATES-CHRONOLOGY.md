# Owner checks for the chronology recovery review

Release status: ready for owner testing. Qualified candidate source: e795069f60e699754aeaaa88890fab85624c2256. Full qualification: https://github.com/acmeproducts/stuff/actions/runs/38533880132 . Live recovery and delivery gates: https://github.com/acmeproducts/stuff/actions/runs/38536625897 . The latter remains running while its normal 20-minute relay wait holds the next recovery.

These are physical-device acceptance checks; automated layouts used installed Windows 10 browsers and Windows CI. Tablet/phone layouts are emulation. Windows 11 and real Android acceptance remain pending.

Review candidate: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-candidate.html

Custom displays: https://acmeproducts.github.io/stuff/market-navigator-step-zero-review/market-navigator-rebuild-custom.html

Immutable comparison baseline: https://acmeproducts.github.io/stuff/market-navigator-turn28-post-ship.html

1. Open Health. Check all 39 enabled native datasets and RSK/GRW/MAC assurance.
   Expand QQQ and WTI: inspect actual observation date, source verification time,
   missing periods and repair evidence. At the October 14 pre-open review, daily
   market data should end October 13. Monthly/weekly series follow their actual
   release cadence; collection time must not become an observation date.
2. Open Growth in NOW and inspect QQQ/WTI in 5D and YTD. Their October 13 native
   observations must be present. Index endpoints must use verified native periods,
   rather than extend to October 14 merely because the worker ran that day.
3. Select a series by clicking its drawn line. Focus should visibly follow the
   clicked series without opening an information card. Use the crosshair to inspect
   actual value, native observation date, cadence and any held observation.
4. Compare Fixed and Horizon using a volatile daily series over different windows.
   Check the stated reference date/value. Use 1D with a series lacking intraday
   data: unavailable series should dim and explain availability, without invented
   intraday points. Low-frequency steps must correspond to actual source periods.
5. Launch Analyze from NOW. It starts with the selected anchor alone. Add WTI and
   two other comparisons: the picker stays open, added series show green Added
   chips, repeat selection does not duplicate, and comparison X removes a series.
6. Go to Library, use an existing report/chat, and return via NOW. The parked
   Analyze session must restore unchanged. Library must not launch or retarget
   Analyze. Analyze X returns to normal NOW and allows a different anchor.
7. Inspect the three custom chart sizes. Plot geometry, right-axis labels and
   crosshair content should fit the intended surface. Change one chart's horizon,
   series or axes and confirm the other charts remain unchanged.
8. Save an AI POV with a known scope. Compare Plain/Standard/Technical, verify
   scope and actual date range, and check that explanations describe those frozen
   inputs. Copy/download should work for raw-series explanations as well as indices.

Use Windows 11 Chrome/Edge at 1440×900 and 1887×800, and real Android Chrome at
800×1280 and 412×915. Record the URL, browser/device, action and result. Owner
rejection overrides automated PASS; no production promotion is authorized by
these automated proofs alone.
