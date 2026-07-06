<!-- v5.8.pre-ship.1g -->
# TALKBRIDGE BUILD LOG
Doer writes here. One entry per attempt. Manager reviews before any proceed.

## Template
### [series.turn.stage.attempt] · [piece] · [date time PT]
- Golden baseline verify: PASS/FAIL (3 checksums)
- Steps executed:
- Deterministic acceptance results (each criterion from Plan Part 7, PASS/FAIL):
- Lint: PASS/FAIL
- Fingerprint locked / recomputed: match Y/N
- Output file + sha256 + commit SHA + byte-verify:
- Blockers / anything unclear (STOPPED at):
- Certification: "All due diligence done; release ready for device test." Y/N

## Entries
### 5.8.pre-ship.1 · P1 Workspace + golden verify · 2026-07-05 ~10:00 PT
- Golden baseline verify: PASS (3/3 checksums match Plan Part 5 table)
- Steps executed: sources pinned (pin file, commit c5501122); module extraction implemented and run; assembly script implemented and run; fingerprint locked, recomputed, matched
- Deterministic acceptance (Part 7 P1):
  - golden checksums match table: PASS
  - assembled output byte-identical on two consecutive runs: PASS
  - lint clean: PASS (output and extracted module)
- Lint: PASS
- Fingerprint locked / recomputed: match Y (ed6a44d8e7ca114170fb75e7963b0521c40d7467127ad83ddd008f672a1904b0)
- Output file + sha256 + commit SHA + byte-verify:
  - bridge-turn08-pre-ship.html · 07808f0e497ca454ea0d015d5858facfbefb38a9f245e6994226ae23c3534aef · commit 698ebd50a46927c2670c619a316604af8d9774a4 · byte-verify PASS at commit SHA
  - talkbridge/build/pin.json · 54a1009c… · commit 8e5ad3c5 · byte-verify PASS
  - talkbridge/build/build.py · 88a085a0… · commit 1f799bd0 · byte-verify PASS
  - talkbridge/build/bridge-module.js · ed6a44d8… · commit f3a7c99d · byte-verify PASS
- Notes: P1 output is the shell verbatim plus one inert injection-marker comment (no behavior change); deployed path follows the established living pre-ship file convention. Module extracted and fingerprinted but not injected (P3).
- Blockers / anything unclear (STOPPED at): none
- Certification: "All due diligence done; release ready for device test." Y


### GATE · 5.8.pre-ship.1 · P1 · Jul 5, 26 10:10 AM PT
Owner device test: PASS (boots to start, shell flows unchanged, nothing new visible). P1 done. Output path ruling: living pre-ship file at repo root is the deployed output for all pieces.

### 5.8.pre-ship.2 · P2 Shell trim + S13 · 2026-07-05 ~10:15 PT
- Golden baseline verify: PASS (3/3)
- Steps executed: retired shell surfaces removed (panel phrasebook + globe buttons, legacy catalog screen, old settings drawer, global reset); panel top row rebuilt per S2 (blank square with long-press to S13, date/time clock); S13 modal built with exactly three buttons (keys dormant, About, Privacy live); S4b drawer chassis installed hidden with meta-line placement dropdown and per-room storage plumbing (dormant, no rendering effect); appearance controls re-homed into the dormant chassis; all code paths touching removed surfaces guarded
- Deterministic acceptance (Part 7 P2):
  - retired element selectors return zero matches in output: PASS (12 selectors checked, all 0)
  - every S1–S3 inventory element present by ID: PASS (S0–S3 + S13 + chassis, 19 checks)
  - fingerprint pass: PASS (locked module fingerprint recomputed from golden, match)
- Lint: PASS
- Fingerprint locked / recomputed: match Y
- Output file + sha256 + commit SHA + byte-verify:
  - bridge-turn08-pre-ship.html · fb2064d3dd784b22c1fb9328683a4b096e1bd896fb72b2e2f19d0cfee773e3fe · commit 396ad8664d0e5c17635570b72fd8504871241ed6 · byte-verify PASS at commit SHA
- Rollback point if this fails: P1 verified output 07808f0e497ca454ea0d015d5858facfbefb38a9f245e6994226ae23c3534aef
- Note for manager: Part 2 prose says the share icon is removed from the S2 room card; Part 3 manifest and the P2 device script say it stays. I followed the manifest + prompt (share stays). Reconcile in the next plan bump.
- Blockers / anything unclear (STOPPED at): none
- Certification: "All due diligence done; release ready for device test." Y

### GATE · 5.8.pre-ship.2 · P2 · FAIL · Jul 5, 26 10:25 AM PT
Keys button inert in S13 modal; About/Privacy OK; everything else passed. Rollback to P1 output ordered.

