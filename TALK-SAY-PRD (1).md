# Talk + Say — Product Requirements Document
### Version 1.2 · Updated March 2026
*Source of truth for all Talk + Say development.*
*v1.1 changes marked **[v1.1]**. v1.2 changes marked **[v1.2]**.*

---

## TABLE OF CONTENTS

```
PART I    — PRODUCT OVERVIEW
PART II   — DESIGN SYSTEM
              2.1–2.8  (unchanged from v1.1)
              2.9  Tag Component Spec  [v1.2]
PART III  — FLOW 1: LIVE CONVERSATION (TALK)
              3.1  Onboarding
              3.2  Home
              3.3  Setup: Start a Chat
              3.4  Setup: Session Code
              3.5  Setup: Join a Chat
              3.6  Chat
                   3.6.5  Composer — Phrase Picker button  [v1.2]
                   3.6.7  Check Panel — Full 5-Layer View  [v1.2]
PART IV   — FLOW 2: PHRASEBOOK & CATALOG MANAGEMENT (SAY)
              4.1  Say Home (Catalog Grid)
              4.2  Catalog Screen (Card List)
              4.3  Card Detail — Full 5-Layer Anatomy  [v1.2]
              4.4  New Phrase Sheet — Bug fix + Tags  [v1.2]
              4.5  New Catalog Sheet
PART V    — FLOW 3: CATALOG BUILDER (FROM CONVERSATION)
PART VI   — FLOW 4: PRACTICE & REVIEW [V2 DEFERRED]
PART VII  — FLOW 5: SETTINGS
PART VIII — CROSS-CUTTING CONCERNS
              8.1  Translation Engine
              8.2  Text-to-Speech (TTS) — All 5 Layers  [v1.2]
              8.3  Voice Input (STT)
              8.4  P2P Networking
              8.5  Persistence & Storage
              8.6  Markdown Rendering
              8.7  Tag System  [v1.2]
PART IX   — DATA MODELS
              9.4  Card Object — tags added  [v1.2]
              9.6  Tag Registry  [v1.2]
PART X    — DECISIONS LOG
APPENDIX A — Screen Inventory
APPENDIX B — Clarification State Machine
APPENDIX C — V2 Deferred Features
```

---

# PART I — PRODUCT OVERVIEW

## 1.0 Vision

Two apps, one codebase. **Talk** is a real-time bilingual conversation tool. **Say** is a personal phrase catalog. They share a single data layer so phrases learned in conversation can be saved, refined, and reused — and catalog phrases can be inserted into any active chat, filtered instantly by tag.

## 1.1 App Suite

| App | Tab | Primary Job |
|-----|-----|-------------|
| **Talk** | 💬 Talk | Live bilingual chat with auto-translation |
| **Say** | 📚 Say | Phrase catalog: create, tag, organize, insert into Talk |

**D-1.1-A:** Both apps ship as a single `.html` file. Navigation is in-app via a persistent bottom tab bar. No page reload.

**D-1.1-B [v1.1]:** The tab bar is always visible once onboarding is complete. Tapping Say while a Talk session is active preserves the session; tapping Talk returns to the active chat (or Home if no active session).

## 1.2 Target Devices

| Device Class | Primary Context |
|---|---|
| iPhone (primary) | In-person conversation, on the go |
| Android phone | Same |
| iPad / tablet | Catalog management, longer sessions |
| Desktop browser | Secondary — catalog editing, export |

**D-1.2-A:** Mobile-first layout, max-width 480px, centered on desktop with drop shadow. All touch targets ≥ 44×44pt. Uses `100dvh` and `env(safe-area-inset-bottom)` for full-bleed mobile.

## 1.3 Language Support (Phase 1)

21 languages: English · Thai · Spanish · French · German · Italian · Japanese · Korean · Chinese · Vietnamese · Portuguese · Russian · Arabic · Hindi · Indonesian · Malay · Filipino · Dutch · Swedish · Polish · Turkish.

**D-1.3-A [v1.1]:** The app detects the user's device language on first launch via `navigator.language` and pre-sets it as their source language.

## 1.4 Translation Engine Strategy

| Priority | Engine | Condition | Cost |
|---|---|---|---|
| 1 | Chrome Built-in AI (on-device) | `window.translation` exists | Free, private, offline |
| 2 | MyMemory Public API (cloud) | Fallback always | Free, 5000 chars/day |
| 3 | User-supplied DeepL/Google key | V2 — Settings | Paid, higher limits |

---

# PART II — DESIGN SYSTEM

## 2.0 Color Tokens

| Token | Hex | Usage |
|---|---|---|
| `--cream` | `#FAF8F4` | App background |
| `--paper` | `#F2EDE4` | Card backgrounds, secondary surfaces |
| `--ink` | `#1A1714` | Primary text |
| `--ink-mid` | `#4A4540` | Secondary text, labels |
| `--ink-dim` | `#9A9390` | Placeholder, metadata, hints |
| `--teal` | `#1D6B66` | Primary action, brand accent |
| `--teal-mid` | `#2A8C85` | Hover/active teal |
| `--teal-light` | `#E8F4F3` | Teal tint backgrounds, active chips |
| `--amber` | `#C4600A` | Warnings, pending clarification states |
| `--amber-light` | `#FEF3E8` | Amber tint background |
| `--border` | `#E2DDD6` | Card outlines, dividers |
| `--red` | `#C0392B` | Destructive actions, errors |
| `--red-light` | `#FDEDEB` | Error tint background |
| `--green` | `#27AE60` | Success, connected |
| `--green-light` | `#E8F8EF` | Success tint background |
| `--tag-bg` | `#EEE9E2` | Tag pill background (neutral) |
| `--tag-text` | `#5A5450` | Tag pill text |

## 2.1 Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| App logo / Hero | Lora (serif) | 600 | 38px |
| Screen title | Lora (serif) | 600 | 18px |
| Partner name | Lora (serif) | 600 | 16px |
| Card catalog name | Lora (serif) | 600 | 15px |
| Body primary | DM Sans | 500 | 15px |
| Body secondary | DM Sans | 400 | 14px |
| Labels / metadata | DM Sans | 600 | 12px |
| Captions | DM Sans | 400 | 11px |
| Thai text | Noto Sans Thai | 300–600 | Inherits |
| Session codes | DM Sans mono | 700 | 20–34px |

## 2.2 Spacing

`4 · 8 · 10 · 12 · 14 · 16 · 20 · 24 · 32 · 40` px

## 2.3 Border Radius

`8 · 10 · 12 · 16 · 18 · 20 · 50%` (circle)

## 2.4 Elevation

- **Level 1 (card):** `0 1px 4px rgba(0,0,0,0.09)`
- **Level 2 (sheet):** `0 4px 20px rgba(0,0,0,0.13)`
- **Level 3 (FAB):** `0 4px 20px rgba(0,0,0,0.13)`

## 2.5 Animation

| Name | Duration | Easing | Usage |
|---|---|---|---|
| `scr-in` | 200ms | ease-out | Screen transitions |
| `msg-in` | 180ms | ease-out | New messages |
| `sh-up` | 240ms | ease-out | Bottom sheets |
| `shimmer` | 1500ms | infinite | Pending translations |
| `fadeUp` | 150ms | ease-out | Clarification annotations |

**D-2.5-A [v1.1]:** No pulsing/looping animations on interactive UI elements. Animation is reserved for entry transitions and loading states only.

## 2.6 Bottom Sheet Component

- Anchored to bottom, max-height 92dvh
- Drag handle: 36×4px pill, `--border` color, centered, 12px top margin
- Background scrim: `rgba(26,23,20,0.48)` — tap to dismiss
- Rounded top corners: 24px radius
- Slide-up animation: 240ms ease-out

## 2.7 Toast Notification

