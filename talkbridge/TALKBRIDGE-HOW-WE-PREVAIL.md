# TALKBRIDGE — HOW WE PREVAIL

**Executive ruling.**
`talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html` defines WHAT must exist. The working/source artifacts (`bridge-turn07-post-ship.html`, `bridge-turn08-base.html`, `test.html`, `2vid.html`) prove the required capabilities are real — relay-backed rooms, bilingual messaging, shell navigation, call/video lineage. The missing piece is HOW to get from proven artifacts to the final master-plan app. The path is: **Plan → Execute → Test.** There are no additional delivery stages.

---

## 1. Authority

- `talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html` is the product authority. It controls final surfaces, navigation, roles, UX, feature scope, and acceptance expectations.
- This document is an execution proposal only. It does not replace, rewrite, supersede, or edit the master plan.
- If any artifact conflicts with the master plan's final behavior, the master plan wins.
- If any artifact proves behavior the master plan requires, that behavior is audited and preserved/adapted — not rebuilt blindly from scratch.

---

## 2. Ground truth

- We are not starting from theory.
- `bridge-turn07-post-ship.html`, `bridge-turn08-base.html`, `test.html`, and `2vid.html` contain working or lineage behavior: relay-backed communication, room create/join, bilingual message flow, shell/navigation structure, and integrated call/video surface.
- The relay-backed communication path (`wss://talk-signal.myacctfortracking.workers.dev/signal`) is real, has carried real two-device conversations, and must not be replaced by fake two-tab or local-only simulation.
- The final app must behave like the master plan — not exactly like any one old artifact. Artifacts are quarries, not templates.

---

## 3. What failed before

- **Shell-first bridge injection failed.** Injecting a sealed bridge into a shell base repeatedly woke the bridge at page load, broke shell functions, or silently ran stale dormant code.
- **Blind merge failed.** Combining two full apps produced namespace collisions and startup-order bugs that killed chat, search, and phrasebook.
- **Hidden prior-app / dormant-app approaches failed.** Contaminated dormant blocks in base files ran old code regardless of new fixes.
- **Negative-only gates failed.** Proving "the bug is gone" without proving "the capability works" shipped shells that did nothing.
- **Over-planning into many build stages failed.** Long stage ladders produced motion without a working app.
- **Fake prototype thinking failed.** Building toys to "prove" behavior that already works in real artifacts is waste.
- The actual missing piece is a **disciplined extraction/adaptation method**: know exactly what each artifact proves, lift exactly that, place it under single ownership, and verify positively with real clients.

---

## 4. The winning model: Plan → Execute → Test

### Stage 1: Plan
- **Output:** a concrete extraction and execution map (one short document, not a redesign).
- Identifies which artifact owns which proven behavior.
- Maps every extracted behavior to a master-plan surface or function.
- Names the exact files and functional units to touch during Execute.
- Defines acceptance before any code is written.
- **Stop** if the relay path, S4 conversation ownership, or the source-behavior map is unclear. Do not proceed into Execute on ambiguity.

### Stage 2: Execute
- **Output:** the working app package.
- Preserves/adapts the proven relay-backed room/message path.
- Implements the planned S4 visible conversation surface.
- Supports two real clients joining the same room through the relay.
- Sends original + translated messages in both directions.
- Has exactly one transcript owner and one composer owner.
- Does not boot a hidden old app.
- Does not ship a shell-only or non-working interim.

### Stage 3: Test
- **Output:** proof.
- Runs deterministic checks plus real-client acceptance on real devices.
- Proves create / join / send / receive / reload.
- Proves the planned S4 owns the visible conversation.
- Proves no duplicate relay, transcript, or composer owner exists.
- **Stop** if any positive capability fails. Roll back; do not patch forward.

---

## 5. Artifact audit matrix

