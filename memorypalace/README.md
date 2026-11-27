# Memory Palace

A walkable 3D world (from [Spoken World](https://github.com/ryannli/spoken-world), Apache 2.0) where you pin cards to places.
Open `memorypalace/index.html` (served from this repo's Pages): the world opens at once, no key needed.

- **Config drawer** (gear, left): world name, GitHub repo + token, AI keys. Keys and token stay in this browser only.
- **AI**: Venice first, then OpenRouter, then Claude. Order and models are set in the drawer; "Load" lists a provider's models.
- **Cards** (columns icon, left): kanban-style cards (title, column, room, colour dot, tags, notes with `text--url` links, archive).
  "Pin here" puts a card in the world; walk near it and tap the chip to open it.
- **Sync**: same world name on any device = same world. Files: `palace/<world>/world.json` and `cards.json`.
  Last update wins. Each file keeps the three versions before the current one; Config → Restore brings one back (it becomes the newest).
  Without a token the page is read-only for that world.
- Voice uses the browser's speech recognition. "Make it real" (video) was removed with Gemini.
