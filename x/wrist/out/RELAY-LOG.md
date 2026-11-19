# Wrist relay deploy log

Run 14, commit b79dc9a44c8ca133b125c3eaae6e794745ebaec0, 2026-11-19T05:57:35Z, deploy exit 0, end-to-end and signals exit 0

```
== deploy ==

 ⛅️ wrangler 4.86.0
───────────────────
Total Upload: 183.49 KiB / gzip: 59.70 KiB
Your Worker has access to the following bindings:
Binding              Resource            
env.ROOM (Room)      Durable Object      

Uploaded wrist-relay (1.76 sec)
Deployed wrist-relay triggers (0.57 sec)
  https://wrist-relay.myacctfortracking.workers.dev
Current Version ID: fff3e767-b6c0-40cd-81c4-351c261a6b51

Cloudflare collects anonymous telemetry about your usage of Wrangler. Learn more at https://github.com/cloudflare/workers-sdk/tree/main/packages/wrangler/telemetry.md
deploy exit 0
== waiting for https://wrist-relay.myacctfortracking.workers.dev ==
{"ok":true,"v":"w6"}
== end-to-end ==
PASS health answers · {"ok":true,"v":"w6"}
PASS the Lab is served at / · 108778 bytes
PASS the shared signals file is served as JavaScript · text/javascript; charset=utf-8 23763 bytes
PASS the Lab loads the shared signals file before its own script · 108778 bytes
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
PASS trial part saved · {"ok":true,"parts":79}
PASS trial listed · [{"key":"e2e-1795067849080-check:000","bytes":57}]
PASS trial read back
PASS older watch build: the page pairs without a secret · {"ok":true,"legacy":true,"lastDiag":0,"lastSeen":1795067849068,"v":"w6"}
PASS page says Watch off: the watch is told once · {"ok":true,"pages":1,"raw":0,"sleep":1}
PASS page sends a buzz pattern: the watch gets it once · {"ok":true,"pages":1,"raw":0,"buzz":[0,40,60,40]}
PASS a bad buzz pattern is dropped
PASS watch with a key is accepted · {"ok":true,"pages":0,"raw":0}
PASS same code without the key is refused
PASS same code with a wrong key is refused
PASS a page cannot listen without a secret
PASS pairing is refused while the watch has no window open · {"ok":false,"why":"Open Wrist on the watch to pair this browser"}
PASS window open: the page gets a secret and the last-logged time · {"ok":true,"k":"150da14e57b56c1e70807d1b85d8cf7ee336689d","lastDiag":1795067852097,"lastSeen":1795067852663,"v":"w6"}
PASS the same window cannot be used twice
PASS the page listens with its secret
PASS a made-up secret is refused
PASS the secret still works on a later visit, with no window
PASS report: the session, how it ended, battery at both ends, the panel snapshot · {"ok":true,"hard":1,"lastDiag":1795067852097,"sessions":[{"start":1795067851097,"end":1795067853795,"up":10,"bat0":80,"bat1":79,"ln":{"bt":4},"n":4,"gap":706,"b":"e2e","endWhy":"page"}],"snaps":[{"at":1795067852097,"d":"
PASS report is refused without the secret
PASS repeated wrong guesses are cut off · last status 429
round trip for first post: 11980 ms total incl. waits
all relay checks passed
== signals engine ==

all passed
signals engine: 42 passed, exit 0
```
