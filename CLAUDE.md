# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What this repository actually is

This is **not** a single, organized application. It's a personal working
directory that has been checked into git as-is: hundreds of loose top-level
files (mostly standalone `.html` prototypes), a large number of overlapping
planning documents, several unrelated side-projects in subdirectories, and
one small "real" scaffolded app. There is no single build, no test suite,
and no linting/CI gate beyond a static-file deploy.

Before making changes, don't assume the repo has the shape of a typical
single-purpose project. Figure out which of the "pieces" below a task
actually belongs to, and work within that piece's own conventions.

All 63 commits in history are authored by one account
(`acmeproducts <182510693+acmeproducts@users.noreply.github.com>`) over a
~3-day span, with several PRs merged from agent-driven branches (`codex/...`).
Treat this as a single-owner personal repo, not a team codebase with
established review norms — but still write clear commit messages, since
that owner (and future agent sessions) are the ones who have to read them
later.

## The pieces

### 1. TalkBridge / "Talk + Say" — the recurring real project

The bulk of the repo's *intentional* effort is one product, described under
two overlapping names: **TalkBridge** and **Talk + Say** (a live bilingual
conversation app, "Talk", plus a companion phrasebook/catalog flow, "Say").
It's built as versioned standalone HTML files rather than a conventional
source tree — there is no bundler for this app; each `bridge*.html` /
`talkbridge-*.html` / `talk-say-*.html` file is a complete, self-contained
build.

Key docs, roughly from most to least authoritative — **read these before
touching any `bridge*`/`talkbridge*`/`talk-say*` file**:

- `talkbridge/TALKBRIDGE-MASTER-PLAN-v7.html` (and `-v6.html`) — current spec.
  `talkbridge/TALKBRIDGE-MASTER-PLAN.md` is just a pointer to these.
- `TalkBridge-Build-Specification.md` — authoritative "whole product" build spec.
- `TALK-SAY-PRD.md` — current PRD (v1.2). `TALK-SAY-PRD-v1.md` is an earlier
  draft, kept for history.
- `talkbridge-master.md` — the build-process runbook: defines a
  checkpoint/gate protocol for an agent ("CC") executing numbered build
  turns against `bridge-turnNN-*.html` files.
- `bridge-build-plan-v4.md` (supersedes `bridge-build-plan-v2.md`) — the
  current machine-executable build plan naming the active baseline file.
- `talkbridge/TALKBRIDGE-BUILD-LOG.md`, `TALKBRIDGE-BUILD-MAP.md`,
  `TALKBRIDGE-EXTRACTION-MAP.md` — where in the current baseline each
  feature actually lives.
- `talkbridge/TALKBRIDGE-GRAVEYARD.md` — record of abandoned approaches;
  check this before reviving anything from `archive/`.
- `KNOWLEDGE-TRANSFER.md` — a lineage/baseline audit that also documents a
  known critical transcript bug; useful handoff context.
- `QA_LIFECYCLE_SCRIPT.md` — manual two-browser QA script for the chat flow.
- `FINAL_ACCEPTANCE_SAMSUNG_CHROME_2026-04-09.md` — most recent device
  acceptance run (result: blocked, no Samsung device farm available).

Supporting data/asset directories:

- `archive/` — ~65 superseded whole-file versions of the bridge app. This is
  a manual version-control graveyard predating reliance on git history.
  Don't treat anything here as current without cross-checking the graveyard
  doc above.
- `phrasebook/` — ~113 JSON phrasebook datasets, heavily versioned
  (`phrasebook-en-th-1001.json` … `-1026.json`, plus other language pairs).
  `phrasebook/PAIR_SELECTION.md` says which versions are actually canonical
  — don't assume the highest number is current without checking it.
- `fastType/` — vendored fastText WASM language-detection library (model +
  wasm + JS wrapper), used by TalkBridge's language-detection pipeline.
  Has its own `README.md`, `manifest.sha256.txt`, and `provenance.json` —
  treat it as third-party, don't hand-edit the model/wasm.
- `fastType_pkg/` — an older/duplicate vendoring of the same fastText
  package under different filenames. Prefer `fastType/`; this looks like
  leftover cruft rather than a second live dependency.
- `packs/` — an in-progress/likely-abandoned "mood packs" feature
  (sound/message bundles per mood). Several `delete.txt` sentinel files
  suggest this was staged for removal and never finished — confirm intent
  with whoever's driving before building on it.
- Two PWA manifests exist with **different `start_url` values**:
  `manifest.json` (generic `"."`) vs `manifest.webmanifest`
  (`"./bridge-turn08-base.html"`, a specific — likely stale — prototype).
  If you touch PWA config, reconcile these rather than adding a third.

### 2. `src/` — a separate, currently-unbuildable Vite/React app

`src/App.tsx`, `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`,
`eslint.config.js`, and the `tsconfig*.json` files describe a small
Vite + React + TypeScript + Tailwind app (currently a "coastal destination
finder" demo), scaffolded via **bolt.new** (`.bolt/config.json` pins the
`bolt-vite-react-ts` template).

