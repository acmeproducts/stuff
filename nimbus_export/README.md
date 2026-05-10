# HAR-only asset export (upload HAR file)

## Use this exact flow

1. Chrome DevTools → Network.
2. Enable **Preserve log** and **Disable cache**.
3. Hard refresh and trigger lazy-loaded features.
4. Right-click request list: **Copy → Copy all as HAR (sanitized)**.
5. Paste into `HAR.txt` (or `session.har`).
6. Open `nimbus_export/har_uploader_extractor.html` in Chrome.
7. Upload HAR file and click **Extract + Download ZIP**.

## Why you saw "Files added: 0"

Your snippet shows `response.content` with `size`/`mimeType` but no `content.text`. Sanitized HAR often removes bodies.

The extractor now:
- parses raw `.txt` HAR text safely,
- tries HAR embedded body first,
- falls back to live re-fetch per URL when body is missing.

If it still shows 0, your network/CORS blocked fallback fetching.

## Output

`nimbus_export.zip` includes:
- `index.html`
- `assets/...` files
- `dependency-list.json` with:
  - `entry_js`
  - `dynamic_chunks`
  - `audio_files`
  - `textures_material_maps`
  - `fonts`
  - `worker_files`
