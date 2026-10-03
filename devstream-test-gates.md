# DevStream owner test gates — Snowman and earth (b57)

Before you start: hard-refresh `devstream-test.html`, header must read **v1.0 b57**. Venice key cap raised (or OpenRouter credit added). Do gates in order; stop at the first failure and report its number.

## A. Truth on load (both projects)
| # | Do | Expect |
|---|---|---|
| A1 | Open the app, wait 20 s | Any run left "running" from before turns red with "interrupted" (never amber forever, never "Stalled") |
| A2 | Tap Snowman, then earth | The first tab (the active one) opens. Other tabs show `‖` and are grey |
| A3 | Open a `‖` tab | Chat is read-only; bar says "Reference only — <tab> is the active tab" with **Make active**; no compose box |
| A4 | Look at the active tab, nothing running | Nothing between chat and compose except chips (and one bar if the last run failed) |

## B. Plan is clean (Snowman)
| B1 | Open the plan (doc icon on the project card) | No `<plan>` tags; "Active Target: wsl.html"; a GRAVEYARD section; no mention of snow1.html as a target |

## C. One run, start to finish (each project; needs credit)
| C1 | Active tab: send "Reply with one sentence, do not change files" | Bar appears at once: **Working**, sentence changes (Reading → Asking <model> → Writing… N characters), progress bar moves, "last activity Ns ago" stays small |
| C2 | Wait for the reply | Bar disappears; reply shows; your message no longer says "not run yet"/"waiting"; tab dot green |
| C3 | Send a small real change (Snowman: "add a visible Flow label to the HUD"; earth: "make the jump button bigger") | Exactly one model call; commit lands in the project file (wsl.html / projects/earth.html), never snow1.html; **one new row** in the plan's RUN LOG; test link in the reply |
| C4 | Open the test link | The change is there |

## D. Failure and recovery
| D1 | Settings: put a wrong Venice key, send a message | Red bar: plain reason (e.g. "key was rejected") + one **↻ Run again**; one RUN LOG row "failed" |
| D2 | Restore the key, tap **Run again** | Runs and succeeds; tab goes green |
| D3 | Start a run, then close the tab for 4+ minutes, reopen (or open on another device) | Tab is red "interrupted"; **Run again** works; no manual reset needed |

## E. One active tab
| E1 | While the active tab is working, open a `‖` tab and tap Make active | Refused: "…is still working" |
| E2 | After it finishes, Make active | Tab moves first; old active tab shows `‖` |
| E3 | Tap `+` New tab, name it | New tab is first and active (refused while a run is in progress) |
| E4 | Tab menu (double-tap on phone, right-click or double-click on desktop) | Rename, Assign, Customize, Download, Share (+ Make active on `‖` tabs). No "Resolve blocker" |

## F. Nothing else broke
| F1 | Drag a tab | Reorders; the active tab always stays first |
| F2 | Drag a project card | Reorders projects |
| F3 | Tab ×, project trash, message ×, | Each asks before deleting; Cancel changes nothing |
| F4 | Attach an image (+), paste an image, drop a file | Chip appears; send keeps it; image shows in chat |
| F5 | Settings → Logging | Events listed; Download, Copy, Clear (Clear asks first) |
| F6 | Settings → Open Debug console | Log / Engines / State tabs, Copy, Clear |
| F7 | Engine chip; web toggle; coach toggle | Picker opens; web button flips ON/off; coach shows friendly wording and chips |
| F8 | Send buttons on a light theme (Warm) | "Send", "Run again", "Stop" text is readable |

Report format: gate number + pass/fail + a screenshot if fail.
