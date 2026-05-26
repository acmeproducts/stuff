# bridge-turn02-plan.md
**Project:** TalkBridge (bridge)
**Turn:** 02
**Date:** 2026-05-24
**Baseline:** bridge-turn01-post-ship.html (v5.2.4)
**Status:** IN PROGRESS — rejoin stage pending re-derive + Fix D/E

---

## ⚠ Git Model Change — Read First

This turn commits directly to main. No feature branches. No PRs.
Every stage commit goes: `git add -A` → `git commit` → `git push origin main`
Verify after each push: `git log --oneline origin/main..main` → must be empty.
See `claude-bridge.md` git rules section for full procedure.

---

## Instructions for New CC Session

Read these files in this order before touching anything:

1. `CLAUDE.md` — turn model process rules
2. `claude-bridge.md` — do-not-touch list and app constraints
3. This file — complete Turn 2 plan

Do not write any code until all three are read.
One stage per response. Stop after lint passes. Wait for go-ahead.

---

## Build Rules

- Bump and stamp version in HTML comment (line 2) AND footer span at every stage
- No regressions
- Do not touch anything not listed in this plan
- No parallel agents
- If lint fails: stop, report, do not proceed
- **Support file exception:** `manifest.json` is a support file, not a stage file.
  The one-file-per-response rule applies to stage HTML files only. In the base
  PWA section, CC creates `manifest.json` as its own sub-step with its own verify,
  then waits for go-ahead before applying the HTML changes.

---

## Source Files

| File | Role |
|---|---|
| `bridge-turn01-post-ship.html` | Source — never modified |
| `bridge-turn02-pre-base.html` | Copy of turn01 post-ship, frozen |
| `bridge-turn02-base.html` | Base delta applied |
| `bridge-turn02-rejoin.html` | Injected P1 stage — derived from base, see Rejoin Architecture below |
| `bridge-turn02-pre-ship.html` | Pre-ship delta applied (copies from rejoin, not base) |
| `bridge-turn02-ship.html` | Ship delta applied |
| `bridge-turn02-post-ship.html` | Validated — becomes Turn 3 pre-base |

---

## Progress Tracker

| Stage | File | Version | Lint | Committed | Go-ahead |
|---|---|---|---|---|---|
| pre-base | `bridge-turn02-pre-base.html` | v5.3.0 | n/a | ✅ | n/a |
| base | `bridge-turn02-base.html` | v5.3.1 | ✅ | ✅ (5th — save roomId) | ✅ |
| rejoin (P1 fix) | `bridge-turn02-rejoin.html` | v5.3.1a | ☐ | ☐ re-derive needed | ☐ |
| pre-ship | `bridge-turn02-pre-ship.html` | v5.3.2 | ☐ | ☐ | ☐ |
| ship | `bridge-turn02-ship.html` | v5.3.3 | ☐ | ☐ | ☐ |
| post-ship | `bridge-turn02-post-ship.html` | v5.3.4 | ☐ | ☐ | ☐ |

---

## Stage: pre-base

Copy `bridge-turn01-post-ship.html` to `bridge-turn02-pre-base.html`.
Version stamp only: v5.3.0 in HTML comment line 2 and footer span.
No other changes. Frozen.

---

## Stage: base — v5.3.1

Copy `bridge-turn02-pre-base.html` to `bridge-turn02-base.html` then apply:

---

### REMOVE — Telemetry endpoint from control panel

The telemetry endpoint and token fields in the keys/control panel are
removed. Write-back to PB Central uses the existing GitHub PAT
(`tb_gh_pat`) via `pbPushCardToRepo` — no separate endpoint needed.

Remove from HTML:
- Telemetry endpoint input field and label
- Telemetry token input field and label
- Any surrounding section wrapper if it becomes empty

Remove from JS:
- `_PB_TEL_ENDPOINT` and `_PB_TEL_TOKEN` variable declarations
- `saveTelCreds()` function
- `_initTelCreds()` function
- `_telPost()` function
- Any call to `_telPost()` in `hangUp()` or elsewhere
- `tb_pb_tel_ep` and `tb_pb_tel_tok` localStorage reads/writes

Do NOT remove `tb_gh_pat` or `pbPushCardToRepo` — those stay.

---

### B1 — Tag search suggestions hard to read

In `pbNcTagSugg()` and `pbTagSugg()` suggestion rows:
- Font size: 14px
- Background: fully opaque `#fdfaf7`
- Text color: `#1a1714`
- Padding: `8px 12px` per row

---

### B2/B11 — Clarify field: Enter saves, opens new field, refocuses

In existing card clarify panel — add `onkeydown="pbClarifyKey(event,'ID')"` to
clarify input and give it stable id `pbclar-inp-{id}`.

Change clarify input from `<input type="text">` to `<textarea rows="1">`
so Shift+Enter inserts a line break naturally.

```js
function pbClarifyKey(e, id) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    var inp = e.target;
    var text = (inp.value || '').trim();
    if (!text) return;
    var card = pbGetCardById(id); if (!card) return;
    card.clarifyChain = card.clarifyChain || [];
    card.clarifyChain.push({text:text, ts:pbNow(), by:'Me'});
    pbSaveCard(card);
    pbPushCardToRepo(card, 'update');
    inp.value = '';
    pbReRenderCardPanel('clarify', id);
    setTimeout(function() {
      var el = document.getElementById('pbclar-inp-' + id);
      if (el) el.focus();
    }, 40);
  }
}
```

