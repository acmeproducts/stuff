<!-- PROGRAM-PLAN v1.0.0 -->
# PROGRAM (Matrix × Kanban) — MASTER PLAN v1.0.0

**Location:** `program/PROGRAM-PLAN-v1.md` in `acmeproducts/stuff`.
**Canonical application artifact:** `program.html` (repo root, one self-contained HTML file).
**Test link (GitHub Pages, deploys from `main` root):** https://acmeproducts.github.io/stuff/program.html
**Owner:** acmeproducts — sole decision-maker, runs every gate.
**Builder:** Claude — builds, tests, opens/merges PRs, maintains this plan and the graveyard.
**Status:** Baseline shipped (R1–R4 merged). Mobile-first redesign scheduled (R5–R9).

`program.html` fuses two source apps — `kanban.html` (rich card detail) and `mello.html`
(board matrix). A **matrix is a 2-axis flattening of any board/card attribute**; a board can
have many matrices. This document is the single authority for the program.html effort. It does
not govern the separate SOT effort (`project.html` / `project-backlog.md`).

---

## 1 · RELEASES

| # | Release | Feature | Status |
|---|---|---|---|
| R1 | PR #620 | Matrix × kanban fusion: single-tap expand (all fields + attachments), right-click color, transpose, matrices grouped by board, board drill-down CRUD, GitHub-persisted matrices (SoT) | MERGED 2026-08-13 |
| R2 | PR #621 | Cross-card search, lane/card collapse, board import (file/URL) | MERGED 2026-08-13 |
| R3 | PR #622 | Mobile-first row/column drag (Pointer Events) + cross-matrix move/copy | MERGED 2026-08-13 |
| R4 | PR #623 | Touch card drag + edge auto-scroll | MERGED 2026-08-13 |
| R5 | — | Context-aware card + gesture model | Not started — scope §2 |
| R6 | — | Omni search (full-text, filters the matrix) | Not started — scope §3 |
| R7 | — | Matrix axes overhaul (status / tags / dates / eligibility) | Not started — scope §4 |
| R8 | — | Large-matrix sizing (scale-to-fit vs paging) | Not started — scope §5 |
| R9 | — | CSS / dead-code consolidation | Not started — scope §6 |

---

## 2 · RELEASE 5 — CONTEXT-AWARE CARD + GESTURES

| # | Item | Status |
|---|---|---|
| 5.1 | Drag via a visible **handle** (grip), like row/column handles — touch + mouse | Not started |
| 5.2 | **1 tap = read-only preview**; **2 taps = open full modal**; **long-press (mobile) / right-click (desktop) = context menu** (Color, Status, Duplicate, Trash, Open), closes on tap-away | Not started |
| 5.3 | Closed card is context-aware: portrait phone = name + handle + status dot; landscape/larger = title + a few **meaningful** chips (skip empty, e.g. default lineage) + status dot + **last-updated** | Not started |
| 5.4 | Duplicate + Trash live **inside the opened card**, not on the closed card | Not started |
| 5.5 | Touch targets ≥44px; `touch-action` on cards; `env(safe-area-inset-*)` padding | Not started |

---

## 3 · RELEASE 6 — OMNI SEARCH

| # | Item | Status |
|---|---|---|
| 6.1 | One **full-text** filter over **everything** — title, notes, dates, dev/live URLs, tags, attachment names. No field excluded | Not started |
| 6.2 | Omni search **filters the active matrix** (wrap the card list at the `def.z` seam in `drawMatrix`) | Not started |
| 6.3 | Preview-card chips are tappable → **append to the Omni search** | Not started |
| 6.4 | Standalone Search page folds into the single Omni search (reuse `config.searchQuery`) | Not started |

---

## 4 · RELEASE 7 — MATRIX AXES OVERHAUL

| # | Item | Status |
|---|---|---|
| 7.1 | Axis eligibility = **any single-value field** (loosen `AXES` / `validateDefinition`). Excluded: title, notes, attachments/files, dev/live URLs | Not started |
| 7.2 | **Status** axis (stored as color *name* — usable now; color-swatch headers) | Not started |
| 7.3 | **Tags** axis (special): one axis only; pick a **subset** of that board's tags; each card lands in **exactly one** cell (first chosen tag in axis order) — **no duplicates** | Not started |
| 7.4 | **Date** axis: pick field (Updated/Created) + bucket (**Month / Quarter / Year**); normalize ms-epoch **and** ISO to a sortable label | Not started |
| 7.5 | Extend matrix-def object + `validateImport`; persistence already handled (`program-matrices.json`) | Not started |

---

## 5 · RELEASE 8 — LARGE-MATRIX SIZING

| # | Item | Status |
|---|---|---|
| 8.1 | Standardize compact display first; **not partial scrolling** | Not started |
| 8.2 | Prototype **scale-to-fit** (whole matrix zooms; dense = name-only chip) vs **paging** (arrows + remaining-page counts in the header/corner decorations) → owner picks from a live view | Open question |
| 8.3 | Implement the chosen model with sticky row/column headers | Not started |

---

## 6 · RELEASE 9 — CONSOLIDATION

| # | Item | Status |
|---|---|---|
| 9.1 | Merge the 4 `<style>` blocks; single `--topbar-height` / `--sidebar-width` | Not started |
| 9.2 | Remove dead duplicate function definitions and legacy branches | Not started |
| 9.3 | (Optional) bottom tab bar for main views | Not started |

---

## 7 · BACKLOG / FUTURE IDEAS — unscheduled