### 5.8.pre-ship.3 · P2 Shell trim + S13 + S11 (retry) · 2026-07-05 ~10:30 PT
- Golden baseline verify: PASS (3/3)
- Rollback: restored P1 output (07808f…), pushed, byte-verified before rebuilding
- Steps executed: retired surfaces removed (panel PB + globe buttons, catalog screen, settings drawer); panel top row rebuilt (blank square + clock); S13 three-button modal built; S11 keys overlay built with four password fields reading/writing same localStorage keys as bridge; S4b drawer chassis + meta-line plumbing installed dormant
- Deterministic acceptance (Part 7 P2):
  - retired element selectors return zero matches: PASS (11 checked)
  - every S1–S3 inventory element present by ID: PASS (20 checked)
  - fingerprint pass: PASS
- Tap paths verified:
  - S2 blank square long-press → S13 modal opens: PASS
  - S13 "Calling & sync keys" → S11 keys overlay opens: PASS
  - S11 each input → saves to localStorage on typing: PASS
  - S11 Done → closes overlay: PASS
  - S13 About → info modal: PASS
  - S13 Privacy → info modal: PASS
- Lint: PASS
- Output: bridge-turn08-pre-ship.html · f1164f1a0ea1ddb80f9db4a41fab70f421791211c53e400f6ca1061f89b33169 · commit 972eca68f0591d2a70f98b5c02d32ec6e97a83a2 · byte-verify PASS
- Rollback point: P1 output 07808f0e…
- Blockers: none
- Certification: "All due diligence done; release ready for device test." Y

### GATE · 5.8.pre-ship.3 · P2 · PASS · Jul 5, 26 10:35 AM PT
All P2 criteria met including keys button tap path. P2 done.

### 5.8.pre-ship.4 · P3 Bridge organ injection · 2026-07-05 ~10:55 PT
- Golden baseline verify: PASS (3/3)
- Steps executed: bridge module (M2+M4, 4375 lines) injected as sealed IIFE with getElementById safety override during boot; bridge HTML surfaces added (transcript, compose strip, PB overlay, invite card, clarify modal, attachment modal); bridge CSS converted to light theme; shell bubble renderer and composer deleted; shell room-entry wired to TB_BRIDGE.enterRoom(); shell room-exit wired to TB_BRIDGE.leaveRoom(); shell toast element renamed to avoid ID conflict
- Deterministic acceptance (Part 7 P3):
  - fingerprint match: PASS (ed6a44d8…)
  - zero shell-bubble selectors remain: PASS (7 checked, all 0)
  - S4/S4-B/S5/S6/S7/S8 inventory elements present by ID: PASS (11 bridge elements, all present)
  - lint clean: PASS
- Do-not-touch regression: PASS (8 elements verified present)
- Module fingerprint locked/recomputed: match Y
- Output: bridge-turn08-pre-ship.html · 9c217cb4baa555c0fef81363d785090a26d48a6fd7d9e742dfdb59657fb52bac · commit 77608a7103360e39c39102616e77cc7ea397e42a · byte-verify PASS
- Rollback point: P2 output f1164f1a0ea1ddb80f9db4a41fab70f421791211c53e400f6ca1061f89b33169
- Architecture note: bridge module boots inside a sealed IIFE with a safe getElementById override that returns dummy elements for missing DOM during auto-boot (lobby stubs not needed). Override is restored after boot. Bridge relay connection is independent of shell relay — both connect to the same room but serve different purposes (bridge: message rendering; shell: metadata sync). The bridge's lobby DOM is present but hidden. Call engine (M3) is present but dormant (no video stream requested until P4).
- Blockers: none
- Certification: "All due diligence done; release ready for device test." Y

### 5.8.pre-ship.4 · P3 Bridge organ (retry — QR inlined) · 2026-07-05 ~11:10 PT
- Golden baseline verify: PASS (3/3)
- Steps executed: prior P3 already had bridge module injected (sealed IIFE), shell bubble/composer deleted, bridge surfaces wired. This retry adds: QR library inlined from pure-JS encoder (CDN reference removed per plan open item). All other P3 work confirmed already in place.
- Deterministic acceptance (Part 7 P3):
  1. Fingerprint match: PASS
  2. Zero shell-bubble selectors: PASS
  3. S4/S4-B/S5/S6/S7/S8 inventory elements present: PASS (15 elements)
  4. QR in-file, no CDN: PASS
  5. S4a invite logic (invUrl/copyLink/shareLink): PASS
  6. S4b drawer + meta-line chassis: PASS
  7. Receipts name-left (tr-who/tr-time): PASS
  8. Shell↔Bridge wiring (enterRoom/leaveRoom): PASS
  9. Tap paths (8 paths verified): all PASS
  10. Lint: PASS
- QR proposal: pure-JS SVG-output encoder inlined (~19KB). No external deps. Uses same API as qrcodejs (new QRCode(el,{text,width,height})). Awaiting manager approval to keep vs substitute.
- Output: bridge-turn08-pre-ship.html · 2c1e83084e130165cab8ea7ba66a426210ea3d6f344923590e7ccb3092394614 · commit e721b94079fe735416c1edc5efd497739a67033f · byte-verify PASS
- Rollback point: P2 output f1164f1a0ea1ddb80f9db4a41fab70f421791211c53e400f6ca1061f89b33169
- Blockers: none
- Certification: "All due diligence done; release ready for device test." Y
