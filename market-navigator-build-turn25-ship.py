#!/usr/bin/env python3
"""Deterministic Market Navigator Turn 25 Ship builder.

Construction ancestor is the owner-authoritative historical artifact:

    market-navigator-turn25-pre-ship.html @ ddf275a8da943cfb8b0e9c5e610649b36424b886
    blob 89095a52e02b06db2b26192099846a5f0015a42d, 127374 bytes,
    sha256 84eb47caade89ca89ccb92281d888f9c6eb6fd3b1415dc18d170dddb46a155ba

Every anchor below is verified against that exact baseline. An earlier execution attempt used anchors
taken from non-baseline markup -- notably `<canvas id="nowChart" aria-label="Market chart"></canvas>`
while the baseline actually contains `<canvas id="nowChart" class="chart"></canvas>`, plus
`startAI(prompt);` and `if(v==='HEALTH')renderHealth();` which likewise do not occur in the baseline.
That produced `chart canvas: expected 1 anchor, found 0`, and the CI job compensated by rewriting this
builder's source at run time. Runtime source rewriting is not a build strategy: the anchors are fixed
here instead, and this script must run unmodified from a clean checkout.
"""
import hashlib
import pathlib
import subprocess
import sys

BASE = "ddf275a8da943cfb8b0e9c5e610649b36424b886"
SRC = "market-navigator-turn25-pre-ship.html"
OUT = "market-navigator-turn25-ship.html"
BASE_BLOB = "89095a52e02b06db2b26192099846a5f0015a42d"
BASE_BYTES = 127374
BASE_SHA256 = "84eb47caade89ca89ccb92281d888f9c6eb6fd3b1415dc18d170dddb46a155ba"
ROOT = pathlib.Path(__file__).resolve().parent
PARTS = ROOT / "market-navigator-turn25-ship-parts"
REJECTED_DONOR = "c3cde56268303d8e2a222012d5a34aee9f26651e"


def die(msg):
    raise SystemExit(f"turn25-ship build failed: {msg}")


def replace_once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        die(f"{label}: expected 1 anchor, found {n}")
    return text.replace(old, new, 1)


def load_baseline():
    """Read the exact historical blob and prove its identity before using it."""
    blob = subprocess.check_output(["git", "rev-parse", f"{BASE}:{SRC}"], text=True).strip()
    if blob != BASE_BLOB:
        die(f"baseline blob mismatch: expected {BASE_BLOB}, got {blob}")
    raw = subprocess.check_output(["git", "cat-file", "blob", BASE_BLOB])
    if len(raw) != BASE_BYTES:
        die(f"baseline byte size mismatch: expected {BASE_BYTES}, got {len(raw)}")
    digest = hashlib.sha256(raw).hexdigest()
    if digest != BASE_SHA256:
        die(f"baseline sha256 mismatch: expected {BASE_SHA256}, got {digest}")
    text = raw.decode("utf-8")
    if "Index Movement Explanation" in text or 'id="indexInfoBtn"' in text:
        die("baseline unexpectedly contains a later Index Explanation implementation")
    return text, blob, digest


def part(name):
    p = PARTS / name
    if not p.is_file():
        die(f"missing build part {p}")
    return p.read_text(encoding="utf-8")


MODAL_AND_REPORT = """<div id="mnxModal" class="mnxModal" hidden role="dialog" aria-modal="true" aria-labelledby="mnxTitle">
 <div class="mnxCard">
  <div class="mnxHead">
   <h2 id="mnxTitle">Index Explanation</h2>
   <span class="mnxHz" id="mnxHorizon"></span>
   <button class="btn" type="button" id="mnxCopy">Copy</button>
   <button class="btn" type="button" id="mnxDownload">Download MD</button>
   <button class="btn" type="button" id="mnxClose" aria-label="Close index explanation">×</button>
   <span class="mnxStatusMsg" id="mnxStatus"></span>
  </div>
  <div class="mnxBody" id="mnxBody"></div>
 </div>
</div>
<section id="nowPrintReport" aria-hidden="true" data-print-surface="now-chart-report"><header><div class="printBrand">Market Navigator Chart Report</div><h1 id="nowPrintTitle"></h1><dl id="nowPrintContext"></dl></header><figure id="nowPrintChartWrap"><img id="nowPrintChart" alt="Frozen Market Navigator chart"></figure><article id="nowPrintExplanation"></article></section>
"""

INFO_BUTTON = (
    '<button id="indexInfoBtn" class="mnxInfo" type="button" '
    'aria-label="Explain index movement" aria-haspopup="dialog" aria-expanded="false">ⓘ</button>'
)


