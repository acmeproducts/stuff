ALTER TABLE projects ADD COLUMN lifecycle_state TEXT NOT NULL DEFAULT 'idle';
ALTER TABLE projects ADD COLUMN mutation_generation INTEGER NOT NULL DEFAULT 0;
ALTER TABLE projects ADD COLUMN active_operation_id TEXT;

ALTER TABLE processing_runs ADD COLUMN operation_id TEXT;
ALTER TABLE processing_runs ADD COLUMN operation_generation INTEGER;

ALTER TABLE plans ADD COLUMN operation_id TEXT;
ALTER TABLE plans ADD COLUMN operation_generation INTEGER;

CREATE TABLE project_operations (
  operation_id TEXT PRIMARY KEY,
  project_token TEXT NOT NULL REFERENCES projects(project_token),
  kind TEXT NOT NULL CHECK (kind IN ('index','plan','execute')),
  generation INTEGER NOT NULL CHECK (generation > 0),
  state TEXT NOT NULL CHECK (state IN ('queued','running','paused','completed','failed','cancelled','interrupted')),
  created_at TEXT NOT NULL,
  started_at TEXT,
  updated_at TEXT NOT NULL,
  ended_at TEXT,
  detail_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(project_token,generation)
) STRICT;

CREATE UNIQUE INDEX idx_project_operations_one_active
  ON project_operations(project_token)
  WHERE state IN ('queued','running','paused');
CREATE INDEX idx_project_operations_project_time
  ON project_operations(project_token,created_at DESC);
CREATE INDEX idx_project_operations_state_time
  ON project_operations(state,updated_at DESC);

UPDATE projects
SET lifecycle_state=CASE
  WHEN evidence_revision > 0 THEN 'indexed'
  ELSE 'idle'
END,
active_operation_id=NULL;
