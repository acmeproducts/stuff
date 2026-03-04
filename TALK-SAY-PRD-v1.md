# Talk + Say — Product Requirements Document
**Version:** 1.0 — Definitive Specification  
**Status:** Awaiting Approval  
**Revision format:** Reference section by outline number (e.g., "amend 2.3.1.4")

---

## 0. PRODUCT OVERVIEW & DESIGN PHILOSOPHY

### 0.1 The Suite
Two companion apps sharing a single codebase, a unified data store, and a common design language:

| App | Purpose |
|-----|---------|
| **Talk** | Real-time bilingual conversation between two people speaking different languages |
| **Say** | Phrasebook and catalog management — building, curating, and using a personal vocabulary |

### 0.2 Design Language
- **Font stack:** Lora (serif, headings/names) + DM Sans (sans, body/UI) + Noto Sans Thai (CJK/Thai script)
- **Color system:** Cream `#FAF8F4`, Paper `#F2EDE4`, Ink `#1A1714`, Teal `#1D6B66`, Amber `#C4600A`, Red `#C0392B`, Green `#27AE60`
- **Mobile-first:** Single-column, max-width 480px, full `100dvh`, safe-area-inset aware
- **Interaction:** Touch-primary; all tap targets ≥ 44px; active states scale to 0.97
- **Motion:** Subtle — `fadeUp` 0.2s on new content, `slideUp` 0.25s on sheets, shimmer on pending states
- **Tone:** Calm, high-trust, editorial (not gamified, not loud)

### 0.3 Design Decision: Single-File PWA
**Decision:** Both apps are delivered as a single `.html` file. No build pipeline, no framework. Vanilla JS, inline CSS, localStorage persistence. Installable as a PWA.  
**Rationale:** Zero-friction deployment, works offline, no server dependency for core features.

### 0.4 Navigation Model
- Bottom tab bar (Talk | Say) is always visible after onboarding is complete
- Within each app, a stack of screens is managed with `showScreen()` — no browser history manipulation
- Overlays and bottom sheets stack above screens for contextual actions
- The back button (←) in screen headers returns to the logical parent screen

### 0.5 Translation Engine Strategy
**Decision:** Use Chrome Built-in AI (Translation API) when available (Chrome 138+ desktop/Android); fall back to Google Cloud Translation API for all other environments.  
- Engine status is displayed in a persistent micro-badge below the chat header during a session
- On-device = green badge; Cloud = neutral badge  
- Settings screen shows full engine explanation and current status

---

## 1. SHARED INFRASTRUCTURE

### 1.1 Data Model

#### 1.1.1 Session Record
```
sessionId        string    unique ID (genId)
sessionCode      string    6-char human code (e.g. "A3K9M2")
myName           string    user's display name for this session
myLang           string    BCP-47 language code (e.g. "en")
partnerName      string    partner's display name
partnerLang      string    BCP-47 language code
isInitiator      boolean   true = host; false = joiner
createdAt        number    unix ms
lastActivity     number    unix ms
```

#### 1.1.2 Message Record
```
id               string    unique ID
from             string    "me" | "them"
text             string    original text as typed/spoken
lang             string    language code of original
translated       string    translated text (may be null while pending)
status           string    "sending" | "sent" | "failed"
timestamp        number    unix ms
isEdited         boolean
editedAt         number    unix ms | null
clarify          object    { status: "none"|"requested"|"answered", text: string }
backApproved     boolean   user confirmed back-translation accuracy
sourceLang       string    (same as lang, denormalized for clarity)
targetLang       string
```

#### 1.1.3 Catalog Record (Say)
```
id               string    unique ID
name             string    catalog display name
note             string    optional description
emoji            string    optional single emoji identifier
color            string    optional accent color hex
createdAt        number
isPinned         boolean
isDefault        boolean   one catalog can be the default save target
```

#### 1.1.4 Card Record (Say)
```
id               string    unique ID
catalogIds       string[]  array — a card can belong to multiple catalogs
name             string    optional short label / nickname
source           string    phrase in source language
target           string    phrase in target language
backTranslation  string    back-translated text for verification
notes            string    markdown-enabled notes field
usage            number    count of times "Use" was tapped
favorite         boolean
priority         string    "Essential" | "Standard" | "Archive"
createdAt        number
updatedAt        number
lastUsedAt       number | null
backApproved     boolean   user confirmed back-translation is acceptable
sourceLang       string
targetLang       string
sourceSessionId  string | null   ID of the Talk session that generated this card
sourcePartnerName string | null  partner's name from originating session
ttsAudioCache    object    { [langCode]: base64 string } — cached TTS audio
```

### 1.2 Storage Keys
```
talk_sessions        JSON array of Session Records
talk_active_id       string — currently active session ID
talk_msg_{sessionId} JSON array of Message Records (capped at 300)
say_catalogs         JSON array of Catalog Records
say_cards            JSON array of Card Records
say_settings         JSON object — app preferences
```

