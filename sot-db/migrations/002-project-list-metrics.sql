ALTER TABLE processing_runs
  ADD COLUMN folder_count INTEGER NOT NULL DEFAULT 0 CHECK (folder_count >= 0);

ALTER TABLE processing_runs
  ADD COLUMN top_level_item_count INTEGER NOT NULL DEFAULT 0 CHECK (top_level_item_count >= 0);

ALTER TABLE processing_runs
  ADD COLUMN worker_pid INTEGER;

ALTER TABLE processing_runs
  ADD COLUMN pause_requested INTEGER NOT NULL DEFAULT 0 CHECK (pause_requested IN (0,1));

CREATE TABLE path_fingerprints (
  normalized_path TEXT PRIMARY KEY,
  size INTEGER NOT NULL CHECK (size >= 0),
  modified_ms REAL NOT NULL,
  content_sha256 TEXT NOT NULL REFERENCES content(content_sha256),
  last_run_id TEXT NOT NULL REFERENCES processing_runs(run_id),
  verified_at TEXT NOT NULL
) STRICT;

CREATE TABLE folder_progress (
  run_id TEXT NOT NULL REFERENCES processing_runs(run_id),
  source_id TEXT NOT NULL REFERENCES sources(source_id),
  folder_path TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  child_folders INTEGER NOT NULL DEFAULT 0 CHECK (child_folders >= 0),
  files_discovered INTEGER NOT NULL DEFAULT 0 CHECK (files_discovered >= 0),
  bytes_discovered INTEGER NOT NULL DEFAULT 0 CHECK (bytes_discovered >= 0),
  files_processed INTEGER NOT NULL DEFAULT 0 CHECK (files_processed >= 0),
  bytes_processed INTEGER NOT NULL DEFAULT 0 CHECK (bytes_processed >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (run_id, source_id, folder_path)
) STRICT;

CREATE TABLE processing_workers (
  run_id TEXT NOT NULL REFERENCES processing_runs(run_id),
  worker_id INTEGER NOT NULL,
  phase TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  item TEXT NOT NULL DEFAULT '',
  started_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (run_id, worker_id)
) STRICT;

CREATE INDEX idx_path_fingerprints_content ON path_fingerprints(content_sha256);
CREATE INDEX idx_folder_progress_run_update ON folder_progress(run_id, updated_at DESC);
CREATE INDEX idx_processing_runs_active ON processing_runs(state, updated_at DESC);
