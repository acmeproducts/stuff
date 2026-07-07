# TALKBRIDGE — EXTRACTION MAP (Plan-stage output)

Governed by `talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html` (WHAT) and `talkbridge/TALKBRIDGE-HOW-WE-PREVAIL.md` (HOW). This map is a work product, not an authority. Version 1.0 — 2026-07-06.

## Audit findings (verified against repo files at commit-time)

| Artifact | Audit result |
|---|---|
| `bridge-turn08-base.html` (616 KB) | Richest single file: shell + navigation + phrasebook + working call/sync-keys modal + relay references + STT/translation plumbing + unconditional empty-shell boot. **This is the Execute base. Most behavior is already inside it.** |
| `bridge-turn07-post-ship.html` (329 KB) | Device-gated relay room/message mechanics (create/join/send/receive, WebSocket relay, translation path, receipts lineage). **Donor for any relay/session/message behavior missing or broken in the base.** |
| `test.html` (304 KB) | Shell/navigation lineage only. Reference for panel/start-screen behavior. **No code lifted from it directly; base already carries the shell.** |
| `2vid.html` (126 KB) | Call/video on unified transcript, PiP lineage, media capture. **Donor for the S9 package only. Untouched in Package 1.** |
| `bridge-turn08-pre-base.html` (329 KB) | **Correct chat surface, correct "/" in-chat PB search, correct PB ingestion + full write-back cycle, correct PB ribbon and card format.** Base carries older versions of all four. **Donor of record for chat surface and phrasebook behavior.** |

Key corrections: turn08-base is not a bare floor — it carries the working keys modal, shell, and plumbing. But its chat surface and phrasebook are **old**: correct versions live in `bridge-turn08-pre-base.html` (chat surface, "/" as in-chat PB search rather than opening the old PB surface, PB ingestion/write-back cycle, PB ribbon/card format). Package 1 = complete the relay conversation path (turn07 donor where base is unproven) **and bring the chat surface to pre-base behavior**. Phrasebook cycle is lifted from pre-base in its package.

## Ownership assignments (Package 1)

| Concern | Owner (single) | Source |
|---|---|---|
| Shell / router / start screen | Base | turn08-base (verify empty-shell boot) |
| Room / session / relay | Base, completed from turn07 where unproven | turn07 mechanics |
| Message / translation / receipts | Base, completed from turn07 where unproven | turn07 mechanics |
| Transcript renderer (S4) / chat surface | Pre-base version, placed in base | turn08-pre-base |
| Composer / "/" search-in-chat | Pre-base version | turn08-pre-base |
| Invite / join / landing (S4a, S10) | Base, completed from turn07 where unproven | turn07 mechanics |
| Keys / settings modal | Base — **preserve as-is, working** | turn08-base |
| Phrasebook (ingestion, write-back, ribbon, cards) | Pre-base version — base's PB is old, do not keep | turn08-pre-base |
| Call / video / STT | Deferred (Package 2+) | 2vid.html |
| PWA / notifications | Deferred per plan | plan |

## Execute method (Package 1)

1. Work only inside `bridge-turn08-base.html` copied to the Package-1 working file. turn07 is read-only donor; test.html and 2vid.html are read-only references.
2. Donors: turn07 for relay/session mechanics, **pre-base for chat surface and PB**. For each concern, first verify the base's existing path against the plan's S0/S1→S2→S3→S4→S4a→S10 flow. Only where the base path is absent, broken, or unproven: lift the corresponding proven turn07 mechanic, adapt names/hooks to the base's single owner, insert.
3. No second copy of any owner may remain. Any dormant duplicate found in the base is removed, not disabled.
4. Bridge/media code must not run before room entry. Boot lands on start screen unconditionally.
5. One change → lint → verify → next. Fingerprint donor blocks before lift; recompute after landing; mismatch = reject.

## Acceptance (before code, fixed)

The 16-step Test gate in HOW-WE-PREVAIL §9, run on two real devices, plus automatic checks: boot-lands-on-start-screen, no-bridge-activity-before-room-entry, single-transcript-owner, single-composer-owner, single-relay-owner, keys-modal-unchanged.

## Stop conditions

Per HOW-WE-PREVAIL §10. Additionally: stop if audit finds the base's relay path and turn07's relay path are incompatible in protocol (would force a rewrite rather than a completion) — that returns to Plan, not to improvisation.

---

# PACKAGE 1 WIRING SPEC (map v1.2)

Plan authority links (GitHub Pages):
- UX walkthrough: https://acmeproducts.github.io/stuff/talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html#p2
- Surface & element inventory (S0–S14): https://acmeproducts.github.io/stuff/talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html#p3
- Module map & contracts: https://acmeproducts.github.io/stuff/talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html#p6

