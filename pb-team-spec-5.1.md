# TalkBridge ↔ Phrasebook Pipeline — 5.1 Specification
## From: TalkBridge Client Team
## To: Phrasebook Pipeline Team
## Status: Pending your sign-off on Section 5

---

## Background

This document extends the v1.0.0 Alignment Confirmation (already agreed). TalkBridge 5.0 shipped with:

- Translation Memory Tier 1 (exact fingerprint match, conf ≥ 0.90 + usage ≥ 5 → API bypass)
- 2D Semantic Quick Ring implemented — waiting on CDN cards with semantic fields
- Telemetry: `usage_hit` + `clarify` events, batched in localStorage
- GitHub PAT write-back path for host users

**5.1 requires two things from you:**
1. CDN phrasebook files updated with semantic fields (Section 3)
2. A POST endpoint for telemetry delivery (Section 4)

A standalone interactive mockup (`pb-mockup.html`) accompanies this document. Open it in any browser — no network required — to see the exact 2D and 3D UX your data will power.

---

## Section 1 — What We Built (5.0 Client State)

### Translation Memory

```
TM Tier 1 (LIVE): fingerprint exact match
  → confidence = usage / (usage + corrections × 3)
  → threshold: confidence ≥ 0.90 AND usage ≥ 5
  → on hit: skip API entirely, use stored target text
  → logged as: tm_hit {key, conf, usage, pair}

TM Tier 2 (PENDING): fuzzy match, similarity ≥ 0.85
  → inject stored target as translation hint
  → blocked on: benchmarking, low priority for 5.1

TM Tier 3 (PENDING): glossary injection
  → inject key term pairs into API call
  → blocked on: nothing, medium priority for 5.1
```

### 2D Quick Ring

Implemented in `bridge-post-ship-cc.html`. Activated when a user taps a phrase tag badge in the transcript.

- Center node: tapped card
- Neighbor nodes: `card.relatedIntents[]` resolved via `intentId` lookup (O(1))
- r = 75px, max 5 neighbors (per agreed cap)
- Single tap neighbor → re-center ring
- Double tap / Enter → insert source text, emit `usage_hit` with `entry_point: "quick_ring"`

**Currently non-functional** because no CDN cards carry `intentId` or `relatedIntents` fields.

### 3D Semantic Graph

Full-screen exploration mode. Designed, not yet shipped. See `pb-mockup.html` for the exact UX.

Requires from you: `parentCategory` per card (for color coding and layout), `semanticRelationships.similarityScores` (for edge thickness).

### Telemetry

Two event types, batched locally, flushed to localStorage on session end:
- `usage_hit` — on Quick Ring use, autocomplete select, or graph select
- `clarify` — on post-send correction

On session end (`hangUp()`): if a PB telemetry endpoint is configured, POST the full batch. Fallback: stays in localStorage if no endpoint.

---

## Section 2 — What We Are Building (5.1)

| Item | Status | Blocked on |
|------|--------|-----------|
| Telemetry POST delivery | Code complete, awaiting endpoint | Ask 5 below |
| 2D Quick Ring (data) | Code complete, awaiting CDN cards | Schema Section 3 |
| 3D Semantic Graph | Mockup done, implementation pending | Schema Section 3 + your sign-off on mockup |
| TM Tier 2 (fuzzy) | Not started | Internal — no ask of you |
| TM Tier 3 (glossary) | Not started | Internal — no ask of you |
| CDN refresh detection (ETag) | Not started | Internal — no ask of you |

---

## Section 3 — Extended Card Schema v1.2

The following fields must be present on **every card** in every compiled CDN file starting with 5.1 delivery.

### New fields (additions to v1.1)

```json
{
  "intentId":              "intent-th-001",
  "primaryTag":            "greetings",
  "parentCategory":        "social",
  "fingerprint":           "hello",
  "relatedIntents":        ["intent-th-002", "intent-th-003"],
  "semanticRelationships": {
    "relatedIntents":      ["intent-th-002", "intent-th-003"],
    "similarityScores":    {
      "intent-th-002":     0.91,
      "intent-th-003":     0.84
    }
  }
}
```

