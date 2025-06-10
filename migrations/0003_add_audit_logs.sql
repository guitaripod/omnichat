-- Create audit logs table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT, -- JSON string for additional data
  status TEXT NOT NULL, -- 'success', 'failure', 'error'
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);

-- Index for user+time queries (common pattern)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at);