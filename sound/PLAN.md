# Sound of Time — plan and record

Single-file app: `sound/index.html`. Live: https://acmeproducts.github.io/stuff/sound/

## What the owner asked for (own words, condensed)
- "a way to show sound over time" that is "both information and art"; keep the tiled concept piece (1 minute → 100 years) AND add variations.
- Customization is paramount: shape, sound measurement/depiction, size, color. Mobile first.
- Same data, many presentations ("malleable").
- Percentage view as an option; silence hatched; horizon on by default; resolution ladder for drill up/down.
- 20 years of test data so the full range can be used.
- Playback with a timer and tone selection so one can "hear" certain times of day.
- Use: art, and "how was my week / day / that last meeting" — sound = tone/vibe of the moment.

## Build 1 — 2026-10-30
- Data: deterministic generator, 20 tiling years (364-day years, 13 × 4-week months), minute packets aggregated on demand: 10 octave bands, L90/L50/L10/Lmax, entropy, event rate, coverage. Hatching = no data. Future = faint.
- Spans: minute, hour, day, week, month, year, decade, life (horizon = lived + years ahead, default 40).
- Shapes: tiles (nested grid like the concept piece), rows (helicorder), ring, spiral (one turn per group).
- Show: 10 bands, loudness, bed + sparks, vibe (dominant band hue × tonality), coverage.
- Scale: absolute (20–100 dB), relative to own median, percentile within view, share % (time above 50 dB or energy).
- Look: resolution coarser/auto/finer, 5 palettes, 3 backgrounds, cell gap, group gap, ring hole, brightness, band order.
- Sound: play the view over 10 s–3 min as chord / pitch / melody, soft/warm/bright tone, root note, tap-to-hear.
- Summary sheet: typical, loudest, quietest, coverage, very-loud count, dominant band, band bars, a labelled-theory "vibe" sentence. Save view as PNG.
- Diagnostics: status line in-app; `?debug=1` prints tap hit results there.

Open assumptions (owner can override): calendar tiles with 364-day years; seconds are generated not stored; test data only, no microphone yet.

## Verified
- Lab (Playwright, 390×844, DPR 2, touch): all spans × shapes render without errors; tap selects; Open-unit drill works; sheet opens. Not yet verified on the owner's phone.
