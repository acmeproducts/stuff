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

## Other Permanent Constraints

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
