# devstream-backlog.md — Governance & Source of Truth

App: `devstream.html` — standalone multi-thread orchestrator. NOT a session-manager version; borrows the v2.9.2 UI shell patterns only. Own lineage starting v1.0.

Deploy target: `https://acmeproducts.github.io/stuff/devstream.html`
Test target: `https://acmeproducts.github.io/stuff/devstream-test.html`

## Status
- Current release: v1.0 b80 on devstream-test.html (2026-10-21)
- Stage: TEST (b80)

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
Cross-repo status aggregation; push notifications.

Parallel-run limits / file-lock queueing were removed from out-of-scope by the owner on 2026-09-24 and are governed by the project scheduler contract below.

---

# 2026-09-24 — Project storage, recovery, and scheduler contract

## Owner scope
1. CONFIG exposes one subdirectory for project code and plan files.
2. Soft-deleted projects live under a collapsible **Deleted projects** chevron at the top of the project rail. Each deleted project card offers **Restore** or **Delete permanently**; permanent deletion requires an explicit “Are you sure?” confirmation.
3. A project with no live tabs still shows **+** to create a tab. If deleted tabs exist, it also shows **↻** to restore the most recently deleted tab.
4. Tasks may stack/queue inside each project. A project has at most one active writer at a time; different projects may execute in parallel through the existing four-worker pool.

## Baseline score before change
| Gate | Before | Required after |
|---|---:|---:|
| Configurable project code/plan directory | 0 | 1 |
| Deleted-project recovery in project rail | 0 | 1 |
| Blank-project deleted-tab restore affordance | 0 | 1 |
| Per-project serialization with cross-project parallelism | 0 | 1 |

The prior worker pool already supported four concurrent thread jobs, but it treated threads as the concurrency boundary. Two tabs from one project could therefore write the same project code/plan concurrently. The new concurrency boundary is the project.

## Acceptance gates
- **DS-G34-1 Storage:** Settings contains **Project code + plan subdirectory**. New generated project files and their same-name plans land under that directory. Existing projects are not moved.
- **DS-G34-2 Deleted projects:** deleting a project moves it out of the live project list and into the collapsible rail recovery section; Restore returns it; Delete permanently shows the irreversible confirmation before deleting thread-history records. Project code/plan files remain untouched.
- **DS-G34-3 Blank project:** after all tabs are soft-deleted, the tab strip remains visible with **+** and **↻**. **↻** restores the most recently deleted tab.
- **DS-G34-4 Project queue:** while one task for Project A is active, later tasks for Project A queue FIFO instead of starting a second writer. Project B/C/D tasks may use the remaining worker slots concurrently. Global worker ceiling remains four.
- **DS-G34-5 Preservation:** provider configuration, per-thread engine/model selection, plan continuity, attachments, web search, Coach mode, debug, soft-deleted tabs, and the existing four-worker engine pool remain intact.

## Graveyard additions
- **G-DS-01 — Parallel writers inside one project:** do not restore thread-level concurrency that allows two tabs in the same project to write the same code/plan simultaneously.
- **G-DS-02 — Hard-coded `projects/` creation root:** do not hard-code the project artifact root; new generated project artifacts use the configured subdirectory.
- **G-DS-03 — Hiding the tab strip when a project is blank:** do not hide the only recovery/create controls when all tabs are deleted.

---

# 2026-09-27 — Automatic internet access + Session Manager tab drag/drop

## Owner scope
1. Internet/web access is enabled automatically; the owner does not have to enable it tab-by-tab.
2. Restore the Session Manager v3 tab drag/drop behavior: reorder tabs within a project and move tabs between projects, including the touch/pen long-press interaction.

## Reference behavior
`session-manager-v3.html` is the interaction reference: desktop HTML5 drag/drop, project rows as cross-project drop targets, positional tab drop zones, and long-press touch/pen drag with sidebar reveal at the left edge.

## Baseline score before change
| Gate | Before | Required after |
|---|---:|---:|
| Existing undefined + new threads default web ON | 0 | 1 |
| Persisted within-project tab reorder | 0 | 1 |
| Cross-project tab drag/drop | 0 | 1 |
| Touch/pen long-press drag | 0 | 1 |

## Acceptance gates
- **DS-G35-1 Web default:** any existing thread with no explicit web setting behaves as web ON; every newly created project/tab stores `web:true`. An explicit manual OFF remains respected.
- **DS-G35-2 Within project:** dragging a live tab to a positional drop zone changes and persists that project's tab order in the SOT.
- **DS-G35-3 Between projects:** dragging a non-busy tab onto another live project moves the tab and its chat history, retargets its code/plan to the destination project, updates SOT/order, and retires the old thread record. A tab with active/queued work is not movable across projects.
- **DS-G35-4 Touch parity:** touch/pen long-press arms tab drag; movement can reveal the mobile sidebar at the left edge; dropping on a project or tab position performs the same operation as desktop.
- **DS-G35-5 Preservation:** b34 configurable project directory, deleted-project recovery, blank-project +/↻ recovery, one-writer-per-project queue, four-worker cross-project parallelism, provider/model settings, attachments, Coach mode, debug, and manual web toggle remain intact.

## Graveyard additions
- **G-DS-04 — Opt-in web as the default:** do not make ordinary Devstream work require the owner to turn web access on for each tab.
- **G-DS-05 — Thread-only drag without touch parity:** do not restore desktop-only drag/drop; Session Manager v3 touch/pen behavior is part of the requirement.
- **G-DS-06 — Moving an active/queued writer across projects:** do not allow a move that can bypass the project concurrency boundary.

---

# 2026-09-27 — Session Manager v3 interaction parity correction

## Owner report
The b35 drag/drop implementation did not work on the owner's Android device. The required reference is the actual `session-manager-v3.html` interaction model, not merely a partial tab-move implementation.

## Required parity
- Tabs: drag/reorder inside a project; drag to another project; long-press menu with **Rename, Assign, Customize, Download, Share**.
- Projects: reorderable; long-press menu with **Rename, Customize, Download, Share**.
- Touch: movement after the drag arm begins drag; a stationary long-press opens the context menu.
- Customization persists in SOT. Downloads are browser downloads. Share uses Web Share with clipboard fallback.
- Existing web-default-ON and b34 scheduler/storage/recovery behavior remain unchanged.

## Acceptance gates
- **DS-G36-1 Tab DnD:** touch/pen drag reorders tabs and can assign a tab to a project; desktop HTML5 DnD remains.
- **DS-G36-2 Tab menu:** stationary long-press exposes Rename / Assign / Customize / Download / Share.
- **DS-G36-3 Project DnD:** project cards are reorderable and order persists in SOT.
- **DS-G36-4 Project menu:** stationary long-press exposes Rename / Customize / Download / Share.
- **DS-G36-5 Preservation:** internet defaults ON, project queue safety, four-project worker pool, soft-delete recovery, configurable storage, provider/model controls, attachments and Coach mode remain intact.

## Graveyard additions
- **G-DS-07 — Hold-to-drag only:** stationary long-press opens the action menu; movement is drag.
- **G-DS-08 — Partial Session Manager parity:** do not ship tab movement without the owner-specified tab/project menus and project ordering.

---

# 2026-09-27 — Literal Session Manager v3 interaction transplant

## Owner report
b36 was rejected. Its context menu was a homemade approximation: customization asked for CSS strings through browser prompts, and Android drag/drop still did not work. The owner requires a lift-and-shift of the proven Session Manager v3 interaction, not another redesign.

## Change
- Replaced the b36 menu implementation with the Session Manager v3 two-pane/stacked context menu structure and controls.
- Customize now uses native color pickers and numeric font-size controls exactly like Session Manager v3; no CSS-value prompts.
- Replaced touch tab DnD with the Session Manager v3 gesture state machine: 350ms hold, 220ms movement arm, 12px slop, drag ghost, positional drop zones, left-edge sidebar reveal, and double-tap context menu.
- Replaced project touch reorder with the Session Manager v3 project gesture state machine and before/after targets.
- Native desktop project DnD now uses Session Manager v3 before/after semantics.
- Devstream persistence/build semantics are retained behind those transplanted interactions.

## Acceptance
- **DS-G37-1 Menu visual/interaction parity:** tab and project menus use the Session Manager v3 main/leaf layout; Customize exposes color controls and font size directly.
- **DS-G37-2 Tab touch DnD parity:** source gesture constants and state machine are present and drop through the existing Devstream move/reorder functions.
- **DS-G37-3 Project touch DnD parity:** source project gesture constants/state machine and before/after target behavior are present.
- **DS-G37-4 No browser prompt customization:** customization contains no `prompt()` calls.
- **DS-G37-5 Preservation:** web default ON, queue safety, four-project worker pool, recovery, storage config, providers, attachments and Coach mode are unchanged.

## Graveyard
- **G-DS-09 — Homemade context menu/customizer:** rejected. Do not replace the Session Manager v3 menu with prompt-based or visually simplified substitutes.
- **G-DS-10 — Custom touch DnD semantics:** rejected. Use the proven Session Manager v3 touch gesture state machine.

---

# 2026-09-27 — Automatic thread-write reconciliation

## Owner report
Devstream surfaced a thread-file write conflict after another write landed first. Compatible thread races must reconcile automatically rather than requiring the owner to refresh and retry.

## Cause
`putFileSafe()` serialized writes inside one browser instance but treated a newer GitHub SHA from another writer as fatal, even for append-oriented thread conversation data.

## Change
- Thread writes merge remote and local messages by the existing message signature, retain chronological order, and save against the current SHA.
- A GitHub 409 on a thread write refetches, merges, and retries up to three attempts.
- Non-thread files retain strict stale-SHA conflict protection.
- Reconciliation uses the existing in-app Debug log.

## Acceptance
- **DS-G38-1:** stale thread SHA triggers reconciliation instead of an immediate refresh/review error.
- **DS-G38-2:** remote-only and local-only messages both survive.
- **DS-G38-3:** duplicate messages are deduplicated through `msgSig()`.
- **DS-G38-4:** 409 thread races retry at most three times.
- **DS-G38-5:** non-thread stale writes still fail closed.
- **DS-G38-6:** b37 menus/DnD and existing scheduler/web/storage behavior remain unchanged.

---

# 2026-09-27 — Donor-exact mobile gesture correction

## Owner-verified donor behavior
Screenshots and Session Manager v3 source establish the interaction contract:
- **Context menu:** double-tap a tab/project. It is not a hold gesture.
- **Drag:** tap-and-hold. At 350ms the dragged tab/project name appears immediately in a floating ghost.
- **Landing feedback:** the destination project or tab insertion zone highlights while dragging.
- **Drop:** release on the highlighted destination to persist the move/reorder.
- **Menu appearance:** use Session Manager v3 context-menu CSS and hierarchy without Devstream legacy button overrides.

