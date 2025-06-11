-- Add cascade delete constraint to messages table
-- This ensures messages are automatically deleted when their conversation is deleted

-- SQLite doesn't support ALTER TABLE to add foreign key constraints
-- So we need to recreate the table with the constraint

-- First, create a temporary table with the new schema
CREATE TABLE messages_new (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  parent_id TEXT,
  is_complete BOOLEAN DEFAULT 1,
  stream_state TEXT,
  tokens_generated INTEGER DEFAULT 0,
  total_tokens INTEGER,
  stream_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES messages(id)
);

-- Copy data from the old table
INSERT INTO messages_new 
SELECT * FROM messages;

-- Drop the old table
DROP TABLE messages;

-- Rename the new table
ALTER TABLE messages_new RENAME TO messages;

-- Recreate indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_parent_id ON messages(parent_id);

-- Also update attachments table for cascade delete
CREATE TABLE attachments_new (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Copy data from the old table if it exists
INSERT INTO attachments_new 
SELECT * FROM attachments WHERE EXISTS (SELECT 1 FROM attachments LIMIT 1);

-- Drop the old table if it exists
DROP TABLE IF EXISTS attachments;

-- Rename the new table
ALTER TABLE attachments_new RENAME TO attachments;

-- Recreate indexes
CREATE INDEX idx_attachments_message_id ON attachments(message_id);

-- Update schema version
INSERT INTO schema_version (version, name) VALUES (5, '0005_add_cascade_delete.sql');