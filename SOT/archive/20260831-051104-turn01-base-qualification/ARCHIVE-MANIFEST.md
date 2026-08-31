# SOT Turn 01 Base failed qualification archive

- Run: `20260831-051104-turn01-base-qualification`
- Installer commit under test: `bf22254a0f7dc105e4b2a489a5ff3f961caef613`
- Installer blob under test: `4b104b4a26a595974ff4bce48e9e28e2fa83de2a`
- Failure gate: the installer structural audit rejected its own embedded literal `wslpath -w "$profile"`
- Qualification stopped before generated HTML qualification.
- No generated HTML was qualified or cut over.
- Failed generated HTML must not be used as an implementation ancestor.
- Supplied failed-run evidence path: `SOT/archive/20260831-051104-turn01-base-qualification/qualification.log`
- Repository evidence status at archive time: the supplied qualification log path was not present in GitHub; no log was fabricated.