## b39 defect
b39 incorrectly changed stationary hold into context-menu activation. Devstream also retained old `#tabContext button` CSS that overrode the transplanted donor menu, causing the visible separators/sizing shown in the owner's screenshot.

## b40 change
- Restored the donor tab gesture state machine: 350ms hold enters drag and creates the named ghost; double-tap opens context.
- Restored the donor project gesture state machine with the same hold-to-drag / double-tap-menu split.
- Preserved donor target highlighting for project destinations and tab insertion zones.
- Removed the legacy Devstream `#tabContext button` rules that were overriding donor menu styling.
- Restored the donor portrait `.tabContext.stacked` rule.
- Preserved b38 automatic write reconciliation and all queue/storage/web/provider behavior.

## Acceptance
- **DS-G40-1:** no hold-to-context path exists for tabs or projects.
- **DS-G40-2:** 350ms hold creates a visible ghost containing the tab/project name.
- **DS-G40-3:** double-tap opens tab/project context.
- **DS-G40-4:** drag hover highlights project target or tab insertion zone.
- **DS-G40-5:** legacy `#tabContext button` override is absent; donor context classes control appearance.
- **DS-G40-6:** existing persisted move/reorder and b38 reconciliation remain intact.

## Graveyard
- **G-DS-13 — Hold opens context menu:** rejected; donor behavior is double-tap context, hold-to-drag.
- **G-DS-14 — Legacy generic #tabContext button styling:** rejected; it corrupts the donor context-menu appearance.

---

# 2026-10-21 — b80 the message box never grows; it scrolls

## Owner report
"The box shouldn't grow, only scroll."

## Change
- The message box is a fixed two lines tall. Longer text scrolls inside it. The automatic growing is removed, so the compose area never changes height while typing, on focus, or after sending.

## Acceptance
- **DS-B80-1:** the box keeps one fixed height whatever is typed (including many lines) and scrolls instead; the compose area height never changes.

---

# 2026-10-21 — b79 the message box no longer flickers on focus

## Owner report
"The input keeps flickering because on focus it stays 'Enter sends · Shift+Enter newline' … which is unnecessary."

## Change
- Removed the strip under the message box (the "Enter sends · Shift+Enter newline" hint). It was the only thing left in it (engine and web moved to Config → Advanced in b75), and it made the box change height when the keyboard opened.
- The box now stays the same height when focused. (The real flicker: it started two lines tall, then jumped to one line the moment you typed. It now starts one line tall and grows only as you type more lines.)

## Acceptance
- **DS-B79-1:** the message area has no hint strip; focusing the box does not change the height of the compose area.

---

# 2026-10-21 — b78 VOICE MODE, ONE COMPLETE DESIGN (replaces the b76/b77 pieces)

## Owner report
Listening keeps answering "I did not catch that, tap to try again"; it should transcribe what it hears and offer a (re)submit button with editing; the screen must be smarter (if something was delivered there must be an Open app button that launches the app); mobile first, no scrolling; and: "it keeps piecemealing every feature, which buys me nothing; it has strayed away from the basic commands we already agreed were standard."

