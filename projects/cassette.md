# Cassette — Master Plan
Target code: `projects/cassette.html`
Authority: this file only.

## 0) TURN/STAGE LEDGER
| Date | Turn/Stage | Status | Notes |
|---|---|---|---|
| 2026-10-25 | Plan seeded | Done | Owner brief captured; defaults recommended; no code yet. |
| 2026-10-25 | Plan delivered ("tell me") | Done | Full plan written per house standard; awaiting build go‑ahead. |
| 2026-10-25 | R1 build | Done | First playable tape built (commit b9df5c7): cassette screen, reels, transport, local files, drawer, in‑app diagnostics. |
| 2026-10-27 | Sound direction | Done | Owner: need real tape deck + button noises; approved storing sound files in repo under the project subdirectory. |
| 2026-10-27 | Form factor direction | Done | Owner: "if it is a cell phone it is a walkman if it is a tablet it is the old carry unit with the handle". |
| 2026-10-27 | R5 adaptive build | Done | One file, two looks (commit 8f872b0): phone=Walkman, tablet=carry unit; in‑app look toggle; look shown in diagnostics. |
| 2026-10-30 | Orientation direction | Done | Owner: walkman always displays vertical regardless of phone orientation. |
| 2026-10-30 | Launch + portrait lock build | Done | Commit 3881cb2 landed BOTH: OPEN APP launch screen (one tap unlocks audio, tries fullscreen) AND the Walkman portrait lock (CSS 90° rotation, carry unit rotates free, orientation + lock state in diagnostics). |
| 2026-10-30 | Plan sync | Done | Ledger corrected: plan previously said portrait‑lock code was "next" but it was already in the shipped file. Next: tape sound pass (hiss + deck thunk) as synth fallback until real sound files exist. |
| 2026-11-03 | Layout full‑screen fix | Done | Adjusted layout so the cassette player fills the whole screen in portrait and uses full width in landscape. |
| 2026-11-05 | Add synthetic tape hiss & deck‑engage thunk (fallback) | Done | Implemented WebAudio synthesis and hooked into transport buttons. |
| 2026-11-05 | **Open Questions – Visual Config** | **Planned** | Need detailed specs for three visual modes: (1) Walkman‑style 80s cassette (fixed horizontal in landscape, vertical in portrait), (2) Reel‑to‑reel unit, (3) Full‑screen big cassette that occupies the whole screen with minimal floating controls. |
| 2026-11-05 | **Next build step** | **Planned** | Add a configuration UI (e.g., a toggle or dropdown) to switch between the three visual modes and implement the corresponding CSS/HTML changes. |

## 1) RELEASES
1. R1 — First playable tape (shipped).  
2. R2 — Record (planned).  
3. R3 — Library pull‑down (planned).  
4. R4 — Polish (planned).  
5. R5 — Adaptive form factor (shipped).  
6. R6 — Visual mode selector & refined realism (next).

## 1b) OPEN QUESTIONS
1. **Walkman look** – exact color palette, button style, cassette label design, and whether the cassette should be centered with a small “handle” or fully fill the screen?  
2. **Reel‑to‑reel look** – dimensions, number of reels, visible tape path, any knobs or meters to include?  
3. **Full‑screen cassette** – should the cassette be the only element (no floating controls) with controls hidden behind a tap‑to‑show overlay?  
4. **Animation realism** – how fast should reels spin, should there be wobble, tape flutter, or motor hum?  
5. **Configuration UI** – preferred control (dropdown, segmented button, swipe gesture) and where to place it (e.g., in the drawer, top bar, or a hidden gesture)?  
6. **Branding** – confirm no Sony/Walkman logos, just generic styling.  

## 2) PER‑RELEASE SECTIONS
### R6 — Visual mode selector & realism
- Add UI to choose between Walkman, Reel‑to‑Reel, Full‑Screen Cassette.  
- Implement distinct CSS for each mode, respecting orientation lock rules.  
- Add realistic animations (reel spin, tape flutter, motor hum) using CSS and WebAudio.  
- Ensure controls appear only when needed (e.g., overlay for full‑screen mode).  
- Backlog: fine‑tune sound files, add optional haptic feedback.

## 3) FUTURE IDEAS
- Cassette label editor, skins, wow‑flutter toggle, mixtape side A/B, Bluetooth media‑key support, PWA install, widget.

## 4) IMMUTABLE WORKING RULES
- Mobile‑first, diagnostics in‑app, update plan before code, one file write per response, preserve existing functionality.

## 5) DECISION LOG
| Date | Decision | Owner words / basis |
|---|---|---|
| 2026-10-27 | Form factor | "if it is a cell phone it is a walkman if it is a tablet it is the old carry unit with the handle" |
| 2026-10-30 | Walkman portrait lock | "walkman always displays vertical regardless of phone orientation" |
| 2026-11-05 | Synthetic audio fallback | "implement tape hiss and deck‑engage thunk now; real files later" |
| 2026-11-05 | Visual mode question | Owner asked for realistic 80s cassette look and multiple configurations |

## 6) APPENDIX
Authority order: 1) This plan, 2) Owner’s latest explicit request, 3) Referenced files, 4) Chat history.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-11-05 13:01 | Main | built projects/cassette.html | Fixed JS syntax error, added synthetic hiss & thunk. | 97213e8 |
| 2026-11-05 16:18 | Main | failed | Could not finish; app unchanged. |  |
