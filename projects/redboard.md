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
| 2026-10-21 | T1 | Owner requested conversion of GitHub repo "detective-board" (acmeproducts/detective-board) into single-file HTML standard, images kept as separate files. Source code not provided in-session — blocked pending paste/attachment of repo files | ⏸ Blocked |

---

## 1) RELEASES
| # | Goal (one line) |
|---|-----------------|
| R1 | Convert the "detective-board" web project into one self-contained mobile-first HTML file (projects/redboard.html), with image files kept separate |
| R2 | TBD — polish/follow-ups after R1 works on real phones |

---

## 2) PER-RELEASE DETAIL

### Release 1 — Conversion
- **Scope IN:**
  - Port all app logic/markup/styles from the detective-board repo into projects/redboard.html (single file)
  - Reference images as separate external files (not inlined); exact filenames taken from the repo
  - In-app diagnostics panel (never console-only)
- **Scope OUT:**
  - New features beyond the repo's existing behavior
  - Server-side/backend functionality, if any (flag to owner if found)
- **Build gates (verify on real devices):**
  - Loads on a phone browser with no blank screen
  - Every feature that worked in the repo version works via touch
  - Images load from their separate files (paths documented in-app or in plan)
  - Diagnostics visible in-app; zero console-only errors
  - Read-back verification after the push
- **Backlog (deferred):** TBD after source review
- **BLOCKER:** Repo source not yet provided. Owner must paste/attach the repo's files (HTML/JS/CSS + image list). No stubs or guessed reconstructions allowed (Rule 5), so conversion cannot start until real source arrives.

### Release 2
- **Scope IN:** TBD
- **Scope OUT:** TBD
- **Build gates:** TBD
- **Backlog:** TBD

---

## 3) FUTURE IDEAS
*Unscheduled parking lot.*
- TBD (owner ideas welcome once R1 scope is clear)

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

---

## 6) APPENDIX
- **Authority order:** (1) this plan → (2) owner's current request → (3) chat history (weakest; loses to the plan).
- **Memory:** This plan is the ONLY memory that persists between runs. Each run reads it first and continues from the ledger.
- **Correction rule:** If this plan ever names a build target other than projects/redboard.html, the plan is wrong — use projects/redboard.html and record the correction here.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-21 01:11 | Main | failed | I couldn't finish that one. Your app is unchanged. |  |
