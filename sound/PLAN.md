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

## Build 2.3 — 2026-11-01
Owner reported: the floating window does not survive opening the viewer; requirement is to collect and view at the same time.
Cause (fact): the recorder's "Open the viewer" link replaced the recorder page, ending its recording. Also, Android only shows a floating window while Chrome is in the background, so a second Chrome tab can never sit beside it.
Change: the viewer is now the collector. Record tab has Start recording and Float; recording keeps running while every view is used; the header shows the live dB next to the red dot; the float appears when you leave the app. The page remembers that recording was on and resumes it on reopen (banner "Tap to resume recording" if the browser needs a tap). Installable (app.webmanifest). rec.html stays as a meter-only option and opens the viewer in a new tab.
Lab: recorded while switching span/shape, float opened, auto-resume after reload. Not yet on the owner's phone.

## My Time — build 1 — 2026-11-02 (sound/mytime.html)
Owner asked: all four new shapes, as mytime.html; data persists locally and syncs to GitHub like the original; the zoom runs decades → decade → year → month → day → hour → minute; shapes are not limited to circle and square.
- Same engine as Sound of Time (recording, local store, sync, scales, glyphs, playback) plus four shapes:
  - Hilbert: one square at every scale; any quarter is one contiguous stretch of time; fitted to the used area.
  - Sunburst: up to three inner rings of coarser units (life: decades, years, then weeks); tap an inner wedge to open that unit.
  - Terrain: 3D surface, time across, 10 bands deep, loudness as height; drag to orbit, pinch to zoom; a red live column at the right edge while recording (the sndwiz join).
  - Helix: 3D coil, one turn per group, loud cells pushed outward; drag to orbit.
- Taps select on release so drags orbit without selecting. Terrain buckets to ≤360 columns, so a tap reports the first cell and how many it stands for.
- Settings live under their own key; device id, name and calibration are shared with Sound of Time; the local minute store is shared (same phone, same data).
Lab: all shapes render at day/year/life; helix tap selects; sunburst inner-ring tap drills; terrain shows the live column while recording. Not yet on the owner's phone.
Open assumption: Terrain always uses the 10 bands for height regardless of the Show setting (Show still picks colour elsewhere). Override me if wrong.

## My Time — build 2 — 2026-11-02
Owner said: continue the build-out. Six more shapes, each chosen for what it tells:
- Treemap: real calendar proportions (a 31-day month is wider than February).
- Calendar grid: time-of-day across, days down (year = 24 × 365 hours; decade = days by year; life = weeks by year; day = minutes by hour). Weekly rhythm, fixed-time events and gaps all line up in columns and rows.
- Serpentine: one line snaking back and forth; neighbours stay neighbours.
- Tree rings: one ring per group, thickness by loudness.
- Sphere: groups as latitude, cells as longitude; back side dimmed; drag to spin.
- Torus: groups around the ring, cells around the tube; two cycles on one surface.
Lab: all six render at the spans tested (year, month, decade, life, day) without errors; the year calendar grid is 8,760 cells in 157 ms. Not yet on the owner's phone.

## My Time — build 3 — 2026-11-02
Owner asked: stop separating recording from showing; the small-window scheme doesn't work; three sheets (Listen, View, Configure) on a left rail with a hamburger fixed top-left, rail closes completely; View gets share / print / save as SVG, JPG, PNG, ABC; Configure gets true presets plus custom saves on the device and in the cloud.
- Rail: hamburger top-left → Listen, View, Configure. View section of the rail holds Span/Shape/Show/Scale picks, Now / Zoom out / Summary, and the exports.
- Listen sheet: big live dB, meter, minutes stored, unsynced, last sync, listening time, Start/Stop, Sync, device, calibration, wake lock, auto-sync, token, diagnostics. Listening runs while View and Configure are used; the header keeps the red dot and live dB.
- Exports: Share (system share sheet with the PNG), Print (print-only image), PNG, JPG, SVG (true vector: the same draw code records rects, arcs, paths and text; hatching as a pattern), ABC (the view as a tune: up to 64 notes, louder = higher on a pentatonic scale, rests for unrecorded).
- Presets: 8 built-ins; custom saves keep span, shape, show, scale, colours, glyphs, gaps, horizon; stored on the phone (localStorage) and merged into sound/data/presets.json by name, last update wins; deletions propagate.
- Floating window and auto-float removed from My Time (Sound of Time keeps its version).
Lab: rail/panels work; listening ran while in Configure; preset Year patterns applied; custom preset saved; PNG/JPG/SVG/ABC files downloaded, SVG re-rendered identically. Share and Print cannot be exercised in the lab. Not yet on the owner's phone.

