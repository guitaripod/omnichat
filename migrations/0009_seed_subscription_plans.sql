-- Seed subscription plans
INSERT INTO subscription_plans (id, name, price_monthly, price_annual, battery_units, daily_battery, features, created_at, updated_at)
VALUES 
  ('starter', 'Starter', 399, 3999, 10000, 1000, '["10,000 battery units/month","1,000 daily battery allowance","Access to all AI models","Basic support"]', datetime('now'), datetime('now')),
  ('daily', 'Daily', 1299, 12999, 50000, 5000, '["50,000 battery units/month","5,000 daily battery allowance","Priority model access","Email support"]', datetime('now'), datetime('now')),
  ('power', 'Power', 2499, 24999, 100000, 10000, '["100,000 battery units/month","10,000 daily battery allowance","Fastest model access","Priority support"]', datetime('now'), datetime('now')),
  ('ultimate', 'Ultimate', 9999, 99999, 500000, 50000, '["500,000 battery units/month","50,000 daily battery allowance","Unlimited model switching","Dedicated support"]', datetime('now'), datetime('now'))
ON CONFLICT(id) DO UPDATE SET
  updated_at = datetime('now');