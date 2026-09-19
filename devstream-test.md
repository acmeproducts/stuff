<<<<<<< SEARCH
| 2026-09-19 | Define | done | Plan created from codebase scan; current phase is Define |
=======
| 2026-09-19 | Define | done | Plan created from codebase scan; current phase is Define |
| 2026-09-19 | Define | in-progress | Owner asked: move dashboard from modal to right panel as in pre-update layout |
>>>>>>> REPLACE

<<<<<<< SEARCH
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
=======
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
- Dashboard displays in a right-hand panel (not a modal) on wider screens; falls back to modal/full-screen on narrow/mobile viewports.
>>>>>>> REPLACE

<<<<<<< SEARCH
**Backlog / deferred**
- GitHub rate-limit handling.
- Worker crash recovery beyond terminate-and-retry.
- Keyboard UX on small screens.
- Search indexing.
=======
**Backlog / deferred**
- GitHub rate-limit handling.
- Worker crash recovery beyond terminate-and-retry.
- Keyboard UX on small screens.
- Search indexing.
- Optional: collapsible right-panel dashboard on desktop.
>>>>>>> REPLACE

<<<<<<< SEARCH
- **2026-09-19** — Chose Define → Design → Build → Ship phase model with explicit owner-controlled advancement.
=======
- **2026-09-19** — Chose Define → Design → Build → Ship phase model with explicit owner-controlled advancement.
- **2026-09-19** — Owner request: restore dashboard to a right-side panel (pre-update layout), keeping modal fallback for mobile.
>>>>>>> REPLACE