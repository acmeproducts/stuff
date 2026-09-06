# Market Navigator — AI / Analysis / Library Donor Contract

Status: AUTHORITATIVE DONOR INTERPRETATION
Updated: 2026-09-06

## Purpose
This document captures the owner's 2026-09-06 AI/Library framework input for Market Navigator.

The referenced PRISM implementation and supplied mock-up are **donors only**. They are not implementation ancestry and must not be transplanted wholesale.

Primary live donor reference:
- https://acmeproducts.github.io/stuff/prism/prism-turn01-pre-ship-r13.html?cb=23753f29e414606190a8a6f793af8aaed7ceec3d

The supplied HTML mock-up is specification evidence only. Do not copy it as a production file.

## Product intent
The important pattern is not PRISM's news/event domain. The important pattern is the **Analysis ↔ Library lifecycle**:

1. User is in an analytical context.
2. User invokes AI against the currently selected evidence/state.
3. Starting AI immediately creates a durable Analysis record.
4. The application transitions directly into Library/Analysis while the request is still processing.
5. Progress, result, evidence, and subsequent conversation all live on that same durable Analysis record.
6. The completed AI result is not a disposable modal output. It becomes the first durable research turn in Library.
7. The user can continue the research in-place from Library with a persistent composer.
8. Reopening a Library Analysis restores the same evidence/state and the full conversation.

For Market Navigator this lifecycle is integrated with V3 Analysis and Library; it is not a separate PRISM-style report product.

## Donor capabilities to adopt conceptually

### 1. Analysis created before AI completion
The donor creates and persists an Analysis record with a `processing` state before the AI request completes, then opens that Analysis in Library immediately.

Market Navigator should preserve this behavior:
- canonical Analysis ID created at Run Analysis;
- exact chart/evidence state frozen into the Analysis record;
- Analysis persisted before network execution;
- Library opens that exact Analysis immediately;
- processing state is visible in the transcript;
- completion updates the same record, not a second result object;
- failure leaves the durable Analysis record intact with explicit failed status and error context.

### 2. One canonical Analysis persistence path
The donor uses one persistence path and re-reads the stored Analysis after writes.

Market Navigator should follow the same integrity rule:
- one canonical persistence function/model;
- successful write is verified by re-reading the stored Analysis;
- UI renders from persisted state, not a shadow in-memory copy;
- AI completion, follow-up turns, attachments, state changes, and imports update the same Analysis identity.

### 3. Library is a working research environment
The donor's Library is not a bookmark list. It includes:
- left analysis-card rail;
- Omnisearch across research records;
- selected Analysis detail stage;
- evidence/source archive;
- chronological transcript;
- persistent continuation composer;
- attachments/context;
- processing/ready/failed status;
- delete/import/export patterns;
- mobile list→detail behavior.

Market Navigator should adopt these interaction principles while using Market Navigator's own analytical data model and visual language.

### 4. AI POV becomes the opening research turn
The donor treats the first AI execution as the first durable turn of a research record.

For Market Navigator:
- AI POV is the opening AI turn of the active V3 Analysis;
- the initial turn receives the frozen Market Navigator evidence packet, visible chart state, health state, selected series, horizon, axis/normalization state, and provenance;
- the result is rendered into the Analysis transcript;
- subsequent user prompts continue that same research record;
- returning through Library resumes the same conversation and analytical lineage.

### 5. Evidence remains inspectable and linked
The donor keeps selected evidence visible and stores direct source links with the Analysis.

Market Navigator should preserve:
- saved evidence/provenance references;
- direct source URLs where applicable;
- evidence visibility separate from AI prose;
- source links grouped under the relevant evidence item or Analysis evidence archive;
- no invented or guessed URLs;
- external references in AI output must be actual clickable Markdown hyperlinks.

### 6. Markdown is the native AI output format
The donor renders sanitized GitHub-flavored Markdown with working HTTP(S) links.

Market Navigator requirement:
- AI output is Markdown;
- headings, lists, tables, blockquotes, code, and links render correctly;
- unsafe HTML is sanitized;
- hyperlinks remain clickable and open safely;
- any referenced external source/subject offered for further research must have a working hyperlink when a direct URL is available.