In Add Phrase modal (`pbnc-clarify`): same — Enter appends to clarify chain,
clears field, refocuses. Change to textarea rows="1".

---

### B3 — PB icon on transcript ribbon not working

Verify `onclick="pbOpenOverlayClean()"` is on the transcript ribbon PB button.
If missing or wrong, fix it. Do not touch anything else in the ribbon.

---

### B4 — PB icon still in search drawer header

If `pbSearchDrawerHtml()` still contains the book icon button, remove it.
Remaining header: `[search input] [pair badge] [X close]` only.

---

### ICO.tts — add to ICO object

Add `tts` to the ICO object in base (one source of truth for TTS icon):

```js
tts: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>',
```

Add alongside `ICO.save` and `ICO.bt` that were added in Turn 01.
Reference as `ICO.tts` everywhere — no inline TTS SVG strings.

---

### pbPushCardToRepo — extend for all CRUD operations

The existing `pbPushCardToRepo(card)` handles card creates. Extend it to
accept an `operation` parameter and include it in the commit message.

```js
async function pbPushCardToRepo(card, operation) {
  operation = operation || 'update';
  var pat = (localStorage.getItem('tb_gh_pat') || '').trim();
  if (!pat) return;
  // ... existing GitHub API logic unchanged ...
  // Update commit message to include operation:
  // message: 'TalkBridge: ' + operation + ' ' + card.id
}
```

Wire to every card mutation — all fire-and-forget after local op completes:

- `pbSaveNewCard()` after `pbUpsert(card)`: `pbPushCardToRepo(card, 'create')`
- `pbCommitSrcEdit()` after `pbSaveCard(card)`: `pbPushCardToRepo(card, 'update')`
- `pbSetVerdict()` after `pbSaveCard(card)`: `pbPushCardToRepo(card, 'update')`
- `pbRemoveTag()` after `pbSaveCard(card)`: `pbPushCardToRepo(card, 'update')`
- `pbSoftDelete()` after `pbSaveCard(card)`: `pbPushCardToRepo(card, 'softDelete')`
- `pbRestoreCard()` after `pbSaveCard(card)`: `pbPushCardToRepo(card, 'restore')`
- `pbISend()` after `sendChat()`: `pbPushCardToRepo(card, 'read')`

Note: `pbCommitTgtEdit` was removed from this list — that function does not
exist in Turn 01 code. Target edits flow through auto-translate output.

---

### PWA — add to home screen

No offline capability. No service worker caching. Add to home screen only.

#### PWA Sub-step 1 — Create manifest.json (separate step, own go-ahead)

Create `manifest.json` in repo root. This is a support file — the one-file-per-response
rule applies to stage HTML files only. Create manifest.json, verify, commit, push,
stop and report. Wait for go-ahead before proceeding to PWA Sub-step 2.

**Icon SVG spec:**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">
  <rect width="192" height="192" fill="#ffffff"/>
  <circle cx="96" cy="96" r="80" fill="none" stroke="#000000" stroke-width="4"/>
  <circle cx="96" cy="96" r="24" fill="#f97316"/>
</svg>
```
White background. Black circle outline, stroke-width 4, no fill. Orange dot center (#f97316).

**Generate PNG data URLs before writing manifest.json:**

```bash
python3 -c "
import base64, struct, zlib

