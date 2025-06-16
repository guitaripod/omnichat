-- Add subscription_upgrade transaction type to battery_transactions
-- This migration adds support for tracking prorated battery allocations during plan upgrades

-- SQLite doesn't support ALTER TABLE to modify CHECK constraints directly
-- We need to recreate the table with the updated constraint

-- Create temporary table with new schema
CREATE TABLE battery_transactions_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'subscription', 'subscription_upgrade', 'bonus', 'refund', 'usage')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  metadata TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy existing data
INSERT INTO battery_transactions_new 
SELECT * FROM battery_transactions;

-- Drop old table
DROP TABLE battery_transactions;

-- Rename new table
ALTER TABLE battery_transactions_new RENAME TO battery_transactions;

-- Recreate indexes
CREATE INDEX idx_battery_transactions_user_id ON battery_transactions(user_id);
CREATE INDEX idx_battery_transactions_created_at ON battery_transactions(created_at);