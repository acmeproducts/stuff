# test-product — Master Plan

Sole authority for this project. Chat history loses to this file. Read this first every run.

## 0. TURN/STAGE LEDGER

Every build session appends a row here BEFORE touching code.

| Date | Turn/Stage | What happened | Status |
|---|---|---|---|
| 2026-09-27 | T0 — Plan init | Created master plan; seeded known facts; all else TBD | Done |

## 1. RELEASES

| # | Name | One-line goal |
|---|---|---|
| R1 | TBD | First playable version of the app (concept TBD by owner) |

## 2. RELEASE DETAIL

### R1 — TBD
- **Goal:** Working first version of projects/test-product.html, whatever the owner defines.
- **Scope IN:** TBD
- **Scope OUT:** TBD
- **Build gates (verify on real devices):**
  - Opens and runs on a phone browser with no blank screen or dead buttons.
  - Every control does something visible — no stubs, no fake data.
  - Any problem is reported inside the app itself (never DevTools/console only).
  - Additional gates TBD once scope is set.
- **Backlog (deferred from R1):** TBD

## 3. FUTURE IDEAS

Unscheduled parking lot. Nothing here is promised.
- (empty)

## 4. IMMUTABLE WORKING RULES

1. Mobile-first: design and test for a phone screen first, desktop second.
2. All diagnostics in-app: errors and status shown on screen, never DevTools/console only.
3. Update plan before code: this file changes first, code second, every time.
4. Read-back verification after every push: re-read what was written and confirm it matches intent.
5. No stubs or fake data: everything on screen works with real logic.
6. One file write per response; code lives at projects/test-product.html unless the owner says otherwise.

## 5. DECISION LOG

| Date | Decision | By |
|---|---|---|
| 2026-09-27 | Plan structure adopted (ledger → releases → detail → ideas → rules → decisions → appendix) | Owner |

## 6. APPENDIX

**Authority order (highest wins):**
1. This plan file (projects/test-product.md) — sole authority for goals, open tasks, backlog, bugs.
2. Owner's latest explicit instruction in the current request.
3. Referenced file contents provided by the owner.
4. Chat history — partial or missing; loses to all of the above.

**Known facts:**
- Code file: projects/test-product.html — single-file, mobile-first HTML app. Content not yet created/reviewed.
- App concept, audience, and features: TBD.