def make_png(size):
    s = size / 192
    # Render pixel by pixel
    pixels = []
    for y in range(size):
        row = []
        for x in range(size):
            cx, cy = x - size/2, y - size/2
            r = (cx**2 + cy**2)**0.5
            outer_r, inner_r = 80*s, 24*s
            stroke = 4*s/2
            if r <= inner_r:
                row.extend([249, 115, 22, 255])
            elif abs(r - 80*s) <= stroke:
                row.extend([0, 0, 0, 255])
            else:
                row.extend([255, 255, 255, 255])
        pixels.append(bytes(row))
    # Build PNG
    def chunk(name, data):
        c = name + data
        return struct.pack('>I', len(data)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    idat_raw = b''.join(b'\x00' + r for r in pixels)
    png = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', zlib.compress(idat_raw)) + chunk(b'IEND', b'')
    return base64.b64encode(png).decode()

b192 = make_png(192)
b512 = make_png(512)
print('192:', b192[:40]+'...')
print('512:', b512[:40]+'...')
open('/tmp/icon192.b64','w').write(b192)
open('/tmp/icon512.b64','w').write(b512)
print('Written to /tmp/icon192.b64 and /tmp/icon512.b64')
"
```

If Python Pillow is available, use it instead for cleaner anti-aliasing:
```bash
python3 -c "
try:
    from PIL import Image, ImageDraw
    import base64, io
    results = {}
    for sz in [192, 512]:
        img = Image.new('RGBA', (sz,sz), (255,255,255,255))
        d = ImageDraw.Draw(img)
        s = sz/192
        d.ellipse([(16*s,16*s),(176*s,176*s)], outline=(0,0,0,255), width=max(1,int(4*s)))
        d.ellipse([(72*s,72*s),(120*s,120*s)], fill=(249,115,22,255))
        buf = io.BytesIO()
        img.save(buf, 'PNG')
        results[sz] = base64.b64encode(buf.getvalue()).decode()
    open('/tmp/icon192.b64','w').write(results[192])
    open('/tmp/icon512.b64','w').write(results[512])
    print('Done — written to /tmp/icon192.b64 and /tmp/icon512.b64')
except ImportError:
    print('Pillow not available, use pure-python approach above')
"
```

**manifest.json content (fill in PNG data URLs from above):**
```json
{
  "name": "TalkBridge",
  "short_name": "TB",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#ffffff",
  "start_url": ".",
  "icons": [
    {
      "src": "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20192%20192%27%3E%3Crect%20width%3D%27192%27%20height%3D%27192%27%20fill%3D%27%23fff%27/%3E%3Ccircle%20cx%3D%2796%27%20cy%3D%2796%27%20r%3D%2780%27%20fill%3D%27none%27%20stroke%3D%27%23000%27%20stroke-width%3D%274%27/%3E%3Ccircle%20cx%3D%2796%27%20cy%3D%2796%27%20r%3D%2724%27%20fill%3D%27%23f97316%27/%3E%3C/svg%3E",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "data:image/png;base64,REPLACE_WITH_192_B64",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "data:image/png;base64,REPLACE_WITH_512_B64",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Replace `REPLACE_WITH_192_B64` with contents of `/tmp/icon192.b64`.
Replace `REPLACE_WITH_512_B64` with contents of `/tmp/icon512.b64`.

**Verify manifest.json:**
```bash
python3 -m json.tool manifest.json && echo "VALID"
```

**Commit and push manifest.json only:**
```bash
git add manifest.json
git commit -m "bridge Turn 02 base — manifest.json (PWA sub-step 1)"
git push origin main
git log --oneline origin/main..main  # must be empty
```

**Stop. Report. Wait for go-ahead before PWA Sub-step 2.**

---

#### PWA Sub-step 2 — HTML changes (part of base HTML stage commit)

Add to `<head>`:
```html
<link rel="manifest" href="/stuff/manifest.json">
<link rel="apple-touch-icon" sizes="192x192" href="data:image/png;base64,SAME_192_B64_AS_MANIFEST">
```

Add to JS:
```js
var _pwaPrompt = null;
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  if (localStorage.getItem('pwa_dismissed')) return;
  _pwaPrompt = e;
  _showPwaBanner();
});

function _showPwaBanner() {
  if (!_pwaPrompt) return;
  var b = document.createElement('div');
  b.id = 'pwa-banner';
  b.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#fff;'
    + 'border-top:1px solid #e0dbd6;padding:12px 16px;display:flex;'
    + 'align-items:center;gap:12px;z-index:9999;font-family:"DM Sans",sans-serif;';
  b.innerHTML = '<svg width="20" height="20" viewBox="0 0 192 192">'
    + '<rect width="192" height="192" fill="#fff"/>'
    + '<circle cx="96" cy="96" r="80" fill="none" stroke="#000" stroke-width="4"/>'
    + '<circle cx="96" cy="96" r="24" fill="#f97316"/>'
    + '</svg>'
    + '<span style="flex:1;font-size:13px;color:#1a1714;">Add TalkBridge to home screen</span>'
    + '<button onclick="pwaInstall()" style="background:#000;color:#fff;border:none;'
    + 'border-radius:6px;padding:6px 14px;font-size:13px;cursor:pointer;'
    + 'font-family:inherit;">Install</button>'
    + '<button onclick="pwaDismiss()" style="background:none;border:none;'
    + 'font-size:18px;cursor:pointer;color:#9a9592;padding:4px;">×</button>';
  document.body.appendChild(b);
}

function pwaInstall() {
  if (!_pwaPrompt) return;
  _pwaPrompt.prompt();
  _pwaPrompt.userChoice.then(function() {
    _pwaPrompt = null;
    var b = document.getElementById('pwa-banner');
    if (b) b.remove();
  });
}

function pwaDismiss() {
  localStorage.setItem('pwa_dismissed', '1');
  var b = document.getElementById('pwa-banner');
  if (b) b.remove();
}
```

`pwa_dismissed` is a canonical storage key — see claude-bridge.md table.

---

### Base verification

```bash
python3 -c "
import re; txt=open('bridge-turn02-base.html').read()
m=re.search(r'<script>(.*?)</script>',txt,re.DOTALL)
open('/tmp/l.js','w').write(m.group(1))"
node --check /tmp/l.js && echo "PASS" || echo "FAIL"

# Telemetry removed
grep -c "_telPost\|tb_pb_tel_ep\|saveTelCreds\|_PB_TEL_ENDPOINT" bridge-turn02-base.html
# expected: 0

# CRUD wired
grep -c "pbPushCardToRepo" bridge-turn02-base.html
# expected: > 6

# ICO.tts present
grep -c "ICO\.tts\|tts:" bridge-turn02-base.html
# expected: > 0

# PWA banner present
grep -c "pwa-banner\|beforeinstallprompt\|pwaInstall\|pwaDismiss" bridge-turn02-base.html
# expected: > 0

# manifest link present
grep -c "manifest.json" bridge-turn02-base.html
# expected: 1
```

### Base post-development update

**Commit history (base has been updated 5 times):**

| # | What | Why |
|---|---|---|
| 1st | Full base delta (all features) | Initial build |
| 2nd | Fix B1 (# prefix), Fix B2 (wrong field names author/timestamp), Fix B4 (missed pb-ip-hdr) | Device test regressions from 1st attempt |
| 3rd | Fix ICO.speaker self-reference crash | `speaker:ICO.tts` inside ICO literal crashed on load — blocked credential restore |
| 4th | Remove `window.close()` from `showThankYou`; remove 5-second countdown from `showHostLeftCountdown` | Auto-close prevented Rejoin button from being used on device |
| 5th | Add `roomId` to `lastSessionContext`; set in `createRoom()` and `joinerProceed()` | Enables Fix E (creator rejoin reconnects to original room instead of new uid) |

**Feature summary (all commits):**
- Telemetry removal (HTML + 4 JS functions + 2 call sites)
- B1: tag suggestions — fully opaque, no # prefix
- B2/B11: clarify textarea + Enter handler — correct field names (author/timestamp)
- B3: verified — pbOpenOverlayClean already correct
- B4: book icon removed from BOTH pb-ip-hdr AND pbSearchDrawerHtml
- ICO.tts in ICO object; ICO.speaker assigned after ICO closes; PB_ICON_TTS removed
- pbPushCardToRepo with operation param; CRUD wired (9 call sites)
- PWA manifest link + apple-touch-icon + JS banner
- `lastSessionContext.roomId` saved on call entry (both roles)

---

## Join / Rejoin Architecture — Design Principle

**One room. Two doors. Two keys.**

- **Room** = a stable `room.id` (one uid, never changes between sessions for the same call)
- **Door 1 / Key 1** = the creator — always knows their own room (`lastSessionContext.roomId`)
- **Door 2 / Key 2** = the joiner — holds the invite link (`_pendingJoin.r` = same `room.id`)
- Either party enters or exits without invalidating the other's key
- Re-entry is symmetric and order-independent

**WebRTC negotiation model (compatible with two-door design):**
- Creator always sends offers (`onnegotiationneeded` wired at `setupPC()`, line ~3180)
- Joiner always sends answers (empty handler; responds to offer in `handleSig`)
- Both orderings of arrival work: creator-first sends offer immediately; joiner-first waits and receives offer when creator connects
- Relay resends `savedOffer` when the other side sends `hello` (line ~3002)

**What was broken (and the fix lineage — see below):**
Before the rejoin fixes, the creator's `rejoinCall()` sent them to the lobby and `createRoom()` which called `room.id=uid()` — a brand new room every time. The joiner's key still pointed to the old room. Two different relay sessions. No signaling possible. All rejoin cases failed regardless of order.

**Failure case analysis (code-traced):**

| Case | Who's on goodbye screen | Room match? | Pre-fix outcome |
|---|---|---|---|
| Joiner hangs up, creator rejoins first | Creator manually leaves → both on goodbye | Creator=new uid, Joiner=old id → NO | (c) or (d) |
| Joiner hangs up, joiner rejoins first | Creator stays in solo call (relay open, old room.id) | Same room, but no offer re-trigger | (c) — relay connects, no WebRTC |
| Creator hangs up, creator rejoins first | Both on goodbye | Creator=new uid, Joiner=old id → NO | (c) or (d) |
| Creator hangs up, joiner rejoins first | Both on goodbye | Creator=new uid, Joiner=old id → NO | (c) or (d) |

Note: when joiner hangs up, creator does NOT go to goodbye screen. Creator receives `{type:'hangup'}`, resets pc/remoteStream, shows solo-banner, stays on relay at original `room.id`.

---

## Stage: rejoin (P1 fix) — v5.3.1a

Injected between base and pre-ship. Pre-ship copies from this file, not base.

Copy `bridge-turn02-base.html` to `bridge-turn02-rejoin.html`, stamp v5.3.1a,
then apply all fixes below.

---

### Rejoin Fix Lineage

All fixes listed here must be re-applied every time rejoin is re-derived from base.
Base changes do not automatically propagate — re-derive and re-apply.

#### Fix A — `showHostLeftCountdown()`: symmetric teardown

**Root cause:** `showHostLeftCountdown()` (joiner's host-left teardown) calls `teardownSession()` which closes `pc` and nulls `videoStream` but never clears `remoteStream` or `rv.srcObject`. Creator's `cleanUp()` calls `resetRemoteMediaState()` which does clear both. On rejoin the joiner's `handleSig` offer path called `setupPC()` with stale `remoteStream` — new tracks added to old stream, `rv.srcObject` unchanged, iOS/Android did not re-render.

Add `resetRemoteMediaState()` after `teardownSession(...)` in `showHostLeftCountdown()`:
```js
teardownSession('to_host_left_countdown','host_ended');
resetRemoteMediaState();   // mirrors cleanUp() — makes joiner teardown symmetric
room.id=null;room.role=null;
```

#### Fix B — `handleSig` offer path: defensive reset

Belt-and-suspenders: when `pc` is null before `setupPC()`, explicitly null `remoteStream` and `rv.srcObject`:
```js
if(!pc){if(remoteStream)remoteStream.getTracks().forEach(function(t){t.onunmute=null;t.onmute=null;t.onended=null;});remoteStream=null;var _rv=$('remote-video');if(_rv)_rv.srcObject=null;await setupPC();}
```

#### Fix C — `rejoinCall()` joiner path: mirror share-link flow

**Root cause:** Old joiner path manually called `setCallPhase('prejoin')` and showed `joiner-landing` without re-initializing `inviteDgKey`, `inviteCfTid/Tok`, `_pendingJoin`, or the landing UI. The share-link revisit worked because `handleHash(p)` does all of that.

Replace joiner branch in `rejoinCall()`:
```js
function rejoinCall(){
  $('thankyou-page').classList.remove('show');
  var role=lastSessionContext.role||(_pendingJoin?'joiner':'creator');
  if(role==='joiner'){
    var p=_pendingJoin||lastSessionContext.pendingJoinSnapshot;
    handleHash(p);   // mirrors share-link: resets credentials, _pendingJoin, UI, shows landing
  }else{
    // Fix E below handles creator path
  }
}
```

#### Fix D — `handleRelay` hangup handler: re-trigger offer immediately

**Root cause:** When joiner hangs up, creator closes `pc` (via hangup handler) and shows solo-banner. `savedOffer` is cleared. The relay stays open. When joiner rejoins and sends `hello`, creator has no `pc` and no `savedOffer` to resend (line ~3002). The `onopen` trigger for `setupPC()` (line ~2979) only fires on a new relay connection — not while relay is already open.

In the creator-side hangup handler in `handleRelay()`, after `pc.close()` and before `armConnectTimeout()`:
```js
// Re-arm offer so creator is ready when joiner reconnects
if(videoStream)(async()=>{await setupPC();})();
```
`setupPC()` creates a new `pc`, `addTrack()` triggers `onnegotiationneeded`, a fresh offer is generated and saved as `savedOffer`. When joiner's `hello` arrives, the existing resend path (line ~3002) fires it automatically.

#### Fix E — `rejoinCall()` creator path: reconnect to saved room

**Root cause:** Creator's rejoin sent them to lobby → `createRoom()` → `room.id=uid()`. New room, joiner's key invalid. Fix now in base (5th commit): `lastSessionContext.roomId` saved in both `createRoom()` and `joinerProceed()`.

Replace creator branch in `rejoinCall()`:
```js
  }else{
    var savedId=lastSessionContext.roomId;
    if(savedId){
      room.id=savedId;room.role='creator';
      room.myLang=lastSessionContext.myLang;room.theirLang=lastSessionContext.theirLang;room.name=lastSessionContext.roomName;
      $('thankyou-page').classList.remove('show');
      (async function(){
        try{
          videoStream=await navigator.mediaDevices.getUserMedia({video:true,audio:getMicConstraints()});
          var lv=$('local-video');if(lv)lv.srcObject=videoStream;
          enterCall();
        }catch(e){
          setCallPhase('idle','rejoin_creator_cam_fail');
          $('lobby').classList.remove('hidden');setLS(LS.setup);
        }
      })();
    }else{
      setCallPhase('idle','rejoin_creator');
      $('lobby').classList.remove('hidden');setLS(LS.setup);
    }
  }
```

With Fix E, creator reconnects to the original relay session. With Fix D, creator already has a fresh `savedOffer` ready. When joiner reconnects, `hello` triggers resend → joiner answers → WebRTC established. Order-independent.

---

### Rejoin post-development update (lineage)

| Attempt | What changed | Device result |
|---|---|---|
| 1st (Fix A + Fix B) | Symmetric teardown + defensive reset | Still broken — rejoin button didn't re-initialize state |
| 2nd (Fix C added) | rejoinCall → handleHash for joiner | Still broken — window auto-closed before user could click |
| 3rd (auto-close removed from base, re-derive) | window.close() + countdown timer removed from showThankYou + showHostLeftCountdown | Goodbye screen stays open — rejoin button accessible. Root cause of room mismatch identified |
| 4th (Fix D + Fix E — PENDING) | Creator reconnects to saved room; offer re-triggered on hangup | PENDING device test |

Current state: base has been updated (5th commit — roomId saved). Rejoin must be re-derived from base and Fix A/B/C/D/E all applied.

### Rejoin verification

```bash
# Extract and lint
node -e "const fs=require('fs');const html=fs.readFileSync('bridge-turn02-rejoin.html','utf8');const m=html.match(/<script>([\s\S]*?)<\/script>/g);const js=m.map(s=>s.replace(/<\/?script[^>]*>/g,'')).join('\n');fs.writeFileSync('/tmp/l.js',js);"
node --check /tmp/l.js && echo "PASS"

grep -c "window.close" bridge-turn02-rejoin.html           # must be 0
grep -c "Closing in" bridge-turn02-rejoin.html             # must be 0
grep -n "resetRemoteMediaState" bridge-turn02-rejoin.html  # Fix A: must appear in showHostLeftCountdown
grep -n "handleHash(p)" bridge-turn02-rejoin.html          # Fix C: rejoinCall joiner path
grep -n "lastSessionContext.roomId" bridge-turn02-rejoin.html  # Fix E: creator uses savedId
grep -n "await setupPC" bridge-turn02-rejoin.html          # Fix D: re-arm in hangup handler
grep -n "v5.3.1a" bridge-turn02-rejoin.html               # version in 2 places
```

Manual device test — all 4 cases must reach outcome (a) = both see each other:
1. Joiner hangs up → creator stays solo → joiner clicks Rejoin first → both connected
2. Joiner hangs up → creator also leaves → creator clicks Rejoin first → both connected
3. Creator hangs up → joiner on goodbye → joiner clicks Rejoin first → both connected
4. Creator hangs up → joiner on goodbye → creator clicks Rejoin first → both connected

---

## Stage: pre-ship — v5.3.2

Copy `bridge-turn02-rejoin.html` to `bridge-turn02-pre-ship.html` then apply:

---

### B5/B13 — Source edit: Enter + inline Enter/Cancel buttons trigger update

Blur, Enter key, and Enter button all trigger `pbCommitSrcEdit(id)`.
Cancel button reverts without saving.

Add `onfocus="pbSrcFocus('ID')"` and `onkeydown="pbSrcKeydown(event,'ID')"` 
to source contenteditable div in `pbBubbleHtml`.

After source div inject hidden buttons:
```js
+'<div class="pb-src-edit-acts" id="pbsrcacts-'+id+'" style="display:none;gap:6px;margin-top:4px;">'
+'<button onclick="pbCommitSrcEdit(\''+id+'\')" '
+'style="background:#2e8b8b;color:#fff;border:none;border-radius:6px;'
+'padding:3px 10px;font-size:12px;cursor:pointer;" title="Save">✓</button>'
+'<button onclick="pbCancelSrcEdit(\''+id+'\')" '
+'style="background:none;border:1px solid #e0dbd6;border-radius:6px;'
+'padding:3px 10px;font-size:12px;cursor:pointer;color:#5a5552;" title="Cancel">✕</button>'
+'</div>'
```

```js
function pbSrcFocus(id) {
  var acts = document.getElementById('pbsrcacts-' + id);
  if (acts) acts.style.display = 'flex';
  var el = document.getElementById('pbsrc-' + id);
  if (el) el.dataset.orig = el.textContent;
}
function pbSrcKeydown(e, id) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); pbCommitSrcEdit(id); }
  if (e.key === 'Escape') { pbCancelSrcEdit(id); }
}
function pbCancelSrcEdit(id) {
  var el = document.getElementById('pbsrc-' + id);
  if (el && el.dataset.orig !== undefined) el.textContent = el.dataset.orig;
  var acts = document.getElementById('pbsrcacts-' + id);
  if (acts) acts.style.display = 'none';
}
```

---

### B6 — Source edit does not reset verdict or remove ✓Verified tag

In `pbCommitSrcEdit(id)`, read the full function first. Find the call to
`pbSaveCard(card)` that saves the edited source. Immediately after that line
and before any `translateWithRetry` or `pbRunBT` call, insert:

```js
// B6 — reset verdict and ✓Verified tag on source edit
card.backtranslate = card.backtranslate || {};
card.backtranslate.verdict = '';
card.backtranslate.updatedAt = pbNow();
card.tags = (card.tags || []).filter(function(t) { return t !== '✓Verified'; });
card.clarifyChain = card.clarifyChain || [];
card.clarifyChain.push({text:'Source edited — verdict reset', ts:pbNow(), by:'system'});
pbSaveCard(card);
pbReRenderCardPanel('bt', id);
pbReRenderCardPanel('tags', id);
pbReRenderBubbleHeader(id);
```

Do not insert before the initial `pbSaveCard` — the new source must be saved first.
Do not insert after the `pbRunBT` call — the verdict must be cleared before BT runs.
If unsure of the exact location, quote the three surrounding lines in your report
before inserting and wait for confirmation.

---

### B7 — Removing ✓Verified tag does not reset verdict

In `pbRemoveTag(id, tag)`, add `pbReRenderBubbleHeader(id)` to the
✓Verified intercept:

```js
if (tag === '✓Verified' && card.backtranslate) {
  card.backtranslate.verdict = '';
  card.clarifyChain = card.clarifyChain || [];
  card.clarifyChain.push({text:'Back-translate removed', ts:pbNow(), by:'Me'});
  pbSaveCard(card);
  pbPushCardToRepo(card, 'update');
  pbReRenderCardPanel('bt', id);
  pbReRenderCardPanel('clarify', id);
  pbReRenderBubbleHeader(id);
} else {
  pbSaveCard(card);
  pbPushCardToRepo(card, 'update');
}
pbReRenderCardPanel('tags', id);
```

---

### B8 — No clarify entries when BT confirmed or cleared

In `pbSetVerdict(id, val)`, push to clarifyChain and re-render:

```js
var msg = val==='good' ? 'Back-translate verified'
        : val==='flag' ? 'Back-translate flagged'
        : 'Back-translate removed';
card.clarifyChain = card.clarifyChain || [];
card.clarifyChain.push({text:msg, ts:pbNow(), by:'Me'});
pbSaveCard(card);
pbPushCardToRepo(card, 'update');
pbReRenderCardPanel('clarify', id);
```

---

### B10 — PB search rows: send AND edit buttons

Add `ICO.edit` to ICO object:
```js
edit: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
```

Add `pbIEditCard`:
```js
function pbIEditCard(idx) {
  var card = _pbICards[idx]; if (!card) return;
  pbIClose(); pbOpenOverlay();
  setTimeout(function() {
    var el = document.getElementById('pbb-' + card.id);
    if (el) el.scrollIntoView({behavior:'smooth', block:'center'});
  }, 100);
}
```

---

### B12 — PB overlay X clears search, stays in PB

Add `pbOvClearSearch`. Update X button onclick to call it:

```js
function pbOvClearSearch() {
  var inp = document.getElementById('pb-ov-search');
  if (inp) { inp.value = ''; inp.focus(); }
  pbRenderOverlay();
}
```

---

### B14/B10a — Row layout: TTS + send + edit left-justified under phrase

Remove all "tap to use" spans from `pbIRowHtml`, `pbOvRowHtml`,
and compose strip /search rows.

New layout per phrase side:
```
Line 1: [phrase text — tappable, existing pbISideClick]
Line 2: [TTS]  [Send ›]  [Edit ✎]   ← left-justified
```

CSS additions:
```css
.pb-iside{display:flex;flex-direction:column;flex:1;padding:8px 10px;cursor:pointer;}
.pb-iside-txt{font-size:14px;color:#1a1714;line-height:1.35;}
.pb-iside-acts{display:flex;align-items:center;gap:4px;margin-top:4px;}
.pb-irow-edit{background:none;border:none;cursor:pointer;color:#6e6862;padding:4px;
  flex-shrink:0;line-height:0;}
.pb-irow-edit:hover{color:var(--teal);}
.pb-irow-edit svg,.pb-irow-edit path{pointer-events:none;}
```

Rewrite `pbIRowHtml` per side helper (use `ICO.tts` — not TTS_SVG):
```js
function pbIRowHtml(card, idx) {
  function side(text, sk, si) {
    return '<div class="pb-iside" onclick="pbISideClick('+idx+',\''+sk+'\')">'
      +'<div class="pb-iside-txt">'+pbEsc(text)+'</div>'
      +'<div class="pb-iside-acts">'
      +'<button class="pb-irow-tts" onclick="event.stopPropagation();'
      +'pbISpeakI('+idx+','+si+')" tabindex="-1" title="Speak">'+ICO.tts+'</button>'
      +'<button class="pb-irow-send" onclick="event.stopPropagation();'
      +'pbISend('+idx+',\''+sk+'\')" tabindex="-1" title="Send">'+ICO.use+'</button>'
      +'<button class="pb-irow-edit" onclick="event.stopPropagation();'
      +'pbIEditCard('+idx+')" tabindex="-1" title="Edit">'+ICO.edit+'</button>'
      +'</div></div>';
  }
  return '<div class="pb-irow">'
    +side(card.source||'','src',0)
    +'<div class="pb-idiv"></div>'
    +side(card.target||'','tgt',1)
    +'</div>';
}
```

Apply same pattern to `pbOvRowHtml`.

---

### B15 — BT failure: show message not target text

In `pbNcRunBt()` catch block:
```js
.catch(function() {
  if (br) br.textContent = 'Translation unavailable — retry later';
});
```

In `pbRunBT(id)` error/empty path: same message. Never show target text
as a fallback in the BT result field.

---

### TM Tier 2 — fuzzy match suggestion

Fires only when Tier 1 (exact match) returns null.
Uses Levenshtein distance ≤ 2 (handles typos and minor variations).
Shows cached translation as a greyed suggestion — user taps to accept
or ignores it and normal translation runs.
Applies to both speech and chat channels.

**Signal character:** Use Unicode private-use character U+E001 (``) as
the fuzzy-hit prefix. This is unambiguous — no real translation will ever
start with this character. Do NOT use `~` (tilde) as the signal.

Add Levenshtein helper:
```js
function _levenshtein(a, b) {
  var m=a.length, n=b.length;
  var dp=[];
  for(var i=0;i<=m;i++){dp[i]=[i];for(var j=1;j<=n;j++)dp[i][j]=0;}
  for(var j=0;j<=n;j++)dp[0][j]=j;
  for(var i=1;i<=m;i++)for(var j=1;j<=n;j++){
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  }
  return dp[m][n];
}
```

Add `_tmFuzzy(text, srcLang, tgtLang)`:
```js
function _tmFuzzy(text, srcLang, tgtLang) {
  var pair = srcLang+'-'+tgtLang;
  var idx = _tmIndex[pair]; if (!idx) return null;
  var norm = _tmNorm(text);
  var best = null; var bestDist = 3;
  Object.keys(idx).forEach(function(key) {
    var d = _levenshtein(norm, key);
    if (d < bestDist && d <= 2 && idx[key].confidence >= 0.85) {
      bestDist = d; best = idx[key];
    }
  });
  return best ? {tgt: best.tgt, dist: bestDist} : null;
}
```

In `translateWithRetry`, after the Tier 1 exact check and before the
API fetch, add Tier 2:
```js
var fuzzyHit = _tmFuzzy(text, from, to);
if (fuzzyHit !== null) {
  log('tm_fuzzy_hit', {from:from, to:to, dist:fuzzyHit.dist, text:text.slice(0,40)});
  return Promise.resolve('' + fuzzyHit.tgt);
}
```

**Render-time strip (both ends) — add to `renderMd` in the same block that
handles `[PB]` prefix from Turn 01 item G:**
```js
if (text.charAt(0) === '') {
  return '<span class="tm-fuzzy-ind" title="Fuzzy match from cache">~</span>'
    + renderMd(text.slice(1));
}
```

Apply same detection in transcript render path wherever `patchTr` output
is displayed to the user.

Add CSS:
```css
.tm-fuzzy-ind{color:#9a9592;font-size:11px;margin-right:2px;}
```

The `` prefix also flows through `relaySend` to the other participant.
The strip in `renderMd` handles display on both ends automatically since
both sides use the same render function.

---

### Entry Point 2 — /search + Return carries query into PB overlay

Add `pbOpenFromSlashSearch`:
```js
function pbOpenFromSlashSearch(query) {
  pbOpenOverlay();
  var inp = document.getElementById('pb-ov-search');
  if (inp && query) { inp.value = query; pbRenderOverlay(query); }
}
```

Update /search Enter handler to call `pbOpenFromSlashSearch(query)`
instead of `pbOpenOverlay()`.

---

### Pre-ship verification

```bash
python3 -c "
import re; txt=open('bridge-turn02-pre-ship.html').read()
m=re.search(r'<script>(.*?)</script>',txt,re.DOTALL)
open('/tmp/l.js','w').write(m.group(1))"
node --check /tmp/l.js && echo "PASS" || echo "FAIL"

grep -c "pbIEditCard\|pb-irow-edit\|ICO\.edit" bridge-turn02-pre-ship.html
grep -c "function pbOvClearSearch" bridge-turn02-pre-ship.html
grep -c "tap to use" bridge-turn02-pre-ship.html
# expected: 0
grep -c "function _tmFuzzy\|_levenshtein" bridge-turn02-pre-ship.html
grep -c "Translation unavailable" bridge-turn02-pre-ship.html
grep -c "pbOpenFromSlashSearch" bridge-turn02-pre-ship.html
grep -c "ICO\.tts" bridge-turn02-pre-ship.html
grep -c "TTS_SVG" bridge-turn02-pre-ship.html
# expected: 0
grep -c "uE001\|\\\\uE001" bridge-turn02-pre-ship.html
grep -c "tm-fuzzy-ind" bridge-turn02-pre-ship.html
```

### Pre-ship post-development update
- Implemented as planned:
- Additions:
- Removals/deferrals:
- Bugs found:

---

## Stage: ship — v5.3.3

Copy `bridge-turn02-pre-ship.html` to `bridge-turn02-ship.html` then apply:

---

### B9 — Partial /search + tap PB icon carries query into overlay

PB icon in transcript ribbon checks for active /search state:

```js
function pbOpenFromRibbon() {
  var ta = $('chat-input');
  var val = (ta && ta.value || '').trim();
  var query = (val.startsWith('/') && !val.startsWith('//'))
    ? val.slice(1).trim() : '';
  if (query) { pbOpenFromSlashSearch(query); }
  else { pbOpenOverlayClean(); }
}
```

Update PB icon button in transcript ribbon:
`onclick="pbOpenFromRibbon()"` — replaces `onclick="pbOpenOverlayClean()"`

---

### Hard delete — wire to PB Central

In `pbHardDelete(id)` after local removal:
```js
pbPushCardToRepo(card, 'hardDelete');
```

---

### talkbridge-status.html update

Update version headers for all Turn 2 stages. Add rows:
- Telemetry endpoint removed (base)
- pbPushCardToRepo CRUD wired (base)
- PWA add-to-home-screen (base)
- TM Tier 2 fuzzy match suggestion (pre-ship)
- PB entry points 1/2/3 (pre-ship/ship)

---

### Ship verification

```bash
python3 -c "
import re; txt=open('bridge-turn02-ship.html').read()
m=re.search(r'<script>(.*?)</script>',txt,re.DOTALL)
open('/tmp/l.js','w').write(m.group(1))"
node --check /tmp/l.js && echo "PASS" || echo "FAIL"

grep -c "function pbOpenFromRibbon" bridge-turn02-ship.html
grep "hardDelete.*pbPushCardToRepo\|pbPushCardToRepo.*hardDelete" bridge-turn02-ship.html
```

### Ship post-development update
- Implemented as planned:
- Additions:
- Removals/deferrals:
- Bugs found:

---

## Stage: post-ship — v5.3.4

Copy `bridge-turn02-ship.html` to `bridge-turn02-post-ship.html`.
Version stamp only. No other changes.
This file becomes Turn 3 pre-base.

---

## PB Entry Point Behavior Reference

**Entry Point 1 — Tap PB icon in transcript header**
Browse mode. Each row: phrase text (tap → compose), below phrase
left-justified: TTS · Send · Edit. Source editable with Enter/Cancel
buttons. No "tap to use" text anywhere.

**Entry Point 2 — /search + Return in chat compose**
Overlay opens with query pre-populated, results active. X in search
field clears query, returns to browse, overlay stays open.

**Entry Point 3 — Partial /search in compose + tap PB icon in ribbon**
Overlay opens with partial search text pre-populated, results active.
Same as Entry Point 2 from that point.

**PB Add — + icon in overlay ribbon**
Modal opens blank. Lang pair from room. All panels open. Source focused.
Enter/blur: auto-translate target, auto-run BT. Save fires
`pbPushCardToRepo(card, 'create')`. Cancel with dirty check.

**PB Add — disk icon in transcript bubble header**
Modal opens pre-filled: source, target, langs, attribution from
transcript entry. BT auto-runs on open. Save fires
`pbPushCardToRepo(card, 'create')`. Cancel with dirty check.

---

## Known Gaps — Turn 3

| Gap | Blocked on |
|---|---|
| PWA offline | Out of scope by design — add to home screen only |
| TM Tier 3 glossary injection | Spec required |
| Telemetry live endpoint test | PB team staging URL + token |
| PB Central manifest read on load | PB team to expose manifest endpoint |
| Laptop translation quota failure | Open issue — monitor after network stabilizes |

---

## Turn 2 Summary
*(Fill after all stages complete)*
- Stages completed:
- Device bugs resolved:
- PB Central wired:
- Features delivered:
- Regressions found:
- Turn 3 pre-base:
