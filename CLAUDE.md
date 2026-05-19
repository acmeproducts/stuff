# TalkBridge — Claude Working Rules

## Maturity Chain

```
bridge-pre-base-cc.html → bridge-base-cc.html → bridge-pre-ship-cc.html → bridge-ship-cc.html → bridge-post-ship-cc.html
```

**Never modify** `bridge-pre-base-cc.html`, `bridge-base-cc.html`, `bridge-pre-ship-cc.html`, or `bridge-ship-cc.html` unless the change is a bug fix or fix that must propagate through the chain. Fixes found in later files must be backported to all earlier files that contain the affected code.

---

## STORAGE SCOPE — PERMANENT CONSTRAINT

All files in the maturity chain share the **same localStorage origin** and therefore the **same storage namespace**. Every localStorage key must be identical across every version of every bridge file. Changing a key name in any one file silently breaks credential restore, room history, transcripts, and phrasebook data for anyone who was testing a different version.

**Canonical key table — do not change these:**

| Constant | Key string | What it holds |
|----------|-----------|---------------|
| `tb_dg_key` | `tb_dg_key` | Deepgram API key |
| `tb_cf_tid` | `tb_cf_tid` | Cloudflare TURN credential ID |
| `tb_cf_tok` | `tb_cf_tok` | Cloudflare TURN credential token |
| `RK` | `tb_recent_rooms` | Recent rooms list (JSON array) |
| `TP` | `tb_transcript_` | Per-room transcript prefix |
| `tb_dev` | `tb_dev` | Dev mode flag |
| `PB_CARDS` | `say_cards` | Phrasebook cards |
| `PB_CATS` | `say_catalogs` | Phrasebook catalogs |
| `PB_TAGS_K` | `say_tags` | Phrasebook tag registry |
| `PB_SEEDED` | `pb_bridge_v2` | One-time seed sentinel |

**Rules:**
1. Never rename any key in the table above in any file.
2. Never add a version-specific prefix or suffix to any key.
3. If a new persistent key is needed, add it to this table and apply it identically to every file that needs it.
4. Before committing any change that touches localStorage, grep all five bridge files and confirm the key is spelled identically in each.

**Verification command:**
```bash
grep -h "localStorage\.\(getItem\|setItem\|removeItem\)" bridge-*-cc.html \
  | grep -oP "'[^']+'" | sort | uniq -c | sort -rn
```
Every key that appears in multiple files must have the same count; any key appearing in only one file is a candidate inconsistency to review.

---

## TTS Wiring — Verified State (all four bridge files)

Every TTS touch point has been audited across all files. This table is the ground truth.
Before committing any change that touches transcript rendering, phrasebook bubbles, or `speakText`, re-run the verification below and confirm the table still holds.

| Touch point | Trigger | Language source | Files |
|---|---|---|---|
| Transcript ribbon toggle | `toggleTranscriptTts()` → sets `transcriptTtsOn` flag | — | all 4 |
| Auto-play on partner speech | `addTr`/`patchTr` → `speakText(tr, tL\|\|room.myLang)` | `entry.tgtLang` | all 4 |
| Transcript bubble — left col (source) | `.tr-tts` button, `data-tts-lang=srcLang` | `entry.srcLang` | all 4 |
| Transcript bubble — right col (target) | `.tr-tts` button, `data-tts-lang=tgtLang` | `entry.tgtLang` | all 4 |
| Phrasebook drawer — source | `pbSpeakCard(id,'src',this)` → `speakText(card.source, card.sourceLang)` | `card.sourceLang` | all 4 |
| Phrasebook drawer — target | `pbSpeakCard(id,'tgt',this)` → `speakText(card.target, card.targetLang)` | `card.targetLang` | all 4 |
| Back-translate result | `pbPlayBT(id)` reads `_btCache[id]` → `speakText(bt.resultText, bt.targetLang)` | `card.backtranslate.targetLang` | all 4 |
| Inline panel — source | `pbISpeakI(idx,0)` → `pbSpeakCard(c.id,'src')` | `card.sourceLang` | post-ship only |
| Inline panel — target | `pbISpeakI(idx,1)` → `pbSpeakCard(c.id,'tgt')` | `card.targetLang` | post-ship only |

**Verification commands:**
```bash
# 1. All TTS buttons present and using correct functions
for f in bridge-base-cc.html bridge-pre-ship-cc.html bridge-ship-cc.html bridge-post-ship-cc.html; do
  echo "--- $f ---"
  grep -c "transcript-tts-toggle\|closest.*tr-tts\|pbSpeakCard\|pbPlayBT" "$f"
  grep -c "pb-tts-btn\|pb-bt-tts" "$f"
done

# 2. speakText receives lang from entry, not hardcoded
grep "speakText" bridge-*-cc.html | grep -v "room\.myLang\|card\.\|e\.lang\|tL\|tts-lang\|function speakText"
# Above should return nothing (all speakText calls use dynamic lang)

# 3. data-tts-lang is set from entry.srcLang / entry.tgtLang (not hardcoded)
grep "data-tts-lang" bridge-*-cc.html
# Should show leftLang/rightLang in all four files

# 4. pbSpeakCard uses card.sourceLang / card.targetLang
grep -A4 "^function pbSpeakCard" bridge-*-cc.html
# Should show: lang = side==='src' ? card.sourceLang : card.targetLang
```

**Rules:**
- Never hardcode a lang string in any `speakText()` call.
- Never read `room.myLang` or `room.theirLang` as the TTS lang for phrasebook or transcript bubble buttons — always read from the entry or card.
- `pbSpeakCard` must always derive lang from `card.sourceLang` / `card.targetLang`.
- If a new TTS button is added anywhere, add it to the table above and backport to all applicable files.

---


- No PiP changes
- No auto-mute on chat focus (`composeFocusMute` stays removed)
- No "Ask Again" button
- Every utterance and chat message must produce a visible result
- Joiner credentials are session-only — never write `inviteDgKey`, `inviteCfTid`, or `inviteCfTok` to localStorage
- No out-of-scope features
- `bridge-pre-base-cc.html` is the original source and must never be modified

---

## Git

- Develop on branch `claude/audit-talkbridge-recovery-UHws6`
- Push to `origin main:claude/audit-talkbridge-recovery-UHws6` after every session
- Commit all modified bridge files together in a single commit when propagating fixes
- **At the start of every session**, sync local main with origin/main before doing any work:
  ```bash
  git fetch origin main
  git rebase origin/main
  ```
  PRs may have been merged since the last session. Skipping this causes local main to
  drift behind origin/main, making the stop hook report false unpushed-commit counts
  and risking push conflicts later in the session.
