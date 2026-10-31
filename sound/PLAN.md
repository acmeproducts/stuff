# Sound of Time — plan and record

Single-file app: `sound/index.html`. Live: https://acmeproducts.github.io/stuff/sound/

## What the owner asked for (own words, condensed)
- "a way to show sound over time" that is "both information and art"; keep the tiled concept piece (1 minute → 100 years) AND add variations.
- Customization is paramount: shape, sound measurement/depiction, size, color. Mobile first.
- Same data, many presentations ("malleable").
- Percentage view as an option; silence hatched; horizon on by default; resolution ladder for drill up/down.
- 20 years of test data so the full range can be used.
- Playback with a timer and tone selection so one can "hear" certain times of day.
- Use: art, and "how was my week / day / that last meeting" — sound = tone/vibe of the moment.

## Build 1 — 2026-10-30
- Data: deterministic generator, 20 tiling years (364-day years, 13 × 4-week months), minute packets aggregated on demand: 10 octave bands, L90/L50/L10/Lmax, entropy, event rate, coverage. Hatching = no data. Future = faint.
- Spans: minute, hour, day, week, month, year, decade, life (horizon = lived + years ahead, default 40).
- Shapes: tiles (nested grid like the concept piece), rows (helicorder), ring, spiral (one turn per group).
- Show: 10 bands, loudness, bed + sparks, vibe (dominant band hue × tonality), coverage.
- Scale: absolute (20–100 dB), relative to own median, percentile within view, share % (time above 50 dB or energy).
- Look: resolution coarser/auto/finer, 5 palettes, 3 backgrounds, cell gap, group gap, ring hole, brightness, band order.
- Sound: play the view over 10 s–3 min as chord / pitch / melody, soft/warm/bright tone, root note, tap-to-hear.
- Summary sheet: typical, loudest, quietest, coverage, very-loud count, dominant band, band bars, a labelled-theory "vibe" sentence. Save view as PNG.
- Diagnostics: status line in-app; `?debug=1` prints tap hit results there.

Open assumptions (owner can override): calendar tiles with 364-day years; seconds are generated not stored; test data only, no microphone yet.

## Verified
- Lab (Playwright, 390×844, DPR 2, touch): all spans × shapes render without errors; tap selects; Open-unit drill works; sheet opens. Not yet verified on the owner's phone.

## Build 2 — 2026-10-30
Owner asked (own words, condensed): glyphs by unit (dots for seconds, squares for minutes, bars for hours, rectangles for months), selectable in config; counts must follow the real calendar; control surface = pull-down drawer from the top with tap-to-pick Span / Shape / Show / Scale; recording with central storage in GitHub under /sound, multiple devices, last update wins, collect on one device and view on another, recording pauses during playback; colours felt random — needs a scheme that clearly shows intensity; simplify.
- Calendar: real months (28–31 days), real years, weeks start Sunday. 364-day tiling year buried.
- Colour: one job, intensity. Five dark→bright ramps (Heat default). Band hue dropped everywhere; "10 bands" now stripes each band on the same ramp. New "Tone" show: warm = low rumble, cool = voices/hiss, brightness = loudness.
- Glyphs: dot / square / bar / fill per cell kind (seconds, minutes, hours, days, weeks+); dot and bar size follow loudness.
- Controls: tap the title → top drawer with Span, Shape, Show, Scale rows → popup pick. Settings sheet keeps Look / Sound / Record / Data.
- Recording: mic → 10 octave bands at 4 frames/s → per-second levels → per-minute packet {L90,L50,L10,Lmax, 10 bands, seconds counted, updatedAt, device}. Stored in IndexedDB; seconds trace kept locally only. Screen wake lock while recording. Playback and tap-to-hear pause recording and resume after.
- Sync: GitHub Contents API with a per-phone fine-grained token (Contents read/write on this repo). Files: sound/data/<deviceId>/<YYYY-MM-DD>.json and sound/data/index.json. Merge per minute by updatedAt (last update wins). Auto-sync every 15 min by default. Commits carry [skip ci].
- Viewer: loads index.json then day files (latest 400 cap) from raw.githubusercontent (no token) or the API (token). Data tab: Test data / Recorded.
Open assumptions (owner can override): token-per-phone rather than a server; seconds not synced; mic dB is phone-relative with a calibration slider (not true SPL); recording needs the tab open — Android may still stop a background tab.

## Verified (build 2)
- Lab (Playwright 390×844, fake mic): all spans × shapes render, drawer/popup picks work, drill one rung, recording produced minute packets into IndexedDB, Recorded source renders them. Sync not exercised in the lab (no token). Not yet verified on the owner's phone.

## Build 2.1 — 2026-10-30
Owner reported: data not collecting correctly; view not correct; taps land only when aimed below-right of the target.
- Taps: the canvas was drawn at the size measured at load; when the phone's viewport changed (URL bar, keyboard), the drawn image was squeezed but taps were measured in screen pixels. Taps are now scaled to the drawn size and the canvas re-measures itself whenever the stage resizes (lab: verified by shrinking the viewport after load, tap on minute 43 selects 12:43).
- Collection: the loop ran on a 250 ms timer, which Android Chrome throttles to once a minute in the background (theory for the owner's symptom; the fix removes the dependency either way). Frames are now driven by the audio clock, with the timer as fallback. The in-progress minute is shown live every 5 s.
- Diagnostics: live panel on the Record tab (raw dBFS, calibration, frames per second by source, gaps, audio state, stored/unsynced counts, last packet, mic settings) and an "Upload diagnostics" button that writes sound/data/<device>/diag.json when a token is set.
Unverified: the owner's phone. "View not correct" is not yet pinned down; the diagnostics exist so the next report carries numbers.

## Build 2.2 — 2026-10-30
Owner asked: collection must run in the background, as a separate tab, preferably floating on Android.
- New sound/rec.html: standalone recorder (same minute packets, same local store, same sync). Installable as its own app (rec.webmanifest, icon.svg). "Float as a small window" streams a live meter canvas into a video and opens Android's picture-in-picture, so a small window with dB, minutes and unsynced count stays on top of other apps. Media-session hook asks Chrome to float automatically when the app is sent to the background (theory: depends on Chrome version).
- Viewer (index.html) links to the recorder, receives each minute live over a same-origin channel, and re-reads the local store whenever it comes back to the front.
Facts: in the lab the recorder produced minute packets, the floating window opened, and the viewer showed the new minutes. Theory: Chrome on Android keeps a tab with an active microphone running in the background and shows a mic notice; not yet confirmed on the owner's phone.
Open assumption: the viewer's own "Start recording here" button stays as a convenience; the recorder page is the intended collector.
