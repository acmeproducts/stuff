# claude-bridge.md — TalkBridge App-Specific Instructions

App-specific rules for the TalkBridge (`bridge`) project.
Process rules are in `CLAUDE.md`.

---

## Do-Not-Touch Constants

These values must never change. Modifying them breaks the relay
and all other apps sharing the same infrastructure.

```js
RELAY_BASE = 'talk-signal.myacctfortracking.workers.dev/signal'
RELAY_WS   = 'wss://'+RELAY_BASE
RELAY_APP  = 'talk-say-v1'
```

The Cloudflare relay Worker is read-only. Never modify relay
behavior, relay message format, or relay connection logic.

---

## Storage Keys — Canonical Table

All stage files share the same localStorage origin and namespace.
Never rename a key. Never add version-specific prefixes or suffixes.

| Constant | Key string | Holds |
|---|---|---|
| `tb_dg_key` | `tb_dg_key` | Deepgram API key |
| `tb_cf_tid` | `tb_cf_tid` | Cloudflare TURN credential ID |
| `tb_cf_tok` | `tb_cf_tok` | Cloudflare TURN credential token |
| `RK` | `tb_recent_rooms` | Recent rooms list |
| `TP` | `tb_transcript_` | Per-room transcript prefix |
| `tb_dev` | `tb_dev` | Dev mode flag |
| `PB_CARDS` | `say_cards` | Phrasebook cards |
| `PB_CATS` | `say_catalogs` | Phrasebook catalogs |
| `PB_TAGS_K` | `say_tags` | Phrasebook tag registry |
| `PB_SEEDED` | `pb_bridge_v2` | One-time seed sentinel |
| `tb_pb_tel_ep` | `tb_pb_tel_ep` | Telemetry endpoint URL |
| `tb_pb_tel_tok` | `tb_pb_tel_tok` | Telemetry Bearer token |

Before committing any change that touches localStorage, confirm
every key is spelled identically across all stage files.

---

## TTS Rules

- Never hardcode a lang string in any `speakText()` call
- Never read `room.myLang` or `room.theirLang` as TTS lang for
  phrasebook or transcript bubble buttons
- `pbSpeakCard` must always derive lang from `card.sourceLang` / `card.targetLang`
- All TTS playback routes through `speakText(text, lang)`
- No direct calls to `speechSynthesis.speak()` except inside `_doSpeak`
- CSS: `button svg, button svg *{pointer-events:none;}` must be present

---

## Icon Policy

- No emoji anywhere in the app — ever
- Every icon is a grey SVG using `stroke="currentColor"`
- The ICO object is the single source for all icons
- Adding a new icon: add it to ICO first, then reference ICO.name everywhere

---

## App Constraints

- Single HTML file — no split files, no separate JS files
- Joiner credentials are session-only — never write `inviteDgKey`,
  `inviteCfTid`, or `inviteCfTok` to localStorage as top-level keys
- No auto-mute on compose focus (`composeFocusMute` stays removed)
- New CSS always appended at end of style block — never injected mid-block

---

## Phrasebook / PB Team Contract

The phrasebook is a canonical portable content object.
The client (TalkBridge) ingests, renders, searches, and filters.
The client does not generate semantic relationships, quality scores,
or translation intelligence at runtime.

### What the client must preserve on ingest
`catalogIds`, `backtranslate`, `confidence`, `tags`, `stableKey`,
`semanticRelationships` (pass-through only, max 5 relatedIntents),
`intentId`, `primaryTag`, `parentCategory`

### What the client must not do
- Calculate semantic neighbors at runtime
- Generate tags
- Infer missing structure
- Modify `confidence` or `verdict` outside of explicit user action

### Telemetry contract (unverified as of Turn 0)
The TB→PB telemetry handshake has been specified but not confirmed
working end-to-end. Features claimed in code must be verified
against the contract before Turn 0 baseline is declared complete.

Telemetry events the client should emit: `usage_hit`, `clarify`
Delivery: POST on `hangUp()` to `tb_pb_tel_ep` with Bearer `tb_pb_tel_tok`
Host-only: joiner role never posts telemetry

---

## Git Rules

The only branch that serves the live page is `main`.
All work commits directly to main. No feature branches.

### End-of-session push

```bash
git add -A
git commit -m "describe what was done"
git push origin main
```

Verify it landed:

```bash
git log --oneline origin/main..main   # must be empty after push
```

### Session start

```bash
git fetch origin main
git rebase origin/main
```