| Artifact | Relationship to master plan | Proven / likely capability | Preserve or adapt | Must not inherit | Audit question |
|---|---|---|---|---|---|
| `talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html` | Product authority: defines all final surfaces, navigation, scope, acceptance | Complete WHAT definition, mockups, config spec, build history | Preserve as-is; read-only reference | N/A (never inherited into code; it governs code) | Does every Execute deliverable trace to a named plan section? |
| `bridge-turn07-post-ship.html` | Confirmed working baseline of a prior turn | Real relay-backed room create/join, bilingual send/receive, receipts lineage | Adapt: extract the relay/session/message mechanics that passed device gates | Old navigation shape; any auto-init-on-load behavior; superseded UX | Which exact behaviors here passed real-device gates, and are they untouched since? |
| `bridge-turn08-base.html` | Current build floor | Clean base without wake-on-load contamination; working call/sync-keys modal | Preserve as structural floor; preserve keys modal as-is | Any dormant/stale blocks; auto-reopen-last-room boot logic | Is this file verifiably free of dormant code paths and load-time bridge activation? |
| `test.html` | Shell/navigation lineage reference | Left/right panel shell, room list, start-screen behavior, navigation paths | Adapt: shell layout and navigation patterns only, matched to plan surfaces | Its injection base role (caused wake-on-load); any relay/session code it carries | Which navigation behaviors match the plan exactly vs. need reshaping? |
| `2vid.html` | Integrated chat+call surface reference | Call/video band on the same transcript surface; PiP lineage; STT path | Adapt later: call-layer integration pattern for S9 | Any separate-call-UI assumptions; floating windows | Does its call layer sit on one transcript surface as the plan requires? |

---

## 6. Master-plan surface execution map

| Master-plan surface / capability | Required final behavior | Candidate source artifact | Execute approach | Acceptance proof |
|---|---|---|---|---|
| S0/S1 onboarding/start | App always opens to start screen (right panel, left panel closed); name capture if needed | `test.html`, `bridge-turn08-base.html` | Adapt shell start behavior; unconditional empty-shell boot | Cold load lands on start screen every time; no room auto-reopens |
| S2 room list/panel | Left panel lists rooms, one room type only | `test.html` | Adapt panel structure to plan inventory | All rooms listed; tap opens room; no phantom entries |
| S3 create room | Create room from shell, get room identity | `bridge-turn07-post-ship.html` | Preserve relay room-creation mechanics under new shell | Created room is joinable by second real device |
| S4 transcript/conversation | Single unified transcript; original + translated bubbles; one composer | `bridge-turn07-post-ship.html` (mechanics) + plan mockups (shape) | Preserve message path; render into plan-shaped S4 | Two devices exchange bilingual messages on one visible transcript |
| S4a invite | Generate/share invite link | `bridge-turn07-post-ship.html` | Preserve invite generation; restyle to plan | Link opens on second device and resolves to the room |
| S4b room drawer/link device/settings | Room-level settings live only in the `⋯` drawer | Plan (mockups); mechanics from turn07 where proven | Build drawer to plan; wire proven per-room actions into it | Drawer opens; every listed control works; no settings elsewhere |
| S5 search | Compose-strip search; `/` and `..` open phrasebook search | `bridge-turn08-base.html` lineage + plan | Adapt existing search under single composer owner | Search triggers work; results correct; composer unaffected |
| S6/S7/S8 phrasebook | Language-pair-scoped PB, GitHub-backed, plan card layout | `phrase-desk.html` layout authority (per plan) + existing PB pull/writeBack | Adapt PB storage/refresh mechanics; card UI per plan minimalism | PB loads for pair; edits write back with NNNN+1; cards match plan |
| S9 call/video/STT | Video band on same transcript; back-button PiP; Deepgram STT | `2vid.html` | Adapt call layer onto S4 surface in a later Execute package | Call runs on transcript surface; PiP behaves; STT transcribes |
| S10 joiner landing | Invitee lands, names self if needed, enters room | `bridge-turn07-post-ship.html` | Preserve join path; land per plan flow | Fresh device with only the link reaches the room |
| S11/S13 keys/settings/about/privacy | S13 = three buttons via long-press on blank square | `bridge-turn08-base.html` (working call/sync-keys modal) | Preserve the existing working keys modal as-is; build only the three-button S13 entry per plan | Existing keys modal works unchanged; long-press reveals exactly three buttons; each works |
| S14 PWA/notifications | Per plan scope and timing | Plan (deferred item) | Defer to a later Execute package | Deferred; not gated in first package |

