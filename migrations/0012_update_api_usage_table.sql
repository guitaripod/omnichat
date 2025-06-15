-- Update api_usage table to match new schema
-- SQLite doesn't support ALTER TABLE ADD COLUMN with all our constraints, so recreate

-- Create new table with updated schema
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

-- Copy existing data, mapping cost to battery_used and adding default values for new columns
INSERT INTO api_usage_new (id, user_id, conversation_id, message_id, model, input_tokens, output_tokens, battery_used, cached, created_at, date)
SELECT 
    id,
    user_id,
    'migrated-' || id as conversation_id,  -- Use placeholder for missing conversation_id
    'migrated-' || id as message_id,       -- Use placeholder for missing message_id
    model,
    input_tokens,
    output_tokens,
    cost as battery_used,                  -- Map cost to battery_used
    0 as cached,
    datetime(created_at, 'unixepoch') as created_at,
    date(created_at, 'unixepoch') as date
FROM api_usage;

-- Drop old table
DROP TABLE api_usage;

-- Rename new table
ALTER TABLE api_usage_new RENAME TO api_usage;

-- Create indexes
CREATE INDEX idx_api_usage_user_id_date ON api_usage(user_id, date);
CREATE INDEX idx_api_usage_conversation_id ON api_usage(conversation_id);

-- Record migration
INSERT INTO schema_version (version, name, applied_at) 
VALUES (12, '0012_update_api_usage_table.sql', unixepoch());