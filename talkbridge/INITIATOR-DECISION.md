# INITIATOR-DECISION.md
**Status: DECIDED 2026-07-02 (owner). Final for pilot. Do not reopen.**

## Decision
An initiator is whoever holds the working API credentials (Deepgram key, Cloudflare TURN credentials, GitHub PAT) on their device. That is the entire designation mechanism.

## Enforcement
- Credentials live only on the initiator's device (localStorage) and are passed to a joiner session-only via the invite payload — never persisted on the joiner's device.
- A joiner therefore cannot create rooms, even by URL manipulation: room creation requires the persisted credentials the joiner never receives.
- Enforced at the data/credential layer, not by hiding buttons.

## Onboarding of new initiators
Real people will not personally set up Deepgram/Cloudflare/GitHub accounts. That is solved by a separate one-tap companion setup tool that hands a new initiator working credentials in one step. **Explicitly out of scope for Turns 07–11.** It does not block Turn 08 or any later turn.

## What this means for Turn 08 Pre-ship (shell merge)
- Initiator (has persisted credentials) → Room List on open.
- Joiner (arrives via link) → lands directly in that room's Thread; no Room List, no Room Creation path, no persisted credentials.
- No new designation UI, no account concept, no changes to the credential mechanism.
