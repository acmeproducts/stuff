<!-- PRISM-GRAVEYARD v2.0.0 -->
# PRISM GRAVEYARD v2.0.0

## Governance
Rejected architectures are not patched forward. Preserve only explicitly accepted subsystems. A full owner-directed rollback starts a new governed turn rather than continuing the rejected release line.

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
- no filter catalog disconnected from selected dimensions.

## G22 · Corpus-wide sphere/card cloud
**Origin:** R3 Explore.
**Observed:** hundreds of event cards overlap inside a globe-like boundary. Rotation/zoom does not solve collision or yield a macro analytical read.
**VETO:** do not render the entire filtered corpus as individually readable cards in one sphere.

## G23 · Giant perspective X×Y card matrix
**Origin:** R4 Explore, `prism-turn01-pre-ship-r4.html` @ `7988e0f397152afc06f3ae57009682c31fb2fd86`.
**Observed:** X×Y was implemented as a huge grid where each intersection immediately contained packed story cards.
**VETO:** macro X×Y cells may not directly pack the full story set.

## G24 · Separate legend duplicating filter semantics
**VETO:** no inert duplicate legend. When a field is Color, its filter chips carry the same visual colors and therefore serve as both filter and legend.

## G25 · Raw Importance range control
**VETO:** do not expose Importance as only an undifferentiated range control in Explore.
**Replacement:** Critical 80–100 / High 60–79 / Medium 40–59 / Low 0–39 buckets.

## G26 · R5 wall-of-cluster-cards / false cluster abstraction
**Origin:** R5 Explore gate, `prism-turn01-pre-ship-r5-explore.html` @ `2439040d8e8764e86bc254a17c9247961faa9c63`.
**Owner evidence:** screenshot 2026-08-31.
**Observed:** the supposed macro cluster view is still a wall of large cards. Each X×Y intersection visually behaves like another content card instead of a compact analytical cluster. The surface communicates little beyond row/column labels and selected top headlines. In addition, the focused gate discarded working application behavior: Map was inert and the left rail did not collapse.
**Root cause:** the build isolated Explore from the accepted application shell and substituted a card-based matrix for an actual analytical aggregation. It validated neither the whole application nor a useful macro representation.
**VETO:** do not continue R5, do not patch its matrix, and do not hand off isolated Explore gates that disable established navigation/shell behavior.

## G27 · Turn 01 pre-ship patch spiral
**Origin:** R3 → R4 → R5.
**Observed:** repeated local replacements of Explore changed geometry without restoring a stable product-level baseline. Each attempt accumulated new interpretation errors while other surfaces regressed or disappeared.
**Root cause:** continuing inside `01·pre-ship` after the visualization contract had fundamentally failed.
**VETO:** Turn 01 pre-ship is closed as a failed release line. No R6 patch-forward.
**Replacement:** owner-directed full rollback and **Turn 02 pre-base** from a clean shell/data foundation.

## Recovery baseline for Turn 02
Reuse concepts/code only where independently validated:
- collapsible left navigation rail;
- central work surface;
- collapsible right context panel;
- same-origin cache / IndexedDB direction;
- Event → Coverage → Source Article;
- ECharts-backed Map rather than custom layout;
- search and reader patterns;
- AI provider/model validation contract and Markdown/link rules as later reintroduction requirements;
- Library persistence contract as later reintroduction requirement.

Do **not** inherit any Turn 01 Explore implementation (R2 sphere, R3 sphere, R4 perspective matrix, R5 card matrix) as a visual baseline.
