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

---

## 1) RELEASES
| # | Goal (one line) |
|---|-----------------|
| R1 | TBD — first playable version of RedBoard |
| R2 | TBD |

---

## 2) PER-RELEASE DETAIL

### Release 1
- **Scope IN:** TBD
- **Scope OUT:** TBD
- **Build gates (verify on real devices):**
  - Loads on a phone browser with no blank screen or console-only errors
  - All core interactions work via touch
  - Diagnostics visible in-app
  - TBD (add feature-specific gates once scope is set)
- **Backlog (deferred):** TBD

### Release 2
- **Scope IN:** TBD
- **Scope OUT:** TBD
- **Build gates:** TBD
- **Backlog:** TBD

---

## 3) FUTURE IDEAS
*Unscheduled parking lot.*
- TBD

---

## 4) IMMUTABLE WORKING RULES
1. Mobile-first: design and test for phone screens first.
2. All diagnostics in-app — never DevTools/console-only.
3. Update plan before code, every time.
4. Read-back verification after every push.
5. No stubs, no placeholders, no fake data.
6. One file write per response; code path is projects/redboard.html.
7. Preserve existing functionality unless the plan says otherwise.

---

## 5) DECISION LOG
| Date | Decision |
|------|----------|
| 2026-10-21 | Project initialized; code file fixed as projects/redboard.html (single-file mobile-first HTML app). |

---

## 6) APPENDIX
- **Authority order:** (1) this plan → (2) owner's current request → (3) chat history (weakest; loses to the plan).
- **Memory:** This plan is the ONLY memory that persists between runs. Each run reads it first and continues from the ledger.
- **Correction rule:** If this plan ever names a build target other than projects/redboard.html, the plan is wrong — use projects/redboard.html and record the correction here.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-21 01:11 | Main | failed | I couldn't finish that one. Your app is unchanged. |  |
