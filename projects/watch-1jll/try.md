## (0) TURN/STAGE LEDGER

| Turn | Date | Status | Note |
|:---|:---|:---|:---|
| 0 | 2026-10-16 | INIT | Plan seeded; target locked to try.html; concept TBD |
| 1 | 2026-10-16 | CONCEPT | STT app defined: continuous web transcription, session cards, copy/download |
| 2 | 2026-10-16 | BUILD | Initial HTML scaffold: Web Speech API, continuous transcription, diagnostics |
| 3 | 2026-10-17 | DIAGNOSE | Bugs reported: transcript duplication and short capture windows. Discussing IndexedDB vs localStorage and device-specific optimizations. |

## (1) RELEASES

1. **R1** — Live STT with save/copy/download (Web Speech API)
2. **R2** — Export formats, search sessions
3. **R3** — TBD

## (2) R1: LIVE STT

### Scope
**IN:**  
• Web Speech API continuous recognition  
• Real-time transcript display with auto-scroll  
• Save session → card appears in history grid  
• Copy current text to clipboard  
• Download session as .txt file  
• localStorage persistence for sessions  
• In-app diagnostics (rec state, errors, confidence)  

**OUT:**  
• Cloud sync/backend  
• Audio file attachment  
• Multiple language simultaneous  
• Offline STT (browser-dependent)  

### Build Gates
• Mic permission granted and status visible in-app  
• Transcription streams live (no stub text)  
• Save creates card instantly visible below main view  
• Copy button fills clipboard with transcript  
• Download produces valid .txt file  
• Runs on Android Chrome and iOS Safari  
• All diagnostics visible without DevTools  

### Backlog
• SpeechRecognition setup with continuous=true  
• Transcript accumulator and display UI  
• Session object model (id, date, text, duration)  
• Card grid renderer for saved sessions  
• Copy utility with feedback toast  
• Download utility (Blob/anchor)  
• Diagnostic panel (recording state, error messages, confidence meter)  
• Mobile-first touch controls (large buttons, safe areas)  

### Active Bugs
- **BUG-001: Transcript duplication** — Final transcript shows repeated phrases (e.g., "why is there why is there", "cuz she was cuz she was"). Cause: `resultIndex` overlap handling or interim-to-final transition duplicates across `onresult` firings. Severity: High (unusable output).
- **BUG-002: Premature capture stop** — Recognition halts after short phrases (~10-30s) despite `continuous=true`. Browser-specific timeout or silence detection. Severity: High (breaks long-form use case).

## (3) FUTURE IDEAS

• Export JSON/SRT subtitle formats  
• Cloud backup / sync  
• Keyword highlighting / search  
• Audio recording alongside text  
• Word-level timestamps  

## (4) IMMUTABLE WORKING RULES

1. **Mobile-first**: Touch-optimized, small-screen layout principal  
2. **In-app diagnostics**: Debug state/logs visible in UI only; DevTools forbidden for verification  
3. **Update-plan-before-code**: Append LEDGER row before writing code; one file write per response  
4. **Read-back verification**: Test on real device after every push  
5. **No stubs**: No placeholder data, fake logic, or hardcoded demo mode  

## (5) DECISION LOG

- **2026-10-16**: Plan established. Build target locked to `projects/watch-1jll/try.html` regardless of any conflicting plan entries. Chat history is non-authoritative.
- **2026-10-16**: Concept selected: Generic STT app using Web Speech API. Features: continuous transcription, session save with card-based history, copy-to-clipboard, download .txt. Persistence via localStorage. No backend required.
- **2026-10-17**: **Duplication Analysis**: Current implementation appends final results using `resultIndex` loop, but `continuous=true` does not guarantee `resultIndex` resets on browser-internal restarts. When the browser pauses/resets the audio service (common on mobile), the SpeechRecognition object may emit results that overlap with previously captured text. Fix options: (A) Hash-based deduplication of final strings, (B) Track last processed resultIndex per event and reject if <= previous, (C) Manual session chunking (restart every N seconds) with overlap removal.
- **2026-10-17**: **Capture Window Analysis**: Chrome/Android stops ~1min silence; iOS Safari stops erratically; some watches (WearOS) kill background audio after seconds. `continuous=true` is advisory, not enforced. Fix: Implement auto-restart on `onend` if user hasn't pressed Stop, with 150ms delay to prevent mic busy errors. Append new chunks to same session buffer.
- **2026-10-17**: **Storage Strategy**: Current localStorage is synchronous (blocks UI), ~5-10MB limit, string-only. For watch devices with limited RAM but need for many sessions, IndexedDB is preferred: asynchronous, ~50MB+ quota, stores Blobs (future audio), structured clone for session objects. Decision: Migrate session storage to IndexedDB (wrapper: idb-keyval or raw IDB) to prevent UI jank during save on low-end watches.
- **2026-10-17**: **Device-Specific UX**: Watch screens (<360px width) need single-column dense cards, max 2 visible lines per session, no floating controls (use bottom sheet). Phones use current layout. Detection via `matchMedia('(max-width: 360px)')` and user-agent heuristics for WearOS/WatchOS.

## (6) APPENDIX

**Authority Order** (highest first):  
1. This plan file (`projects/watch-1jll/try.md`)  
2. Owner instructions in current run  
3. Referenced file blocks (if provided)  
4. Code file content (`projects/watch-1jll/try.html`)  

**Persistence**: Chat history may be partial; this plan is the sole memory that persists between runs.  
**Targets**: Only `projects/watch-1jll/try.md` (plan) and `projects/watch-1jll/try.html` (code) may be written.

## RUN LOG (written by DevStream)
| Date | Tab | Result | What | Commit |
|---|---|---|---|---|
| 2026-10-16 07:24 | Main | built projects/watch-1jll/try.html | Done. | 827f6f1 |
| 2026-10-16 07:38 | Main | built projects/watch-1jll/try.html | Done. | 96fea64 |
| 2026-10-16 07:42 | Main | built projects/watch-1jll/try.html | Done. | 1c296a8 |
| 2026-10-17 01:05 | Main | built projects/watch-1jll/try.html | Done. | 31e17b7 |
| 2026-10-17 01:20 | Main | updated projects/watch-1jll/try.md | Diagnosed duplication and capture bugs; added IndexedDB/device strategy to DECISION LOG | TBD |
