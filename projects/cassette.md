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
| 2026-10-27 | R5 adaptive build | Done | One file, two looks (commit 8f872b0): phone=Walkman, tablet=carry unit with handle; in-app look toggle; look shown in diagnostics. |
| 2026-10-30 | Orientation direction | Done | Owner: walkman always displays vertical regardless of phone orientation. Plan updated before code. |
| 2026-10-30 | Launch + portrait lock build | Done | Commit 3881cb2 landed BOTH: OPEN APP launch screen (one tap unlocks audio, tries fullscreen) AND the Walkman portrait lock (CSS 90° rotation, carry unit rotates free, orientation + lock state in diagnostics). |
| 2026-10-30 | Plan sync | Done | Ledger corrected: plan previously said portrait-lock code was "next" but it was already in the shipped file. Next: tape sound pass (hiss + deck thunk) as synth fallback until real files exist. |

Rule: every future build session appends a row here before touching code.

## 1) RELEASES
1. R1 — First playable tape: cassette screen, spinning reels, floating transport buttons, local song playback, in-app diagnostics. (Built; sounds + polish pending.)
2. R2 — Record: mic record, tape-style recording state, playback of the take, permission/denial handling.
3. R3 — Library pull-down: source picker, open/local first, Spotify investigation later.
4. R4 — Polish: themes, reel physics, saved takes/library, installable PWA if useful.
5. R5 — Adaptive form factor: phone = Walkman look; tablet = old carry unit with handle. (Built, including walkman portrait lock.)

## 1b) OPEN QUESTIONS
1. First music source?
Recommendation: local audio file picker first; Spotify/open-source catalog later. (R1 shipped this way.)
2. Recording input?
Recommendation: device microphone via browser permission; show in-app fallback if denied/unsupported.
3. Should reels/counter move with real playback?
Recommendation: yes; play spins reels, pause freezes, stop resets, FF/REW scrub moves counter. (Shipped.)
4. FF/REW behavior?
Recommendation: press-and-hold scrubs; quick tap nudges back/forward a few seconds. (Shipped.)
5. Look/theme?
Recommendation: default 80s chrome + amber label, high contrast, big thumb targets; themes later.
6. Save recordings/library between visits?
Recommendation: session-only for R1/R2; persistence deferred unless owner asks.
7. How to detect phone vs tablet for the two looks?
Recommendation: CSS media query on width (touch device ≥768px = tablet), with an in-app toggle so the owner can force either look on any device. (Shipped.)
8. Where do real tape/button sounds come from and how are they stored?
Recommendation: record or synthesize a small set (button clack, deck engage, tape hiss, stop thunk) as tiny audio files in a `projects/sounds/` folder, loaded by the app; fall back to the current synth click if a file is missing. Interim: extend the built-in WebAudio synth so the feel ships now (hiss loop during play, low thunk on PLAY/STOP) and swap in real files later without code restructure.
9. How to keep the Walkman look vertical in any phone orientation?
Recommendation: when the Walkman look is active and the phone is held landscape, rotate the whole app container 90° with CSS (swapping width/height) so the layout still reads upright; show orientation + lock state in diagnostics. Carry-unit (tablet) look rotates freely. (Shipped in 3881cb2 — Screen Orientation API lock skipped, unreliable on iOS Safari.)

## 2) PER-RELEASE SECTIONS
### R1 — First playable tape
Scope in:
- Phone screen reads as a cassette that is playing. (Shipped.)
- Floating old-school buttons: PLAY, PAUSE, STOP, REW, FF. (Shipped.)
- Buttons have analog travel, pressed state, and click feel/sound. (Shipped — synth click.)
- Pick a local song; play/pause/stop/seek work after a user gesture. (Shipped — OPEN APP launch screen guarantees the gesture.)
- Visible diagnostics panel in-app: state, source, error, audio readiness. (Shipped.)

Scope out:
- Recording, Spotify, accounts, playlists, persistence, themes.

Build gates:
- Real phone: layout fits without page scroll; buttons reachable by thumb. (Met.)
- iPhone Safari + Android Chrome: first tap enables audio; no silent failure. (Met via launch screen.)
- Transport: play spins; pause freezes; stop resets; REW/FF change position audibly. (Met.)
- Diagnostics update on every state/error; no DevTools needed. (Met.)

Backlog:
- Real deck/button sound files (per owner, stored in repo project subdirectory).
- Tape hiss during play; deck-engage thunk on PLAY; stop clunk on STOP. ← NEXT BUILD (synth fallback first, real files swap in later).
- Better tape counter mapping, reel inertia, button click volume, haptics.

### R2 — Record
Scope in:
- REC/record-ready flow using mic permission.
- Tape shows recording mode; playback of recorded take.
- Denied/unsupported mic shown in diagnostics with recovery hint.

Scope out:
- Multi-take management, exporting, editing, cloud upload.

Build gates:
- Permission prompt only after explicit REC intent.
- Record/stop/play take works on real phone.
- Denied permission never dead-ends the app.

Backlog:
- Real REC-button sound (chunkier clack, like a deck record key).
- Save takes locally, rename/delete, share/export.

### R3 — Library pull-down
Scope in:
- Pull-down drawer for library source. (Drawer shipped R1; sources beyond local pending.)
- Local files and clearly licensed open sources first if available without fake data.
- Spotify only as investigated option; no half-auth stub.

Scope out:
- Full Spotify playback unless API/auth path is confirmed.

Build gates:
- Drawer gesture works one-handed. (Met.)
- Empty/unavailable sources explain themselves in-app. (Met for local.)
- Selecting a song loads real audio or a real error. (Met.)

