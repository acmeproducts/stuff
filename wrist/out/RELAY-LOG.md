# Wrist relay deploy log

Run 1, commit 6b4357eaed53c61652988594194aab1d51fc173b, 2026-11-16T13:29:38Z, deploy exit 0, end-to-end exit 1

```
== deploy ==

 ⛅️ wrangler 4.86.0
───────────────────
Total Upload: 13.67 KiB / gzip: 5.58 KiB
Your Worker has access to the following bindings:
Binding              Resource            
env.ROOM (Room)      Durable Object      

Uploaded wrist-relay (1.20 sec)
Deployed wrist-relay triggers (0.61 sec)
  https://wrist-relay.myacctfortracking.workers.dev
Current Version ID: f0ae6142-8474-43a1-9589-639c14c537e9

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
deploy exit 0
== waiting for https://wrist-relay.myacctfortracking.workers.dev ==
curl: (22) The requested URL returned error: 404
{"ok":true,"v":"w1"}
== end-to-end ==
PASS health answers · {"ok":true,"v":"w1"}
PASS X page is served · 10526 bytes
PASS bad code is refused
PASS page connects
PASS watch post accepted, one page listening · {"ok":true,"pages":1}
PASS page received all three, in order · {"t":"swipe","d":"left","seq":1} | {"t":"tap","seq":2} | {"t":"scroll","r":3,"seq":3}
PASS another code heard nothing
PASS ping answered
FAIL log holds the events with the code masked · 1 lines
round trip for first post: 2021 ms total incl. waits
1 relay checks FAILED
```
