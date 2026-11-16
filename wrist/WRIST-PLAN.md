# Wrist — plan (sole authority for `wrist/`)

Version 3.0.0 · 2026-11-16 · Owner/device gate: Confi · Device: Galaxy Watch 9, left wrist

## 0. Turn ledger
| Date | Turn | Status | Notes |
|---|---|---|---|
| 2026-11-16 | turn01 | **rejected by owner, buried (G5)** | Practice list drawn on the watch. Owner: "how am I supposed to read anything on a watch … it's intended to read the gestures and then have them shown on X which runs on your phone or on the desktop." |
| 2026-11-16 | turn02 | built, device gate pending | Watch is a sensor only. Motions go through the wrist relay to the X practice page on the phone or desktop. Lab: 17/17 detector, 9/9 relay, 16/16 page. Not yet run on the owner's arm. |
| 2026-11-16 | turn03 | built, device gate pending | Owner: "need to run with watch screen off, there is no way to keep it on all the time and have any reasonable battery life." Sensing moved to a background service with active and resting modes. Lab: 20/20 detector, 9/9 relay, 18/18 page. Not yet run on a watch. |

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
| A knock (or a touch anywhere on the watch face) | yes / choose this | short jolt, over within 0.1 s, arm otherwise quiet |
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

## 7. Lab checks
`wrist/test/DetectorTest.java`, synthetic 100 Hz traces, run on every build. 2026-11-16: 20/20 pass.

`wrist/relay/e2e.mjs` (relay, run on every deploy against the live worker; 9/9 against a local worker on 2026-11-16).

`wrist/relay/page-test.py` (X page in a phone-sized Chrome driven by relay events; run by hand, 18/18 on 2026-11-16).
