# EARTH — Master Plan

- Code: projects/earth.html — single-file, mobile-first HTML app
- Purpose / features: TBD (not yet defined)
- This file: sole authority for plan, tasks, bugs

---

## 0. TURN/STAGE LEDGER

| Date | Turn | Did | Status |
|---|---|---|---|
| 2026-09-23 | T0 bootstrap | Created plan; seeded known facts; all else TBD | Done |

---

## 1. RELEASES

| # | Goal | Status |
|---|---|---|
| R1 | First working version of the app (scope TBD) | Open |

---

## 2. RELEASE R1 — name TBD

**Scope**
- In: TBD
- Out: TBD

**Build gates** (verify on a real phone)
- Loads in a mobile browser with no errors
- All diagnostics visible in-app
- More gates TBD once scope is set

**Backlog (deferred)**
- —

---

## 3. FUTURE IDEAS

- — (parking lot, unscheduled)

---

## 4. IMMUTABLE WORKING RULES

1. Mobile-first: design and test for phones first.
2. All diagnostics in-app — never DevTools/console-only.
3. Update this plan before touching code.
4. Read-back verification after every push.
5. No stubs, no fake data — it works or it isn't shown.

---

## 5. DECISION LOG

| Date | Decision |
|---|---|
| 2026-09-23 | Project bootstrapped: code = projects/earth.html (single-file mobile-first HTML app); this plan is sole authority. |

---

## 6. APPENDIX — Authority order

1. This plan (projects/earth.md) is the sole authority.
2. Chat history loses to the plan — always.
3. Every build session: read this plan first; append a ledger row before touching code.