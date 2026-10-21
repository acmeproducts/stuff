# RedBoard — Master Plan
**Code:** projects/redboard.html (single-file mobile-first HTML app)
**Authority:** This file is the sole authority. Chat history loses to this plan.
**Updated:** 2026-10-21

---

## 0) TURN/STAGE LEDGER
*Every build session appends a row here BEFORE touching code.*

| Date | Turn/Stage | Action | Status |
|------|-----------|--------|--------|
| 2026-10-21 | T0 | Plan created and seeded; all unknowns marked TBD | ✅ Done |
| 2026-10-21 | T1 | Owner requested conversion of acmeproducts/detective-board into single-file HTML, images kept separate | ⏸ Blocked |
| 2026-10-21 | T2 | Received repo index.html: it's a Vite + React + TypeScript SPA ("Case Board — Detective Boards"), entry src/main.tsx, theme #060b1f, favicon.svg. Real app code lives in src/ — not yet provided. Listed exact files needed from owner | ⏸ Awaiting src/ |

---

## 1) RELEASES
| # | Goal (one line) |
|---|-----------------|
| R1 | Convert the "detective-board" (Case Board) React/Vite app into one self-contained mobile-first HTML file (projects/redboard.html), images kept as separate files |
| R2 | TBD — polish/follow-ups after R1 works on real phones |

---

## 2) PER-RELEASE DETAIL

### Release 1 — Conversion
- **Scope IN:**
  - Port all app logic/markup/styles from the repo's src/ into projects/redboard.html (single file, plain JS — no build step)
  - Images referenced as separate external files; filenames taken from the repo
  - In-app diagnostics panel (never console-only)
- **Scope OUT:**
  - New features beyond the repo's existing behavior
  - Server-side/backend functionality, if any (flag to owner if found)
- **Source received so far:**
  - index.html — shell only: `<div id="root">` + `<script type="module" src="/src/main.tsx">`, title "Case Board — Detective Boards", theme-color #060b1f, favicon.svg
- **Source still needed (paste or attach):**
  1. src/main.tsx (entry)
  2. Every other file in src/ (App component, components, styles, state — whatever exists)
  3. List of image/asset files in public/ or src/assets/ (favicon.svg, board textures, icons)
- **Build gates (verify on real devices):**
  - Loads on a phone browser with no blank screen
  - Every feature that worked in the repo version works via touch
  - Images load from their separate files
  - Diagnostics visible in-app; zero console-only errors
  - Read-back verification after the push
- **Backlog (deferred):** TBD after source review
- **BLOCKER (unchanged):** Only the shell index.html has arrived. Rule 5 forbids inventing a reconstruction of the React app — conversion starts when src/ source arrives.

### Release 2
- **Scope IN:** TBD
- **Scope OUT:** TBD
- **Build gates:** TBD
- **Backlog:** TBD

---

## 3) FUTURE IDEAS
*Unscheduled parking lot.*
- Fallback if repo source never arrives: build a fresh detective board (notes, images, connecting strings) in plain JS — owner may pick this via chip, which overrides the blocker.

---

## 4) IMMUTABLE WORKING RULES
1. Mobile-first: design and test for phone screens first.
2. All diagnostics in-app — never DevTools/console-only.
3. Update plan before code, every time.
4. Read-back verification after every push.
5. No stubs, no placeholders, no fake data — includes not inventing "reconstructions" of source we haven't seen.
6. One file write per response; code path is projects/redboard.html.
7. Preserve existing functionality unless the plan says otherwise.

---

## 5) DECISION LOG
| Date | Decision |
|------|----------|
| 2026-10-21 | Project initialized; code file fixed as projects/redboard.html (single-file mobile-first HTML app). |
| 2026-10-21 | R1 goal set: convert acmeproducts/detective-board repo to single-file HTML; images stay as separate files. Conversion waits for actual source — no guessing. |
| 2026-10-21 | Repo confirmed as Vite + React + TypeScript SPA from its index.html. Port target: plain-JS single file (no build step). Owner asked us to "figure it out" from index.html alone — not possible without guessing, so src/ files requested; owner may instead choose a fresh build. |

---

## 6) APPENDIX
- **Authority order:** (1) this plan → (2) owner's current request → (3) chat history (weakest; loses to the plan).
- **Memory:** This plan is the ONLY memory that persists between runs. Each run reads it first and continues from the ledger.
- **Correction rule:** If this plan ever names a build target other than projects/redboard.html, the plan is wrong — use projects/redboard.html and record the correction here.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-21 01:11 | Main | failed | I couldn't finish that one. Your app is unchanged. |  |