Donor reference (live): https://acmeproducts.github.io/stuff/bridge-turn08-pre-base.html — this page IS the correct chat surface, "/" in-chat search, and PB ribbon/card behavior. Anything that looks or behaves differently from it in those areas is wrong.

Rule of interpretation: where the plan's Part 3 spec and the pre-base page agree, that is the target. If they ever disagree, the plan wins and the disagreement is flagged before building.

## Piece-by-piece lay-in

**1. Shell, start screen, room list (S0/S1/S2)**
- Stays: already in base. Plan ref: #p3 (S0, S1, S2).
- Lay-in: none. Verify only: cold open always lands on start screen, right panel shown, left panel closed.
- Upstream: nothing — this is the root.
- Downstream: everything. Room list feeds room entry; room entry is the only thing allowed to wake the conversation machinery.

**2. Create room / invite / joiner landing (S3, S4a, S10)**
- Donor: turn07 mechanics where base's path is unproven. Plan ref: #p2 walkthrough, #p3 (S3, S4a, S10).
- Lay-in: base keeps the screens; the underlying create/invite/join plumbing is verified against turn07's device-gated behavior and completed from it where the base's version doesn't actually work.
- Upstream: shell (a person must be on the start screen or room list first); relay reachable.
- Downstream: a joined room hands off to the chat surface (piece 3). Invite links must open piece 10 flow on a fresh device.

**3. Chat surface / transcript / composer (S4, S4-B)**
- Donor: **pre-base, whole surface** — visual shape, bubbles, composer, behavior. Plan ref: #p3 (S4, S4-B); live reference: the pre-base page itself.
- Lay-in: base's old chat surface is **removed**, pre-base's surface is placed in the same position in the app. Not merged — replaced.
- Upstream: an entered room (piece 2) and incoming/outgoing messages from the relay path (piece 4). Without a live room, this surface never wakes.
- Downstream: it is the only place conversation is visible; receipts, system pills, and later the call band (S9, deferred) all render into it. The "/" behavior (piece 5) lives inside its composer.

**4. Relay message path + translation (both directions)**
- Donor: turn07 (device-gated) verified against what base carries. Plan ref: #p6 contracts.
- Lay-in: one session owner in the app talks to the relay; every message goes out original, comes back to the other side original + translated (MyMemory), lands in the transcript.
- Upstream: room join (piece 2), relay endpoint, translation service.
- Downstream: transcript rendering (piece 3), receipts, reload persistence (transcript survives refresh).

**5. "/" and ".." in-chat search (S5)**
- Donor: **pre-base behavior exactly**: typing "/" or ".." in the composer opens search **within the chat surface** — it must NOT jump to the old PB surface. Plan ref: #p3 (S5).
- Lay-in: comes along with the pre-base chat surface (piece 3); wired to the PB data (piece 6) as its source of results.
- Upstream: composer (piece 3), phrasebook data loaded for the room's language pair.
- Downstream: selecting a result inserts into the composer/sends per plan; closing returns to normal compose.

**6. Phrasebook ingestion + write-back + ribbon/cards (S6/S7/S8)**
- Donor: **pre-base full cycle** — pull from GitHub (highest-number file wins), edit, write back (number+1), ribbon and card format per pre-base/plan. Base's old PB is removed. Plan ref: #p3 (S6–S8), card minimalism rules.
- Lay-in: PB is language-pair scoped, loaded on room entry, refreshed per plan.
- Upstream: GitHub phrasebook files, the room's language pair.
- Downstream: feeds "/" search results (piece 5) and the PB surfaces.
- Gating note: PB is included because "/" search depends on its data; full PB surface polish may follow in its own gate, but the data cycle ships with Package 1.

**7. Keys/sync modal (S11 area)**
- Donor: base — working. Untouched. Plan ref: #p3 (S11/S13).
- Upstream: shell entry (long-press path per plan). Downstream: keys feed translation/STT services.

**8. Explicitly NOT in Package 1**
- Calls/video/STT (S9, donor 2vid), PWA/notifications (S14), S13 three-button build-out, S4b drawer full build-out. Each gets its own package after the conversation gate passes.

## Order of lay-in (fixed)
1 verify shell → 2 relay room path proven with two devices (bare) → 3 pre-base chat surface replaces old → 4 bilingual messages flowing through it → 6 PB data cycle in → 5 "/" search wired → 7 keys modal untouched check → full 16-step gate.

Any step failing = stop, roll back to last banked build, graveyard + automatic check added, resume from clean.
