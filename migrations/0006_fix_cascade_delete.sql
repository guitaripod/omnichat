-- Fix cascade delete constraints for messages and attachments tables
-- This migration properly handles the existing table structures

-- First, handle the messages table
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

-- Copy data from the old messages table
INSERT INTO messages_new 
SELECT * FROM messages;

-- Drop the old messages table
DROP TABLE messages;

-- Rename the new table
ALTER TABLE messages_new RENAME TO messages;

-- Recreate indexes for messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_parent_id ON messages(parent_id);

-- Now handle the attachments table
-- Create new table with cascade delete and proper schema
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

-- Copy data from old attachments table, mapping old column names to new ones
INSERT INTO attachments_new (id, message_id, name, type, size, mime_type, url, uploaded_at)
SELECT 
  id,
  message_id,
  file_name as name,
  file_type as type,
  file_size as size,
  file_type as mime_type,  -- Using file_type as mime_type since we don't have mime_type in old schema
  url,
  datetime(created_at, 'unixepoch') as uploaded_at
FROM attachments;

-- Drop the old attachments table
DROP TABLE attachments;

-- Rename the new table
ALTER TABLE attachments_new RENAME TO attachments;

-- Recreate index for attachments
CREATE INDEX idx_attachments_message_id ON attachments(message_id);

-- Update schema version
INSERT INTO schema_version (version, name) VALUES (6, '0006_fix_cascade_delete.sql');