---

## 7. Ownership rules

Exactly one owner per concern. No exceptions.

- One app shell/router owner.
- One room/session/relay owner.
- One message/translation/receipt owner.
- One transcript renderer.
- One composer/search owner.
- One phrasebook owner.
- One invite/join/link-device owner.
- One call/video/STT owner.
- One settings/keys/privacy owner.
- One PWA/notification owner.
- No hidden prior app may own any runtime surface.
- No duplicate transcript, composer, or relay ownership is allowed, ever — duplicates are an automatic gate failure.

---

## 8. First Execute package

The first package is the real app's spine, not a demonstration.

- It is **not** a toy prototype and **not** a shell-only build.
- Targets the master-plan **S0/S1 → S2 → S3 → S4 → S4a → S10** flow: open app → see rooms → create room → converse → invite → second party joins.
- Uses/preserves/adapts the **real relay-backed communication mechanics** from the audited artifacts (turn07 mechanics on the turn08 floor).
- Supports **two real clients in one room through the relay**.
- Sends **original + translated messages both directions** (MyMemory path preserved).
- Renders the planned **S4 shape** with one transcript and one composer.
- May defer phrasebook, calls, PWA, notifications, and STT **only if** the relay-backed bilingual conversation path is real and working.
- Must not use fake local/two-tab simulation as product transport at any point.

---

## 9. Test gate

Run on real devices. Every step is a positive assertion.

1. Client A opens app.
2. A enters name if needed.
3. A creates room.
4. A gets invite/link.
5. Client B opens invite/link.
6. B enters name if needed.
7. B joins same room through relay.
8. A sends message.
9. B sees original + translated message.
10. B replies.
11. A sees original + translated reply.
12. Both reload.
13. Room and transcript remain.
14. Planned S4 remains the only visible conversation surface.
15. No duplicate transcript/composer/relay owners exist.
16. No old app boots independently.

Pass = all sixteen. Anything less = fail, roll back, graveyard, plan bump, rebuild.

---

## 10. Stop conditions

Stop immediately if any of the following occurs:

- The build drifts from `talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html`.
- Relay-backed behavior is replaced with fake local simulation.
- A hidden old app boots.
- An old app owns final navigation.
- Two transcript owners exist.
- Two composer owners exist.
- Two relay/session owners exist.
- Execute cannot demonstrate positive bilingual messaging.
- The implementation cannot state exactly which proven artifact behavior was preserved/adapted, and from where.
- The proposal expands beyond Plan → Execute → Test.

---

## 11. Copyable builder prompt

> Read `talkbridge/TALKBRIDGE-MASTER-PLAN-v6.html` first — it controls all final surfaces, navigation, roles, UX, scope, and acceptance.
> Read `talkbridge/TALKBRIDGE-HOW-WE-PREVAIL.md` second — it controls how you deliver.
> Audit `bridge-turn07-post-ship.html`, `bridge-turn08-base.html`, `test.html`, and `2vid.html`. Identify exactly which proven behavior each one owns.
> Produce the Plan-stage extraction map before writing any code.
> Then Execute only the first package: real relay-backed S4 bilingual messaging across S0/S1/S2/S3/S4/S4a/S10, with single ownership per concern.
> Then Test with two real clients per the Test gate in this document.
> Do not invent fake local transport. Do not import or boot a hidden old app. Do not create more stages than Plan → Execute → Test.
> When implementation is requested, generate a patch/diff only for the requested Execute package.

---

*The route exists because the master plan documents the destination and the source artifacts prove the capability. What remains is disciplined extraction, single ownership, and positive proof.*