### Field rules

| Field | Type | Rule |
|-------|------|------|
| `intentId` | string | Globally unique. Stable across recompiles — never changes if source text is unchanged. Format: `intent-{tgt}-{nnn}` (e.g. `intent-th-042`) |
| `primaryTag` | string | One value from your controlled vocabulary. Used for Quick Ring badge labels and 3D graph node grouping |
| `parentCategory` | string | 3–8 distinct values per lang pair. We use this to color-code 3D graph nodes and lay out clusters. Provide the full vocabulary list in Ask 6 |
| `fingerprint` | string | Normalized source text hash — stable across recompiles (confirmed in v1.0 spec, carried forward) |
| `relatedIntents` | array | Max 5 entries, ordered by similarity score descending. This is a hard constraint — do not exceed 5 |
| `semanticRelationships.relatedIntents` | array | Duplicate of top-level `relatedIntents` — kept for forward compatibility with 3D graph edge rendering |
| `semanticRelationships.similarityScores` | object | `{intentId: score}` — optional but recommended. Enables edge thickness in 3D graph. Scores 0.0–1.0 |

### Full card example (v1.2)

```json
{
  "id": "pb-th-001",
  "intentId": "intent-th-001",
  "sourceLang": "en",
  "targetLang": "th",
  "source": "Hello",
  "target": "สวัสดี",
  "notes": "",
  "tags": ["essential", "greetings"],
  "primaryTag": "greetings",
  "parentCategory": "social",
  "fingerprint": "hello",
  "confidence": 0.95,
  "relatedIntents": ["intent-th-002", "intent-th-003"],
  "semanticRelationships": {
    "relatedIntents": ["intent-th-002", "intent-th-003"],
    "similarityScores": {
      "intent-th-002": 0.91,
      "intent-th-003": 0.84
    }
  },
  "backtranslate": {
    "sourceLang": "th",
    "targetLang": "en",
    "inputText": "สวัสดี",
    "resultText": "Hello",
    "verdict": "good",
    "contentHash": "Hello||สวัสดี",
    "updatedAt": 1774111157235
  },
  "catalogIds": ["cat-th"],
  "savedBy": "pipeline",
  "createdAt": 1774111157235,
  "updatedAt": 1774111157235
}
```

---

## Section 4 — Telemetry Delivery (5.1)

### What we send

On session end, we POST a batch payload:

```
POST {your_endpoint}/ingest
Content-Type: application/json
Authorization: Bearer {token}
```

```json
{
  "client": "talkbridge",
  "version": "5.1",
  "events": [
    {
      "event": "usage_hit",
      "ts": 1716000000000,
      "session_id": "abc123xyz",
      "intent_id": "intent-th-001",
      "fingerprint": "hello",
      "src_lang": "en",
      "tgt_lang": "th",
      "entry_point": "quick_ring",
      "context": "live_call"
    },
    {
      "event": "clarify",
      "ts": 1716000001000,
      "session_id": "abc123xyz",
      "intent_id": "intent-th-004",
      "fingerprint": "iwouldlikethisdish",
      "src_lang": "en",
      "tgt_lang": "th",
      "before_source": "I would like this dish",
      "before_target": "ขอเมนูนี้",
      "after_source": "I would like this dish",
      "after_target": "ขอสั่งเมนูนี้ครับ",
      "context": "live_call"
    }
  ]
}
```

### Delivery behavior

- Batched per session, not real-time
- On success (HTTP 200/201): localStorage buffer cleared
- On failure: events remain in localStorage, retried on next session end
- No events are sent for joiner-side users (privacy constraint)
- Max 500 events per lang pair in local buffer (FIFO eviction)

### `entry_point` values
`"autocomplete"` | `"quick_ring"` | `"graph"`

