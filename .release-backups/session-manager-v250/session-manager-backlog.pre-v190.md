<!-- SESSION-MANAGER-GOVERNANCE v1.8.0 -->
# Session Manager — Release Plan, Backlog, Graveyard, Decisions, and Lessons

**Governance version:** 1.8.0  
**Updated:** 2026-08-10  
**Application artifact:** `session-manager-v3.html`  
**Owner:** Confi — sole device gate and final scope authority.

This file is the Session Manager source of truth. Owner/device evidence outranks builder inference.

---

# 0. HARD RULES

- Read this file before changing Session Manager.
- Owner/device FAIL means FAIL.
- Failed candidate → restore exact owner-proven input → rebuild; never patch-forward.
- Prove cause before fix; unknown cause means instrument first.
- Preserve working wiring and extend minimally.
- Deployable app remains one readable self-contained HTML file with inline CSS/JS.
- No encoded/self-decompressing app wrapper, extra daemon, service, worker, proxy, port, or duplicate deployment architecture.
- No direct `sessions.json` mutation or physical transcript deletion where a Gateway lifecycle RPC exists.
- Diagnostics are read-only unless a separately governed repair release explicitly permits mutation.
- Every GitHub publish is read back before owner handoff.
- The owner is the tester. Handoff identifies one filename/version/blob and does not offload architecture diagnosis.
- Accessibility is functional scope, not cosmetic polish: presets, contrast, typography, path/code readability, and configuration usability are owner-gated behavior.

---

# 1. AUTHORITATIVE FUNCTIONAL BASELINE

The owner supplied and explicitly proved working the v2.1.0 Session Manager artifact.

- visible version: **v2.1.0**
- exact baseline blob: **`27ee8fabe42a185d194b4af4d668e81b54a8b8c8`**
- owner-baseline restore commit: `0d5ed4c19ce66c45e5ad6722e84f9ecf13c19875`

Owner-proven baseline behavior:

- Gateway connection works;
- sessions load;
- chat works;
- inline rename works and persists through OpenClaw / official Control UI;
- activity-state tracking works.

The identity/signature/connect subsystem derived from this baseline remains protected through SM-R2.

---

# 2. ACTIVE RELEASE — SM-R2 / visible build v2.3.1

**Current GitHub commit:** `4fb047ea5ce521407a46c55c0e2e1985a093d66d`  
**Current GitHub blob:** `81057d309ddc36834f542b3bb752a4c31565014b`  
**Owner gate:** NOT YET RUN for v2.3.1.

v2.3.1 is an accessibility/appearance refinement of the governed v2.3 feature line. It does not redesign the Gateway connection contract.

## 2.1 Protected connection subsystem

The following behavior remains frozen from the owner-proven connection line:

- identity persistence/import/generation;
- Ed25519 key handling;
- device-token handling;
- signed connect-payload construction;
- challenge timestamp/nonce handling;
- platform/device-family fields used by the signature;
- `connectParams()`;
- `rpc()` handshake behavior;
- `connect()` sequencing;
- connect error handling;
- reconnect logic.

The guarded release build verified the governed v2.3.0 input blob before applying the accessibility patch and checked the protected connection signatures before publishing v2.3.1.

## 2.2 Session lifecycle

- Soft delete is local Session Manager state only.
- Recycle bin is at the **TOP** of the session list.
- Restore removes only the local tombstone.
- Tombstones persist across reload.
- Delete Permanently exists only in the Recycle bin.
- Permanent delete uses Gateway `sessions.delete` with `deleteTranscript:true`.
- OpenClaw owns transcript archive/rename lifecycle.
- Gateway rejection preserves local state and displays the actual error.
- No direct `sessions.json` or transcript-file mutation.

## 2.3 Accessibility-first Appearance workspace — v2.3.1

Appearance is a large configuration workspace, not a cramped control box.

### Presets

Required legible presets:

- **High Contrast Dark** — black canvas, white large text, high-contrast surfaces;
- **High Contrast Light** — white canvas with strong dark text;
- **Warm Paper** — low-glare warm background with dark readable text;
- **Soft Dark** — gentler dark surface while maintaining strong contrast;
- **Large Print** — larger base/message/meta text and generous spacing.

Presets are starting points; granular controls may override them.

### Page/application surfaces

Explicit controls:

- page background;
- panels/sidebar background;
- raised cards/header background;
- input background;
- borders;
- main text;
- secondary text;
- accent.

The user must be able to change the actual page/background rather than only message bubbles.

### Messages

Independent controls:

