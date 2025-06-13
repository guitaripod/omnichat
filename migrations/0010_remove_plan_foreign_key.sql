-- Create new table without foreign key constraint
CREATE TABLE user_subscriptions_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TEXT NOT NULL,
  current_period_end TEXT NOT NULL,
  cancel_at TEXT,
  canceled_at TEXT,
  trial_end TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Copy existing data
INSERT INTO user_subscriptions_new SELECT * FROM user_subscriptions;

-- Drop old table
DROP TABLE user_subscriptions;

-- Rename new table
ALTER TABLE user_subscriptions_new RENAME TO user_subscriptions;

-- Create indexes
CREATE UNIQUE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_expires ON user_subscriptions(current_period_end);