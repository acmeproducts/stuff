# Plan W — the watch

Version 1.0.0 · 2026-11-18 · Part of `x/X-ROADMAP.md` · History before this date: `x/wrist/WRIST-PLAN.md`

## 1. Purpose
The watch is one source. Its job is to read the left forearm and wrist, cost little, and live and die with X. Two streams: **watch input** (what it reads) and **watch session** (when it runs).

## 2. State
| | |
|---|---|
| Built | App `turn06-b6`: background reader, screen off; tilt and swing recognised on the watch; raw rows on request (about 50 a second, three sensors); three-page diagnostics panel; hold to stop; every message carries link, round trip, battery, mode. |
| Measured | Link speeds by link (roadmap §1). Pose angles from the owner's arm. 13 minutes without a freeze once "Allow background activity" was on. No low-power sensor on this watch. |
| Wrong today | The panel turns its own pages every 5 seconds. Nothing in X can stop the reader. Nothing tells the owner the panel was logged. A forgotten reader drains the watch. |
| Unknown | Battery percent an hour (rough: 9 to 15). Whether the background switch fully ends the freezes. Wi-Fi only, with the phone's Bluetooth off. |

## 3. Serves
Stories US1, US3, US9. Requirements R04, R05, R14, R29, R30, R31, R32. Decisions A2 to A5, D14, D19.

## 4. Design notes
- The watch never decides meaning. It reports signals (D05).
- A message from the page reaches the watch only inside the relay's reply to the watch's next post. The watch posts a heartbeat every 3 seconds while a page listens, so a word from the page arrives within about 3 seconds.
- "Sleep" means: stop the reader, drop the sensors, the processor hold and the network hold, close the screen. Waking is opening Wrist on the watch (D14).
- Signals the watch can offer a template (plan V): forearm tilt, wrist roll, turn rate about the up direction, stillness, and how long a posture is held.

## 5. Releases

### W1 — Session (crawl, next)
Owner, 2026-11-18:
> "it's constantly cycling through the panels … I'm concerned about battery … I don't really know if any meaningful information is being captured and logged … we need to exit, and it can't be by accident, but we don't want to just leave it running, it depletes the watch, and ideally it would be something on X that you do."

**Scope**
1. The panel stands still. A touch turns the page.
2. **Watch off from the page.** The Lab (and later X) has a Watch off control that must be held for one second. The page sends the word; the relay puts it in its next reply; the watch sleeps.
3. **Sleep by itself.** If no page has been listening for three minutes, the watch sleeps.
4. **Not by accident.** A brush on the watch face never stops the reader. A one-second hold does.
5. **Proof of logging.** The panel shows "logged hh:mm". The page shows when the watch last logged.
6. The power page also shows whether Wrist is exempt from "pause if unused". (Theory: Android's unused-app flag is the same switch Samsung shows. To be confirmed on the watch.)
7. Every sleep is logged with its reason: from the page, alone for three minutes, or held.
8. **Hardened pairing (D22).** Owner, 2026-11-18: "why wouldn't we just do that". The six-digit code works once per device and only for two minutes after the watch shows it. The relay then hands the watch and that browser each a long secret, kept on each; from then on only the secrets are accepted. Wrong guesses are limited. A new device is added by showing a fresh code on the watch's link page.

**Build sequence**
| Step | What | Check |
|---|---|---|
| 0 | Move `wrist/` (repository root) to `x/wrist/` and repoint the three workflows. No code change. | all three workflows green; the app built from the new path is byte-for-byte the same code; relay live checks 16/16 |
| 1 | Write the failing checks: relay passes "sleep" once to the watch's next post; page has a Watch off control that needs a hold; page shows last-logged time; a code cannot be used twice or after two minutes; a page without the secret is refused; the sixth wrong guess in a minute is refused | they fail on `w3` and `lab-r5` |
| 2 | Relay `w4`: sleep word; last-logged time per watch; secrets and guess limit | relay checks pass, old 16 still pass |
| 3 | Lab `lab-r6`: Watch off, last-logged line; keeps its secret after the first pairing | page checks pass, old 54 still pass |
| 4 | Watch: still panel; sleep on the word; three-minute rule; one-second hold; "logged at" line; unused-pause line; sleep reason; keeps its secret; shows a fresh code on request | compiles against the SDK; detector checks 16/16 unchanged |
| 5 | GitHub builds `turn07-b…`; one download link to the owner | build log clean |
| 6 | Device gate, then read the device log | below |

**Device gate (the owner's definition of working)**
1. The panel is still until touched.
2. Holding Watch off on the page stops the watch within about five seconds; the watch returns to its own face.
3. With every page closed, the watch stops by itself in three to four minutes.
4. Brushing the watch face does not stop it.
5. The panel says when it last logged, and the page says the same time.
6. The device log shows each sleep and its reason.
7. After pairing once, the page reconnects on later days with no code. A second browser cannot join without a fresh code from the watch.

**Not in W1:** waking the watch from X (D14); any change to what is recognised.

### W2 — Battery truth (walk)
**Question:** what does an X session cost the watch per hour, on each link?

**Scope:** every session's battery at start and end, by link, summarised by the relay and shown in the Lab's results table (L1). Three runs by the owner: 30 minutes screen off on Bluetooth; 30 minutes on Wi-Fi; a two-minute Connection test on Wi-Fi with the phone's Bluetooth off.

**Build sequence:** checks for the summary arithmetic on recorded sessions; relay summary; table column; the three runs; numbers written into this plan.

**Gate:** three numbers in the record: percent an hour on Bluetooth, on Wi-Fi, and the longest silence in 30 minutes. Target: at most 10% an hour (D20). If it is worse, W3 moves up.

### W3 — Recognition on the watch (walk; **needs the owner's yes, change C1**)
**Question:** does recognising on the watch make Bluetooth alone enough, and cut the cost?

**Scope:** the page sends the owner's taught templates (plan V) to the watch through the relay's reply. The watch compares at a lower rate and sends only what fired, with its confidence. Raw rows flow only when the Lab asks.

**Vetting to bring to the owner before it starts:** W2's numbers; the same recordings scored on the page and on the watch, side by side; what stays in the Lab.

**Build sequence:** the comparison is written once in plain Java and tested against recorded trials from `out/trials/`; then the watch change; then a Bluetooth-only scored session (L2).

**Gate:** on Bluetooth alone, hit rate and wrong fires match the page's within one in twenty; battery per hour is no worse than W2's.

### W4 — Buzz (walk)
**Scope:** one short vibration when X has something ready (a thread finished). The word travels in the relay's reply like sleep does. Sparing by rule: one pattern, never repeated for the same thing.

**Gate:** with the phone face down, the owner knows a thread finished.

## 6. Risks
| Risk | Held by |
|---|---|
| The three-minute rule sleeps the watch while the owner is still setting up | the countdown starts only after a page has listened at least once in this run, or after three minutes from start |
| A sleep word arrives twice | the relay hands it out once per request |
| A cleared browser loses its secret | pairing again takes the same six digits as today; nothing else is lost |
| The move to `x/wrist/` breaks a build | step 0 is its own commit with nothing else in it |
