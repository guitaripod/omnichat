-- Create schema version tracking table
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch()),
  checksum TEXT
);

-- Record current schema version
INSERT INTO schema_version (version, name) VALUES 
  (1, '0001_initial.sql'),
  (2, '0002_add_streaming_state.sql'),
  (3, '0003_add_audit_logs.sql'),
  (4, '0004_add_schema_version.sql');