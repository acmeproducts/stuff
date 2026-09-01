# R10-CR3 — owner device gate and acceptance (2026-08-31, evening PT)

**Pair:** commit `ac541c1` — app `6abc47d7`, worker `610718a6`, relay v6.2 `6609b141`.

**What the owner ran and saw (owner's words, paraphrased only where marked):**
- Deepgram key loss on the iPhone: "appears to be resolved."
- Adding a thread from the plus sign on the room card: worked.
- Adding a room thread and the other person declining it: worked; leads to the
  finding below.
- Android: alerts arrive as a bell icon and a dot in the shade rather than a
  full banner (turn25 item).
- Owner decision: "I'm okay with using this as the accepted release for turn24
  post-ship and starting turn25 pre-base with it."

**What the logs proved on this run:** blur announced instantly on the iPhone
(G23 live); leave-a-room lane in 0.4 s (G21 live); no push or socket traffic
reached the iPhone during its away windows, which the Android log could not
pair because its 400-line buffer held only idle refreshes (see turn25 item 1).

**Honest gaps, recorded not hidden:** the 13-row sheet was not completed row
by row; rows 2/3/7/8 on Android and row 13 on the Android→iPhone direction
were not read from logs. The owner accepted on observed device behavior and
chose not to re-run, given the log buffer made re-testing unreadable.

**Findings carried forward:**
1. Debug log buffer flood — idle screen refreshes (~15 lines / 20 s with five
   rooms) wash the 400-line buffer in ~9 minutes. turn25 pre-ship item 1.
2. Android alert presentation — bell icon (no icon supplied) and no heads-up
   banner (channel importance). turn25 item.
3. After a declined thread invite there is no way to enter that thread again.
   Backlog: a fourth long-press option on the left-rail clock, "Join thread",
   with camera (QR) or paste-a-URL. Captured, not scheduled.

**Frozen bytes for turn25 pre-ship (this accepted pair):**
- `bridge-turn24-post-ship.html` 6abc47d77ed237a79c9a6181cf58ff695ac3c7808cb9318e84b6e5a02d50dfa2
- `tb-sw.js` 610718a6c39a7a2a9d46cf48b5c65ecb987d4a5a0ce7fa5b37f0d2e9e21d436d
- `talkbridge/worker-talk.js` 6609b141e7da263c3966e94e4db328f1783337a2a692f4fa69e09870d6d0178c
- `talkbridge/wrangler.jsonc` 2b3f1410052aaaf4678e2a1f93d2e08d079e6304ae7785742a70612769a523f9
