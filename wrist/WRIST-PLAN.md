# Wrist — plan (sole authority for `wrist/`)

Version 5.1.0 · 2026-11-17 · Owner/device gate: Confi · Device: Galaxy Watch 9, left wrist

## 0. Turn ledger
| Date | Turn | Status | Notes |
|---|---|---|---|
| 2026-11-16 | turn01 | **rejected by owner, buried (G5)** | Practice list drawn on the watch. Owner: "how am I supposed to read anything on a watch … it's intended to read the gestures and then have them shown on X which runs on your phone or on the desktop." |
| 2026-11-16 | turn02 | built, device gate pending | Watch is a sensor only. Motions go through the wrist relay to the X practice page on the phone or desktop. Lab: 17/17 detector, 9/9 relay, 16/16 page. Not yet run on the owner's arm. |
| 2026-11-16 | turn03 | built, device gate pending | Owner: "need to run with watch screen off, there is no way to keep it on all the time and have any reasonable battery life." Sensing moved to a background service with active and resting modes. Lab: 20/20 detector, 9/9 relay, 18/18 page. Not yet run on a watch. |
| 2026-11-17 | turn04 | built, device gate pending | First real session read from the device log (section 8). Owner: knock "is going to exacerbate wrist problems"; wants "a proving area where multiple concepts are trialed and logged … a grid that once you tap it it becomes active and full screen … double tap it and the card flips over and you can add notes … keep or go back to the shop and refine or dump." Knock removed (G7). Practice page replaced by the Wrist Lab (G8). Watch app can stream raw sensor rows on request. Lab checks: 16/16 detector, 16/16 relay (live), 36/36 page. The Lab has not yet been used with a real watch. |
| 2026-11-17 | turn05 (page only, `lab-r2`) | deployed, device gate pending | Owner: palm up, palm down, thumb up, thumb down are "four different gestures … I don't think in any way we should have two gestures that mean the same thing"; asked whether the OK sign can be detected; proposed a palm-down flap; wants "one of these tiles that is the representation of all the keep gestures"; "we need to be really careful that we're not just trying to design app navigation, we need to stay true to building X"; X could notice arms raised overhead, shoulder rolls, and "how long you've just sat there and not moved your watch arm". Lab grows from 7 to 12 cards; watch app unchanged (turn04-b4). Lab checks: 46/46 page, 16/16 relay. No card has been used with a real watch yet: no trial has been saved and the watch was still on turn03-b3 at 13:16 UTC. |
| 2026-11-17 | turn05 (page only, `lab-r3`) | deployed, device gate pending | Owner corrected the OK sign: "I don't think the okay sign is supposed to be that you're seeing fingers, I think that it's just that you are holding your arm at roughly a 47° angle … hand to be about shoulder height or roughly around the height of your throat … this is not intended to be trying to detect jolts." Pinch probe buried (G11); `ok` card added: forearm between 35° and 60°, held 0.8 s. Lab checks: 48/48 page. |

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

- **Watch app** (`wrist/app`): detects the motions and posts each one to the relay. Its face shows only the 6-digit pairing code, whether sending works, and the build name.
- **Relay** (`wrist/relay/worker.js`, Cloudflare worker `wrist-relay`): passes each event to every page listening on the same code, and keeps the last 500 events at `/log` with codes masked.
- **X practice page** (`wrist/relay/x.html`, served by the relay at `/`): four threads of large rows. Tilt moves the list, a swing changes thread, a knock chooses the centred row. Works on the phone and on a desktop.

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
One surface for trying many motion concepts. Served by the relay at `/` (`wrist/relay/x.html`, page build `lab-r1`).

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

## 4. Build and delivery
- Watch app: `.github/workflows/wrist-build.yml` runs `wrist/build.sh` (Android SDK tools only, no Gradle) and commits `wrist/out/wrist.apk` and `wrist/out/BUILD-LOG.md` to the branch.
- Relay and page: `.github/workflows/wrist-relay.yml` deploys `wrist/relay`, runs `e2e.mjs` against the live worker and commits `wrist/out/RELAY-LOG.md`.
- Signing: `wrist/debug.keystore` (password `android`) is a throwaway debug key kept in the repo on purpose, so every build updates over the last one. It protects nothing.
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
- Every event carries the readings behind it (tilt, roll, knock strength, threshold, noise). The relay keeps them at `/log`; pushing `wrist/DRAIN.trigger` makes `.github/workflows/wrist-log.yml` copy that into `wrist/out/DEVICE-LOG.md`, so thresholds and battery use can be tuned from real data without the owner relaying numbers. No watch data has arrived through this channel yet.

## 8. First real session, 2026-11-17 12:26–12:36 UTC (watch turn03-b3, read from `wrist/out/DEVICE-LOG.md`)
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

## 9. First Lab trials from the real watch, 2026-11-17 13:37–13:47 UTC (watch turn04-b4, read from `wrist/out/trials/`)
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

Owner's notes on the trials: "Watch still keeps timing out, I think it has more to do with the overall global battery setting than anything else."

Change made from this: the `ok` card's band moved from 35–60° to 30–52° and now requires the wrist not rolled (`lab-r4`).

## 7. Lab checks
`wrist/test/DetectorTest.java`, synthetic 100 Hz traces, run on every build. 2026-11-17: 16/16 pass (knock checks removed with the knock).

`wrist/relay/e2e.mjs` (relay, run on every deploy against the live worker; 16/16 against the live worker on 2026-11-17).

`wrist/relay/page-test.py` (the Lab in a phone-sized Chrome, driven by relay events and a synthetic raw stream; run by hand, 49/49 on 2026-11-17).
