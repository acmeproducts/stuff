# Market Navigator — Graveyard

Status: NEGATIVE SPECIFICATION
Updated: 2026-09-12

Historical rejected releases remain evidence only; detailed descriptions are preserved in git history.

## Current retired patterns
- numbered V1/V2/V3/V4/V5 product terminology
- separate Explore analytical mode
- separate Component analytical page/modal
- duplicated-index breadcrumbs such as ENV / GRW / GRW
- default-selected RSK on ENV load
- breadcrumb wrapping or displacement of horizons/menu
- raw-source direction inversion
- synthetic/fallback chart evidence
- duplicate chart/discovery/AI state engines
- clipped mobile Listen controls
- fake MP3 export from browser speech synthesis

## Turn 22 architecture
NOW is one chart workspace with a neutral ENV state and one anchored-index context. The anchored context may be collapsed as `ENV / GRW` or expanded as `ENV / GRW / COMPONENTS`. `COMPONENTS` is a non-clickable state marker.

ENV loads with RSK, GRW and MAC visible normally and no default-selected chip.

In an anchored index context, the anchor series cannot be removed. Its chip has no remove control. Component and comparison chips are removable. Add is always available. In expanded state chip taps select/reference only. Tapping the index breadcrumb collapses to the index-only state. Tapping the sole anchor chip in collapsed state restores the governed component basket. Tapping ENV exits the anchored context.

The useful discovery capability formerly in Explore is consolidated into Add, including full-catalog search, Risk/Growth/Macro/Other grouping, cadence, unit, horizon availability, Health, About/source metadata, and insertion. Adding another derived index as a comparison does not expand that index basket.

The Library Listen strip no longer contains the analysis title. The Library header owns the title. The strip reserves geometry for centered transport controls and compact progress text only.

Browser TTS remains playback-only. Downloadable MP3 remains backlog until a true file-producing TTS provider is introduced.

## Retained analytical rules
Raw/source Indexed 100 is plain relative rebasing; derived-composite direction affects composite construction only. Long-horizon display density remains native for 1D/5D/MTD, weekly for YTD/1YR, and monthly for 3YR/5YR without altering canonical evidence or full-resolution inspection/Data/AI/export.

## Turn 23 retired patterns
- rail-toggle handlers that guess canvas size or rely on fixed delays instead of observing the actual chart container
- NOW layouts that vertically recenter or leave dead top/bottom space when the left rail changes width
- repopulating saved provider secrets into ordinary password fields when Config renders
- local-only custom tickers that bypass canonical evidence, Health, revisions, and Library reproducibility
- selecting a different economic source merely because the user changes chart horizon
- silent symbol/proxy substitution, including treating ambiguous DOW as either Dow Inc. or the Dow Jones Industrial Average without explicit identity resolution
- treating price, total return, index level, and NAV as interchangeable measurements
- fabricated intraday points for daily/NAV-only sources
