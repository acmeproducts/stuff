# HAR-only asset export (upload HAR file, no terminal tools)

You already have HAR data. Use the included browser tool to upload your HAR and export files.

## 1) Capture in Chrome

1. Open site and press `F12`.
2. Go to **Network**.
3. Enable **Preserve log** and **Disable cache**.
4. Hard refresh (`Ctrl+Shift+R`) and trigger lazy-loaded features.
5. In request table right-click: **Copy** → **Copy all as HAR (sanitized)**.
6. Paste into a file named `session.har`.

## 2) Run the extractor

1. Open `nimbus_export/har_uploader_extractor.html` in Chrome.
2. Upload `session.har`.
3. Click **Extract + Download ZIP**.
4. The tool generates `nimbus_export.zip` containing:
   - `index.html` (main document if present)
   - all `/assets/*` files with relative paths preserved exactly (`assets/...`)
   - `dependency-list.json` with categorized dependency lists

## 3) Verify completeness

After extraction, open `dependency-list.json` and confirm categories:

- `entry_js`
- `dynamic_chunks`
- `audio_files`
- `textures_material_maps`
- `fonts`
- `worker_files`

If anything is missing, recapture with cache disabled and include interactions that trigger lazy-loaded assets.
