# Review publication credential

October 18, 2026: hosted run 39166677786 passed scheduling, collection, three-level qualification, application browser checks and immutable Turn 28 comparisons. Publication stopped because Actions resolved secrets.GITHUB_PAT to an empty value.

Publication now uses the saved PAT when available, with the built-in job token as fallback. The job has contents:write and actions:write, and explicitly dispatches static.yml on main after publishing only the qualified candidate directory. No credential is exposed or extracted.

Local Python rerun: 25/25 pass after restoring accepted Turn 28 LF bytes (blob 9ce7f67451f9e1b7804927ce5c56adb667614724). Hosted artifact: https://github.com/acmeproducts/stuff/actions/runs/39166677786/artifacts/12151346154 . Public URL verification remains required.