## My Time — build 3.1 — 2026-11-02
Owner reported: the Span/Shape/Show/Scale pick appeared underneath the rail (unusable for navigation); sndwiz not visibly incorporated into Listen and View.
- Picks are now sub-menus that open inline under their row in the rail, one at a time, and close on choice.
- Listen now carries sndwiz's living sheet: a particle grid lifted by the live spectrum (low frequencies on one side, high on the other), beat flashes, orbit and pinch. Idle (mic off) it runs free and dim. This is the "now" end; Terrain in View is the same sheet lifted by stored data, with the red live column at its edge while listening.
Lab: sub-menu selects a span; Listen renders the sheet idle and live with a fake mic. Not yet on the owner's phone.

## My Time — build 3.2 — 2026-11-02
Owner: the living sheet should also be a View shape, since it zooms all the way out and in.
- New shape "Living sheet": rows = groups (hours, months, years…), columns = the cells inside them, height = loudness, breathing ripple and slow turn like sndwiz; when listening the current cell glows red and the ripple swells with the room. Works minute → life; large spans bucket to ≤6,000 points. Drag orbits, pinch zooms, tap selects, double-tap drills. Preset "Living sheet" added.
- Fix: while a shape animates, an open sub-menu was rebuilt every frame and swallowed taps; it now rebuilds only when the selection changes.
Lab: minute/day/year/decade/life render and animate; tap selects a week on the life sheet. Not yet on the owner's phone.

## My Time — build 4 — 2026-11-03
Owner: the original concentric model needs a preset; pinch should traverse lifetime → minute without menus; listening to a view should run in real time (30 s recorded = 30 s heard) with an accelerator ×2…×60 and beyond, relative to the span (a month per second → 5 years in a minute); listen mode must be set-and-forget; the view should show all history building in real time, and be listenable.
- Presets: "Concentric life" (sunburst: decades, years, weeks) first; "The original" (day, tiles, 10 bands) second.
- Pinch = time travel in every shape: spread to open the unit under your fingers one rung at a time (life → decade → year → month → day → hour → minute), squeeze to zoom out; mouse wheel does the same. Camera distance for 3D shapes moved to a slider in Look.
- Playback: Speed in the rail (Real time, ×2, ×10, ×60, ×600, 1 hour/s, 1 day/s, 1 week/s, 1 month/s). The playhead moves through the span at that rate, each cell sounds for its own duration; when it reaches now it switches to live and keeps sounding the live minute while listening continues. Cells past the playhead draw as unbuilt, so the model visibly builds. The status line says how long the current view takes at the chosen speed.
- Listening already set-and-forget: start once, auto-resume on reopen, continues through View and Configure.
Open assumption: in 3D shapes a two-finger pinch now travels time rather than moving the camera; override me if wrong.
Lab: preset applied; pinch ladder in and out verified; playback at 1 hour/s ran to live. Not yet on the owner's phone.

## My Time — build 5 — 2026-11-03
Owner showed sndwiz's radial field (Bass Reactor, 150×150, continuous pinch) as what Listen and the default View should look like.
- Listen: full-screen sndwiz radial field driven by the mic (spectrum lifts columns, level raises amplitude, beats flash), auto-quality 60–150 points per side, drag to orbit, pinch/wheel to zoom; a translucent card at the bottom holds dB, Start/Stop, minutes, unsynced, listening time; settings and diagnostics scroll below.
- View: new default shape "Radial sheet": the same dense field, but rings outward are the groups (hours of a day, months of a year, years of a life), each ring a lap of its cells, height = loudness, ripple animated, unrecorded flat/hatched colour, unlived flat and dim, the current cell's ring swells with the live mic. New palette "Reactor" (the green). Presets: Concentric life (radial), Today radial, flat sunburst kept.
- Pinch in 3D shapes is a continuous camera zoom; closing in past a threshold opens the next rung under your fingers and resets the camera, pulling far zooms a rung out. Wheel does the same. 2D shapes keep the step pinch.
- Playback on the radial sheet grows the surface outward (unbuilt rings flat and dark) and hands the edge to the live mic when it reaches now.
Lab: default day radial, life radial, pinch in (year → month → week) and out, listen field with fake mic, playback build. Not yet on the owner's phone.

