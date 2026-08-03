# TalkBridge — Build Specification

**This document is the whole product.** Every requirement is stated as it must be. Anything not in this document is not in scope. Anything in section 15 must not be built.

Two people who do not share a language hold a real conversation — by text, voice, or video — with everything translated both ways, and with a shared phrasebook of useful phrases they build together.

---

## 0. Governing principles

These outrank every individual requirement. A build that satisfies a requirement while violating one of these fails.

**P1 — No silent failures.** Every failure is logged. Every logged failure explains, in plain terms, what was being attempted and what went wrong. Every failure a person could care about surfaces to that person, not only to the log. Complex cycles log both their start and their finish, so a reader can tell "never started" from "started and died."

**P2 — No lag.** Nothing waits. Presence reflects reality now. Video appears now. A microphone that is on is transcribing now. Where a person would perceive a delay, that is a defect, not a tuning value.

**P3 — Durable completion, no orphaned action debt.** A completed user action is durable and does not depend on its originating room remaining open; saved phrases remain saved after leaving that room. Offline messages, phrasebook writes, and receipts may remain pending until acknowledged externally. Pending delivery or synchronization state is durable, visible where relevant, scoped to its originating room or language pair, survives reload, retries without duplication, and is never silently discarded or applied elsewhere. “Stateless” means no orphaned transient in-memory action debt requiring manual unwinding; it does not override durability, retry, or no-data-loss requirements.

**P4 — One transcript.** Text, voice, and video all write to the same transcript in the same room. Calls are a live layer over it, never a separate surface with its own record.

**P5 — Never destroy a person's data silently.** Warn instead. Export exists for this reason.

---

## 1. First run and start screen

**S0 — First run.** On first ever open: "Hi, let's get ready to chat! What's your name?" · name input, 40 characters max · Continue · inline error line for invalid entry.

**S1 — Start screen.** The app always boots here with the panel closed. It never auto-opens a room.
- Ribbon: hamburger (opens panel) · speaker toggle for auto-read, red slash when off.
- Names bar: own name (tap to edit, Enter commits) · ↔ · partner name, hidden until known.
- Empty state: flag-motif background · "Welcome" · "Please select a conversation on the left or tap the + icon to start a new chat."

**Home screen summary.** Above the room list:
- Nothing waiting: "You have 8 active rooms, there are no waiting messages."
- Things waiting: "Of 8 active rooms there are 6 waiting messages, 2 chats and 4 video calls."
- Counts equal the sum of the badges on the cards below.
- The home screen shows cards only for rooms with waiting activity. With no waiting activity it shows no room cards.
- Home cards reuse the exact three-row, two-column component in §4; the panel remains the persistent list of all rooms.
- Tapping a home card opens that room and persistently dismisses only its home-summary card. A home card can also be persistently dismissed without opening it.
- Dismissal never clears the room's underlying badges or removes the room from the panel. A later, genuinely new waiting-activity episode may create a new home-summary card for that room.

---

## 2. The system menu, credentials, and the promise

**Long-pressing the date-and-time line at the top of the panel (§3) opens the system menu.** This is the only way in, and it is deliberately not a visible menu item. Three buttons:

**2.1 — Calling & sync keys** *(primary button)* → opens the credentials screen.
- Four password fields, stored locally, entered once: **Deepgram key · TURN token ID · TURN API token · GitHub PAT** (labelled as optional, for phrasebook sync).
- Each field shows its own live status as it validates.
- The release number and build datetime are displayed here.
- Values persist across a cold start.

**2.2 — About** → "TalkBridge" · "Two people, two languages, one conversation." · the version number, filled in live · **"No account. No tracking."** · Close.

**2.3 — Privacy** → "No accounts. Conversations live on your devices, not on a server. Keys stay local. Rooms and phrasebooks are yours to delete." · Close.

**These two statements are the product's promise, not filler.** They are why there is no login, why the transcript is a local copy, why clearing yours does not touch theirs, and why credentials are shared by link rather than held by a server. Everything in §2.4 follows from them.

### 2.4 How credentials reach a device

Credentials arrive two different ways, and the difference determines what that person can do.

**Carried in an invite link.** An invite link contains the credentials the invited room needs. They let that room function — transcription, calls, phrasebook — but they are **not written to the device's credential store**. The room itself persists in that person's shell: they can leave, return later from the base URL alone, and the room still works. What they cannot do is create rooms of their own.

**Stored on the device.** Credentials in the device's own credential store are what grant initiator status. **If and only if** they are present does the room-creation control appear and can that person start rooms of their own.

**Removing stored credentials does not break anything they were invited to.** The room-creation control disappears and they can no longer start new rooms, but every room created for them as a joiner continues to work exactly as before, because those rooms carry what they need from their own invite. Nothing else unwinds (P3).

**With no credentials from either source**, the app does not work: transcription, calls, and phrasebook sync each fail with an explicit message naming what is missing (P1), and no room-creation control is offered.

---

## 3. The panel

Top to bottom, in this order:

1. **Date and time line**, updating live. **Long-press opens the system menu (§2).**
2. **App-info card** — an info icon, "TalkBridge", and beneath it "About & start screen". **Tapping it leaves whatever room is open and returns to the start screen.** It sits directly under the clock, above the room list, so the way out is always in the same place and never scrolls away with the rooms.
3. **Room list**, one card per room (§4).
4. **Floating teal + at bottom right** → create room. Present only when credentials are stored (§2.4).

Closes by tapping the scrim to its right. No close button.

---

## 4. Room card

Three rows, two columns, left column left-justified, right column right-justified.

| | Left | Right |
|---|---|---|
| Row 1 | Room name — **bold**, truncates with ellipsis | Delete |
| Row 2 | Me/Partner — not bold, truncates with ellipsis | Time since last contact |
| Row 3 | Chat, phone, video icons each with their own count badge | Language pair flags |

- Truncated text is not interactive. Tapping it opens the room, exactly like tapping anywhere else on the card.
- Elapsed time is mixed-mode: minutes, then hours, then days.
- Flags read own-language-first from each viewer's perspective.
- The three activity counts are tracked and displayed separately — a missed chat, a missed voice call and a missed video call are three different things.
- Delete is a soft delete and is recoverable.

---

## 5. Room lifecycle

