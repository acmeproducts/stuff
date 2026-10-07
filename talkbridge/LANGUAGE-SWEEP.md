# TalkBridge · THE LANGUAGE SWEEP (device checklist)

Required gate of 30·pre-ship (plan §0, row 30·pre-ship, added 2026-10-07).
Runs on the accepted 28·pre-ship c4 bytes or later. No build needed.

**Address:** https://acmeproducts.github.io/stuff/bridge-turn28-pre-ship.html
**Phones:** A = English. B = the language under test.

## One round (about two minutes per language)
1. On A: create a room, my language English, their language = X. Send the invite to B.
2. On B: open the invite, join.
3. A types one line → B. B types one line → A.
4. A speaks one line (chat mic) → B. B speaks one line in X → A.
5. On A, tap the header of B's spoken line → the circle-arrow button → read the card.
   On B, same for A's spoken line.
6. Tick the row below. Then both phones: menu → copy the device log → keep it.

## What "pass" means
- Both typed lines arrive translated, both ways.
- Both spoken lines appear as text in the speaker's language, then translated.
- The card's Said vs Translated is Match or Partial (a Miss is a row in the defects table, not a fail of the sweep).
- The log shows `trans_ok {"provider":"google"}` for every translation, never `trans_fallback`.
- The log shows `dg_final` for every spoken line, never `dg_credential_failure` or `normalize_no_rewrite` with `why: failed`.

## The table (fill in; paste back when done)
| # | Language | Typed A→B | Typed B→A | Spoken A→B | Spoken B→A | Card verdicts | Google every time? | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | Thai | | | | | | | |
| 2 | Vietnamese | | | | | | | |
| 3 | Chinese (Simplified) | | | | | | | |
| 4 | Japanese | | | | | | | |
| 5 | Korean | ✓ (28·pre-ship gates) | ✓ | ✓ | ✓ | Match / Partial / Miss seen | ✓ | the reference pair |
| 6 | Spanish | | | | | | | |
| 7 | Filipino | | | | | | | |
| 8 | Indonesian | | | | | | | |
| 9 | Malay | | | | | | | |
| 10 | Hindi | | | | | | | |
| 11 | Arabic | | | | | | | |
| 12 | Russian | | | | | | | |
| 13 | French | | | | | | | |
| 14 | German | | | | | | | |
| 15 | Italian | | | | | | | |
| 16 | Portuguese | | | | | | | |
| 17 | Dutch | | | | | | | |
| 18 | Swedish | | | | | | | |
| 19 | Polish | | | | | | | |
| 20 | Turkish | | | | | | | |

Order is a suggestion: the first four are the ones that differ most from English
(no spaces, other scripts, tones) and are the likeliest to show something.

## What each column proves
- Typed: the Google-first translator for this pair, both directions, and the MyMemory fallback if Google refuses the pair.
- Spoken: the speech engine's support for X (the app asks for X on one lane and English on a second lane for Thai, Chinese, Korean and Arabic; for every other language it asks for X alone), then the same translator.
- Card verdicts: the wording score on this script (character pairs, no spaces needed), and the back-translation into X.
- Google every time: one line in the log per translation names the provider.

## Lao
Not offered: the app has 21 languages and the speech engine has no Lao. Google
translates it. Offering Lao as a chat-only language (type and read, no mic) is a
rule the plan does not have yet — owner's call, backlog.
