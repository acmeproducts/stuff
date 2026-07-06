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