**This app has no `package.json` of its own.** The only root
`package.json` in the repo declares an unrelated project (`oauth-proxy`,
see below) with `axios`/`express` as its only dependencies — a
`package-lock.json` audit confirms `react`, `vite`, `tailwindcss`, and
`typescript` do not appear anywhere in the lockfile. Running `npm install`
at the repo root will **not** make this app buildable.

If asked to work on this app: don't assume tooling exists just because the
config files do. Either recreate a proper `package.json` for it (with
`vite`, `@vitejs/plugin-react`, `react`, `react-dom`, `typescript`,
`tailwindcss`, `postcss`, `autoprefixer`, `eslint` + the plugins referenced
in `eslint.config.js`), or flag the gap to whoever asked rather than
silently assuming `npm run dev` works.

### 3. `combined_oauth_server_for_repo.js` + root `package.json`

The only package with a real, consistent dependency manifest: a small
Express/axios OAuth proxy server. `npm install` at repo root installs
*this* app's dependencies (and only this app's).

### 4. `supabase/functions/venice-ai/index.ts`

A Supabase Edge Function (Deno runtime) — likely a server-side proxy to the
Venice AI API. Edit in place; it deploys independently of everything else
here (via the Supabase CLI, not the GitHub Pages workflow).

### 5. `scripts/build-lineage-model.mjs`

Run via `npm run build:lineage` (defined in the root `package.json`).
Produces/updates `repo-scan.json` and `repo-scan-lineage.json` — an
automated index of file lineage across the many prototype versions. Recent
commit history shows this gets re-run and committed periodically
("Update repo-scan.json / repo-scan-lineage.json from live lineage").

### 6. Unrelated one-off side projects

These share the repo but have nothing to do with TalkBridge; treat each as
fully independent:

- `oc/` — "OpenClaw" WSL2 dev-environment setup (PowerShell scripts). Its
  own `README.md` documents required credentials (Tailscale, Venice AI,
  OpenRouter, etc.) and explicitly warns not to commit `secrets.ps1` —
  respect that if you touch this directory.
- `nimbus_export/` — a manual HAR-based website asset-ripping utility.
- `scraper/` — a scraping tool with target-site rules; contents include
  personal/sensitive target data. Avoid extending its scope without being
  asked, and don't surface its rules/targets in unrelated output.
- `betterclaw/` — a one-line placeholder `index.html`, not a real app.

### 7. Deploy pipeline

`.github/workflows/static.yml` deploys **the entire repository tree**
(`path: '.'`) to GitHub Pages on every push to `main`. There is no build
step, no filtering, and no separate "public" directory — every file at
every path becomes publicly served. Keep this in mind before adding
anything sensitive anywhere in the repo, not just in an obvious "secrets"
location.

`.deploy-nudge` is a placeholder file (just a timestamp) that gets touched
to force a trivial commit purely to trigger a redeploy — that's expected,
not a mistake, if you see a commit that only changes this file.

## Things that look like landmines but aren't (and vice versa)

- **`SECRETS.md`** is misleadingly named — it's a catalog of Easter-egg
  triggers for the `blue.html` interactive art piece, not credentials. Don't
  assume it's safe to ignore just because "secrets" files are usually
  sensitive, and don't assume real secrets live there.
- **`claude-bridge.md`** (repo root) contains only the line
  `Managed directly — no agent instructions` — a marker, not a real doc.
- Filenames like `bridge-turn08-pre-ship.html` / `-ship.html` /
  `-post-ship.html`, or `orbital8-v1.html` … `orbital8-v15.html`, are this
  repo's substitute for git branches/tags on the HTML prototypes. Don't
  "clean these up" by deleting older versions without checking the
  relevant build-map/graveyard doc first — the numbering is meaningful.
- `.env` is git-ignored (see `.gitignore`) and no `.env` is currently
  committed — keep it that way; put real credentials there or in your
  shell environment, never inline in any `.html`/`.js`/`.md` file, since
  everything here gets published (see Deploy pipeline above).

## Practical guidance for making changes

1. **Identify which piece a task belongs to first** (TalkBridge prototype,
   the Vite app, the oauth proxy, the Supabase function, or an unrelated
   side project) — conventions differ completely between them.
2. **For TalkBridge/bridge/talk-say work**: read the master plan and build
   log first, identify the current baseline file, and follow the
   checkpoint/gate protocol in `talkbridge-master.md` if one is in effect
   for the task. Don't just edit the highest-numbered file you find without
   confirming it's the actual current baseline.
3. **Don't expect `npm install && npm run dev` to run the Vite app** — see
   the `src/` section above; the tooling config exists but the package
   manifest doesn't.
4. **No automated tests exist.** Manual QA for the chat flow follows
   `QA_LIFECYCLE_SCRIPT.md`. There's no CI gate beyond the Pages deploy, so
   there's no safety net catching regressions — be conservative with
   large-file edits.
5. **This repo has no code review process** (single-author history) — hold
   yourself to the same care you'd use in a reviewed repo anyway, since a
   future session (human or agent) is the de facto reviewer.
