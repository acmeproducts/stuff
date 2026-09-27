from pathlib import Path
import hashlib
SRC=Path("market-navigator-turn28-pre-ship-stage.html")
EXPECTED="544661884a412c57aac08fada4f961012a4bc496"
def git_blob(b): return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
b=SRC.read_bytes()
if git_blob(b)!=EXPECTED: raise SystemExit("Turn 28 pre-ship artifact drift")
print("TURN28 DUAL AXIS ARTIFACT PASS",EXPECTED)
