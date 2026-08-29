# Turn 01 Base-12 owner failure

Owner/device test after mechanical qualification rejected Base-12.

Observed failures:
- `F:` was present in the discovered volume inventory but its folder/data contents were not visible in the Base picker.
- `I:` was likewise discovered but its folder/data contents were not visible.
- the currently available drive/volume and folder navigation state did not persist; the selection context must be captured durably rather than reset when the picker is reopened or rerendered.

Interpretation:
- Base-12 corrected inventory authority but stopped one layer too early: Windows discovery could surface F:/I:, while folder enumeration still depended on WSL/Node filesystem access.
- Base-12 therefore remains failed evidence, not a baseline.
- the next Base must be rebuilt from the accepted clean Turn 01 lineage, not patched from Base-12.
- Windows-backed folder enumeration for dynamically discovered drives must use an access path that can actually enumerate the Windows volume when WSL Node enumeration cannot.
- picker navigation state (volume + current folder) must be durable project state and restored when the picker is reopened.
