-- Add billingInterval column to user_subscriptions table
-- This tracks whether a subscription is monthly or annual
ALTER TABLE user_subscriptions ADD COLUMN billing_interval TEXT CHECK (billing_interval IN ('monthly', 'annual'));

-- Create index for faster billing interval queries
CREATE INDEX idx_user_subscriptions_billing_interval ON user_subscriptions(billing_interval);

-- Note: Existing subscriptions will have NULL billing_interval
-- The webhook handler will set this value when processing subscription events