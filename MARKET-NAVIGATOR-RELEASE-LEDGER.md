# Market Navigator — Release Ledger

Status: **BINDING RELEASE-STATE AUTHORITY**
Updated: 2026-09-16

This file records release state only. It is not a parallel product plan. `MARKET-NAVIGATOR-MASTER-PLAN.md` defines the product/build requirements; `MARKET-NAVIGATOR-GRAVEYARD.md` defines rejected behavior; `MARKET-NAVIGATOR-BUILD-PROTOCOL.md` defines advancement mechanics. This ledger answers one mechanical question without historical hunting: **what exact artifact is the accepted baseline, what candidate is under test, and what stage is next?**

## 1. Binding rule

Market Navigator advances only as:

`accepted turn/stage baseline → one defined stage delta → candidate → qualification → owner disposition → ledger update`

A commit message, CI pass, Pages deployment, agent statement such as “qualified,” or merge to `main` does **not** make an artifact an accepted baseline.

Only a ledger entry with disposition **ACCEPTED** may be used as the ancestor for the next application stage.

If the owner rejects a candidate, mark it **REJECTED**, preserve the prior ACCEPTED row unchanged, and rebuild the same intended stage from that accepted row. Never search repository history to choose a convenient “last known good.”

## 2. Required identity for every stage

Every stage row must record:
- Turn number;
- Stage number and name;
- exact application path;
- exact application blob SHA;
- exact commit SHA containing that blob;
- exact defined delta from the preceding ACCEPTED stage;
- qualification result;
- owner disposition: `ACCEPTED`, `REJECTED`, or `PENDING OWNER VALIDATION`;
- public test URL when one existed;
- short notes identifying accepted capability or rejection reason.

No stage may advance while any of these identity fields is unknown. Missing historical identity is a governance defect to repair once, not permission to guess.

## 3. Current release state — governance hold

**TURN 26 IMPLEMENTATION IS ON HOLD.**

The previous 2026-09-16 governance edits incorrectly promoted commit `43e30cd31c4c2d83b49cf2eb532041cf5778006d` from an automated/agent-qualified Turn 25 publication to an owner-accepted “last-known-good” baseline. That promotion was unsupported and is revoked by this ledger.

The current `market-navigator-turn25-pre-ship.html` containing the nonfunctional `ⓘ` interaction is not an accepted baseline.

Commit `c3cde56268303d8e2a222012d5a34aee9f26651e` and its Index Explanation implementation are **REJECTED** as application ancestry.

The repository contains Turn 25 Library Print implementation/publication commits, including `ce7de422c871d7d80bc086dee3e514ca39f63e2c`, `a03a0f7912fc60ba49771b95286fbc6efc1f81fa`, and `25afe419ec81d7f26cb1a5a730364e65ef8f4d66`. Their existence or commit messages do not by themselves establish owner acceptance of the complete application stage.

Therefore the active state is:

| Turn | Stage | Artifact | Commit | Disposition | Meaning |
|---|---|---|---|---|---|
| 25 | prior accepted stage | identity to be restored from existing owner turn/stage record | — | **RECORD REPAIR REQUIRED** | Do not guess or substitute a later “qualified” commit. |
| 25 | failed Index Explanation candidate | `market-navigator-turn25-pre-ship.html` lineage containing broken `ⓘ` | `c3cde56268303d8e2a222012d5a34aee9f26651e` | **REJECTED** | Tap/focus cosmetic response without functional explanation modal. |
| 26 | objective explanation + NOW Print repair | not yet constructed | — | **NOT STARTED** | May begin only from the restored ACCEPTED Turn 25 stage row. |

## 4. One-time record repair

Before any Turn 26 application mutation, repair the missing Turn 25 stage ledger from the project's existing turn/stage evidence. This is **not** a hunt for “last known good.” It is recovery of the release record that should already have been carried forward.

The repair procedure is strictly:
1. reconstruct the Turn 25 stage sequence from contemporaneous Master Plan/Graveyard/build-governance commits and owner acceptance statements;
2. record each stage in order rather than choosing a commit by feature-name search;
3. distinguish `mechanically qualified` from `owner accepted`;
4. identify the latest stage explicitly accepted by the owner;
5. record its exact application blob SHA, commit SHA and test URL;
6. record every later stage as PENDING or REJECTED according to contemporaneous evidence;
7. commit the repaired ledger before application work;
8. update the Master Plan and Graveyard baseline references to the exact ACCEPTED ledger row.

If contemporaneous evidence cannot establish an owner-accepted stage, stop with the ledger saying exactly that. Do not nominate a baseline by inference.

## 5. Turn/stage naming from now on

A Turn is the owner-level body of work. A Stage is one independently defined and qualified delta inside that Turn.

Use immutable names in commits and reports:

`Turn <N> · Stage <N.M> · <name> · CANDIDATE|ACCEPTED|REJECTED`

Do not overwrite a stage identity by continuing to publish different application contents under the same ambiguous `turn25-pre-ship` identity without recording the blob and disposition here.

## 6. Advancement gate

Before implementation begins, the builder must print/read the current ACCEPTED ledger row and use **that exact commit + blob**. It may not choose a different ancestor because another commit is newer, has a successful workflow, contains a desired donor feature, or is called “qualified.”

After qualification, the candidate remains a candidate until owner disposition is recorded. Only then may the ledger advance the accepted pointer.

## 7. Current next action

**Governance only:** restore the Turn 25 stage ledger and reconcile the incorrect baseline references in the Master Plan and Graveyard. Do not implement Index Movement Explanation, NOW Print repair, or any other application change until that record is clean.