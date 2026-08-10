# Handover — TalkBridge

## Onboarding — read in this order

1. `talkbridge/THE-METHOD.md` — the process. Not optional, not a suggestion.
2. `talkbridge/TALKBRIDGE-GRAVEYARD.md` — every failed approach and why. Scan it
   against whatever you're about to build before you build it.
3. `talkbridge/TALKBRIDGE-PLAN-v9.md` — current scope, current baseline, what's
   passed, what's next. This is the single source of truth for state.

If anything below conflicts with those three, they win.

## History

Plan is at v10.9.0. Baseline is `bridge-turn24-pre-base.html` (read receipts),
device-passed.

Release 7 (PWA, push, away-record, call surface) passed its gate once, was then
patched forward directly on the passed file three times, and has been rolled
back per graveyard 2.1. That is the whole history that matters: **a passed
release is not a base to patch.** A defect found after passing is rolled back,
logged, and rebuilt — same as any other failure, no exception for small fixes.

## Execution — what happens next

**Release 7 is delivered fresh, from `bridge-turn24-pre-base.html`, as one
clean build.** Not resumed, not patched onto anything. Everything already known
gets folded into the build from the start:

- PWA shell, push subscription, away-record home-screen entries, call surface —
  full original scope.
- Manifest and iOS meta tags go in the document head at build time. Script
  injection after load is why install was never offered — the browser decides
  eligibility during parse.
- Ribbon: both side zones must grow equally, or the centre drifts by however
  wide the room name happens to be.
- Missed-activity counting: a message counts as missed whenever its room is not
  the one currently on screen — not only when the browser tab is hidden.
  `document.hidden` alone misses "home screen open, app visible, wrong room."
  Root cause is proven; there is a known double-count edge case to close and
  mutation-test before this ships.
- Fix the `flags.gif` 404 and add a real favicon.
- Gate on real hardware, one release, all platforms. Test iOS in **Safari**,
  not Chrome — Chrome on iOS is Safari under the hood by Apple's rule and can
  never install a PWA or receive push. That is not a defect to chase.

Do the two-instance harness proof for anything crossing the relay before you
believe it works. Confirm scope against the plan before you start. Roll back,
never patch, on any failure — including your own.
