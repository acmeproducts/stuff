# devstream-backlog.md — Governance & Source of Truth

App: `devstream.html` — standalone multi-thread orchestrator. NOT a session-manager version; borrows the v2.9.2 UI shell patterns only. Own lineage starting v1.0.

Deploy target: `https://acmeproducts.github.io/stuff/devstream.html`
Test target: `https://acmeproducts.github.io/stuff/devstream-test.html`

## Status
- Current release: v1.0 build 3 on devstream-test.html (2026-08-14)
- Stage: TEST (build 5)

## Release Rules (inherited, proven)
1. Mobile-first. All diagnostics in-app. No DevTools ever.
2. Read-back verification gate before closing any release: byte-compare via raw.githubusercontent.com with cache-busting param.
3. GitHub Contents API returns EMPTY content (not an error) for files >1MB. Always fall back to `Accept: application/vnd.github.raw+json`.
4. Read blob SHA before every PUT.
5. Pages build: check `/pages/builds/latest`, allow 60-90s after commit.
6. Build to devstream-test.html; promote to devstream.html only on explicit owner "ship".

---

# Spec v1.0 (r2) — APPROVED 2026-08-14

## Core model (simplest terms)
- **Project** = user-defined label (left drawer).
- **Thread** = tab. Has an **output filename** (= tab name) and optionally an **input filename** (existing codebase) or just an idea.
- **Loop** = idea/feedback in chat -> agent builds -> pushes code -> returns test URL -> you test -> more feedback in same thread. State resumable from any device.

## 1. Configuration (gear)
PAT, default repo, default branch — gg.html pattern. Per-thread repo override at creation only.

## 2. Thread creation
Tap + (new tab):
1. **Output filename** — type new name, or omni-search existing repo files (gg.html pattern). If blank, prompt before first send.
2. **Input filename (optional)** — omni-search existing file as starting codebase. Blank = new idea from scratch.
3. **Prompt** — the idea. Then it's just chat.
- Output filename re-specifiable in chat ("output to xyz.html"); tab renames, subsequent pushes go there.

## 3. Thread loop
- Every chat message = instruction against the thread's output file.
- Agent per message: read thread state from GitHub -> build -> commit -> read-back verify -> reply with commit SHA + cache-busted test URL.
- No intermediate workflow stages exposed. Every turn ends in pushed code + URL, or an error surfaced in-app.

## 4. Memory / persistence (DECIDED)
All state in GitHub — kanban.html storage + sync methodology. Nothing app-critical on OpenClaw or in browser storage.
- `devstream/threads/<project>__<output-file>.json` — chat history + metadata (input file, repo, created, output renames).
- `devstream/devstream-status.json` — status SOT. Keep lean; raw media-type fallback on read.
- Agent is stateless: reads thread file, executes, writes results. Any device resumable; agent machine rebuildable with zero loss.

## 5. Status SOT schema
```json
{
  "threads": {
    "<project>/<output-file>": {
      "project": "", "file": "", "repo": "",
      "state": "idle | executing | ok | error",
      "startedAt": "ISO", "finishedAt": "ISO",
      "lastCommit": "sha", "testUrl": "",
      "error": "agent error text, empty if ok"
    }
  },
  "projects": {
    "<project>": { "notes": "free text", "lastTouched": "ISO" }
  }
}
```
Agent writes `executing` at run start, final state at end. App is read-only consumer of thread states; app writes project notes.

## 6. Dashboard card (the orchestrator)
- Pinned first in drawer; cannot move/delete. Face badge: executing count + error count.
- Tap -> full-screen panel:
  - Per project: label, last touched, active thread count, editable notes (saved to SOT).
  - Per thread row: project, output file, state icon, last executed (relative), error text inline (expandable).
  - Tap row -> navigate to that project + tab (drawer closes, tab armed).
  - Sort: last executed, state, project, filename. Filter: state, project, repo.
  - Pull-to-refresh; auto-refresh 30s while panel open and anything executing.

## 7. Mobile-first constraints
48px touch targets; panels stack below ribbon full-width; no side popovers; gesture semantics per v2.9.2 shell (double-tap menu below tab, document-level pointer tracking).

## 8. Out of scope v1.0
Parallel-run limits / file-lock queueing; cross-repo status aggregation; push notifications.

---

# Backlog
| ID | Item | Status |
|---|---|---|
| DS-1 | Build v1.0 per spec above | OPEN |

# Decision Log
- 2026-08-14: App named devstream.html; standalone, not a session-manager version. Owner directive.
- 2026-08-14: Memory resides in GitHub (kanban.html methodology), not OpenClaw. Owner recommendation, confirmed — IndexedDB browser isolation is a proven limitation.
- 2026-08-14: Thread = output file (tab name) + optional input file. Owner directive.
- 2026-08-14: SUPERSEDED same day — runner removed from the critical path by owner ruling ("no extra moving part"). All engines run browser-direct in-app: venice (DEFAULT), openrouter, anthropic-direct. devstream-runner.py stays parked in the repo (thread-file contract is engine-agnostic; a runner can return later without app changes). Known trade-off accepted: builds die if the browser tab is suspended; ▶ re-runs pending work. Venice browser CORS is THEORY until first live call.
- 2026-08-14: Project cards carry a plan/status doc link (planFile in SOT projects), following the master-doc standard (talkbridge-master.md pattern).