### 1.3 Shared Utilities
- `genId()` — timestamp+random, collision-safe
- `genCode()` — 6-char alphanumeric, excludes ambiguous chars (0, O, 1, I)
- `toast(message, duration?)` — non-blocking notification, bottom of screen, auto-dismiss 2.2s
- `renderMd(string)` — renders `**bold**`, `*italic*`, `[text](url)`, `~~strike~~` — no block-level markdown (no headers, no lists) to keep annotations compact
- `escHtml(string)` — XSS-safe DOM insertion
- `timeAgo(timestamp)` — "now", "5m", "2h", "3d"
- `fmtTime(timestamp)` — locale-aware HH:MM

### 1.4 P2P Connection (Talk)
- Library: PeerJS 1.5.4
- Peer ID format: `talkapp_{sessionCode}_{role}` where role = "host" | "join"
- Connection events handled: `open`, `data`, `close`, `error`
- Message types over the wire: `msg`, `edit`, `clarify`, `clarify-answer`, `typing`, `read`
- Reconnection: automatic on page load if `talk_active_id` is set

---

## 2. FLOW 1 — LIVE BILINGUAL CONVERSATION (TALK)

> Flow 1 is the core loop: two people open the app, establish a P2P connection, and converse in real time with automatic translation in both directions.

---

### 2.1 Screen: Home

#### 2.1.1 Layout (top to bottom)
1. **Hero header** — gradient from teal-light to cream, contains:
   - App logo: "Talk" in Lora 36px, teal
   - Subtitle: "Live bilingual conversation" in DM Sans 14px, ink-dim
2. **Action buttons** (full-width, stacked):
   - [Start a chat] — teal primary button; subtitle: "You pick the code"
   - [Join a session] — paper secondary button; subtitle: "Enter a partner's code"
   - [Open Say →] — paper secondary button; subtitle: "Phrasebook & catalogs"
3. **Recent sessions** list (see 2.1.2)
4. **Settings gear FAB** — fixed bottom-right, 52px circle, white with border

#### 2.1.2 Session List Item
Each saved session displays as a card:
- **Left:** Avatar circle (40px) showing first letter of partner's name, teal background
- **Center:** Partner name (14px semibold), language pair + time-ago (12px, ink-dim)
- **Right:** Message count badge (paper background, rounded pill)
- **Tap action:** Resumes session — loads messages, attempts reconnection, navigates to Chat screen

#### 2.1.3 Empty State
When no sessions exist: centered text "No saved sessions yet." with a suggestion to start a chat.

#### 2.1.4 Settings FAB
Gear icon (⚙). Navigates to Settings screen. Always visible on Home.

---

### 2.2 Screen: Start a Chat (Setup — Host)

#### 2.2.1 Fields
1. **Your name** — text input, maxlength 30, autocomplete off, autofocused
2. **I speak** — language select (see 2.2.3 for language list)
3. **My partner speaks** — language select, defaults to Thai

#### 2.2.2 Action
- [Create session] button — creates Session Record, generates code, navigates to Code Share step

#### 2.2.3 Supported Languages (initial set)
English, Thai, Spanish, French, German, Italian, Japanese, Korean, Chinese, Vietnamese, Portuguese, Russian, Arabic, Hindi, Indonesian, Malay, Filipino, Dutch, Swedish, Polish, Turkish.  
**Decision:** This list is static in v1. Dynamic language support (based on browser capabilities) is a v2 feature.

---

### 2.3 Screen: Share Code (Setup — Host, Step 2)

#### 2.3.1 Layout
1. **Instructions:** "Share this code with your partner."
2. **Code display box:** Large monospace code (e.g. `A3K9M2`), 32px, teal, letter-spacing 6px — inside a dashed-border paper box
3. **[Copy]** button inside the box — copies code to clipboard, shows "Code copied" toast
4. **[Share code]** full-width button — triggers native Web Share API; falls back to clipboard
5. **Status text:** "Waiting for partner…" → changes to "Partner connected ✓" (green) when P2P opens
6. **[Start chatting]** button — enabled immediately (partner may join from Chat screen)

#### 2.3.2 Behavior
- PeerJS peer is initialized as host immediately on screen load
- Partner connection event changes status text and enables the button visually (button is always tappable)

---

### 2.4 Screen: Join a Session (Setup — Joiner)

#### 2.4.1 Fields
1. **Your name** — text input
2. **I speak** — language select
3. **Session code** — monospace input, auto-uppercase, strips non-alphanumeric, maxlength 6; supports datalist of previous codes
4. **Previous codes** — chips rendered below the input from saved sessions; tap to populate the code field

