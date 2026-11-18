# X — requirements

Version 1.0.0 · 2026-11-18 · Answers to `X-NORTH-STAR.md`

The owner stated the what. This file keeps it in a form that can be traced and tested. Additions of mine are marked **(added)** and are the owner's to strike. Nothing here is a design.

## 1. User stories
| # | Story |
|---|---|
| US1 | As someone whose hands hurt after fifteen minutes of touching a screen, I get through a whole session on my phone with my hands at rest. |
| US2 | I talk the way I talk. I never learn a command phrase. |
| US3 | I steer with a few signals that suit my body, and I taught them myself. |
| US4 | My X starts small and grows with me. What I showed it yesterday it knows today. |
| US5 | I see one thing at a time, never a wall of tiles. |
| US6 | I start something long, carry on with something else, and X tells me when the first is ready. |
| US7 | I use X without my watch, or with only my voice, and it still works. |
| US8 | I decide whose word counts when my watch, my hand and my head disagree, and I can change my mind later. |
| US9 | When I close X, my watch stops. It never drains because I forgot it. |
| US10 | I can see what my watch reported and how well each signal works, in a table. |
| US11 | X never does something I cannot take back without my yes. |
| US12 | I use the same X on my phone and on a desktop. |

## 2. Use cases
Each is written as what the person does and what X does. Releases are in `X-ROADMAP.md`.

| # | Use case | Flow | First release |
|---|---|---|---|
| UC1 | Start and end a session | Open X. Sources that are present join. Use X. Close X or say you are done. Sources sleep. X reports minutes and touches. | W1, X1 |
| UC2 | Ask something new | Say it. X says its reading, answers aloud, shows one card with sources. | X1 |
| UC3 | Keep, change or drop | **yes** keeps it as a word X names. Saying how it should differ changes it. **no** drops it. | X1 |
| UC4 | Use a known word | Say the word. X gathers and presents with no reading step. | X1 |
| UC5 | Move through a list | A word brings many items. One is shown. **more**, **back** or **glide** moves. **enough** stops. | X2 |
| UC6 | Run something long | Ask for research. X starts it, stays with you, and announces when it is ready. Say its name to bring it forward. | X3 |
| UC7 | Teach a signal | Do or hold something three times. X learns the range from your body, checks it against your other signals, and you give it a command. | V1, V2, V3 |
| UC8 | Set whose word counts | Say or pick a rule for this context: one source wins, one is a fallback, or one is the only one heard. X shows which source it obeyed. | S5 |
| UC9 | Use X without the watch | Open X with no watch. Voice works. If the camera is allowed, hand and head signals work. | S4, X1 |
| UC10 | Read the evidence | Open the results table. See what the watch reported, and each signal's hit rate and wrong fires. | L1, L2 |
| UC11 | Handle an object | Take, turn and let go of a 3D object with signals alone. | L3 |
| UC12 | Do something that cannot be undone | X states exactly what will happen and waits for **yes**. | X6 |

## 3. Requirements
Source column: NS = `X-NORTH-STAR.md` section; WP = `wrist/WRIST-PLAN.md` section.

### 3.1 Mission
| # | Requirement | Source |
|---|---|---|
| R01 | A whole session needs no touch after it starts. Any touch that does happen is counted, timed and logged with what forced it. | NS §1 |
| R02 | Talk is the main channel. No phrase has to be memorised; a sentence in the person's own words is always accepted. | NS §1 |
| R03 | Steering uses a small, finite set of commands, each with one meaning everywhere. | NS §4 |
| R04 | Body signals are used sparingly. Held postures come before repeated motions. Nothing that loads a wrist (no knock, no repeated flick). | NS §2; WP §1, G1, G7 |
| R05 | The person's weak side is never required. For the owner: the right hand. | WP §1 |

