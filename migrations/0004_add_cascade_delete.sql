-- Add cascade delete for messages when conversation is deleted
-- First drop existing foreign key constraint if it exists
DROP INDEX IF EXISTS idx_messages_conversationId;

-- Recreate messages table with ON DELETE CASCADE
CREATE TABLE messages_new (
  id TEXT PRIMARY KEY,
  conversationId TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  parentId TEXT,
  isComplete BOOLEAN DEFAULT true,
  streamState TEXT,
  tokensGenerated INTEGER DEFAULT 0,
  totalTokens INTEGER,
  streamId TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Copy existing data
INSERT INTO messages_new SELECT * FROM messages;

-- Drop old table and rename new one
DROP TABLE messages;
ALTER TABLE messages_new RENAME TO messages;

-- Recreate indexes
CREATE INDEX idx_messages_conversationId ON messages(conversationId);
CREATE INDEX idx_messages_createdAt ON messages(createdAt);
CREATE INDEX idx_messages_parentId ON messages(parentId);

-- Also add cascade delete for attachments when message is deleted
CREATE TABLE attachments_new (
  id TEXT PRIMARY KEY,
  messageId TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  mimeType TEXT,
  size INTEGER NOT NULL,
  url TEXT NOT NULL,
  metadata TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE
);

-- Copy existing data if table exists
INSERT INTO attachments_new SELECT * FROM attachments WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='attachments');

-- Drop old table if exists and rename new one
DROP TABLE IF EXISTS attachments;
ALTER TABLE attachments_new RENAME TO attachments;

-- Recreate indexes
CREATE INDEX idx_attachments_messageId ON attachments(messageId);