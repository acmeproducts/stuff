# Cassette — Master Plan
Target code: `projects/cassette.html`
Authority: this file only.

## 0) TURN/STAGE LEDGER
| Date | Turn/Stage | Status | Notes |
|---|---|---|---|
| 2026-10-25 | Plan seeded | Done | Owner brief captured; defaults recommended; no code yet. |
| 2026-10-25 | Plan delivered ("tell me") | Done | Full plan written per house standard; awaiting build go-ahead. |
| 2026-10-25 | R1 build | Done | First playable tape built (commit b9df5c7): cassette screen, reels, transport, local files, drawer, in-app diagnostics. |
| 2026-10-27 | Sound direction | Done | Owner: need real tape deck + button noises; approved storing sound files in repo under the project subdirectory. Logged to R1/R2 backlog. |
| 2026-10-27 | Form factor direction | Done | Owner: "if it is a cell phone it is a walkman if it is a tablet it is the old carry unit with the handle". Plan updated before code. |
| 2026-10-27 | R5 adaptive build | Done | One file, two looks (commit 8f872b0): phone=Walkman, tablet=carry unit; in-app look toggle; look shown in diagnostics. |
| 2026-10-30 | Orientation direction | Done | Owner: walkman always displays vertical regardless of phone orientation. Plan updated before code. |
| 2026-10-30 | Launch + portrait lock build | Done | Commit 3881cb2 landed BOTH: OPEN APP launch screen (one tap unlocks audio, tries fullscreen) AND the Walkman portrait lock (CSS 90° rotation, carry unit rotates free, orientation + lock state in diagnostics). |
| 2026-10-30 | Plan sync | Done | Ledger corrected: plan previously said portrait‑lock code was "next" but it was already in the shipped file. Next: tape sound pass (hiss + deck thunk) as synth fallback until real sound files exist. |
| 2026-11-03 | Layout full‑screen fix | Done | Adjusted layout so the cassette player fills the whole screen in portrait and uses full width in landscape. |
| 2026-11-05 | **Add synthetic tape hiss & deck‑engage thunk (fallback)** | **Planned** | Implement WebAudio synthesis: continuous low‑level hiss while playing, short low‑frequency "thunk" on PLAY and STOP actions. Use this as interim audio until real files are added to `projects/sounds/`. |
| 2026-11-05 | **Next build step** | **Planned** | Add the audio synthesis code to `projects/cassette.html` and hook it into the existing transport button handlers. |

## 1) RELEASES
1. R1 — First playable tape: cassette screen, spinning reels, floating transport buttons, local song playback, in-app diagnostics. (Built; sounds + polish pending.)
2. R2 — Record: mic record, tape‑style recording state, playback of the take, permission/denial handling.
3. R3 — Library pull‑down: source picker, open/local first, Spotify investigation later.
4. R4 — Polish: themes, reel physics, saved takes/library, installable PWA if useful.
5. R5 — Adaptive form factor: phone = Walkman look; tablet = old carry unit with handle. (Built, including walkman portrait lock.)

## 1b) OPEN QUESTIONS
1. First music source? → Recommendation: local audio file picker first; Spotify later. (R1 shipped this way.)
2. Recording input? → Recommendation: device microphone via browser permission; fallback UI if denied.
3. Should reels/counter move with real playback? → Yes; play spins reels, pause freezes, stop resets, FF/REW scrub moves counter. (Shipped.)
4. FF/REW behavior? → Press‑and‑hold scrubs; quick tap nudges a few seconds. (Shipped.)
5. Look/theme? → Default 80s chrome + amber label, high contrast, big thumb targets; themes later.
6. Save recordings/library between visits? → Session‑only for R1/R2; persistence deferred.
7. How to detect phone vs tablet for the two looks? → CSS media query on width (≥768px = tablet), with in‑app toggle. (Shipped.)
8. Where do real tape/button sounds come from and how are they stored? → Record or synthesize small files in `projects/sounds/`; load them; fallback to synth click now. (Current task.)
9. How to keep the Walkman look vertical in any phone orientation? → Rotate container 90° with CSS when in Walkman look and device is landscape; carry‑unit rotates freely. (Shipped.)

## 2) PER‑RELEASE SECTIONS
### R1 — First playable tape
- Scope in: phone screen reads as a cassette that is playing. (Shipped.)
- Floating old‑school buttons with analog travel and click. (Shipped – synth click.)
- Local file picker, play/pause/stop/seek after user gesture. (Shipped.)
- Diagnostics panel in‑app. (Shipped.)
- **Backlog:** real deck/button sound files; tape hiss; deck‑engage thunk; better reel inertia; haptics.

### R2 — Record
- Scope in: REC/record‑ready flow using mic permission.
- Tape shows recording mode; playback of recorded take.
- Diagnostics for denied/unsupported mic.
- **Backlog:** real REC‑button sound; save takes locally; export.

### R3 — Library pull‑down
- Scope in: pull‑down drawer for library source.
- Local files first; Spotify later.
- **Backlog:** search, recent, favorites, filters.

### R4 — Polish
- Scope in/out: TBD after R1‑R3 feel right.

### R5 — Adaptive form factor
- Phone: Walkman look; Tablet: carry unit with handle.
- In‑app toggle to force either look.
- Walkman always vertical via CSS rotation; carry‑unit rotates freely.
- **Backlog:** handle swing animation; speaker grille art; per‑look color themes.

## 3) FUTURE IDEAS
- Cassette label maker and skins.
- Tape hiss/wow‑flutter toggle.
- Mixtape mode and side A/B.
- Haptic click patterns.
- Widget/PWA install.
- Bluetooth/media‑key handling.

## 4) IMMUTABLE WORKING RULES
- Mobile‑first.
- All diagnostics in‑app, never DevTools‑only.
- Update plan before code.
- One file write per response.
- Preserve existing functionality not mentioned.

## 5) DECISION LOG
| Date | Decision | Owner words / basis |
|---|---|---|
| 2026-10-25 | Product vision | "phone screen to look like a cassette tape that is playing" |
| 2026-10-25 | Controls | "floating controls that are old school buttons" with "analog travel and click" |
| 2026-10-25 | Audio actions | "record and playback"; "pause, stop, rewind and fast forward" |
| 2026-10-25 | Library | "pull‑down your library (opensource for now or spotify of local)" |
| 2026-10-27 | Real sounds | "we need to acquire or make real tape deck noises and button noises" |
| 2026-10-27 | Sound storage | "acceptable to store sounds in the repo under the project subdirectory" |
| 2026-10-27 | Form factor | "if it is a cell phone it is a walkman if it is a tablet it is the old carry unit with the handle" |
| 2026-10-30 | Walkman portrait lock | "walkman always displays vertical regardless of phone orientation" |
| 2026-10-30 | Launch screen | "need open your app button" — big OPEN APP button; first tap unlocks audio + tries fullscreen |
| 2026-11-05 | Synthetic audio fallback | "implement tape hiss and deck‑engage thunk now; real files later" |

## 6) APPENDIX
Authority order:
1. This plan is the sole authority.
2. Owner's latest explicit request.
3. Referenced files provided in‑run.
4. Chat history loses to the plan.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-11-05 13:01 | Main | built projects/cassette.html | Fixed the JavaScript syntax error and added synthetic tape‑hiss & deck‑engage thunk audio fallback. | 97213e8 |