## My Time — v2, build 1 — 2026-11-03 (started over on the donor)
Owner: start over and build the core around sndwiz (projects/sndwiz.html). Listening while the sheet undulates is distracting: the visual shows what was picked up, the audio tells the story. A handle must hide the panel completely for a full-screen sensor. Keep it fully configurable like the original.
- sound/mytime.html is now the donor file plus: a Live / History switch at the top of the Controls sheet; History maps the donor grid to the span (Radial: rings outward are the groups, a lap is the cells; Wave/Noise: rows are groups, columns are cells), height = loudness, colour from the donor LUT; Speed is forced to 0 when entering History so nothing undulates (raise it if you want it); the live cell swells with the mic.
- Pinch is the donor camera zoom; in History, pushing in past the near limit opens the next rung under your fingers (life → decade → year → month → day → hour → minute), pulling past the far limit zooms a rung out; Out and Now buttons too. Double-tap resets the camera (donor). Tap a point for its time and level in the status line.
- Listening: the donor's mic path now also writes one packet per minute (local IndexedDB, GitHub sync, auto-sync, token, device name, calibration) and resumes on reopen.
- Play history: the story at Real time, ×2…×600, an hour/day/week/month per second, then live; unbuilt points lie flat and dim while it plays.
- Controls sheet: donor presets (Calm Sea, Storm, Bass Reactor) plus Save-as presets kept on the phone and in the cloud; donor sliders unchanged; Horizon, Years ahead, History scale, Data source; PNG and Share; × on the grab bar hides the sheet completely, ⚙ brings it back.
- Previous build archived as sound/archive-mytime-v1.html (not linked).
Lab: live field, history day/year radial, life wave, pinch rungs in and out, hide/show, listening with fake mic, playback at an hour per second. Not yet on the owner's phone.

## The Time — build 1 — 2026-11-03 (sound/thetime.html, mytime as donor)
Owner: start over again. Left rail: Listen (the sndwiz field, visualised live and captured), View (a self-contained surface, 2D or 3D, that drills by gesture: life → decades → years → months → weeks → days → hours → minutes → seconds; treemap as the core), Config (live/fake data, GitHub token, the rest; colour-scheme presets and preset sizes/shapes of elements matter). Simple and clean; history plus watching seconds arrive at the minute level.
- Listen: donor field full screen with a bottom card (dB, Start/Stop, counts); one packet per minute to the phone and the shared store; provisional minute written every second so the seconds show up live.
- View: treemap of the current node's children. Regular levels use a clean grid (10 years, 12 months, 7 days, 24 hours, 60 minutes, 60 seconds); irregular ones (decades of a life, weeks of a month) are squarified by real duration. Tap a tile to go in, squeeze to come out, ↑ and the breadcrumb jump up. 3D toggle extrudes the tiles by loudness; drag orbits, spread/squeeze zooms the camera and still drills when the pinch runs far enough. The tile containing now is outlined and takes the live level; at the minute level the 60 second tiles fill as they arrive.
- Config: source (heard / fake life + seed), horizon and years ahead, level scale; nine colour schemes with swatches, light background; tile shape (square, rounded, circle, bar), size (fill / by loudness), gap, 3D height, labels; live look (donor presets, mode, resolution, amplitude, point size, speed, use scheme); device, calibration, keep screen on, token, auto-sync, sync, reload, log, reset.
Lab: fake life drills life → decade → year → month → week → day → hour → minute; 3D renders; listening stored a minute with the fake mic. Not yet on the owner's phone.
Cut for now (owner said keep it focused): playback, exports, custom presets. Override me if any should come back now.

## The Time — build 1.1 — 2026-11-04
Owner asked what tile size means; default must be duration.
- Config → Tiles → "Size means": Duration (default; regular levels keep the clean grid), Loudness (perceived, doubles every 10 dB), Time above 65 dB, Recorded time, Distance from my normal. Any choice but Duration lays the level out squarified by that weight, in time order.

## The Time — build 1.2 — 2026-11-04
Owner sent a life screen with circles: empty corners, labels floating outside the discs, one decade black and one cream.
- Circle shape: the disc is now sized by the tile's area and centred, with its label inside; labels pick dark or light text from the fill's brightness; unlived tiles label dim.
- Percentile scale falls back to Absolute when a level has fewer than 8 recorded values (three decades ranked 0 / ½ / 1 was the black-and-cream).

## The Time — build 2 — 2026-11-04
Owner: a classic treemap is squarified; duration is not a size. Keep it straight and simple.
- View is a classic squarified treemap at every level: tile size = sound carried (perceived loudness × duration), colour = typical level, time order kept. Unrecorded and unlived spans are thin slivers so they can still be entered. Shape and size options removed; rounded tiles only.

## The Time — build 2.1 — 2026-11-04
Owner: how to listen; it can't be buried in settings.
- ▶ in the View header plays the tiles on screen in time order (each tile ~0.35–0.7 s, its 10 bands as a chord when recorded, its level otherwise), outlining the playing tile; tap again to stop. Listening pauses while it plays and resumes after.

## The Time — build 2.3 — 2026-11-05
Owner: group tiles in sequence or by colour; replace the up arrow with a toggle (● sequence, ○ colour); applies to 3D and any other view.
- ● / ○ in the View header: sequence keeps time order; colour sorts the level loudest-first so like tiles sit together (classic treemap order). Same layout feeds 2D and 3D. Up is the breadcrumb or a squeeze.

## The Time — build 2.4 — 2026-11-05
Owner: colour order low → high; 3D needs full freedom of rotation.
- By-colour order now runs quiet → loud. 3D orbit is unrestricted on both axes (drag over the top and under the floor).
