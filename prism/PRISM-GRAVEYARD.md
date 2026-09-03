<!-- PRISM-GRAVEYARD v3.0.0 -->
# PRISM GRAVEYARD v3.0.0

## Governance
Rejected work is evidence, not an implementation ancestor. Rollback means selecting an exact existing working artifact. The owner tests product behavior; mechanical gates do not substitute for that acceptance.

## Active rollback
- Artifact: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship.3`
- Blob: `f313268d418ee86c8f27054d7c10f714077d91fb`
- Test URL: https://acmeproducts.github.io/stuff/prism/prism-turn01-pre-ship.html?v=7988e0f397152afc06f3ae57009682c31fb2fd86

## Standing vetoes
- No synthesized rollback when the exact working artifact exists.
- No PRISM-specific temporary GitHub Actions/recovery workflow as a normal application publishing mechanism.
- No WSL/repository orchestration architecture for a static browser application.
- No whole-repository HEAD pinning in this shared repository; protect only PRISM files being changed.
- No application redesign disguised as a correction.
- No removal of established functionality to fix one surface.
- No metadata-only source-add success claim.
- No Library state that loses Omnisearch or continuation access on mobile.
- No Library continuation that leaves Library or omits current-web/direct-link behavior.
- No Explore implementation that creates/transforms one DOM object per event across the full corpus.
- No hidden Map/Explore/Feed rerender fan-out during ordinary interaction.
- No claim that syntax/anchor checks prove UX acceptance.

## Rejected application lineage
### R6–R14
Preserved as historical experiments. They contain useful individual ideas, but each was owner-rejected for recorded product defects. They are donors for understanding only, not wholesale ancestors.

### R15
Rejected. It attempted the Library/Explore correction but did not preserve the intended application behavior closely enough.

### R16
Rejected. It descended from R15 and therefore continued the wrong implementation lineage. The mobile Library and Explore corrections were mechanically asserted but did not restore the designed application satisfactorily.

### R17 attempted rebuild
Rejected before application publication. The attempt introduced a temporary `.github/workflows/prism-r17-rebuild.yml` workflow to perform application construction inside GitHub Actions. GitHub created a workflow run with zero jobs and failed before execution. The workflow was removed immediately. No R17 application artifact was published.

**VETO:** do not retry this release mechanism. PRISM does not need a custom build/release pipeline to edit and publish its static application.

## Process failure recorded 2026-09-02
The release process became a larger problem than the application change. Repeated lineage recovery, temporary workflows, repository-wide coordination and workbench mechanics displaced direct product development even though a working application already existed.

**Replacement:** return to the exact working application, keep the publishing path simple, make narrowly scoped changes, run lightweight mechanical checks, publish directly, and hand the resulting URL to the owner for testing.

## Still-valid product corrections
These requirements survive the rollback because they came from owner testing rather than from the rejected implementation machinery:
- Library has its own Omnisearch and Analysis list.
- An open mobile Analysis retains immediate Library/Omnisearch access.
- Analysis continuation has a protected bottom **Research web** composer using the configured verified provider and current web.
- AI/current-web research references have working direct links; paywalls are excluded except WSJ.
- Explore overview cluster count equals the unique cardinality of the selected Group dimension after active constraints.
- Seven active Source identities means seven Source clusters.
- Explore uses lightweight cluster overview + bounded drill-in and ordinary vertical scrolling.
- Hidden analytical surfaces are not rerendered unnecessarily.
