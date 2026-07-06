# TALKBRIDGE — EXTRACTION MAP (Plan-stage output)

Governed by `talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html` (WHAT) and `talkbridge/TALKBRIDGE-HOW-WE-PREVAIL.md` (HOW). This map is a work product, not an authority. Version 1.0 — 2026-07-06.

## Audit findings (verified against repo files at commit-time)

| Artifact | Audit result |
|---|---|
| `bridge-turn08-base.html` (616 KB) | Richest single file: shell + navigation + phrasebook + working call/sync-keys modal + relay references + STT/translation plumbing + unconditional empty-shell boot. **This is the Execute base. Most behavior is already inside it.** |
| `bridge-turn07-post-ship.html` (329 KB) | Device-gated relay room/message mechanics (create/join/send/receive, WebSocket relay, translation path, receipts lineage). **Donor for any relay/session/message behavior missing or broken in the base.** |
| `test.html` (304 KB) | Shell/navigation lineage only. Reference for panel/start-screen behavior. **No code lifted from it directly; base already carries the shell.** |
| `2vid.html` (126 KB) | Call/video on unified transcript, PiP lineage, media capture. **Donor for the S9 package only. Untouched in Package 1.** |

Key correction to prior assumptions: turn08-base is not a bare floor. It already contains the working keys modal, phrasebook, shell, and much of the plumbing. Package 1 is therefore mostly **verification + completion of the relay conversation path inside the base**, with turn07 as donor where the base's path is incomplete or unproven — not a large transplant.

## Ownership assignments (Package 1)

| Concern | Owner (single) | Source |
|---|---|---|
| Shell / router / start screen | Base | turn08-base (verify empty-shell boot) |
| Room / session / relay | Base, completed from turn07 where unproven | turn07 mechanics |
| Message / translation / receipts | Base, completed from turn07 where unproven | turn07 mechanics |
| Transcript renderer (S4) | Base, shaped to plan | plan mockups |
| Composer / search | Base | turn08-base |
| Invite / join / landing (S4a, S10) | Base, completed from turn07 where unproven | turn07 mechanics |
| Keys / settings modal | Base — **preserve as-is, working** | turn08-base |
| Phrasebook | Base — present, deferred from gating | turn08-base |
| Call / video / STT | Deferred (Package 2+) | 2vid.html |
| PWA / notifications | Deferred per plan | plan |

## Execute method (Package 1)

1. Work only inside `bridge-turn08-base.html` copied to the Package-1 working file. turn07 is read-only donor; test.html and 2vid.html are read-only references.
2. For each concern above, first verify the base's existing path against the plan's S0/S1→S2→S3→S4→S4a→S10 flow. Only where the base path is absent, broken, or unproven: lift the corresponding proven turn07 mechanic, adapt names/hooks to the base's single owner, insert.
3. No second copy of any owner may remain. Any dormant duplicate found in the base is removed, not disabled.
4. Bridge/media code must not run before room entry. Boot lands on start screen unconditionally.
5. One change → lint → verify → next. Fingerprint donor blocks before lift; recompute after landing; mismatch = reject.

## Acceptance (before code, fixed)

The 16-step Test gate in HOW-WE-PREVAIL §9, run on two real devices, plus automatic checks: boot-lands-on-start-screen, no-bridge-activity-before-room-entry, single-transcript-owner, single-composer-owner, single-relay-owner, keys-modal-unchanged.

## Stop conditions

Per HOW-WE-PREVAIL §10. Additionally: stop if audit finds the base's relay path and turn07's relay path are incompatible in protocol (would force a rewrite rather than a completion) — that returns to Plan, not to improvisation.