- Fixed position, bottom center, 16px above tab bar
- Slide up 200ms, auto-dismiss 2400ms
- DM Sans 14px, white on `rgba(26,23,20,0.88)`, 20px radius pill

## 2.8 Confirm Dialog

- Modal overlay (not sheet) with centered card
- Title (Lora 18px 600) + body text + Cancel (left) + action button (right)
- Destructive: red bg. Non-destructive confirm: teal bg.

## 2.9 Tag Component Spec [v1.2]

Tags appear throughout the app as small, tappable pills. Two visual variants:

**Neutral tag pill (default — in card detail, search results):**
```
 ┌───────────┐
 │  #formal  │   ← --tag-bg bg, --tag-text color, 10px radius
 └───────────┘
```
- DM Sans 11px 600
- Padding: 4px 8px
- `#tag-bg` (`#EEE9E2`), `--tag-text` color
- Tappable in filter contexts: tap toggles active state

**Active / selected tag pill:**
```
 ┌───────────┐
 │  #formal  │   ← --teal-light bg, --teal color, --teal border
 └───────────┘
```

**Removable tag pill (card detail edit mode):**
```
 ┌────────────┐
 │  #formal ✕│   ← adds ✕ remove button on right
 └────────────┘
```
Tap ✕ removes tag from card.

**Add tag control (card detail edit mode):**
```
 ┌──────────────┐
 │  + Add tag   │   ← dashed border, --ink-dim, tappable
 └──────────────┘
```
Tap: opens Tag Picker sheet (§8.7.2).

**Tag filter row (catalog and phrase picker):**
Horizontal scroll row, no wrapping, 6px gap. "All" chip always first. Active = teal. Inactive = neutral.

---

# PART III — FLOW 1: LIVE CONVERSATION (TALK)

## 3.0 Flow Overview

```
Onboarding (first launch only)
  ↓
Home → [Start Chat] → Setup → Session Code → Chat
      [Join Chat]  → Join Setup → Chat
      [Recent Sessions] → Chat (reconnect)
```

---

## 3.1 Screen: Onboarding

*Shown only on first launch.*

### 3.1.1 Layout

Three swipeable slides, dots indicator, Next/Get started button, Skip link.

### 3.1.2 Slides

| Slide | Emoji | Title | Body |
|---|---|---|---|
| 1 | 💬 | Talk to anyone | Real-time bilingual conversation. You type in your language — your partner reads in theirs. |
| 2 | 📚 | Build your phrasebook | Save phrases from conversations, tag them by context, and surface them mid-conversation. |
| 3 | 🎤 | Speak & listen | Use your voice to type. Tap any message to hear it read aloud in the right language. |

### 3.1.3 Controls

- **Next →** / **Get started** (slide 3): Full-width white pill button, teal text.
- **Skip:** Ghost link below button. Jumps to Home.
- **On complete:** Sets `ts_onboarded = '1'`. Detects device language via `navigator.language`. Navigates to Talk Home.

---

## 3.2 Screen: Home

### 3.2.1 Layout

```
┌─────────────────────────────────────────────────┐
│  [teal gradient hero]                           │
│              talk                               │
│     Live bilingual conversation                 │
│                                                 │
│  [Start a chat →                            ]   │
│  [Join a session                            ]   │
│                                                 │
│  RECENT SESSIONS ─────────────────────          │
│  [Session row]                                  │
│  [Session row]                                  │
│                                            [⚙]  │
└─────────────────────────────────────────────────┘
     [💬 Talk]              [📚 Say]
```

### 3.2.2 Action Buttons

- **Start a chat:** Full-width, `--teal` bg, white text. Sub-label: "Generate a code and invite someone."
- **Join a session:** Full-width, `--paper` bg, `--border` border. Sub-label: "Enter a partner's 6-character code."

### 3.2.3 Recent Sessions List

Each session is a tappable row card (white bg, `--border`, 16px radius):

```
[Avatar]  [Partner Name]                     [✕]
          [Lang A ↔ Lang B · Xh · N msgs]
```

- **Avatar:** 42×42px circle, `--teal-light` bg, first letter of partner name, `--teal` 16px 700.
- **Partner Name [v1.1]:** Shows `partnerName`. If not yet connected, shows session code.
- **✕ delete:** Tap → confirm → `deleteSession()`.
- **Tap row:** Restores session state, attempts P2P reconnect, navigates to Chat.

### 3.2.4 Settings FAB

Bottom-right, 48×48px circle, white bg, `--border` border. ⚙ icon. Navigates to Settings.

---

## 3.3 Screen: Setup — Start a Chat

### 3.3.1 Layout

```
[← Back]  Start a chat
──────────────────────────────────────────────────

Your name *
[text input — pre-filled from saved prefs]

My partner speaks
[dropdown ▾]

You speak: English        ← read-only, detected from device

[Create session →]
```

### 3.3.2 Fields

| Field | Required | Default | Persistence |
|---|---|---|---|
| Your name | Yes | Last saved `userName` pref | Saved to prefs on submit |
| My partner speaks | Yes | Last used `partnerLang` pref | Saved to prefs on submit |
| You speak | Read-only | `navigator.language` | Set once at onboarding |

**Create session:** On tap → generate 6-char alphanumeric code → create session record → navigate to Session Code screen → begin `initPeerHost()`.

---

## 3.4 Screen: Setup — Session Code

### 3.4.1 Layout

```
[← Back]  Share code
──────────────────────────────────────────────────

┌─────────────────────────────────────────────────┐
│  A B C 1 2 3            [Copy]                  │
└─────────────────────────────────────────────────┘

[📤 Share code]

Waiting for partner…   →   ✓ Partner connected (green)

[Start chatting]   ← always available
```

### 3.4.2 Elements

- **Code display:** DM Sans 700, 34px, letter-spacing 8px, `--teal`. `user-select: all`.
- **Copy:** Copies to clipboard. Toast: "Copied."
- **Share:** `navigator.share()` with fallback copy. Text: "Join my Talk session\nCode: ABC123"
- **Start chatting:** Host can enter chat before partner connects.

---

## 3.5 Screen: Setup — Join a Chat

### 3.5.1 Layout

```
[← Back]  Join a session
──────────────────────────────────────────────────

Your name *
[text input — pre-filled]

Session code
[LARGE MONO INPUT — 6 chars, auto-uppercase]

[Previous code chips if any saved sessions exist]

[Join session →]
```

### 3.5.2 Session Dedup [v1.1]

Before creating a new session object, check if a session with the same code and `isInitiator: false` already exists. If so, reuse that session ID and restore its message history.

---

## 3.6 Screen: Chat

### 3.6.1 Chat Header

```
[←]  [Partner Name]                              [⋮]
     [EN ↔ TH]  [● connected]
──────────────────────────────────────────────────────
[☁ Cloud translation]   or   [🟢 On-device translation]
```

**← Back [v1.1]:** Returns to Home. Does NOT end session. Peer stays alive.

**Partner Name [v1.1]:** Shows `session.partnerName` after hello handshake. Shows "Waiting for partner…" before.

**⋮ menu:** Opens Session Info sheet (§3.6.6). No Phrasebook link.

### 3.6.2 Message List

Scrollable, bottom-anchored.

#### 3.6.2.1 My Message Bubble (right-aligned)

Max width 84%.

```
                  ┌───────────────────────────────┐
                  │  [They see — translation  ]    │
                  │  [I wrote — original, dim ]    │
                  └───────────────────────────────┘
                  [?] [🔊src] [🔊tgt] [10:42] [✓] [save]
                  [Clarification annotation — if answered]
```

**Primary text (top):** `msg.translated` — what partner receives, in `partnerLang`. 15px white.

**Original text (below):** `msg.text` — what I typed, in `myLang`. 12px white 50%. Collapsed 2.8em. Tap bubble to expand.

