<!-- PRISM-GRAVEYARD v2.1.0 -->
# PRISM GRAVEYARD v2.1.0

## Governance
Rejected architectures are not patched forward. Preserve accepted subsystems. A rollback of one failed architecture must not remove unrelated accepted product functionality.

## Standing vetoes
- no browser publisher fan-out on startup;
- no article-as-master-object; Event→Coverage→Source Article is canonical;
- no separate state universes per visualization;
- no sphere-only or treemap-only identity;
- no isolated generic AI chat;
- no unverified provider/model use;
- no disposable/localStorage-only analysis library;
- no destructive library import;
- no patching legacy prototypes into PRISM;
- no unexplained visual encoding;
- no controls without actual filtering;
- no reader underlap;
- no per-tab analytical control systems;
- no anonymous-dot Explore objects;
- no hand-rolled treemap;
- no filter catalog disconnected from selected dimensions;
- **no visualization rollback that amputates Sources, AI POV, provider validation, Analysis, or Library.**

## G22 · Corpus-wide sphere/card cloud
**Origin:** R3 Explore.
**Observed:** hundreds of event cards overlap inside a globe-like boundary.
**VETO:** do not render the entire filtered corpus as individually readable cards in one sphere.

## G23 · Giant perspective X×Y card matrix
**Origin:** R4 Explore, `prism-turn01-pre-ship-r4.html` @ `7988e0f397152afc06f3ae57009682c31fb2fd86`.
**Observed:** X×Y was implemented as a huge grid where each intersection immediately contained packed story cards.
**VETO:** macro X×Y cells may not directly pack the full story set.

## G24 · Separate legend duplicating filter semantics
**VETO:** no inert duplicate legend. Color filter chips carry the same visual colors and serve as filter + legend.

## G25 · Raw Importance range control
**VETO:** Importance must use useful governed buckets such as Critical / High / Medium / Low.

## G26 · R5 wall-of-cluster-cards / false cluster abstraction
**Origin:** R5 Explore gate @ `2439040d8e8764e86bc254a17c9247961faa9c63`.
**Observed:** macro view remained a wall of large cards; focused gate also broke established application behavior.
**VETO:** do not continue R5 or hand off isolated visualization gates that disable the app shell.

## G27 · Turn 01 pre-ship patch spiral
**Observed:** repeated Explore replacements changed geometry while product-level stability degraded.
**VETO:** no R6 patch-forward. Turn 01 Explore line is closed.

## G28 · Over-rollback / application amputation
**Origin:** initial Turn 02 pre-base @ `cc479854b86b6227a0ccd0976b3edcf6e9fd2495`.
**Observed:** rollback correctly removed rejected Explore geometry but also removed Sources, provider/model configuration, AI POV, selected-evidence research, and the Analysis Library. This transformed an Explore rollback into an application-wide feature regression.
**Root cause:** the reset incorrectly treated accepted non-Explore functionality as later-stage optional work instead of durable baseline functionality.
**VETO:** a rollback may remove the rejected subsystem only. It may not downgrade unrelated accepted capabilities.
**Replacement:** Turn 02 pre-base restores full Sources + provider validation + AI POV + Analysis Library + Map + Feed + search + reader + collapsible shell while leaving only Explore visualization reset.

## Recovery baseline for Turn 02
Preserve and validate together:
- collapsible left rail;
- central work surface;
- collapsible right context panel;
- Map and Feed;
- same-origin cache + IndexedDB;
- Event → Coverage → Source Article;
- global search and multi-selection;
- source manager;
- Devstream provider/model validation;
- AI POV with Markdown and safe hyperlinks;
- durable Analysis Library with reopen/continue/delete/export/import.

Only the Turn 01 Explore visualization implementations remain excluded.