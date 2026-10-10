# SOT Release D — Backlog

Owner priorities, newest first. Each item has a recommendation so decisions are quick.

## B1 · Make SOT handable to another person (product readiness) — with B2
**Today:** the page is served from GitHub Pages; the API runs on the owner's machine (WSL) and is reached over Tailscale at one hard-coded hostname; the installer pins this repo's commits.
**Needed for someone else to get the same capability:**
1. One installer they run on their own machine (WSL/Ubuntu): installs the service, creates their database, asks for their own source/target folders. No owner-specific names in it.
2. The service also serves the web page itself (`http://localhost:8765/` or their Tailscale name), so the page and API are always the same version and nothing depends on GitHub Pages or this repo.
3. Per-user settings file (API address, folders, optional AI keys); the `?api=` link becomes a fallback.
4. A version number on the page and API with a "your page and service differ" warning.
5. A short README: install, first scan, add a folder, update, uninstall.
**Recommendation:** do B2 first, then 2 → 1 → 3 → 4 → 5. A fork of the repo is not the handoff; the installer is.

## B2 · Access control (who can reach my files)
**Facts today (from the code):**
- The GitHub Pages site is public even when the repo is private (private Pages needs GitHub Enterprise Cloud). Anyone with the URL can load the page; it contains the interface only, no file data.
- The data lives behind the API. The API has no login, allows any website to call it (CORS `*`), and listens on every network interface. Its only protection is that the Tailscale address is not reachable from the internet. If Tailscale Funnel is on for that address, it is reachable by anyone who has the URL, including delete and move actions.
**Needed:**
1. Check now: run `tailscale funnel status` on the host; it must say no Funnel is configured for this service.
2. Per-install secret token required on every API call (the page asks once, remembers per device).
3. CORS limited to the page's own address, not `*`.
4. Listen on localhost or the Tailscale interface only.
5. Delete/move calls require the token plus a fresh confirmation from the page; keep an audit line per action.
**Recommendation:** items 1–3 now (small), 4–5 with B1.

## B3 · Report as a diagram people can read at a glance
Replace the two bars with one proportional Euler/Venn diagram: outer area = SCANNED; inside it the ESTATE circle (UNIQUE + KEEP) and everything outside it is EXCESS; the TARGET circle overlaps ESTATE. Overlap = fits, ESTATE-only = DEFICIT (red), TARGET-only = AVAILABLE. Tap an area for the popup + Open in Search, same as today.
**Recommendation:** worth doing; keep the bars as a toggle for exact numbers.

## B4 · Streamlining the flow (suggestions, in order of value)
1. **Guided "Reduce to target" flow:** Report → Duplicates → pick which estate's copy wins → preview what leaves → move to Trash with undo. Today these are separate screens.
2. **KEEP priority by estate:** the owner ranks estates; the copy in the highest-ranked estate is KEEP. Removes surprises about which copy is kept.
3. **Saved views:** Duplicates, Untagged, Big files, Recently changed as one-tap presets next to Table/Grid.
4. **Why is this EXCESS?** One tap on a row shows its KEEP twin and where it lives.
5. **Undo for Trash** (restore from the last N actions).

## B5 · Typography and look (started)
Soft default look shipped (calm rows, 13px/1.5, one body weight, tabular numbers, contrast ≥ 7:1, no bold-on-hover). Remaining: apply the same type scale to Report, Estate, Grid and modals; optional light theme.
