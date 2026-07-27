# Bridge phrasebook compatibility update v1

## Purpose

Update the Bridge phrasebook subsystem so Bridge and `phase-deck-v1.html` can acquire, modify, and write back the same phrasebook without losing card data. Categories are part of the shared card contract, not Bridge-only presentation state.

## Shared phrasebook envelope

Bridge must read both a legacy top-level card array and the canonical envelope below. All new writes must use the envelope and preserve unrecognized top-level properties.

```json
{
  "type": "phrasebook",
  "pair": "en-th",
  "langPair": { "source": "en", "target": "th" },
  "version": 1001,
  "updatedAt": "2026-07-27T00:00:00.000Z",
  "updatedBy": "bridge-user",
  "cards": []
}
```

Use the directional pair chosen by the room creator. Files are named `phrasebook-{source}-{target}-{version}.json`. Pull the greatest numeric version (minimum historical baseline 1000). Before every write, list the directory again and refuse a stale write if a newer version appeared. Write back to a new, incremented filename; do not overwrite the pulled file.

## Canonical card contract

Bridge must preserve every property it does not own. Normalize known properties by shallow-cloning the original card and nested structures rather than reconstructing a reduced object.

```json
{
  "id": "stable-id",
  "sourceLang": "en",
  "targetLang": "th",
  "source": "Hello",
  "target": "สวัสดี",
  "categories": ["greeting"],
  "tags": [],
  "backtranslate": {
    "resultText": "Hello",
    "verdict": "pending"
  },
  "clarifyChain": [],
  "usage": 0,
  "lastUsed": null,
  "createdAt": 0,
  "createdBy": "bridge",
  "updatedAt": 0,
  "updatedBy": "bridge",
  "deletedAt": null
}
```

## Required category behavior

1. **Always store categories as an array of strings.** On ingestion, convert a legacy string to a one-element array, trim and lowercase values, remove blanks and duplicates.
2. **Never omit categories on a new card.** A Bridge-created card starts with `categories: ["unassigned"]` unless the save flow has an explicit category.
3. **Never use an empty category array.** If normalization or removal produces no category, use `["unassigned"]`.
4. **Treat `unassigned` as a sentinel.** When a real category is assigned, remove `unassigned`. If all real categories are removed, restore `unassigned`.
5. **Preserve categories on every mutation.** Translation, verdict, tags, usage, delete/restore, clarify notes, and backtranslation updates must not reconstruct the card or drop `categories`.
6. **Preserve multiple categories.** Bridge may display only a summary, but it must round-trip the complete array unchanged.
7. **Do not derive categories from tags.** Categories and tags are independent arrays. `✓Verified` is a system tag, never a category.
8. **Use exact transport values.** Category values are stable lowercase identifiers. Labels can be localized in the UI without changing stored identifiers.

Recommended helpers:

```js
function normalizeCategories(value) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
  const categories = [...new Set(values.map(v => String(v).trim().toLowerCase()).filter(Boolean))];
  return categories.length ? categories : ["unassigned"];
}

function addCategory(card, category) {
  const value = String(category).trim().toLowerCase();
  if (!value || value === "unassigned") return;
  card.categories = [...new Set(normalizeCategories(card.categories).filter(v => v !== "unassigned").concat(value))];
}

function removeCategory(card, category) {
  const value = String(category).trim().toLowerCase();
  card.categories = normalizeCategories(card.categories).filter(v => v !== value);
  card.categories = normalizeCategories(card.categories);
}
```

## Verdict and verified-tag compatibility

Use `pending`, `good`, and `flag` as the canonical verdict values. Convert missing or empty legacy verdicts to `pending` on ingestion. `✓Verified` is coupled to the verdict:

- setting `good` adds `✓Verified` if absent;
- setting `flag` or `pending` removes `✓Verified`;
- manually removing `✓Verified` resets the verdict to `pending`.

Do not treat `✓Verified` as a user-entered category or lowercase/sanitize it through the ordinary tag pipeline.

## Clarify-chain compatibility

Readers must accept both legacy Phrase Desk entries (`ini`, `ts`, `txt`) and Bridge entries (`author`, `timestamp`, `text`). New Bridge writes should use `author`, `timestamp`, and `text`; during the compatibility window they may additionally include the three aliases. Maintenance actions should add one auditable entry describing the operation rather than one write per field.

## Delete and identity rules

- Keep `id` stable across pulls, edits, and bumps.
- Soft delete by setting `deletedAt`; restore by setting it to `null` or removing it.
- Exclude soft-deleted cards from normal Bridge views and duplicate checks, but preserve them during write-back.
- Permanent deletion is the only operation that removes a card from `cards`.

## Bridge implementation checklist

- [ ] Change `pbPull` to retain the complete envelope and clone cards without dropping unknown fields.
- [ ] Normalize `categories` on every ingested card.
- [ ] Add `categories: ["unassigned"]` to `pbAddCard` and every other Bridge card factory.
- [ ] Audit all card update paths to mutate fields in place and preserve categories.
- [ ] Normalize empty verdicts to `pending` and enforce the verified-tag invariant.
- [ ] Make clarify-chain rendering understand both entry shapes.
- [ ] Keep directional latest-version pull, pre-write refresh, stale-write refusal, and bumped-file write-back.
- [ ] Add fixtures for a multi-category card, an unassigned card, unknown extension fields, a deleted card, and both clarify-chain shapes.
- [ ] Round-trip those fixtures Bridge → Phrase Deck → Bridge and assert semantic equality, including category order/content and unknown fields.

## Acceptance tests

1. Pull a card with `categories: ["travel", "lodging"]`, edit its verdict in Bridge, bump the phrasebook, and verify both categories remain.
2. Create a card in Bridge and verify Phrase Deck lists it under the `unassigned` maintenance scope.
3. Assign an existing category in Phrase Deck, bump, pull in Bridge, update usage, bump again, and verify the assigned category remains and `unassigned` does not return.
4. Remove the final category and verify the persisted result is `["unassigned"]`.
5. Round-trip a card containing an unknown property and verify it is unchanged.
6. Attempt a write after another client has bumped the pair and verify Bridge refuses the stale write until it pulls again.