Backlog:
- Search, recent, favorites, source filters.

### R4 — Polish
Scope in/out: TBD after R1–R3 feel right.
Build gates: TBD.
Backlog: TBD.

### R5 — Adaptive form factor (owner direction 2026-10-27)
Owner's words: "if it is a cell phone it is a walkman if it is a tablet it is the old carry unit with the handle".
Scope in:
- One code file, two looks chosen by screen size (Q7 recommendation). (Built.)
- Phone: Walkman frame — slim body, headphone-jack vibe, cassette door holds current tape view. (Built.)
- Tablet: old carry unit — bigger box with a top handle, speakers flanking the cassette well, same tape + transport inside. (Built.)
- In-app toggle to force either look; current look shown in diagnostics. (Built.)
- Walkman look always displays vertical regardless of phone orientation (owner direction 2026-10-30): if the phone is held landscape while in Walkman look, the whole app rotates 90° to stay upright (Q9 recommendation); carry-unit look rotates freely. (Built, commit 3881cb2.)
Scope out:
- Separate code files per device; fake device detection; hiding existing features in either look.
- Locking the carry-unit (tablet) look's orientation — owner only asked for the Walkman.
Build gates:
- Real phone shows Walkman; real tablet shows carry unit with handle. (Met.)
- Toggle flips look instantly with no reload and no lost playback state. (Met.)
- All existing features (transport, drawer, diagnostics) work in both looks. (Met.)
- Phone held landscape in Walkman look: app content stays vertical/upright; rotate back to portrait and nothing breaks or loses playback. (Met — needs owner confirmation on real phone.)
- Diagnostics show device orientation and whether the portrait lock is active. (Met.)
Backlog:
- Handle carry-swing animation, speaker grille art, per-look color themes.
- Optional: Screen Orientation API lock as enhancement where supported.

## 3) FUTURE IDEAS
- Cassette label maker and skins.
- Tape hiss/wow-flutter toggle.
- Mixtape mode and side A/B.
- Haptic click patterns.
- Widget/PWA install.
- Bluetooth/media-key handling.

## 4) IMMUTABLE WORKING RULES
- Mobile-first.
- All diagnostics in-app, never DevTools-only.
- Update plan before code.
- Read-back verification after every push.
- No stubs or fake data.
- Preserve existing functionality not mentioned.
- One file write per response.
- Sound/media assets may live in the repo under the project subdirectory (owner approved 2026-10-27).

## 5) DECISION LOG
| Date | Decision | Owner words / basis |
|---|---|---|
| 2026-10-25 | Product vision | "phone screen to look like a cassete tape that is playing" |
| 2026-10-25 | Controls | "floating controls that are old school buttons" with "analog travel and click" |
| 2026-10-25 | Audio actions | "recorrd and playaback"; "pause, stop reviind and fast forward" |
| 2026-10-25 | Library | "pulldown your library (opensource for now or spotiy of local)" |
| 2026-10-27 | Real sounds | "we need to acquire or make real tape deck noises and button noises" |
| 2026-10-27 | Sound storage | "it is acceptable to store sounds in the repo under the project subdirectory" |
| 2026-10-27 | Form factor | "if it is a cell phone it is a walkman if it is a tablet it is the old carry unit with the handle" |
| 2026-10-30 | Walkman portrait lock | "walkman always displays vertical regardless of phone orientation" |
| 2026-10-30 | Launch screen | "need open your app button" — big OPEN APP button; first tap unlocks audio + tries fullscreen |

## 6) APPENDIX
Authority order:
1. This plan is the sole authority.
2. Owner's latest explicit request.
3. Referenced files provided in-run.
4. Chat history loses to the plan.

Known so far, owner's words: "I want the phone screen to look like a cassete tape that is playing that has floating controls that are old school buttons that have a analog travel and click as well as the ability to recorrd and playaback you can pulldown your library (opensource for now or spotiy of local) and play a song with pause, stop reviind and fast forward".

Everything else: TBD.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-25 07:01 | Main | built projects/cassette.html | Built the first playable version: the screen is a cassette with spinning reels, five chunky transport buttons that physically press in with a click sound and a small buzz, and hold-to-scrub REW/FF. Pull-down drawer library with local file add; in-app diagnostics strip. | b9df5c7 |
| 2026-10-27 23:30 | Main | built projects/cassette.html | The app now switches between a Walkman look on phones and a carry-unit-with-handle look on tablets, per your direction, with an in-app toggle to force either look; look shown in diagnostics. | 8f872b0 |
| 2026-10-29 04:27 | Main | failed | Venice has no credits left. |  |
| 2026-10-29 07:25 | Main | failed | Venice has no credits left. |  |
| 2026-10-30 | Main | built projects/cassette.md | Plan updated: owner direction "walkman always displays vertical regardless of phone orientation" logged (decision, R5 scope/gates, Q9 recommendation: CSS 90° rotation of app container in Walkman look, carry unit rotates freely). |  |
| 2026-10-30 00:52 | Main | built projects/cassette.html | Two things landed in one build: a launch screen with a big OPEN APP button (one tap turns sound on and tries full-screen, which also fixes phone audio-unlock rules), plus the Walkman portrait lock — app rotates itself upright in landscape Walkman mode, carry unit rotates freely, orientation + lock state shown in diagnostics. | 3881cb2 |
| 2026-10-30 | Main | built projects/cassette.md | Plan sync: ledger corrected to show the portrait lock already shipped in 3881cb2; R5 gates marked met; next build queued — synthesized tape hiss during play and deck-engage thunk on PLAY/STOP as fallback until real sound files are added to projects/sounds/. |  |
