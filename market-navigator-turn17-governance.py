from pathlib import Path

PLAN = Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE = Path('MARKET-NAVIGATOR-GRAVEYARD.md')
plan = PLAN.read_text()
grave = GRAVE.read_text()

# Turn 17's first qualification already established these contracts.  Keep this
# governance step replay-safe: it may run on a branch where the first Turn 17
# governance commit is already present.
existing = [
    "Each legend key reproduces that series' configured line style and visible thickness",
    'compact non-blocking chart overlay anchored at the top-right of the plot',
    'Active-series emphasis begins at selection, not at crosshair activation',
    '2. **Data**',
    'complete canonical observation history available to the application',
]
for item in existing:
    if item not in plan:
        raise SystemExit('Turn 17 prerequisite governance missing: ' + item)

addition = r'''

## Turn 17 card navigation and Library listen contract

### Contextual series-card navigation
The compact top-right component card includes **previous** and **next** arrow controls. The arrows traverse the currently selectable component series in the same order as the INDEX legend. The first component disables previous and the last component disables next; navigation does not wrap.

One arrow press is exactly equivalent to selecting the adjacent legend chip: it updates the active series, selected chip, card contents, and chart isolation together and leaves pointer-hover crosshair inspection immediately ready. There is no intermediate focus state and no second confirmation click.

### Library browser TTS
Market Navigator Library adopts the current PRISM Library browser-readout interaction as its TTS donor. It uses the browser Web Speech API (`SpeechSynthesisUtterance` / `speechSynthesis`) and does not add a TTS provider or network dependency in Turn 17.

The Library footer has **Chat** and **Listen** modes. Listen reads completed assistant analysis responses, supports play/pause, previous/next response, and previous/next readout row, and automatically advances through the current response and then subsequent completed assistant responses. Changing to Chat stops browser speech. TTS is presentation-only and must not mutate the Analysis record, frozen evidence, chart state, or conversation.

### Deferred backlog — downloadable TTS audio
**Downloadable MP3 TTS is deferred backlog and is explicitly out of Turn 17.** Browser `speechSynthesis` remains the playback mechanism for now. A future release may add a file-producing TTS engine/provider that renders the same analysis text into temporary audio and exposes an explicit MP3 download; generated audio must remain temporary unless the user explicitly downloads it.
'''
if '## Turn 17 card navigation and Library listen contract' not in plan:
    plan = plan.rstrip() + addition + '\n'

backlog_note = r'''

### Turn 17 deferred audio-export boundary
- Browser TTS playback is in scope and uses the PRISM Library interaction donor.
- Downloadable/generated MP3 audio is **backlog only**. Do not fake an MP3 export from `speechSynthesis`; add it only with a future file-producing TTS implementation.
'''
if '### Turn 17 deferred audio-export boundary' not in grave:
    grave = grave.rstrip() + backlog_note + '\n'

PLAN.write_text(plan)
GRAVE.write_text(grave)

for item in [
    'previous** and **next** arrow controls',
    'Library browser TTS',
    'SpeechSynthesisUtterance',
    'Downloadable MP3 TTS is deferred backlog',
]:
    if item not in plan:
        raise SystemExit('Turn 17 added governance missing: ' + item)

print('TURN 17 GOVERNANCE: PASS')
