# Wrist relay deploy log

Run 17, commit 999c56b952ce63d309c68db4245e4ef2ae16a205, 2026-11-19T10:49:39Z, deploy exit 0, end-to-end and signals exit 0

```
== deploy ==

 ⛅️ wrangler 4.86.0
───────────────────
Total Upload: 209.10 KiB / gzip: 68.01 KiB
Your Worker has access to the following bindings:
Binding              Resource            
env.ROOM (Room)      Durable Object      

Uploaded wrist-relay (1.61 sec)
Deployed wrist-relay triggers (0.65 sec)
  https://wrist-relay.myacctfortracking.workers.dev
Current Version ID: 92ced0bb-360e-4bf9-9b1f-9949ce1c80a8

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
deploy exit 0
== waiting for https://wrist-relay.myacctfortracking.workers.dev ==
{"ok":true,"v":"w7"}
{"ok":true,"v":"w8"}
== end-to-end ==
PASS health answers · {"ok":true,"v":"w8"}
PASS the Lab is served at / · 126790 bytes
PASS the shared signals file is served as JavaScript · text/javascript; charset=utf-8 31979 bytes
PASS the Lab loads the shared signals file before its own script · 126790 bytes
PASS X is served at /x · 43167 bytes
PASS X can write a line to the log
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
PASS trial part saved · {"ok":true,"parts":103}
PASS trial listed · [{"key":"e2e-1795085374719-check:000","bytes":57}]
PASS trial read back
PASS older watch build: the page pairs without a secret · {"ok":true,"legacy":true,"lastDiag":0,"lastSeen":1795085374710,"v":"w8"}
PASS page says Watch off: the watch is told once · {"ok":true,"pages":1,"raw":0,"sleep":1}
PASS page sends a buzz pattern: the watch gets it once · {"ok":true,"pages":1,"raw":0,"buzz":[0,40,60,40]}
PASS a bad buzz pattern is dropped
PASS watch with a key is accepted · {"ok":true,"pages":0,"raw":0}
PASS same code without the key is refused
PASS same code with a wrong key is refused
PASS a page cannot listen without a secret
PASS pairing is refused while the watch has no window open · {"ok":false,"why":"Open Wrist on the watch to pair this browser"}
PASS window open: the page gets a secret and the last-logged time · {"ok":true,"k":"ef50d75e474da971e3db6cbbdfa9f49d3736c1ef","lastDiag":1795085377135,"lastSeen":1795085377511,"v":"w8"}
PASS the same window cannot be used twice
PASS the page listens with its secret
PASS a made-up secret is refused
PASS the secret still works on a later visit, with no window
PASS report: the session, how it ended, battery at both ends, the panel snapshot · {"ok":true,"hard":1,"lastDiag":1795085377135,"sessions":[{"start":1795085376135,"end":1795085378227,"up":10,"bat0":80,"bat1":79,"ln":{"bt":4},"n":4,"gap":432,"b":"e2e","endWhy":"page"}],"snaps":[{"at":1795085377135,"d":"
PASS report is refused without the secret
PASS repeated wrong guesses are cut off · last status 429
round trip for first post: 9469 ms total incl. waits
all relay checks passed
== signals engine ==

all passed
signals engine: 65 passed, exit 0
```
