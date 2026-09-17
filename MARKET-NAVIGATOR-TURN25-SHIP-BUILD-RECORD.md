# Market Navigator Turn 25 Ship — provenance and build record

Status: CANDIDATE — NOT OWNER ACCEPTED
Governance: `MARKET-NAVIGATOR-MASTER-PLAN.md` · `MARKET-NAVIGATOR-GRAVEYARD.md` · `MARKET-NAVIGATOR-BUILD-PROTOCOL.md` · `MARKET-NAVIGATOR-TURN25-SHIP-CC-TURNOVER.md`

## 1. Owner-authoritative construction ancestor

| Field | Value |
|---|---|
| Commit | `ddf275a8da943cfb8b0e9c5e610649b36424b886` |
| File | `market-navigator-turn25-pre-ship.html` |
| Git blob SHA | `89095a52e02b06db2b26192099846a5f0015a42d` |
| Byte size | 127374 |
| SHA-256 | `84eb47caade89ca89ccb92281d888f9c6eb6fd3b1415dc18d170dddb46a155ba` |
| Commit date | 2026-09-15T23:29:02Z |

Verified clean:

- rejected implementation `c3cde56268303d8e2a222012d5a34aee9f26651e` is **not** an ancestor of `ddf275a`;
- the baseline contains **zero** `ⓘ` / Index Explanation markup;
- the builder re-verifies blob SHA, byte size and SHA-256 on every run and refuses to build otherwise.

Lineage: `owner-accepted ddf275a baseline → governed Turn 25 Ship delta → candidate → complete qualification → deployment → live smoke → owner disposition`.

## 2. Recovery of the failed Turn 25 Ship automation

| Commit | Change | Disposition |
|---|---|---|
| `a798542b256309c97204465afe012c64f5138033` | added `.github/workflows/build-market-navigator-turn25-ship.yml` (46 lines) | superseded |
| `e1c0a0358f4acaba00669571634c3058eaec4a2b` | narrowed the baseline fetch in that workflow | superseded |
| `d647b238a3914664f093708aeda8f3b421f9fd14` | **empty** trigger commit, no file changes | no action |

No attempt modified `market-navigator-turn25-pre-ship.html`, the governance files, or any Market Navigator data artifact. `market-navigator-turn25-ship.html` was never produced and was absent from `main`.

**Root cause of `chart canvas: expected 1 anchor, found 0`.** The builder anchored on
`<canvas id="nowChart" aria-label="Market chart"></canvas>`, but the authoritative baseline contains
`<canvas id="nowChart" class="chart"></canvas>`. Two further anchors, `startAI(prompt);` and
`if(v==='HEALTH')renderHealth();`, likewise do not occur in the baseline. The builder had been written
against non-baseline markup. The workflow then rewrote the builder's own source at run time inside the
job to force the anchors to match, and additionally post-patched the generated HTML.

That runtime source rewriting is failed execution machinery, not architecture. It has been removed. The
builder now carries anchors verified against the exact baseline, and the workflow has been replaced by a
verification job that rebuilds from a clean checkout and requires the committed candidate to be
byte-identical. It never edits the builder and never pushes.

## 3. Candidate

| Field | Value |
|---|---|
| Artifact | `market-navigator-turn25-ship.html` |
| Byte size | 181969 |
| SHA-256 | `c3a90905fc6efa88547ca44ccbed7830c65a17d016a5c826dc1d610a309c7f4f` |
| Builder | `market-navigator-build-turn25-ship.py` |
| Delta source | `market-navigator-turn25-ship-parts/` (`ship.css`, `ship-a.js` … `ship-e.js`) |
| Qualification harness | `market-navigator-turn25-ship-qa.mjs` |
| Reproducibility | byte-identical on clean rebuild |

The delta is applied through nine single-occurrence anchors. No wrapper, iframe, runtime monkey patch,
duplicate state machine or alternate chart/data engine is introduced. The ship layer runs inside the
canonical application closure and reads the canonical `S` state.

## 4. Proven production index construction

Read from `data/market-backend/derived-index-definition.json` (`display_contract`), not assumed:

```
oriented_index_i = 100 + direction_i * ((value_now_i / value_t0_i) - 1) * 100
index            = arithmetic mean of oriented_index over components AVAILABLE at the horizon
weighting        = "equal"
```

Therefore the governed contribution of component *i* to index movement is
`contribution_i = (oriented_index_i - 100) / componentsUsed`, with weight `1/n` renormalised over
available components. Components excluded by the governed ratio-eligibility rule are omitted, disclosed
with their reason, and never estimated.

Independent replication over all 21 index/horizon blocks (3 indices × 7 horizons), computed outside the
application and compared against the in-app records:

| Check | Worst error |
|---|---|
| `orientedIndex` vs governed component formula | 0.0 |
| published index value vs mean of oriented values | 2.8e-14 |
| Σ component contributions vs index movement | 2.3e-13 |
| terminal curve point vs published index value | 0.0 |

## 5. Qualification result

`node market-navigator-turn25-ship-qa.mjs` — real Chromium, real input events, real IndexedDB, real
provider interception. 17/17 gates, 387 checks.

Reproduce with:

```
npm install --no-save playwright@1.49.1 marked@12.0.2 dompurify@3.1.6
node market-navigator-turn25-ship-qa.mjs
```

## 6. Defect found and fixed during qualification

The explanation modal and the NOW report surface are parsed after the application script (they sit
beside the qualified Library report, outside `.app`, so print media can reveal them while the app is
hidden). Wiring them synchronously bound nothing: the info control opened the modal but Copy, Download
MD, the close button and the backdrop were all inert. Wiring now waits for the document to finish
parsing, and `mnxWire` throws if either surface is missing. The harness proves each control
individually rather than accepting that the modal opened.

## 7. Disposition

CI green, merge, deployment and this qualification record do **not** constitute owner acceptance. The
candidate remains a candidate until the owner tests it and says otherwise.
