# SOT Turn 01 R3 deterministic rebuild prechange archive

Date: 2026-09-05

- Branch base / then-current main: `c5f5903c1d7e2a66b4d1863bb64e551255c87f6f`
- Rejected live R2 UI source: `SOT-turn01-base.html`
- R2 UI blob: `8125cc8df5bec3e47dd0be2edc922a128bf7bed4`
- Canonical installer blob before R3: `5146613923ff097f9309cf1cdc0f1945b6a9349f`
- Plan blob before R3: `3044a40297d0edec95a8c31e726b37533fcd6e99`
- Graveyard blob before R3: `91641ccb26d75c34c6e40a49cac710c53571dc13`

Owner rejection: R2 was mechanically qualified but its right-hand project experience remained structurally poor and did not provide an intelligible operational path past storage/indexing. R3 preserves the qualified backend and rebuilds only the product surface around a deterministic, no-inference workflow.

R3 contract: read-only live project rail on the left; one selected-project operational workbench on the right; deterministic flow `Storage -> Index -> Review -> Plan -> Execute -> Protected`, with Activity/Diagnostics subordinate to the workflow. AI/provider inference is out of the R3 product surface.