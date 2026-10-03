# Proposal: a translation overlay that learns, plus a language check

Status: proposal, 2026-10-03. Nothing here is built. Owner has not approved a build.

## Why

- Machine translation can sound stiff, too formal or plain wrong. A Malay speaker called the English → Malay sample "I'm saying something simple" → "Saya mengatakan sesuatu yang mudah" a terrible translation. The cause is **not verified**. It may be the provider's output, or something in our path. This proposal does not depend on knowing which.
- Today every fix is thrown away. chat-test's AI check can suggest a better translation, and "Use" replaces it on that one message only. The next time the same sentence comes up, the provider gives the same bad answer.
- TalkBridge already has a curated phrasebook: approved cards per language pair, stored in GitHub, merged by card id. It is high quality but only covers what someone wrote down.
- Combine them: every approved fix becomes a permanent improvement, and later messages never go back to the provider for it.

## The idea

Keep machine translation as the base. Put a layer of approved phrases on top, like a mask. If the mask has an answer, it wins. Otherwise the base shows through.

## The extra layer: a local lookup before the provider

The overlay is checked **first**, on the device, before any translation call. A hit costs no network call, no provider quota and no wait.

Per message, in order:

1. Normalize the text (case, spacing, punctuation) and look it up in the overlay for that language pair and direction: exact match first, then a close match above a strict threshold.
2. Hit: use it and mark the source as `overlay`.
3. Miss: use the normal machine translation (source `machine`).
4. If the AI check flags a problem, show its suggested fix (source `ai`, suggestion only).
5. When a person accepts a fix, or a native speaker corrects one, save it to the overlay for that pair.

## Rules to keep it safe

- **Trust levels.** Native-speaker correction > person-accepted AI fix > curated phrasebook card > plain machine output. An AI fix is only a suggestion until a person accepts it.
- **Pair and direction scoped.** An entry belongs to one source language, one target language and one direction. Malay and Indonesian never share entries.
- **Close matches are conservative.** A close match must keep numbers, names and negation identical to the stored phrase. Anything uncertain falls through to the machine.
- **Visible source.** Each translated bubble records `overlay`, `phrasebook`, `machine` or `ai`, so a bad answer can be traced and fixed.
- **Plain, exportable, switchable.** The overlay is a JSON file that can be reviewed, edited, exported and turned off in settings. One bad AI answer cannot enter it silently.
- **Never overwrites a person's words.** The overlay changes the translation only, never what the speaker said (see the Malay/Indonesian rewrite fixed in acmeproducts/stuff#794).

## Storage and sharing (recommendation)

What exists today (read from the repo, not from a running system):

- TalkBridge phrasebook: per-pair JSON, GitHub is the source of truth, saved with an expected-sha check and merged by card id (later timestamp wins per card).
- chat-test: AI fixes are stored on the message only (`replaceTranslation`); there is no reusable store.

Recommended: **one overlay file per language pair and direction in the repo** (for example `overlay/ms-en.json`), using the same card shape and merge-by-id rule TalkBridge already proves. TalkBridge's phrasebook cards and chat-test's accepted fixes are two sources feeding the same files, so both apps get smarter together. The apps read it the way chat-test already fetches dictionaries from the repo, and cache it locally.

## Who approves

Recommended: the app does the approving, not a dev process. Accepting an AI fix in the bubble check is the approval (trust level 2). A native-speaker correction is entered through the same screen, marked as native, and wins. No pull request is needed per entry.

## Is the paid AI check required?

No. The overlay alone fixes repeat mistakes. The paid AI check only helps find new mistakes faster, and stays on the existing backlog for a field trial of value versus cost.

## Part 2: a language check, so the first live conversation is not the test

You can't know there are no other latent defects like the Malay/Indonesian rewrite; the only defence is to test every language the same way.

1. **Coverage table, checked automatically.** For every supported language, confirm each of these exists and agrees: flag and name, speech-recognition code, read-aloud voice, translation code, keyboard layout, dictionary. This is backlog item 3 widened to everything.
2. **Look-alike pair tests.** Prove the app never rewrites one language into the other: Malay/Indonesian (done), Hindi/Urdu, Swedish/Norwegian/Danish, Spanish/Portuguese, Thai/Lao, Chinese Simplified/Traditional.
3. **Native-speaker phrase list.** 10 to 15 everyday phrases per language, checked once by a native speaker. Software can't judge whether a translation sounds natural. The corrections become the first overlay entries, so each language is checked once and stays checked.
4. **A "language check" button in the app** that runs the table and shows any language with a gap before a conversation starts.

Parts 1, 2 and 4 are code and can be built and tested in the lab. Part 3 needs native speakers; I cannot supply it.

## Suggested order

1. Language check: coverage table and look-alike pair tests (finds problems; no behavior change).
2. Overlay read path: lookup before the provider, source shown on the bubble, off by default behind a setting.
3. Overlay write path: accepting an AI fix, or entering a native correction, saves to the pair file.
4. Share with TalkBridge phrasebook cards.
5. Native-speaker phrase lists per language, loaded as the first entries.

## Open questions

- Exact close-match rule (threshold and what must match exactly). Recommendation: start exact-only, add close match after real traffic shows what is repeated.
- Whether TalkBridge reads the overlay too, or only feeds it. Recommendation: feeds it first.
- Offline behavior: overlay is cached locally, so hits still work offline. Misses behave as today.

## Not verified

- No translation-quality claim in this document has been checked by a native speaker except the one reported Malay sample.
- Nothing has been run on a real device.