- User bubble background;
- User text color;
- User text size;
- Agent bubble background;
- Agent text color;
- Agent text size;
- maximum message width;
- line spacing.

### Markdown / HTML / code / paths

Code and path presentation are independent surfaces and never blindly inherit message text color.

Explicit controls:

- fenced code-block background;
- fenced code-block text;
- inline-code background;
- inline-code text;
- filename/path background;
- filename/path text;
- link color.

Critical rendered foregrounds use automatic contrast protection. If a selected foreground becomes unreadable against its surface, rendering selects readable black or white while preserving the saved palette choice.

This applies to critical main text, message text, metadata, code, inline code, filenames/paths, links, and primary-button text.

### Typography/layout

Controls:

- application/base text size;
- metadata size and color;
- sidebar width;
- session-list density;
- line spacing;
- font family, including readability-oriented Verdana plus System, Arial, Trebuchet, and Georgia.

### Live preview

Appearance includes a persistent live preview showing:

- session/sidebar card;
- User message;
- Agent message;
- filename/path sample;
- link sample;
- code block sample.

Appearance previews live. Closing with × discards unsaved appearance changes; Save persists them.

## 2.4 Automatic message rendering

Rendering mode is automatic; the tester does not select Markdown versus HTML manually.

- Markdown renders automatically.
- Recognized safe HTML formatting renders automatically.
- HTML is sanitized before insertion.
- Supported safe HTML is formatting/content only: headings, paragraphs/divs/spans, emphasis, lists, code/pre, blockquotes, links, tables, line rules/breaks.
- event handlers, inline styles, executable/embed content, `src`/`srcdoc`, and unsafe attributes are removed.
- rendered links are limited to safe `http(s)` / `mailto` destinations and open safely.
- inline Markdown code that looks like a filename/path receives the dedicated path style automatically.

## 2.5 Diagnostics

Configuration remains organized as:

- Connection
- Appearance
- Diagnostics

Debug tabs remain:

- Log
- Session Files
- Environment

Session Files rules:

- `.jsonl.jsonl` → **ANOMALY**;
- normal `.jsonl` → normal transcript;
- `.jsonl.deleted.*` → deleted archive;
- `.jsonl.reset.*` → reset archive;
- constructed `<sessionId>.jsonl` → **derived / not disk-verified**;
- browser does not claim a WSL disk scan it cannot perform;
- no repair/mutation in SM-R2.

---

# 3. OWNER GATE — v2.3.1

## Gate 1 — regression gate FIRST

- [ ] page visibly says **v2.3.1**;
- [ ] Gateway connects;
- [ ] sessions load;
- [ ] open session loads history;
- [ ] send/chat round-trip works;
- [ ] rename persists to official Control UI;
- [ ] no `DEVICE_AUTH_SIGNATURE_INVALID` regression.

If Gate 1 fails: STOP and restore owner-proven baseline; do not continue appearance testing.

## Gate 2 — lifecycle / operations

- [ ] Recycle bin appears at TOP when needed;
- [ ] soft delete affects only Session Manager;
- [ ] Restore returns exact session;
- [ ] tombstone survives reload;
- [ ] Permanent Delete uses OpenClaw lifecycle;
- [ ] rejected delete preserves state;
- [ ] Copy / Download / Share / Stop / attachments / activity show no regression.

## Gate 3 — appearance / accessibility

- [ ] Configuration → Appearance opens as a large usable workspace;
- [ ] all five presets are visibly legible;
- [ ] Large Print materially increases readability;
- [ ] full page background can be changed;
- [ ] panels, cards, inputs, borders, main/secondary text can be changed independently;
- [ ] User and Agent colors/sizes are independent;
- [ ] code block foreground/background are independent;
- [ ] inline code foreground/background are independent;
- [ ] filename/path foreground/background are independent;
- [ ] deliberately choosing an unreadable foreground does **not** produce unreadable rendered text because contrast protection corrects it;
- [ ] live preview updates while editing;
- [ ] closing × restores unsaved appearance state;
- [ ] Save persists appearance across reload;
- [ ] Markdown renders automatically;
- [ ] safe HTML renders automatically;
- [ ] unsafe HTML/script/event handlers do not execute.

Only owner PASS promotes v2.3.1 to baseline.

---

# 4. EXPLICIT NON-SCOPE

Not in SM-R2:

- automatic `.jsonl.jsonl` repair;
- orphan transcript re-index;
- direct filesystem mutation;
- multi-instance support;
- GitHub Pages architecture changes;
- platform abstraction;
- new service/worker/daemon/port;
- bulk deletion;
- session merge;
- unrelated authentication redesign.

