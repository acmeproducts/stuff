<<<<<<< SEARCH
| 2026-09-19 | Define | in-progress | Owner asked: move dashboard from modal to right panel as in pre-update layout; also add collapsible soft-delete bin above dashboard card with restore/permanent-delete confirmation |
| 2026-09-20 | Define | in-progress | Owner said "build it"; project remains in Define, so requirements are recorded and code is deferred until Design |
=======
| 2026-09-19 | Define | done | Owner asked: move dashboard from modal to right panel as in pre-update layout; also add collapsible soft-delete bin above dashboard card with restore/permanent-delete confirmation |
| 2026-09-20 | Define → Build | in-progress | Owner clarified workflow: selecting a project auto-opens its first tab; new tabs skip filename prompt and default to the project file; project .md is sole authority |
>>>>>>> REPLACE

<<<<<<< SEARCH
1. **R1 — Layout & deletion hygiene** — Restore pre-update right-panel dashboard, add collapsible soft-delete bin to left rail with restore and permanent-delete confirmation.
=======
1. **R1 — Layout, deletion hygiene & tab workflow** — Restore pre-update right-panel dashboard, add collapsible soft-delete bin to left rail, and simplify project/tab workflow so selecting a project opens its first tab and new tabs no longer ask for a filename.
>>>>>>> REPLACE

<<<<<<< SEARCH
- **Scope in:** right-panel dashboard, collapsible soft-delete bin above dashboard card, restore / permanent-delete with confirmation modal, mobile-first layout.
- **Scope out:** engine changes, multi-file projects, plan editor v2.
- **Build gates:** verify on real phone (iOS Safari / Android Chrome): dashboard visible in right panel, bin expands/collapses, restore works, permanent delete shows modal and removes item, no DevTools-only diagnostics.
- **Backlog / deferred:** dashboard customization, keyboard shortcuts, bulk restore.
=======
- **Scope in:** right-panel dashboard; collapsible soft-delete bin above dashboard card; restore / permanent-delete with confirmation modal; mobile-first layout; selecting a project auto-opens its first tab; new tabs are created without a filename prompt and default to the project's main file; project .md remains the sole authority for plan, tasks/backlog, and bug tracking.
- **Scope out:** engine changes; multi-file projects; plan editor v2; automatic file renaming outside user instruction.
- **Build gates:** verify on real phone (iOS Safari / Android Chrome): dashboard visible in right panel; bin expands/collapses; restore works; permanent delete shows modal and removes item; selecting a project opens first tab; creating a new tab does not prompt for filename; no DevTools-only diagnostics.
- **Backlog / deferred:** dashboard customization; keyboard shortcuts; bulk restore; explicit "move output file" UI if needed later.
>>>>>>> REPLACE

<<<<<<< SEARCH
- **2026-09-19** — Owner request: add a collapsible soft-delete bin above the Dashboard card in the left rail; each deleted project gets Restore and Delete permanently; permanent deletion requires an in-app confirmation modal.
- **2026-09-20** — Owner said "build it"; plan is still in Define, so no code is written. Requirements above must be finalized and a Design section added before the Build phase starts.
=======
- **2026-09-19** — Owner request: add a collapsible soft-delete bin above the Dashboard card in the left rail; each deleted project gets Restore and Delete permanently; permanent deletion requires an in-app confirmation modal.
- **2026-09-20** — Owner said "build it" and clarified workflow: selecting a project on the left rail auto-opens the first tab; new tabs are created without a filename prompt and default to the project's main file; the project .md plan file is the sole authority for plan, tasks/backlog, and bug tracking.
>>>>>>> REPLACE