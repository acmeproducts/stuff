# Wrist — plan (the record for `x/wrist/`: watch app, relay, Lab)

Version 10.0.0 · 2026-11-18 · Owner/device gate: Confi · Device: Galaxy Watch 9, left wrist

**From 2026-11-18 the top authority is `x/X-ROADMAP.md`.** This file stays as the record of turn01 to turn06 and of every measurement taken so far. New work is planned in `x/plans/`. Section 14 below is superseded.

## 0. Turn ledger
| Date | Turn | Status | Notes |
|---|---|---|---|
| 2026-11-16 | turn01 | **rejected by owner, buried (G5)** | Practice list drawn on the watch. Owner: "how am I supposed to read anything on a watch … it's intended to read the gestures and then have them shown on X which runs on your phone or on the desktop." |
| 2026-11-16 | turn02 | built, device gate pending | Watch is a sensor only. Motions go through the wrist relay to the X practice page on the phone or desktop. Lab: 17/17 detector, 9/9 relay, 16/16 page. Not yet run on the owner's arm. |
| 2026-11-16 | turn03 | built, device gate pending | Owner: "need to run with watch screen off, there is no way to keep it on all the time and have any reasonable battery life." Sensing moved to a background service with active and resting modes. Lab: 20/20 detector, 9/9 relay, 18/18 page. Not yet run on a watch. |
| 2026-11-17 | turn04 | built, device gate pending | First real session read from the device log (section 8). Owner: knock "is going to exacerbate wrist problems"; wants "a proving area where multiple concepts are trialed and logged … a grid that once you tap it it becomes active and full screen … double tap it and the card flips over and you can add notes … keep or go back to the shop and refine or dump." Knock removed (G7). Practice page replaced by the Wrist Lab (G8). Watch app can stream raw sensor rows on request. Lab checks: 16/16 detector, 16/16 relay (live), 36/36 page. The Lab has not yet been used with a real watch. |
| 2026-11-17 | turn05 (page only, `lab-r2`) | deployed, device gate pending | Owner: palm up, palm down, thumb up, thumb down are "four different gestures … I don't think in any way we should have two gestures that mean the same thing"; asked whether the OK sign can be detected; proposed a palm-down flap; wants "one of these tiles that is the representation of all the keep gestures"; "we need to be really careful that we're not just trying to design app navigation, we need to stay true to building X"; X could notice arms raised overhead, shoulder rolls, and "how long you've just sat there and not moved your watch arm". Lab grows from 7 to 12 cards; watch app unchanged (turn04-b4). Lab checks: 46/46 page, 16/16 relay. No card has been used with a real watch yet: no trial has been saved and the watch was still on turn03-b3 at 13:16 UTC. |
| 2026-11-17 | turn05 (page only, `lab-r3`) | deployed, device gate pending | Owner corrected the OK sign: "I don't think the okay sign is supposed to be that you're seeing fingers, I think that it's just that you are holding your arm at roughly a 47° angle … hand to be about shoulder height or roughly around the height of your throat … this is not intended to be trying to detect jolts." Pinch probe buried (G11); `ok` card added: forearm between 35° and 60°, held 0.8 s. Lab checks: 48/48 page. |
| 2026-11-17 | turn05 watch app (`turn05-b…`) | built, device gate pending | Owner: "when I first go to the app it says nothing sent, then I get a socket time out … unknown host exception, and then I finally get sending to X." Cause (from the device log): the watch's own connection is not up when the reader starts; the first messages after four restarts never arrived (the event counter resumes at 3, 8, 43 and 1). The relay answered every message that did reach it. Change: the reader asks the watch for a connection and holds it while it runs, keeps and retries any motion or mode change that was not delivered, and shows "connecting…" in place of the error name. Not yet run on the watch. |
| 2026-11-17 | turn06 watch app (`turn06-b…`) + page `lab-r5` | built and deployed, device gate pending | Owner: "there should be a glyph to tap on the watch that opens diagnostic panel showing all relevant settings and making sure they are logged"; "I want to be able to use Bluetooth only as a test and also Wi-Fi as a test and then the mixed mode as a test"; Universal gestures confirmed not used. The Wrist screen is now the diagnostics panel (three self-turning pages), every message carries the link it travelled on and the round-trip time, and the Lab has a two-minute Connection test card. Touch on the watch face is no longer a gesture (G12). The in-app battery prompt is removed (G13). The "ask for Wi-Fi by name" idea is dropped until the three connection tests decide it. Lab checks: 16/16 detector, 54/54 page. Not yet run on the watch. |
| 2026-11-17 | turn07: phone↔watch channel | **closed by the owner before it started** (section 11.6) | Recorded and scoped the same day; the owner then decided against a phone companion app. X stays browser-based on phone and desktop, the relay stays, and installs stay with Bugjaeger. |
| 2026-11-18 | turn06 device gate | **passed for the panel and the connection test**; owner rated the Connection test and OK pose cards "Back to shop" | `turn06-b6` ran on the watch; panel reported to the log; connection runs recorded (section 12). |
| 2026-11-18 | Direction change from the owner | recorded (section 13), nothing built | X expects a finite set of commands; each person registers the signals that suit them; the watch is one sensing source among several to be catalogued (rings, camera, others); the mapping may change with context. |
| 2026-11-18 | Roadmap: five threads | recorded (section 14), nothing built | Owner named five threads: the Lab, watch client improvements, build X, 3D manipulation, and source input / teach gestures. First stage of each and the order are in section 14. |
| 2026-11-18 | Five-thread roadmap | **rejected by the owner** ("this feels incredibly light"; then: "your overall structure is busted and you have no true north") | Replaced by one pipeline and then by `x/`. A roadmap built around one talk-to-gateway loop was also rejected (G18). |
| 2026-11-18 | turn07 watch app (`turn07-b…`) + relay `w4` + page `lab-r6`: release W1 with L1 and S1 (`x/plans/`) | built and deployed, device gate pending | Owner: "we need to exit, and it can't be by accident, but we don't want to just leave it running … ideally it would be something on X that you do"; "a table of results"; wants the camera gesture; felt a buzz and wants buzzes explored. Watch: still panel, sleeps on a word from the page or after three minutes alone, one-second hold, "logged" line, own key, buzz patterns. Relay: sleep and buzz words, pairing secrets, sessions and snapshots. Lab: Watch off, Results, Camera: hand probe, Buzz the watch. Lab checks: 16/16 detector, 33/33 relay, 73/73 page. Not yet run on the watch; the hand finder has not run anywhere yet. |
| 2026-11-18 | X's first pass: page `x-r1` at `/x`, relay `w5` (release X1, `x/plans/X-x.md`) | built and deployed, device gate pending | Owner: "start a parallel track which is to start building X"; X is a learning system. Listening (Deepgram or the browser), the nine steps, five commands by voice, words kept, changed, renamed and forgotten by talking, memory as events on the device merged with a private GitHub repository, hand time, the watch put to sleep at the end. The Lab's file is now `lab.html`. Lab checks: 43/43 X, 35/35 relay, 73/73 Lab page, 16/16 detector. The real model, GitHub, microphone and voice were stood in for by the test: unproven until the owner's first session. |
| 2026-11-18 | X `x-r2` (owner's correction to `x-r1`) | built and deployed, device gate pending | Owner: "Actually Venice is primary … load the models available and then persist that model for that provider, and also then a switch to govern which provider is the default. We don't need Deepgram for transcription … whatever your browser is set to is fine." Setup now has the three services as in prism, market-navigator and devstream, Venice the default, fallback to the next service; listening is the browser's own. Lab checks: 50/50 X. Not run by the owner yet. |
| 2026-11-18 | X gets its home: `x/` | written, nothing built from it | Owner: X is a learning system that is born and grows a vocabulary; not a hub (it leverages AI); the existing pages are the floor, not the blueprint; a development roadmap with plans, releases and traceable requirements. Camera hand and head sources and the arbiter recorded from the owner's other session (section 15). |
| 2026-11-18 (evening) | Lab `lab-r7` + relay `w6` + `signals.lib.js`: releases S2, S3, V1, V3, V5, L3 (`x/plans/`) | built and deployed, **lab only**, device gate pending | Owner: "I want more lab cases for the hand and head recognition I also want to assign actions … teach … like letters make up words … imperative to have a 3D model of objects that can be handled virtually by using the hands either one or both". Five new cards. No watch build: the watch app stays `turn07-b8`. Lab checks 42 + 70 + 73 + 37 + 50, all passing (the commit message for `b79dc9a` says 43 for the first; 42 is the count); none of it has run on a device, and the finders' models never ran in the lab. |
| 2026-11-19 | Lab `lab-r8`: release L4 (`x/plans/L-lab.md`), relay `w7` (version number only), no watch change | built and deployed, **lab only**, device gate pending | Owner after his first run: depth "should be reversed"; "every single time I enter a card it has to wait for the stream"; the watch's silence was the Sleeping apps list. Then "go" on Round 2 (`x/X-ROADMAP.md` §3.4). Lab checks 42 + 72 + 77 + 37 + 50, all passing. The drain now refreshes records that grow while a card is open. |
| 2026-11-19 | Lab `lab-r9`: releases L5 (tabs) and V7 (Calibrate), relay `w8` (version number only), no watch change | built and deployed, **lab only**, device gate pending | Stage 2 of Round 2. The watch code is asked for only in the Watch tab; a visit that only uses the camera never links to the watch. Lab checks 65 + 90 + 84 + 37 + 50, all passing. |
| 2026-11-19 | Lab `lab-r10`: release L8 (watch cards from the owner's notes), relay `w9` (version number only), no watch change | built and deployed, **lab only**, device gate pending | Roll to scroll and Swing v3 replace Tilt v1, v2 and Swing v1, v2; sensitivity sliders; the watch in Calibrate. His recording showed his arm rests with the watch rolled to about −125°, where the old cards did not work. Lab checks 72 + 91 + 89, all passing; relay and X suites unchanged. |
| 2026-11-19 | Lab `lab-r11`: releases L6 (Hands and things) and L7 (Journey), relay `w10` (version number only), no watch change | built, **lab only**, device gate pending | Hands drawn in the scene, hand to hand, six goals, putty; a story steered by the head. Checks: engine 74, new cards 120, older Lab 89, relay 37. No real hand or head has run them. |
| 2026-11-19 | Lab `lab-r12`: release S6 (Voice tab), relay `w11` (version number only), no watch change | built, **lab only**, device gate pending | Take turns, Interrupt, Hot word and cold word; voice as a taught source; two listening actions. Checks: engine 93, new cards 163, older Lab 89, relay 37. No real voice has run it. |
| 2026-11-22 | Lab `lab-r13`: release L9 (Strum), relay `w12` (version number only), no watch change | built, **lab only**, device gate pending | Six strings over a full-width camera picture, strummed by the left, the right and a third hand; four chords across the picture. Checks: engine 93, new cards 182, older Lab 89, relay 37. No real hand has played it. |

## 1. Why this exists (owner's words, 2026-11-16)
- "I really can't type using a keyboard or a mouse … or for that matter a touch screen for more than 15 minutes at a time."
- "The human talks and minimal taps or swipes [to] X, and X talks to everything else. X is multi threaded."
- "It is my right hand that has problems, my left hand is fine, just not very dexterous … also happens to be where I wear my SmartWatch."
- "You could almost simulate scrolling up and down by just moving the left hand … swipe left and right by holding your hand vertical, you could even tap by just literally tapping."
- Body signals are to be used "sparingly".

## 2. The wearable contract
Few motions, same meaning everywhere. All on the left arm; the right hand is never required.

| Motion | Meaning | How the watch reads it |
|---|---|---|
| Hand flat, raise or lower the hand end and **hold** | move through content; level out to stop | forearm tilt from gravity, 12° level band, full speed 25° past it |
| Hand vertical (thumb up), swing left or right | previous / next item or thread | turn rate about the up direction; about 26° swept inside 0.6 s |
| ~~A knock~~ | removed in turn04 (G7) | a touch anywhere on the watch face still counts as "choose" |
| Buzz | X has something | not built yet |

Tilt is a held posture, not a repeated flick, so the left wrist does not inherit a repetitive load.

## 3. turn02 scope
The watch reads the motions; **X shows them.** Nothing is read on the watch.

- **Watch app** (`x/wrist/app`): detects the motions and posts each one to the relay. Its face shows only the 6-digit pairing code, whether sending works, and the build name.
- **Relay** (`x/wrist/relay/worker.js`, Cloudflare worker `wrist-relay`): passes each event to every page listening on the same code, and keeps the last 500 events at `/log` with codes masked.
- **X practice page** (`x/wrist/relay/x.html`, served by the relay at `/`): four threads of large rows. Tilt moves the list, a swing changes thread, a knock chooses the centred row. Works on the phone and on a desktop.

Out (open assumptions, owner may override):
- The real X. This page is only the surface that proves the motions arrive and act.
- Buzz from X back to the watch.

## 3a. Screen off and battery (turn03)
The Wrist screen no longer stays on. A background service does the reading:

| Mode | When | What runs |
|---|---|---|
| active | arm in a use pose (hand flat or hand vertical) and moving within the last 45 s | three sensors at 100 Hz, processor kept awake, a heartbeat every 10 s |
| resting | arm out of a use pose for 4 s, or still for 45 s | one slow wake-up sensor (5 samples a second, delivered once a second), processor allowed to sleep, nothing sent |

Waking from rest takes the arm coming into a use pose while moving; expect up to about 1.5 s. Motions in the first 0.6 s after waking are ignored (that was the arm coming up).

Open Wrist once to start the reader; it keeps going after the screen turns off. Holding a finger on the Wrist screen stops it. On first open the watch may ask to exempt Wrist from battery optimisation: allow it, or the watch may cut its network a few minutes after the screen goes off.

## 3b. The Wrist Lab (turn04)
One surface for trying many motion concepts. Served by the relay at `/` (`x/wrist/relay/x.html`, page build `lab-r1`).

- **Grid** of concept cards, each showing its verdict (Keep / Back to shop / Dump / not rated) and how many trials it has had.
- **Tap a card**: it opens full screen and a trial starts recording. A strip at the bottom shows live tilt, roll and turn.
- **Tap the experiment**: drops an "I meant that" marker in the recording. **Double-tap** (or Notes): the card flips to what-to-try, 👍/👎, the verdict and notes (typed or spoken).
- **Closing a card saves the trial** to the relay: every raw sensor row the watch sent, every start/stop/choice the concept decided, every touch on the page, the verdict and the notes, on one clock.

Concepts in `lab-r4`. Each concept's deciding logic is a recogniser (`R.<id>`) with no screen attached, so the same code runs in its own card and in Keepers. Adding a concept that works from raw rows needs no watch update.

| id | What | Gestures it fires | Decided by |
|---|---|---|---|
| keepers | every concept rated Keep running together; counts collisions (two concepts firing within 0.5 s) | all kept | page |
| see | live traces of what the watch sees | none | page, raw |
| poses | four poses held 0.8 s, each its own gesture; palm down only counts when arrived at from another pose | palm down, palm up, thumb up, thumb down | page, raw |
| flap | from palm down, a quick roll out (>28°) and straight back within 0.7 s | flap thumb rising, flap pinky rising | page, raw |
| dial | roll the forearm across seven options, hold still 1 s to choose | dial move, dial choose | page, raw |
| tilt1 | tilt to scroll, untuned baseline | scroll start/stop | watch |
| tilt2 | tilt to scroll with hysteresis, smoothing, steep or rolled arm ignored | scroll start/stop | page, raw |
| swing1 | swing with hand vertical, baseline | swing left/right | watch |
| swing2 | same swing with lower thresholds (17° in 0.7 s, more tilt allowed); a guess, no owner data behind it | swing left/right | page, raw |
| raise | lift the hand towards the face to open the mic, lower to close | talk open/close | page, raw |
| body | **not commands**: what X could notice. Arm still (20 s, then each minute), arm held overhead 1.5 s, shoulder rolls (four slow half-turns of tilt with the arm level) | still…, arms overhead, shoulder roll | page, raw |
| ok | the OK pose as the owner defined it: forearm held between 30° and 52° with the wrist not rolled (|roll| < 30°), 0.8 s; records tilt and roll each time | ok pose | page, raw |

Design rule from the owner (2026-11-17): **no two gestures share a meaning**, and the Lab is an interim workshop for X's interaction model, **not app navigation**. Gestures are named for what the body does; meanings are assigned later, in X.

Known limits, stated to the owner:
- The OK pose is read from the forearm angle only. Raise to talk (forearm above 40° for 0.5 s) and arm overhead (above 62° for 1.5 s) use the same axis, so OK pose and raise to talk will fire together until real recordings show how to separate them (roll at the moment of firing is recorded for that).
- "Arm still" is only timed while a Lab card is open, because that is the only time the watch streams. In X it would be timed on the watch.
- Lab-found collisions already seen with synthetic input: thumb up fires within 0.2 s of dial choose (both are "roll to −90° and hold"); a flap drags the dial across options.

Raw stream: when a page with an open card asks, the relay tells the watch in the reply to its next post; the watch then sends about 50 rows a second (`[ms, gravity xyz, turn-rate xyz, linear-acceleration xyz]`, each ×100). Raw rows go to pages only and are never written to the device log. While a page is asking, the watch does not drop to resting.

Open assumptions (owner may override):
- Rating a card is by buttons on its back, not by a gesture: thumb up is the same pose as "hand vertical", so it would fire during the swing concepts.
- Raw-based cards need watch app turn04. Cards `tilt1` and `swing1` work with turn03.

## 3c. Diagnostics on the watch (turn06)
Opening Wrist shows a panel, nothing else. Three pages turn by themselves every five seconds; a touch turns the page at once; holding stops or restarts the reader. Nothing has to be read: the same snapshot goes to the log at start, whenever anything in it changes, and once a minute (`t:"diag"`).

| Page | Shows | Red when |
|---|---|---|
| LINK | pairing code; sending state; link in use (Bluetooth via phone / Wi-Fi / mobile / none); Wi-Fi radio on or off; round trip to the relay; sent and failed counts; last error | no connection; slow round trip; more failed than sent |
| POWER | battery; **background allowed or BLOCKED**; power saving; watch idle state; standby bucket; longest gap between delivered messages; screen | background blocked; power saving on; deep idle; bucket rare or restricted; a gap over a minute |
| READER | state; running time; number of starts; sensors present; low-power sensor present; last motion; app build and API level | a sensor missing |

What the panel cannot show: Samsung's own switches (automatic Wi-Fi in Developer options, Universal gestures). Android does not let an app read them.

Every event now also carries `ln` (bt / wifi / cell / none) and `rtt` (ms), and every raw batch carries `ln` and `rt`.

## 3d. Connection tests (owner request, 2026-11-17)
Three runs of the Lab's **Connection test** card (two minutes each, results kept in a table on the card and in the trial):

| Mode | How |
|---|---|
| Bluetooth only | Wi-Fi off on the watch |
| Wi-Fi only | Bluetooth off on the phone |
| Mixed | both on (the watch chooses) |

Measured per run: readings a second, typical and worst gap between batches, stalls (gaps over a second), watch-to-relay round trip, battery before and after, and the link or links the watch reported. Not measured: end-to-end delay from wrist to page (the watch and tablet clocks are not synchronised).

## 3e. Decisions recorded 2026-11-17
- **Universal gestures are not used.** Samsung's feature steers the watch's own screen and is not handed to outside apps. Wear OS 7 has a Gesture API with two actions (primary, dismiss) for apps whose screen is showing; that is app navigation, which X is not. Parked, not buried: double pinch through that API as one extra signal, if Samsung has opted the Watch 9 in (unknown).
- **Wi-Fi is not required for X.** The watch's normal path is the phone's Bluetooth link. Wi-Fi is required only to install with Bugjaeger. Longer term (theory): the watch talks straight to the phone over Bluetooth with a small phone companion app and no internet relay.
- **"Turn off automatic Wi-Fi"** is in the watch's Developer options (Samsung developer blog). Not yet tried.

## 4. Build and delivery
- Watch app: `.github/workflows/wrist-build.yml` runs `x/wrist/build.sh` (Android SDK tools only, no Gradle) and commits `x/wrist/out/wrist.apk` and `x/wrist/out/BUILD-LOG.md` to the branch.
- Relay and page: `.github/workflows/wrist-relay.yml` deploys `x/wrist/relay`, runs `e2e.mjs` against the live worker and commits `x/wrist/out/RELAY-LOG.md`.
- Signing: `x/wrist/debug.keystore` (password `android`) is a throwaway debug key kept in the repo on purpose, so every build updates over the last one. It protects nothing.
- Install: wireless debugging on the watch, push the file from the phone with Bugjaeger.
- Pairing: the watch shows a 6-digit code; X asks for it once per device and remembers it.

## 5. Owner's definition of working (device gate, turn03)
1. Wrist opens on the watch and shows a code and "sending to X" (or "X is not open" before the page is opened).
1a. With the watch screen off, the motions below still reach X; with the arm down X shows "Watch resting", and raising the arm wakes it.
2. X on the phone shows "Watch connected" after the code is entered once.
3. Hand flat: raising the hand and holding moves the list on X one way and keeps moving; lowering moves it the other way; level stops it.
4. Hand vertical: one swing left changes thread on X once; one swing right changes it back once. The return swing does not count.
5. A knock chooses the centred row on X once. Ordinary arm movement does not.
6. The same works with X open on a desktop.

## 6. Unverified (lab only)
- The app has never run on a watch. Every threshold in `Detector.java` is a first guess.
- Battery use in either mode is unmeasured. Each event now carries the battery level, so drain per hour can be read from the device log.
- Whether this watch offers a wake-up accelerometer (events carry `idle: wakeup` or `idle: lock`; with `lock` the processor stays awake while resting and the saving is small).
- Whether the watch lets a background service keep its sensors and network with the screen off, with or without the battery exemption (events carry `screen` and `exempt`).
- Direction signs assume the watch on top of the left wrist with the buttons towards the hand. Wrong way round is a one-line flip.
- Knock detection is the least certain.
- Delay from wrist to X on a real watch (it posts over the watch's own connection) is unmeasured.
- The 6-digit code is weak protection. Before a motion means a real "yes" (send, pay), pairing must be hardened.

## 6a. Diagnostics
- X shows link state, counts and the last three events on screen.
- Every event carries the readings behind it (tilt, roll, knock strength, threshold, noise). The relay keeps them at `/log`; pushing `x/wrist/DRAIN.trigger` makes `.github/workflows/wrist-log.yml` copy that into `x/wrist/out/DEVICE-LOG.md`, so thresholds and battery use can be tuned from real data without the owner relaying numbers. No watch data has arrived through this channel yet.

## 8. First real session, 2026-11-17 12:26–12:36 UTC (watch turn03-b3, read from `x/wrist/out/DEVICE-LOG.md`)
First data to arrive through the log channel. 256 watch events in 10 minutes.

| Observed | Evidence |
|---|---|
| The app runs and sends | 195 scroll events, 41 heartbeats, 18 taps |
| Sensing continues with the watch screen off | 77 events carry `screen:0` |
| The battery exemption was not granted | `exempt:0` on every event |
| This watch has no wake-up accelerometer | the one resting event carries `idle:lock`, so resting keeps the processor awake |
| Battery fell 49% to 46% in ten minutes of active use | `bat` field; small sample |
| Swing never fired | no swipe event; the vertical pose was reached a few times (roll −52° to −70°) |
| Tilt stutters at the edge of the level band | runs of `r` flipping 0/1 with tilt near 15° |
| A lowered arm scrolls | `r:-4` held for 10–30 s with tilt −55° to −68° (the arm coming down to rest still counts as "hand flat") |
| Knock fires during ordinary arm movement | wrist taps logged while tilt was changing |
| With the screen off, sending pauses for about 400 s at a time, twice (12:36:07→12:42:48, 12:42:58→12:49:38) | the event counter carries on across each gap (264→265, 276→277), so the reader was not restarted: it was paused. Cause unproven; the watch's own power saving is the leading theory, since `exempt` is 0 |

Changes made from this: knock removed; `tilt2` in the Lab addresses the stutter and the lowered arm; `swing1` kept unchanged so the Lab can record why it does not fire.

## 9. First Lab trials from the real watch, 2026-11-17 13:37–13:47 UTC (watch turn04-b4, read from `x/wrist/out/trials/`)
First data through the trial channel: three trials, two with raw rows (3,823 and 2,560).

| Observed | Evidence |
|---|---|
| The raw stream works end to end | rows arrive in batches about 115 ms apart, 26–40 rows a second (target 50) |
| Owner's OK pose, as the watch measures it | four steady holds during the prompts: tilt 36°, 38°, 40°, 42°, roll −7° to +2°. The owner describes it as about 47° |
| Pose assumptions confirmed | thumb up held at roll −82° and −96°; palm up at −168°; thumb down at +83° and +90°; arm overhead at tilt 65° |
| The battery exemption is still not granted on turn04 | `exempt:0` on all 200 turn04 events |
| With the screen off the watch pauses the app in 400 s blocks | six gaps of exactly 400 s on turn03 (12:36–13:16 UTC), each followed by about ten seconds of activity; the event counter carries on, so the app is suspended, not stopped |
| The reader was restarted once | counter reset at 13:37 UTC after a 596 s gap |
| Battery fell 41% to 35% in 24 minutes on turn04 | `bat` field |
| The reader restarts and its first messages are lost | four counter resets in 90 minutes (13:37, 13:56, 14:37, 14:49 UTC); after three of them the first 2, 7 and 42 messages never reached the relay |

Owner's notes on the trials: "Watch still keeps timing out, I think it has more to do with the overall global battery setting than anything else."

Change made from this: the `ok` card's band moved from 35–60° to 30–52° and now requires the wrist not rolled (`lab-r4`).

## 10. The background switch, 2026-11-17 (device log + owner)
| Observed | Evidence |
|---|---|
| During all testing up to 14:23 Pacific, "Allow background activity" was **off** for Wrist in the Galaxy Wearable app, and Universal gestures were off | owner, 2026-11-17 |
| With it off the app was frozen for long stretches whenever the screen was dark | six 400 s silences; one silence of 18,207 s (15:09–20:12 UTC) during which the event counter advanced by 191; one of 7,713 s |
| With it on, no freeze in the 13 minutes recorded so far | 22:21–22:34 UTC: 272 events, largest gap 10 s, one unbroken screen-off stretch of 305 s; battery 86% → 84% |
| The in-app battery prompt could never have worked | Samsung developer forum: the exemption request and the app battery setting do not exist on Wear; `exempt` stayed 0 on every event |

Theory, not yet proven: the switch is the whole cause. Needs at least half an hour of screen-off wear in the log.

## 11. turn07: phone↔watch channel (exploratory, no fixed scope)

### 11.1 Owner's requirements, verbatim (2026-11-17)
> **Requirements: phone↔watch channel (exploratory, no fixed scope)**
>
> **Goal.** My own API to manage file transfer and package install between my Android phone (S23 Ultra) and my watch (Galaxy Watch 9). It should ride the durable connection the Galaxy Wearable app already keeps between them.
>
> **Explore first, then propose.** Find out what that standing link really is and what can ride on it. Candidates include Samsung's own link, Google's Wear OS Data Layer, and direct Bluetooth. Do not assume any one of them. An earlier claim that Samsung's link is closed to other apps was never verified; check it. Prove each finding on the actual watch with small probes. Label fact versus theory. Report what the channel can do before settling a design. Scope stays open until I close it.
>
> **File transfer.** Both directions: phone→watch and watch→phone. Any file type and size, with progress, integrity check, and resume after a drop. Works with the watch screen off, without Wi-Fi and without developer mode.
>
> **Package management.** Install, update, uninstall, and list what's installed with versions. Find the fewest taps possible per install, and the smallest one-time setup. State exactly what the watch still asks me to confirm, if anything.
>
> **The API.** Mine to call from X and my other components, not tied to one app. Explore how it's exposed on the phone and what operations it should offer. Every operation reports status and failure reasons in plain words.
>
> **What else the channel could carry (explore, don't commit).** Gesture events and raw sensor rows, replacing the Wi-Fi relay. This answers whether Wi-Fi is needed at all. Watch settings and diagnostics, feeding the diagnostic panel idea. Commands and buzzes from X back to the watch. Logs pulled from the watch on demand.
>
> **Constraints.** No IDE. GitHub builds; I only deploy. Mobile-only: all diagnostics shown in-app and logged. Nothing to read on the watch. Battery life must stay reasonable. Any scope cut is stated as an open assumption for me to override. Record this as a new turn in WRIST-PLAN.
>
> **First deliverable.** A findings report: what the channel is, what was proven on the watch, what failed, and the options that opens up.

### 11.2 Where it fits
X has three layers. This turn is the bottom one.

| Layer | What it is | State |
|---|---|---|
| Interaction model | which body motions and signals X understands | being worked out in the Wrist Lab (turns 04–06) |
| **Channel** | how the watch and the phone exchange anything at all: motions, sensor rows, files, app updates, settings, buzzes, logs | **this turn.** Today it is an internet relay plus Bugjaeger, both stopgaps |
| X itself | the thing the owner talks to, which talks to everything else | not started |

Five present pains trace to the stopgap channel, and each is a line in the owner's requirements:

| Pain today | Evidence | Requirement that removes it |
|---|---|---|
| Every watch update needs developer mode, Wi-Fi and Bugjaeger | six watch builds so far, each a manual push | package management over the channel |
| Motions travel watch → internet → phone though the two are a metre apart | relay; raw stream reached 26–40 of 50 rows a second on Wi-Fi | gesture events and sensor rows on the channel |
| "Unknown host" and timeouts on start | first 2, 7 and 42 messages lost after restarts | a link that is already up |
| A setting silently froze the app and nothing said so | "Allow background activity" off through the first day | settings and diagnostics on the channel |
| The owner photographed the watch to show its settings | 2026-11-17 | logs pulled on demand |

### 11.3 When
1. turn06 device gate: install `turn06-b6`, panel reports to the log. (In progress.)
2. The three connection tests (section 3d). Their Bluetooth-only numbers are the bar a direct channel has to beat, measured on the same card.
3. **turn07 stage A, desk findings.** What the standing link is on a Watch 9: Samsung's link, the Wear OS Data Layer, direct Bluetooth. Sources cited, each claim marked fact or theory. No build.
4. **turn07 stage B, probes on the watch.** One small build per question, each answering one thing and reporting in the log. Order set by stage A.
5. **Findings report** to the owner (PDF). The owner closes or changes scope. Only then a design.

The Lab continues in parallel; nothing in it waits on this turn.

### 11.4 What must be verified, not assumed
Each of these is a **theory** until a source or a probe says otherwise.

| Question | Why it matters |
|---|---|
| Is Samsung's own phone↔watch link open to other apps? | An earlier statement that it is closed was never checked. The owner asked for it to be checked. |
| Does the Wear OS Data Layer reach a Galaxy Watch 9 through the Galaxy Wearable pairing, with the screen off and Wi-Fi off? | It is the most likely carrier. |
| Does the Data Layer require the phone app and the watch app to share one package name and one signing key? | Decides how the two apps are built and named. |
| Can a watch app install another app (or update itself) from a file it received, and what does the watch ask the wearer to confirm? | Decides "fewest taps per install". A fully silent install may need rights an ordinary app cannot have. |
| Can the watch-side piece itself be installed without developer mode, even once? | Decides "smallest one-time setup". The first install may still need Bugjaeger. |
| What sustained speed does each carrier give, and what does it cost in battery? | Decides whether raw sensor rows can leave the relay. |
| Does direct Bluetooth between two of the owner's own apps survive beside the Galaxy Wearable link? | Fallback if the Data Layer is restricted. |

### 11.5 Known tension, raised now
- **Graveyard G3 (no Gradle).** The Data Layer comes as a Google library. The current build compiles with bare SDK tools and no libraries. If the Data Layer is the carrier, the build needs either that library fetched and linked by hand in CI, or Gradle running on GitHub (never on the owner's side). G3 is not reopened without the owner's approval.
- **A phone app is new.** Everything on the phone so far is a web page. The channel needs a real app on the S23 (installed once from a download; no developer mode needed on a phone). How X's pages talk to that app is part of the exploration.

### 11.6 Owner's decision, 2026-11-17: no phone companion app
> "I don't want a companion app on the phone because this shouldn't be just phone based, this should also be able to run on a desktop as well because it's browser based. Putting a companion app in place is just adding a level of complexity, and if really the only purpose is to push a package we already have a mechanism. It's not super clean but hopefully the development cycle stabilizes out and then I can turn off the wireless debug mode permanently. If it really becomes useful other than my own personal project then I can worry about distribution channels later."

What this settles:
- **X is browser-based, on the phone and on a desktop.** No app is installed on the phone.
- **The relay stays** as the path from the watch to X. It is the only path that reaches a browser on any device.
- **Watch installs stay with Bugjaeger and wireless debugging** while development is active. Once the watch app stabilises, wireless debugging is turned off.
- **Distribution is out of scope** unless the project outgrows personal use.
- Sections 11.3 to 11.5 are withdrawn: no desk study of the Samsung or Data Layer links, no probes, no findings report. G3 (no Gradle) stands untouched.

What stays open from section 11.1, because it needs no phone app:
- **Whether Wi-Fi is needed.** Answered by the three connection tests (section 3d).
- **Diagnostics and logs without photographing the watch.** Done through the relay in turn06.
- **Commands and buzzes from X back to the watch.** Possible through the relay (the watch already reads the relay's reply to each message). Not built.

Parked, not buried: a browser can in principle connect straight to a watch over Bluetooth (Web Bluetooth in Chrome, phone and desktop) with no companion app and no internet. Unverified on this watch, needs a tap to connect each session. Worth a probe only if the relay proves to be the limit.

## 12. Connection runs, 2026-11-18 08:23–08:39 UTC (watch turn06-b6, page lab-r5, from `x/wrist/out/trials/`)
Each figure is computed from the raw batches, split by the link the watch reported on each batch.

| Run | Link | Seconds | Readings / s | Typical gap | Worst gap | Stalls over 1 s | Round trip (median) |
|---|---|---|---|---|---|---|---|
| 94c5 | Wi-Fi | 84 | 49 | 103 ms | 0.6 s | 0 | 50 ms |
| 5a5z | Wi-Fi | 91 | 35 | 112 ms | 3.4 s | 6 | 57 ms |
| bt8x | Bluetooth | 33 | 32 | 211 ms | 2.6 s | 2 | 138 ms |
| ttw4 | Bluetooth | 142 | 26 | 248 ms | 2.8 s | 17 | 128 ms |
| 5qy5 (mixed) | Wi-Fi part | 113 | 43 | 108 ms | 1.6 s | 4 | 54 ms |
| 5qy5 (mixed) | Bluetooth part | 82 | 30 | 218 ms | 3.2 s | 12 | 147 ms |
| ok-rsne | Bluetooth | 312 | 29 | 243 ms | 3.6 s | 36 | 154 ms |

Facts:
- Wi-Fi carries about one and a half times the readings of Bluetooth (35–49 against 26–32 a second; the target is 50), with about a third of the round trip (50–57 ms against 128–154 ms) and far fewer stalls.
- Bluetooth alone works. Nothing failed outright on it.
- In mixed mode the watch moved between the two links by itself inside one run.
- The owner's note, before seeing these numbers: "there did seem to be better measurement when Wi-Fi was connected instead of Bluetooth … I have no facts to back that up." The numbers back it.

Reading (theory): the raw stream is what suffers on Bluetooth. A single recognised motion needs one small message, which Bluetooth carries in about 150 ms. So the Lab, which streams raw rows, is better on Wi-Fi; X itself, once recognition runs on the watch and only results are sent, should not need Wi-Fi.

Not measured: battery cost per link (each run moved the battery by at most 1%, too little to compare), and Wi-Fi only with the phone's Bluetooth off.

OK pose trial (ok-rsne): eleven firings, forearm tilt 47° to 54°, roll −25° to +32°.

## 13. Direction from the owner, 2026-11-18
### 13.1 Verbatim
From the OK pose card's notes:
> "we don't really need to measure for the motion, rather it doesn't really need to be the okay sign, it's really just measuring the angle of the forearm, so this does sort of open up other potential gestures: a forearm at 90°, palm facing not necessarily open, a forearm flat on a table … also the forearm just being at various degrees … this particular lab card should not be for the okay sign. I think my insight is that there's going to be a finite number of commands that X is expecting, why not let the user register them so that they can do it to suit their particular needs. Maybe somebody is more comfortable only using wrist rolls with the forearm parallel to the floor, or it could be that the forearm is something that's excluded altogether depending on what gestures are registered."

From the conversation:
> "once we collect up all the gestures that we could reliably sense, perhaps we determine what are the ways that a person can choose to tell X how they're going to interact with it. … I don't want to be wedded to the watch. If for example the ring, or for that matter other rings on the market, would be good sensing devices; another avenue, which has been done to death and back from the Microsoft Kinect, is to use the camera to be able to sense gestures. So really there's a number of avenues here and I want to catalog and explore them all, because ultimately everybody's different and they're going to want to interact with X differently, and potentially even the same person interacting with X differently depending on context of time, activity or another differentiator."

### 13.2 What this changes
The Lab was choosing one fixed gesture set. That is no longer the goal. The model is four separate things:

| Piece | What it is | Who decides |
|---|---|---|
| Commands | the finite set of things X expects to be told | X's design |
| Signals | everything a body can do that some sensor reads reliably: a forearm angle held, a roll, a flap, a swing, a nod, a spoken word | measured, per source |
| Sources | the devices that read signals: watch, ring, camera, microphone, others | catalogued and probed |
| Registration | this person's mapping from signals to commands, possibly a different mapping per context (time, activity) | the person |

Consequences for what is already built:
- **Named-gesture cards (OK pose, four poses, flap, dial) become instances of one thing:** a signal the person teaches by doing it a few times. The OK band was already set this way by hand, from the owner's four holds.
- **Keepers becomes the collision check for a person's own registered set,** not for a set chosen in advance.
- **"No two gestures share a meaning"** (2026-11-17) still holds, per person: one registered signal, one command.
- **Recognition should end up on the watch** (or whichever source), sending only results, so that no source depends on a fast raw link.

### 13.3 Sources to catalogue (nothing here is verified beyond the watch)
| Source | Could read | Known | To find out |
|---|---|---|---|
| Watch (Galaxy Watch 9) | forearm angle, roll, swings, stillness, raises | proven in the Lab | which signals stay reliable all day |
| Ring | finger and hand motion | the owner raised it | whether any ring on the market gives an outside app its motion data at all |
| Camera (phone, tablet, desktop) | hand shapes, finger poses, head and body pose | fits a browser-based X on any device with a camera | reliability in ordinary light, battery, how it feels to be watched, whether hands must stay in view |
| Microphone | speech | X's main channel by design | covered by the owner's existing voice components |
| Earbuds | head nods and shakes | some have motion sensors | whether any expose them to a browser or app |
| The phone itself | its own tilt and motion when held or carried | every phone has the sensors, a browser can read them | whether it is useful when the phone is on a stand |

### 13.4 Not started
No catalogue research, no "teach a signal" card, no change to the watch app. Awaiting the owner's go on what to do first.

## 14. Roadmap: five threads (owner, 2026-11-18) — SUPERSEDED by `x/X-ROADMAP.md`
Kept as the record of what was proposed and of the owner's words. The five threads became five plans and eleven streams in `x/`. The first stage of 14.1 is release W1 in `x/plans/W-watch.md`.

> "it appears to me that we have a minimum of five different threads here: we have the lab thread, we have the watch client improvements, we have the build X, we have the 3D manipulation, and we have the source input / teach gestures, which really feeds what is X, how to use it, and it is fed by the labs."

How they connect: the **Lab** is where signals are tried and measured. **Teach** turns a signal into something a person registers. **3D manipulation** is a Lab item that gives registered signals something rich to act on. The **watch client** is one source feeding all of it. **X** is what the registered signals, and the voice, finally talk to.

### 14.1 Watch client improvements
Owner, on `turn06-b6`:
> "it's constantly cycling through the panels, which has a few detrimental effects: one, it doesn't really help to just keep cycling through it; two, I'm concerned about battery; and three, I don't really know if any meaningful information is being captured and logged, I see it being displayed. … we need to exit, and it can't be by accident, but we don't want to just leave it running, it depletes the watch, and ideally it would be something on X that you do."

Facts behind this:
- The cycling is a design fault of turn06 (pages turn every five seconds). It only draws while the Wrist screen is lit.
- The battery concern is real and is about the reader, not the panel: this watch has no low-power sensor, so the reader keeps the processor awake even when "resting". Measured: 86% → 84% in 13 minutes on 2026-11-17.
- The panel's contents **are** logged (at start, on any change, each minute); that is how the link, background state and firmware were read on 2026-11-17 and 2026-11-18. Nothing on the watch or in X shows the owner that it happened.
- Stopping today: holding a finger on the Wrist screen stops the reader. Nothing in X can stop it.

First stage (one watch build, with a small relay and page change):
1. Panel stops cycling: one still page; a touch turns it.
2. **Exit from X**: a control in X that puts the watch reader to sleep, delivered in the relay's reply to the watch's next message.
3. **Sleep by itself** when no X page has been listening for a set time, so it is never left running by accident.
4. A visible "logged at hh:mm" line on the panel, and the same confirmation in X.
5. Add "pause if unused" exemption to the panel's power page.

Open question for this thread: once asleep, the watch is not listening, so X cannot wake it instantly. Options to weigh: open Wrist on the watch to wake it (one touch), or have the sleeping watch check in with the relay every few minutes (small battery cost, wake delay up to that interval).

### 14.2 The Lab
Owner:
> "the watch should be able to be used to look at a table of results, so this really goes back to what's being logged and how are we organizing it so that we can retrieve it."

First stage: a **Watch report** card in the Lab: the watch's current panel snapshot and its recent history as a table, read from the relay. Needs the relay to keep each watch's snapshots in a retrievable form (today the log is one mixed list of 500 lines that only the build session reads).

### 14.3 Source input / teach gestures
From section 13. First stage: a **Teach a signal** card: do or hold something three times, the card learns the range from the person's own body, the person names it, it joins Keepers for a collision check. Replaces the OK pose card. Then the source catalogue (rings, camera, earbuds) as a desk study.

### 14.4 3D manipulation
Owner:
> "have a 3D shape, maybe it's a cup or a bowl or maybe it's a toy car, but just with the gestures being able to manipulate it would open up a whole language of being able to select, drag, drop, rotate left to right, rotate up and down, rotate diagonally left and right. If you look at the explore mode of ui-v2.html there are some hints of this type of functionality, but I don't want that to be donor code, I want it to be inspiration."

First stage: read ui-v2.html's explore mode for the idea only (no code taken), then one Lab card with a single 3D object driven by taught signals. Follows 14.3, because it needs registered signals to drive it.

### 14.5 Build X
Owner:
> "We also need to start a parallel track which is to start building X. No, I don't have a spec for it, I just have the vision that I gave you early on as a starting point."

First stage: no code. A one-page definition of X assembled from the owner's own words in this project (the human talks, X talks to everything else; many threads at once; nothing to learn; the burden of being understood is X's; verdicts; commands registered per person), for the owner to correct. X is not a wrist project, so it gets its own folder and its own plan file once the owner agrees to that.

### 14.6 Order proposed (owner to confirm or change)
1. Watch client first stage (14.1) together with the Watch report card (14.2): they share the question of what is logged and how it is retrieved, and the watch is draining battery now.
2. X definition draft (14.5): cheap, and it starts the parallel track.
3. Teach a signal (14.3).
4. 3D object (14.4).

## 15. Sources beyond the watch, and the arbiter (owner, 2026-11-18)
From the owner's session on camera gestures, brought here by him: camera hand gestures and camera head gestures join the watch as parallel sources, and a fourth node, the arbiter, decides whose word counts by rules that are taught per context (override, fallback, exclusive). Rings are dropped (G15). Doublepoint's kit is not adopted (G16). Recorded in full, with the owner's words, in `x/plans/S-sources-arbiter.md`.

## 7. Lab checks
`x/wrist/test/DetectorTest.java`, synthetic 100 Hz traces, run on every build. 2026-11-17: 16/16 pass (knock checks removed with the knock).

`x/wrist/relay/e2e.mjs` (relay, run on every deploy against the live worker; 16/16 against the live worker on 2026-11-17; 33 checks from relay `w4`).

`x/wrist/relay/page-test.py` (the Lab in a phone-sized Chrome, driven by relay events and a synthetic raw stream; run by hand, 54/54 on 2026-11-17; 73/73 on `lab-r6`, 2026-11-18). 73/73 on `lab-r7`, 2026-11-18 (evening).

`x/wrist/relay/signals-check.js` (the shared signals script alone, 42/42) and `x/wrist/relay/signals-page-test.py` (the five new Lab cards with a made-up hand and head, 70/70), both new on 2026-11-18 (evening). Relay `w6`: `e2e.mjs` 37 checks. What these cannot show is in `x/X-TEST-PLAN.md` §8.
