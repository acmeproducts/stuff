# Phrasebook pair selection and tag taxonomy journal

## 1. Purpose of this file

This file records the current phrasebook-tagging experiment so the repository can keep both the legacy files and the experimental files side by side while the final tag strategy is still being decided.

The immediate goal is not to replace the existing importable phrasebooks. The goal is to create a clearly named English ↔ Thai trial pair using the new tag syntax, preserve the original `default` files unchanged, and make the taxonomy explicit enough that the next language pairs can follow the same review path.

## 2. Canonical English ↔ Thai trial pair

For the English ↔ Thai tagging trial, use these files:

1. `phrasebook-en-th-newtag.json` — English source text to Thai target text.
2. `phrasebook-th-en-newtag.json` — Thai source text to English target text.

The existing `default` files remain in place and are intentionally not overwritten:

1. `phrasebook-en-th-default.json` — legacy/current English to Thai file.
2. `phrasebook-th-en-default.json` — legacy/current Thai to English file.

Other English/Thai alternates in this directory are retained as legacy alternates and are not part of this first `newtag` trial pair.

## 3. Naming rule for experimental tag files

Experimental files use `newtag` in the filename instead of `default`:

```text
phrasebook-<sourceLang>-<targetLang>-newtag.json
```

This naming convention prevents the experiment from overriding the existing `default` files. The files can coexist until a final decision is made about tag syntax, taxonomy, import behavior, and review workflow.

## 4. New tag syntax under review

The `newtag` files avoid prefixed descriptors such as `subject:`, `tone:`, `context:`, and `speaker:`.

Each card should use:

1. One primary context tag that starts with `##`.
2. One or more topical, role, noun, attribute, or review tags that start with `#`.

Examples:

1. Banking card: `##banking`, `#account`, `#creditcard`, `#interest-rate`.
2. Travel card: `##travel`, `#airport`, `#ticket`, `#direction`.
3. Medical or safety card: `##safety`, `#medicine`, `#police`, `#assistance`.
4. Relationship card: `##intimacy`, `#relationship`, `#consent`, `#privacy`.

The double-hash tag is meant to answer “where does this card live?” The single-hash tags are meant to answer “what nouns, roles, concepts, or review attributes are attached to this card?”

## 5. Legacy taxonomy observed in the existing English ↔ Thai files

The current `default` files use prefixed tags. These categories are captured here so the old structure is not lost while the new syntax is evaluated.

### 5.1 Legacy `subject:` values

1. `subject:greetings` — greetings, openings, introductions, closings, and polite conversational rituals.
2. `subject:people` — relatives, relationships, family roles, social roles, and civic roles.
3. `subject:jobs` — professions and workplace roles.
4. `subject:travel` — travel, transportation, navigation, hotels, airports, tickets, and lost-item situations.
5. `subject:banking` — money, accounts, payments, cards, transfers, fees, exchange rates, fraud, and receipts.
6. `subject:everyday` — daily routines, eating, drinking, sleeping, bathing, clothing, errands, rest, and comfort.
7. `subject:intimacy` — respectful romantic communication, consent, boundaries, reassurance, affection, privacy, invitations, and refusals.
8. `subject:safety` — emergency, medical, pharmacy, police, legal help, lost passport, and urgent assistance.
9. `subject:general` — higher-level conversation, opinions, preferences, agreement, disagreement, uncertainty, planning, negotiation, news, and finance discussion.
10. `subject:cooking` — kitchen activity, cooking methods, ingredients, and practical food preparation.
11. `subject:regional-food` — food culture, local dishes, festival food, markets, and regional taste descriptions.
12. `subject:science` — evidence, reliable sources, observations, measurement, research, and scientific reasoning.
13. `subject:literature` — complete original micro-stories, parables, scenes, or reflective prose pieces.
14. `subject:poem` — complete original poems.

### 5.2 Legacy `context:` values

1. `context:greeting` — greeting-specific conversational openings.
2. `context:introduction` — introducing oneself or another person.
3. `context:meeting` — meeting someone or acknowledging a meeting.
4. `context:interruption` — politely interrupting.
5. `context:thanks` — gratitude and appreciation.
6. `context:closing` — closing a conversation.
7. `context:follow-up` — continuing or following up after a prior exchange.
8. `context:scheduling` — arranging or discussing timing.
9. `context:delay` — delay, lateness, or waiting.
10. `context:farewell` — saying goodbye.
11. `context:family` — relatives and household/social relationships.
12. `context:work` — workplace, employment, professions, and service roles.
13. `context:navigation` — directions and location-finding.
14. `context:transportation` — trains, buses, taxis, airports, tickets, and transit.
15. `context:assistance` — requests for help or service support.
16. `context:finance` — banking, payments, accounts, fees, fraud, and receipts.
17. `context:personal-routine` — everyday personal life, rest, health comfort, and household routine.
18. `context:relationship` — romantic or emotionally intimate communication.
19. `context:boundaries` — personal boundaries in relationship communication.
20. `context:consent` — explicit consent, comfort, and refusal.
21. `context:emergency` — urgent safety, medical, police, pharmacy, legal, or passport issues.
22. `context:news-finance` — general discussion involving news, finance, opinion, and interpretation.
23. `context:kitchen` — cooking and food preparation.
24. `context:food-culture` — regional food, local dishes, markets, festivals, and cultural taste.
25. `context:evidence` — science, research, reliable sources, measurements, and observations.
26. `context:original` — original literary or poetic content.
27. `context:bonus` — bonus literary or poetic content beyond the core phrase categories.

