# Chatlink Turn 01 pre-base

Target: `chatlink-turn01-pre-base.html`. Build ID: `chatlink-turn01-pre-base-r1`.

This candidate starts from the accepted chat-lab, with the conversation manager
inside the same HTML. The donor programs remain unchanged.

## Run

```sh
npm --prefix tests/chatlink install
npm --prefix tests/chatlink run build
npm --prefix tests/chatlink test
```

Tests default to installed Microsoft Edge. Install the matching Playwright browser
and adjust the channel to exercise another Chromium browser. The reference run uses
the bundled Playwright 1.62.1 runtime and Edge 153 on Windows; it does not claim
physical iOS/Safari coverage or an external service/account availability test.
The root repository's existing dictionary files are used.

`build.cjs` verifies the accepted lab blob SHA before patching named boundaries.
`portal.html`, `portal.css`, and `portal.js` are build sources embedded into the
single target HTML; the running application does not fetch them.

## Delivered scope

- South-only bottom-left menu, test.html-style left rail, fixed in-rail +.
- Create/cancel, select, rename, independent language pairs and appearance.
- Per-room retained histories, drafts, scroll positions, trash/restore and purge.
- Legacy chat-admin/lab import with a preview, stable imported IDs, unreadable
  record reporting and no writes/deletion to the old localStorage keys.
- Local IndexedDB retention without the lab's 300-message truncation.
- Paginated rendering, not paginated deletion; submitted original text saves
  before network normalization/translation. Interrupted translations can retry.
- Captured room/message context for asynchronous results; no cross-room TTS.
- Original speech and normalization engine source, with an external lifecycle
  guard preventing stale microphone-permission results from starting a new room.
- Local device speech-key/haptic settings, basic JSON export excluding keys.
- Exclusive Web Lock writer: another tab is read-only until the first closes and
  the second is reloaded. Takeover UI is deliberately deferred.

The management interface is English in this candidate. Existing chat-lab language
input behavior remains; no new Chinese support is introduced. Owner-only denotes
the South UI position, not identity authentication or a PIN lock.

## Focused-scope decisions

The accepted follow-up reduced Turn 01 to the usable room portal. Advanced backup
conflict handling, backup restore, multi-tab takeover, and account/sync features
are deferred. Basic export is provided so retained data can be copied out.

Storage v1 keeps metadata, messages, drafts and view state in one record per room,
with atomic read/modify/write transactions. `rooms` and `state` are the only stores.
This is a deliberate simplification of the plan's proposed separate stores;
async result writes merge against the current room record rather than replacing
it from stale view state. Rendering is capped to a window, storage is not capped.
Legacy import IDs use `legacy:<id>` and existing IDs are skipped on repeat import.
No continuous synchronization with donor apps is implied.

The owner rail is bounded to the South half. On short screens the active keyboard
pane expands to keep English swipe keys reachable; management still opens in the
bottom half. Opening management or hiding the document stops capture/playback;
closing it never starts audio automatically.

## Validation

`test.cjs` covers 13 integration scenarios: first-run/cancel/reload, multiple rooms,
rename/trash/restore, late translation isolation, repeat import and 1,000-message
retention across 20 rooms, both-side swipe/predictions, second-tab exclusion,
compact keyboard geometry, synthetic microphone PCM with final transcript delivery,
translation and dialect/code-switch normalization, delayed microphone permission,
reload/retry, late result after purge, quota-failure recovery and responsive rail.
Several related assertions are grouped into each scenario.

`lab-parity.cjs` runs the existing 32 keyboard tests with only target-page and
room-creation fixture setup changed. Engine and speech/ownership sections must
match the accepted lab source. External translation/STT responses are controlled;
the synthetic browser microphone exercises the actual audio transport pipeline.
No real user credential, conversation or microphone recording is needed.

## Deployment and rollback

Publish the new target at the repository root. Open it without s/n language
overrides; each room owns its pair. The same origin/browser reuses the existing
Deepgram setting. No donor file or donor URL is redirected.

Rollback by opening the passed chat-lab. Old localStorage data stays untouched;
new Chatlink-only histories remain in IndexedDB and can be exported from Chatlink.
Clearing browser/site data deletes local conversations. Different browser profiles
do not share conversations or credentials.
