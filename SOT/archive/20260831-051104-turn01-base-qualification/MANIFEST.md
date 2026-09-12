# Failed-run archive manifest

- Run: `20260831-051104-turn01-base-qualification`
- Installer commit under test: `bf22254a0f7dc105e4b2a489a5ff3f961caef613`
- Installer blob under test: `4b104b4a26a595974ff4bce48e9e28e2fa83de2a`
- Failed-run evidence (as supplied): `SOT/archive/20260831-051104-turn01-base-qualification/qualification.log`
- Failure gate: `INSTALLER_STRUCTURAL_AUDIT` — the installer's audit rejected its own embedded literal `wslpath -w "$profile"`
- Failure point: before generated HTML qualification
- Generated HTML qualified: none
- Generated HTML cut over: none
- Disposition: any generated HTML from this run must not be used as an implementation ancestor