| # | Idea | Status |
|---|---|---|
| F1 | **Cross-board "Project" view** — a portal/tab format grouping cards that may belong to different boards (projects sidebar with counts, drag a card/tab to assign, an Unassigned bucket, a Recycle Bin), backed by a future `project` field on cards. For discussion | Idea |
| F2 | Add a `project` field (and other custom fields) to cards; all such single-value fields become matrix-able | Idea |
| F3 | Additional date buckets (Week) if needed | Idea |

---

## 8 · OPEN ITEMS LOG

Status: `pending` (agreed, not started) · `wip` · `closed`. Last updated per row.

| # | Item | Status | Last updated |
|---|---|---|---|
| OI-1 | R5 context-aware card + gestures | pending | 2026-08-13 |
| OI-2 | R6 Omni search | pending | 2026-08-13 |
| OI-3 | R7 matrix axes overhaul | pending | 2026-08-13 |
| OI-4 | R8 scale-vs-paging — needs owner choice from a live demo | pending | 2026-08-13 |
| OI-5 | F1 cross-board project view — for discussion | pending | 2026-08-13 |
| OI-6 | Data cleanup: one card has `statusColor:"Unassigned"` (fallback string persisted) | pending | 2026-08-13 |
| OI-7 | R1–R4 shipped and merged | closed | 2026-08-13 |

---

## 9 · IMMUTABLE WORKING RULES

### 9.1 One artifact
`program.html` is one self-contained HTML file at the repo root. No build step; edits are made
in place and verified before push.

### 9.2 Data & source of truth
- Boards: `kanban-boards.json` (index) + `<board-slug>.json` per board. Matrices:
  `program-matrices.json`. Optional `kanban-switch.json` for a path prefix.
- **GitHub is the source of truth; localStorage is a disposable cache.** Writes go through the
  Contents API with a fresh SHA and **refuse to overwrite a newer remote**. GitHub wins unless
  the local copy is strictly newer.
- localStorage keys: `program_configuration_v4`, `program_tag_history_v1`, `github_pat`.

### 9.3 Matrix model
A matrix is a saved 2-axis view of one board. Axis fields = any single-value card/board field
**except** title, notes, attachments/files, and dev/live URLs. **Tags** are multi-value: one
axis only, chosen subset, no duplicate placement. Dates bucket to Month/Quarter/Year.

### 9.4 Gesture model (locked)
Handle = drag · 1 tap = preview · 2 taps = open full · long-press (mobile) / right-click
(desktop) = context menu. Never rely on hover or desktop-only gestures as the only path.

### 9.5 Omni search (locked)
Searches everything, excludes nothing, and filters the active matrix.

### 9.6 Development process
- Work on branch `claude/program-kanban-matrix-ui-axr3l6`. **Rebase on latest `main` before
  every PR** so the diff is only the intended change.
- **One release = one PR.** A merged PR is done; never stack new work on merged history —
  restart the branch from `main`.
- **Gate before push:** `node --check` the extracted `<script>`, then drive the app in headless
  Chromium (`/opt/pw-browsers/chromium`, Playwright) against the **real** board JSON — desktop
  *and* a touch/mobile context — asserting the feature works and there are **zero** `pageerror`
  events. Green means allowed to push, never "done".
- No stubs, no fake data. Each release delivers real, cumulative value.

### 9.7 Cosmetic / consolidation work goes last
CSS consolidation and dead-code removal ride behind functional releases (R9), or fold in
quietly as an area is already being changed — never as a standalone risky sweep mid-feature.

---

## 10 · GRAVEYARD — buried approaches (do not resurrect)

| # | Approach | Why buried |
|---|---|---|
| GY-1 | HTML5 `draggable` drag for cards and axis headers | Does not work on touch. Replaced by Pointer Events (R3/R4). |
| GY-2 | Right-click / long-press as the **only** path to card color | Long-press collides with drag pickup; invisible on touch. Replaced by handle-drag + context menu (R5). |
| GY-3 | Squish the whole matrix to fit the viewport (≈8px text, no scroll) | Unreadable on phones. Replaced by scale-to-fit or paging (R8). |
| GY-4 | Always-on lineage chip on cards | Real cards lack lineage (defaults to "base") — pure noise. Show only meaningful chips. |

---

## 11 · APPENDIX

### 11.1 Authority order
1. Current owner ruling (must be written into this doc the same session or it does not exist).
2. This plan — sequence, scope, locked models.
3. The graveyard (§10) — vetoes buried approaches.
4. Release plan and gates.
5. Older prototypes, screenshots, and implementation history.

### 11.2 Fixed infrastructure
| Thing | Value |
|---|---|
| Repository | `acmeproducts/stuff` |
| Pages | deploys from `main` root via `.github/workflows/static.yml`, live in ~1 minute |
| Test link | https://acmeproducts.github.io/stuff/program.html |
| Data files | `kanban-boards.json`, `<board>.json`, `program-matrices.json`, `kanban-switch.json` |
| Source apps | `kanban.html` (card detail), `mello.html` (matrix) |

---

## 12 · CHANGE LOG

**v1.0.0 · 2026-08-13.** Document created. Recorded shipped releases R1–R4 (PRs #620–#623)
and scheduled the mobile-first redesign R5–R9. Locked the gesture model, the Omni-search
"search everything" rule, and the matrix axis model (single-value fields; status usable now;
tags one-axis/no-duplicates; date buckets Month/Quarter/Year). Added the cross-board "Project
view" portal idea to Future Ideas (F1). Established the development process (rebase-before-PR,
one-release-one-PR, headless-browser + `node --check` gate, GitHub as source of truth).
