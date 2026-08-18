# SOT v0.4.1 — Build 6.7.2 Fingerprinting Telemetry Layout

Status: LOCKED owner requirements from 2026-08-18 review of 6.7.1.

Build 6.7.1 successfully established four-worker parallel indexing/fingerprinting, but the Fingerprinting workspace mixes active and completed folder rows in one table. The operator needs a strict three-tier layout.

## 1. Project name

The project name at the top of Fingerprinting remains directly editable inline.

- Enter saves.
- Blur saves.
- Escape cancels.
- Rename persists to the same project token.

## 2. TOP — currently active worker rows

For both Indexing and Fingerprinting, the top work area shows only the current work assigned to the four workers.

Columns, in this exact operator-facing order:

`Folder Name | Item Name | Size Cumulative | # of Files Cumulative | Start | End | Cumulative Minutes`

Rows:
- Worker 1
- Worker 2
- Worker 3
- Worker 4

Rules:
- one row per worker;
- Folder Name is the folder/source currently assigned;
- Item Name is the item/file currently being processed;
- Size Cumulative and Files Cumulative update live for that worker assignment;
- Start is set when the worker begins that assignment;
- End is blank while active and populated only if that worker row represents a completed assignment before it moves to the completed-card section;
- Cumulative Minutes is live elapsed time while active;
- idle workers remain visible as idle rows rather than disappearing.

## 3. MIDDLE — live project totals

Immediately under the active-worker table show one compact live totals band with exactly:

`# of Folders | # of Files | Size | Start | End | Cumulative Minutes`

Rules:
- totals are project/run totals, not one folder;
- update while indexing/fingerprinting runs;
- Start is the run/index start;
- End is blank while active and populated when the phase/run is complete;
- Cumulative Minutes updates live while active;
- during fingerprinting, actual processed/total fingerprint percentage may remain separately visible in the status summary because it has a valid denominator.

## 4. BOTTOM — completed indexed folder cards/rows

Completed folders are moved out of the active worker area and retained below in chronological completion order.

Columns:

`Folder Name | Size Cumulative | # of Files Cumulative | Start | End | Cumulative Minutes`

Rules:
- no Item Name column in completed rows;
- only completed/error folder work belongs here;
- active/pending folders never appear in this completed section;
- historical completed rows remain inspectable after the worker moves on;
- preserve canonical folder path in title/inspectable text.

## 5. No mixed-state table

The prior 6.7.1 table that intermingles active, pending, and completed folder rows is removed. Pending folders are represented through project totals/queue state, not as zero-value completed-looking rows.

## 6. Four-worker invariant

The UI always represents all four configured workers. The user must be able to see which worker is active, what each worker is processing, and which workers are idle.

No new service or port is introduced. This is a presentation/telemetry correction on top of the existing 6.7.1 parallel backend.
