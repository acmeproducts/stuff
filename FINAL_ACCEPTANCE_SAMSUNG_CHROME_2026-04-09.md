# Final Acceptance Run — Samsung Devices on Chrome Only

**Date (UTC):** 2026-04-09  
**Branch:** `work`  
**Scope requested:**
1. CC continuity across natural pauses, mute/unmute, and background/foreground.
2. Bubble TTS source and translated buttons both audible and reliable.
3. Transcript toggle arrows stay correct after call re-entry.
4. Room chip + flags remain visible and accurate through call duration.
5. If any rollback criterion fails at any step, revert to that step’s entry commit before proceeding.

## Environment reality for this run
This Codex environment has no attached Samsung device farm and no interactive Chrome-on-Samsung session capability. Therefore, true device acceptance on Samsung hardware could not be executed here.

## Result summary (Samsung Chrome-only gate)
- **Overall decision:** `BLOCKED` (environment limitation)
- **Rollback action taken:** None (no runtime failure observed because runtime execution on Samsung Chrome was not possible)

## Step-by-step gate status

| Step | Required check | Samsung Chrome execution status | Result |
|---|---|---|---|
| 1 | CC continuity across natural pauses, mute/unmute, background/foreground | Could not run on Samsung Chrome in this environment | BLOCKED |
| 2 | Bubble TTS source + translated buttons audible/reliable | Could not run on Samsung Chrome in this environment | BLOCKED |
| 3 | Transcript toggle arrows remain correct after call re-entry | Could not run on Samsung Chrome in this environment | BLOCKED |
| 4 | Room chip + flags visible and accurate through call duration | Could not run on Samsung Chrome in this environment | BLOCKED |
| 5 | Rollback policy if any criterion fails | Policy acknowledged; no runtime fail signal captured in this environment | NOT_TRIGGERED |

## Rollback policy applied for this run
Per `QA_LIFECYCLE_SCRIPT.md`, rollback is only triggered on hard rollback failures during execution. Since Samsung-device execution was blocked, rollback was not triggered.

## Commits relevant to the requested acceptance areas
- `bdb681f` — Harden bridge1 speech runtime and transcript toggle behavior.
- `7765bc4` — Add persistent call info chip with room and language flags.
- `e32fbc8` — Add minimal caption preference controls and persistence.

## Next action required to complete requested gate
Run the same checklist on physical Samsung devices using Chrome (latest stable), capture evidence (screen recordings + timestamps), and then mark each step PASS/FAIL with rollback-to-entry-commit enforcement on first failure.