def build():
    base, blob, digest = load_baseline()
    css = part("ship.css")
    js = "".join(part(n) for n in ("ship-a.js", "ship-b.js", "ship-c.js", "ship-d.js", "ship-e.js"))

    # 1. Ship stylesheet, appended to the single existing style block.
    base = replace_once(base, "</style>", css + "\n</style>", "style close")

    # 2. Exactly one info control, inside the existing plot container, above canvas gesture handling.
    base = replace_once(
        base,
        '<canvas id="nowChart" class="chart"></canvas>',
        '<canvas id="nowChart" class="chart"></canvas>' + INFO_BUTTON,
        "chart canvas",
    )

    # 3. Explanation modal and the dedicated NOW report surface, beside the qualified Library report.
    base = replace_once(
        base,
        '<section id="libraryPrintReport"',
        MODAL_AND_REPORT + '<section id="libraryPrintReport"',
        "library print report",
    )

    # 4. Ship layer inside the canonical application closure; no second state model, no wrapper.
    base = replace_once(
        base,
        "boot();window.addEventListener('resize',scheduleGeometry25);})();",
        js + "\nmnxWireWhenReady();\nboot();window.addEventListener('resize',scheduleGeometry25);})();",
        "app closure",
    )

    # 5. AI POV freezes the canonical explanation + model-health snapshot before the provider runs,
    #    whether or not the user ever opened the info control.
    base = replace_once(
        base,
        "await startAI(nowAnalysisState())",
        "await startAI(mnxShipState(nowAnalysisState()))",
        "AI POV launch",
    )

    # 6. The provider evidence projection must carry the governed records through unchanged.
    base = replace_once(
        base,
        "function aiEvidenceState(state){let chart=state.chart||{};return{lineage:state.lineage,",
        "function aiEvidenceState(state){let chart=state.chart||{};return{"
        "governedIndexExplanation:state.indexExplanation||null,"
        "governedModelHealth:state.modelHealth||null,"
        "governedEvidenceContract:'indexExplanation and modelHealth are deterministic governed arithmetic. "
        "Interpret them. Do not recalculate, replace, correct or complete any value in them.',"
        "lineage:state.lineage,",
        "AI evidence projection",
    )

    # 7. NOW Print builds a dedicated report from frozen state instead of printing the viewport.
    base = replace_once(
        base,
        "$('nowPrint').onclick=()=>{$('nowMoreMenu').classList.add('hidden');window.print()}",
        "$('nowPrint').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');"
        "try{await mnxPrintNow()}catch(err){mnxCleanupNowPrint();"
        "$('nowMeta').textContent=`Print unavailable: ${err.message||err}`}}",
        "NOW print action",
    )

    # 8. HEALTH gains Sources | Derived Models without disturbing source-health semantics.
    base = replace_once(base, "if(v==='health')renderHealth()", "if(v==='health')mnxRenderHealth()", "health view")
    base = replace_once(
        base,
        "renderV1();renderHealth();renderLibrary();",
        "renderV1();mnxRenderHealth();renderLibrary();",
        "boot health render",
    )

    # 9. Restore the accepted Turn 19 crosshair inspection contract without changing chart arithmetic.\n    crosshair_old = "tip.innerHTML=`<strong>${esc(sel.label)}</strong><br>${full(q.sourceT||q.t)} · ${valueLine}`;tip.style.display='block';tip.style.left=Math.min(model.W-180,Math.max(6,xx+8))+'px';tip.style.top=Math.max(6,yy-48)+'px'}c.onpointermove=e=>{if(e.pointerType!=='touch')inspect(e,false)};c.onpointerdown=e=>inspect(e,true);c.onpointerleave=()=>{tip.style.display='none';model=paint()};c.ontouchstart=e=>{e.preventDefault();inspect(e,true)};c.ontouchmove=e=>{e.preventDefault();inspect(e,false)}}"\n    crosshair_new = "tip.innerHTML=`<button class=\"tipClose\" data-tip-close aria-label=\"Close inspection\">×</button><strong>${esc(sel.label)}</strong><br>${full(q.sourceT||q.t)} · ${valueLine}`;tip.style.display='block';tip.style.left=Math.min(model.W-180,Math.max(6,xx+8))+'px';tip.style.top=Math.max(6,yy-48)+'px';let tc=tip.querySelector('[data-tip-close]');if(tc)tc.onclick=e=>{e.stopPropagation();tip.style.display='none';model=paint()}}c.onpointermove=e=>{if(e.pointerType!=='touch')inspect(e,false)};c.onpointerdown=e=>inspect(e,true);c.onpointerleave=()=>{};c.ontouchstart=e=>{e.preventDefault();inspect(e,true)};c.ontouchmove=e=>{e.preventDefault();inspect(e,false)}}"\n    base = replace_once(base, crosshair_old, crosshair_new, "crosshair pinned inspection")\n\n    # 10. Build identity.
    base = replace_once(
        base,
        "Market Navigator · Turn 25</strong>",
        "Market Navigator · Turn 25 Ship</strong>",
        "about build identity",
    )

    required = [
        'id="indexInfoBtn"',
        'aria-label="Explain index movement"',
        'id="mnxModal"',
        'id="nowPrintReport"',
        "function mnxRecord(",
        "function mnxManifest(",
        "function mnxModelHealth(",
        "function mnxExplain(",
        "function mnxRecordMarkdown(",
        "function mnxShipState(",
        "function mnxPrintNow(",
        "function mnxRenderHealth(",
        "window.__mnShip25",
        "function mnxWireWhenReady(",
        "governedIndexExplanation:state.indexExplanation",
        "mnx-now-print",
        'data-mnx-health="models"',
    ]
    for token in required:
        if token not in base:
            die(f"missing required ship token: {token}")
    if REJECTED_DONOR in base:
        die("rejected implementation marker present")
    if base.count('id="indexInfoBtn"') != 1:
        die("exactly one info control is required")
    if "window.print()" not in base:
        die("native print invocation missing")

    pathlib.Path(ROOT / OUT).write_text(base, encoding="utf-8")
    out_sha = hashlib.sha256(base.encode("utf-8")).hexdigest()
    print(f"baseline  {BASE} blob {blob} {BASE_BYTES}B sha256 {digest}")
    print(f"candidate {OUT} {len(base.encode('utf-8'))}B sha256 {out_sha}")
    return 0


if __name__ == "__main__":
    sys.exit(build())