**Footer row [v1.2]:**
- `[?]` — Clarify button
- `[🔊src]` — TTS plays `msg.text` in `myLang` (hear yourself in your own language)
- `[🔊tgt]` — TTS plays `msg.translated` in `partnerLang` (hear what partner hears)
- `[HH:MM]` — Timestamp
- `[✓]` — Send status
- `[save]` — Save to phrasebook

**D-3.6.2-A [v1.2]:** Each message bubble has two TTS buttons — one for each language direction. This is the same pattern as the five-layer card anatomy: the source language utterance and the target language utterance are distinct and must each be separately listenable.

#### 3.6.2.2 Their Message Bubble (left-aligned)

Max width 84%.

```
┌───────────────────────────────────────────────┐
│  [Translation in my language — 15px ink]      │
│  [Original text — 12px ink-dim, collapsible]  │
└───────────────────────────────────────────────┘
[?] [🔊src] [🔊tgt] [10:42] [save]
[Clarification annotation — if answered]
```

**Primary text:** `msg.translated` — translated to `myLang`. Shown first because it's the usable content.

**Original text:** `msg.text` — partner's original in `msg.lang`. Collapsed. Tap to expand.

**Footer row [v1.2]:**
- `[🔊src]` — TTS plays `msg.translated` in `myLang` (what I understand)
- `[🔊tgt]` — TTS plays `msg.text` in `msg.lang` (what partner actually said)

### 3.6.3 Clarify Button — States

**D-3.6.3-A [v1.1]:** No animation on any clarify button state. States distinguished by color only.

**My message (teal bubble):**

| State | Border | Text color | Background | Icon |
|---|---|---|---|---|
| `c-none` | white 25% | white 25% | transparent | ? |
| `c-requested` | white 70% | white 90% | white 15% | ? |
| `c-answered` | white 100% | white 100% | white 20% | ✓ |

**Their message (paper bubble):**

| State | Border | Text color | Background | Icon |
|---|---|---|---|---|
| `c-none` | ink 18% | ink 18% | transparent | ? |
| `c-requested` | `--amber` | `--amber` | `--amber-light` | ? |
| `c-answered` | `--teal` | `--teal` | `--teal-light` | ✓ |

### 3.6.4 Typing Indicator

Single text bar above composer. 12px `--ink-dim`. "Partner is typing…". Clears 3s after last typing event.

### 3.6.5 Composer Bar [v1.2]

```
┌──────────────────────────────────────────────────┐
│  [🎤]  [📚]  [type a message…       ↑ send]       │
└──────────────────────────────────────────────────┘
```

**🎤 Voice input:** STT. Tap to start/stop. Hidden if API unavailable.

**📚 Phrase Picker button [v1.2]:** Opens Phrase Picker Sheet (§3.6.11). Always present. Enabled whether or not a session is connected.

**D-3.6.5-A [v1.2]:** The Phrase Picker is the primary bridge between Say and Talk. Any catalog phrase can be inserted into the composer with a single tap. Tag-based filtering makes this fast in practice — during a food ordering situation you tap the "food" tag and see only relevant phrases.

**Text input:** Auto-resizes 1–4 lines. DM Sans 15px. Enter sends (desktop). Disabled when disconnected.

**Send button:** 42×42px circle, `--teal` bg, white ↑.

### 3.6.6 Session Info Sheet (⋮ menu) [v1.1]

```
── drag handle ──

Session info

You:          Alex
Partner:      Nong
Languages:    English ↔ Thai
Code:         ABC123
Status:       Connected

[End session]   ← danger red
[Close]         ← secondary
```

### 3.6.7 Check Panel (my bubble tap) [v1.2]

**D-3.6.7-A [v1.1]:** No edit button. Check Panel is read-only verification only.

**D-3.6.7-B [v1.2]:** The Check Panel exposes all five conceptual layers of a message, each with its own TTS button where applicable. This replaces the prior two-field layout.

```
── drag handle ──

┌─ Layer 1 ─────────────────────────────────────┐
│  YOU WROTE (English)            [🔊 hear]      │
│  "Where is the train station?"                 │
└────────────────────────────────────────────────┘

┌─ Layer 2 ─────────────────────────────────────┐
│  THEY HEAR (Thai)               [🔊 hear]      │
│  "สถานีรถไฟอยู่ที่ไหน"                         │
└────────────────────────────────────────────────┘

┌─ Layer 3 ─────────────────────────────────────┐
│  BACK INTO YOUR LANGUAGE                       │
│  "Where is the railway station?"  [🔊 hear]    │
│  [Tap Check to verify — italic dim initially]  │
└────────────────────────────────────────────────┘

┌─ Layer 4 ─────────────────────────────────────┐
│  CLARIFICATION                                 │
│  [Clarification text rendered as markdown]     │
│  ← hidden entirely if clarify.status = 'none' │
└────────────────────────────────────────────────┘

[Close]              [Check ↺]  [+ Save phrase]
```

**Layer 1 — You wrote:**
- Text: `msg.text` in `myLang`
- [🔊] TTS plays `msg.text` in `myLang`

**Layer 2 — They hear:**
- Text: `msg.translated` in `partnerLang`
- [🔊] TTS plays `msg.translated` in `partnerLang`

**Layer 3 — Back translation:**
- Initially shows: italic dim "Tap Check to verify"
- [Check ↺]: calls `translate(msg.translated, partnerLang, myLang)`. Populates result.
- After check: shows back-translated text + [🔊] TTS in `myLang`
- Purpose: verify the round-trip. If Layer 1 ≠ Layer 3, the translation changed meaning.

