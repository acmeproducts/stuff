CREATE TABLE profile_revisions (
  revision INTEGER PRIMARY KEY AUTOINCREMENT,
  committed_at TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT 'reconcile',
  evidence_json TEXT NOT NULL DEFAULT '{}'
) STRICT;

CREATE TABLE tags (
  tag_id TEXT PRIMARY KEY,
  normalized_name TEXT NOT NULL UNIQUE CHECK(length(trim(normalized_name)) > 0),
  display_name TEXT NOT NULL CHECK(length(trim(display_name)) > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE tag_assignments (
  assignment_id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL REFERENCES tags(tag_id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK(target_type IN ('folder','file')),
  target_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(tag_id,target_type,target_key)
) STRICT;

CREATE INDEX idx_tag_assignments_target ON tag_assignments(target_type,target_key);
CREATE INDEX idx_tags_normalized_name ON tags(normalized_name);

INSERT INTO profile_revisions(committed_at,reason,evidence_json)
VALUES(strftime('%Y-%m-%dT%H:%M:%fZ','now'),'schema-6-bootstrap','{"source":"existing-current-observations"}');