## What went wrong (owner is right)
Voice mode was shipped in separate pieces (switch, speaker, talk button, watch screen) and never as one working flow; it also reimplemented its own small set of buttons instead of reusing the standard commands the app already has (Stop, Run again / Continue, Open your app, Undo, Something's wrong, Check it works, the chips). The listening failure is most likely caused by the sound graph asking the microphone for a second time while speech recognition was using it (the second request can starve recognition on Android and returns no words).

## The design (one screen, one flow; this replaces the b76/b77 voice descriptions)
**The voice screen mirrors the standard task banner. Same state, same actions, same chips — spoken or tapped.** No scrolling at any size.

States (exactly one is shown):
1. **Ready** — big Talk button, the coach's last reply (2–3 lines; tap it for the full text), the chips.
2. **Listening** — Talk button red ("tap when done"), live sound graph, live transcript. If the browser ends listening early with no words it restarts by itself (up to 3 times) so a pause or a slow start does not lose the turn.
3. **Review** — what was heard appears in an **editable box** with **Send**, **Talk again** (adds to it) and **Clear**. Nothing is sent until Send, except the standard commands below, which act at once. If nothing was heard the box opens empty with "I couldn't hear anything — tap Talk, or type here".
4. **Working** — big **Stop**, what it is doing and for how long. (Same as the banner.)
5. **Delivered** — big **Open app** (opens the built app in a new tab), Share, Undo, Problem, the chips, and a smaller Talk button.
6. **Couldn't finish** — the plain reason and a big **Try again**; **Waiting to start** — big **Continue**.
- **Standard voice commands** (work in any state, spoken or typed in the review box): *stop · try again / continue · open app · share app · undo · something's wrong · check it · keyboard · repeat that* plus the chip words (*build it · questions · more ideas …*). After a delivery the screen reads "Say: open app, build it, or more ideas."
- **Sound graph:** driven by what the browser itself reports (sound heard, speech heard, words arriving), not by a second microphone request.
- **Diagnostic line** under the transcript shows what the browser reported ("mic on · audio · sound · speech · ended" or the error), so a device that still hears nothing can be diagnosed from a screenshot.
- **Fits the screen with no scrolling** at watch (240×240), small watch (320×320), phone (360×640) and large phone sizes: chips shown 1 / 2 / 3 by height, the reply clamped or hidden on very small heights, the Talk button sized from the screen.
- Keeps from b77: tap-and-hold on the Talk button opens the transcript window (X and Copy), the speaker toggle, Share app sheet, `?watch=1`, voice project creation, header microphone button, screen stays awake.
- **Process rule:** voice mode ships as this single design. Further changes to it are fixes against this list, not new features.

## Acceptance
- **DS-V-1:** listening never uses a second microphone request; with no words the screen says so and opens the empty editable box.
- **DS-V-2:** after listening the words appear in an editable box with Send / Talk again / Clear; Send submits; standard commands act at once.
- **DS-V-3:** the screen shows the right single state (Ready, Listening, Review, Working, Delivered, Couldn't finish, Waiting) with the same actions as the banner, including Stop, Open app, Try again, Continue, Undo, Problem, Share.
- **DS-V-4:** no vertical scrolling at 240×240, 320×320, 360×640 and 420×800 in every state.
- **DS-V-5:** every standard command works by voice and in the box.

---

# 2026-10-18 — b77 R3 REVISED: the watch-first voice screen (replaces R2's listen mode)

## Owner report
"This really doesn't do what I needed — I'm dealing with a watch face. There needs to be a super simple way to switch over to voice mode, the talk button has to be super prominent with a visual showing like a sound graph that words are being detected; in fact it should be transcribing, so that if you tap and hold the talk button a modal opens with the transcripts with an X to close it and a copy button. This needs to be a watch-first mode."

## Spec (supersedes sections C/E of the draft where they differ)
- **One voice screen** (full screen, used on a watch by default and on any device via the microphone icon). It replaces R2's listen mode inside the composer. Nothing else competes for attention:
  1. Top row: a big **keyboard** button (back to normal) and a one-line status ("project · Working / Ready / Needs you").
  2. The **Talk button**: a huge circle (about three-quarters of the screen width), the main thing on screen. Tap to start; tap again (or a pause) to send.
  3. A **live sound graph** under/inside it that moves while it listens, driven by the microphone level; where the browser will not share the microphone with speech recognition, the bars pulse each time new words are detected, so the person always sees that it is hearing them.
  4. The **live transcript** of what is being heard, in large text, updating as words arrive.
  5. The coach's **latest reply** in plain words (also read aloud when the speaker is on), then the **chips** as large buttons (and spoken: "Say: …").
  6. A bottom row: **speaker** (on by default here), **Open app**, **Share app**, **More** (the normal layout).
- **Tap and hold the Talk button** opens a **transcript modal**: the words being heard right now at the top, then recent things the person said (newest first, last 30, kept on this device), an **X** to close and a **Copy** button (copies all of it).
- **Getting there:** a watch-sized screen opens straight into the voice screen. On any other device the microphone icon in the chat header (always visible) and the one at the top of the left rail switch to it; the big keyboard button leaves it. A bookmark ending `?watch=1` forces watch mode (and `?watch=0` clears it) for watches whose browser reports a larger screen than they have. Detection also treats a user-agent containing "Wear" or "Watch" as a watch.
- **No project yet:** the screen asks "Say a name for your first project" and what is said becomes the project name, then the five-part question is asked aloud.
- **Open app** opens the project's built app link. **Share app** opens the phone's share sheet where the browser has one (the person picks WhatsApp, Gmail, Messages…); otherwise a sheet with WhatsApp, Email, Messages and Copy link.
- The screen stays awake while the voice screen is open.
- Limits: speech recognition, speech output, the share sheet and sharing the microphone with speech recognition depend on the watch browser and are unverified until tried on the watch.

## Acceptance
- **DS-R3-1:** on a watch-sized screen (or with `?watch=1`) the app opens in the voice screen; the microphone icon in the chat header switches any device to it; the keyboard button leaves it.
- **DS-R3-2:** the Talk button is the largest element; while listening a sound graph animates and the live transcript shows the words as they arrive.
- **DS-R3-3:** tap-and-hold on the Talk button opens the transcript modal with live words, history, X and Copy; a normal tap still starts/stops listening.
- **DS-R3-4:** the reply and chips show on the voice screen; speaking a chip's words taps it; the reply is read aloud.
- **DS-R3-5:** Open app opens the built app; Share app uses the share sheet or offers WhatsApp / Email / Messages / Copy link.
- **DS-R3-6:** with no project, speaking a name creates the project and asks the five-part question.

---

# 2026-10-18 — b76 R2: microphone/keyboard switch, speaker, read-aloud, voice chips

Implements sections C and D of the approved spec (plus the device detection it needs).

## Change
- **Switch** at the top of the left rail: keyboard icon (as before) / microphone icon. Remembered per device.
- **Listen mode (microphone):** the text box is replaced by a large **Tap to talk** button (tap to start; it sends when you pause, or tap again). Chips stay visible, with bigger buttons. "Type one message instead" is available. If the browser has no speech input it says so and offers the keyboard's own mic key.
- **Voice commands:** saying a chip's say-words ("build it", "questions", "more ideas") taps that chip. A close-but-not-exact word ("blue") asks "I heard … Did you mean …?" (on screen and aloud) with Yes / No-send-what-I-said. Anything else is sent as a normal message.
- **Speaker icon** in the compose strip: muted with a slash by default (unmuted by default in listen mode and on a watch-sized screen), remembered per device. When unmuted, new coach replies are read aloud in plain words (no links, commit ids, "Diff/Test/Plan" lines, or the CHIPS line); history is never read when a tab opens. In listen mode the chips are then read: "Say: build it, questions, or more ideas." Tapping the speaker, Tap to talk, or a chip stops speech.
- **This device:** device class (watch under 300 px, phone, tablet, desktop) from screen size and touch; Config → "This device" shows what was detected and lets the person override it. First open on a watch-sized screen starts in listen mode with the speaker on.
- Limits: speech input and output use the browser's built-in voices; whether a given watch browser supports them is unverified (R3 starts by checking).

## Acceptance (from the spec)
- **DS-SPEC-4:** mic/keyboard switch at the top of the left rail, remembered per device; mic mode shows Tap to talk.
- **DS-SPEC-5:** speaker defaults muted with a slash (unmuted in listen mode); replies read aloud without code, links or technical lines; chips verbalized in listen mode; speaking a chip's words triggers it.

---

# 2026-10-17 — b75 R1: always-coach, the first question, specific chips

Implements section A and B of the approved spec below.

## Change
- No Coach switch on project cards or in New project; every project (including old ones) is coach. Typing always overrides the chips.
- Engine/model and web search for the current tab moved to Config → Advanced.
- A new project opens with the fixed five-part question; nothing runs until the person answers. Their answer is shown, "Hold on — I'm creating the plan right now…" appears at once, and the plan run receives the person's own words. The plan now includes OPEN QUESTIONS, each with a Recommendation.
- New project keeps one way to adopt an existing file: "Use an existing file instead…".
- Agent replies end their header with a CHIPS line (label | say | prompt). The app and the cloud runner read it, keep it out of saved files, store it on the reply, and show those as the chips. After a plan the standard three are used if the model omits them: Build it now with your recommendations / Answer your questions first / More ideas. If a reply has no chips the older suggestions still show.

## Acceptance (from the spec)
- **DS-SPEC-1:** no Coach switch anywhere; typing overrides chips.
- **DS-SPEC-2:** new project → five-part question first; after the answer "Hold on…" at once; plan has open questions with recommendations.
- **DS-SPEC-3:** after the plan, project-specific chips including build-with-recommendations and answer-questions-first, taken from the agent's CHIPS.

---

# 2026-10-17 — SPEC (DRAFT, NOT BUILT): always-coach, specific chips, voice mode, watch mode

Status: **APPROVED by owner 2026-10-17 ("all yes" to Q1–Q7 and the "this device" line). R1 BUILT as b75; R2 BUILT as b76 (its listen mode is replaced by R3); R3 REVISED by the owner 2026-10-18 and built as b77.** Owner asked that the spec be fixed in the plan first.

## Owner's words (source of truth)
1. "It's always in coach mode so there's no need for the toggle because coach mode can always be overwritten by what you type. Coach mode should be very specific: when you first create the project it should ask you a question — tell me about this project, what are your objectives, what does it look like, what are some things for me to consider, what open questions do you have — and let the person answer in freeform. Then it should respond 'hold on I'm creating the plan right now…'. Once the plan is created the chips need to be a lot more specific towards an action: proceed with the build, or I have questions before I can build — which should offer 'answer questions' or 'just go with my recommendations'. The chips need to be less generic and more specific to the project."
2. "A switch at the top of the left rail: a keyboard icon or a microphone icon. Keyboard stays as is. Microphone mode — the main intention is that the watch can be just a voice input."
3. "A speaker icon in the chat compose strip, defaulted to have a slash through it; tapped to unmute, the system responses in the transcript are read out loud. If listen mode (microphone switch on) the chips are still shown but verbalized: for build it say 'build it', for questions say 'questions', for more ideas say 'more ideas'. In microphone mode speaker output is unmuted by default. There should also be an open app button or a share app button that lets the watch user either open the app or share the link, choosing WhatsApp, Gmail, messaging, etc."

## Spec

### A. Coach is the only mode (release R1)
- Remove the Coach switch from project cards and the "Coach mode" option in New project. Every project behaves as coach. Existing projects with coach off become coach. What the person types is always sent as written and overrides any suggestion; chips are only shortcuts.
- Technical controls currently hidden by coach mode (engine/model chip, web toggle, diagnostic meta) stay hidden in the chat; they move to Config → Advanced (per-project engine, web on/off). [open question Q1]
- **New project, first turn.** After the name is entered, the thread opens with one fixed coach message (not AI-generated, shown instantly): "Tell me about this project. What are your objectives? What does it look like? What should I consider? What open questions do you have? Just tell me in your own words." Freeform answer (typed or spoken). Replaces the "Project goals" pop-up.
- **After the answer:** immediately show "Hold on — I'm creating the plan right now…" (local message, the working banner shows progress). The plan run uses the person's answer as the goals text (same plan structure as today) and must also write into the plan: a short list of OPEN QUESTIONS and, for each, a RECOMMENDATION (default answer).
- **When the plan is saved:** the coach replies in plain words: one-paragraph summary of what it understood, the count of open questions, and the next-step chips (below).

### B. Specific chips (release R1)
- The agent ends every reply with a machine-readable block the app parses and hides from the transcript: `CHIPS:` followed by 2–4 lines `label | say | prompt` where `label` is the button text, `say` is the one-or-two-word spoken name, `prompt` is the message sent when tapped. The chips must name the project's own next actions (e.g. "Build the title screen", not "Make the next part"). The app falls back to today's generic chips only if the block is missing or malformed.
- **After the plan:** if open questions exist: `Build it now with your recommendations` · `Answer your questions first` · `More ideas`. If none: `Build it` · `More ideas` · `Change the plan`.
- **"Answer your questions first"** → the coach asks the open questions one at a time, each with its recommendation and the chips `Use your recommendation` / `Skip` / `Tell me more`; answers (typed or spoken) are written to the plan's decision log. **"Build it now with your recommendations"** → coach records the recommendations as decisions, then builds.
- After a build: chips come from the plan's next item and the agent's STATE next step, plus `Check it works`, `More ideas`. After a failure: `Try again` / `What happened?`. Chips update live as the run state changes.

### C. Input mode switch ⌨ / 🎤 (release R2)
- Top of the left rail: a two-position switch, ⌨ (keyboard, today's behavior, default) and 🎤 (listen mode). Remembered per device (browser storage), not shared between devices. A watch-sized screen defaults to 🎤 on first open (device detection by screen size and touch; Config shows "this device: watch/phone/tablet/desktop" with a manual override).
- **Listen mode UI:** the text box is replaced by one large **Tap to talk** button (tap to start, tap again or stop-talking to send; "Listening…" state; shows the recognized words and sends them as a normal message after a 1.5 s pause or on tap). A small ⌨ link switches to typing for one message.
- **Voice commands:** while chips are showing, saying a chip's `say` word ("build it", "questions", "more ideas", "try again") taps that chip. Anything else is sent as a normal message. If the match is unclear the app repeats what it heard and asks "Is that right?".
- Chips remain visible in listen mode (large tap targets) and are also read aloud (see D).
- Speech input uses the browser's built-in recognition (no extra service or key). Where the browser has none, the mic button says so and falls back to the keyboard's own dictation key.

### D. Speaker control and read-aloud (release R2)
- A speaker icon in the compose strip, left of the text box / talk button. **Default: muted, shown with a slash.** Tap toggles; remembered per device. In listen mode (and on a watch-sized screen) the default is **unmuted**.
- When unmuted, every new system (coach/agent) message is read aloud as it arrives, using the browser's built-in voice. Read-aloud text is the plain coach text only: no code, links, commit ids, or technical lines. Never reads the person's own messages. Tapping the speaker, the mic, or any chip stops speech immediately.
- In listen mode after a message is read, the chips are read as a short prompt: "Say: build it, questions, or more ideas." (the `say` words, max 4).
- Browsers only allow speech after a first tap on the page; the first tap on 🎤 or 🔊 unlocks it. If the device has no voice, the speaker icon shows disabled with a one-line reason.

### E. Watch mode (release R3)
- When the device class is watch (or listen mode on a very small screen) the app shows only: current status line (Working / Ready / Needs you with the plain next step), the **Tap to talk** button, the speaker toggle, the chips as large buttons, and two buttons: **Open app** and **Share app**.
- **Open app** opens the project's built app (its play link) in the browser. **Share app** uses the system share sheet when the browser offers one (the person picks WhatsApp, Gmail, Messages, etc.); where it does not, three explicit buttons appear: WhatsApp, Email, Messages, each pre-filled with the link and a one-line message. [open question Q3]
- Lists, settings and the project rail are not shown on a watch; the person can still reach them through "More" (opens the normal layout).

### F. Build order and acceptance
- **R1 — coach only + specific chips + first-turn interview** (A, B).
- **R2 — voice: ⌨/🎤 switch, speaker, read-aloud, voice chips** (C, D) on phone first.
- **R3 — device detection + watch mode + Open/Share app** (E). Watch speech support is unverified; R3 starts with a "this device" check page to confirm what the watch browser reports and supports (speech recognition, speech output, share sheet) before the layout is built.
- **DS-SPEC-1:** no Coach switch anywhere; typing always overrides chips.
- **DS-SPEC-2:** creating a project shows the five-part question first; after the answer "Hold on — I'm creating the plan right now…" appears at once; the plan contains open questions with recommendations.
- **DS-SPEC-3:** after the plan, chips name project-specific actions, include "build with your recommendations" and "answer your questions first" when open questions exist; chips come from the agent's CHIPS block.
- **DS-SPEC-4:** ⌨/🎤 switch at the top of the left rail, remembered per device; 🎤 shows a Tap to talk button.
- **DS-SPEC-5:** speaker icon defaults to muted with a slash (unmuted in listen mode); when unmuted new coach messages are read aloud without code, links or technical lines; chips are verbalized in listen mode and a spoken "build it / questions / more ideas" triggers the matching chip.
- **DS-SPEC-6:** on a watch-sized screen only status, talk, speaker, chips, Open app and Share app are shown; Share app offers the system share sheet or WhatsApp / Email / Messages.

### G. Open questions (owner to confirm; recommendation first)
- **Q1** Where do engine/model and web on/off live once the coach switch is gone? *Recommend: Config → Advanced.*
- **Q2** Listen mode: tap-to-talk, or hands-free (keeps listening after it speaks)? *Recommend: tap-to-talk first; hands-free as an option later (battery, privacy, accidental triggers).*
- **Q3** "Open app / Share app" = the project's built app link (not DevStream itself)? *Recommend: yes, the built app; DevStream itself is reached via More.*
- **Q4** Speaker default on tablet and desktop: muted. *Recommend: muted everywhere except listen mode/watch.*
- **Q5** Voice language: the device's own language and voice. *Recommend: yes.*
- **Q6** Max chips: 4 shown, 4 spoken. *Recommend: yes.*
- **Q7** Existing projects keep their current plan; the five-part question only applies to new projects. *Recommend: yes.*

---

# 2026-10-16 — b74 an invite survives bookmarks (Galaxy Watch)

## Owner report
The invite works browser to browser, even Android to iPhone, but not Android to a Galaxy Watch using Samsung Internet and its bookmark function.

## Cause (most likely; not testable on a watch from here)
After joining, the app removed the invite from the page address. A bookmark made then (and synced to the watch) has no invite in it, so a device opened from that bookmark has nothing to join with and shows the keys screen. Sending the link itself worked.

## Change
- The invite now stays in the address bar after joining, so any bookmark of the page carries it. Reopening the same address on a joined device just carries on (no second server call).
- Config on a device with no setup now has "Have an invite link? Paste the link or code" with a Join button, for any device whose address lost the invite.
- When an invite cannot be used, the message at the top of Config now also shows the browser name and whether the browser allows saving (so a screenshot from the watch shows what is blocking).

## Limits
- Not verified on a watch. A watch browser is small and limited; if it still fails the message above will say why.

## Acceptance
- **DS-B74-1:** after joining, the address still contains the invite; reopening it keeps guest mode without another server call.
- **DS-B74-2:** opening that address (a bookmark) on a brand-new device joins as a guest.
- **DS-B74-3:** a device with no invite and no setup can join by pasting the link or code.

---

# 2026-10-16 — b73 invite links that cannot fail silently

## Owner report
A person opened the invite link and "it just went straight to config and it wants keys" instead of starting to work.

## Findings
- Could not reproduce on the real runner engine (local workerd) with a real browser: invite → guest mode → no Config. The runner's side works.
- Probable causes on the recipient's device: an old cached copy of the app (no invite support), an invite that the browser could not fetch (blocker, network), or a device that already had its own setup (the invite was ignored).
- Whatever the cause, the app showed the keys screen with no explanation.

## Change
- Every copied link is now a fresh address (`?v=<time>&invite=<code>`), so a cached old copy of the app cannot be served.
- If the invite cannot be used the app says why at the top of Config (could not reach the server / invite no longer valid / browser would not save it) with a **Try the invite again** button; the invite is remembered for the retry.
- A device that already has its own setup now asks "Use the shared invite instead?" instead of ignoring the link; if yes it becomes a guest and Config offers "Use this device's own setup instead" to switch back (the owner setup is never erased).
- The invite is also read from the address's `#` part.

## Acceptance
- **DS-B73-1:** every Copy link / new link is a fresh address ending in `&invite=<code>`.
- **DS-B73-2:** unreachable server or bad/revoked invite → on-page message with reason; invite kept for retry; no silent keys screen.
- **DS-B73-3:** a device with its own setup asks before switching to the invite; switching keeps the owner setup and can be reversed.

---

# 2026-10-15 — b72 share DevStream by invite link: no setup for the other person

## Owner report
"I want to be able to share this program to somebody else and not have them go through the configuration process." Decided: their projects live in the owner's repo, each in their own folder.

## Design
- Owner: Config → "Share with someone": type a name, tap Create invite link. The app stores the owner's current keys and GitHub token in the runner's own storage (Cloudflare Durable Object, not in the repo, no repo secrets, no workflow step) and returns a link. Owner can list invites, copy a link again, and revoke.
- Guest: opens the link once. The page saves the invite in that browser and shows no Config (a short "guest of <owner>" note and Leave). Nothing to paste.
- All of a guest's GitHub reads and writes go through the runner, which uses the owner's token but only touches this guest's own paths: `projects/<guest>/…` (code and plan) and `devstream/guests/<guest>/…` (status and threads). Everything else in the repo (including the owner's files and history) is refused or filtered out.
- Guest runs always run in the cloud with the owner's AI keys and default models; a daily run cap per invite (default 30) limits spend.
- Owner's own use is unchanged.

## Limits / honest
- The owner's keys and token sit in Cloudflare Durable Object storage for the runner; anyone with that Cloudflare account can read them. Guests spend the owner's AI credits (capped per day); revoking an invite stops them at once.
- Guests need the page open for notifications, same as the owner; runs themselves continue in the cloud.

## Acceptance
- **DS-B72-1:** opening an invite link on a device with no setup yields a working app with no Config step; the invite is remembered.
- **DS-B72-2:** a guest's files and status land only under their own folders; paths outside them (traversal, encoded dots, a neighbour's folder, other repo files) are refused.
- **DS-B72-3:** guest repo-tree and commit lookups never reveal other paths or file contents.
- **DS-B72-4:** a revoked invite stops working immediately; the daily cap blocks extra runs with a plain message.
- **DS-B72-5:** guest jobs cannot pick a model, target another file, or pull referenced files outside their folders.
- **DS-B72-6:** no key or token is ever sent to a guest's browser.
- **DS-B72-7:** owner can create, list, copy and revoke invites from Config; the link works from a fresh browser.

---

# 2026-10-04 — b71 the working banner replaces the compose row

## Owner report
The transcript and the status line overlapped on screen, and the banner plus compose box wasted vertical space. Owner idea: show the banner in place of the compose strip while a job runs; Stop brings the compose strip back.

## Change
- While a run is going, the banner takes the compose row's place (suggestion chips, attach, text box and footer are hidden), with a larger Stop button. The transcript gets the freed space and scrolls to the latest message so nothing sits under the banner.
- When the run ends or is stopped, the compose row returns; Ready / Couldn't finish banners still show above it as before.
- Trade-off accepted: no typing or queued messages while a run is going.

## Acceptance
- **DS-B71-1:** while running, the compose row is hidden and the banner is shown in its place; the last transcript message is fully visible above it.
- **DS-B71-2:** Stop (or the run ending) brings the compose row back.

---

# 2026-10-04 — b70 cloud runner back, the standard way: your keys from Config, nothing else to set up

## Owner report
b68's runner needed an access code per device, repo secrets and a GitHub workflow — rejected (b69). Owner: "I want to keep it standard — I always paste my keys into a config section and it is saved in local storage."

## Change (supersedes G-DS-17)
- The same Cloudflare runner, but with no extra setup: the page sends the keys already saved in Config with each job; the runner uses them for that job only and keeps nothing. No access code, no secrets, no per-device step.
- The runner accepts a job only if the GitHub token in it can push to the owner's repo (`acmeproducts`).
- Turns on by itself when a GitHub token and at least one AI key are saved. Config has one checkbox "Run in the cloud" (on by default).
- The deploy workflow now only deploys and checks health; it runs only when files under `devstream/runner/` change (not on normal DevStream changes) and has no secret steps.
- Falls back to running in the page if the runner can't be reached.
- Kept: no silent re-runs after a failure; status writes merge on conflict; screen stays on while a run is going in the page.

## Limits
- Notifications still need the page open; reopening shows Done / Needs you at once. A run is capped at about 13 minutes.

## Acceptance
- **DS-B70-1:** with a GitHub token and an AI key saved, a run is handed to the cloud with no further setup, and the keys in the job are the ones from Config.
- **DS-B70-2:** the run finishes with the page closed; reopening shows Ready and nothing re-runs.
- **DS-B70-3:** a bad build is refused and retried quietly in the cloud; the app file stays unchanged.
- **DS-B70-4:** Stop reaches the cloud and leaves the message queued.
- **DS-B70-5:** unreachable runner → the page runs it itself. No AI key saved → the runner is not used.
- **DS-B70-6:** the runner refuses a token that cannot push to the owner's repo, another owner's repo, and odd repo names; keys are not kept after the job.

---

# 2026-10-04 — b69 cloud runner REJECTED and removed; screen stays on during a run

## Owner report
The cloud runner (b68) needed per-device setup (an access code on each device), repo secrets and a GitHub workflow. Owner: "this is a joke… not doing device specific setups… I hate gh workflow it breaks and I get spammed." Rejected the same session.

## Change
- Removed the whole cloud runner (`devstream/runner/`, its deploy workflow, the Config row, all page code). The Worker already deployed on Cloudflare is inert (no secrets, refuses every call); delete it from the Cloudflare dashboard if wanted.
- Kept from b68: a failed or stopped run is no longer silently started again; a status write that collides with another device now merges.
- New, zero setup: while a run is going the page asks the phone to keep the screen on (Screen Wake Lock), so the phone does not sleep and pause the page. Banner says so.
- Limit (unchanged): runs live in the page. Locking the phone manually or closing the page still stops them.

## Acceptance
- **DS-B69-1:** while a run is active the screen wake lock is held; it is released when no run is active.
- **DS-B69-2:** a failed run is not started again by itself (was DS-B68-8).
- **DS-B69-3:** no cloud-runner code, config row or workflow remains.

## Graveyard
- **G-DS-17 — Cloud runner with an access code per device + repo secrets (b68 design):** rejected 2026-10-04. Reason: per-device setup. Superseded by b70, which uses the keys already saved in Config.

---

# 2026-10-04 — b68 runs keep going when the phone is locked or the page is closed (Cloudflare runner)

## Owner report
"This needs to be able to run on a phone." A run that lives in the page stops when the phone sleeps, switches apps for long, or the page closes.

## Decision (supersedes the 2026-08-14 "no extra moving part" ruling — owner directive 2026-10-04)
A small Cloudflare Worker (`devstream-runner`, `devstream/runner/`) runs the whole job: it reads the plan and code from GitHub, calls the AI, checks the result, commits, writes the reply and updates status. The page only hands the job over and shows progress. The existing TalkBridge relay is not reused (it only passes call signals); only the same Cloudflare account and deploy secrets are.
- Keys: the page never sends your GitHub token or AI keys. They are stored once as Cloudflare secrets (set from the repo's GitHub secrets by the deploy workflow). The page sends only a runner access code, typed once per device and kept in that browser. Without the code the runner refuses everything; it only touches repos under `acmeproducts`.
- Fallback: if the runner can't be reached, the page runs the job itself exactly as in b67.
- Status writes now merge on conflict (fixes the "status save failed" noise for runner runs).
- Deploy: `.github/workflows/deploy-devstream-runner.yml` on pushes to `devstream/runner/**`. One-time setup by the owner: add repo secrets `DEVSTREAM_GH_TOKEN` (a token that can write to the repo), `DEVSTREAM_VENICE_KEY` (and/or `DEVSTREAM_OPENROUTER_KEY`, `DEVSTREAM_ANTHROPIC_KEY`) and `DEVSTREAM_RUNNER_CODE` (any long random phrase), then re-run the deploy workflow.

## Limits (honest)
- Phone/browser notifications still need the page open. Reopening the page shows Done / Needs you at once.
- A run is capped at about 13 minutes.

## Acceptance
- **DS-B68-1:** a job handed to the runner finishes (file committed, reply saved, messages marked done, status ok) with the page closed.
- **DS-B68-2:** a broken result is refused and retried quietly, exactly as in the page; the app file is unchanged.
- **DS-B68-3:** a call without the right access code, for another owner's repo, or for an engine with no key on the runner is refused; no key or token is ever written to storage or returned in status.
- **DS-B68-4:** Stop in the page stops the remote run and leaves the message queued.
- **DS-B68-5:** a status write that collides with another device merges instead of failing.
- **DS-B68-6:** other devices do not mark a remote run "interrupted" while the runner is alive.
- **DS-B68-7:** if the runner is unreachable (or has no access code / is not set up) the page falls back to running in the page.
- **DS-B68-8:** a failed or stopped run is not silently started again. (Cause: sending a message also queued a second run of the same tab; when the first run failed or was stopped the queue started it again. Now only a message sent while a run is already going is queued.)

---

# 2026-10-04 — b67 one clear Now / Next banner + tell me when it matters

## Owner report
Still not easy: unclear what is happening now, no notice when work finishes or needs help, and unclear next steps.

## Change
- One banner above the message box is the single answer to "what is happening and what do I do". Working: what it is doing, how long so far, how long it usually takes, and an honest note to keep this page open (switching tabs or apps is fine). Ready: what was done plus **Open your app**. Couldn't finish: plain reason plus **Run again**. The old duplicate status pill and the second "working" bar are hidden.
- Next steps are always offered as buttons in plain words: the AI's own suggested next step, **Check it works**, **Make the next improvement**, **Give me ideas** (and **What happened?** after a failure).
- Notices: the browser tab title and icon show the situation (… Working, ✓ Done, ! Needs you) so you can see it from another tab; an optional browser notification fires when a run finishes or fails while you are away (permission asked once, on your first message).
- Limit (unchanged): runs live in this page. Closing the page stops them; a closed phone cannot be notified without a server.

## Acceptance
- **DS-B67-1:** while working the banner shows what it is doing, time so far, "Usually …", and the keep-this-page-open note; no second working bar or pill.
- **DS-B67-2:** after success the banner says Ready with the summary and an Open your app button; chips include Check it works.
- **DS-B67-3:** after a failure the banner says Couldn't finish in plain words with Run again.
- **DS-B67-4:** tab title and icon reflect working / done / needs you, and clear when you come back.
- **DS-B67-5:** a notification fires when a run finishes while the page is hidden; permission is requested once.

---

# 2026-10-04 — b66 Undo last change + "Something's wrong" (the app checks for you)

## Owner report
Non-developers need a safe way back from a bad build and should never have to copy console logs to report one.

## Change
- Under the newest finished build: **Open your app**, **Something’s wrong**, **Undo**.
- **Undo** puts the file back to exactly how it was before that build (saved as a new version, nothing is erased). Allowed only while that build is still the latest one for the file; otherwise it says plainly that newer changes were built on top.
- **Something’s wrong** runs the built page inside a sandboxed, invisible frame for a few seconds and collects the errors it throws. If it finds any, it sends them to the AI as your next message and the fix starts. If it finds none, it opens your message box with "Something looks wrong:" so you can say what you see.
- The frame is sandboxed (no access to the app's saved keys). Pages that need browser storage may show storage errors in the frame; those are ignored.
- Not covered: problems that only appear after you click or play for a while.

## Acceptance
- **DS-B66-1:** the newest build bubble shows Open / Something’s wrong / Undo; older bubbles show only Open.
- **DS-B66-2:** Undo restores the previous file content, adds an "Undid" message, and removes Undo from the undone build.
- **DS-B66-3:** Undo is refused if the file changed since that build; nothing is written.
- **DS-B66-4:** Something’s wrong on a page that throws sends the errors as a message and starts a run.
- **DS-B66-5:** Something’s wrong on a healthy page sends nothing and opens the message box.

---

# 2026-10-04 — b65 plain-English results: quiet retry, no technical chat, "Open your app"

## Owner report
The app still feels technical to a non-developer (messages about files, commits, diffs, patches, GitHub errors; raw links).

## Change
- Quiet retry: when the AI's answer is rejected before anything is saved (change did not fit, file would break, no usable file), the app tries again up to twice, telling the AI the exact reason. The user only sees a problem if all three tries fail.
- Chat messages are plain by default: what was done, then an **Open your app** button. File names, commit ids, diff and test links, "chars", engine notes move behind a **Details** link on each message.
- Failures read like "I couldn't finish that. Your app is unchanged. Tap Run again." Status words are Working / Ready / Couldn't finish.
- Unchanged: Coach mode still exists for tone; Details shows the original text exactly as before.

## Acceptance
- **DS-B65-1:** a bad first answer followed by a good one is saved with no failure shown, 2 AI calls.
- **DS-B65-2:** three bad answers stop after 3 calls, the file is untouched.
- **DS-B65-3:** the failure message is plain (no function/syntax/patch/GitHub/engine wording).
- **DS-B65-4:** a success bubble shows no file names, commit ids, diff links or "chars".
- **DS-B65-5:** a success bubble has an Open your app button.
- **DS-B65-6:** Details reveals the technical text.

---

# 2026-10-04 — b64 a build that would break is not saved or linked

## Owner report
"Play it" links led to a page that failed immediately (`update is not defined`, earlier a syntax error). The app announced the build as ready without checking it.

## Change
- Before any HTML build is committed, the app checks the new file: (1) every inline script must parse (a stray brace or missing bracket is caught); (2) a function that existed before and is still called, but no longer exists, is flagged. Functions removed together with all their calls are fine.
- If a check fails the file is not saved and no link is posted. The run shows "Needs help" with the plain reason, the working version stays in place, and Run again retries.
- Not checked: runtime behaviour that is only visible when the page runs (needs a real browser); plan (.md) files.

## Acceptance
- **DS-B64-1:** a rewrite that drops a still-used function is refused; file unchanged.
- **DS-B64-2:** a rewrite with a syntax error is refused; file unchanged.
- **DS-B64-3:** a sound rewrite is saved with its link.
- **DS-B64-4:** removing a function together with its calls is allowed.

---

# 2026-10-04 — b63 one message = one run (a saved-thread conflict no longer re-runs finished work)

## Owner report
Chat showed "Fixed … Play it: <link>" while the strip said "Working — Writing the changes…". The page that link opened was broken (`update is not defined`). Owner: the sequence is backwards; do not fix the Snowman app, find the sequence problem.

## Cause (from the repo's own log and git history)
- One message ("continue") produced three commits of wsl.html in 6 minutes (17:44, 17:47, 17:50), each announced as "Fixed … / Play it". Log: Snowman run T7 finished 00:44:39, run T12 dispatched 00:44:49, T13 at 00:47:46 — no user message in between. Duck/bugsbunny re-ran every ~8 s the same way.
- Order inside a run: commit the file → post the reply and test link → mark the user message done → save the thread file. When that save hits a 409 conflict, the merge keeps the copy already on GitHub, which still says "pending", and drops the local "done". The message looks unrun, so the app runs it again — rewriting the whole file again. Each rewrite dropped a different function, so each run "fixed" what the last one broke.
- The link in the reply is therefore real but already stale: a newer run is writing over it.

## Fix
- Message status can only move forward (pending → done). Merging two copies of a message, or reloading a thread, never turns done back into pending; the session also remembers which messages it already ran.
- Not changed: whole-file rewrites by the engine (separate cost/quality issue); the Snowman app itself.

## Acceptance
- **DS-B63-1:** when the thread save conflicts, one message still produces exactly one run.
- **DS-B63-2:** the user message ends "done" locally and on GitHub.
- **DS-B63-3:** reloading the thread afterwards does not bring the message back to pending.

---

# 2026-10-03 — b62 top tabs (Dashboard | Projects | Config), Latest / Custom project order, action dashboard

## Owner report
Wants Latest and Custom tabs for projects (Custom = the dragged order; Latest = last updated). Dislikes the Dashboard: a mashup of project screen and status screen, repeats what the project cards show. Wants it clickable, taking you somewhere to do something; and Dashboard / Projects / Config as tabs at the top instead of a card.

## Change
- Top tabs in the sidebar: Dashboard | Projects | Config. Config opens the settings. The Dashboard card and the gear button are gone.
- Above the project list: Latest | Custom. Latest orders by last update; Custom is the drag order and the only mode where projects can be dragged. The choice is remembered.
- New Dashboard, every row opens something: Needs you (failed / stopped runs → opens that tab), Running now (live activity → opens the tab), Recently finished (→ opens the tab, with a Play link), Engines (Venice balance → opens Config), Recycle bin (as before).
- Removed from the Dashboard: per-project sections, filter chips, sort chip and per-project notes (they repeated the project cards). Project notes have no screen now.

## Acceptance
- **DS-B62-1:** top tabs Dashboard | Projects | Config exist; no Dashboard card, no gear.
- **DS-B62-2:** Latest orders by last update; Custom keeps the dragged order; the choice survives a reload.
- **DS-B62-3:** projects drag only in Custom.
- **DS-B62-4:** Dashboard lists failed/stopped tabs under Needs you; clicking opens that tab.
- **DS-B62-5:** Dashboard lists running tabs under Running now; clicking opens that tab.
- **DS-B62-6:** the Engines row opens Config.
- **DS-B62-7:** Config tab opens settings.

---

# 2026-10-03 — b61 test-link requests tolerate typos and plain phrasing

## Owner report
"give me a test iurl" went to the engine and got a how-to-host essay. b60 only matched the exact words "url"/"link".

## Fix
- The test-link request matcher also accepts typos (iurl, ulr, uel, rul), "address", and phrasing like "test it", "play it", "how do I test/play/try it", "where can I open it".
- Still never fires on messages that ask for work (build, add, fix …).

## Acceptance
- **DS-B61-1:** "give me a test iurl" returns the link, no run.
- **DS-B61-2:** "how do i test it" returns the link, no run.
- **DS-B61-3:** "add a test link button" still goes to the engine.

---

# 2026-10-03 — b60 the app gives the test link itself

## Owner report
Asked a tab for a test URL several times; the engine answered with feature ideas instead.

## Fix
- A short message asking for the test URL / link / preview is answered by the app instantly: the link to this project's page, no engine call, no cost. Messages that ask for work (build, add, fix …) are unchanged.
- Works on a frozen-free active tab only (same as any message).

## Acceptance
- **DS-B60-1:** "give me a test url" gets the project's link back, no run starts, no engine call.
- **DS-B60-2:** "add a test link button" still goes to the engine as a normal task.
- **DS-B60-3:** the link points at the project's main file on GitHub Pages.

---

# 2026-10-03 — b59 tab menu works again (double-click / right-click)

## Owner report
Could not open the tab menu on a tab.

## Cause
Clicking a tab reloaded its thread and redrew every tab, even the tab already open. The redraw replaced the tab under the pointer between the two clicks, so a double-click never registered. The thread also flashed "Loading…".

## Fix
- Clicking the tab that is already open does nothing (no reload, no redraw).
- Double-click and right-click are caught on the tab bar itself, so a redraw cannot lose them.

## Acceptance
- **DS-B59-1:** double-click on the open tab opens the tab menu.
- **DS-B59-2:** double-click on a frozen tab opens the tab menu.
- **DS-B59-3:** right-click on either tab opens the tab menu.
- **DS-B59-4:** clicking the open tab does not reload its thread.

---

# 2026-10-03 — b58 wrong-format replies: root cause removed

## Owner report
earth · build kept ending in "engine returned SEARCH/REPLACE blocks for projects/earth.md, which is not the patched file — nothing written" (screenshot + persistent log). Owner: eliminate the root cause, not the symptom.

## Cause
earth.html is ~190 KB, so every run is in patch mode and the model answers with SEARCH/REPLACE edit blocks. The app only knew how to apply edit blocks to the project's code file. When the model edited the plan (or any other allowed file) the same way, the app threw the reply away and failed the run — each failure cost a full model call on 150–190 KB of context.

## Fix
- Edit blocks are applied to whichever allowed file the reply names (code or plan), in patch mode or not. A reply is only rejected if its blocks do not match the file's text (and then the message says which block failed).
- Persistent log: the build tag on each event now follows the app's version label (events were all tagged b51).

## Also found in the log (not changed here)
- earth.html (190 KB) means ~55k tokens in per run with Kimi K3; most "Run again" attempts are expensive. Splitting the file or a smaller reference is the real cost fix.
- Shared status-file writes still collide ("status save failed … 409"); heartbeat writes can lose that race. Planned next: merge-on-conflict for status writes.

## Acceptance
- **DS-B58-1:** a patch-block reply targeting the plan edits the plan.
- **DS-B58-2:** a patch-block reply targeting the code file still works in patch mode.
- **DS-B58-3:** blocks that do not match the file are rejected with the failing block named; nothing written.
- **DS-B58-4:** log events carry the current build tag.

---

# 2026-10-03 — b57 Release 1: simplify — one message = one run; Working / Done / Failed only

## Owner directive
The screen was non-functional and too complex: runs stuck as "Stalled", messages "waiting", failure bubbles, several status words and colours. Simplify (owner approved the proposal: "go").

## Model
- A message starts a run immediately. A run is **Working**, **Done** or **Failed** — nothing else is shown.
- **Heartbeat:** a running tab stamps a heartbeat in the shared status file every minute. Any device that sees a "running" tab with no local run and no heartbeat for 3 minutes marks it **Failed: interrupted** automatically (checked at load and every 20 s). There is no manual Stalled/Reset step.
- **One bar above compose**, only when something is running or needs action: Working = activity sentence + progress bar + Stop; Failed = plain reason + **Run again**; Not started = **Run**. Nothing is shown when idle or done. The four-step chip row and the Done strip are removed.
- **Three colours from the last run** everywhere (green done, amber working, red failed; grey for frozen/idle).
- Pending messages are labelled "running" or "not run yet" (no "waiting"/"queued").
- **The plan is a log the app writes.** Code builds no longer make a second model call to rewrite the plan. After each build the app appends one row (date, tab, result, what, commit) to a "RUN LOG" table at the end of the plan; failures are appended the same way. The model only rewrites the plan when the owner explicitly asks it to edit the plan.
- Stuck Snowman/earth runs clear themselves on load as "interrupted"; no data hand-editing.

## Removed from view
Stalled/Reset, queued/waiting labels, the lifecycle chips, the Done strip, the plan-check model call and its failure class ("Plan checkpoint failed validation", "Plan read-back failed").

## Acceptance
- **DS-B57-1:** a running tab with a fresh heartbeat or a local run is never marked interrupted.
- **DS-B57-2:** a running tab with no local run and a heartbeat older than 3 minutes becomes Failed: interrupted automatically.
- **DS-B57-3:** the bar appears only for running / failed / not started and offers exactly one action.
- **DS-B57-4:** a successful code build appends one run-log row to the plan and makes no plan-rewrite model call.
- **DS-B57-5:** a failed run appends a short failure row to the plan; logging failures never fail the run.
- **DS-B57-6:** pending user messages read "running" or "not run yet".

---

# 2026-10-03 — b56 Snowman cleanup: what it took, and what the app now prevents

## Owner report (screenshot of Snowman · wsl.html)
Reset and Send buttons unreadable; tab dot yellow while the status said Stalled in red; coach suggestion chips gone; repeated vague "I couldn't finish that step" messages; plan suspected poisoned. "Use this project as the example of what it takes to clean this up."

## Findings (Snowman, evidence from repo)
1. **Plan named a file that does not exist.** wsl.md said "Active Target: snow1.html" and "snow1.html baseline exists". The repo has `snow-v1.html` and `wsl.html`; there is no `snow1.html`. The project builds `wsl.html`. Every run the model obeyed the plan, wrote `snow1.html`, and the app refused ("Unexpected output path") — a loop no retry could fix.
2. **The plan file itself was wrapped in `<plan>…</plan>` tags** (the model echoed the wrapper the app puts around the plan in its prompt). The plan-update safety check requires the new plan to start with `#`, so every plan update that copied the wrapper failed validation (16 recorded "Plan checkpoint failed validation" failures).
3. **Plan carried false facts from earlier failures**: "wsl.html > 400 KB" (it is 33 KB) and "previous commit 193798a unavailable". Every run was told these, so it kept planning around them instead of building.
4. **Stuck state.** The tab was marked executing from 08:27 with nothing running (stalled); a pending owner message sat "waiting" for an hour.
5. **Five identical vague failure messages** in the chat hid the real reason.
6. **Button text contrast:** primary buttons used a fixed dark text colour; on the Warm preset the accent is dark teal → unreadable.
7. **Three different status vocabularies:** tab dot (yellow, "executing"), strip (red, "Stalled"), header pill ("Working").
8. **Coach chips were hidden** whenever the strip showed anything (my b53 regression).

## Fixed in the app
- Primary-button text colour is computed from the accent colour (readable on every preset).
- One status function: a stalled run is red everywhere (tab dot, project dot, header pill "Stalled", strip).
- Suggestion chips always visible again (only the duplicate "run" chip stays removed — the strip has the button).
- Stalled: one **↻ Retry** button (resets the stuck state and restarts) instead of Reset-then-retry.
- Wrong target file: the agent is told the only writable files are the project's build file and plan file, and that a plan naming anything else is wrong. If a reply still targets another file, the app re-asks the model once with the correction before failing.
- Plan updates: wrapper tags are stripped before validation and saving, and the check now accepts a plan starting with a heading or the ledger table.
- Identical consecutive failures are not appended again; failure text in coach mode now says the real reason in plain words (out of credit, timed out, plan points at the wrong file, …).

## Fixed in the project data
- wsl.md corrected: stray `<plan>` wrapper tags removed; Active Target = `wsl.html`; `snow-v1.html` recorded as the simplicity reference; false size/commit claims removed; graveyard and correction entry added. Owner decisions (selected features, gesture scheme, rejected button bar, Flow score) preserved.

## Acceptance
- **DS-B56-1:** primary button text meets contrast on dark, light, high-contrast and warm presets.
- **DS-B56-2:** a stalled tab shows red/Stalled in the dot, pill and strip.
- **DS-B56-3:** suggestion chips visible in every state except frozen.
- **DS-B56-4:** stalled → Retry resets and restarts in one tap.
- **DS-B56-5:** a reply targeting a non-project file triggers one automatic corrected re-ask.
- **DS-B56-7:** a plan update wrapped in plan tags is cleaned and passes the safety check.
- **DS-B56-6:** repeated identical failures add no new chat messages; coach failure text states the cause.

---

# 2026-10-03 — b55 live progress in the task strip

## Owner report
While a task ran, the strip only said "Working on your idea…" and an elapsed-seconds counter. Nothing said what was happening or whether anything was moving.

## Implemented
- **Real activity sentence** in the strip while a run is working: Saving your message → Reading the plan and code → Updating the plan before changing code → Asking <model> (size of context) → waiting for the first words / thinking (reasoning size) / writing the reply (characters received so far) → Reading the model's answer → Applying edits → Saving. Coach mode uses the same steps in friendlier words without model names or numbers.
- **Progress bar** under the steps, driven by those phases; while the model writes it advances with the characters actually received.
- **"Last activity" line**: elapsed time plus seconds since anything last happened; turns red after 45 s of silence.
- Streaming progress is sent from the worker as a lightweight signal, not written to the diagnostic log.
- Static "Working on your idea…" removed.

## Acceptance
- **DS-B55-1:** the activity sentence changes as the run moves through its phases.
- **DS-B55-2:** while a model streams, the sentence and bar reflect characters actually received.
- **DS-B55-3:** the strip shows seconds since last activity and flags 45 s of silence.
- **DS-B55-4:** coach mode shows friendly step text, never a fixed message.
- **DS-B55-5:** stream progress does not add entries to the persistent log.

---

# 2026-10-03 — b54 one active tab per project + goals modal when no plan

## Owner directive
Failed-tab blockers were a workaround for a deeper problem: several tabs in one project could run, fail, queue and collide. Allow only **one active tab per project**. The active tab is always first and is the tab shown when the project is selected. All other tabs are frozen, for reference only. The active tab sees all project activity across tabs for context. If a project has no plan, ask the owner for the goals in a modal.

## Implemented
- **Active tab:** each project stores `activeTab`. It is always first in the tab row and is what opens when a project is selected. Existing projects migrate automatically (the running tab, else the first tab, becomes active; the rest are frozen). A new tab becomes active, unless the current active tab is mid-run, in which case creation is refused with a message.
- **Frozen tabs:** shown with a plain "‖" glyph instead of a status dot, never red, never counted as errors. Opening one shows its chat read-only; the compose box is replaced by "Reference only — Make active". Sending and running from a frozen tab are blocked. **Make active** (also in the tab menu) swaps the baton and is refused while the current active tab is saving, queued or running.
- **Project context:** a run on the active tab includes a short digest of the latest messages from the project's other tabs, so the active tab sees activity across tabs.
- **Removed:** the Resolve blocker menu/submenu and the strip's Resolve button, and the disposition code. A failure is simply the active tab's current run: Retry or Stop. Older recorded dispositions are ignored.
- **No-plan modal:** before a run, if the project's plan file is missing or empty, a modal asks "Enter a brief description of the goals and objectives of this application". Saving writes a starter plan containing that text (written by the app, no model call) and the run continues. Cancel leaves the message saved and the run not started (Start asks again). This replaces the silent auto-seed from the earlier fix.

## Acceptance
- **DS-B54-1:** the active tab is first and is what opens when a project is selected.
- **DS-B54-2:** only the active tab can send/run; frozen tabs are read-only with Make active.
- **DS-B54-3:** Make active is refused while the active tab is working.
- **DS-B54-4:** frozen tabs are never red; project error counts include only the active tab.
- **DS-B54-5:** no Resolve blocker UI remains.
- **DS-B54-6:** missing/empty plan shows the goals modal; Save creates the plan and continues; Cancel does not run.
- **DS-B54-7:** existing plans are never touched.

## Owner style rule (2026-10-03)
No cartoon/emoji icons anywhere in the UI; plain text glyphs only. Applied in b54: attach `+`, documents `≡`, images `▣`, web toggle plain text, suggestion chips text only, agent reply markers `▸ ✓ !`, password reveal `show/hide`, frozen tab `‖`.

---

# 2026-10-02 — b53 one task strip (clear lifecycle above compose)

## Owner report
The screen had a tab row at the top plus several different bars above the compose box (queued-messages bar, working bar, suggestion chips, a header ▶ button) and it was unclear which controlled what or what state a task was in.

## Cause
Task state was shown in four places with three different run buttons (header ▶, "run now" bar, "Run queued work" chip) and no single statement of where a task was in its life.

## Implemented
- **One strip directly above the compose box**, always about the selected tab (it names the tab). It shows the lifecycle as four steps — Saved → Queued → Working → Done — with the current step highlighted, one plain sentence, and exactly one primary button:
  - Saving your message… (no button)
  - Waiting to start — says why (another tab in this project is building and this starts automatically; or saved but not running) — **▶ Start**
  - Working — live progress line and elapsed time — **■ Stop**
  - Failed — short error text — **↻ Retry** (same audited retry as the blocker menu) and **Resolve ›** (opens the tab's Resolve blocker menu)
  - Stalled (no activity 10+ min) — **Reset**
  - Done — shown for 5 minutes after success
- Removed the duplicates: queued-messages bar, working bar and header ▶ are hidden; suggestion chips no longer contain a second "run" button and are shown only when nothing is queued, running or failed.
- The top row is unchanged: it is the project's tabs; the header names project · tab and status.
- No change to run mechanics, queueing, or persistence.

## Acceptance
- **DS-B53-1:** exactly one status strip above compose; it names the selected tab.
- **DS-B53-2:** each state above shows the right step, sentence and single primary button.
- **DS-B53-3:** Start/Stop/Retry/Reset/Resolve perform the same actions as before.
- **DS-B53-4:** old queued/working bars and header ▶ no longer appear; suggestions hidden while a task is queued/running/failed.

---

# 2026-10-02 — b52 run-time guardrails + Venice balance awareness

## Owner report
Runs hit the 8-minute worker kill (19 recorded failures) and burned DIEM without producing output. Venice offers an API to read DIEM balance; use it to make smarter choices.

## Cause (from thread history)
Model calls were single non-streaming requests (up to 300 s each) that could be chained across fallback engines, then killed by the 8-minute watchdog after the fact. Nothing noticed a stalled or silent model, and nothing knew the account/key balance.

## Implemented
- **Streaming model calls (Venice/OpenRouter):** output is streamed; the call aborts if no data arrives for 90 s ("stalled") or after a 240 s per-call cap. The abort actually closes the request.
- **Run time budget:** each job gets 6 minutes across all engine attempts. Fallback engines get only the time remaining and are skipped when under 45 s remain. The 8-minute watchdog stays as a last-resort backstop.
- **Venice balance:** reads `GET /api/v1/api_keys/rate_limits` (optional admin key, else the normal key) for DIEM/USD balance and next refill. Settings shows it with a refresh button.
- **Smarter choices before each run:** if Venice DIEM+USD is empty, Venice is dropped from the chain (fallback engines used, or a clear "balance empty, refills in hh:mm" error instead of a doomed call). If DIEM is low (< 1.0) and the thread uses a non-default model, the run uses the owner's default Venice model instead. A "spend limit exceeded" reply marks Venice as capped for 10 minutes so retries don't repeat it.
- Balance check failures never block a run.

## Unverified
Venice docs were not reachable from the build environment; the balance response shape follows Venice's documented `balances.DIEM/USD` and `nextEpochBegins` and is parsed defensively. Real-key behavior must be confirmed with the Settings refresh button.

## Acceptance
- **DS-B52-1:** a silent model call aborts after 90 s idle; a long call aborts at its cap; neither waits for the 8-minute watchdog.
- **DS-B52-2:** total engine time per job never exceeds the 6-minute budget.
- **DS-B52-3:** streamed output is assembled identically to the previous non-streamed result.
- **DS-B52-4:** empty/low balance changes engine/model choice as above; failed balance lookups change nothing.
- **DS-B52-5:** Settings shows balance and accepts an optional admin key.

---

# 2026-10-01 — b51 fix: missing master plan no longer blocks a thread
- Owner: "Master plan .md is missing or empty. Restore it before running this thread" kept failing tabs (e.g. projects with no recorded plan file).
- Before every run (except the plan-creation request itself) DevStream now checks the plan file; if it is missing or empty it writes a small seed plan (ledger, releases, scope, rules, decision log, appendix), marks the project's plan as existing and records the plan path, then continues. An existing plan is never touched. The old error remains only as a last-resort guard.

---

# 2026-09-30 — b51 fix: desktop double-click opens the tab context menu
- Owner could not open the tab context menu. Touch double-tap and desktop right-click already worked (verified with real project data, touch and mouse); desktop double-click did nothing. Tabs now also open the same context menu on double-click, matching project rows. No other menu behavior changed.

---

# 2026-09-29 — b51 failed-tab blocker resolution

## Owner directive
A tab stays red while its latest run failed. The owner needs an explicit way to clear that attention state without erasing the failure.

## Implemented
- Tab context menu gains **Resolve blocker ›** only when the tab's state is `error` and the failure is unresolved. Submenu, exactly three choices:
  - **Resolved another way** — clears the red/attention state; records `resolved_elsewhere` + time.
  - **No longer needed** — clears the red/attention state; records `abandoned` + time.
  - **Retry** — changes nothing about the failure; records `retry` + time and queues the same tab through the existing `dispatch()` path. The tab stays red until a run succeeds. No replacement tab.
- Failure history is immutable: `state`, `error`, `finishedAt` and the thread's messages are never edited. Dispositions live in a separate append-only `dispositions[]` on the tab's record in the existing Devstream state file (`devstream-status.json`); each entry stores kind, time, and a copy of the failure it answers (`failedAt`, `error`). No new persistence system.
- A tab counts as blocked only while `state==='error'` and no non-retry disposition matches its current `finishedAt`. A later failure has a new `finishedAt`, so it is red again automatically.
- Red/attention displays (tab dot, sidebar project rollup, project error count, pill, dashboard rows/filter, suggestions) use the resolved-aware check. The dashboard shows a small "(blocker resolved / not needed)" note instead of the error text.
- If saving the disposition fails, the in-memory entry is rolled back and the error is shown.

## Decision
Resolve state is derived from the disposition matching the specific failure, not a flag on the tab, so history stays evidence and new failures are never masked.

## Acceptance
- **DS-B51-BR-1..10:** owner acceptance tests 1–10 for failed-tab dispositions.

---

# 2026-09-29 — b51 fix: project opens on its first displayed tab
- Regression: opening a project chose the first thread by raw key order, not the tab order shown (including drag-reordered order). Now uses the same ordered list as the tab bar. One-line change.

---

# 2026-09-29 — b51 persistent diagnostic log + compose paste/drop attachments

Baseline: b50 `8ff0462`. Test file only; `devstream.html` untouched. No other behavior changes.

## Change 1 — Persistent diagnostics in GitHub
- `dlog()` remains the single entry point (Debug console unchanged). Each line also becomes a sanitized structured event (JSONL) queued for GitHub.
- Files: `devstream/logs/current.jsonl` (active) and `devstream/logs/previous.jsonl` (one rotated generation). Rotation at ~150 KB; total durable size bounded to ~2 generations.
- Batched: flush every 60s when events are queued, ~3s after an error (never more than one flush per 15s), best-effort on page hide. Unflushed events persist locally (bounded) and retry with backoff; failures never surface into the logged operation.
- Write conflicts (409/422) re-read a fresh SHA and re-append; events carry ids so a retried write cannot duplicate them.
- One central sanitizer runs before queueing: keys/tokens/Authorization/Bearer/cookies/data URIs/long tokens redacted, URL queries dropped, lines truncated, only whitelisted primitive fields accepted, no arbitrary objects. Message/prompt/attachment/provider-body content is never logged.
- Flush traffic is excluded from durable logging (no recursion).
- Config gets a Logging tab (same modal): merged durable + unflushed view, Download, Copy, Clear (confirmed; clears local buffer, queue, and GitHub log files only).

## Change 2 — Paste + drag/drop attachments
- The 📎 handler body becomes one shared `ingestFiles(files, source)`; picker, clipboard paste and drag/drop all call it. Attachment limit raised from 2 MB to 100 MB (owner directive 2026-09-29), same image/text conversion, same `pendingAtt` objects and chips.
- Paste intercepts only when the clipboard contains real files. Drop accepts only real `File` objects; dropping files anywhere never navigates the page. Compose strip highlights while files are dragged over it (depth-counted, no child flicker).
- Per-file rejection toast (name + reason); other files still attach. Binary/unreadable files are rejected with a reason.

## Amendment — attachments are local-only (owner directive 2026-09-29)
- Image attachments are no longer uploaded to GitHub. They are stored in this browser's IndexedDB (`ds_attachments`); the thread record keeps only name/type/id. Images are passed to the provider from local storage. Older messages with a GitHub path/url still work. On another device an image shows as "stored on another device" and is skipped for provider calls.
- Text/document attachments were already inline in the thread record (unchanged).

## Acceptance
- **DS-B51-1..15:** logging behaviors per owner spec items 1–15.
- **DS-B51-16..39:** attachment picker/paste/drop and error behaviors per owner spec items 16–39.
- **DS-B51-40..50:** b50 regression list unchanged.

---

# 2026-09-28 — b50 409 hardening + project drag gate

- Owner screenshot: repeated thread JSON GitHub 409 SHA mismatch under queued activity.
- Thread writes now retry against a fresh SHA up to 12 times with bounded backoff.
- Permanent message deletion uses a per-path tombstone during reconciliation so a concurrent remote copy cannot restore the deleted message/secret.
- Tab × confirmation retained from b49.
- Project touch drag/reorder retained and project list now declares native vertical pan before hold activation.

---

# 2026-09-28 — b49 Android project drag + tab confirmation + 409 recovery

- Tab × now asks before moving the tab to Deleted.
- Project hold/drag/drop now uses the direct touch lane proven by the accepted tab drag path; native desktop project drag remains unchanged.
- Thread persistence now gets a fresh uncached GitHub content SHA before writes and after 409 conflicts, then reconciles/retries up to five times. This addresses the observed stale-SHA mismatch on earth__main.json.
- Existing message permanent-delete and accepted tab drag behavior retained.

---

# 2026-09-28 — b48 message removal + completed tab outcomes

- Owner device result: b47 dragging works; slight lag remains.
- Every rendered message bubble has ×; confirmation permanently removes that message from the thread JSON and writes the cleaned JSON. This supports removing an accidentally entered secret that GitHub secret protection rejects.
- Cross-project tab drop now opens the destination project and moved tab regardless of which tab was active before the move.
- + New tab naming uses an in-app modal instead of browser prompt; created tab is inserted first and opened.
- b46/b47 touch activation and target-footprint path retained.

---

# 2026-09-28 — b47 chain step 2: target footprint

- Owner validated b46 hold activation: PASS.
- Preserve b46 activation unchanged.
- While moving an armed tab, a valid tab insertion zone or project target now receives an explicit high-visibility footprint.
- Drop/persistence/repaint logic is unchanged and remains the next gate.

---

# 2026-09-27 — b46 tab hold activation gate

- Owner device result: b45 never enters drag; the named hold bubble never appears.
- Scope narrowed to the first chain link only: tab tap-and-hold activation.
- The scrollable Devstream tab ribbon now listens directly to touchstart/touchend; a stationary 350ms hold creates the existing named drag bubble. Horizontal tab scrolling remains native via `touch-action:pan-x`.
- Target, drop, persistence and repaint code remain in place but are not claimed validated until this activation gate passes.

---

# 2026-09-27 — b45 Devstream-specific drag geometry

- Owner confirmed b44 Rename/Enter works; drag/drop does not.
- Devstream has an extra main ribbon above its tab strip and a mobile overlay sidebar; drag destination resolution is now based on viewport rectangles rather than `elementFromPoint()` painted hit-testing.
- Once HOLD arms drag, the gesture explicitly disables browser touch/overscroll takeover until release. Before arming, ordinary scrolling remains available.
- b44 rename fix and b38 conflict reconciliation retained.

---

# 2026-09-27 — b44 failed-device-test corrections

## Exact failures corrected
- **Rename Enter:** project rename could throw before persistence because `isThreadBusyForMove()` still referenced scheduler symbols removed by the b34 rollback. The predicate now uses only structures that exist in the target baseline. Rename inputs also accept Android Enter by `key`, `code`, or keyCode 13 and stop propagation.
- **Drag:** b43 departed from the donor by cancelling any movement before the stationary 350ms hold completed. The donor has a second 220ms movement-arm threshold. b44 restores that donor behavior: movement before 220ms remains scroll/cancel; movement after 220ms enters drag; a stationary 350ms hold also enters drag.

## Device gate
Re-test project/tab Rename → Enter, project hold/drag/reorder, tab hold/drag/reorder, and tab hold/drag to another project.

---

# 2026-09-27 — b43 planned gesture arbiter

## Implementation
- Implemented `DEVSTREAM-DONOR-INTERACTION-PLAN.md` as one interaction-state change rather than another donor-code transplant.
- Touch project/tab first tap is now pending for the 350ms double-tap decision window instead of navigating immediately.
- Same-target second tap cancels pending navigation and opens donor-shaped context.
- 350ms hold cancels pending navigation and enters drag with the visible item name as ghost.
- Movement before hold is treated as scroll/cancel, not navigation.
- Dedicated tab-close and project controls are excluded from gesture arbitration.
- Mouse/desktop click and native drag paths remain separate.
- Existing b38 write-conflict reconciliation is retained.

## Required device gate
1. Single tap project opens once after the short decision delay.
2. Double tap project opens context without loading project between taps.
3. Hold project produces named ghost; target highlights; release persists reorder.
4. Single tap tab opens once after the short decision delay.
5. Double tap tab opens context without loading thread between taps.
6. Hold tab produces named ghost; insertion/project target highlights; release persists reorder/move.
7. Close/delete/coach/plan controls remain independent.

---

# 2026-09-27 — b42 gesture initialization correction

## Root cause
b41 invoked `bindProjectTouchDnD()` before authenticated boot/render. At that moment `#projList` did not yet exist because the app shell is created by `renderShell()`. The binder returned and was never retried. This disabled the project gesture system. Gesture binding now occurs only after successful SOT load and the first `renderSidebar()/renderTabs()`, when both interaction surfaces exist.

## Acceptance
- **DS-G42-1:** no project/tab gesture binder runs before boot.
- **DS-G42-2:** first successful application render is followed by both gesture binders.
- **DS-G42-3:** donor double-tap context and hold-drag mechanics remain unchanged.
- **DS-G42-4:** JavaScript parses after the initialization correction.

---

# 2026-09-27 — Clean rollback + donor-only interaction port

## Owner directive
The prior drag/drop attempts are rejected. Return to the last pre-drag baseline, b34 (`fa2cafc4a30f7952e66681caa4097da4fcc39b4c`), retain the later automatic thread-write reconciliation, then port the working Session Manager v3 mobile interaction without redesigning it.

## Construction
- Application baseline is b34, not b40.
- Retained only the b38 thread-file reconciliation/retry behavior needed to prevent the `another write landed first` failure.
- Ported Session Manager v3 tab gesture contract: 350ms hold creates the named drag ghost; movement highlights a project or tab insertion target; release drops; double-tap opens context.
- Ported Session Manager v3 project gesture contract: 350ms hold creates the named project ghost; before/after destination highlights; release reorders; double-tap opens context.
- Ported donor context-menu hierarchy and visual CSS; no generic legacy `#tabContext button` override.
- Tab/project ordering is persisted in Devstream SOT; cross-project tab moves persist the thread record in its destination.
- Existing undefined web state defaults ON.

## Root-cause correction
The previous project touch implementation bound to a nonexistent `#projectList`. Devstream's actual sidebar list is `#projList`, so the handler never attached. b41 binds the donor project gesture handler to the actual Devstream list.

## Acceptance
- **DS-G41-1:** source baseline is b34 plus the explicitly listed reconciliation and donor interaction additions.
- **DS-G41-2:** project mobile gesture handler binds to existing `#projList`.
- **DS-G41-3:** tab/project hold enters drag and immediately creates a ghost containing the visible name.
- **DS-G41-4:** tab/project double-tap opens donor context; hold does not open context.
- **DS-G41-5:** project and tab landing targets visibly highlight and release persists reorder/move.
- **DS-G41-6:** donor context menu structure/CSS is used without legacy Devstream button overrides.
- **DS-G41-7:** thread write conflicts reconcile/retry automatically as in b38.
- **DS-G41-8:** JavaScript parses successfully after the rollback/re-port.

## Graveyard
- **G-DS-15 — b35 through b40 interaction implementations:** rejected as the basis for further patching. Do not incrementally repair them; rebuild interaction from b34 + donor.
- **G-DS-16 — `#projectList` Devstream binding:** invalid selector. Devstream sidebar is `#projList`.

---

# Backlog
| ID | Item | Status |
|---|---|---|
| DS-1 | Build v1.0 per spec above | OPEN |

# Decision Log
- 2026-09-27: b36 rejected. Owner requires literal lift-and-shift of Session Manager v3 drag/drop and context menus for tabs and projects; no homemade prompt-based customization.
- 2026-09-27: b35 rejected on Android because drag/drop did not work and Session Manager v3 parity was incomplete. b36 copies the interaction contract: tab and project drag/reorder plus long-press action menus.
- 2026-09-27: Internet/web access defaults ON for existing undefined and new Devstream threads. Session Manager v3 is the reference for tab drag/drop: reorder within project, move between projects, desktop plus touch/pen long-press. Cross-project moves are blocked while the tab has active/queued work so the one-writer-per-project rule remains authoritative. Owner directive.
- 2026-09-24: Project artifact subdirectory is configurable; existing projects keep their paths. Project is the concurrency boundary: one active writer per project, FIFO queued work within a project, up to four projects concurrently. Deleted projects recover from the project rail; blank projects retain + and ↻ recovery controls. Owner directive.
- 2026-08-25: Project lifecycle phases adopted: Define (what/why) -> Design (how) -> Build (execution cycles) -> Ship. Phase is project-level state (badge + explicit advance), not tabs. Agent prompt is phase-aware. Owner approved.
- 2026-08-25: Continuity contract: agent replies MUST carry a STATE line (phase | open items | next step) and append a dated ledger row to the plan on every plan write. The plan is the sole persistent memory; chat is commentary. Owner approved.
- 2026-08-25: Execution is a 4-worker blob pool (concurrent builds, UI never blocked). Per-thread provider+model with validate-before-apply. Keys localStorage-only with reveal toggle + sanitation (autofill mangling was a confirmed field defect).
- 2026-08-14: App named devstream.html; standalone, not a session-manager version. Owner directive.
- 2026-08-14: Memory resides in GitHub (kanban.html methodology), not OpenClaw. Owner recommendation, confirmed — IndexedDB browser isolation is a proven limitation.
- 2026-08-14: Thread = output file (tab name) + optional input file. Owner directive.
- 2026-08-14: SUPERSEDED same day — runner removed from the critical path by owner ruling ("no extra moving part"). All engines run browser-direct in-app: venice (DEFAULT), openrouter, anthropic-direct. devstream-runner.py stays parked in the repo (thread-file contract is engine-agnostic; a runner can return later without app changes). Known trade-off accepted: builds die if the browser tab is suspended; ▶ re-runs pending work. Venice browser CORS is THEORY until first live call.
- 2026-08-14: Project cards carry a plan/status doc link (planFile in SOT projects), following the master-doc standard (talkbridge-master.md pattern).
