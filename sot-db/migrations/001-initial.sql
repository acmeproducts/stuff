CREATE TABLE schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  checksum_sha256 TEXT NOT NULL,
  applied_at TEXT NOT NULL
) STRICT;

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE projects (
  project_token TEXT PRIMARY KEY,
  project_name TEXT NOT NULL CHECK (length(trim(project_name)) > 0),
  project_note TEXT NOT NULL DEFAULT '',
  workflow_step INTEGER NOT NULL DEFAULT 1 CHECK (workflow_step BETWEEN 1 AND 7),
  scope_revision INTEGER NOT NULL DEFAULT 0,
  evidence_revision INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
) STRICT;

CREATE TABLE sources (
  source_id TEXT PRIMARY KEY,
  project_token TEXT NOT NULL REFERENCES projects(project_token),
  normalized_path TEXT NOT NULL,
  operator_label TEXT NOT NULL DEFAULT '',
  operator_note TEXT NOT NULL DEFAULT '',
  preflight_status TEXT NOT NULL DEFAULT 'unknown',
  preflight_message TEXT NOT NULL DEFAULT '',
  last_preflight_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  removed_at TEXT,
  UNIQUE (project_token, normalized_path)
) STRICT;

CREATE TABLE processing_runs (
  run_id TEXT PRIMARY KEY,
  project_token TEXT NOT NULL REFERENCES projects(project_token),
  state TEXT NOT NULL CHECK (state IN ('Queued','WIP','Paused','Closed','Error','Interrupted')),
  phase TEXT NOT NULL DEFAULT 'queued',
  files_discovered INTEGER NOT NULL DEFAULT 0,
  bytes_discovered INTEGER NOT NULL DEFAULT 0,
  files_processed INTEGER NOT NULL DEFAULT 0,
  bytes_processed INTEGER NOT NULL DEFAULT 0,
  hashes_reused INTEGER NOT NULL DEFAULT 0,
  hashes_computed INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  current_source TEXT NOT NULL DEFAULT '',
  current_item TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ended_at TEXT,
  error_message TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE run_files (
  run_id TEXT NOT NULL REFERENCES processing_runs(run_id),
  source_id TEXT NOT NULL REFERENCES sources(source_id),
  relative_path TEXT NOT NULL,
  full_path TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  modified_ms REAL NOT NULL,
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','WIP','done','error')),
  content_sha256 TEXT,
  observation_id TEXT,
  reused INTEGER NOT NULL DEFAULT 0 CHECK (reused IN (0,1)),
  error_message TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (run_id, source_id, relative_path)
) STRICT;

CREATE TABLE content (
  content_sha256 TEXT PRIMARY KEY CHECK (length(content_sha256) = 64),
  size INTEGER NOT NULL CHECK (size >= 0),
  first_observed_at TEXT NOT NULL,
  last_observed_at TEXT NOT NULL
) STRICT;

CREATE TABLE observations (
  observation_id TEXT PRIMARY KEY,
  project_token TEXT NOT NULL REFERENCES projects(project_token),
  source_id TEXT NOT NULL REFERENCES sources(source_id),
  run_id TEXT NOT NULL REFERENCES processing_runs(run_id),
  normalized_path TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size >= 0),
  modified_ms REAL NOT NULL,
  content_sha256 TEXT NOT NULL REFERENCES content(content_sha256),
  path_hash TEXT NOT NULL CHECK (length(path_hash) = 64),
  observation_hash TEXT NOT NULL CHECK (length(observation_hash) = 64),
  first_observed_at TEXT NOT NULL,
  last_observed_at TEXT NOT NULL,
  UNIQUE (source_id, relative_path, observation_hash)
) STRICT;

CREATE TABLE current_observations (
  source_id TEXT NOT NULL REFERENCES sources(source_id),
  relative_path TEXT NOT NULL,
  observation_id TEXT NOT NULL REFERENCES observations(observation_id),
  last_run_id TEXT NOT NULL REFERENCES processing_runs(run_id),
  PRIMARY KEY (source_id, relative_path)
) STRICT;

