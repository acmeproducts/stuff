# R10-CR1 owner authorization

- **Cycle:** `r10-recovery-2026-08-30`
- **Plan:** TalkBridge master plan v20.9.0, §4.11
- **Plan SHA-256:** `b45193f23f689b07b64a89341e6d55ee51662b6d2c6815b7b2e00c9af811a574`
- **Authorized at:** `2026-08-30T14:06:48-07:00`
- **Evidence:** User message in the active Codex thread after confirmation that
  the drift-prevention work was complete and forward execution was ready.
- **Exact words:** `Go`

This authorization advances the repository from `owner_go_required` to
`build_authorized` for exactly R10-CR1 §4.11. It permits only the product and
build-support paths declared in `talkbridge/governance/r10-cycle.json`. It does
not authorize any R10.5/R10.6 mechanism, credential-path change, provider
service, new secret, unrelated repository file, or deployment before the full
candidate gates pass.

---

# R10-CR2 owner authorization

- **Cycle:** `r10-recovery-2026-08-31`
- **Plan:** TalkBridge master plan v20.10.0, §4.12
- **Plan SHA-256:** `d685922e43613398ecbb208f76a1555e36995eadf2ef76d205d8b2bc21bd8e28`
- **Authorized at:** `2026-08-31T00:17:00-07:00`
- **Evidence:** Owner message in the active Claude thread after the CR1 device
  rejection was banked (root cause §9, graveyard G21/G22) and §4.12 was
  presented. Owner also recorded: during the locked-state calls the Android
  screen was off and sound was on.
- **Exact words:** `Go!`

Advances `owner_go_required` → `build_authorized` for exactly §4.12. Permits
only the declared product and build-support paths below.
