# Wrist relay deploy log

Run 4, commit f1d387d7e9d077811079adf439366f52d8ea4164, 2026-11-17T12:54:08Z, deploy exit 0, end-to-end exit 1

```
== deploy ==

 ⛅️ wrangler 4.86.0
───────────────────
Total Upload: 40.51 KiB / gzip: 13.91 KiB
Your Worker has access to the following bindings:
Binding              Resource            
env.ROOM (Room)      Durable Object      

Uploaded wrist-relay (1.94 sec)
Deployed wrist-relay triggers (0.53 sec)
  https://wrist-relay.myacctfortracking.workers.dev
Current Version ID: cff2b214-acbd-4856-8533-c02d27e37ace

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
deploy exit 0
== waiting for https://wrist-relay.myacctfortracking.workers.dev ==
{"ok":true,"v":"w2"}
== end-to-end ==
PASS health answers · {"ok":true,"v":"w3"}
PASS X page is served · 36064 bytes
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
<anonymous_script>:1
not found
 ^

SyntaxError: Unexpected token 'o', "not found" is not valid JSON
    at JSON.parse (<anonymous>)
    at parseJSONFromBytes (node:internal/deps/undici/undici:5880:19)
    at successSteps (node:internal/deps/undici/undici:5861:27)
    at fullyReadBody (node:internal/deps/undici/undici:4753:9)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async consumeBody (node:internal/deps/undici/undici:5870:7)
    at async file:///home/runner/work/stuff/stuff/wrist/relay/e2e.mjs:54:12

Node.js v20.20.2
```
