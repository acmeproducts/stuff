## (0) TURN/STAGE LEDGER

| Turn | Date | Status | Note |
|:---|:---|:---|:---|
| 0 | 2026-10-16 | INIT | Plan seeded; target locked to try.html; concept TBD |
| 1 | 2026-10-16 | CONCEPT | STT app defined: continuous web transcription, session cards, copy/download |
| 2 | 2026-10-16 | BUILD | Initial HTML scaffold: Web Speech API, continuous transcription, diagnostics |

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
