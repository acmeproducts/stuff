# mkt — Market Navigator restore points

Each folder is a git snapshot: the front end and its data exactly as they sat together in one commit. Nothing was edited or mixed.

| Folder | Role | Commit | What it is |
|---|---|---|---|
| floor0-sep22-t26-daily-rebuild | Floor 0 (pre-method-change) | 8e4b8864c (Sep 22) | Turn 26 + daily full-rebuild index file (derived-indices.json). Last pair before the Sep 23 switch. |
| floor-sep27-t28-postship | Floor | 996e9a71b (Sep 27) | Turn 28 post-ship + root data at that commit. No Analyze surface. |
| mid-oct06-modular-analyze | Middle | 9bc57e080 (Oct 6) | Modular NOW + Analyze recovery + root data at that commit. |
| ceiling-oct22-rejected | Ceiling | 2da429140 (Oct 22) | Rejected app 67b5d7fe + its own data package. |

Earlier cross-wired candidates (candidate1-3) were removed: they mixed front ends and data from different points in time.

Data eras: (1) to Sep 22 index file rebuilt in full every day; (2) Sep 23 persistent index file, frozen at Sep 22, series window changed; (3) Oct 18+ sync pipeline (static history + daily append).
