-- Remove foreign key constraints from api_usage table
-- SQLite doesn't support ALTER TABLE DROP CONSTRAINT, so we need to recreate the table

-- Create temporary table without foreign keys
CREATE TABLE api_usage_new (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    model TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    battery_used INTEGER NOT NULL,
    cached INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    date TEXT NOT NULL DEFAULT (date('now'))
);

-- Copy data from old table
INSERT INTO api_usage_new SELECT * FROM api_usage;

-- Drop old table
DROP TABLE api_usage;

-- Rename new table
ALTER TABLE api_usage_new RENAME TO api_usage;

-- Recreate indexes
CREATE INDEX idx_api_usage_user_id_date ON api_usage(user_id, date);
CREATE INDEX idx_api_usage_conversation_id ON api_usage(conversation_id);