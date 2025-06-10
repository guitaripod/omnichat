-- Add streaming state fields to messages table
ALTER TABLE messages ADD COLUMN is_complete INTEGER DEFAULT 1;
ALTER TABLE messages ADD COLUMN stream_state TEXT;
ALTER TABLE messages ADD COLUMN tokens_generated INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN total_tokens INTEGER;
ALTER TABLE messages ADD COLUMN stream_id TEXT;

-- Create index for incomplete messages
CREATE INDEX idx_messages_incomplete ON messages (conversation_id, is_complete) WHERE is_complete = 0;

-- Create index for stream_id
CREATE INDEX idx_messages_stream_id ON messages (stream_id) WHERE stream_id IS NOT NULL;