# Published review operations

Review: https://acmeproducts.github.io/stuff/market-navigator-etl-review/

The ETL workflow must exist on main for GitHub's schedule and workflow_dispatch interface. The exact workflow from passing source 1ff8dfd0f14e29cb72f34cb94545aa8ab325ef8c is installed on main; its application checkout remains the existing PR #916 branch. The owner does not need to rerun successful jobs. Routine runs process only eligible work, preserving healthy observations and the last qualified data on failure.

Passing integrated run: https://github.com/acmeproducts/stuff/actions/runs/39167242209
Passing Pages deployment: https://github.com/acmeproducts/stuff/actions/runs/39167381863
Published data version: 7f4c5201e83de290cd7aba9cc0d5757b18707ab5f1cc3bdb49e9531cc093f7f9
Latest run: qualified, 39 skipped, zero failed, zero missing observations.

The existing ETL UI routes retries to GitHub Actions with sign-in; it does not embed a PAT or pretend to dispatch directly from Pages. The latest public browser verification covered NOW, Analyze launch/close, Library parking/restoration, latest-data refresh and actual history. Physical Android acceptance is unverified.
