# Wrist — plan (sole authority for `wrist/`)

Version 2.0.0 · 2026-11-16 · Owner/device gate: Confi · Device: Galaxy Watch 9, left wrist

## 0. Turn ledger
| Date | Turn | Status | Notes |
|---|---|---|---|
| 2026-11-16 | turn01 | **rejected by owner, buried (G5)** | Practice list drawn on the watch. Owner: "how am I supposed to read anything on a watch … it's intended to read the gestures and then have them shown on X which runs on your phone or on the desktop." |
| 2026-11-16 | turn02 | built, device gate pending | Watch is a sensor only. Motions go through the wrist relay to the X practice page on the phone or desktop. Lab: 17/17 detector, 9/9 relay, 16/16 page. Not yet run on the owner's arm. |

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
- Working with the watch screen off or the Wrist app in the background.
- Buzz from X back to the watch.

## 4. Build and delivery
- Watch app: `.github/workflows/wrist-build.yml` runs `wrist/build.sh` (Android SDK tools only, no Gradle) and commits `wrist/out/wrist.apk` and `wrist/out/BUILD-LOG.md` to the branch.
- Relay and page: `.github/workflows/wrist-relay.yml` deploys `wrist/relay`, runs `e2e.mjs` against the live worker and commits `wrist/out/RELAY-LOG.md`.
- Signing: `wrist/debug.keystore` (password `android`) is a throwaway debug key kept in the repo on purpose, so every build updates over the last one. It protects nothing.
- Install: wireless debugging on the watch, push the file from the phone with Bugjaeger.
- Pairing: the watch shows a 6-digit code; X asks for it once per device and remembers it.

## 5. Owner's definition of working (device gate, turn02)
1. Wrist opens on the watch and shows a code and "sending to X" (or "X is not open" before the page is opened).
2. X on the phone shows "Watch connected" after the code is entered once.
3. Hand flat: raising the hand and holding moves the list on X one way and keeps moving; lowering moves it the other way; level stops it.
4. Hand vertical: one swing left changes thread on X once; one swing right changes it back once. The return swing does not count.
5. A knock chooses the centred row on X once. Ordinary arm movement does not.
6. The same works with X open on a desktop.

## 6. Unverified (lab only)
- The app has never run on a watch. Every threshold in `Detector.java` is a first guess.
- Direction signs assume the watch on top of the left wrist with the buttons towards the hand. Wrong way round is a one-line flip.
- Knock detection is the least certain.
- Delay from wrist to X on a real watch (it posts over the watch's own connection) is unmeasured.
- The 6-digit code is weak protection. Before a motion means a real "yes" (send, pay), pairing must be hardened.

## 6a. Diagnostics
- X shows link state, counts and the last three events on screen.
- Every event carries the readings behind it (tilt, roll, knock strength, threshold, noise). The relay keeps them at `/log`, so thresholds can be tuned from real data without the owner relaying numbers. No data has arrived through this channel yet.

## 7. Lab checks
`wrist/test/DetectorTest.java`, synthetic 100 Hz traces, run on every build. 2026-11-16: 17/17 pass.

`wrist/relay/e2e.mjs` (relay, run on every deploy against the live worker; 9/9 against a local worker on 2026-11-16).

`wrist/relay/page-test.py` (X page in a phone-sized Chrome driven by relay events; run by hand, 16/16 on 2026-11-16).