**Create.** Your language · partner language · room name (the thread's topic) · auto-read toggle, **default off** · a "Grant initiator status" toggle with a calendar picker defaulting to 30 days · Cancel · OK.

**Enter.** Opens to full history, correctly translated, with the viewer's own language always on the same side. Clears only that room's badges. Re-entering shows exactly what was there before plus anything that arrived, with nothing lost and nothing duplicated. **A room created in the app appears in the room list and survives a page reload.**

**Change.** Only the room's creator can rename it.

**Soft delete.** The other person sees a "left the chat" entry in the transcript, and messaging in that room is blocked until it is restored.

**Restore.** The other person sees a "rejoined" entry, and that entry is what lifts the block.

**Hard delete.** Removes the room and its history entirely, with no recovery.

**Join.** An invite link opens the room directly. The name prompt on a first-time joiner's device renders **in the joiner's own language**, taken from the invite. A joiner sees their own language as "mine."

---

## 6. Room controls

- **Ear** — whether the partner's voice is audible during a call. Transcription continues regardless.
- **Auto-read** — reads incoming messages aloud in the receiver's language. Default off on every path a room can be created through.
- **Mute notifications** — this room only.
- All three are icon buttons: plain when on, red slash when off. Each has its own info icon.
- **Go button** — a toggle. When off, the send button is hidden from the compose strip entirely and Enter is the only way to send. Default on.
- **Chat bubble header** — where the sender-name-and-timestamp row sits on each bubble: **Top**, **Bottom**, or **Off**. Default Top. Changing it re-renders the whole transcript immediately.
- **Your name in this room** — can differ per room.
- **Room title** — creator only.
- **Export transcript** — full transcript, both languages, timestamps.
- **Clear transcript** — clears this device's copy of this room's transcript. Prompts to export first, with export as the default action; declining is possible but deliberate. The other person's copy and all saved phrases are unaffected (P3, P5).
- **Appearance** — see §7.

---

## 7. Appearance

Per side, independently, for own messages and partner messages: preset (Light / Medium / Dark) · tone within the preset · bubble color · font color · font size 10–32 · column width. Plus a room-wide header text size and colour applying to both sides' header rows. There is no Reset appearance control: a person returns to a known look by choosing a preset and adjusts font size for their own eyesight. All of it survives a cold reload.

---

## 8. The transcript

**Header.** Hamburger · own name ✎ ↔ partner name · presence · video-call icon · audio-call icon. The audio-call icon is always active — a person may start a call alone. The microphone icon sits dead centre in the ribbon.

**Invite card.** Shown until the partner joins: "Invite {name}" · QR code · link that copies on tap · Copy · Share.

**Bubble.** Own messages right, partner's left.
- Body is a two-column grid — own language, 1px divider, partner language. **Both are always shown**, and the viewer's own language is always the left column.
- Meta line: origin mark (microphone = spoken, nothing = typed) · time · receipts, on own messages only.
- Receipt dots: one small black = sent · two small black = delivered · larger blue = read. Tapping opens a status detail popup.
- Tapping a language column speaks it aloud.
- Long-press opens a menu at the point touched: **Save to phrasebook · Clarify · Delete**, in that order, with Delete styled as destructive. Delete asks for confirmation first and removes the message from this device's transcript only.
- Attachments appear inside the bubble: clip icon and filename, images preview inline, removable on own messages only. Up to 200 MB. Video is supported.
- A failed translation shows "⚠ not translated". It is never blank and never silent.

**Live captions during a call.** While a call is running, spoken lines also appear as captions over the video, separate from the transcript beneath: own captions on one side, partner's on the other, at most two on screen at once, each fading after a few seconds. They are transient — the permanent record is the transcript (P4). Captions are hidden when the call is in its small-window state.

**Speech rows update in place.** A spoken line appears as soon as it is transcribed and is then filled in with its translation when that arrives — it does not produce a second row (P2, no waiting for the complete result before showing anything).

**System markers**, centred pills: call ended with duration · missed call · declined call · name changes · someone left or returned · date separators. Every call marker states whether it was voice or video, and carries a timestamp.

**More-below indicator** ↓ appears when scrolled up.

**Compose strip.** Attach clip · textarea placeholder "Message or / to search phrases", auto-growing, with a clear × in search mode · Go button, teal, always visible, dimmed when empty. Typing "/" or ".." opens phrase search rather than sending — guarded on both Enter and Go.

---

## 9. Messages

A message is typed, or spoken and transcribed. Either way the app determines what language it is actually in, corrects itself when that differs from the room's configured language, translates it, and delivers it.

**The microphone being on means transcription is running.** There is no state where the mic is live and transcription is not. The first word spoken after enabling it is captured.

**Code-switching is supported.** A speaker in a Thai, Chinese, Korean or Arabic room who says a phrase in English is rendered and translated correctly, not garbled. The same detection and correction applies to typed text, not only speech.

One utterance produces one transcript row, updated in place. Text-to-speech speaks each message in that message's actual language. Delivery states progress from sent to delivered to read, and read receipts catch up correctly when a person returns to a room they had left — including in-app navigation, not only returning to the browser tab.

---

## 10. Calls

Voice and video, on the same transcript (P4). The video band mounts at the top of the transcript; the transcript and compose strip continue unchanged beneath it. There is no separate call window.

**Band:** remote video (placeholder when none) · local thumbnail · partner name and duration · connection indicator · mic toggle · camera toggle (red slash when off) · red end-call.

**Behaviour.**
- The caller's own speech transcribes while the call is still ringing.
- A person may call alone; their speech transcribes and translates into the transcript, and someone joining later can read all of it.
- Speech becomes live translated lines in the same transcript, marked as spoken, and remains permanently after hang-up.
- Muting the microphone genuinely releases it, so another app on the device — such as keyboard voice-typing — can use it.
- Camera off means the partner sees a camera-off state and audio continues.
- Partner states are shown: camera off · disconnected or reconnecting · speaking.
- A degrading call repairs itself, using the recovery behaviour of the version where calls worked.
- Hanging up unmounts the band, writes a "call ended" marker with duration, and triggers any pending phrasebook write-back.
- Call records are accurate: declined says declined, unanswered says missed, completed shows real duration, and each states voice or video.

---

## 11. Phrasebook

Shared between both people in a language pair. Loads on room entry, and re-fetches only when something actually changed. **Entering a room is not a change and never bumps the version.** Both people see the same book for the pair.

**Cards** carry: a header showing **who created it and when, and who last modified it and when** · usage count · a two-column body with the viewer's language left, both fields tap-to-edit, Enter commits · per column, Use (loads it into compose and counts a use) and text-to-speech · a footer of tags, clarify, and trash · panels for tags (chips with ×, add-input suggesting from **tags already used anywhere in this phrasebook**), clarify notes, and back-translation showing its result with Sounds Good / Flag. A verdict resets only when the source changes. Long-press opens a quick ring of actions. Saving something already saved shows "Already saved" and does not navigate away.

**Overlay:** pair label · new card · save now · sync indicator · search supporting `-term` exclusion · category chips with counts · trash section, restorable · footer showing count and last sync.

**Search from compose:** "/" or ".." filters live with turn09 ship's exact scoring and ordering, capped at 30 inline results, with a "No matching phrases" empty state. With an empty query it orders by usage and then creation time; with a query it uses the turn09 relevance score. The full phrasebook surface retains its own turn09 behavior.

**Saving.** A change is saved locally and it is done; leaving the room cannot undo it (P3). Writing to the central store is a separate, visibly pending step that happens on call end, on closing with unsaved changes, and on save-now, retrying on reconnect without duplication. If that write fails the person sees "trouble updating GitHub, check the debug log" and the log explains what actually happened (P1). If the central copy is newer, the write is refused, the person is told, and it retries — local data is never overwritten.

**File identity and version.** Each directional language pair has one stable, unversioned filename. The version is a field inside that JSON document; the app never creates a new filename to represent a new version. Display direction is independent of file identity: each viewer still sees their own language on the left, but reversing the columns for a joiner must not accidentally select or create a different central file.

**Cache and staleness.** Room entry loads the locally cached book immediately. Entry itself is not a phrasebook change, never marks the book dirty, never increments its JSON version, and never causes a blind full download. A lightweight remote metadata/version check may run; the full JSON is fetched only when there is no usable cache or the remote fixed file is proven newer. A dirty local book is never silently replaced. Before writing, the app obtains the current remote identity/SHA and refuses a stale write. A cache write is part of a successful load: quota or persistence failure is surfaced explicitly rather than causing an unexplained download on every later entry.

Every phrasebook operation captures immutable pair identity, so a late pull or write for pair A cannot alter pair B. Cache-write failure leaves explicit, recoverable state. Unload does not promise asynchronous write-back completion: dirty state is stored durably first and retried later.

Categories and all other card fields survive every edit path. The phrasebook is shared with another application, and neither app loses the other's changes.

---

## 12. Notifications

Per room, never aggregated. A missed chat, a missed voice call and a missed video call are distinguishable from the notification itself. Opening a room clears only that room's badge.

---

## 13. Becoming an initiator

At room creation, the creator may grant initiator status, with a calendar picker defaulting to 30 days. When the invited person joins, credentials are written to **their device's credential store** — which is what makes this different from an ordinary invite — and the room-creation control appears for them.

At expiry those stored credentials are removed. The room-creation control disappears and they can no longer start new rooms. **Everything they were invited to keeps working**, because those rooms carry what they need from their own invites (§2.4). They are simply back to being a joiner. Nothing else unwinds (P3).

---

## 14. Reference implementations — read these, do not re-derive

**This section is not optional.** Almost everything in this document already exists as working code somewhere in the repository. Prose describes *what*; these files show it *working*. Where a file is named here, read it and match its behavior — do not reinvent from the description.

The prose in this document wins on **what must be true**. The referenced code wins on **exact behavior, wording, states, and edge cases**, which prose reliably loses.

### UI and interaction — `bridge-turn09-ship.html` *(accepted baseline)*

The interface and interaction baseline is this file. Read it for: the chrome/ribbon strip and its call states · the four-tab room drawer · the appearance system · the compose strip including the exact phrase-search triggers, filtering, ordering, caps, escape behavior, and Enter/Go behavior · the incoming-call ring overlay · bubble structure, receipt dots, system pills · every phrasebook card, overlay, search, Use/send/TTS, close, and usage-count interaction · credential live-verification. For search and phrasebook interaction, this file wins over any conflicting shorthand elsewhere in this document until a later product decision explicitly supersedes it.

**Only these agreed exceptions supersede it:** the start/home screen; the three-row/two-column room card; the microphone pinned to the ribbon's true centre; phrasebook stable-filename, internal-version, cache, and staleness plumbing; explicitly rejected behavior in §15 and the matrix; and genuinely unfinished features in the recovery matrix. `bridge-turn09-post-ship.html` is explanatory lineage only. `bridge-turn10*` and `bridge-turn11*` are off the table and are not donors, authorities, or build bases. Do not reconstruct turn09's current compose, transcript-search, or phrasebook behavior from memory or later turns.

### The engine — where the working versions live

| Behavior | Read |
|---|---|
| Relay, session, message, receipts — device-confirmed | `bridge-turn07-post-ship.html` |
| Video calling, connection recovery, degraded-call repair | `bridge-turn06-post-ship.html` |
| Real language detection, normalization, code-switching across four languages | `bridge-turn08-base.html` |
| Chat surface, `/` in-chat phrase search, phrasebook ingestion and write-back cycle, card format | `bridge-turn08-pre-base.html` |
| Phrasebook coexistence with the other application | `bridge-g1.html` + `BRIDGE-PB-COMPAT-v1.md` |
| Call and video lineage, media capture | `2vid.html` |

### Genuinely new — no reference exists

Build these from this document: the room card (§4) · the home screen summary line (§1) · the microphone centred in the ribbon (§8) · the joiner's full shell (§5) · initiator elevation and the grant/expiry model (§13) · the grant flag on an invite (§2.4) — which is Link a device aimed at another person; both link types already exist in code.

### The rule that has broken this project

**Read these files. Re-implement deliberately under single ownership. Never inject, merge, or graft them.** Every catastrophic failure in this project's history came from combining working files rather than rebuilding from them — dormant code waking on load, two owners of one concern, namespace collisions, a shell and an engine that never shared a room list. One owner per concern, no exceptions, no second copy left behind.

---

## 15. Do not build

These were considered and rejected. An agent must not reintroduce them: bridge lobby or waiting screens · thank-you page · stacked bubble layout with Use buttons and a footer bar · floating call window · a separate closed-caption transcript apart from the main one · legacy phrasebook or catalog screen · phrasebook and globe buttons in the panel · a choice between chat-only and chat+call room types — every room can call.

---

## 16. Other surfaces

Attachment viewer (name, download, close) · clarify-reply modal (original and translation quoted, editable input with live back-translation, sends as a chat message) · import-phrases modal (select and deselect all, list, progress) · diagnostics and log overlay (copy, clear, close) · toasts · receipt status detail popup.

Where present, read their exact interaction in `bridge-turn09-ship.html` (§14). A surface absent there belongs in the matrix's not-implemented column; it is not a reason to consult turn10 or turn11.

---

# PART TWO — WHAT HAPPENS, IN ORDER

*Part One says what the app is. Part Two walks through what happens, step by step, with every branch. Same product, same decisions — this is the sequence view.*

**Roles:** *Initiator* = a person whose device has credentials stored. *Joiner* = a person in a room they were invited to. The same person can be both, in different rooms.

### W1. OPENING THE APP

**1.1** App opens.

**CASE 1.1.A — First time ever on this device**
- 1.1.A.1 Prompt: "Hi, let's get ready to chat! What's your name?"
- 1.1.A.2 Person enters a name, 40 characters maximum, taps Continue.
- 1.1.A.3 → go to 1.2

**CASE 1.1.B — Been here before**
- 1.1.B.1 → go to 1.2 directly

**1.2** Start screen loads. Panel closed. **No room opens automatically, ever.**

**1.3** What is on screen:

**CASE 1.3.A — No rooms yet**
- Welcome empty state: "Please select a conversation on the left or tap the + icon to start a new chat"

**CASE 1.3.B — Rooms exist, nothing waiting**
- "You have 8 active rooms, there are no waiting messages"
- No room cards appear on home; all rooms remain in the panel

**CASE 1.3.C — Rooms exist, things waiting**
- "Of 8 active rooms there are 6 waiting messages, 2 chats and 4 video calls"
- Room cards listed below, each with its own chat / phone / video badges
- Tapping a room card opens it and persistently dismisses only that summary card from the home screen
- A card can be dismissed without opening it
- Either dismissal leaves its room badges intact and the room in the panel; genuinely new later waiting activity may create a new summary card

**1.4** Is there a **+** button?

**CASE 1.4.A — Credentials ARE in this device's credential store**
- **+** is visible. → creating a room is possible, go to W2

**CASE 1.4.B — Credentials are NOT in this device's credential store**
- **+** is absent. This person cannot start rooms.
- They can still open and use any room they were invited to. → go to W5

---

### W2. CREATING A ROOM *(initiator only)*

**2.1** Taps **+**. Form appears:
- Your language ▾
- Partner language ▾
- Room name (the thread's topic)
- Auto-read toggle — **off by default**
- "Grant initiator status" toggle — **off by default**
- Calendar picker — appears when the grant toggle is on, defaults to 30 days out

**2.2** The grant decision:

**CASE 2.2.A — Grant toggle OFF**
- The invite will let the other person use this room, and nothing more.

**CASE 2.2.B — Grant toggle ON**
- The invite will additionally write credentials to the other person's device, giving them their own **+**, until the picked date.

**2.3** Taps OK. Room is created and opens.

**2.4** Room is now in the room list and **survives a page reload**.

---

### W3. IN THE ROOM, BEFORE THE PARTNER JOINS

**3.1** Invite card is shown: "Invite {name}" · QR code · link (tap copies) · Copy · Share.

**3.2** What the initiator can do while alone:

**CASE 3.2.A — Types a message**
- Message is translated and posted to the transcript, waiting for the partner.

**CASE 3.2.B — Turns on the microphone**
- Transcription starts immediately. First word is captured. Speech becomes transcript lines.

**CASE 3.2.C — Starts a call alone**
- Allowed. The audio-call icon is always active.
- Own speech transcribes and translates into the transcript.
- Whoever joins later can read all of it.

**3.3** Shares the link — QR in person, or copy/share to any channel.

---

### W4. THE JOINER OPENS THE INVITE LINK

**4.1** Link opens on their device.

**4.2** Do they have a name yet?

**CASE 4.2.A — First time ever using the app**
- 4.2.A.1 Name prompt appears **in the joiner's own language**, read from the invite's language pair — before they have configured anything.
- 4.2.A.2 They enter a name, tap Continue.

**CASE 4.2.B — Used the app before**
- Their existing name is used. No prompt.

**4.3** The room is created on their device. Their own language is "mine"; the initiator's is "theirs".

**4.4** What happens with the credentials in the link:

**CASE 4.4.A — Invite carried NO grant** *(the toggle at 2.2.A was off)*
- 4.4.A.1 The room works fully: chat, voice, video, phrasebook.
- 4.4.A.2 Credentials are **not** written to their device's credential store.
- 4.4.A.3 **No + button.** They cannot create rooms.

**CASE 4.4.B — Invite carried a grant** *(the toggle at 2.2.B was on)*
- 4.4.B.1 The room works fully, same as above.
- 4.4.B.2 Credentials **are** written to their device's credential store, with the expiry date.
- 4.4.B.3 **The + button appears.** They can now create their own rooms. → they are an initiator, go to W2 whenever they choose.

**4.5** Both people are now in the room. The invite card disappears.

---

### W5. THE JOINER COMES BACK LATER

**5.1** How do they return?

**CASE 5.1.A — Opens the base URL, no link**
- 5.1.A.1 Shell loads. Their room list includes this room.
- 5.1.A.2 They open it. It works. Full history is there.

**CASE 5.1.B — Opens the original invite link again**
- 5.1.B.1 Same room opens. No duplicate is created.

**CASE 5.1.C — Opens a *different* invite link from the same person**
- 5.1.C.1 A **second, separate room** is created — a different thread with the same person.
- 5.1.C.2 Both rooms appear in their list, each with its own name, its own transcript, its own phrasebook direction, its own badges.
- 5.1.C.3 This is the point of the product: several parallel threads with one person, not one endless conversation.

**5.2** Is there a **+**?

**CASE 5.2.A — They were granted, grant is still valid**
- Yes. They can create rooms.

**CASE 5.2.B — They were never granted**
- No. They use their invited rooms only.

**CASE 5.2.C — They were granted, and the grant has now expired**
- 5.2.C.1 The stored credentials are removed from their device.
- 5.2.C.2 **The + disappears.** No new rooms.
- 5.2.C.3 **Every room they were invited to keeps working, unchanged**, because each carries what it needs from its own invite.
- 5.2.C.4 Rooms *they created* while granted go read-only for both people. → W12

---

### W6. THE TWO LINKS — one difference

Every link carries credentials. The **only** difference is whether the receiving device *stores* them. That single bit is the whole model.

| Link | Credentials travel | Stored on their device | They get a **+** |
|---|---|---|---|
| **Share room** | Yes | **No** | No |
| **Link a device** | Yes | **Yes** | Yes |

**6.1 Share room.** The recipient uses the room fully, forever, returning from the base URL. They cannot create rooms. → W4.4.A

**6.2 Link a device.** Transfers your credentials into the receiving device's storage, so it has the **+** too.

Pointed at **your own second phone**, that is linking a device. Pointed at **another person**, that is elevating them. Same link, same flag, same behavior — the only difference is who you send it to. **Elevating someone is linking their device.** → W4.4.B

The "Grant initiator status" toggle at room creation (W2.2) is therefore not a third mechanism. It is choosing which of these two links the invite will be.

**CASE 6.2.A — You have credentials in storage**
- 6.2.A.1 They transfer. The receiving device gets the room and the **+**.

**CASE 6.2.B — You do not have credentials in storage**
- 6.2.B.1 Nothing transfers, because there is nothing to transfer.
- 6.2.B.2 It behaves exactly like Share room. No special handling needed.

---

### W7. CONVERSATION — the modes, one transcript

**7.1** Everything below writes to the same transcript, in the same room. There is no separate call screen and no separate caption view.

**CASE 7.1.A — Typing**
- 7.1.A.1 Type, send. Detected, translated, delivered.
- 7.1.A.2 Bubble shows both languages side by side, viewer's own language on the left.
- 7.1.A.3 Receipt dots progress: one black = sent · two black = delivered · larger blue = read.

**CASE 7.1.B — Speaking, no call**
- 7.1.B.1 Microphone on → **transcription is running.** No gap, no delay.
- 7.1.B.2 Speech becomes a transcript row, marked as spoken.
- 7.1.B.3 Microphone off → transcription stops.

**CASE 7.1.C — Voice call**
- 7.1.C.1 Tap the audio-call icon.
- 7.1.C.2 **Own speech transcribes while it is still ringing**, before anyone answers.
- 7.1.C.3 Partner's device: → go to W8
- 7.1.C.4 Once connected, both sides' speech transcribes and translates into the same transcript.

**CASE 7.1.D — Video call**
- 7.1.D.1 Tap the video-call icon.
- 7.1.D.2 Video band mounts at the **top of the transcript.** Transcript and compose strip continue beneath it, unchanged.
- 7.1.D.3 Otherwise identical to 6.1.C.

**7.2** During any call:

**CASE 7.2.A — Mutes the microphone**
- 7.2.A.1 The microphone is genuinely released.
- 7.2.A.2 Another app can use it — keyboard voice-typing works.
- 7.2.A.3 Unmute → transcription resumes.

**CASE 7.2.B — Turns the camera off**
- Partner sees a camera-off state. Audio continues.

**CASE 7.2.C — Ear off**
- Partner's voice is not audible to them. **Transcription continues.**

**CASE 7.2.D — Connection degrades**
- The call repairs itself, without a manual redial.

**7.3** Other things possible at any time in the room:

**CASE 7.3.A — Sends an attachment**
- 7.3.A.1 Taps the clip in the compose strip, picks a file. Images and video, up to 200 MB.
- 7.3.A.2 Appears inside the bubble: clip icon and filename; images preview inline.
- 7.3.A.3 Tapping it opens the viewer — name, download, close.
- 7.3.A.4 Removable on own messages only.
- 7.3.A.5 If it fails, they are told why (P1).

**CASE 7.3.B — Uses a saved phrase: "/" and ".." on the compose strip**

Two triggers, identical behavior. Either one turns the compose strip into a phrase search without ever leaving it.

- 7.3.B.1 **Trigger.** A "/" as the very first character, or ".." as the first two characters, switches the compose strip into search mode on the keystroke. Nothing is submitted; nothing is sent.
- 7.3.B.2 **Escape hatch.** Exactly "//" is *not* search and is handled as ordinary compose text, exactly as turn09 ship does it.
- 7.3.B.3 **The query is what follows the trigger.** "/coffee" and "..coffee" both search for *coffee*. The trigger characters are never part of the search.
- 7.3.B.4 **The inline search drawer opens over the transcript**, showing the room's language pair and filtering live on every keystroke. `-word` excludes. Turn09 ship owns scoring and ordering: relevance while querying, otherwise usage then creation time, capped at 30 inline results. Empty state: "No matching phrases".
- 7.3.B.5 **Deleting back past the trigger closes it.** Remove the "/" and the drawer closes, the strip is an ordinary composer again, whatever is typed remains. Escape also closes it and clears the strip.

**7.3.B.6 — Then one of three things happens:**

**CASE 7.3.B.6.a — Taps Use on a result**
- The chosen language loads into the composer and sends. The card's usage count goes up.

**CASE 7.3.B.6.b — Presses Enter, or taps Go**
- **This does not send a message.** Both do the same thing: the inline drawer closes, the compose strip clears, and the **full phrasebook overlay opens, pre-filtered by whatever was typed.**
- A partial query is deliberately enough — type "/cof", press Enter, and the whole phrasebook opens already filtered to *cof*, where cards can be edited, tagged, clarified, or managed.
- This is the escalation path: the strip is for finding a phrase fast, the overlay is for working with the phrasebook.

**CASE 7.3.B.6.c — Abandons it**
- Deletes back past the trigger, or presses Escape. No search, no message, nothing sent.

**7.3.B.7 — Search text can never be sent as a message.** Whatever the route, if the strip is in search mode the send path exits search first. A query is never delivered to the other person by accident.

**CASE 7.3.C — Asks what something meant (Clarify)**
- 7.3.C.1 Long-presses a bubble → Clarify.
- 7.3.C.2 A modal opens showing the original and its translation, quoted.
- 7.3.C.3 They type a question. It back-translates live as they type, so they can see what the other person will read.
- 7.3.C.4 Send → it lands in the transcript as an ordinary chat message.

---

### W8. THE PARTNER'S SIDE OF AN INCOMING CALL

**8.1** A full-screen ring overlay appears over the app: a pulsing teal circle with a phone icon · the caller's name · a sub-line · and two round buttons below it — green Accept, red Decline (its icon rotated to read as a hang-up).

**8.2** If their device is locked or the app is backgrounded, a push notification arrives instead. Tapping it opens the app directly to this ring screen. Muting the room suppresses it.

**8.3** Outcomes:

**CASE 8.3.A — Accepts** → ring overlay closes, call connects, → 7.1.C.4

**CASE 8.3.B — Declines**
- Both transcripts get a centred pill: declined, naming voice or video.

**CASE 8.3.C — Does not answer**
- Ring times out. Both transcripts get: missed, naming voice or video. **Never labelled "ended."**
- On a locked phone, a missed-call notification follows.

**8.4** When a call ends normally:
- 8.4.1 Video band unmounts.
- 8.4.2 Centred pill: call ended, with real duration, naming voice or video.
- 8.4.3 Everything spoken during the call **stays in the transcript permanently.**
- 8.4.4 Any pending phrasebook changes write back now.

---

### W9. SAVING A PHRASE — inside any of the above

**9.1** Long-press a bubble → Save to phrasebook · Clarify · Delete.

**9.2** Saves.

**CASE 9.2.A — New phrase**
- 9.2.A.1 Card is created, saved **locally, immediately, done.** Indicator green.
- 9.2.A.2 Writing to the shared store is a separate step, later.

**CASE 9.2.B — Already saved**
- Toast: "Already saved." No navigation, nothing else happens.

**9.3** The shared write happens on call end, on closing with unsaved changes, or on save-now.

**CASE 9.3.A — Write succeeds** → silent.

**CASE 9.3.B — Write fails**
- 9.3.B.1 Person sees: "trouble updating GitHub, check the debug log."
- 9.3.B.2 Debug log explains what actually went wrong.
- 9.3.B.3 The local change is untouched.
- 9.3.B.4 Retries on reconnect.

**CASE 9.3.C — Shared copy is newer**
- Write refused, person informed, retried. Local data never overwritten.

**9.4** Whatever happens to the room afterwards, **the saved phrase is saved.** Independent, permanently.

---

### W9A. EDITING A PHRASE CARD — the source/target/verdict cycle

Both text fields on a card are directly editable. Enter commits. This cycle is exact and was hard-won; it must survive intact.

**9A.1 — Enter in the source field**

- 9A.1.1 **The cursor stays where it was.** It does not jump to the top of the bubble. After the card re-renders, focus returns to the same field with the caret **at the end of the text**. The keyboard stays up.
- 9A.1.2 **Enter always re-translates — changed or not.** Pressing Enter on untouched text still re-runs the translation into the target field.
- 9A.1.3 **The re-translation always re-runs the back-translation.** Every time, unconditionally.

**9A.2 — If the source text actually changed**, additionally:

- 9A.2.1 The verdict **resets to pending.**
- 9A.2.2 The **✓Verified tag is removed** from the card.
- 9A.2.3 Both are recorded in the card's history: "Verdict reset to pending (source changed)."

**9A.3 — If the source text did not change**, the verdict and the ✓Verified tag are **left alone.** The re-translation and back-translation still run (9A.1.2, 9A.1.3), but a previously-good verdict is not thrown away for nothing.

**9A.4 — Editing the target field by hand**
- The typed target is kept as written, not overwritten. The back-translation re-runs against it.

**9A.5 — Setting a verdict**

**CASE 9A.5.A — Sounds Good**
- Verdict set to good · **✓Verified tag added** · recorded in card history.

**CASE 9A.5.B — Flag**
- Verdict set to flagged · **✓Verified tag removed** · recorded in card history.

**9A.6 — Removing the ✓Verified tag by hand** *(the coupling runs both ways)*
- The verdict **also resets to pending**, and the history records what it had been: "Verdict reset to pending (Verified tag removed, was good)."

**9A.7** Every mutation on a card — edit, tag added, tag removed, verdict set or reset — is appended to that card's own history with who did it and when.

---

### W9B. CREATING A NEW PHRASE IN THE PHRASEBOOK SURFACE

**9B.1** Taps **+** in the phrasebook overlay header.

**CASE 9B.1.A — An empty card already exists**
- 9B.1.A.1 **No second empty card is created.** Focus jumps to the existing empty one.
- 9B.1.A.2 This is deliberate: repeated taps never stack blank cards.

**CASE 9B.1.B — No empty card exists**
- 9B.1.B.1 A new card is created at the **top of the list**, with the room's language pair, category "unassigned", no tags, no verdict, and a history entry reading "Created".
- 9B.1.B.2 Saved locally immediately (P3). Sync indicator goes dirty.
- 9B.1.B.3 Any active search is cleared, so the new card is actually visible rather than filtered out.
- 9B.1.B.4 **Focus lands in its source field**, ready to type.

**9B.2** They type the source and press Enter → the full cycle in W9A.1 runs: translates into the target, then back-translates, cursor stays put.

**9B.3** From there it is an ordinary card — taggable, clarifiable, verdictable, usable.

---

### W10. CHANGING THE ROOM

**10.1** Who is changing it?

**CASE 10.1.A — The creator**
- Can rename the room. Can change everything in 10.2.

**CASE 10.1.B — The other person**
- **No editable room-title field.** Can change everything in 10.2 for themselves only.

**10.2** Either person, for themselves: their own display name in this room · Ear · Auto-read · Mute notifications · full Appearance · Export transcript · Clear transcript.

**10.3** Clear transcript:
- 10.3.1 Prompt offers export first, **export is the default action.**
- 10.3.2 Declining export is possible, but deliberate.
- 10.3.3 It clears **their own copy, on their own device.** The other person's transcript is untouched. The completed action is durable and scoped to the device where it was taken (P3).
- 10.3.4 The room remains. **Saved phrases are untouched** (P3).

---

### W11. LEAVING AND COMING BACK

Leaving is a single, complete action. It is recorded and it is done (P3).

**CASE 11.A — Leaves the room (soft delete)**
- 11.A.1 Room moves to the recoverable area on their device.
- 11.A.2 Transcript records it: **"Mike left the room."**
- 11.A.3 That entry puts the room into **read-only**. History stays visible. No new messages, no calls.

**CASE 11.B — Restores from soft delete**
- 11.B.1 Room returns to the active list, exactly as it was.
- 11.B.2 Transcript records it: **"Mike returned."**
- 11.B.3 That entry takes the room **out of read-only.** Restoring alone does not — the entry does.

**CASE 11.C — Hard delete**
- Room and history removed entirely. No recovery. Saved phrases still unaffected (P3).

---

### W12. WHEN A GRANT EXPIRES

Elevation is trust. When it lapses, the trust lapses with it.

**12.1** Stored credentials are removed from that device.

**12.2** The **+** disappears. No new rooms.

**12.3** Rooms they were *invited to* keep working, unchanged — each carries what it needs from its own invite (W4.4).

**12.4** Rooms they *created* while granted go **read-only for both people.** History stays visible; no new messages or calls. Same read-only state as W11.A.3, reached a different way.

---

# PART THREE — HOW YOU PROVE IT

*Part One says what the app is. Part Two says what happens. Part Three is how a build agent checks its own work and a person confirms it on a phone.*

**Convention:** `PASS IF` is the observable condition. Two real devices unless noted. No timing thresholds are invented here — where speed matters the condition is "no perceptible delay," per P2.

## T0. Governing principles

| ID | PASS IF |
|---|---|
| T0-1 | No swallowed errors anywhere — every failure path produces a log entry |
| T0-2 | Force any failure → the log names the operation and the actual cause, not a bare code |
| T0-3 | Trigger a phrasebook sync → log shows an explicit start entry and an explicit finish-or-fail entry |
| T0-4 | Force a central write failure → the person sees a prompt, not only a log line |
| T0-5 | No action leaves a pending state that must later be unwound (P3) |
| T0-6 | Nothing is ever silently discarded — storage pressure warns, it does not truncate (P5) |

## T1. System menu, credentials, promise

| ID | PASS IF |
|---|---|
| T1-1 | Long-press the panel's date-time line → menu opens with exactly three buttons: Calling & sync keys, About, Privacy |
| T1-2 | There is no other route to credentials — no gear, no menu item |
| T1-3 | About shows the tagline, the live version number, and "No account. No tracking." |
| T1-4 | Privacy shows the local-only statement |
| T1-5 | Keys screen shows four password fields and the release number + build datetime |
| T1-6 | Enter a bad value → that field shows its own failure, naming that field |
| T1-7 | Valid values persist across a cold start |
| T1-8 | With no credentials → mic, call, and phrasebook sync each fail with an explicit named message, and there is no **+** |

## T2. Panel and home screen

| ID | PASS IF |
|---|---|
| T2-1 | Order top to bottom: date-time line · app-info card · room list · floating **+** |
| T2-2 | App-info card sits above the room list and does not scroll away as rooms accumulate |
| T2-3 | Tap the app-info card while in a room → leaves the room, returns to start screen |
| T2-4 | Panel closes by tapping the scrim; there is no close button |
| T2-5 | **+** present only when credentials are stored |
| T2-6 | 8 rooms, nothing unread → "You have 8 active rooms, there are no waiting messages" |
| T2-7 | 8 rooms, 2 unread chats + 4 missed video → "Of 8 active rooms there are 6 waiting messages, 2 chats and 4 video calls" |
| T2-8 | Summary numbers equal the sum of the badges below |
| T2-9 | Tap a room name on a card → opens that room, and the card is dismissed from the home screen |
| T2-10 | Dismiss a card without opening → card gone, unread counts intact |
| T2-11 | App always boots to the start screen with the panel closed — never auto-opens a room |
| T2-12 | First ever open → name prompt, 40 char max, inline error on invalid |
| T2-13 | No waiting activity → no room cards on the home screen; all rooms remain in the panel |
| T2-14 | Dismiss a home card, cold-reload → that summary card remains dismissed, room and badges remain in the panel |
| T2-15 | New activity arrives after a prior dismissal → a new home-summary card may appear for the new waiting episode |
| T2-16 | Home and panel render the same three-row/two-column room-card component |

## T3. Room card

| ID | PASS IF |
|---|---|
| T3-1 | Row 1: room name bold left, delete right. Row 2: Me/Partner left, elapsed right. Row 3: icons+badges left, flags right |
| T3-2 | Tap truncated text → the room opens. No popup appears anywhere |
| T3-3 | 40-char name at largest font → one line, ellipsis, no wrap |
| T3-4 | 2 missed chats + 1 missed call + 0 video → badges read 2, 1, none |
| T3-5 | Elapsed time shows minutes, then hours, then days |
| T3-6 | Each viewer sees their own flag first |
| T3-7 | Mic icon's measured centre equals the ribbon's measured centre |
| T3-8 | Room card contains no Share or Diagnostics icon inherited from `test.html` |

## T4. Room lifecycle

| ID | PASS IF |
|---|---|
| T4-1 | Cannot complete creation with the room name blank |
| T4-2 | Auto-read is off on every creation path — create, join, link a device |
| T4-3 | **Create a room, force-reload the page → room is in the list, opens, same name** |
| T4-4 | Two rooms with the same partner, different names → both listed, independently openable |
| T4-5 | Two rooms unread → enter one → only that one clears |
| T4-6 | Enter, exchange 3 messages, leave, re-enter → all 3 present, correct order, no duplicates |
| T4-7 | Joiner opens room settings → no editable room-title field |
| T4-8 | Leave a room → other side's transcript reads "left the room" and that room becomes read-only |
| T4-9 | Restore it → other side reads "returned" and read-only lifts |
| T4-10 | Hard delete requires confirmation; afterwards absent from list and from the recoverable area |
| T4-11 | Open an EN→TH invite on a fresh device → the name prompt renders in Thai |
| T4-12 | Joiner's own language is the left column on their own screen |
| T4-13 | A second, different invite from the same person → a second separate room, not a merge |
| T4-14 | Re-opening the same invite → same room, no duplicate |

## T5. The two links

| ID | PASS IF |
|---|---|
| T5-1 | Share room link → recipient uses the room fully, has no **+** |
| T5-2 | Recipient of a Share link returns from the base URL alone → room still works |
| T5-3 | Link a device → credentials land in that device's store and **+** appears |
| T5-4 | Link a device from a device with no stored credentials → behaves exactly like Share room, no error |
| T5-5 | Grant toggle at room creation produces a Link-a-device link, not a third kind |

## T6. Room controls

| ID | PASS IF |
|---|---|
| T6-1 | Ear off during a call → partner's voice inaudible, transcript still updating |
| T6-2 | Auto-read on → partner's message arrives → spoken in the receiver's language |
| T6-3 | Mute room A, message arrives in room B → B alerts, A silent |
| T6-4 | Name X in room A, Y in room B → each partner sees the respective name |
| T6-5 | Ear, Auto-read, Mute each render plain when on, red-slashed when off, each with its own info icon |
| T6-6 | Go button off → send button disappears; Enter still sends |
| T6-7 | Chat bubble header set to Bottom → transcript re-renders with headers at the bottom; Off → no header row |
| T6-8 | Own font 32 and partner font 10 → renders exactly that, no cross-effect |
| T6-9 | Appearance survives a cold reload |
| T6-10 | Export produces a file with the full transcript, both languages, timestamps |
| T6-11 | Clear prompts export first, with export as the default action |
| T6-12 | Decline export → still clears |
| T6-13 | Clear affects only this device's copy — partner's transcript intact, saved phrases intact |

## T7. Presence and messages

| ID | PASS IF |
|---|---|
| T7-1 | Partner backgrounds the app → presence goes inactive with no perceptible delay |
| T7-2 | Partner returns to foreground → reconnects immediately, without leaving and re-entering the room |
| T7-3 | Message to room B while viewing room A → B's badge increments without opening B |
| T7-4 | Message sent while recipient offline → shows undelivered, never a false delivered |
| T7-5 | Messages arrive while on the home screen → open that room → sender sees read |
| T7-6 | **Mic on → speak immediately → first word captured, no startup gap** |
| T7-7 | Mic off → speak → nothing appears |
| T7-8 | Type in language A → partner receives both languages correctly |
| T7-9 | **TH-configured speaker says an English phrase → rendered as English and translated correctly, not garbled** |
| T7-10 | Same for Chinese, Korean, Arabic |
| T7-11 | Type a phrase in the other language → handled identically to T7-9 |
| T7-12 | Force a translation failure → "⚠ not translated" appears; never blank, never silent |
| T7-13 | One spoken sentence → exactly one transcript row, filled in as the translation arrives |
| T7-14 | Partner writes Thai → read aloud in Thai, not a default language |
| T7-15 | Receipt dots progress: one black, two black, larger blue; tap opens the status detail |
| T7-16 | Tap a language column → that language is spoken |
| T7-17 | Long-press → menu at the touch point, order Save · Clarify · Delete, Delete destructive and confirmed |
| T7-18 | Attach a 197MB video → sends, appears in the bubble, opens in the viewer |
| T7-19 | Attachment failure → explicit reason shown |

## T8. Compose strip and phrase search

| ID | PASS IF |
|---|---|
| T8-1 | "/" as first character → search mode opens on the keystroke |
| T8-2 | ".." as first two characters → identical behavior |
| T8-3 | Exactly "//" → NOT search; remains ordinary compose text and follows turn09 ship's send behavior |
| T8-4 | "/coffee" and "..coffee" both search for *coffee* — trigger chars never part of the query |
| T8-5 | Filters live on every keystroke; `-word` excludes; queried results use turn09 relevance scoring, empty-query results order by usage then creation; capped at 30 inline results; "No matching phrases" when empty |
| T8-6 | Delete back past the trigger → search closes, remaining text intact |
| T8-7 | Escape → closes and clears |
| T8-8 | **Enter while in search does NOT send — it opens the full phrasebook, pre-filtered by what was typed** |
| T8-9 | Go button while in search does exactly the same as Enter |
| T8-10 | Partial query works: "/cof" + Enter → phrasebook opens filtered to *cof* |
| T8-11 | Tap Use on a result → that language loads into the composer and sends; usage count increments |
| T8-12 | A search query can never be delivered to the other person |

## T9. Calls

| ID | PASS IF |
|---|---|
| T9-1 | Place a call, speak before it is answered → own speech appears in the transcript |
| T9-2 | Voice call connects, both hear each other |
| T9-3 | Video call connects, both see and hear |
| T9-4 | **Hold up fingers → visible on the other device with no perceptible delay** |
| T9-5 | **A five-minute call produces zero transcription-service disconnects in the log** |
| T9-6 | Same phrase spoken on a call and typed in chat → equivalent quality, no fragmentation |
| T9-7 | **Mute the call mic → keyboard voice-typing works in another app** |
| T9-8 | Unmute → transcription resumes |
| T9-9 | Camera off → partner sees camera-off state, audio continues |
| T9-10 | Incoming call → full-screen ring overlay: pulsing circle, caller name, green Accept, red Decline |
| T9-11 | Locked device → push notification; tapping it opens directly to the ring screen |
| T9-12 | Muted room suppresses the ring notification |
| T9-13 | Decline → both transcripts say declined, naming voice or video |
| T9-14 | Let it ring out → both say missed, never "ended"; locked device gets a missed-call notification |
| T9-15 | Answer, wait 30s, hang up → shows ended with a real duration |
| T9-16 | Video band mounts at the top of the transcript; compose strip unchanged beneath |
| T9-17 | Live captions appear over the video, max two at a time, fading; own and partner's on opposite sides |
| T9-18 | Speech during a call remains in the transcript permanently after hang-up |
| T9-19 | Kill the network briefly → call recovers without a manual redial |
| T9-20 | Start a call alone → own speech transcribes; someone joining later can read all of it |
| T9-21 | Hang up → any pending phrasebook changes write back |

## T10. Phrasebook

| ID | PASS IF |
|---|---|
| T10-1 | Enter a room → phrasebook available for that language pair |
| T10-2 | Enter, leave, re-enter with no remote change → no re-fetch in the log |
| T10-3 | **Enter a room three times without editing → stored version unchanged** |
| T10-4 | Both people see the same shared book for the pair |
| T10-5 | Save from a chat bubble → card appears with both languages |
| T10-6 | Save something already saved → "Already saved" toast, no navigation |
| T10-7 | Tap **+** in the overlay with an empty card present → focuses that card, does not create a second |
| T10-8 | Tap **+** with no empty card → new card at top of list, active search cleared, focus in the source field |
| T10-9 | New card carries category "unassigned" and a "Created" history entry |
| T10-10 | **Enter in source → caret returns to the end of that field, keyboard stays, does not jump to the top of the bubble** |
| T10-11 | **Enter in source with NO change → still re-translates and still re-runs back-translation** |
| T10-12 | **Enter in source with NO change → verdict and ✓Verified tag are preserved** |
| T10-13 | **Enter in source WITH a change → verdict resets to pending AND ✓Verified tag is removed, both logged** |
| T10-14 | Edit the target by hand → typed text kept, back-translation re-runs against it |
| T10-15 | Verdict Sounds Good → ✓Verified tag added, logged |
| T10-16 | Verdict Flag → ✓Verified tag removed, logged |
| T10-17 | **Remove the ✓Verified tag by hand → verdict also resets, log records what it had been** |
| T10-18 | Every card mutation appends to that card's history with author and timestamp |
| T10-19 | Card header shows created-by-and-when AND modified-by-and-when |
| T10-20 | Tag input suggests from tags already used anywhere in this phrasebook |
| T10-21 | Categories survive edit, comment, use, and soft-delete-then-restore |
| T10-22 | Soft-delete → appears in trash section, restorable with all fields |
| T10-23 | Edit a card offline → saved locally, indicator green, no pending state shown |
| T10-24 | Force the central write to fail → "trouble updating GitHub, check the debug log"; log explains the real cause; local change intact |
| T10-25 | Central copy newer → write refused, person informed, retried, local never overwritten |
| T10-26 | Edit in the other application, then in this one → neither loses the other's change |
| T10-27 | Write-back fires on call end, on closing with unsaved changes, and on save-now |
| T10-28 | Repeated writes update one stable directional-pair filename; no versioned filename is created |
| T10-29 | The fixed file's JSON version changes only for a real accepted content change, never for entry or display-direction reversal |
| T10-30 | Joiner display reverses columns to put their language left without selecting or creating the wrong central file |
| T10-31 | Cached book exists and remote metadata/version is unchanged → no full JSON download |
| T10-32 | Remote fixed file is newer and local is clean → one full fetch, cache persists, subsequent entry does not fetch again |
| T10-33 | Local book is dirty and remote is newer → local is not overwritten; conflict is explicit and retryable |
| T10-34 | Cache persistence/quota failure → named storage error, local dirty state retained, no false stale-download loop |

## T11. Notifications and elevation

| ID | PASS IF |
|---|---|
| T11-1 | Two rooms each receive a message → two separate notifications, never aggregated |
| T11-2 | Missed chat, missed call, missed video → distinguishable from the notification itself |
| T11-3 | Open a room from its notification → only that room's badge clears |
| T11-4 | Creation form has a "Grant initiator status" toggle |
| T11-5 | Toggle on → calendar picker appears, defaults to 30 days out |
| T11-6 | Joiner opens a granted invite → credentials stored, **+** appears |
| T11-7 | Past expiry → credentials removed, **+** gone |
| T11-8 | Past expiry → every room they were INVITED to still works normally |
| T11-9 | Past expiry → rooms they CREATED while granted are read-only for both people, history still visible |

---

## T12. Regression gates — run these every single release

`T0-1` no swallowed errors · `T4-3` room survives reload · `T7-6` mic on means transcribing · `T7-9` code-switching · `T8-8` Enter escalates, never sends · `T9-5` sustained transcription · `T9-7` mute releases the mic · `T10-3` no version bump on entry · `T10-13` verdict/tag cycle on source change · `T7-2` reconnect on foreground

**These ten are where this project has actually broken.** A release failing any one of them rolls back. No forward patching.

---

## T13. Diff-variance guardrail

Before building: state the expected diff. After building: compare actual.

- **Over 5% variance** → explain and get explicit approval before any device testing.
- **Over 10% variance** → full scrutiny before anything proceeds.

This exists because a single unreviewed commit once deleted 9,759 lines and the project spent a month rebuilding around the hole.

**These release-process rules remain active requirements, not historical commentary.** The named regression gates run on every release; any failure requires rollback rather than forward patching. The diff-variance guardrail and its existing thresholds remain active. A future process change must explicitly amend this specification—silence in a prompt or plan does not supersede it.

---

# PART FOUR — BASELINE AND STATIC LIFECYCLE AUDIT

This part records what survived, what deliberately supersedes it, and what must be proven before a build plan is written. It is not permission to backport or graft donor code. `stuff-_.html, _.md-lineage.json` is the definitive chronology; behavioral authority is assigned below rather than inferred from the newest filename.

## 17. Coherent baseline matrix

| Accepted from `bridge-turn09-ship.html` | Explicitly superseded | Plumbing that must be proven | Not implemented correctly yet |
|---|---|---|---|
| Transcript appearance and interaction | Start/home screen behavior (§1) | Room exit, switch, re-entry, and late-callback isolation | Final flag motif on every required surface |
| Compose strip and all transcript/phrasebook search behavior | Existing room-card layout (§4) | Deepgram socket ownership and media teardown | Device-level notifications and locked-device ring delivery |
| Phrasebook card, overlay, Use/send/TTS, close, search, and usage behavior | Share/Diagnostics controls inherited from `test.html` — rejected | Relay teardown, reconnect, background listeners, receipts, and badges | Waiting-activity home surface and persistent dismissals |
| Bubble layout, receipts, system pills, room drawer, and appearance controls | Mic position: it is pinned to the strip's true centre, not centred inside a changing group | Transcript rehydration, history merge/dedupe, and call-to-transcript continuity | Three-row/two-column room card and true-centre mic geometry |
| Call and in-room video interaction present in turn09 ship | Reset Appearance — rejected | Joiner room identity, language direction, and base-URL return | Stable PB filename, JSON-internal version, and cache-first stale check |
| Turn09 wording and edge behavior | Any turn10/turn11 behavior or donor claim | PB dirty state, cache persistence, conflict refusal, and write-back boundaries | Storage capable of retaining PB cache and supported attachments |

**Authority rule.** Column 1 is the user-interaction baseline. Column 2 is normative product correction. Column 3 is not satisfied by visual similarity or a happy-path demonstration; each seam needs lifecycle evidence. Column 4 is honest unfinished scope, not permission to hide a stub behind working UI. Turn06/turn07 are lifecycle evidence only and must not be copied wholesale into turn09.

## 18. Static lifecycle audit

### 18.1 The lifecycle contract recovered from turn06 and turn07

Turn06 made session ownership explicit through a monotonically increasing session epoch, a call-phase state machine, preserved last-session context, desired-versus-actual microphone/transcription state, and one unified teardown. Turn07 carried that contract forward and added phrasebook write-back at the leave/hangup boundary.

The reusable contract is:

1. Every asynchronous session captures the room ID and a generation/owner token when it begins.
2. A room switch, exit, hangup, or replacement session invalidates the prior token before starting new work.
3. A late result checks both token and room ID before touching global state, UI, transcript, sockets, media, or phrasebook.
4. Teardown is idempotent and completely releases owned tracks, audio resources, primary and secondary Deepgram sockets, relay sockets, peer connections, listeners, heartbeats, watchdogs, retries, ringing, duration timers, signaling state, and meters; it saves durable state before clearing identity.
5. Post-session routing captures the role, room, language pair, and reason before live state is cleared.
6. Phrasebook write-back starts while the correct pair/room identity still exists. It does not authorize clearing dirty state until the remote write succeeds.

Call/session rejoin, ordinary room re-entry, foreground reconnect, and restore-after-soft-delete are four different events. They reuse the same room identity but have different state transitions and must not be collapsed into one `rejoin` path.

### 18.2 What turn09 ship demonstrably retains

- `enterRoom()` loads the selected room's transcript before rendering and calls `leaveRoomInternals()` when changing rooms.
- `leaveRoomInternals()` ends an active call, stops an active chat mic, disconnects the foreground relay, initiates dirty PB write-back, and clears active room/transcript state.
- The foreground relay uses a socket-local identity check, so callbacks from a superseded relay socket cannot own current connection state.
- Foreground return proactively reconnects a missing relay instead of waiting for a browser-delayed close event.
- Background LISTEN sockets are keyed by room ID, route messages into that room's stored transcript, and check socket identity before scheduling a reconnect.
- The primary Deepgram socket uses a socket-local identity guard. Its stale close event is ignored instead of tearing down a replacement connection.
- Call mount records whether chat mic was on, stops the old transcription pipeline before binding call media, and teardown restores the exact prior chat-mic state.
- Call teardown stops Deepgram, meter, peer connection and local tracks; clears signaling collections and timers; unmounts call media; and starts PB write-back at call end.
- Spoken call content creates its durable transcript row before translation, then patches that row when translation arrives. A translation failure therefore cannot erase the spoken line.
- Remote subtitle handlers reject a room whose ID is not currently active, and history/chat receive paths dedupe by stable message ID.

These are retained strengths, not proof that the entire lifecycle is safe.

### 18.3 Static gaps and unproven races in turn09 ship

**A. No application-wide generation token.** Turn09 has good identity checks for the foreground relay and primary Deepgram socket, but no session epoch covering every asynchronous operation. Safety is therefore resource-specific and incomplete.

**B. Pending media acquisition.** Call and chat-mic `getUserMedia()` requests do not capture a room/generation token. If a request resolves after exit or room switch, its returned tracks must be stopped and must never become the new room's stream.

**C. Secondary Deepgram socket.** The secondary-language socket does not mirror the primary socket's complete identity guard. Its message/error/close callbacks can observe or mutate shared state after replacement. The audio pump also reads the global secondary socket rather than the secondary socket paired with the captured primary session.

**D. AudioWorklet fallback.** The asynchronous worklet installation checks the primary socket before success, but its failure fallback can call the script-processor setup after ownership has changed. Both success and failure paths must verify the same captured session and captured audio context.

**E. Translation completion.** Typed, clarification, phrase-card, and speech translations are asynchronous. Call speech captures a room object but later patches the global active transcript and sends through the current foreground relay. Every completion must be tied to the originating room/message; leaving A for B while A translates must not patch or relay into B.

**F. PB pull and write completion.** `enterRoom()` starts a dirty flush followed by a pull, while room exit can clear or replace `PB.pk`. Responses must be committed only to the pair that initiated them. Dirty state must be pair-scoped; a late success for pair A must not clear pair B, and a late pull for A must not replace B.

**G. Exit does not await PB write-back.** Starting write-back and immediately clearing room identity is safe only if the operation captured an immutable pair, cards, version and remote identity before exit. This is not yet established as a contract.

**H. FileReader and attachments.** A file read may finish after room switch. Its completion must retain the originating room/message destination or be discarded, never append to whichever transcript is active later.

**I. Call signaling generation.** Delayed TURN credential fetches, offers, answers, ICE candidates, accept retries, recovery timers, ring timers and peer-connection callbacks need one call-generation guard. `CALL.active` alone cannot distinguish an old call from a newer active call.

**J. Timed Deepgram restart.** Watchdog and close-handler restart timers test whether some mic/call is active, but must also prove it is the same captured transcription session. An old timer must not start an extra socket for a new room or call.

**K. Background/foreground handoff.** Entering a room must close its background LISTEN socket before the foreground socket becomes authoritative, and leaving must create exactly one background listener. No interval or delayed reconnect may create duplicates.

**L. Read receipts on in-app entry.** Returning through in-app navigation does not generate `visibilitychange`. Room entry itself must send read receipts and reconcile unread state; foreground handling is a recovery path, not the sole trigger.

**M. History merge ownership.** History chunks must name the room, dedupe by stable ID, flip sender perspective exactly once, ignore local-only system context where appropriate, sort deterministically, and never merge into the currently visible room merely because it is current when a chunk arrives.

**N. Teardown is distributed.** Turn09 cleanup is split across room, call, chat-mic, relay, Deepgram, meter, LISTEN, and PB functions. Every exit path must call one idempotent lifecycle boundary or prove an equivalent complete sequence. Repeated teardown must be harmless.

**O. Page lifecycle.** `beforeunload` cannot guarantee completion of an asynchronous GitHub write. Durable local dirty state must be recorded synchronously first and retried on the next start/online event.

### 18.4 Required lifecycle invariants for the build plan

1. At most one foreground relay, one call generation, one owned mic stream, and one primary/secondary Deepgram pair may own the active room.
2. Every resource has an explicit owner `{roomId, sessionGeneration, callGeneration}` and checks it in every asynchronous callback.
3. Changing rooms invalidates old ownership before loading the new transcript or acquiring new media.
4. No callback originating in room A may mutate room B's DOM, transcript, receipts, PB, media, or relay.
5. Teardown is idempotent and leaves no live track, audio context, processor, WebSocket, peer connection, heartbeat, watchdog, retry, ring, duration, presence, or recovery timer owned by the departed foreground session.
6. Chat mic → call → chat mic restores the exact prior state. Room exit always releases capture regardless of icon state.
7. One spoken utterance creates one durable row before translation; later translation patches that same row in its originating room.
8. Re-entry loads complete local history first, merges remote missing history without loss or duplication, reconnects once, sends pending receipts, and never bumps or dirties the PB.
9. PB operations capture immutable pair identity. One fixed filename represents that direction; JSON version and remote SHA govern staleness/conflicts.
10. Local persistence failure is visible and leaves recoverable dirty state. Network failure never discards local transcript or PB changes.

### 18.5 Readiness and output artifact

This document is a coherent requirements and recovery baseline, not yet an executable build plan. The lifecycle audit already supplies an architecture contract—single ownership, captured generations, stale-result rejection, idempotent teardown, and durable room/pair-scoped retry state—so “races were found but there is no architecture” is inaccurate. What remains missing is the implementation architecture: the final module/owner mapping and sequenced build plan. Before implementation, that plan must assign every resource and store to one runtime owner, map every audit finding to an invariant and acceptance gate, and sequence foundation work before unfinished UI.

The final output HTML artifact filename has not been selected in the recorded product decisions. This is a real open build-plan decision, not an internal requirements contradiction. `bridge-turn09-ship.html` is a protected behavioral reference and must not be overwritten; a builder must not invent the output filename or infer it from a new turn number.

## T14. Lifecycle and re-entry gates

| ID | PASS IF |
|---|---|
| T14-1 | Start media in room A, immediately switch to B before permission resolves → A's late tracks stop and B receives no A callback |
| T14-2 | Rapid A → B → A switching → exactly one foreground relay and one background listener per other room |
| T14-3 | Close an old primary or secondary Deepgram socket after its replacement opens → replacement continues transcribing |
| T14-4 | Old watchdog/retry timer fires during a new session → it performs no action |
| T14-5 | Speak in A, switch to B before translation finishes → A's row updates in A only; nothing appears or relays in B |
| T14-6 | Begin attachment read in A, switch to B → result stays with A or is explicitly canceled |
| T14-7 | Dirty pair A, switch to pair B while A writes → A completion cannot clear or replace B state |
| T14-8 | Enter the same room repeatedly → no duplicate transcript rows, handlers, sockets, history chunks, or PB download |
| T14-9 | Chat mic on → call → hang up restores chat mic on; starting off restores off |
| T14-10 | Leave a room with chat mic/call active → OS microphone becomes available to another app |
| T14-11 | Enter through in-app navigation without a visibility event → pending read receipts send immediately |
| T14-12 | Kill network, change rooms, restore network → only current owners reconnect; undelivered messages remain in their originating rooms |
| T14-13 | Local PB cache write fails → explicit storage error and retryable state; next entry is not misreported as a remote-staleness change |
| T14-14 | Run teardown twice from competing exit paths → no exception, duplicate marker, duplicate write, or resurrected resource |