#### 2.4.2 Action
- [Join session] button — validates 6-char code, initializes PeerJS as joiner, shows inline status ("Connecting…", "Connected!", error states)
- On successful connection → navigates to Chat screen

---

### 2.5 Screen: Chat

> The Chat screen is the heart of the product. Every detail below is mandatory.

#### 2.5.1 Header Bar (fixed, top)
- **[←] back button** — prompts "End session?" before navigating away if connected
- **Partner name** — Lora 16px semibold
- **Language chip** — "EN ↔ TH" in teal-light pill, teal text, 11px
- **Connection dot** — 7px circle: grey = disconnected, green = connected
- **Connection label** — "Connected" / "Reconnecting…" / "Not connected" in 12px ink-dim
- **[⋮] menu button** — opens Session Menu sheet

#### 2.5.2 Engine Badge (below header, fixed)
- One line of text, 10px
- Green text + "🟢 On-device translation" or neutral "☁ Cloud translation"
- Tappable → shows Settings engine explanation in a toast or mini sheet

#### 2.5.3 Message List (scrollable, flex-column)
- Padding: 12px sides, 8px bottom
- Gap between message rows: 6px
- New messages animate in with fadeUp
- Auto-scrolls to bottom on new message
- **Day separator labels:** "Today", "Yesterday", "Mon Jan 6" — centered, 12px ink-dim
- **System messages:** Italic, centered, ink-dim (e.g. "Reconnecting…", "Partner disconnected")

#### 2.5.4 Message Card — Mine (right-aligned)
A message I sent appears as a **right-aligned card**, max-width 82% of screen:

```
┌─────────────────────────────────────────┐  ← teal background, rounded 18px,
│  [translated text — what partner sees]  │    bottom-right corner 6px
│                                         │
│  [original text — what I typed]         │  ← 12px, 55% opacity, italic
│   ↑ tap to expand if truncated          │    truncated to 2 lines, tap expands
└─────────────────────────────────────────┘
  [?]  ·  edited  ·  10:42  ·  ✓✓        ← footer, 10px, 60% opacity
   ↑           ↑        ↑       ↑
 clarify    edit badge  time  status
```

**Footer elements (left to right):**
- **[?] Clarify button** — see 2.6
- **"edited" badge** — appears if `isEdited = true`
- **Time** — HH:MM
- **Status indicator:** clock = sending, single ✓ = sent, double ✓ = received, red ✗ = failed (tappable to retry)

**Tap behavior on bubble:** Opens Check Panel (see 2.7)

**Long-press behavior on bubble:** Shows contextual action sheet with:
- Copy original
- Copy translation
- Save to Phrasebook
- Edit (if within edit window)
- [Cancel]

#### 2.5.5 Message Card — Theirs (left-aligned)
A message from my partner appears as a **left-aligned card**, max-width 82%:

```
┌─────────────────────────────────────────┐  ← paper background, border, rounded 18px
│  [translated text — what I read]        │    bottom-left corner 6px
│                                         │
│  [original text — what they typed]      │  ← 12px, 55% opacity
└─────────────────────────────────────────┘
  [?]  ·  10:42                           ← footer
```

