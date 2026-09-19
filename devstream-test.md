# devstream-test.md

Master plan for `devstream-test.html`.  
This plan is the sole authority for the project. Chat history is partial and loses to this document.

---

## (0) TURN/STAGE LEDGER

| Date | Stage | Status | Notes |
|---|---|---|---|
| 2026-09-19 | Define | done | Plan created from codebase scan; current phase is Define |

Every future build session appends a row here **before** touching code.

---

## (1) RELEASES

1. **R1 — MVP devstream client**  
   Single-file mobile HTML app that can create GitHub-backed projects, chat with an agent, and write the CODE/PLAN files end-to-end.

2. **R2 — Resilience & polish**  
   Stable settings validation, engine fallback, safe concurrent builds, and a smooth phone UX.

3. **R3 — Scale & collaboration**  
   Multiple active builds, team-shared state, richer dashboard, and notification hooks.

---

## (2) PER-RELEASE DETAIL

### R1 — MVP devstream client

**Scope — in**
- GitHub PAT/repo/branch configuration persisted in `localStorage`.
- Project + thread model backed by `devstream/devstream-status.json`.
- Omni file picker for new projects (`gg-style` filter against repo tree).
- Thread chat with user/agent messages stored per thread in `devstream/threads/`.
- Agent dispatch via worker pool (Venice, OpenRouter, Anthropic Direct).
- Whole-file and PATCH-mode writes to CODE and PLAN files.
- Attachment upload (images/text) to `devstream/attachments/`.
- Dashboard, recycle bin, debug console, and appearance settings.

**Scope — out (for R1)**
- Real-time collaboration / locking.
- Native app or service-worker offline support.
- Automatic test execution / CI integration.

**Build gates**
1. Create a project on a phone → repo tree appears, plan file is created.
2. Send a message → agent replies, writes either `devstream-test.html` or `devstream-test.md`.
3. Refresh browser → previous projects/threads reload from GitHub.
4. Engine picker validates and persists per-thread model.

**Backlog / deferred**
- GitHub rate-limit handling.
- Worker crash recovery beyond terminate-and-retry.
- Keyboard UX on small screens.
- Search indexing.

### R2 — Resilience & polish

**Scope — in**
- Robust PAT/key validation with clear in-app error messages.
- Retry/backoff for 409 conflicts and transient network failures.
- Stall detection and manual reset for long-running workers.
- Improved mobile sidebar, tab overflow, and touch targets.
- Model-cap cache (`ds_model_caps`) kept accurate.

**Scope — out**
- Multi-repo support.
- Push notifications.

**Build gates**
1. Provoke a 409 → app retries and succeeds without data loss.
2. Kill a long build → thread shows “stalled” and can be reset.
3. Use on iOS Safari → no layout breakage, composer stays usable.

**Backlog**
- Offline queue.
- Background sync.
- Automated model-cap refresh.

### R3 — Scale & collaboration

**Scope — in**
- Concurrent build queue visibility.
- Per-project notes and phase transitions (Define → Design → Build → Ship).
- Read-back verification after every push.
- Richer dashboard filters/sorts and export.

**Scope — out**
- Billing / usage metering.
- Non-GitHub backends.

**Build gates**
1. Two threads building simultaneously → queue shows both, no SHA collisions.
2. Advance project phase → agent logs it in the plan ledger.
3. Export plan as markdown or print-friendly view.

**Backlog**
- Slack/email notifications.
- Branch-per-project isolation.

---

## (3) FUTURE IDEAS

- Desktop / tablet responsive layout.
- Progressive Web App with offline composer queue.
- Voice memo attachments transcribed to text.
- Inline diff preview before committing.
- Plugin model for custom build agents.
- GitHub Issues ↔ plan backlog sync.
- Usage budgets per API key.

---

## (4) IMMUTABLE WORKING RULES

1. **Mobile-first.** All features must be usable on a 375 px-wide phone.
2. **All diagnostics in-app.** Never rely on browser DevTools; use the debug panel and toasts.
3. **Update-plan-before-code.** Every code change is preceded by a plan update and a ledger row.
4. **Read-back verification.** After each push, reload and confirm the file matches intent.
5. **No stubs or fake data.** If a feature can’t be real, it goes to the backlog.
6. **Single source of truth.** GitHub `devstream-status.json` + thread files are canonical; `localStorage` only holds keys and UI prefs.
7. **One file write per response.** The agent emits at most one `TARGET` file per turn.

---

## (5) DECISION LOG

- **2026-09-19** — Chose a single-file `devstream-test.html` architecture for zero-build deployment to GitHub Pages.
- **2026-09-19** — Chose GitHub as the backend: repo contents for files, `devstream-status.json` for index, and `devstream/threads/*.json` for chat history.
- **2026-09-19** — Chose `localStorage` for API keys only; model preferences sync via the status JSON.
- **2026-09-19** — Chose a 4-worker blob pool for agent calls to keep the UI responsive.
- **2026-09-19** — Chose PATCH mode when estimated output tokens exceed ~85 % of model cap; whole-file rewrite otherwise.
- **2026-09-19** — Chose Define → Design → Build → Ship phase model with explicit owner-controlled advancement.

---

## (6) APPENDIX: AUTHORITY ORDER

1. This plan (`devstream-test.md`).
2. The ledger row for the current run.
3. The current CODE file (`devstream-test.html`).
4. Chat history (least reliable; may be truncated).