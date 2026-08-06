# turn23-pre-ship — why it failed, and the fix

**Status:** rolled back. `bridge-turn23-base.html` remains the baseline.
**Date:** 2026-08-06

---

## 1. What the log proves

Two lines, seventeen milliseconds apart, are the whole story:

```
06:07:02.936  lc_invite_built   { room: gg09ew, grant: false }
06:07:02.953  lc_room_created   { room: gg09ew, named: true, grant: true }
```

**The invite link was built before the room knew its own name or that it was a
granting room.** Everything else follows from that one ordering fault.

The base create handler does five things in a row: builds the room object with
an empty title, pushes it, saves, closes the dialog, and enters the room —
which renders the room head and builds the invite link and QR code. My release
applied the name and the grant in a listener attached to the same button, which
by definition runs *after* all of that.

So the link the owner shared was a plain invite with no room name and no grant
marker, from a room that was correctly created as named and granting. The
joiner received exactly what it was sent: a nameless, ungranted room.

This also explains what looked like a broken handshake. The handshake was not
broken — chat flowed in both directions the whole session, in Chinese and
English, correctly translated. What never arrived was the room's identity.

## 2. Second fault, reported directly

Pressing Enter in the room-name field closes the create dialog. The field was
added as a plain input inside a modal that treats Enter as confirm. Typing a
name and pressing Enter — the obvious thing to do — dismisses the dialog.

## 3. What was actually working

Worth recording so it is not rebuilt:

- Chat both directions, with normalization, throughout the session.
- Participant names propagating in both directions.
- The grant toggle, the expiry date, and the room name all captured correctly
  at creation — `named: true, grant: true` is the room, not the link.
- Credential key separation held: `canCreate: true` from the device's own keys,
  with no grant record present.

## 4. The fix

**One ordering change, one input fix.**

### 4.1 Apply the fields before the room is entered

The name and grant must be on the room object before anything reads it. The
create button cannot be wrapped — it is an anonymous listener — but the base
handler calls `enterRoom` as its last act, and that call is already wrapped.

- A capture-phase listener on the create button reads the name, the grant toggle
  and the date, and stashes them. Capture phase runs before the base handler.
- The existing `enterRoom` wrapper applies them to the newly created room
  *before* calling through, so the link is built from a room that already knows
  what it is.
- The stash is consumed once and time-bounded, so it can never attach to a room
  it was not meant for.
- A log line states the room's name and grant status at the moment the link is
  built, so this specific ordering can never regress silently again.

### 4.2 Enter in the name field

Enter commits the field rather than the dialog: it stops propagation and moves
focus on. This matches how the phrasebook fields already behave.

### 4.3 Tests that will catch both

- The invite link built for a room created with a name and a grant carries both.
- The link is never built before the fields are applied — asserted by building a
  room through the create path and reading the link, not by inspecting order.
- Enter in the name field leaves the dialog open and the name intact.
- The existing eighteen lifecycle tests all still pass.

Each is mutation-tested by reverting the fix and confirming failure.

## 5. What is not changing

- No change to the credential model. Key separation, expiry, revoke and restore
  all held and are covered by tests that already pass.
- No change to the joiner shell, which passed its own gate.
- No new instrumentation beyond the one link-build line.

## 6. Re-gate

Same as before, plus one step at the front:

1. Create a named room with the grant on. **Check the shared link opens a room
   with the right name on the second device.**
2. Confirm the create control appears on the joiner after a grant, and does not
   after a plain invite.
3. Force an expiry. Delete the room. Restore it.
