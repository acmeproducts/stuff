ALTER TABLE processing_runs
  ADD COLUMN stop_requested INTEGER NOT NULL DEFAULT 0 CHECK (stop_requested IN (0,1));

CREATE INDEX idx_processing_runs_project_control
  ON processing_runs(project_token,state,pause_requested,stop_requested,updated_at DESC);
