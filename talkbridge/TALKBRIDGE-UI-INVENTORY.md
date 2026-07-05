<!-- v1.0.0 -->
# TALKBRIDGE UI ELEMENT INVENTORY
**Version 1.0.0 | 2026-07-05 | Extracted verbatim from source. Drives mockups, catalog, and build. An element not here = reject. An element here missing from a build = reject.**
Sources: test.html (shell), bridge-turn07-post-ship.html (bridge), 2vid.html (call reference).
Owner rulings applied: bridge look wins · one light theme · one transcript · no room-name field · keys behind gear · panel top row = gear only · receipts shown in final bubble · bubble appearance user-configurable · call seamlessly integrated, no floating window · incoming-call surface UNDEFINED (blocked).

---

## S1 START SCREEN (shell)
1.1 Ribbon: hamburger (opens panel) · spacer · speaker toggle (auto-read, red slash when off)
1.2 Names bar: self name (tap to edit, Enter commits) · ↔ · partner name (hidden until known)
1.3 Welcome empty state: flag-motif background · "Welcome" · "Please select a conversation on the left or tap the + icon to start a new chat"
Rule: app always boots here, panel closed. Never auto-opens a room.

## S2 LEFT PANEL (shell)
2.1 Top row: gear only (settings drawer below; keys inside → S11)
2.2 Settings drawer sections: Appearance (preset Light/Medium/Dark · per-side tone · per-side bubble color · per-side font color · per-side size 12–20 · per-side width 50–95% · Reset appearance) · API keys entry (→ S11)
2.3 Session list, one card per room:
  a title (inline-editable) · b subtitle (pair + last activity) · c unread count badge (teal)
  d Share icon · e Diagnostics/transcript icon · f Delete icon (red on hover; soft-delete → recoverable)
2.4 Floating + (teal FAB, bottom-right of panel) → S3
2.5 Close: tap scrim right of panel (no close button — as built)

## S3 CREATE ROOM (shell modal, flag-motif title band)
3.1 Title "Start new chat" on flag motif
3.2 Your language ▾ (flag + name) · 3.3 Partner language ▾ (flag + name)
3.4 Auto-read toggle (default on) · 3.5 Cancel · 3.6 OK → room created, enter it
No name field (name captured at first run S0). No room-name field (ruling).

## S0 FIRST RUN (shell modal, flag-motif title band)
0.1 "Hi, let's get ready to chat! What's your name?" · 0.2 name input (40 max) · 0.3 Continue · 0.4 inline error line

## S4 ROOM SURFACE — ONE TRANSCRIPT (bridge canonical)
4.1 Header: hamburger · self ✎ ↔ partner · presence (online/waiting) · video-call icon · audio-call icon (both dimmed until partner has joined)
4.2 Invite card (until partner joins): "Invite {name}" · QR · link (tap copies) · Copy · Share (system share)
4.3 Bubble (side-by-side, bridge canonical):
  a container: mine right / theirs left, corner-tucked, appearance user-configurable (colors, font, size, width per side)
  b body grid: my-language column | 1px divider | partner-language column — BOTH always shown, my language always left for each viewer
  c meta line (bottom right, one rule): origin mark (mic = spoken, none = typed) · time · receipts on own messages only (✓ sent · ✓✓ delivered · teal ✓✓ read; tap opens status detail)
  d tap a language column → hear it (TTS)
  e long-press bubble → actions: Save to phrasebook · Delete (confirm) · Clarify
  f attachment inside bubble: clip icon + filename (tap opens S12 viewer) · image preview inline · remove (own only)
  g failed translation badge "⚠ not translated"
4.4 System markers, centered pill: "call ended · duration" · missed call · date separators
4.5 More-below indicator ↓ when scrolled up
4.6 Compose strip: attach clip · textarea "Message or / to search phrases" (auto-grow, clear-× in search mode) · Go button (teal, always visible; disabled-dim when empty; sends chat or executes search; "/"-prefix guard on both Enter and Go)