### 7. Provider configuration is persistent and authoritative
The donor supports Venice, OpenRouter, and Anthropic direct with:
- browser-stored credentials;
- model selection/discovery where supported;
- validation before use;
- one selected active provider;
- validation invalidated when key/model changes.

Market Navigator should preserve this state-machine principle, while `devstream-test.html` remains the primary provider/configuration donor under the Master Plan.

The important integration rule is:
**the provider/model shown as validated in CONFIG is exactly the provider/model used for V3/Library AI execution.**

### 8. Follow-up research continues from saved state
The donor passes the saved evidence packet plus prior research turns into subsequent AI requests.

Market Navigator should preserve:
- prior turn history;
- frozen evidence/state lineage;
- user attachments/context;
- persistent continuation from Library;
- no disconnected chat state outside the Analysis record.

## Market Navigator-specific integration
The PRISM donor must be translated into Market Navigator's actual workflow:

**NOW V1 → V2 → component card → More info → V3 Analysis → Run AI → durable Analysis opens/updates in Library → continued research in Library**

or

**EXPLORE → selected series → V3 Analysis → Run AI → durable Analysis opens/updates in Library → continued research in Library**

The Library record must preserve, at minimum:
- lineage: NOW or EXPLORE;
- selected index/root component where applicable;
- selected series;
- horizon;
- axis and normalization representation;
- chart state required to restore Analysis;
- evidence/provenance references;
- Health/evidence limitations relevant to the run;
- AI provider/model used;
- full timestamped conversation;
- attachments/context;
- created/updated/version timestamps.

## What NOT to transplant from PRISM
Do not copy PRISM's domain-specific product behavior into Market Navigator, including:
- news/event canonicalization;
- Map/Feed/Explore sphere semantics;
- Group/Color/Size dimension controls;
- source-manager behavior designed for news feeds;
- PRISM event taxonomy;
- PRISM selection model as Market Navigator's chart-selection model;
- PRISM application navigation;
- PRISM-specific strings, schemas, IndexedDB names, or storage identities;
- PRISM's complete HTML/CSS/JS file as a starting application ancestor.

Do not create wrappers, sidecars, runtime overlays, compatibility patches, or a second Library/AI state machine to reproduce the donor behavior.

## Mock-up usage rule
The owner explicitly stated that the supplied HTML is a **mock-up and must not be used as a transplant**.

Therefore builders may use it to infer:
- lifecycle;
- state transitions;
- persistence semantics;
- Library composition;
- transcript/composer behavior;
- evidence visibility;
- provider validation semantics;
- responsive interaction principles.

Builders must re-implement those requirements cleanly in the Market Navigator codebase against Market Navigator's own canonical state and evidence model.

## Acceptance requirements for the AI/Library stage
A candidate does not qualify unless all of these pass mechanically:

1. Run Analysis creates the durable Analysis before the AI call completes.
2. The UI opens/selects that exact Library Analysis while processing.
3. A processing row/turn is visible.
4. Successful AI completion updates the same Analysis identity.
5. Failed AI execution leaves the Analysis record visible and marked failed.
6. Re-opening the Analysis after reload restores its evidence/state and transcript.
7. Follow-up prompt appends to the same Analysis conversation.
8. Markdown renders correctly.
9. External source/research references are clickable working hyperlinks when supplied.
10. The evidence archive remains separate and inspectable.
11. CONFIG's validated provider/model is exactly the runtime used by Analysis.
12. Changing a key/model invalidates prior verification.
13. No second/disconnected chat state exists outside the Analysis record.
14. Desktop and phone Library list/detail/composer flows work without page-level scrolling regressions.
15. No PRISM domain logic leaks into Market Navigator.

## Relationship to existing authority
This donor contract supplements, and does not replace:
- `MARKET-NAVIGATOR-MASTER-PLAN.md`;
- `MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md`;
- `MARKET-NAVIGATOR-BUILD-PROTOCOL.md`;
- `MARKET-NAVIGATOR-GRAVEYARD.md`.

Where this document conflicts with Market Navigator product semantics, the current Master Plan remains authoritative. Where it describes the desired AI/Analysis/Library lifecycle in more detail, builders should use it as the donor interpretation for that capability.