---

# 5. PLANNED RELEASES

## SM-R3 / v2.4.0 — instance profiles
Named Gateway profiles, explicit URL, isolated auth/device state, safe A → B → A switching.

## SM-R4 / v2.5.0 — simultaneous multi-instance desk
Multiple Gateways concurrently with isolated sessions/activity/reconnect state.

## SM-R5 / v2.6.0 — platform-neutral static deployment
Same self-contained client served statically with explicit Gateway endpoints and proven allowed-origin/Tailscale behavior.

## SM-R6 / v2.7.0 — unified operations workspace
Global search, pins/favorites, health/version summaries, per-instance diagnostics, safe profile import/export, dense desktop/tablet workspace.

---

# 6. BACKLOG

### Lifecycle
- bulk soft delete / restore;
- bulk archive/delete after single-session lifecycle is proven;
- archived-transcript browser;
- supported archive restoration/re-index.

### Session-file diagnostics
- determine root cause/population of `.jsonl.jsonl`;
- orphan detection if Gateway-native inventory becomes available;
- missing referenced transcripts;
- duplicate sessionId/file references;
- archive retention visibility;
- anomaly report export;
- repair only in a later mutation-governed release.

### Operations
- transcript search;
- jump to latest/unread;
- improved code-block controls;
- message metadata on demand;
- global multi-instance search later.

### Test infrastructure
- protected auth/connect source-diff guard;
- startup/control reachability harness;
- mock list/patch/delete/chat/abort/auth cases;
- two-client harness;
- multi-instance harness;
- mutation tests proving each critical gate can actually fail.

---

# 7. GRAVEYARD

### G-001 — Patch-forward after failed candidate
Buried. Restore declared input and rebuild.

### G-002 — Encoded/self-decompressing application wrapper
Buried. Literal readable HTML only.

### G-003 — Divergent standalone proof client
Buried when it does not exercise the real app bootstrap/auth path.

### G-004 — Infer Gateway from page origin
Buried. Hosting origin and Gateway endpoint are separate.

### G-005 — Blind device approval
Buried. Approve only a real Gateway request.

### G-006 — Generic `INVALID_REQUEST` as root cause
Buried. Read structured error details.

### G-007 — Invented auth/token replacement
Buried. Preserve proven Gateway contract.

### G-008 — Static parse as runtime proof
Buried. Static checks qualify a candidate; owner hardware gate proves it.

### G-009 — Broad refactor for narrow feature work
Buried. Preserve working wiring.

### G-010 — Custom encoding/chunk/install publishing
Buried. Plain literal HTML and exact source read-back.

### G-011 — Direct physical transcript deletion
Buried. Use OpenClaw lifecycle semantics.

### G-012 — Automatic `.jsonl.jsonl` repair before evidence
Buried for SM-R2. Detection only.

### G-013 — Claim derived path list is a disk scan
Buried. Derived means not disk-verified.

### G-014 — Handoff without exact source read-back
Buried after first v2.3 transfer lost syntax before handoff.

### G-015 — Modify proven auth/connect code for unrelated UI features
Buried. Build UI/lifecycle changes around the proven connection subsystem.

### G-016 — Explain away repeated owner failure as deployment mismatch
Buried. Repeated owner failure after redeployment is a release FAIL.

### G-017 — Publish compressed/binary bytes as the HTML artifact
Buried after an intermediate publish produced non-UTF-8 content. Literal HTML read-back is mandatory.

### G-018 — Let message text color leak into code/path surfaces
**Buried 2026-08-10.** Code, inline code, filenames/paths, and links have dedicated palette roles and contrast protection. A black message font must never make a black code/path surface unreadable.

### G-019 — Cram Appearance controls into a small generic settings box
**Buried 2026-08-10.** Appearance is a large coherent workspace grouped by page surfaces, messages, rendered-content surfaces, typography/layout, with a live preview.

### G-020 — Presets without low-vision legibility guarantees
**Buried 2026-08-10.** Presets must be designed for readable contrast and useful scale. High Contrast Dark, High Contrast Light, Warm Paper, Soft Dark, and Large Print are the governed v2.3.1 set.

### G-021 — Require the user to choose Markdown versus HTML rendering mode
**Buried 2026-08-10.** Rendering is automatic. Markdown renders as Markdown; recognized safe HTML is sanitized and rendered without an extra mode control.

---

# 8. LESSONS

