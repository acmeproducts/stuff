# Wrist relay deploy log

Run 10, commit dc2761fa435d40b98dd2f73469b2052e60ffc8e9, 2026-11-18T11:47:15Z, deploy exit 0, end-to-end exit 0

```
== deploy ==

 ⛅️ wrangler 4.86.0
───────────────────
Total Upload: 59.64 KiB / gzip: 19.63 KiB
Your Worker has access to the following bindings:
Binding              Resource            
env.ROOM (Room)      Durable Object      

Uploaded wrist-relay (2.44 sec)
Deployed wrist-relay triggers (0.63 sec)
  https://wrist-relay.myacctfortracking.workers.dev
Current Version ID: ec0514bc-0acf-40c2-b388-3f2e2432e9ca

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
deploy exit 0
== waiting for https://wrist-relay.myacctfortracking.workers.dev ==
{"ok":true,"v":"w3"}
== end-to-end ==
PASS health answers · {"ok":true,"v":"w3"}
PASS X page is served · 55644 bytes
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
PASS trial part saved · {"ok":true,"parts":42}
PASS trial listed · [{"key":"e2e-1795002434563-check:000","bytes":57}]
PASS trial read back
round trip for first post: 7291 ms total incl. waits
all relay checks passed
```