## S5 PB SEARCH DRAWER (bridge)
5.1 Open: "/" or ".." typed in compose (search supports -term exclusion). Live filter as you type.
5.2 Sheet over transcript: drag handle · result count · phrasebook icon (opens S7) · results = S6 cards, newest first, cap 40 · empty state "No matching phrases."
5.3 Close: × in compose, Esc, or send

## S6 PB CARD (bridge canonical)
6.1 Header strip: attribution · timestamp (· usage count)
6.2 Body grid: source column | divider | target column — viewer's language left; both text fields tap-to-edit (Enter commits)
6.3 Per column: Use (loads that language into compose, counts a use) · TTS
6.4 Footer 3-icon grid: # tags · clarify · trash (soft-delete, strikethrough state, restorable)
6.5 Panels: tags (pills with ×, add input with suggestions, Enter adds and refocuses) · clarify (note input, Enter commits and refocuses) · back-translate (always visible: result text · Sounds Good / Flag verdict; verdict resets only when source changes)
6.6 Long-press card → quick-ring
6.7 Duplicate save anywhere → toast "Already saved", no navigation

## S7 PB OVERLAY (manager)
7.1 Header: pair label (flags + name) · + new card (opens S8; must not stack empty cards — open defect) · save-now · sync dot (grey/green/amber) · ×
7.2 Search input "-word to exclude" + clear ×
7.3 Category chips row (name + count)
7.4 Trash section (deleted cards, restorable) · 7.5 card list (S6) · 7.6 footer status (count · last sync)
7.7 Write-back: on call end, on dirty close, on save-now; failed upload retries on reconnect

## S8 NEW CARD SHEET
8.1 Header: pair label · "From…" attribution input · timestamp · ×
8.2 Source editable (Enter → translate + back-translate fill inline, keyboard stays) · TTS
8.3 Target editable · TTS
8.4 Footer: save · # · clarify
8.5 Panels: tags (chips + suggest) · clarify note · back-translate result + ✓ Good / ⚑ Flag

## S9 CALL — SAME SURFACE (bridge engine, integrated)
9.1 Video band mounts at top of S4; transcript and compose unchanged beneath
9.2 Band: remote video (placeholder 👤 when no video) · local PiP thumbnail · partner name + duration · connection dot
9.3 Controls on band: mic toggle · camera toggle (red slash off; off = voice call, default) · red end
9.4 Partner states: "Camera off" · "Partner has disconnected / waiting to reconnect" · solo "Waiting for partner to join…" · speaking indicator
9.5 Speech → live translated lines in the SAME transcript, mic origin mark; permanent after hang-up
9.6 Hang up: band unmounts · "call ended" marker · dirty PB write-back fires
9.7 Auto-recovery on drop (banked engine) · entry-heal for tab-closure ends (Ship scope)
UNDEFINED (blocked): incoming-call ring surface. UNDEFINED: PiP mini-window retention — decide at build.

## S10 JOINER
10.1 Landing (flag-motif ask): language pill · room name · pair flags · Join · "Tap to allow camera & microphone access"
10.2 Joiner lands in that one room only: no hamburger/panel/list, no create path — enforced at data/routing layer
10.3 Same S4 room surface otherwise

## S11 KEYS (behind gear)
11.1 Deepgram key + status line · 11.2 TURN token ID · 11.3 TURN API token + status · 11.4 GitHub PAT (optional). Password fields, stored locally, one-time.

## S12 MINOR SURFACES
12.1 Attachment viewer: name · download · × · body
12.2 Clarify-reply modal: original→translated quote · editable input with live back-translate · send (lands as chat)
12.3 Import phrases modal: select/deselect all · list · Cancel/Import · progress bar
12.4 Diagnostics/log overlay: Copy · Clear · Close · body
12.5 Toasts: "Already saved" · "Copied" · errors
12.6 Status detail popup (from receipt tap)

## RETIRED BY RULING
Bridge lobby + waiting screens · thank-you page · shell stacked bubble (Use buttons, footer bar, status-dot variant) · 2vid floating call window + separate CC transcript · shell legacy phrasebook/catalog screen · panel phrasebook + globe buttons · room-name field · chat-only vs chat+call room types (all rooms can call).