### 5.3 Legacy `tone:` values

1. `tone:polite` — courteous or service-appropriate phrasing.
2. `tone:neutral` — plain, general-purpose phrasing.
3. `tone:formal` — official, workplace, institutional, or procedural phrasing.
4. `tone:warm` — friendly, affectionate, or personally warm phrasing.
5. `tone:romantic` — respectful romantic relationship phrasing.
6. `tone:urgent` — emergency or immediate-assistance phrasing.
7. `tone:curious` — exploratory or question-oriented phrasing.
8. `tone:reflective` — literary, poetic, or contemplative phrasing.
9. `tone:apologetic` — apology or repair-oriented phrasing.

### 5.4 Legacy `speaker:` values

1. `speaker:him-to-her` — romantic/relationship line framed from him to her.
2. `speaker:her-to-him` — romantic/relationship line framed from her to him.
3. `speaker:neutral` — speaker-neutral romantic or relationship line.

### 5.5 Other legacy tags observed

1. `essential` — high-priority or starter phrase.
2. `food` — food-related phrase.
3. `✓Verified` — review marker indicating a verified card.

## 6. New `##` context taxonomy used in the English ↔ Thai trial

The English-to-Thai `newtag` file currently uses these primary context tags:

1. `##greetings` — 15 cards.
2. `##people` — 24 cards.
3. `##work` — 22 cards.
4. `##travel` — 30 cards.
5. `##banking` — 22 cards.
6. `##everyday` — 25 cards.
7. `##intimacy` — 24 cards.
8. `##safety` — 12 cards.
9. `##conversation` — 10 cards.
10. `##literature` — 8 cards.
11. `##poem` — 24 cards.

The Thai-to-English `newtag` file currently preserves a more granular legacy-context mapping and uses these primary context tags:

1. `##greetings`
2. `##introduction`
3. `##meeting`
4. `##interruption`
5. `##thanks`
6. `##closing`
7. `##follow-up`
8. `##scheduling`
9. `##delay`
10. `##farewell`
11. `##people`
12. `##work`
13. `##travel`
14. `##transportation`
15. `##assistance`
16. `##banking`
17. `##everyday`
18. `##intimacy`
19. `##safety`
20. `##conversation`
21. `##cooking`
22. `##food`
23. `##evidence`
24. `##literature`
25. `##poem`

This difference is intentional documentation of the current experiment, not a final decision. One open question is whether the final taxonomy should use only the broad macro contexts or preserve some granular contexts as primary `##` tags.

## 7. New topical `#` tag taxonomy observed in the English ↔ Thai trial

The following single-hash tags appear in the `newtag` pair. They are grouped by purpose rather than by exact card count.

### 7.1 Review, tone, and phrase attributes

1. `#polite`
2. `#neutral`
3. `#formal`
4. `#warm`
5. `#romantic`
6. `#urgent`
7. `#curious`
8. `#reflective`
9. `#apologetic`
10. `#verified`
11. `#phrase`

### 7.2 People, relationship, and speaker tags

1. `#family`
2. `#relationship`
3. `#him-to-her`
4. `#her-to-him`
5. `#speaker-neutral`
6. `#consent`

### 7.3 Work and civic role tags

1. `#profession`
2. `#doctor`
3. `#lawyer`
4. `#teacher`
5. `#manager`
6. `#nurse`
7. `#engineer`
8. `#police`

### 7.4 Travel and navigation tags

1. `#direction`
2. `#airport`
3. `#hotel`
4. `#taxi`
5. `#train`
6. `#bus`
7. `#ticket`
8. `#passport`

### 7.5 Banking and money tags

1. `#account`
2. `#creditcard`
3. `#interest-rate`
4. `#receipt`
5. `#fee`
6. `#cash`
7. `#transfer`

### 7.6 Everyday life, household, food, and health-comfort tags

1. `#routine`
2. `#everyday`
3. `#food`
4. `#dish`
5. `#sleep`
6. `#water`
7. `#clothes`
8. `#medicine`

### 7.7 Safety and assistance tags

1. `#assistance`
2. `#police`
3. `#passport`
4. `#medicine`

### 7.8 Conversation, literature, and poem tags

1. `#opinion`
2. `#story`
3. `#poem`
4. `#literature`

## 8. Open taxonomy decisions before promoting `newtag` to `default`

1. Decide whether `##` should always represent broad macro contexts or whether granular contexts such as `##farewell`, `##transportation`, and `##evidence` should remain valid primary contexts.
2. Decide whether tone words such as `#polite`, `#formal`, and `#urgent` should remain single-hash tags or move to a separate metadata field.
3. Decide whether speaker tags such as `#him-to-her` and `#her-to-him` should remain regular topical tags or become structured speaker metadata.
4. Decide whether review tags such as `#verified` should be card tags or review-state metadata.
5. Decide whether literary and poem bonus cards should use broad contexts only (`##literature`, `##poem`) or preserve `#reflective`, `#story`, and `#poem` topical tags.
6. Decide whether the English-to-Thai and Thai-to-English files should have perfectly mirrored tag sets or whether each direction may keep language-direction-specific review annotations.

## 9. Proposed order of future language-pair work

After the English ↔ Thai pair is reviewed, the next pairs should be handled one at a time in separate PRs:

1. English ↔ Mandarin.
2. English ↔ Korean.
3. English ↔ Vietnamese.

Each future PR should create `newtag` files first, keep existing `default` files intact, update this taxonomy journal, and validate that the new files can coexist with the legacy files.
