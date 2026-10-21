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
| 2026-10-21 | T1 | Owner requested conversion of acmeproducts/detective-board into single-file HTML, images kept separate | ⏸ Superseded |
| 2026-10-21 | T2 | Received repo index.html: Vite + React + TypeScript SPA ("Case Board — Detective Boards"), entry src/main.tsx, theme #060b1f, favicon.svg. src/ never provided | ⏸ Superseded |
| 2026-10-21 | T3 | Owner directed build to proceed without repo source. R1 redefined: original plain-JS implementation of the Case Board concept (NOT a port — no repo code available). Plan updated before code | ✅ Done |
| 2026-10-21 | T4 | Write projects/redboard.html v1 per R1 scope below | ⏳ Next |

---

## 1) RELEASES
| # | Goal (one line) |
|---|-----------------|
| R1 | Build an original single-file "Case Board" detective-board app in plain JS/CSS: draggable note + photo cards, red-string connections, pan/zoom board, dark theme, in-app diagnostics |
| R2 | TBD — polish/follow-ups after R1 works on real phones |

---

## 2) PER-RELEASE DETAIL

### Release 1 — Case Board v1 (original build)
- **Context:** Repo src/ was never provided and can't be retrieved from here; owner directed us to build anyway. This is our own implementation of the detective-board concept, informed only by the repo's shell (title "Case Board", theme #060b1f, favicon.svg).
- **Scope IN:**
  - Full-screen board, dark theme (#060b1f), mobile-first touch
  - Cards: text notes and photo cards (photo via device file picker); drag to move; add/edit/delete
  - Connect mode: tap two cards to link them with a red string; strings redraw live while dragging; tap a string to delete it
  - Pan and pinch-zoom the board
  - Save/load board state in localStorage (photos stored inline as data URLs so the single file stays self-contained)
  - In-app diagnostics panel (load status, card/string counts, save status, last error) — never console-only
  - No stubs, no placeholder/fake content — board starts empty, owner adds real cards
- **Scope OUT:**
  - Claiming any feature parity with the repo (we never saw its code)
  - Backend/sync, accounts, sharing
- **Build gates (verify on real devices):**
  - Loads on a phone browser, no blank screen
  - Add note card, add photo card, drag, connect with string, delete — all via touch
  - Pan/zoom smooth on a phone
  - Reload page → board restored from localStorage
  - Diagnostics panel visible in-app; zero errors reported
  - Read-back verification after the push
- **Backlog (deferred):** TBD after v1 lands

### Release 2
- **Scope IN:** TBD
- **Scope OUT:** TBD
- **Build gates:** TBD
- **Backlog:** TBD

---

## 3) FUTURE IDEAS
*Unscheduled parking lot.*
- True port of acmeproducts/detective-board — only if its src/ code is ever pasted/attached.
- Separate image files on disk (owner's original ask) if the app ever moves to a hosted folder instead of one local file.
- Card colors/types (suspect, evidence, location), string colors, board export as image.

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
| 2026-10-21 | R1 goal initially set: convert acmeproducts/detective-board repo; images separate. |
| 2026-10-21 | Repo confirmed Vite + React + TS SPA from its index.html; src/ unobtainable in this environment. |
| 2026-10-21 | Owner declined to paste src/ and directed build to proceed. R1 redefined as an ORIGINAL plain-JS Case Board implementation (concept only, zero repo code). Photos stored inline (data URLs) to keep the single file self-contained; separate image files parked in Future Ideas. |

---

## 6) APPENDIX
- **Authority order:** (1) this plan → (2) owner's current request → (3) chat history (weakest; loses to the plan).
- **Memory:** This plan is the ONLY memory that persists between runs. Each run reads it first and continues from the ledger.
- **Correction rule:** If this plan ever names a build target other than projects/redboard.html, the plan is wrong — use projects/redboard.html and record the correction here.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-21 01:11 | Main | failed | I couldn't finish that one. Your app is unchanged. |  |
| 2026-10-21 11:00 | Main | built projects/redboard.html | Building the first version of the single‑file Case Board app as defined in the plan. | 6f3481e |
