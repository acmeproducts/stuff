1. LINEAGE MAP
   1.1 Track 1 overview (May 4–May 10, 2026) — bridge-patched lineage
       Track 1 v1: bridge-patched-v1.html (8dc8a82, 2026-05-05, 2998 lines)
       Track 1 v2: bridge-restore-plus-2.html (eb4ac22, 2026-05-10, 1620 lines) [parent: bridge-patched-v1.html]
   1.2 Track 2 overview (Apr 30–May 15, 2026) — bridge8 lineage
       Track 2 v1: bridge8.html (9a517b6, 2026-04-30, 1511 lines)

2. CANDIDATE SCORES (highest first)
   2.1 Track 1 v1 -- bridge-patched-v1.html -- weighted_score: 0.998
       C1:1 C2:1 C3:1 C4:1 C5:1
       C6:1 C7:1 C8:1 C9:1 C10:1
       C11:1 C12:1 C13:1 C14:1 C15:1
       C16:1 C17:1  core_score: 1.00
       Non-core present: N2, N3, N4, N5
   2.2 Track 1 v2 -- bridge-restore-plus-2.html -- weighted_score: 0.941
       C1:1 C2:1 C3:0 C4:1 C5:1
       C6:1 C7:1 C8:0 C9:1 C10:1
       C11:1 C12:1 C13:1 C14:1 C15:1
       C16:1 C17:1  core_score: 0.88
       Non-core present: N3, N4, N5
   2.3 Track 2 v1 -- bridge8.html -- weighted_score: 0.882
       C1:1 C2:0.5 C3:0 C4:1 C5:1
       C6:1 C7:1 C8:0 C9:1 C10:1
       C11:1 C12:1 C13:1 C14:1 C15:1
       C16:1 C17:1  core_score: 0.85
       Non-core present: N3, N4, N5

3. PROPOSED BASELINE
   3.1 Selected: Track 1 v1 -- bridge-patched-v1.html
       Justification: highest weighted_score = 0.998
       (No prior assumptions applied; selection is score-driven)
   3.2 Code-level verification results:
       V1 (4-asset WASM): PASS -- fastText.common.js + fastText.wasm + lid.176.ftz + window.FastTextModule.locateFile configured before FastText init.
       V2 (Promise.race): PASS -- onDGFinal wraps _detectLangAsync in Promise.race with 150ms timeout fallback before translation.
       V3 (Latin-Latin gap): PASS -- Unicode script checks run first; Latin fallthrough uses FastText; failure fallback returns source language.
       V4 (bi-lingual goodbye): PASS -- joiner goodbye has download/copy/rejoin controls and labels localized via both party-language lookups.

4. DELTA TASKS
   None.

5. NON-CORE OPTIONAL ENHANCEMENTS
   5.1 Thai-space regex cleanup hardening checks -- source: bridge-restore-plus-2.html @ eb4ac223887a6d43dd05610afbc888f05f345484

6. VERIFICATION CHECKLIST
   6.1 Start initiator, create room, copy invite link.
   6.2 Join from second browser profile, verify bi-directional A/V.
   6.3 Speak Thai/Japanese/Arabic/Hindi/Russian and verify Unicode heuristic immediate route.
   6.4 Speak English/Spanish and verify FastText-discriminated direction without stall (>150ms fallback present).
   6.5 Mute/unmute mic and confirm silent-track substitution without DG restart.
   6.6 End call from initiator and confirm joiner sees bilingual goodbye with download/copy/rejoin.
