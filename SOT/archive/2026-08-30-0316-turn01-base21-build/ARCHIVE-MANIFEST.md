# Turn 01 Base-21 build record

**Stage:** `base`  
**Status:** BUILT — AWAITING MECHANICAL QUALIFICATION  
**Date:** 2026-08-30

Base-21 is a clean rebuild from the frozen accepted Turn 01 sources. Base-20 generated runtime is not an implementation input.

## Inputs

- Frozen backend: `9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js`
- Clean Base-3 integrator: `1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py`
- Frozen accepted UI: `7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html`

## Base-21 build artifacts

- Backend direct generator: `1c39bb2d73e8bec5592b56504f59cebc96db93cf/generate-SOT-turn01-base21.py`
- UI direct integrator: `6036e0a89dd7f239f5311bebe3e9dc7b96951916/integrate-SOT-turn01-base21-ui.py`
- Qualification installer: `df458ef446be914ed56c885d956bc5e263fd6942/install-SOT-turn01-base21.sh`

## Intended correction

Base-21 converges Source, Target, Backup and Source preflight onto the same `/turn01/volumes` + `/turn01/fs` Windows-native storage authority; removes legacy `/fs` from Source selection; reads Windows free/total capacity from Windows PowerShell; reuses one drive-inventory snapshot per picker session; restores Source picker to an assigned Source location; preserves project Target/Backup browse-state persistence; and retains stdin transport for WSL-to-Windows filesystem values.

The installer must mechanically prove the new Source/Target/Backup contract, Windows capacity, F:/I: Source preflight, existing active Windows Source preflight, inventory snapshot reuse, folder browse/create, schema 4, copied-DB persistence, exact inventory match, live health and rollback safety before the owner test URL is considered ready.
