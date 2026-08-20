# SOT 6.9 — Path-centric project model, reusable fingerprint authority, and impact analysis

**Candidate:** `2026.08.20.6.9-wsl-path-centric-analysis`

## 1. Product model

A **Project is a user construct**: a named, editable collection of paths to analyze together. A path may belong to any number of projects. Project membership never determines whether fingerprint work is reusable.

The database authority is split into four independent concepts:

1. **Project** — user grouping, notes, lifecycle.
2. **Project path membership** — which source paths the user wants assessed in that project.
3. **Path/file observations** — durable inventory seen at a source location at a point in time.
4. **Content identity** — SHA-256-backed file identity and path/tree identity reusable across projects.

Projects may add/remove paths at any time. Removing a path from a project removes only membership; it does not delete prior observations/content fingerprints from the SOT database.

## 2. Path identity: do not key authority to drive letter

Absolute mount paths such as `/mnt/q/foo` are **locators**, not durable identity.

Use three levels of identity:

### Primary — content-root identity (authoritative)

After file hashing, compute a deterministic path tree/content root from sorted records:

`relative_path + size + sha256`

This is independent of drive letter and physical device. Two copied trees with identical files produce the same content-root identity.

### Secondary — metadata-tree identity (fast change detector)

Before hashing, compute a deterministic metadata signature from sorted records:

`relative_path + size + modified_at`

This is fast and useful for proving a previously fingerprinted path is unchanged **when the same stable volume identity is observed**. It is not authoritative across different devices because mtimes can be preserved or altered independently of content.

### Tertiary — stable volume identity + relative source path (relocation identity)

Record a stable volume identity where available (Windows volume GUID / filesystem UUID / volume serial) separately from the current mount/drive letter. Pair that stable identity with the path relative to the volume root.

This lets `Q:` becoming `P:` resolve to the same source tree without making the drive letter part of identity.

### Reuse rule

- Same stable volume + same relative path + unchanged metadata-tree signature: reuse prior file hashes without rereading file content.
- Different volume/device: metadata signature may identify a likely match, but authoritative reuse requires content identity evidence. Existing SHA-256 content objects are reused once individual files are proven/matched.
- Project membership never prevents reuse.

## 3. Canonical schema increment

### `volume_observations`

- `volume_id` stable canonical ID
- `observed_locator` current `/mnt/x` or browser handle locator
- `platform_identity` Windows volume GUID / fs UUID / serial where available
- `label`
- `first_seen_at`, `last_seen_at`

### `path_catalog`

- `path_id`
- `volume_id`
- `relative_root`
- `last_observed_locator`
- `metadata_tree_sha256`
- `content_tree_sha256`
- `file_count`, `folder_count`, `byte_count`
- `last_indexed_at`, `last_fingerprinted_at`

### `project_paths`

- `project_token`
- `path_id`
- `operator_label`
- `operator_note`
- `added_at`
- `removed_at`

A path can appear in multiple projects. Unique active membership is `(project_token,path_id)`.

### `file_catalog`

- `sha256` primary content identity
- `size`
- `first_seen_at`, `last_seen_at`

### `file_observations`

- `observation_id`
- `path_id`
- `relative_path`
- `filename`
- `size`
- `modified_at`
- `sha256` nullable until fingerprinted
- `status`
- `observed_at`

The existing `fingerprint_inventory` remains a run/work queue, not the long-term reporting authority.

## 4. Project Setup UX

### Define / recall / edit

Project Setup begins with a project selector:

- **New project**
- search/recent existing projects
- selecting an existing project loads its name, notes, and active path memberships into the staged Project pane
- Save changes updates project membership; it does not create a duplicate project

### Explorer is path-centric

Pane 2 is a modern explorer, not a folder checkbox list.

Ribbon:

- Back / Up
- breadcrumb/current locator
- **Add current path** — always available for a valid directory
- Refresh
- search/filter
- view/sort controls
- indexing status (`Reading <folder> · 327 folders · 4,812 files discovered…`)

Body may show both folders and files. Folder rows can be opened. The current directory itself is selectable as a project path, including deep subfolders.

Columns initially:

- Name
- Type
- Size
- Modified
- Items (for indexed folders)
- Fingerprint state

Sortable headers; column resize/reorder/persistence follow the repolist interaction model.

### Root pseudo-drive removed

There is no synthetic `Root` drive in Project Setup. Pane 1 lists only actual authorized/available volumes/roots.

### Invalid system paths

`$RECYCLE.BIN` is not a valid project path.

- shown in explorer with system/blocked treatment
- cannot be checked/added
- `Select All` excludes it
- Add Current Path is disabled when current path is inside `$RECYCLE.BIN`
- backend rejects it even if a client attempts to submit it

## 5. Incremental indexing

Explorer indexing is progressive and persistent.

- Immediate directory listing appears first.
- Background inventory enriches folder item counts, recursive bytes, latest modified time, and fingerprint state.
- Status reports current folder/path and counts discovered so the operator understands why metadata/search is incomplete.
- Search runs over persisted discovered metadata as it becomes available; it does not require one monolithic full-volume pass.
- Refresh performs a cheap change/stillness check and updates deltas.

## 6. Fingerprinting and cross-project reuse

When a project is scheduled:

1. Resolve each active `project_paths` membership to its current locator.
2. Inventory/update path observations.
3. For every file, first look for reusable hash evidence in the path/file catalog independent of project token.
4. Rehash only files that are new, changed, uncertain, or cannot be safely matched.
5. Update the global catalog and project analysis membership.

A duplicated path across two projects therefore creates no duplicate content-hash workload when unchanged.

## 7. Reporting / repolist

Reporting becomes **SOT Database Explorer** with project and path scopes.

Left: searchable projects.
Middle: active and historical project paths with counts/size/fingerprint state.
Right: repolist-style file table from durable observations/catalog.

Required table capabilities:

- omni-search
- sortable columns
- draggable column order
- resizable columns
- hide/show columns
- persistent preferences
- dense rows
- project/path scope filters
- duplicate/content-group indicators
- action-selection checkboxes (analysis only until an action plan is explicitly approved)

## 8. Analysis and impact prediction

Analysis is read-only and deterministic before any mutation.

First assessments:

- exact duplicate content by SHA-256
- duplicate bytes reclaimable
- path collisions / same relative name with different content
- unique-only content by source/path
- stale/unreadable observations
- target-capacity requirement

Impact preview must state, for a proposed action plan:

- files affected
- folders affected
- source bytes reclaimable
- bytes that must be copied to target
- target free space required (copy bytes + configured safety margin)
- files already present on target and therefore reusable/skippable
- conflicts requiring operator decision

No delete/copy is executed from an assessment. Assessment produces a deterministic proposed action set for later approval.

## 9. Release gates

1. Existing 6.8 scheduler and report-server topology remain healthy.
2. Project can be recalled and path membership added/removed without deleting global fingerprint data.
3. Deep current path can be added directly.
4. `$RECYCLE.BIN` blocked in UI and backend; Select All excludes it.
5. Synthetic Root row absent.
6. Same unchanged path assigned to two projects demonstrates hash reuse from global catalog rather than project-specific rehash.
7. Reporting can drill Project -> Path -> File and show Filename / Size / Modified / SHA / status from the durable catalog.
8. Analysis endpoint returns duplicate/reclaim/copy/target-space assessment without mutating filesystem state.
9. No new HTTP service, port, proxy, Tailscale topology, or helper daemon.
