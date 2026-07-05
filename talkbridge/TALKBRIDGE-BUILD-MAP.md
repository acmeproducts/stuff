<!-- v5.9.0.1 -->
# TALKBRIDGE — TOP-DOWN BUILD MAP (Turn 09 reset lineage)
**Version: 1.0 | 2026-07-05 | Governing assembly document. Supersedes the Turn-08 merge-in-place approach for build strategy; product intent and process rules in the Master Plan still apply.**

## Method (owner-directed 2026-07-05)
End state designed first. Decomposed to modules. Every module inventoried against the source inputs: which file supplies it, whether it moves verbatim or needs refactor, and its contract (what goes in, what comes out, what it never does). Only after the inventory is complete and gap-free does assembly begin — as a strict layering sequence into one container, one module at a time, phone-gated. No module is written from scratch if a working one exists. No two modules may own the same job (overlap is structurally impossible: one job, one module, one source).

## The end state (what the finished app is)
One installable app. Room list → rooms. Each room: one transcript, one compose strip, one phrasebook, presence, receipts. Text chat translates both ways. A call (voice or video) is a layer that opens over the room; everything spoken is translated live and, at hang-up, sits permanently in the room's transcript. Joiners land in their one room only. Light theme everywhere. No accounts.

## Module decomposition and source inventory

| # | Module (one job) | Source of truth | Move | Notes |
|---|---|---|---|---|
| M1 | App shell: boot, screens, room list, room create, invite link/QR | test.html | verbatim | proven; start-screen standard locked |
| M2 | Room store: sessions, identity, roles, message persistence | test.html | verbatim | spine of everything |
| M3 | Relay transport: connect, presence, receipts, backfill | test.html | verbatim | already app-level, already logs |
| M4 | Chat transcript surface + bubbles | test.html | verbatim | text-only per owner ruling |
| M5 | Typed-chat translation + language detect | bridge T07 post-ship | refactor: extract, single path | replaces shell's own translate; one path only |
| M6 | Compose strip incl. "/" and ".." search predicate | bridge T07 post-ship | refactor: mount in shell composer slot | guard on Enter AND send |
| M7 | Phrasebook — data, sync, usage, query, cards, overlay | bridge T07 post-ship | verbatim (device-confirmed, frozen) | shell's legacy PB deleted; one store |
| M8 | Call engine: WebRTC, TURN, recovery, ring/accept/decline | bridge T07 post-ship | verbatim | wakes only on call start |
| M9 | Live speech: Deepgram STT + live translation during call | bridge T07 post-ship | verbatim | exists only inside M10 |
| M10 | Call layer UI: overlay over the room, video/voice, controls | 2vid.html look + bridge engine | refactor: restyle light theme | mounts over M4; never a separate screen |
| M11 | Transcript merge-back: spoken lines land in room transcript at hang-up | new (small) | build | the only genuinely new module; the hat trick |
| M12 | Diagnostics: unified log, crash capture, auto-upload | Turn-08 work | verbatim | already proven; ships in the container from layer 1 |
| M13 | Keys/first-run: Deepgram, TURN, PAT | container-turn08-base | verbatim | already built once, carries over |
| M14 | Joiner isolation | test.html + routing rule | refactor: enforce at data layer | no list, no create |

## Assembly sequence (each layer = one build, one phone test)
L1  M1+M2+M12 — empty container boots, rooms exist, logging live
L2  M3 — two devices see each other in a room
L3  M4+M5 — translated text chat both ways
L4  M6+M7 — one compose strip, one phrasebook, old PB never existed here
L5  M13 — keys onboarding
L6  M8 — ring/accept/decline between devices
L7  M9+M10 — live translated call over the room, light theme
L8  M11 — hang up, everything spoken sits in the chat
L9  M14 — joiner lockdown
Then Ship: notifications, dispose, receipts polish. Post-ship: full regression, freeze.

## Rule
No layer starts until every module it contains has its contract confirmed against its source file — extraction verified by fingerprint, not by intention. A gap found in inventory stops assembly, never gets improvised around.