### 3.2 Learning
| # | Requirement | Source |
|---|---|---|
| R06 | X starts with a small birth vocabulary and grows only by addition. | NS §2 |
| R07 | X learns from the person's verdict: keep, change or drop. | NS §2 |
| R08 | What X has learned acts without a fresh interpretation. | NS §2 |
| R09 | Everything X has learned can be listed, changed and removed by the person, by talking. **(added)** | NS §4 "fungible" |
| R10 | Signals and rules can differ by context (time, activity or another differentiator). | NS §4 |
| R11 | X ships with no content chosen in advance. Content types are acquired through use. | NS §2, §5 |
| R37 | X's memory is kept on the device and synced with GitHub. X learns in operation (it keeps what it learned, on every device) and in function (the build reads what was learned and X is improved from it). | NS §2, owner 2026-11-18 |

### 3.3 Experience
| # | Requirement | Source |
|---|---|---|
| R12 | One thing is in front at a time. No dashboard. | NS §2 |
| R13 | Several threads run at once. X announces when one is ready. | NS §1 |
| R14 | X speaks and shows. Nothing is read on the watch. | WP ledger turn01 |
| R15 | X never blames and never asks for a phrase to be repeated. Where a guess can be undone, X acts on it. | NS §1 "chocolate" |
| R16 | The practical uses work by talk and signals: a feed, weather and traffic, research, a market question, art and music, a game. | NS §2 |

### 3.4 Sources and the arbiter
| # | Requirement | Source |
|---|---|---|
| R17 | X works with any one source present, and with voice alone. | NS §4 |
| R18 | The watch, a hand seen by the camera and a head seen by the camera are sources. Each reports in one common shape. | NS §4 |
| R19 | Each person registers their own signals. One signal, one meaning. | NS §4 |
| R20 | An arbiter decides whose report counts, by a rule stored per context. Rules cover: one source overrides, one source is a fallback, one source is exclusive. | NS §4 |
| R21 | X knows whether each source is absent or merely silent. | owner's research 2026-11-18 |
| R22 | X shows and logs which source it obeyed. | owner's research 2026-11-18 |
| R23 | Camera signals need a plain web page and nothing installed. | owner 2026-11-18 |

### 3.5 Reach
| # | Requirement | Source |
|---|---|---|
| R24 | X builds and maintains no connector of its own. It reaches the world through what an AI already reaches. | NS §3 |
| R25 | AI is used only at named steps, in a fixed order. | NS §2 |
| R26 | An answer carries its sources, and the evidence is kept with it. **(added, from the owner's own pages)** | prism, market-navigator |
| R27 | Anything that sends, deletes or spends waits for an explicit yes. Pairing is hardened now, not later. | WP §6; owner 2026-11-18: "why wouldn't we just do that" |

### 3.6 Platform
| # | Requirement | Source |
|---|---|---|
| R28 | X runs in a browser on a phone and on a desktop. No app is installed on the phone. | WP §11.6 |
| R29 | The watch runs only during an X session: it starts for X, stops from X, sleeps by itself when X is gone, and cannot stop by accident. | WP §14.1 |
| R30 | The watch works with its screen off at a known battery cost per hour. | WP ledger turn03 |
| R31 | No IDE. GitHub builds; the owner only deploys. | WP §11.1 |
| R32 | All diagnostics are shown in the app and logged where the build can read them. Pairing codes are masked. No credentials in the repo. | WP §6a, §11.1 |
| R33 | Every release is real end to end. No screen without function behind it. | NS §5 |

### 3.7 Measurement
| # | Requirement | Source |
|---|---|---|
| R34 | Hand time is measured in every session: minutes, touches, seconds of touching. | NS §1 |
| R35 | Each signal has a hit rate and a wrong-fire rate, measured during X-like use, since the watch is off outside a session. | owner 2026-11-18 |
| R36 | Every record labels fact and theory. | owner preference |

## 4. Out of scope until the owner says otherwise
- An administrative assistant (mail, calendar). The owner ranked it last.
- Distribution to other people. Personal use first (WP §11.6).
- Rings, and Doublepoint's watch kit. Both dropped by the owner on 2026-11-18.
