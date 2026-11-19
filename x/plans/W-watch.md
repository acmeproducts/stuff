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
8. **Hardened pairing (D22).** Owner, 2026-11-18: "why wouldn't we just do that". As built: the watch makes a long key once and sends it with every message; from its first message the relay refuses that code from anyone without the key. A browser needs a secret to listen. The relay hands one out only in the two minutes after Wrist is started on the watch, to one browser per start, and only to a browser that already knows the six digits. Five wrong tries in a minute from one address are cut off. A second browser is added by stopping and starting Wrist. An older watch build (no key) keeps working as before.
9. **Buzz from the page** (owner, 2026-11-18: "that would be a very interesting thing to explore, especially things like being able to confirm being connected to the app and disconnected … maybe three quick buzzes or a zigzag buzz means a specific kind of exception case"). A page can send any pattern; the watch plays it and reports that it did. Built in: two short when a page starts listening, one long when the last page leaves (each only after six seconds, so a reconnecting page does not buzz), long-then-short when the watch goes to sleep. Fact: before this build the only buzz was 35 ms on a recognised swing.

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

**Built 2026-11-18, lab only so far**
| Check | Result |
|---|---|
| Step 0: builds from `x/wrist/` | watch build 7, relay deploy 10, 16/16 live relay checks |
| New relay checks written first and seen to fail on `w3` | 13 failed, as expected |
| Relay `w4`, local | 33 of 33 relay checks pass (16 old, 17 new) |
| Lab `lab-r6`, local, phone-sized browser | 73 of 73 page checks pass (54 old, 19 new) |
| Watch `turn07` | compiles against the SDK; detector checks 16/16 unchanged |
| On the owner's watch | **not yet run** |

A real layout fault was found by the new checks and fixed: with a long status line the Watch off and Code buttons were pushed off the right edge of the phone screen. The Code button had the same fault in `lab-r5`.

**Device gate, 2026-11-18 13:02 to 13:23 UTC (`turn07-b8` on the owner's watch, from `x/wrist/out/DEVICE-LOG.md` and `out/trials/`): part passed, one failure.**

| Gate item | Result | Evidence |
|---|---|---|
| 2. Off from a page | **passed** (from X) | X ended 13:21:54; the watch logged `sleep`, why `page`, at 13:21:55, after a 1,170 s run |
| 6. Each sleep logged with its reason | **passed** | the same line |
| 7. Pairs by itself after a start | **passed** | started 13:02:25, paired 13:02:49 |
| Buzz from the page | **passed**; owner rated the card Keep | nine patterns delivered, felt 0.15 to 0.8 s after the tap; two "page joined" buzzes. Owner: "Works as stated, might consider adding pauses to the pattern." |
| 1, 3, 4, 5 (still panel, sleeps alone after three minutes, a brush does nothing, "logged" time) | **not evidenced** | nothing in the log either way |
| Stays connected with the screen off | **FAILED** | silent stretches of 55, 63, 76, 125, 130 and 145 s with the screen off; the watch was silent for almost the whole X session. Owner: "every time the watch goes to sleep then I lose the connection again." |

Other facts: battery 38% to 34% in 19.5 minutes on Wi-Fi, about 12% an hour (one sample). The panel reports "pause if unused" as on. The watch shows a new pairing code, so the app was installed fresh rather than over the old one.

Theory, not proven: the fresh install reset "Allow background activity" to off. The silences look like the ones recorded before that switch was first turned on (`WRIST-PLAN.md` §10), and `turn06` ran 13 minutes without one once it was on.

**That theory was wrong (owner, 2026-11-19, 01:30 to 01:46 Pacific).** "Allow background activity" was on the whole time (his screenshot of the watch's App info for Wrist, turn07-b8). The cause was a second setting: Wrist was on the watch's **Sleeping apps** list, on the watch's Battery page. He does not know how it got there. He removed it.

| Fact (device log, 2026-11-19 UTC) | Evidence |
|---|---|
| Before the change the watch went silent whenever its screen was off | 07:12 to 07:47: a dozen silences of 20 s to 9 min (the watch's own count: 533 s), each ending when the screen woke. 09:34 to 09:45: five more, 16 s to 145 s |
| After the change it keeps talking with the screen off | 09:46:30 to 09:49:24: 60 reports, every one with the screen off, largest gap 3.3 s. Three minutes only; a longer run is still owed |
| The watch cannot see either setting | `exempt` has read 0 on every report from every build, including the good 13 minutes on 17 Nov; `restricted` read 0 and `bucket` 10 while Wrist was on the Sleeping apps list |

**Both settings are required: Allow background activity on, and Wrist not a sleeping app.** Because the watch cannot read either, the Lab can only warn on the symptom (silent with the screen off). Built in `lab-r8` (2026-11-19): after 15 s of silence following a report with the screen off, the status line names both settings.

**Card entry waits for the stream (owner, same message):** "every single time I enter a card it has to wait for the stream". Fact: the page asks for the sensor stream only when a card opens, and the watch hears the request at its next check-in, every 3 s. Measured wait from opening a card to the first rows: 0.2 to 3.1 s on turn06 (14 trials); 2.6 to 10.4 s on turn07 while it was being put to sleep (8 trials). Changed in `lab-r8` (2026-11-19): the stream stays on between cards and for two minutes after the last card that needed it.

Other facts from the same night: on Bluetooth the link card measured 44 rows a second, 157 ms round trip, one stall, worst gap 13.7 s (before the change). The watch's own battery page shows Wrist at 2.9% of the charge used over 13 h 22 m.

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

### W4 — Buzz language (walk)
The carrier is built in W1: any page can send a pattern, and the Lab's **Buzz the watch** card offers six to feel (one short, two short, three quick, zigzag, one long, long then short).

**Question:** which patterns can the owner tell apart on the wrist without looking, and what should each mean?

**Scope:** from the owner's notes on the Buzz card, fix a small set: connected, disconnected, X has something ready, something went wrong. X then uses them. Sparing by rule: never repeated for the same thing.

**Gate:** with the phone face down, the owner names what each of four buzzes meant, four times out of four.

## 6. Risks
| Risk | Held by |
|---|---|
| The three-minute rule sleeps the watch while the owner is still setting up | the countdown starts only after a page has listened at least once in this run, or after three minutes from start |
| A sleep word arrives twice | the relay hands it out once per request |
| A cleared browser loses its secret | pairing again takes the same six digits as today; nothing else is lost |
| The move to `x/wrist/` breaks a build | step 0 was its own commit; all three workflows ran green from the new paths (build 7, relay deploy 10, 16/16 live) |
| Someone posts to a code with a key of their own before the real watch ever uses it, locking that watch out | known limit, not fixed: it denies service but exposes nothing. The code is random and used from first start. |
