from pathlib import Path
import hashlib
SRC=Path("market-navigator-turn28-base.html")
OUT=Path("market-navigator-turn28-pre-ship-stage.html")
EXPECTED_BLOB="066427f63dd635a147627bc7ea26d5e02b90608f"
def git_blob(b):
    return hashlib.sha1(f"blob {len(b)}\0".encode()+b).hexdigest()
raw=SRC.read_bytes()
if git_blob(raw)!=EXPECTED_BLOB:
    raise SystemExit("28 pre-ship build blocked: base blob mismatch")
s=raw.decode()
old="""function setNowFooter(w,mode='indexed'){let text=mode==='dual'?'Native Y1 + Y2':mode==='native'?'Native Y1':'Indexed 100';$('nowMeta').innerHTML=`<span>MN-PERSISTENT-1.0.0</span><span class="footerSep">|</span><span>${w.startLabel} → ${w.endLabel}</span><span class="footerSep">|</span><select id="nowRepresentation" aria-label="Chart representation"><option selected value="${mode}">${text}</option></select>`}"""
new="""function setNowFooter(w,mode='indexed'){let text=mode==='dual'?'Native Y1 + Y2':mode==='native'?'Native Y1':'Indexed 100',display=S.indexDisplay||'fixed';$('nowMeta').innerHTML=`<span>MN-PERSISTENT-1.0.0</span><span class="footerSep">|</span><span>${w.startLabel} → ${w.endLabel}</span><span class="footerSep">|</span><select id="nowRepresentation" aria-label="Chart representation"><option selected value="${mode}">${text}</option></select><select id="nowIndexDisplay" aria-label="Index display"><option value="fixed" ${display==='fixed'?'selected':''}>Fixed</option><option value="rebase" ${display==='rebase'?'selected':''}>Horizon</option></select>`;$('nowIndexDisplay').onchange=()=>{S.indexDisplay=$('nowIndexDisplay').value;renderNow()}}"""
if s.count(old)!=1:
    raise SystemExit(f"28 pre-ship build blocked: footer anchor count {s.count(old)}")
s=s.replace(old,new,1)
OUT.write_text(s)
print("TURN28 PRE-SHIP BUILD PASS",git_blob(OUT.read_bytes()))
