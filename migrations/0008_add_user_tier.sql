-- Add tier column to users table
ALTER TABLE users ADD COLUMN tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'paid'));

-- Update existing users based on subscription status
UPDATE users 
SET tier = 'paid' 
WHERE subscriptionStatus = 'active' 
   OR subscriptionStatus = 'trialing';

-- Create index for tier queries
CREATE INDEX idx_users_tier ON users(tier);