# Wrist — graveyard

Approaches rejected or removed. Do not bring one back without the owner's explicit approval.

| # | Date | Buried | Why |
|---|---|---|---|
| G1 | 2026-11-16 | Wrist flick repeated once per screen as the scroll motion | Repeats the load that injured the right arm. Replaced by a held tilt. |
| G2 | 2026-11-16 | Hand wave as a signal | The swing with the hand vertical covers it with less motion. |
| G3 | 2026-11-16 | Gradle / Android Studio project | Owner wants no IDE anywhere. Plain SDK tools build the app in CI. |
| G4 | 2026-11-16 | Sending watch logs through the TalkBridge relay | That relay belongs to another project. |
| G5 | 2026-11-16 | Showing content on the watch (turn01 practice list) | Owner rejected: nothing is to be read on the watch. The watch reads motions; X on the phone or desktop shows the result. |
| G6 | 2026-11-16 | Keeping the watch screen on while Wrist runs (turn01, turn02) | Owner rejected: no reasonable battery life. Replaced by a background service with a resting mode. |
| G7 | 2026-11-17 | Knock as the "choose" motion | Owner: "the knock is not a good motion, it's going to exacerbate wrist problems." The device log also showed it firing during ordinary arm movement. Candidate replacement under trial in the Lab: hold still to choose. |
| G8 | 2026-11-17 | The single practice page (threads list only) | Replaced by the Wrist Lab: a grid of concepts, each recorded and rated. The list survives as the playground inside the scroll and swing cards. |
| G9 | 2026-11-17 | "Thumb verdict" card, where thumb down and palm up both meant "no" | Owner: "I don't think in any way we should have two gestures that mean the same thing." Replaced by "Four hand poses": four poses, four separate gestures, no meanings attached. |
| G10 | 2026-11-17 | Reading the OK sign as a finger shape | Withdrawn: this was a misreading. The owner means the arm pose (forearm about 47°, hand near throat height), which the watch can read. See the `ok` card. |
| G11 | 2026-11-17 | Pinch / OK probe card (prompted jolt detection) | Owner: "this is not intended to be trying to detect jolts." Built on a misreading of the OK sign. Replaced by the `ok` pose card. |
| G12 | 2026-11-17 | Touching the watch face as a "choose" gesture | A stopgap from turn01. The Wrist screen is now a diagnostics panel; a touch turns its page. Choosing is trialled in the Lab without touch (hold still to choose). |
| G13 | 2026-11-17 | Asking for a battery exemption from inside the app | The request does not exist on Wear OS, so the prompt never appeared and the flag never changed. The setting that matters is "Allow background activity" in the Galaxy Wearable app, which the panel now reports. |
| G14 | 2026-11-17 | A companion app on the phone, and a direct phone↔watch channel riding the Galaxy Wearable link (turn07) | Owner: X must also run on a desktop because it is browser-based; a phone app adds complexity; package push already has a mechanism (Bugjaeger). Closed before any work started. |
| G15 | 2026-11-18 | Rings as a sensing source | Owner: "ring is dead", too raw and too new. |
| G16 | 2026-11-18 | Doublepoint's watch kit in place of the owner's own watch app | Owner weighed it against what is built and chose to stay on the current path. |
| G17 | 2026-11-18 | X as a hub or router with connectors of its own | Owner: "you have to go off and construct bespoke connections and then you run around chasing those nightmares and maintenance issues forever and the app dies." X leverages AI. |
| G18 | 2026-11-18 | A roadmap built around one loop (talk, gateway acts, spoken reply, gesture verdict), with OpenClaw as X's back end | Owner: "that loop is not useful at all, you're conflating it with OpenClaw." X is not OpenClaw. |
| G19 | 2026-11-18 | Measuring wrong fires during unrelated daily life (all-day wear) | Owner: the watch application is turned off when X is exited. Wrong fires are measured only during X-like use. |
| G20 | 2026-11-18 | A guessed list of seven commands (yes, no, next, back, stop, talk, done) | Withdrawn as a guess. Replaced by commands derived from the learning loop (`x/X-CONCEPT.md` §3.1), seeded by the owner's own devstream commands. |
| G21 | 2026-11-18 | X as "one question to an AI that does everything", and X as a composite of the owner's existing pages | Owner: "there's a very specific order of operations where things become AI assisted"; the existing work is "a floor", and the job is "the various stair steps to get to the ceiling". |
| G22 | 2026-11-18 | The five-thread roadmap as a list of tasks (WRIST-PLAN §14) | Owner: "incredibly light"; "not a feature list, not a task list, but a development plan". Replaced by `x/X-ROADMAP.md`. |
| G23 | 2026-11-18 | Any dashboard, or a set of feeds chosen in advance | Owner: "it definitely isn't a dashboard, that's just clutter." |
| G24 | 2026-11-18 | "X 1.0 is one use case done fully" | My cut, replaced: X 1.0 is the learning system at the end of the walk stage (`x/X-DESIGN.md` D18). |
| G25 | 2026-11-18 | X's memory kept only on the device, or stored on the relay | Owner: "why couldn't that be passed to the device so that it can be persisted in local storage and synced with GitHub … how else is this going to become a learning application both in operation and in function". Replaced by device plus GitHub sync (`x/X-DESIGN.md` D13, D21). |
