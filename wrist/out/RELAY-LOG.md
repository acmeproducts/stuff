# Wrist relay deploy log

Run 6, commit 62e9e9f8fe8e094d11de5106ba9a1daa20896036, 2026-11-17T13:41:35Z, deploy exit 0, end-to-end exit 0

```
== deploy ==

 ⛅️ wrangler 4.86.0
───────────────────
Total Upload: 54.39 KiB / gzip: 18.02 KiB
Your Worker has access to the following bindings:
Binding              Resource            
env.ROOM (Room)      Durable Object      

Uploaded wrist-relay (3.37 sec)
Deployed wrist-relay triggers (0.64 sec)
  https://wrist-relay.myacctfortracking.workers.dev
Current Version ID: eb71fb65-d60f-4b2d-9478-0699eebfe841

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
deploy exit 0
== waiting for https://wrist-relay.myacctfortracking.workers.dev ==
{"ok":true,"v":"w3"}
== end-to-end ==
PASS health answers · {"ok":true,"v":"w3"}
PASS X page is served · 50278 bytes
PASS bad code is refused
PASS page connects
PASS watch post accepted, one page listening · {"ok":true,"pages":1,"raw":0}
PASS page received all three, in order · {"t":"swipe","d":"left","seq":1} | {"t":"tap","seq":2} | {"t":"scroll","r":3,"seq":3}
PASS another code heard nothing
PASS ping answered
PASS log holds all three events with the code masked · 4 lines for this code
PASS page asked for raw: the watch is told · {"ok":true,"pages":1,"raw":1}
PASS raw rows reach the page · 1 new messages
PASS raw rows are not written to the log
PASS page stops asking: the watch is told
PASS trial part saved · {"ok":true,"parts":4}
PASS trial listed · [{"key":"e2e-1794922894395-check:000","bytes":57}]
PASS trial read back
round trip for first post: 7580 ms total incl. waits
all relay checks passed
```
