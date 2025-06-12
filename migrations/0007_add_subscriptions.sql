-- Add subscription and billing tables

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly INTEGER NOT NULL, -- in cents
  price_annual INTEGER NOT NULL, -- in cents
  battery_units INTEGER NOT NULL,
  daily_battery INTEGER NOT NULL,
  features TEXT NOT NULL, -- JSON array
  stripe_price_id_monthly TEXT,
  stripe_price_id_annual TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
);

-- User battery balance table
CREATE TABLE IF NOT EXISTS user_battery (
  user_id TEXT PRIMARY KEY,
  total_balance INTEGER NOT NULL DEFAULT 0,
  daily_allowance INTEGER NOT NULL DEFAULT 0,
  last_daily_reset TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Battery transactions table (for purchases and top-ups)
CREATE TABLE IF NOT EXISTS battery_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'subscription', 'bonus', 'refund', 'usage')),
  amount INTEGER NOT NULL, -- positive for credits, negative for usage
  balance_after INTEGER NOT NULL,
  description TEXT,
  stripe_payment_intent_id TEXT,
  metadata TEXT, -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  conversation_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  battery_used INTEGER NOT NULL,
  cached BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  date TEXT NOT NULL DEFAULT (date('now')), -- for daily aggregation
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Daily usage summary table (for performance)
CREATE TABLE IF NOT EXISTS daily_usage_summary (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  total_battery_used INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  models_used TEXT NOT NULL DEFAULT '{}', -- JSON object with model counts
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_battery_transactions_user_id ON battery_transactions(user_id);
CREATE INDEX idx_battery_transactions_created_at ON battery_transactions(created_at);
CREATE INDEX idx_api_usage_user_id_date ON api_usage(user_id, date);
CREATE INDEX idx_api_usage_conversation_id ON api_usage(conversation_id);
CREATE INDEX idx_daily_usage_summary_user_date ON daily_usage_summary(user_id, date);

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, price_monthly, price_annual, battery_units, daily_battery, features)
VALUES 
  ('starter', 'Starter', 499, 4790, 6000, 200, '["200 battery units per day","Rolls over unused daily battery","All AI models","30-day chat history","Basic export"]'),
  ('daily', 'Daily', 1299, 12470, 18000, 600, '["600 battery units per day","Rolls over unused daily battery","Unlimited chat history","File attachments (10MB)","Image generation","Priority support"]'),
  ('power', 'Power', 2999, 28790, 45000, 1500, '["1,500 battery units per day","Everything in Daily plan","File attachments (50MB)","Unlimited images","API access","Usage analytics","Custom prompts"]'),
  ('ultimate', 'Ultimate', 7999, 76790, 150000, 5000, '["5,000 battery units per day","Everything in Power plan","Team seats (5)","Advanced integrations","SLA support","Custom models"]');