# Brief: guest links and a usage log for chat-test

Plain-language brief, 2026-10-17. No code, nothing built. Based on how DevStream shares today (`devstream-test.html` and `devstream/runner/worker.js`) and how TalkBridge logs (`talkbridge/worker-talk.js`, `.github/workflows/device-log.yml`).

## What the owner wants

1. Send someone a link. They open it and chat-test works, with no setup and no keys to enter.
2. A guest cannot pass it on. In guest mode there is no config section at all: double-tapping to open the left rail shows conversations only.
3. Know how chat-test is being used: which room names, which language pairs, spoken or typed, and when. Kept in its own storage with its own viewer, separate from TalkBridge, with no shared database and no "source" column.

Not wanted: usage caps, quotas, cutting off keys, or monitoring of key use.

## Part 1: the guest link

**The owner's side.** Settings, Share, type the guest's name, Create link, copy. The list shows each guest's name and a Copy link button. A "Stop this link" button is optional; it is the undo for a link sent by mistake and it counts nothing.

**The link is a one-time key.** The link carries a code. The first time a guest taps Start, the server hands the credentials to that device exactly once, and the device saves them. The server then locks the code and never serves credentials for it again, to any device, including the same one. The guest can forward the link, but nothing will download from it.

**Guest mode.** After the credentials are saved, chat-test runs normally for the guest, but with no settings gear, no key screens, no share and no export. The keys are used by the app and never shown.

**Why a guest cannot share further.** There is nothing in the app to share with, and the server only lets the owner create links. A forwarded link opens a page but delivers no credentials.

**Details to get right**
- **Redeem on a tap, not on page load.** Chat apps open links in the background to draw a preview. A preview must never use up the single use, so only the Start tap redeems it.
- **Lock only after the device confirms it saved.** If the connection drops mid-download, the link stays valid and the guest can retry. A link burned without delivering would be worse than one leaked.
- **Built-in browsers.** WhatsApp, LINE and similar open links in a built-in browser with its own storage. Credentials saved there will not be in the guest's real Chrome. When the page detects a built-in browser it should say "open this in Chrome" before offering Start.
- **Lost storage means a new link.** Clearing site data or switching phones loses the keys. The owner creates a new link for that guest; the old one stays dead. That is the only recovery.
- **What a guest's device holds.** The keys sit in the guest's browser storage. A technically able guest could read them there. That is the accepted trade-off of a no-setup link, the same as TalkBridge's granted key, which a joiner keeps on disk for 30 days.
- **Not covered.** Nothing stops a guest pasting the link they were sent; it simply delivers nothing. Closing that fully would need device binding, which is not wanted.

## Part 2: the usage log

**What TalkBridge does today.** Phones post log lines to its relay, which keeps the latest 4,000 as plain text. A workflow copies them into `talkbridge/DEVICE-LOG.md` every 30 seconds. It is a debugging aid, includes spoken text, and is not built for counting. Chat-test needs the same idea in a structured form.

**Chat-test's log: one row per event, no message text by default.**
- When (UTC and local time).
- Who: the owner, or the guest's name from the link, plus a device id.
- Room name, and language pair (the two sides).
- Which side, and typed versus spoken.
- Which translator ran and whether it worked; which speech engine ran and whether it worked.
- App build.
- The guest's first "opened link" event is simply the first row of their log. It is not a separate status on the share list.

**What it answers.** Most common room names and language pairs, spoken versus typed, use by hour and day, failure rates by language and engine, and which guests are active.

**Kept separate.** Its own database in its own part of the new server, its own viewer page (`chat-usage.html`, owner only, tables and CSV export), and its own deploy workflow. Nothing shared with TalkBridge.

**In the app.** Events are sent in the background in batches and never slow the chat. If the phone is offline they wait and send later. Guests see a one-line notice that usage counts are recorded.

**Retention (recommended).** Raw events for 90 days, daily totals kept indefinitely.

## What can be reused and what is missing

**Reused:** DevStream's runner pattern (invite codes, a vault of keys on the server, owner-only creation); the existing pattern of deploying a server by GitHub workflow (DevStream and TalkBridge both do); chat-test's own internal events, which already carry most of the fields above.

**Missing:** a new server for chat-test; a way to prove the owner is the owner when creating links (DevStream checks GitHub access; chat-test has no GitHub login); the guest-mode screens; the share panel; the event sender; the viewer; a deploy workflow. A real deploy cannot be tested from the build environment, only the app and server logic against stand-ins.

## Order of work

1. The guest link and guest mode, with the server logic tested against stand-ins.
2. The usage log, its server storage and its viewer.
3. Each ships on its own and is tested on a device before the next.

## Recommendations (change any)

- Prove ownership by reusing DevStream's GitHub-access check; the owner pastes a token once on their own device.
- Keep message text out of the log.
- Keep the "Stop this link" button.
- A separate server for chat-test rather than adding to DevStream's.
- Keep the link single-use as described, with no device binding.

## Open questions

- Should the guest's usage rows show the guest's name, or only an anonymous id? (Recommended: the name the owner typed, since the owner chose it.)
- Should a link expire if it is never opened? (Recommended: yes, after 7 days, because an unopened link is still a live key.)

## Not verified

Everything here is a design. Nothing is built, deployed or tested. Deepgram, Cloudflare and GitHub behaviours cited are from the existing DevStream and TalkBridge code, not from new checks.
