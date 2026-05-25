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

The Cloudflare relay Worker is strictly read-only. Never modify relay
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
| `tb_gh_pat` | `tb_gh_pat` | GitHub PAT for PB Central write-back |
| `pwa_dismissed` | `pwa_dismissed` | PWA install banner dismissed flag |

Before committing any change that touches localStorage, confirm
every key is spelled identically across all stage files.

Note: `tb_pb_tel_ep` and `tb_pb_tel_tok` were removed in Turn 2.
Do not re-add them. PB write-back uses `tb_gh_pat` via `pbPushCardToRepo`.

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
- Adding a new icon: add it to ICO first, then reference `ICO.name` everywhere

---

## App Constraints

- Single HTML file — no split files, no separate JS files
- Joiner credentials are session-only — never write `inviteDgKey`,
  `inviteCfTid`, or `inviteCfTok` to localStorage as top-level keys
- No auto-mute on compose focus (`composeFocusMute` stays removed)
- New CSS always appended at end of style block — never injected mid-block

---

## PB Team Contract

PB Central is the live authoritative phrasebook store.
The client ingests, renders, searches, filters, and writes back.

### Write-back model
Every user CRUD action fires `pbPushCardToRepo(card, operation)` after
the local operation completes. Operations: `create`, `update`, `read`,
`softDelete`, `hardDelete`, `restore`. Fire-and-forget — never block UI.

### What the client must preserve on ingest
`catalogIds`, `backtranslate`, `confidence`, `tags`, `stableKey`,
`semanticRelationships` (pass-through, max 5 relatedIntents),
`intentId`, `primaryTag`, `parentCategory`

### What the client must not do
- Calculate semantic neighbors at runtime
- Generate tags
- Infer missing structure
- Modify `confidence` or `verdict` outside of explicit user action
- Expose a separate telemetry endpoint in the control panel (removed)

---

## Git Rules

### The only rule: commit and push to main

GitHub Pages serves only from `main`. Nothing is testable until
it is on `main`. There are no feature branches in this repo.

```bash
git add -A
git commit -m "describe what was done"
git push origin main
```

Verify after every push:
```bash
git log --oneline origin/main..main
# Must be empty. If not empty, push again.
```

### Session start

```bash
git fetch origin main
git rebase origin/main
```

### If the push is rejected

```bash
git fetch origin main
git rebase origin/main
git push origin main
```

Never force-push. Never push to a feature branch and expect it to deploy.

---

## Lessons Learned

These rules exist because they were violated and caused real problems.

**1. Always push to main — not a branch.**
GitHub Pages deploys from main only. Pushing to any other branch
produces zero visible result. If you cannot see your changes at the
live URL, check `git log --oneline origin/main..main` — if it is not
empty, you have not pushed to main.

**2. Never run parallel agents.**
Running two agents simultaneously on different files burns context
budget at double speed and causes the session to freeze mid-work with
files in an unknown partial state. Serial execution only.

**3. Version stamps must appear in two places.**
HTML comment on line 2 AND the footer span. Missing either means
the version is inconsistent and hard to audit.

**4. Update the progress tracker after every stage.**
The plan file is the record. If the tracker is not updated, the next
session cannot tell what was completed.

**5. grep is not verification.**
A function existing in the file does not mean it works. A feature
is not verified until a human has tested it on a real device.

**6. One file per response without exception.**
Editing two files in one response, even for a "trivial" change,
has historically led to partial application and hard-to-debug state.

**7. Read the plan before touching anything.**
Every session must read CLAUDE.md, claude-bridge.md, and the current
turn plan before making any edit. Skipping this leads to changes that
contradict the plan or violate constraints.
