# ChatStream Backlog — Source of Truth

App: `chatstream.html` — standalone multi-thread coding orchestrator. ChatStream is a new application; it is not a Session Dash Manager version. It reuses the Session Dash Manager v3 UI/layout patterns only.

Governance: `CHATSTREAM_GOVERNANCE.md`

Deploy target: `https://acmeproducts.github.io/stuff/chatstream.html`

## Current status
- Current build: v0.1.0
- Build started: 2026-08-15
- Application commit: `40e0172447dbfdaf510ff6452f959f41743244fc`

## Core model
- Project = user-defined organizational label.
- Thread = persistent tab/conversation and unit of orchestration.
- Thread has one sticky primary output filename.
- Thread may have an optional existing input/source filename or begin from a new idea.
- Existing file selection uses repository omni-search.
- If an idea has no output filename, ChatStream requires one before execution.
- Follow-up chat keeps updating the same output file unless the user explicitly changes it.
- Successful work ends in pushed code plus a testable URL when deployment permits one.
- No forced visible idea/plan/build/test/deploy workflow stages.

## Persistence / execution boundary
- GitHub is the durable ChatStream workspace SOT and supports multi-device synchronization.
- Browser storage is local cache/credentials/outbox only.
- OpenClaw is the default execution/orchestration backend, not ChatStream's primary database.
- Credentials must never be committed to ChatStream state or HTML.

## Dashboard
The pinned first card is Dashboard. It aggregates all project/thread status, last touched time, attention/errors, notes, filtering/sorting, and direct navigation back into a thread.

Core states: queued, running, waiting, completed, error, cancelled. `attentionRequired` is separate from execution state.

## v0.1.0 implemented
- Responsive Session Manager-inspired shell with Dashboard first and project list on the left.
- Project creation.
- Thread tabs by output file.
- Existing repository file omni-search plus new filename entry.
- Optional input/source file and required-before-execution output file behavior.
- Persistent thread chat surface.
- GitHub state file at configurable `chatstream/state.json` with local outbox, merge/dedupe, conflict retry, startup/focus/poll receive.
- Separate code-repository and state-repository settings.
- Dashboard state counts, filtering, sorting, workspace notes, and click-through.
- OpenClaw Gateway protocol v4 browser-device handshake based on the proven Session Manager v3 implementation.
- `sessions.create`, `chat.send`, streamed `chat` events, and `chat.abort` integration.
- Current output SHA refresh before every execution dispatch.
- Execution prompt contract requiring complete implementation, validation, commit/push, changed files, commit SHA, and test URL.
- Local-only GitHub PAT and OpenClaw credentials.
- In-app diagnostics behind Settings for mobile use.

## Next implementation hardening
1. Reconcile an in-flight/completed OpenClaw run from `chat.history` after browser/device reconnect so Dashboard cannot remain stale if a device closes during execution.
2. Add explicit project/thread rename and delete controls without changing the core model.
3. Add thread-level repository/branch rebinding in chat/settings while preserving existing bindings by default.
4. Add stronger extraction/verification of commit SHA, changed files, validation result, and test URL from execution completion.
5. Add a Pages-build verification indicator so a returned Pages URL distinguishes committed from actually deployed.
6. Run mobile interaction testing and accessibility/touch-target pass.

## Decision log
- 2026-08-14: GitHub persistence selected for multi-device durable workspace memory.
- 2026-08-14: Project = label; thread = persistent conversation + output file; optional input file.
- 2026-08-15: Application renamed from DevStream to ChatStream / `chatstream.html` before first implementation release.
- 2026-08-15: `CHATSTREAM_GOVERNANCE.md` established as governing contract.
- 2026-08-15: v0.1.0 initial implementation committed.
