# Review publication credential

October 18, 2026: the owner confirmed repository Actions secret `GITHUB_PAT` already exists. The qualified-review publication step now uses that secret and fails explicitly if unavailable. This allows its push to main to trigger the existing Pages workflow. No token value is read or stored in source. Application qualification remains required before publication.

Validation: workflow change is limited to publication credential selection and an empty-secret guard. Local Python rerun: 24 of 25 passed; immutable Turn 28 byte-identity check failed (actual blob 1768382aafe7080eef7066f5d5c2f5d6062eb10d versus expected 9ce7f67451f9e1b7804927ce5c56adb667614724). No application qualification or public delivery is claimed by this credential fix.
