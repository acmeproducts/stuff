# bridge.html transcript pipeline analysis

Date: 2026-04-07

## Scope reviewed
- Speech recognition lifecycle (`startSubtitles`, `onresult`, `onend`, `onerror`)
- Translation path (`translate`)
- Subtitle render path (`showSubtitle`)
- Transcript state and persistence (`addTranscriptEntry`, `saveTranscriptToStorage`, `renderTranscript`)

## Highest-impact opportunities

### 1) Move transcript rendering to incremental DOM updates (avoid full `innerHTML` rebuild)
**Current behavior**
- Every `addTranscriptEntry` call triggers `renderTranscript()`.
- `renderTranscript()` rebuilds up to `MAX_TRANSCRIPT_RENDER` rows as one large HTML string, then sets `innerHTML` and scrolls to bottom.

**Impact**
- Extra layout + paint work on every final utterance.
- Avoidable jank on lower-end mobile devices during active calls.

**Recommendation**
- Keep a small append-only renderer:
  - Create and append only the newest row when a new entry arrives.
  - Rebuild full list only when opening overlay, toggling expanded state, or trimming old entries.
- Use a `DocumentFragment` for batch inserts when a full refresh is needed.

---

### 2) Reduce recognition restart churn (debounced restart + state guard)
**Current behavior**
- Recognition uses `continuous=false` and immediately restarts on every `onend`.
- Errors (except `not-allowed`) schedule another retry after 800 ms.

**Impact**
- Excess start/stop cycles can increase CPU/battery and occasionally duplicate short segments around boundary transitions.

**Recommendation**
- Add a restart backoff strategy with jitter (`300ms`, `600ms`, max `2s`) for repeated `onend` / recoverable `onerror` loops.
- Add a monotonic session token (generation id) to ignore stale callbacks from older recognizer instances.

---

### 3) Improve duplicate suppression with normalized hashing and confidence window
**Current behavior**
- De-dupe only compares exact string equality for final text within 2.5s.

**Impact**
- Near-identical outputs with minor punctuation/casing differences still pass through.
- Can inflate transcript and create noisy subtitles.

**Recommendation**
- Canonicalize before dedupe:
  - lowercase
  - normalize whitespace
  - strip trailing punctuation and filler artifacts
- Compare canonical fingerprint + timing window.
- Optionally ignore finals under a minimum length unless confidence rises on next event.

---

### 4) Make translation resilient and faster (timeouts + fallback order)
**Current behavior**
- Uses a single fetch endpoint (`api.mymemory.translated.net`) with no explicit timeout.
- If slow, translated subtitle and transcript completion are delayed.

**Impact**
- Latency spikes directly affect perceived subtitle speed.
- Single-provider dependency reduces availability and consistency.

**Recommendation**
- Add `AbortController` timeout (e.g., `1200–1800ms`) and fail fast to source text.
- Emit source subtitle immediately; update translated subtitle asynchronously when ready.
- Add secondary provider fallback (if available) after timeout/failure.
- Add short TTL + max-size LRU cache (current map is unbounded over long sessions).

---

### 5) Batch localStorage transcript writes
**Current behavior**
- Every new transcript entry writes full transcript JSON to localStorage synchronously.

**Impact**
- Synchronous main-thread blocking during active conversation.

**Recommendation**
- Debounce persistence (e.g., every `1–2s` or every `N` entries) and flush on call end / tab hidden.
- Persist deltas where possible instead of full-array rewrite.

---

## Medium-impact opportunities

### 6) Remove repeated `querySelectorAll` loop in subtitle trimming
**Current behavior**
- `showSubtitle()` repeatedly queries `.subtitle-line:not(.interim):not(.fading)` inside a while loop.

**Impact**
- Multiple selector scans per insert.

**Recommendation**
- Track non-interim subtitle nodes in an array/queue and pop oldest without requerying DOM.

### 7) Protect translation concurrency with queue limits
**Current behavior**
- Every final result starts translation immediately.

**Impact**
- Bursts can create many in-flight requests and out-of-order completions.

**Recommendation**
- Cap in-flight translations (e.g., 2–3).
- Queue excess or collapse very old pending items.
- Include sequence id in subtitle relay payload to preserve ordering.

### 8) Improve language detection quality
**Current behavior**
- `detectLang` is script/range based and defaults to fallback language.

**Impact**
- Mixed-script or Latin-script multilingual content can be mislabeled.

**Recommendation**
- Prefer explicit recognizer locale as source-of-truth for local speaker.
- Use detection only as secondary hint; attach confidence field.

### 9) Avoid repeated expensive debug logging in hot path
**Current behavior**
- `speech_result` logs interim/final slices for every event.

**Impact**
- JSON stringify + DOM append in debug panel can increase overhead in active sessions.

**Recommendation**
- Add log sampling or log level gate in production call flow.
- Skip per-event logs unless debug overlay is open.

---

## Accuracy-specific upgrades

1. **Interim stabilization threshold**
   - Require interim text to be stable for `150–250ms` before rendering to reduce flicker.

2. **Punctuation post-processing**
   - Add lightweight sentence boundary cleanup before translation and transcript persistence.

3. **Confidence-aware commit policy**
   - If available from recognizer alternatives, keep top candidate but gate very short/low-confidence finals.

4. **Remote subtitle reconciliation**
   - If partner sends source + translated text, display both with deterministic ordering and timestamp normalization.

---

## Suggested implementation order

1. Incremental transcript rendering + debounced storage writes.
2. Translation timeout + fallback + bounded cache.
3. Restart backoff/session token for recognizer lifecycle.
4. Improved dedupe canonicalization.
5. Queue-limited translation concurrency and sequence ordering.

---

## Quick wins (low-risk)

- Debounce `saveTranscriptToStorage`.
- Gate `speech_result` debug logs by log level.
- Add translation timeout with source-text immediate display.
- Replace repeated subtitle `querySelectorAll` with simple queue.