CREATE TABLE target_holdings (
  content_sha256 TEXT PRIMARY KEY REFERENCES content(content_sha256),
  target_path TEXT NOT NULL UNIQUE,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified','error')),
  verified_sha256 TEXT NOT NULL,
  established_at TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE backup_holdings (
  content_sha256 TEXT PRIMARY KEY REFERENCES content(content_sha256),
  backup_path TEXT NOT NULL UNIQUE,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified','error')),
  verified_sha256 TEXT NOT NULL,
  established_at TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  last_error TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE plans (
  plan_id TEXT PRIMARY KEY,
  project_token TEXT NOT NULL REFERENCES projects(project_token),
  evidence_revision INTEGER NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('draft','approved','executing','complete','error','stale')),
  created_at TEXT NOT NULL,
  approved_at TEXT,
  completed_at TEXT
) STRICT;

CREATE TABLE plan_items (
  item_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id),
  content_sha256 TEXT NOT NULL REFERENCES content(content_sha256),
  source_observation_id TEXT NOT NULL REFERENCES observations(observation_id),
  action TEXT NOT NULL CHECK (action IN ('none','establish_target_backup','establish_backup')),
  size INTEGER NOT NULL CHECK (size >= 0),
  source_path TEXT NOT NULL,
  target_path TEXT NOT NULL DEFAULT '',
  backup_path TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','WIP','complete','error')),
  error_message TEXT NOT NULL DEFAULT '',
  UNIQUE (plan_id, content_sha256)
) STRICT;

CREATE TABLE actions (
  action_id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(plan_id),
  item_id TEXT NOT NULL REFERENCES plan_items(item_id),
  action_type TEXT NOT NULL CHECK (action_type IN ('copy_target','verify_target','copy_backup','verify_backup','none')),
  state TEXT NOT NULL CHECK (state IN ('WIP','complete','error')),
  source_path TEXT NOT NULL DEFAULT '',
  destination_path TEXT NOT NULL DEFAULT '',
  expected_sha256 TEXT NOT NULL,
  actual_sha256 TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  ended_at TEXT,
  error_message TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE certifications (
  certification_id TEXT PRIMARY KEY,
  project_token TEXT NOT NULL REFERENCES projects(project_token),
  evidence_revision INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('certified','invalidated')),
  certified_at TEXT NOT NULL,
  invalidated_at TEXT,
  detail_json TEXT NOT NULL
) STRICT;

CREATE TABLE events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_token TEXT,
  event_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  detail_json TEXT NOT NULL DEFAULT '{}'
) STRICT;

CREATE INDEX idx_sources_project ON sources(project_token);
CREATE INDEX idx_runs_project_time ON processing_runs(project_token, started_at DESC);
CREATE INDEX idx_run_files_work ON run_files(run_id, state, source_id, relative_path);
CREATE INDEX idx_observations_project_content ON observations(project_token, content_sha256);
CREATE INDEX idx_observations_source_path ON observations(source_id, relative_path, last_observed_at DESC);
CREATE INDEX idx_current_observation_id ON current_observations(observation_id);
CREATE INDEX idx_plans_project_time ON plans(project_token, created_at DESC);
CREATE INDEX idx_plan_items_plan ON plan_items(plan_id, action, state);
CREATE INDEX idx_actions_plan ON actions(plan_id, started_at);
CREATE INDEX idx_certifications_project ON certifications(project_token, certified_at DESC);
CREATE INDEX idx_events_project_time ON events(project_token, created_at DESC);

INSERT INTO settings(key,value,updated_at) VALUES
  ('schema_name','sot-clean','2026-08-23T00:00:00.000Z'),
  ('target_root','','2026-08-23T00:00:00.000Z'),
  ('backup_root','','2026-08-23T00:00:00.000Z'),
  ('hash_workers','4','2026-08-23T00:00:00.000Z');