**Layer 4 — Clarification:**
- Shown only if `msg.clarify.status !== 'none'`
- If `requested`: shows "Your partner asked for clarification" + [Respond →] button
- If `answered`: shows `renderMd(msg.clarify.text)`
- No TTS for clarification (it's a written note)

**[+ Save phrase]:**
- Creates a card from `msg.text` (source) + `msg.translated` (target)
- Pre-fills back-translation if already checked
- Opens New Phrase Sheet (§4.4) pre-populated with all available data

### 3.6.8 Clarify Request Sheet (their bubble → [?])

```
── drag handle ──

Ask for clarification

About this message:
┌──────────────────────────────────────────┐
│  [Partner's original text]               │
└──────────────────────────────────────────┘

[Optional note]
Placeholder: "What are you unsure about?"

[Cancel]        [Ask]
```

**[Ask]:** Sets `clarify.status = 'requested'`. Sends `{type:'clarify', id:msgId}` via P2P. Toast: "Clarification requested."

### 3.6.9 Clarify Answer Sheet (my bubble → [?] when requested)

```
── drag handle ──

Add clarification

Your partner asked about:
┌──────────────────────────────────────────┐
│  [My original message text]              │
└──────────────────────────────────────────┘

[Multiline textarea — min 4 rows]
Placeholder: "Explain what you meant…"
Hint: **bold**, *italic*, [link](url)

[Cancel]        [Send]
```

**[Send]:** Sets `clarify.status = 'answered'`, `clarify.text = input`. Sends `{type:'clarify-ans', id, text}` via P2P. Renders annotation. Toast: "Clarification sent."

### 3.6.10 End Session Sheet

```
── drag handle ──

Save phrases?
Select messages to add to your phrasebook.

[Checklist of last 10 messages with source + translation]

[Save selected & end]   ← primary teal
[End without saving]    ← secondary
```

Each item: checkbox + source text + translated text. Pre-selects items with >2 words.

### 3.6.11 Phrase Picker Sheet [v1.2]

Opened by tapping 📚 in the composer bar. Full-height bottom sheet.

```
── drag handle ──

[🔍  Search phrases…                              ]

ALL TAGS  ──────────────────────────────────────────
[All] [#food] [#transport] [#formal] [#emergency]
[#shopping] [#hotel] [#medical] [#social]

RESULTS ─────────────────────────────────────────────
┌─────────────────────────────────────────────────────┐
│  [🔊] Can I have the bill please?                   │
│       ขอบิลด้วยครับ/ค่ะ                              │
│  #food  #formal                       [Insert →]   │
└─────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────┐
│  [🔊] Do you have a vegetarian option?              │
│       มีอาหารมังสวิรัติไหม                           │
│  #food                                [Insert →]   │
└─────────────────────────────────────────────────────┘

[No phrases match — tap + to add one]   ← empty state
```

**Search field:** Real-time filter on `source`, `target`, `tags`. Updates result list on each keystroke.

**Tag filter row:** Horizontal scroll. "All" chip always first. Shows only tags that exist on at least one card. Tapping a tag chip filters to cards with that tag. Multiple tags: additive filter (card must have ALL selected tags). Active chip: `--teal` bg, white text.

**Result rows:**
- `[🔊]` button left: plays `card.target` in `targetLang`. Toggle stop/play.
- Source phrase: 14px 500 `--ink`
- Target phrase: 13px `--ink-dim`
- Tag pills: small neutral pills
- `[Insert →]` button right: teal pill. Tap:
  - Inserts `card.target` into composer textarea
  - Closes sheet
  - Increments `card.usage`, sets `card.lastUsedAt`
  - Focus returns to composer

**Language filtering:** Only shows cards whose `targetLang` matches `session.partnerLang`. If no active session: shows all cards.

**D-3.6.11-A [v1.2]:** The Phrase Picker only shows cards whose target language matches the current session's partner language. This prevents accidentally inserting a Spanish phrase into a Thai conversation. When no session is active, all cards are shown.

---

## 3.7 Screen: Settings

See Part VII.

---

# PART IV — FLOW 2: PHRASEBOOK & CATALOG MANAGEMENT (SAY)

## 4.0 Flow Overview

```
Say Home (Catalog Grid)
  ↓
[Tap catalog card] → Catalog Screen (Card List)
  ↓
[Tap card row] → Card expands inline (5-layer detail)
  ↓
[+ Add] → New Phrase Sheet
[New catalog] → New Catalog Sheet
```

---

## 4.1 Screen: Say Home (Catalog Grid)

### 4.1.1 Layout

```
[teal gradient hero]
              say
        Your phrasebook

[Search all phrases…]      [+ Card]

Show: [All languages ▾]

┌──────────────────────────────────────┐
│  📚 All Phrases        47 phrases    │
└──────────────────────────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ 🗺 Thailand    📌│  │ 💬 From Talk    │
│   Travel        │  │   8 phrases     │
│   12 phrases    │  └─────────────────┘
└─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ 🍜 Food         │  │  ＋ New catalog  │
│   6 phrases     │  │                 │
└─────────────────┘  └─────────────────┘

     [💬 Talk]              [📚 Say]
```

### 4.1.2 Search Bar

Full-width. On input >1 char: opens Catalog screen for "All Phrases" with search pre-populated.

`[+ Card]` opens New Phrase Sheet (§4.4).

### 4.1.3 Language Pair Filter [v1.1]

Dropdown: "All languages" or specific "English ↔ Thai" pairs derived from card data.

### 4.1.4 Catalog Grid

2-column grid. Cards: white bg, `--border`, 16px radius. Emoji (26px) + name (Lora 15px) + count (12px dim).

📌 pin badge if `isPinned`. ✕ delete hover button.

**"From Talk" catalog** (`cat-talk`): System catalog, cannot be deleted.

### 4.1.5 Delete Catalog Behavior [v1.1]

Orphans cards to All Phrases. Confirm dialog states: "N phrase(s) will remain in All Phrases."

---

## 4.2 Screen: Catalog (Card List)

### 4.2.1 Header

```
[←]  [Catalog Name]                         [+ Add]
```

### 4.2.2 Toolbar

```
[Search phrases…]

[All] [#food] [#transport] [#formal] [⭐ Favorites] [Essential] [Archive]
```

**D-4.2.2-A [v1.2]:** Tags appear directly in the filter chip row alongside the existing Priority and Favorites filters. Tags are dynamically generated from cards in the current catalog. This makes tags a first-class filter mechanism, not an afterthought.

Tag chips: show only tags present on cards in this catalog. Sorted by frequency (most common first). Active: `--teal` bg. Inactive: `--tag-bg`.

### 4.2.3 Card List

Scrollable, 8px gap. Collapsed card row:

```
[★]   [Source phrase]             [#tag1] [#tag2] [🔊] [›]
      [Target phrase — ink-dim]
```

- Tags shown as small neutral pills between text and TTS button
- Max 2 tags shown; overflow: `+N`
- `[🔊]` plays `card.target` in `targetLang`

---

## 4.3 Card Detail — Full 5-Layer Anatomy [v1.2]

**D-4.3-A [v1.2]:** A phrase card has five distinct layers, each representing a different stage of the translation and communication process. Every layer has its own purpose, its own edit affordance where applicable, and its own TTS button where text is spoken aloud. This structure is consistent between the Check Panel (§3.6.7) and the Card Detail view.

When a card row is tapped, it expands inline. Only one card is open at a time. Scroll to reveal.

### Layer 1 — Source Phrase

```
SOURCE (English)                        [🔊] [Edit]
The phrase in your language
─────────────────────────────────────────────────────
[textarea — shown when editing]

                    [Save]  [Cancel]   ← only while editing
```

- **[🔊]:** Plays `card.source` in `card.sourceLang`
- **[Edit]:** Reveals textarea pre-filled with current source. Save updates field, clears `backTranslation` and `backApproved`.

### Layer 2 — Target Translation

```
TRANSLATION (Thai)                      [🔊] [Edit]
What you say to your partner
─────────────────────────────────────────────────────
[textarea — shown when editing]
[Re-translate →]   ← only while editing, teal-light button

                    [Save]  [Cancel]
```

- **[🔊]:** Plays `card.target` in `card.targetLang`
- **[Re-translate →]:** Calls translation engine: `translate(card.source, card.sourceLang, card.targetLang)`. If target field already has content: confirm "This will overwrite your translation. Continue?" before running.
- **[Edit] / [Save] / [Cancel]:** Same as Layer 1.

### Layer 3 — Back-Translation

```
BACK-TRANSLATION                                [Verify ↺]
Round-trip check: does the target mean what you intended?
─────────────────────────────────────────────────────
[back-translation text — italic ink-dim]
   or "Not verified yet" in dim italic
─────────────────────────────────────────────────────
[🔊 Hear back-translation]   ← shown only after verify runs

[✓ Looks right]   ← shown when backTranslation exists + backApproved=false
[✓ Verified]      ← green label, no button, when backApproved=true
```

- **[Verify ↺]:** `translate(card.target, card.targetLang, card.sourceLang)`. Populates `card.backTranslation`. Shimmer while translating.
- **[🔊 Hear back-translation]:** Plays `card.backTranslation` in `card.sourceLang`. Shown only after at least one verify.
- **[✓ Looks right]:** Sets `card.backApproved = true`. Saves. Replaces button with green "✓ Verified" label.
- **Design purpose:** The back-translation is the quality check. If Layer 1 and Layer 3 are meaningfully different, the card's translation may be misleading. User decides whether to correct or approve.

### Layer 4 — Notes & Clarification

```
NOTES                                            [Edit]
Context, usage tips, pronunciation hints
─────────────────────────────────────────────────────
[rendered markdown — or "No notes" in italic dim]

  [textarea — shown when editing]
  Hint: **bold** *italic* [link](url)
                    [Save]  [Cancel]
```

- Notes render via `renderMd()` in display mode
- Includes: pronunciation hints, situation context ("Use for BTS Skytrain only"), speaker gender notes for Thai (ครับ/ค่ะ), links to reference materials
- No TTS for notes (freeform text, not a speakable phrase)

### Layer 5 — Tags

```
TAGS
─────────────────────────────────────────────────────
[#food] [#formal] [#restaurant] [+ Add tag]
```

- Tags shown as removable pills (§2.9) in display mode
- `[+ Add tag]`: opens Tag Picker sheet (§8.7.2)
- Tapping an existing tag: opens Tag Picker pre-focused on that tag to allow removal
- Tags save immediately (no Save/Cancel)

### Card Controls Row (below all layers)

```
PRIORITY
[Essential]  [Standard]  [Archive]

─────────────────────────────────────────────────────
[★ Favorite]      [🔊 Use in Talk]      [🗑 Delete]
```

**Priority:** 3-button segmented control. Tap saves immediately.
- Essential: `--teal` bg, white text
- Standard: `--amber-light` bg, `--amber` text
- Archive: `--paper` bg, `--ink-dim` text

**[★ Favorite]:** Toggle. Filled amber star = favorite. Saves immediately.

**[🔊 Use in Talk]:**
- Active when a Talk session is active (connected or backgrounded)
- Inserts `card.target` into Talk composer. Switches to Talk tab. Navigates to Chat.
- Increments `card.usage`. Sets `card.lastUsedAt`.
- Disabled (40% opacity) if no active session.

**[🗑 Delete]:** Confirm dialog → removes card from storage. Re-renders list.

### Card Metadata Line

```
Used 3× · Added 2d ago · From Talk with Nong
```

12px `--ink-dim`. "From Talk with [name]" only if `sourcePartnerName` is set.

---

## 4.4 New Phrase Sheet [v1.2 — Bug Fix + Tags]

**D-4.4-A [v1.2]:** The New Phrase Sheet was not saving cards in v1.1. Root cause: the [Save phrase] button handler was calling an undefined function or failing to write to `say_cards` in localStorage. The fix is explicit: validate → build card object with `uid()` → `saveCard(cardObj)` → close sheet → re-render → toast.

**D-4.4-B [v1.2]:** Tags are now available on the New Phrase Sheet so cards can be tagged at creation time, not just after the fact.

```
── drag handle ──

New phrase

Source phrase *                         [EN ▾]
[text input — auto-grows, placeholder: "What do you want to say?"]

Translation                             [TH ▾]
[text input — auto-grows]
[Auto-translate →]

Notes
[textarea — 2 rows, placeholder: "Usage tips, pronunciation…"]

Tags
[tag pill 1] [tag pill 2] [+ Add tag]

Catalog
[dropdown ▾ — defaults to currently open catalog or "All"]

[Save phrase]   ← primary teal, always labeled "Save phrase"
[Cancel]        ← secondary
```

**Validation:**
- Source phrase: required. [Save phrase] button disabled if empty.
- Translation: optional at save time (user may add later).
- At least one of source or translation must be non-empty for card to be useful.

**[Auto-translate →]:** Enabled when source field is non-empty. Calls `translate(source, sourceLang, targetLang)`. Populates translation field. Button shows "Translating…" with shimmer during call.

**Language dropdowns:** Default to `session.myLang` / `session.partnerLang` if a session is active. Otherwise default to last-used prefs. Changing language dropdowns clears the translation field (to avoid stale translation from the previous language pair).

**[+ Add tag]:** Opens Tag Picker sheet (§8.7.2).

**[Save phrase] behavior [v1.2 — bug fix]:**

```
1. Validate: source.trim() is non-empty
2. Build card object:
   {
     id:          uid(),
     catalogIds:  [selectedCatalogId],
     sourceLang:  sourceLang,
     targetLang:  targetLang,
     source:      source.trim(),
     target:      translation.trim() || '',
     notes:       notes.trim() || '',
     tags:        selectedTags,
     priority:    'Standard',
     favorite:    false,
     usage:       0,
     createdAt:   Date.now(),
     updatedAt:   Date.now()
   }
3. const cards = getCards();
4. cards.push(card);
5. lsW('say_cards', JSON.stringify(cards));
6. closeSheet();
7. re-render card list;
8. toast("Phrase saved");
```

---

## 4.5 New Catalog Sheet [v1.1]

```
── drag handle ──

New catalog

Name *
[text input — required]

Description
[text input]

Emoji
[grid of 24 options + text input]

[Create catalog]
[Cancel]
```

Catalog name required. On save: creates catalog object, re-renders grid, toast: "Catalog created."

---

# PART V — FLOW 3: CATALOG BUILDER (FROM CONVERSATION)

## 5.0 Flow Overview

```
During Talk   → [save] link below bubble → instant save to "From Talk"
After Talk    → End Session checklist → bulk save
Anytime       → Say → [+ Card] → manual entry + auto-translate + tags
```

## 5.1 In-Conversation Save

### 5.1.1 The "save" link

- Below every bubble. DM Sans 11px 600 `--teal`.
- One tap: saves phrase instantly. Toast: "Saved to Phrasebook."
- Already saved: Toast: "Already saved." (idempotent)

### 5.1.2 Saved card field mapping

| Card field | From my bubble | From their bubble |
|---|---|---|
| `source` | `msg.text` | `msg.translated` |
| `target` | `msg.translated` | `msg.text` |
| `sourceLang` | `session.myLang` | `session.myLang` |
| `targetLang` | `session.partnerLang` | `session.partnerLang` |
| `sourceSessionId` | current session ID | current session ID |
| `sourcePartnerName` | `session.partnerName` | `session.partnerName` |
| `catalogIds` | `['cat-talk']` | `['cat-talk']` |

### 5.1.3 Tags on in-conversation saves

**D-5.1.3-A [v1.2]:** Cards created from the [save] link are saved with an empty `tags` array. This is intentional — tagging during the heat of a conversation creates friction. Tags should be added at review time in Say.

### 5.1.4 "From Talk" catalog

Auto-created (`cat-talk`) on first save. Cannot be deleted.

---

## 5.2 End-of-Session Bulk Save

See §3.6.10. Saved cards get empty `tags` array; user tags them later in Say.

---

## 5.3 Starter Data [v1.1]

**D-5.3-A [v1.1]:** On first install, seeds "Thailand Travel" catalog (`cat-travel-th`) with 12 en→th phrases. All starter phrases include tags.

**Starter phrase tag assignments:**

| # | Source | Tags |
|---|---|---|
| 1 | Where is the bathroom? | `#essential` `#everywhere` |
| 2 | How much does this cost? | `#shopping` `#negotiating` |
| 3 | I'd like to order this | `#food` `#restaurant` |
| 4 | Please take me to this address | `#transport` `#taxi` |
| 5 | Do you have a vegetarian option? | `#food` `#dietary` |
| 6 | Can I have the bill please? | `#food` `#restaurant` |
| 7 | I am allergic to peanuts | `#food` `#dietary` `#medical` |
| 8 | Can you speak more slowly? | `#communication` `#everywhere` |
| 9 | Where is the nearest hospital? | `#medical` `#emergency` |
| 10 | I need help | `#emergency` `#essential` |
| 11 | Thank you very much | `#social` `#essential` |
| 12 | Is this included in the price? | `#shopping` `#negotiating` |

Seeding is idempotent — skipped if `cat-travel-th` already exists.

---

# PART VI — FLOW 4: PRACTICE & REVIEW [V2 DEFERRED]

See Appendix C.

---

# PART VII — FLOW 5: SETTINGS

## 7.1 Screen: Settings

```
[← Back]  Settings

TRANSLATION ENGINE
[Status card]

SAVED SESSIONS
[Session rows — name, lang pair, count, delete icon]

PHRASEBOOK
Cards saved:    47
Storage used:   24.3 KB

ABOUT
Talk + Say · v1.2 · Bilingual conversation & phrasebook
```

### 7.1.1 Translation Engine Section

Info card, `--teal-light` bg:
- On-device: "Using Chrome Built-in AI — translation works offline."
- Cloud: "Using MyMemory free API — requires internet (5000 chars/day)."

### 7.1.2 Saved Sessions Section

Rows: partner name, language pair, message count. Delete icon (🗑). Tap delete: confirm → `deleteSession()`.

### 7.1.3 Storage Section

- Cards saved: `getCards().length`
- Storage used: sum of localStorage key sizes in KB

---

# PART VIII — CROSS-CUTTING CONCERNS

## 8.1 Translation Engine

### 8.1.1 Detection

```
IF window.translation EXISTS AND typeof window.translation.createTranslator === 'function'
  TRY: create translator, translate()
  → tEngine = 'on-device'
  CATCH: fall through to cloud
ELSE
  → use cloud (MyMemory)
```

Translator instances cached per language pair in `window._tr['{src}-{tgt}']`.

### 8.1.2 Chrome On-Device

- `window.translation.createTranslator({ sourceLanguage, targetLanguage })`
- `.translate(text)` → `Promise<string>`
- Requires Chrome 138+

### 8.1.3 Cloud Fallback (MyMemory)

- `https://api.mymemory.translated.net/get?q={text}&langpair={src}|{tgt}`
- `data.responseData.translatedText` when `responseStatus === 200`

### 8.1.4 Translation Cache

- In-memory `Map`. Key: `"${from}|${to}|${text}"`. Never persisted.

### 8.1.5 Error Handling

On failure: return `null`. UI shows shimmer → empty (source text visible). Retry on user tap.

---

## 8.2 Text-to-Speech (TTS) [v1.2]

### 8.2.1 Engine

```javascript
const synth = window.speechSynthesis;
const canSpeak = 'speechSynthesis' in window;

const utt = new SpeechSynthesisUtterance(text);
utt.lang = langCode; // BCP-47 e.g. 'en', 'th-TH', 'ja-JP'
synth.cancel();
synth.speak(utt);
```

### 8.2.2 Playback State Tracking [v1.1]

Module-level `ttsActive` holds reference to the active button DOM element.

1. If `ttsActive === requestedButton`: cancel utterance, clear `ttsActive`, return (toggle off).
2. If `ttsActive !== null`: cancel utterance, reset previous button to 🔊.
3. Set new button to playing state (⏹), assign to `ttsActive`.
4. `utt.onend` / `utt.onerror`: reset button, clear `ttsActive`.

### 8.2.3 TTS Trigger Points — Complete Map [v1.2]

**D-8.2.3-A [v1.2]:** TTS must work for BOTH language directions at every location where spoken output is relevant. The prior implementation was missing TTS for the source language in chat bubbles and the back-translation in the Check Panel. All five layers of a card have TTS where applicable.

| Location | Which button | Text played | Language used |
|---|---|---|---|
| Chat — my bubble footer | `[🔊src]` | `msg.text` | `session.myLang` |
| Chat — my bubble footer | `[🔊tgt]` | `msg.translated` | `session.partnerLang` |
| Chat — their bubble footer | `[🔊src]` | `msg.translated` | `session.myLang` |
| Chat — their bubble footer | `[🔊tgt]` | `msg.text` | `msg.lang` |
| Check Panel — Layer 1 | `[🔊 hear]` | `msg.text` | `session.myLang` |
| Check Panel — Layer 2 | `[🔊 hear]` | `msg.translated` | `session.partnerLang` |
| Check Panel — Layer 3 | `[🔊 hear]` | back-translated text | `session.myLang` |
| Card detail — Layer 1 | `[🔊]` | `card.source` | `card.sourceLang` |
| Card detail — Layer 2 | `[🔊]` | `card.target` | `card.targetLang` |
| Card detail — Layer 3 | `[🔊 Hear]` | `card.backTranslation` | `card.sourceLang` |
| Card row in list | `[🔊]` | `card.target` | `card.targetLang` |
| Phrase Picker row | `[🔊]` | `card.target` | `card.targetLang` |

**Note on button labels:** `[🔊src]` and `[🔊tgt]` are rendered as visually identical 🔊 icon buttons. They are differentiated only by their position in the footer row (src left, tgt right) and a tooltip/accessible label. Do NOT add text labels to the buttons in the chat bubble footer — space is at a premium.

### 8.2.4 Playback Button Visual States

- Default: 🔊, 55% opacity
- Playing: ⏹, 100% opacity
- Tap while playing: stops utterance, returns to 🔊

### 8.2.5 Language → Locale Mapping

| Lang code | Locale for TTS |
|---|---|
| `en` | `en-US` |
| `th` | `th-TH` |
| `ja` | `ja-JP` |
| `ko` | `ko-KR` |
| `zh` | `zh-CN` |
| `ar` | `ar-SA` |
| `hi` | `hi-IN` |
| others | `{code}-{CODE}` |

---

## 8.3 Voice Input (Speech-to-Text)

### 8.3.1 Engine

```javascript
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
// If !SpeechRec: hide 🎤 button (.hidden)
```

### 8.3.2 Configuration

```javascript
recognition.lang = session.myLang || getPref('myLang', 'en');
recognition.interimResults = true;
recognition.continuous = false;
```

### 8.3.3 Behavior

- Tap 🎤: start. Red ⏹ icon.
- Tap again: stop.
- Interim results: populate input in italic grey.
- Final result: normal text in input. User reviews and taps Send.
- STT never auto-sends.

### 8.3.4 Error Handling

- `not-allowed`: toast "Microphone permission required."
- `no-speech`: silent fail.
- Other: toast with error description.

---

## 8.4 P2P Networking

### 8.4.1 Library

PeerJS 1.5.4: `https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js`

### 8.4.2 Peer ID Convention [v1.1]

- **Host:** `talksay1_{SESSION_CODE}_h`
- **Joiner:** Random (PeerJS-assigned)
- **Joiner connects to:** `talksay1_{SESSION_CODE}_h`

### 8.4.3 Hello Handshake [v1.1]

```
Joiner → Host:  { type: 'hello', name, lang }
Host → Joiner:  { type: 'hello', name, lang }
```

Host sends hello back once per connection via `session._sentHelloBack` flag. Flag resets to `false` on every new connection open.

### 8.4.4 Message Protocol

| `type` | Fields | Purpose |
|---|---|---|
| `hello` | `name, lang` | Identity exchange |
| `msg` | `id, text, lang, timestamp` | Chat message |
| `typing` | `name` | Typing indicator |
| `clarify` | `id` | Request clarification |
| `clarify-ans` | `id, text` | Provide clarification |

### 8.4.5 Error Handling [v1.1]

| Error | Behavior |
|---|---|
| `peer-unavailable` | Set disconnected. Add sys msg "Partner is offline." No toast. |
| `unavailable-id` (host) | Toast: "Code already in use. Try a new session." |
| `close` event | Set `connected = false`. Update header dot. |
| Other | Console only. No user-facing error. |

### 8.4.6 Connection States

| State | Dot color | Label |
|---|---|---|
| Connected | Green | "Connected" |
| Disconnected | Grey | "Not connected" |

### 8.4.7 Session Persistence

Sessions and messages in localStorage. Max 300 messages/session (`Array.slice(-300)`). Re-opening from Home attempts P2P reconnect.

---

## 8.5 Persistence & Storage

### 8.5.1 localStorage Key Schema

| Key | Type | Contents |
|---|---|---|
| `ts_sessions` | JSON array | Session metadata |
| `ts_active` | string | Current/last active session ID |
| `ts_msg_{sessionId}` | JSON array | Messages (max 300) |
| `ts_onboarded` | string | `"1"` after onboarding |
| `ts_prefs` | JSON object | User preferences |
| `say_catalogs` | JSON array | Catalog objects |
| `say_cards` | JSON array | All card objects |
| `say_tags` | JSON array | Tag registry |

### 8.5.2 Preferences Object

```json
{
  "userName": "Alex",
  "myLang": "en",
  "partnerLang": "th"
}
```

### 8.5.3 Storage Helpers

```javascript
const ls   = k     => { try { return localStorage.getItem(k); } catch(e) { return null; } }
const lsW  = (k,v) => { try { localStorage.setItem(k, v); } catch(e) { toast('Storage full'); } }
const lsD  = k     => { try { localStorage.removeItem(k); } catch(e) {} }
```

### 8.5.4 Limits

- Messages/session: 300 (FIFO eviction)
- Cards: no artificial limit
- Tags: no artificial limit

---

## 8.6 Markdown Rendering

### 8.6.1 Supported Syntax

| Input | Output |
|---|---|
| `**text**` | **bold** |
| `*text*` | *italic* |
| `~~text~~` | ~~strikethrough~~ |
| `[label](url)` | Link, `target="_blank" rel="noopener"` |

Block elements (headings, lists, code blocks) not supported.

### 8.6.2 Implementation

```javascript
function renderMd(s) {
  return escHtml(s)   // HTML-escape FIRST (XSS prevention)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
}
```

### 8.6.3 Applied In

- Clarification annotations (both sides)
- Card notes (Layer 4 display mode)
- Clarify Answer hint text

---

## 8.7 Tag System [v1.2]

### 8.7.1 Tag Data Model

Tags are plain lowercase strings, prefixed with `#` in the UI only. Stored without the `#` prefix in data.

A tag is:
- Max 24 characters
- Alphanumeric + hyphens only (no spaces, no special chars)
- Lowercase always (normalized on save)
- Not a required field on any card

Tags are stored:
1. In `card.tags` (array of strings on each card object)
2. In the Tag Registry (`say_tags` in localStorage) — a deduplicated sorted list of all tags ever used

### 8.7.2 Tag Picker Sheet

Opened by `[+ Add tag]` on any card or on the New Phrase Sheet.

```
── drag handle ──

Tags

[Search tags…]

ALL TAGS ────────────────────────────────────────────
[#essential]  [#food]  [#transport]  [#formal]
[#emergency]  [#shopping]  [#social]  [#medical]
[#hotel]  [#communication]  [#dietary]  [#negotiating]
[#everywhere]  [#restaurant]  [#taxi]

CURRENT CARD TAGS
[#food] [#formal]   ← selected tags shown with checkmark / teal fill

[+ Create new tag: ___________]   ← shown when search has no match

[Done]
```

**Search field:** Filters tag list in real-time.

**Tag chips:** Tapping a tag toggles it on/off for the current card. Teal fill = selected (on card). Neutral = not on card.

**[+ Create new tag: ___]:** Shown when search text is non-empty AND has no match in registry. Tap: creates tag, adds to registry (`say_tags`), adds to card, shows it as selected.

**[Done]:** Saves current tag selection to card immediately. Closes sheet. Re-renders card tags.

**Tag normalization:** Input is lowercased, spaces replaced with hyphens, non-alphanumeric characters (except hyphen) stripped.

### 8.7.3 Tag Registry Management

- Tag registry (`say_tags`) is an array of tag strings sorted alphabetically.
- New tags added via Tag Picker are automatically added to registry.
- Tags removed from ALL cards are NOT automatically removed from registry (user may want to reuse them). Registry is append-only in V1.
- Registry is used to populate the tag picker and filter chips.

### 8.7.4 Tag Usage in Phrase Picker (Talk) [v1.2]

The Phrase Picker (§3.6.11) surfaces tags in real time during Talk sessions. The intended usage flow:

```
You're at a restaurant.
You tap 📚 in the composer.
You tap [#food] in the tag chips.
The phrase list immediately shows only food-related phrases.
You tap [🔊] to preview "Can I have the bill please?" in Thai.
You tap [Insert →] to paste it into your composer.
You send it.
```

**D-8.7.4-A [v1.2]:** Tags are the primary navigation mechanism in the Phrase Picker, not catalogs. Catalogs organize cards for management purposes; tags make phrases findable in real time during conversation. A card can (and should) have multiple tags to be discoverable from multiple angles.

### 8.7.5 Recommended Starter Tags

The app ships with these tags pre-populated in the registry (not mandatory — users can ignore or add their own):

`#essential` `#food` `#transport` `#formal` `#casual` `#emergency` `#shopping` `#social` `#medical` `#hotel` `#communication` `#dietary` `#restaurant` `#taxi` `#negotiating` `#everywhere`

---

# PART IX — DATA MODELS

## 9.1 Session Object

```json
{
  "sessionId": "lk3j8d",
  "sessionCode": "ABC123",
  "isInitiator": true,
  "myName": "Alex",
  "partnerName": "Nong",
  "myLang": "en",
  "partnerLang": "th",
  "createdAt": 1704273600000,
  "lastActivity": 1704277200000,
  "_sentHelloBack": false
}
```

`_sentHelloBack`: runtime flag, always reset to `false` on load. Prevents hello echo loop.

## 9.2 Message Object

```json
{
  "id": "lk3j8d2q",
  "from": "me",
  "lang": "en",
  "text": "Where is the train station?",
  "translated": "สถานีรถไฟอยู่ที่ไหน",
  "status": "sent",
  "timestamp": 1704273700000,
  "clarify": {
    "status": "answered",
    "text": "I mean the **BTS Skytrain**, not the national railway."
  }
}
```

**`from`:** `"me"` | `"them"`
**`status`:** `"sending"` | `"sent"` | `"failed"`
**`clarify.status`:** `"none"` | `"requested"` | `"answered"`

## 9.3 Catalog Object

```json
{
  "id": "cat-travel-th",
  "name": "Thailand Travel",
  "emoji": "🗺",
  "desc": "Essential phrases for traveling in Thailand",
  "isPinned": true,
  "createdAt": 1704273600000
}
```

## 9.4 Card Object [v1.2 — tags restored]

```json
{
  "id": "card-lk3j8d2q",
  "catalogIds": ["cat-talk", "cat-travel-th"],
  "sourceLang": "en",
  "targetLang": "th",
  "source": "Where is the train station?",
  "target": "สถานีรถไฟอยู่ที่ไหน",
  "backTranslation": "Where is the railway station?",
  "backApproved": true,
  "notes": "Use for **BTS Skytrain**. Say slowly and clearly.",
  "tags": ["transport", "essential"],
  "priority": "Essential",
  "favorite": false,
  "usage": 3,
  "createdAt": 1704273800000,
  "updatedAt": 1704274000000,
  "lastUsedAt": 1704280000000,
  "sourceSessionId": "lk3j8d",
  "sourcePartnerName": "Nong"
}
```

**`priority`:** `"Essential"` | `"Standard"` | `"Archive"`
**`tags`:** Array of lowercase strings, no `#` prefix in data.

## 9.5 Preferences Object

```json
{
  "userName": "Alex",
  "myLang": "en",
  "partnerLang": "th"
}
```

## 9.6 Tag Registry [v1.2]

Stored in `say_tags` as a JSON array:

```json
["casual", "communication", "dietary", "emergency", "essential",
 "everywhere", "food", "formal", "hotel", "medical", "negotiating",
 "restaurant", "shopping", "social", "taxi", "transport"]
```

Alphabetically sorted. Deduplicated. Append-only in V1.

---

# PART X — DECISIONS LOG

| ID | Decision | Rationale | Version |
|---|---|---|---|
| D-1.1-A | Single HTML file delivery | Zero build step; trivial to share and self-host | v1.0 |
| D-1.1-B | Tab bar always visible; tabs preserve state | Eliminates confusing navigation paths | v1.1 |
| D-1.2-A | 480px mobile cap, centered on desktop | Core use is in-person mobile | v1.0 |
| D-1.3-A | Device language auto-detected at onboard | Removes a friction step | v1.1 |
| D-1.4-A | Chrome on-device first, MyMemory fallback | Privacy + speed + offline primary; free fallback = universal | v1.0 |
| D-2.5-A | No looping animations on interactive elements | Pulsing/blinking UI distracts during conversation | v1.1 |
| D-3.3-A | Name persisted and pre-filled across sessions | User should never type their name twice | v1.1 |
| D-3.5-A | Session dedup for joiner on same code | Prevents spurious duplicate sessions | v1.1 |
| D-3.6.2-A | Two TTS buttons per bubble (src + tgt) | Both language directions are audible; essential for learning | v1.2 |
| D-3.6.3-A | Clarify button states by color only; no animation | Clear signal without distraction | v1.1 |
| D-3.6.5-A | Phrase Picker button in composer | Tags make phrasebook accessible mid-conversation | v1.2 |
| D-3.6.6-A | Session menu has no Phrasebook link | Navigation to Say belongs to tab bar | v1.1 |
| D-3.6.7-A | Edit window and edit button removed from Check Panel | Time-gated editing was complex and error-prone | v1.1 |
| D-3.6.7-B | Check Panel exposes all 5 layers with TTS | User needs to hear every layer to verify accuracy | v1.2 |
| D-3.6.11-A | Phrase Picker filters by session's partner language | Prevents wrong-language phrase insertion | v1.2 |
| D-4.1.5-A | Delete catalog orphans cards | User phrases are not lost | v1.1 |
| D-4.2.2-A | Tags as first-class filter in catalog toolbar | Tags are navigational, not just decorative | v1.2 |
| D-4.3-A | Card has 5 distinct layers with per-layer TTS | Each layer is a distinct piece of linguistic information | v1.2 |
| D-4.4-A | [Save phrase] bug fix: explicit card write to localStorage | Previous version failed to persist new cards | v1.2 |
| D-4.4-B | Tags available at card creation time | Tagging at the source reduces cleanup work later | v1.2 |
| D-4.5-A | Catalog name required | Every catalog needs a name to be useful | v1.1 |
| D-5.1.3-A | In-conversation saves get empty tag arrays | Tagging during conversation creates friction | v1.2 |
| D-5.3-A | Starter Thailand Travel catalog seeded on first install | Immediate hands-on experience | v1.1 |
| D-6.X-A | Practice deferred to V2 | Conversation + catalog flows first | v1.1 |
| D-8.2-A | TTS via Web Speech API, no external service | Free; no API key; no latency | v1.0 |
| D-8.2-B | One utterance at a time; new request stops previous | Prevents audio overlap | v1.0 |
| D-8.2.3-A | TTS trigger map covers all 5 card layers and both bubble directions | Full language coverage at every text surface | v1.2 |
| D-8.3-A | STT via Web Speech API; tap to start/stop | Natural mobile interaction | v1.1 |
| D-8.3-B | STT never auto-sends | User must confirm to prevent transcription errors | v1.0 |
| D-8.4.2-A | Host has named peer ID; joiner gets random ID | Prevents peer ID collision | v1.1 |
| D-8.4.3-A | Hello sent once per connection via `_sentHelloBack` | Prevents hello echo loop | v1.1 |
| D-8.4.5-A | P2P errors handled silently | Raw error strings are not user-friendly | v1.1 |
| D-8.5-A | localStorage for all persistence | Zero server dependency | v1.0 |
| D-8.6-A | Custom 4-construct markdown renderer | HTML-escape first prevents XSS | v1.0 |
| D-8.7.4-A | Tags = primary navigation in Phrase Picker; catalogs = management | Different jobs; tags win for speed during conversation | v1.2 |
| D-NAV-A | Back from Chat → Home; does NOT end session | Prevents accidental termination | v1.0 |

---

# APPENDIX A — Screen Inventory

## A.1 Full Screens

| # | Screen ID | Title | Entry Point |
|---|---|---|---|
| 1 | `scr-onboard` | Onboarding | First launch only |
| 2 | `scr-home` | Home (Talk) | Tab · Back from Chat · App launch |
| 3 | `scr-start` | Start a Chat | Home → Start |
| 4 | `scr-code` | Session Code | Setup Start → Create |
| 5 | `scr-join` | Join a Session | Home → Join |
| 6 | `scr-chat` | Chat | Connection established · loadSession |
| 7 | `scr-settings` | Settings | Home ⚙ FAB |
| 8 | `scr-say` | Say Home | Tab → Say |
| 9 | `scr-catalog` | Catalog (card list) | Tap catalog card |

## A.2 Sheets / Overlays

| # | Sheet ID | Title | Opens From |
|---|---|---|---|
| S1 | `ov-menu` | Session info | Chat ⋮ button |
| S2 | `ov-check` | Check Panel (5 layers) | My bubble tap |
| S3 | `ov-clarify-req` | Ask for clarification | Their bubble [?] |
| S4 | `ov-clarify-ans` | Add clarification | My bubble [?] (requested) |
| S5 | `ov-end` | Save phrases? | Session menu → End session |
| S6 | `ov-new-card` | New phrase | [+ Card], [+ Add] |
| S7 | `ov-new-cat` | New catalog | New catalog card |
| S8 | `ov-phrase-picker` | Phrase Picker | Composer [📚] button |
| S9 | `ov-tag-picker` | Tags | [+ Add tag] anywhere |
| S10 | `confirm-wrap` | Confirm dialog | Delete actions |

---

# APPENDIX B — Clarification State Machine

## B.1 My Message (`from = 'me'`)

```
Initial: clarify.status = 'none'
[?] = mine c-none (white 25%, no action)

Partner sends {type: 'clarify', id}
  → clarify.status = 'requested'
  → [?] = mine c-requested (white 70% border, white 90% text, white 15% bg)

I tap [?] (c-requested)
  → Clarify Answer Sheet opens
  → I type, tap [Send]
  → clarify.status = 'answered', clarify.text = my text
  → {type: 'clarify-ans', id, text} sent
  → Annotation renders in Layer 4 of Check Panel + below bubble
  → [?] = mine c-answered (white 100%, ✓)

I tap [?] (c-answered) → toggles annotation visibility
```

## B.2 Their Message (`from = 'them'`)

```
Initial: clarify.status = 'none'
[?] = theirs c-none (ink 18%, no action)

I tap [?] (c-none)
  → Clarify Request Sheet opens
  → I tap [Ask]
  → clarify.status = 'requested'
  → {type: 'clarify'} sent
  → [?] = theirs c-requested (amber border, amber text, amber-light bg)

Partner sends {type: 'clarify-ans', id, text}
  → clarify.status = 'answered', clarify.text set
  → Annotation renders
  → [?] = theirs c-answered (teal border, teal text, teal-light bg, ✓)

I tap [?] (c-answered) → toggles annotation visibility
```

---

# APPENDIX C — V2 Deferred Features

| Priority | Feature | Notes |
|---|---|---|
| V2-1 | Practice / Flash card system | Card data (priority, usage, backApproved) already stored |
| V2-2 | Pronunciation field on cards | Field not in V1 card model; add in V2 |
| V2-3 | Draft cards banner (post-session review) | Passive capture review |
| V2-4 | Export / Import all data | Single JSON file |
| V2-5 | Clear all data option in Settings | Requires careful confirm UX |
| V2-6 | User-supplied translation API key | DeepL / Google Cloud |
| V2-7 | TTS voice selection per language | `speechSynthesis.getVoices()` UI |
| V2-8 | Multi-select / bulk tag operations | Needed at scale >50 cards |
| V2-9 | Cloud sync / accounts | Requires backend |
| V2-10 | Tag management screen (rename, merge, delete) | Registry is append-only in V1 |

---

*End of Document*

---

```
TALK-SAY-PRD.md
Version 1.2 — Updated March 2026

Authoritative specification for all Talk + Say development.
To propose a change, reference the section number and decision ID.

Example: "Update §8.7.2 — allow multiple tags selected simultaneously
in Phrase Picker (additive AND filter). Replaces current single-tag behavior."
```
