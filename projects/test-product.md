# test-product — Master Plan

Sole authority for this project. Chat history loses to this file. Read this first every run.

## 0. TURN/STAGE LEDGER

Every build session appends a row here BEFORE touching code.

| Date | Turn/Stage | What happened | Status |
|---|---|---|---|
| 2026-09-27 | T0 — Plan init | Created master plan; seeded known facts; all else TBD | Done |
| 2026-10-25 | T1 — Analysis request | Owner asked to audit https://acmeproducts.github.io/dev/particle.html as candidate baseline (works well / needs work / eliminate / add). Search results did not include the file's contents; cannot fetch it directly. Awaiting owner to paste source. | Blocked — need source |

## 1. RELEASES

| # | Name | One-line goal |
|---|---|---|
| R1 | TBD — particle-based app (likely) | Audit particle.html, then build a compelling mobile-first version in projects/test-product.html |

## 2. RELEASE DETAIL

### R1 — TBD (pending particle.html audit)
- **Goal:** Turn the owner's particle.html into (or replace it with) a compelling single-file mobile-first app at projects/test-product.html.
- **Scope IN:**
  - Four-part capability audit of particle.html: works well / needs work to keep / eliminate / add to be compelling.
  - First playable build informed by that audit.
- **Scope OUT:** TBD once audit lands.
- **Build gates (verify on real devices):**
  - Opens and runs on a phone browser with no blank screen or dead buttons.
  - Every control does something visible — no stubs, no fake data.
  - Any problem is reported inside the app itself (never DevTools/console only).
  - Additional gates TBD once scope is set.
- **Backlog (deferred from R1):** TBD

### Open items (top priority first)
1. **BLOCKER:** Obtain particle.html source — owner pastes the code or provides a referenced-file block. Search results confirmed repo acmeproducts/dev exists but contained no file contents.
2. Run the four-part audit once source is in hand; record findings under R1.
3. Set R1 scope and final gates from audit results.

## 3. FUTURE IDEAS

Unscheduled parking lot. Nothing here is promised.
- Particle playground variant (if audit shows the original is too thin to salvage): touch-driven particles, presets, in-app stats.

## 4. IMMUTABLE WORKING RULES

1. Mobile-first: design and test for a phone screen first, desktop second.
2. All diagnostics in-app: errors and status shown on screen, never DevTools/console only.
3. Update plan before code: this file changes first, code second, every time.
4. Read-back verification after every push: re-read what was written and confirm it matches intent.
5. No stubs or fake data: everything on screen works with real logic.
6. One file write per response; code lives at projects/test-product.html unless the owner says otherwise.
7. Never fabricate analysis of a file whose contents were not provided; ask for the source instead.

## 5. DECISION LOG

| Date | Decision | By |
|---|---|---|
| 2026-09-27 | Plan structure adopted (ledger → releases → detail → ideas → rules → decisions → appendix) | Owner |
| 2026-10-25 | particle.html (acmeproducts/dev repo) chosen as candidate baseline for the app; audit precedes any build | Owner |

## 6. APPENDIX

**Authority order (highest wins):**
1. This plan file (projects/test-product.md) — sole authority for goals, open tasks, backlog, bugs.
2. Owner's latest explicit instruction in the current request.
3. Referenced file contents provided by the owner.
4. Chat history — partial or missing; loses to all of the above.

**Known facts:**
- Code file: projects/test-product.html — single-file, mobile-first HTML app. Not yet created.
- Candidate baseline: https://acmeproducts.github.io/dev/particle.html (repo acmeproducts/dev). Contents not yet provided — audit pending.
- App concept, audience, and features: TBD pending audit.