- The owner’s most recent demonstrated working artifact is the functional baseline.
- A working baseline is an asset; protect unrelated subsystems.
- Accessibility failures are functional defects, not cosmetic preferences.
- Color controls require semantic surface separation: page, panel, message, code, inline code, path, link, metadata.
- A free-form color picker without contrast protection can create an unusable UI.
- Low-vision presets need larger typography and spacing as well as contrast.
- Automatic rendering must be paired with sanitization; convenience must not mean executable arbitrary HTML.
- A release-tooling/hash mismatch is not an application failure when the source is reproduced and semantic/syntax/read-back gates pass.
- Source publishing correctness is part of release correctness.
- A successful GitHub write is not enough; read back the actual file.

---

# 9. DECISION LOG

- **D-001 · 2026-08-10:** this file governs Session Manager work.
- **D-002:** WSL owner gate precedes later neutral-hosting work.
- **D-003:** expansion order is stable single instance → profiles → simultaneous instances → neutral hosting → unified workspace.
- **D-004:** session rename round-trip into official Control UI is a required regression gate.
- **D-005:** Recycle bin belongs at TOP of session list.
- **D-006:** permanent delete uses OpenClaw lifecycle/archive semantics.
- **D-007:** `.jsonl.jsonl` is diagnostic-only in SM-R2.
- **D-008:** Debug remains behind Configuration and tabbed.
- **D-009:** prior broken v2.3 candidates were not promoted.
- **D-010:** owner-supplied v2.1 blob `27ee8f...` is the authoritative functional baseline.
- **D-011:** governed v2.3.0 feature candidate blob was `3f55b17975c7c10c27bf3ece87a28734ffeb3358`.
- **D-012:** protected auth/connect guard is required for subsequent SM-R2 work.
- **D-013:** v2.3.1 is an accessibility refinement; visible build version advances while the authenticated client-version marker remains on the proven v2.3 connection value to avoid signature drift.
- **D-014:** Appearance becomes a large low-vision-oriented workspace with five legible presets and live preview.
- **D-015:** page/panel/input backgrounds are first-class appearance controls.
- **D-016:** code, inline code, paths/filenames, and links are independent semantic color surfaces with automatic contrast protection.
- **D-017:** Markdown and sanitized safe HTML rendering are automatic.
- **D-018:** guarded GitHub build for v2.3.1 passed governed-input, protected-connection, feature, JavaScript syntax, cleanup, and final source read-back gates.
- **D-019:** v2.3.1 owner gate is NOT YET RUN.

---

# 10. MAINTENANCE RULE

Before code: freeze scope here.  
After new evidence: update Lessons/Graveyard.  
After owner ruling: update Decision Log in the same session.  
After FAIL: restore exact proven baseline and rebuild.  
After PASS: record exact commit/blob as new baseline.  
Unscheduled ideas remain backlog until deliberately promoted.


# 10. v2.4.0 WORKSPACE / THEME AMENDMENT — 2026-08-11

Owner ruling supersedes the earlier one-thread simplification. **BotsChat is a client type, not merely a color preset.** The locked hierarchy is:

`Client → Projects → OpenClaw session tabs`

- Left pane contains locally managed **Projects** with `+` creation.
- Each Project owns an ordered set of real OpenClaw session references.
- Selecting a Project changes the right-side session tab strip.
- The tab-strip `+` can add an existing OpenClaw session or create a new one.
- Closing a tab removes only that Project membership; deleting an OpenClaw session remains a separate governed lifecycle action.
- Projects never rewrite session keys, transcripts, labels, or OpenClaw storage.
- Background sessions remain independent and may continue working while another Project/session is viewed.
- `Standard Session Manager` remains available as a separate Client Type.
- Appearance and Client Type are independent. Claude, ChatGPT and BotsChat are built-in Appearance presets.

## Custom theme library

- Save the **complete current Appearance state** as a named custom theme.
- Apply, rename, duplicate and delete custom themes.
- Export one custom theme or the complete library as JSON.
- Import validates `session-manager-theme-library` schema/version 1 and normalizes appearance data before storage.
- Duplicate imported names receive a non-destructive suffix; import never silently overwrites an existing theme.
- Theme storage is browser-local data and remains independent of `session-manager-v3.html`.

## Graveyard additions

**G-022 — BotsChat as only a palette.** Buried. The reference includes navigation, Projects, tabbed sessions and workspace behavior.

**G-023 — One fixed General thread.** Buried. Owner clarified that multiple Projects on the left are critical and each Project must own multiple session tabs.

**G-024 — Custom themes as hard-coded source edits.** Buried. Custom themes are validated portable data with save/export/import.