### `context` values
`"live_call"` — correction made under call pressure (weight ≥ 2× in your confidence model)
`"review"` — correction made in overlay outside an active call

### `session_id`
Unique per browser session (not per room). Cluster all events from one session together to detect systematic phrasebook gaps.

---

## Section 5 — The New Asks

These extend the four original asks from the v1.0.0 alignment document (all four of which were confirmed).

---

**Ask 5 — Telemetry POST endpoint + auth token**

Provide:
- `endpoint`: a URL we can POST to (e.g. `https://pb-ingest.yourinfra.io`)
- `token`: a Bearer token we store in the credentials panel (host-only, never sent for joiners)

We will add these to our credentials panel under "PB Telemetry endpoint" and "PB Telemetry token". Both stored in localStorage (`tb_pb_tel_ep`, `tb_pb_tel_tok`) — same security model as the GitHub PAT.

If you are not ready to expose a live endpoint, provide a staging URL so we can verify delivery is working end-to-end. We accept 200 or 201 as success.

---

**Ask 6 — `parentCategory` vocabulary per lang pair**

We need the complete list of `parentCategory` values for each lang pair you compile. We use these to:
1. Color-code nodes in the 3D semantic graph
2. Position clusters spatially (each category gets a region of the sphere)
3. Filter the overlay by category (future)

Provide a simple object, e.g.:
```json
{
  "en-th": ["social", "dining", "travel", "safety", "shopping", "health", "accommodation", "numbers"],
  "en-es": ["social", "dining", "travel", "safety", "shopping", "health", "directions", "numbers"]
}
```

We do not need the same vocabulary across all lang pairs — each can differ. We will assign a color to each value at runtime (up to 8 per pair, deterministic hash assignment if more than 8).

---

**Ask 7 — `intentId` format confirmation**

We use `intentId` as:
1. The TM node key in our in-memory index
2. The node ID in the 3D graph (`data-intent-id` attribute)
3. The key we emit in `usage_hit` and `clarify` telemetry events

We need `intentId` to be:
- Globally unique across all lang pairs
- Stable across recompiles (same guarantee as `fingerprint`)
- A valid HTML attribute value (no spaces, no `"` characters)

Proposed format: `intent-{tgt}-{zero-padded-nnn}` e.g. `intent-th-042`. Confirm or provide your format.

---

## Section 6 — Your Sign-Off

| # | Ask | Your answer |
|---|-----|-------------|
| 5 | Telemetry POST endpoint + Bearer token for staging | |
| 6 | `parentCategory` vocabulary per lang pair | |
| 7 | `intentId` format confirmed (`intent-{tgt}-{nnn}` or your format) | |

Carried forward from v1.0.0 — already confirmed, listed for reference:

| # | Original ask | Status |
|---|-------------|--------|
| 1 | Fingerprint stable across recompiles unless source text changes | ✅ Confirmed |
| 2 | `relatedIntents` capped at 5 entries max | ✅ Confirmed |
| 3 | `context` and `session_id` accepted in feedback payload intake schema | ✅ Confirmed |
| 4 | `speakerGender` / `formality` surface point → option (d): always `neutral_any` for prototype | ✅ Confirmed |

---

## Section 7 — Reference Mockup

`pb-mockup.html` — open in any browser. No server, no network requests.

**What it shows:**
- Tab 1 "2D Quick Ring": tap a tag badge on a transcript row → radial Quick Ring appears. Single tap re-centers; double tap inserts phrase + shows the exact `usage_hit` JSON that gets posted to your endpoint.
- Tab 2 "3D Semantic Graph": force-directed 3D graph of all 10 cards. Nodes colored by `parentCategory`. Click a node → detail panel shows source/target/confidence. Drag to rotate.

The dataset used in the mockup (10 EN→TH travel cards) uses exactly the v1.2 schema defined in Section 3. If your pipeline can produce files in this format, the full Quick Ring + 3D graph will work immediately on live data.

---

*End of specification. Return Section 5 sign-off table to unblock 5.1 implementation.*