- No status indicator (that's theirs to see)
- Clarify button present (see 2.6)
- Tap on bubble: shows Copy / Save to Phrasebook options
- Long-press: same action sheet as mine, minus Edit

#### 2.5.6 Approximate Translation Badge
When back-translation confidence is low (detected heuristically by the translation engine), an `~` badge appears in the footer.  
- Tapping `~` opens the Check Panel automatically
- Color: amber, opacity 0.7

#### 2.5.7 Clarification Annotation
When a clarification has been answered (`clarify.status === "answered"`):
- A styled annotation block appears below the message bubble (not inside it)
- Mine: semi-transparent white on teal, rounded 10px
- Theirs: paper background, border
- Content renders with `renderMd()` — bold, italic, links supported
- Tapping the annotation collapses/expands it

#### 2.5.8 Typing Indicator Bar
- One line, 12px, ink-dim, positioned between message list and composer
- Text: "[Name] is typing…"
- Auto-clears after 3 seconds of no typing events

#### 2.5.9 Composer Bar (fixed, bottom)

```
┌──────────────────────────────────────────────┐
│ [🎤] [ text input area, auto-resize ] [Send↑] │
└──────────────────────────────────────────────┘
```

**Elements:**
1. **Voice button [🎤]** — left of input; see 2.5.10
2. **Text input** — rounded pill, 22px border-radius; auto-resizes up to 120px; `Enter` sends, `Shift+Enter` newlines; disabled with reduced opacity when not connected
3. **Send button [↑]** — 42px teal circle; disabled when input empty or disconnected; active when either typing or in edit mode

**Edit mode:** When editing a previous message, the input border turns amber, a subtle "Editing — press Send to update" toast appears, and the send button label changes to a pencil icon.

#### 2.5.10 Voice Input (Speech-to-Text)

**Decision:** Use Web Speech API (`SpeechRecognition`) for voice input. This is natively available in Chrome and Safari. No third-party dependency.

**Behavior:**
- Tapping [🎤] starts recognition in the user's language (`myLang`)
- Button pulses with a red ring animation while listening
- Interim results populate the text input in real time (grayed out)
- Final result replaces the input with confirmed text
- User can edit before sending
- Tapping [🎤] again stops listening
- If recognition is not supported, the button is hidden

**Permission:** Browser microphone permission is requested on first tap. If denied, show toast: "Microphone access denied. Check browser settings."

---

### 2.6 Subsystem: Clarification Request & Response

> This is a bilateral subsystem. Either party can ask for clarification on any message. The other party responds inline with markdown-capable text.

#### 2.6.1 Trigger
Every message card has a **[?] button** in the footer row:
- **State: none** — faint circle, low opacity. Tapping → sends a clarification request to the message author
- **State: requested** — solid circle, full opacity with exclamation emphasis. Visible to both parties: requester sees "waiting", author sees "you've been asked"
- **State: answered** — filled circle (teal for mine, ink for theirs). Annotation block becomes visible below the bubble

#### 2.6.2 Requesting Clarification (as the reader of a message)
1. Tap [?] on a partner's message bubble
2. A bottom sheet slides up: **"Ask for clarification"**
   - Shows the original message text in a quoted block
   - Optional text field: "What specifically are you asking about? (optional)"
   - [Ask] and [Cancel] buttons
3. On [Ask]: sends a `clarify` P2P event; the button state on that message changes to `requested` for both parties

#### 2.6.3 Receiving a Clarification Request (as the author)
1. The [?] button on your own sent message changes to `requested` state and pulses once
2. A non-blocking notification banner slides in at top of chat: "[Partner name] asked about a message" with [Respond] action
3. Tapping [Respond] or tapping the [?] button on that message opens the **Clarification Input Sheet**

#### 2.6.4 Clarification Input Sheet
```
┌─────────────────────────────┐
│ ▬▬▬ (drag handle)           │
│ Add clarification           │  ← Lora 20px
│                             │
│ Your partner asked about:   │  ← 13px ink-dim
│ ┌─────────────────────────┐ │
│ │ [quoted original message]│ │  ← paper background, border-left teal 3px
│ └─────────────────────────┘ │
│                             │
│ [multiline textarea]        │  ← min 3 lines, auto-resize, no max
│                             │
│ Supports **bold**, *italic* │  ← 11px hint, ink-dim
│ and [links](url)            │
│                             │
│  [Cancel]    [Send]         │
└─────────────────────────────┘
```

**Markdown capability:** The textarea accepts and sends raw markdown. It renders on the receiving end via `renderMd()`. The hint line shows the supported syntax.

#### 2.6.5 Sending the Clarification
1. Tap [Send]: sends `clarify-answer` P2P event with `{ id: messageId, text: markdownText }`
2. Sheet closes
3. The annotation block appears below the original message bubble on both sides
4. The [?] button changes to `answered` state on both sides

#### 2.6.6 Editing a Clarification
- The annotation block has a small [Edit] link (ink-dim, 11px) at the bottom right
- Tapping [Edit] re-opens the Clarification Input Sheet pre-populated with the existing text
- Sending again overwrites the clarification on both sides

---

### 2.7 Subsystem: Check Panel (Back-Translation Verification)

> Allows the sender to verify that their message translated correctly by seeing the back-translation (translated → back to their own language).

#### 2.7.1 Trigger
Tapping a **mine** message bubble opens the Check Panel.

#### 2.7.2 Layout (Bottom Sheet)
```
┌──────────────────────────────────┐
│ ▬▬▬                              │
│ ┌──────────────────────────────┐ │
│ │ You wrote                    │ │  ← label, 11px uppercase, ink-dim
│ │ [original text]              │ │  ← 15px, ink
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ They see                     │ │
│ │ [translated text]            │ │
│ └──────────────────────────────┘ │
│ ┌──────────────────────────────┐ │
│ │ Back into your language      │ │
│ │ [back-translation result]    │ │  ← italic if pending ("Tap Check to verify")
│ └──────────────────────────────┘ │
│                                  │
│ [edit-window-status]             │  ← "Edit window: 4m 32s remaining" or "Expired"
│                                  │
│  [Close]   [Edit]   [Check ↺]    │  ← three action buttons
└──────────────────────────────────┘
```

#### 2.7.3 [Check ↺] Button
- Triggers back-translation: takes the translated text, translates it back to `myLang`
- Shows shimmer animation while processing
- Result populates the "Back into your language" row
- Button becomes disabled after first use (result is already shown)

#### 2.7.4 [Edit] Button
- Enabled only within the edit window (default: 5 minutes from send)
- Disabled state shows "Edit window expired (5 min)" in 11px ink-dim
- When enabled: closes the sheet, populates the composer with the original text in edit mode

#### 2.7.5 Edit Mode in Composer
- Input pre-filled with original message text
- Input border: amber (`#C4600A`)
- Toast appears: "Editing — press Send to update"
- Send replaces the message in the message list and sends an `edit` P2P event
- Partner receives the edit and sees "[edited]" badge appear on the updated bubble
- If the message had a `clarify` answer, editing resets `clarify` to `none` (the answer may no longer apply)

---

### 2.8 Screen: Session Menu Sheet

Opened via the [⋮] button in the Chat header.

#### 2.8.1 Info Rows
```
You          →  [myName]
Languages    →  English ↔ Thai
Code         →  A3K9M2
Connection   →  Connected / Disconnected
Translation  →  On-device / Cloud
```

#### 2.8.2 Action Buttons
- **[Phrasebook]** — navigates to Phrasebook/Say within Talk, with "back to chat" return path
- **[Export session]** — downloads `talk-{code}.json` containing session metadata and all messages
- **[End session]** — opens End Session sheet (2.9)
- **[Close]** — dismisses the sheet

---

### 2.9 Sheet: End Session

#### 2.9.1 Flow
1. Header: "Save phrases before ending?"
2. Sub: "Select messages to add to your Phrasebook."
3. Checklist of recent messages (last 10 with both original + translation populated):
   - Each row: checkbox + source phrase + target phrase (small, ink-dim)
4. **[Save selected & end]** — saves checked items as Say cards, ends session
5. **[End without saving]** — ends session immediately

#### 2.9.2 Ending a Session
- Closes P2P connection
- Clears `talk_active_id`
- Navigates to Home screen
- Sessions remain in the history list (viewable but read-only)

---

### 2.10 Text-to-Speech (TTS) Playback

**Decision:** Use Web Speech API (`SpeechSynthesis`) for TTS. Available natively in all target browsers. No dependency or API key required.

#### 2.10.1 TTS Button on Message Cards
- Each message card footer includes a **[🔊] play button** (16px, ink-dim)
- **Mine:** plays the **translated text** (what the partner hears/reads) in `partnerLang`
- **Theirs:** plays the **original text** in `partnerLang` (i.e., the language it was written in)
- While playing: button shows a pulsing stop icon [⏹]; tapping again stops playback
- Only one message plays at a time; starting a new one stops the current

#### 2.10.2 TTS in Say (Phrasebook)
- Every Card Detail view has [🔊 Source] and [🔊 Target] buttons
- Plays the corresponding field in the appropriate language
- Say Settings allows selecting preferred TTS voice per language (populated from `speechSynthesis.getVoices()`)

#### 2.10.3 Behavior When TTS Unavailable
- Buttons are hidden if `typeof speechSynthesis === 'undefined'`
- No errors shown to user

---

### 2.11 Save-to-Phrasebook from Chat

#### 2.11.1 Quick Save (Single Message)
- [Save phrase] text button below each message bubble (small, teal, 50% opacity, full opacity on hover)
- Tapping: creates a Say card in the `catalog-from-talk` catalog (auto-created if not present)
- Card fields populated: `source` = original text, `target` = translated text, `sourceLang`, `targetLang`, `sourceSessionId`, `sourcePartnerName`
- Toast: "Saved to Phrasebook"
- If already saved: "Already saved" toast, no duplicate

#### 2.11.2 Bulk Save (End Session)
- See 2.9 — checklist-based multi-select

---

## 3. FLOW 2 — PHRASEBOOK & CATALOG MANAGEMENT (SAY)

> Say is the personal vocabulary management system. It stores phrases, organizes them into catalogs, and enables review, editing, and use inside or outside of a Talk session.

---

### 3.1 Screen: Say Home / Catalog List

#### 3.1.1 Header
- App name: "Say" in Lora 36px, teal
- Subtitle: "Your phrasebook"
- **[+ New Catalog]** action button top-right

#### 3.1.2 Catalog Grid
Catalogs are displayed as **cards in a 2-column grid** (or single column on very small screens):

```
┌──────────────┐  ┌──────────────┐
│  🗺 Travel   │  │  🍜 Food     │
│              │  │              │
│  24 phrases  │  │  8 phrases   │
│  Updated 2d  │  │  Updated 5h  │
└──────────────┘  └──────────────┘
```

Each catalog card shows:
- **Emoji** (large, centered, 32px) — if set
- **Name** — Lora, 15px, semibold
- **Phrase count** — 12px, ink-dim
- **Last updated** — time-ago, 12px, ink-dim
- **Pinned indicator** — 📌 in top-right corner if pinned

#### 3.1.3 All Phrases View
A special top item: **"All Phrases"** with total card count. Always present. Not deletable.

#### 3.1.4 Empty State
If no catalogs: illustration area with text "No catalogs yet." and a prominent [+ Create your first catalog] button.

#### 3.1.5 Catalog Card Long-Press
Long-press (or swipe-left on mobile) reveals:
- [📌 Pin / Unpin]
- [✏️ Edit catalog]
- [🗑 Delete catalog] (with confirmation sheet)

---

### 3.2 Sheet: New / Edit Catalog

#### 3.2.1 Fields
1. **Name** — text input, required, maxlength 40
2. **Emoji** — single emoji picker (tap to open system emoji picker or a curated grid of 40 relevant emojis); optional
3. **Note** — text input, optional, maxlength 120
4. **Default save target** — toggle: "Save new cards here by default"

#### 3.2.2 Actions
- [Save catalog] — primary teal button
- [Cancel] — secondary

---

### 3.3 Screen: Catalog Detail (Card List)

#### 3.3.1 Header
- [←] back
- Catalog name (Lora)
- [+ Add] action button top-right

#### 3.3.2 Toolbar
1. **Search bar** — full-width, searches `source`, `target`, `notes`, `name` fields
2. **Filter chips** (horizontal scroll row):
   - [All] [⭐ Favorites] [Essential] [Standard] [Archive] [Unverified]
3. **Sort control** — small dropdown or segmented: "Recently added | A–Z | Most used | Recently used"

#### 3.3.3 Card Item (Collapsed State)
Each card in the list appears as a compact row:

```
┌────────────────────────────────────────┐
│ ⭐  [source phrase]              [🔊] › │
│     [target phrase — ink-dim]          │
└────────────────────────────────────────┘
```

- **⭐ Favorite button** — left; tap toggles; amber when active, border-color when inactive
- **Source text** — 14px medium; truncated to 1 line with ellipsis
- **Target text** — 13px ink-dim; truncated to 1 line
- **[🔊] TTS button** — plays target in target language
- **[›] chevron** — rotates 90° when card is expanded

#### 3.3.4 Card Item (Expanded / Detail State)

When the card row is tapped, it expands **inline** (no navigation to new screen):

```
┌────────────────────────────────────────┐
│ ⭐  [source phrase]              [🔊] ↓ │
│     [target phrase]                    │
├────────────────────────────────────────┤
│ SOURCE                   [Edit] [🔊]   │
│ [source text — editable inline]        │
│                                        │
│ TRANSLATION              [Edit] [🔊]   │
│ [target text — editable inline]        │
│                                        │
│ BACK-TRANSLATION         [Verify ↺]    │
│ [back-translation — italic if pending] │
│ [✓ Looks good] button if unverified    │
│                                        │
│ NOTES                    [Edit]        │
│ [notes — rendered markdown]            │
│                                        │
│ PRIORITY  [Essential|Standard|Archive] │  ← segmented pill control
│                                        │
│ ─────────────────────────────────────  │
│ Used 3×  ·  Added 3d ago  ·  From Talk │  ← meta line, 11px ink-dim
│                                        │
│  [🔊 Use in Talk]   [🗑 Delete]        │
└────────────────────────────────────────┘
```

#### 3.3.5 Inline Editing
**Decision:** Editing happens inline within the expanded card — no separate edit screen, no modal.

- Tapping **[Edit]** next to a field:
  - The static text is replaced by a textarea (or single-line input for source/target)
  - The [Edit] button becomes [Save] and [Cancel]
  - Input auto-resizes
  - [Save] commits the change and returns to display mode
  - [Cancel] discards and returns to display mode
- Only one field editable at a time per card
- Notes field uses the markdown hint: "Supports **bold**, *italic*, [links](url)"

#### 3.3.6 Back-Translation Verification
- [Verify ↺] button triggers translation of `target` back to `sourceLang`
- Result populates `backTranslation` field
- **[✓ Looks good]** button appears below the result — tapping sets `backApproved = true`, changes the indicator to a teal checkmark, and hides the button

#### 3.3.7 Priority Control
Three-way segmented pill:
- **Essential** — teal background when selected
- **Standard** — paper background when selected (default)
- **Archive** — ink-dim background when selected
Changes are auto-saved on tap.

#### 3.3.8 [Use in Talk] Button
- Enabled when a Talk session is active
- Tapping copies the `target` text into the Talk composer input, focuses the input, and navigates to the Chat screen
- Increments `usage` counter
- Updates `lastUsedAt`

---

### 3.4 Sheet: New Card (Manual Entry)

#### 3.4.1 Trigger
Tapping [+ Add] in the Catalog Detail header, or [+ Add] in the Say Home top bar.

#### 3.4.2 Fields
1. **Source phrase** — text input, required
2. **Source language** — language select (defaults to user's primary language from settings)
3. **Translation** — text input; OR tap [Auto-translate →] to fill automatically
4. **Target language** — language select
5. **Notes** — textarea, optional, markdown hint shown
6. **Catalog** — select (only relevant when creating from "All Phrases")
7. **Priority** — segmented pill (default: Standard)

#### 3.4.3 Auto-Translate
- [Auto-translate →] button below the Translation field
- Translates Source → Target using the configured translation engine
- Populates the Translation field
- Shows shimmer while working

#### 3.4.4 Actions
- [Save phrase] — primary; validates required fields; creates card
- [Save & add another] — saves and resets the form
- [Cancel] — dismisses

---

### 3.5 Bulk Import from Talk Session

After ending a Talk session (see 2.9), selected messages are saved as cards to `catalog-from-talk`.  
- This catalog is auto-created on first use with name "From Talk", note "Phrases saved from Talk sessions"
- It appears in the catalog list like any other catalog
- Cards from Talk have `sourceSessionId` and `sourcePartnerName` set — visible in the card meta line

---

### 3.6 Card Search (Global, across all catalogs)

- Available from Say Home via a search icon in the header
- Full-text search across `source`, `target`, `notes`, `name`
- Results show catalog name as a sub-label
- Tapping a result expands the card inline within a flat search results list

---

## 4. FLOW 3 — SETTINGS

### 4.1 Screen: Settings

#### 4.1.1 Translation Engine Section
- Info card: teal-light background explaining current engine status
- "On-device translation via Chrome Built-in AI (Chrome 138+)" or "Cloud translation (Google)"
- Toggle (if supported): force cloud / use on-device

#### 4.1.2 TTS Voice Section
- Per-language voice selector (rendered from `speechSynthesis.getVoices()`)
- Separate selectors for "My language" and "Partner language"
- [🔊 Test] button next to each selector plays a sample phrase

#### 4.1.3 Talk Sessions Section
Each saved session row shows:
- Partner name, language pair, date, message count
- Action buttons: **[Export →]** and **[🗑 Delete]**
- [Export] downloads `talk-{code}.json`
- [Delete] shows confirmation sheet

#### 4.1.4 Say Storage Section
- "Phrasebook cards: N cards"
- "Local storage used: X KB"
- [Export all Say data] — downloads `say-export.json`
- [Import Say data] — file picker for previously exported JSON

#### 4.1.5 App Preferences Section
- **Default source language** — language select
- **Default target language** — language select
- **Edit window duration** — select: 2 min / 5 min / 10 min / Off
- **Auto-scroll on new message** — toggle (default: on)
- **Show engine badge** — toggle (default: on)

#### 4.1.6 About Section
- "Talk + Say v1.0" — version string
- "Bilingual conversation and phrasebook" — tagline

---

## 5. FLOW 4 — CROSS-APP INTEGRATION

> The Talk and Say apps are deeply integrated. This section defines every integration point.

### 5.1 Talk → Say (Saving Phrases)
- Every message in Talk has a [Save phrase] button (2.11.1)
- End-of-session bulk save (2.9)
- Cards created from Talk have session provenance metadata

### 5.2 Say → Talk (Using Phrases in Conversation)
- [Use in Talk] button on expanded Say cards (3.3.8)
- Copies target text to Talk composer
- Increments usage counter
- Returns focus to Chat screen

### 5.3 Catalog Picker in Talk
- When inside Talk chat, the [Phrasebook] button in Session Menu opens the Say card list
- The list is filtered to show cards with `targetLang` matching `partnerLang`
- Tapping a card's [Use] button inserts the target text into the composer

### 5.4 Shared Navigation State
- `state.pbFrom` tracks whether the Phrasebook was opened from Home or from Chat
- [←] in Phrasebook header returns to the correct origin screen

### 5.5 Shared Language Settings
- When a user creates a Talk session, their language choices are stored in `say_settings` as preferred languages
- New Say cards default to these language values

---

## 6. FLOW 5 — ONBOARDING

> First-time users see a streamlined onboarding before reaching the Home screen.

### 6.1 Screen: Onboarding (3 swipeable cards)

**Card 1:** "Talk to anyone" — illustration of chat bubbles in two languages, brief copy about real-time translation  
**Card 2:** "Build your phrasebook" — illustration of cards, copy about saving and curating phrases  
**Card 3:** "Works offline" — illustration of phone with no-wifi indicator, copy about on-device translation

#### 6.1.1 Controls
- Dots indicator (3 dots, teal = current)
- [Next →] button on cards 1–2
- [Get started] button on card 3
- [Skip] text link on cards 1–2

#### 6.1.2 Completion
- Tapping [Get started] or [Skip] marks onboarding complete in localStorage (`talk_onboarded = true`)
- Navigates to Home screen
- Onboarding never shown again

---

## 7. INTERACTION & ACCESSIBILITY REQUIREMENTS

### 7.1 Touch Targets
- All interactive elements: minimum 44×44px tap target
- Buttons with small visual size use padding to achieve tap target size

### 7.2 Focus Management
- After navigation, relevant input is auto-focused with a 200ms delay (avoids keyboard animation conflict)
- Sheet overlays trap focus within the sheet while open

### 7.3 Keyboard Behavior
- Composer textarea: `Enter` = send, `Shift+Enter` = newline
- All inputs: `Enter` on last field triggers the primary action
- Sheet overlays close when tapping the backdrop

### 7.4 Scroll Behavior
- Chat message list: auto-scrolls to bottom on new message unless user has manually scrolled up
- Horizontal chip rows: hide scrollbar, allow finger scroll
- Overscroll: natural browser behavior

### 7.5 Disabled States
- Composer disabled (50% opacity) when not connected
- Send button disabled when input empty or disconnected
- All disabled states use `opacity: 0.4` or `0.5` — never `display: none` (preserve layout)

### 7.6 Error States
- Connection failure: system message in chat + toast
- Translation failure: amber "⚠ Translation failed — tap to retry" inline in message bubble
- Clipboard failure: toast "Copy failed"
- Network errors: toast with error summary

### 7.7 Loading / Pending States
- Translation pending: shimmer animation (linear-gradient sweep, 1.5s, infinite)
- Back-translation pending: italic "Translating…" text with shimmer
- TTS loading: button shows spinner

---

## 8. PERFORMANCE & OFFLINE REQUIREMENTS

### 8.1 Offline Capability
- App shell (HTML + CSS + JS) must be fully functional offline
- All UI renders from localStorage without network
- Translation requires network (except Chrome on-device)
- P2P connection requires network

### 8.2 PWA Manifest
- `name`: "Talk + Say"
- `short_name`: "Talk"
- `display`: "standalone"
- `theme_color`: "#1D6B66"
- `background_color`: "#FAF8F4"
- Icons: 192px and 512px teal versions of the "Talk" wordmark

### 8.3 Storage Limits
- Messages capped at 300 per session (FIFO eviction)
- Cards: no hard cap; warn at 1000+ cards in Settings
- Estimated storage per session: ~50KB; per 1000 cards: ~500KB

---

## 9. OPEN ITEMS & v2 SCOPE

> These items are explicitly out of scope for v1 but documented to avoid architecture conflicts.

| ID | Feature | Rationale for deferral |
|----|---------|----------------------|
| V2-1 | Cloud sync / account system | Requires backend; adds login friction |
| V2-2 | Multi-party chat (3+ users) | P2P mesh complexity |
| V2-3 | Dynamic language list from engine capabilities | Chrome API not stable |
| V2-4 | Spaced repetition review mode in Say | UX scope |
| V2-5 | AI-generated example sentences for cards | API cost |
| V2-6 | Card sharing / export to Anki | Format work |
| V2-7 | Conversation history search | Index complexity |
| V2-8 | Offline TTS voice download | Storage + permissions |

---

## 10. ACCEPTANCE CRITERIA SUMMARY

The following conditions must all be true for v1 to be considered complete:

1. **Flow 1 (Talk):** Two users on different devices can start/join a session, exchange messages with automatic bidirectional translation, and see each other's messages rendered correctly as message cards.
2. **Voice Input:** The [🎤] button successfully captures speech and inserts text into the composer in the user's configured language.
3. **TTS Playback:** The [🔊] button on any message card reads the appropriate text aloud in the correct language.
4. **Clarification:** Either user can request and respond to a clarification on any message; the response renders as a markdown-capable annotation below the bubble on both sides.
5. **Check Panel:** Tapping my own message opens the Check Panel; tapping [Check ↺] produces a back-translation.
6. **Inline Editing:** Within the 5-minute window, a message can be edited from the Check Panel and the update is reflected on the partner's screen.
7. **Flow 2 (Say):** Catalogs can be created, renamed, and deleted; cards can be added manually (with auto-translate), edited inline, have their back-translation verified, and be marked favorite/priority.
8. **Cross-app:** Phrases saved from Talk appear in Say; Say cards can be used in Talk via the [Use in Talk] button.
9. **TTS in Say:** Source and target TTS playback works on every expanded card.
10. **Settings:** All toggles and preferences function and persist across page reloads.
11. **Offline shell:** The app loads and displays saved sessions and cards with no network connection.
12. **No framework, no build step:** The entire app is a single `.html` file deployable by drag-and-drop to any static host.

---

*End of document. To request changes, reference the outline number (e.g., "amend 2.5.9 to add attachment support").*
