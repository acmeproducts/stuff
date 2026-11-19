# X — requirements traceability matrix

Version 1.2.0 · 2026-11-19

Every requirement in `X-REQUIREMENTS.md`, the decisions that answer it, the release that delivers it, what proves it, and where it stands. Updated in the same commit as any release.

Status words: **met** (proved on the owner's device, evidence named) · **part** (some of it proved) · **open** (not built) · **lab** (proved in the lab only).

| Req | Short form | Decisions | Delivered by | Proved by | Status |
|---|---|---|---|---|---|
| R01 | no touch after a session starts; touches counted | D15, D14 | X1 | X1 gate 6; hand-time meter | open |
| R02 | talk in your own words; nothing to memorise | D01, D10 | X1 | X1 gate 1, 3, 5 | open |
| R03 | small finite command set, one meaning each | D02 | X1 (5), X2 (7), L3/X5 (10) | X1 gate 3; V3 one-to-one checks | open |
| R04 | body signals sparingly; held before repeated; no wrist load | D05, D06 | V1, X2 (glide) | graveyard G1, G7; V1 gate | part: knock and repeated flick removed (2026-11-16/17); tilt is a held posture |
| R05 | weak side never required | D14 | all | every device gate is passable with the left arm and voice | part: all watch signals are on the left arm |
| R06 | small birth vocabulary; grows by addition | D02, D03 | X1 | X1 gate 2 | open |
| R07 | learns from keep, change, drop | D03 | X1 | X1 gate 2; X page suite | open |
| R08 | what is learned acts without a fresh reading | D01 | X1 | X1 gate 2; check that a known word says no reading | open |
| R09 | learned things can be listed, changed, removed by talking | D03 | X1, V3 | X page suite; V3 gate | open |
| R10 | signals and rules differ by context | D07, D08 | V3, S5, X4 | S5 gate 3 | open |
| R11 | no content chosen in advance | D02 | X1, X2 | X ships with zero words; X2 gate | open |
| R12 | one thing in front; no dashboard | D01, D12 | X1 | X1 gate 1; page check that one card is shown | open |
| R13 | several threads; ready is announced | D17 | X3 | X3 gate | open |
| R14 | X speaks and shows; nothing read on the watch | A2 | done | turn02 on (2026-11-16); panel needs no reading | **met** |
| R15 | never blames, never asks to repeat | D01 (H2, H4) | X1 | X1 gate 5 | open |
| R16 | practical uses work | D09 | X1 (weather, traffic), X2 (feed, art), X3 (research), X5 (market question, game) | each release's gate | open |
| R17 | works with any one source, or voice alone | D04, D07 | X1 (voice), S4 | X1 passes with no watch; S5 gate 2 | open |
| R18 | watch, hand, head report one shape | D04, D11 | S1 to S4 | S4 gate | part: the watch source exists |
| R19 | each person registers their own signals; one to one | D05, D06 | V1, V2, V3 | V1 gate; V3 checks | open |
| R20 | arbiter with override, fallback, exclusive per context | D07 | S5 | S5 gate 1 to 3; arbiter suite | open |
| R21 | absent told apart from silent | D07 | S4 | arbiter suite | open |
| R22 | the obeyed source is shown and logged | D07, D16 | S5 | S5 gate 4 | open |
| R23 | camera needs only a web page | A8, D11 | S1 | S1 gate | open |
| R24 | no connector of X's own | A7, D09 | X1 on | code review at each release: no service-specific call exists | open |
| R25 | AI only at named steps, fixed order | D01 | X1 | check: a command makes no model call | open |
| R26 | answers carry sources; evidence kept | D01 | X1, X3 | X1 gate 1; X3 gate | open |
| R27 | explicit yes before send, delete, spend; pairing hardened now | D22 | W1 (pairing), X6 (the yes) | W1 gate 7; nothing that sends or spends exists before X6 | part: no such action exists; pairing not yet hardened |
| R28 | browser, phone and desktop; no phone app | A1, D12 | done for the Lab; X1 | Lab used on the S23 and tablet; desktop lab-only | part |
| R29 | watch runs only in a session; cannot stop by accident | D14 | W1 | W1 gate 2 to 4 | open: today it runs until held |
| R30 | screen off at a known battery cost | A2 | done (screen off); W2 (cost) | 77 screen-off events on 2026-11-17; W2 numbers | part: cost unknown |
| R31 | no IDE; GitHub builds | A4 | done | six watch builds from GitHub | **met** |
| R32 | diagnostics in the app and logged; codes masked; no credentials in the repo | D16 | done for the watch; L1, X1 | panel snapshot read from the log 2026-11-17/18 | part: nothing shows the owner it was logged (W1) |
| R33 | every release real end to end | P13 | every release | each gate is use, not display | holds so far |
| R34 | hand time measured each session | D15 | X1 | X1 gate 6 | open |
| R35 | hit rate and wrong fires per signal, during X-like use | D20 | L2 | L2 gate | open |
| R36 | fact and theory labelled | P17 | every record | review at each commit | holds so far |
| R37 | memory on the device, synced with GitHub; learns in operation and in function | D13, D21 | X1 | X1 gate 8; each later release's plan cites what the build read | open |
| R38 | Lab cases for hand and head recognition | D23 | S2, S3 | `signals-page-test.py` hand and head checks; the owner's run of the two cards | lab |
| R39 | an action assigned to a hand or head movement or pose | D25, D26 | V1, V3 | `signals-check.js`, `signals-page-test.py` assign checks; the owner's run | lab |
| R40 | basic signals, then complex ones by combining | D24, D27 | V1, V5 | combination checks; the owner's run | lab |
| R41 | taught by being shown, with AI reading the outcome | D29 | V6 | V6 gate | open |
| R42 | a 3D object handled by one hand or both | D28 | L3 | object checks (made-up hands); the owner's run | lab |
| R43 | not made useful by choosing things to fetch | P9, G28 | every release | review at each commit | holds so far |
| R44 | hand toward the screen, object away | D31 | L4 | object depth check; the owner's run | lab |
| R45 | hand to hand | D28 | L6 | L6 gate | open |
| R46 | hands in the scene | — | L6 | L6 gate | open |
| R47 | several objects and goals | — | L6 | L6 gate | open |
| R48 | putty | — | L6 | L6 gate | open |
| R49 | tabs | D37 | L5 | tab checks; the owner's run | lab (voice tab with S6) |
| R50 | camera tab needs only a camera | D37, D33, D41 | L5 | "asks for no code" checks; the owner's run on a device with no code | lab |
| R51 | no wait for the stream on each card | D34 | L4 | stream checks; the owner's run | lab |
| R52 | voice: turns, interruptions, hot and cold word | D38 | S6 | S6 gate | open |
| R53 | journey by head | — | L7 | L7 gate | open |
| R54 | blink left, right, both | D36, D40 | V7 | blink checks; the owner's run | lab |
| R55 | calibration, interpretation, learning | D32, D36, D39 | L4, V7 | calibration checks; the owner's run | lab |
| R56 | both watch settings; the Lab says so | D35 | L4 | quiet-watch checks; the owner's watch | lab; the settings themselves proven on his watch for 3 minutes |

## Counts
Met: 2 (R14, R31). Part: 7 (R04, R05, R18, R27, R28, R30, R32). Holding: 3 (R33, R36, R43). Lab only: 11 (R38, R39, R40, R42, R44, R49, R50, R51, R54, R55, R56). Open: 33. Total 56.

## Use cases to releases
| Use case | Releases |
|---|---|
| UC1 start and end a session | W1, X1 |
| UC2 ask something new | X1 |
| UC13 teach a signal | V1 |
| UC14 give a signal an action | V3 |
| UC15 make a word | V5 |
| UC16 show X a run | V6 |
| UC3 keep, change or drop | X1 |
| UC4 use a known word | X1 |
| UC5 move through a list | X2 |
| UC6 run something long | X3 |
| UC7 teach a signal | V1, V2, V3 |
| UC8 set whose word counts | S5 |
| UC9 use X without the watch | X1, S4 |
| UC10 read the evidence | L1, L2 |
| UC11 handle an object | L3 |
| UC12 do something that cannot be undone | X6 |
