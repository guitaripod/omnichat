-- Migration 0004: Add schema version tracking table
-- This migration only creates the table structure

CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL DEFAULT (unixepoch()),
  checksum TEXT
);