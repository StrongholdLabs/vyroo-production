-- Billing tables
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage subscriptions" ON subscriptions FOR ALL USING (true);

-- Usage tracking
CREATE TABLE IF NOT EXISTS usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ai_message', 'voice_input', 'connector_call', 'plugin_action')),
  model TEXT,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert usage" ON usage_records FOR INSERT WITH CHECK (true);

-- Usage limits per plan
CREATE TABLE IF NOT EXISTS plan_limits (
  plan TEXT PRIMARY KEY,
  monthly_messages INTEGER NOT NULL,
  monthly_voice_minutes INTEGER NOT NULL,
  max_connectors INTEGER NOT NULL,
  max_plugins INTEGER NOT NULL,
  models_available TEXT[] NOT NULL
);

INSERT INTO plan_limits VALUES
  ('free', 50, 5, 2, 1, ARRAY['gpt-4o-mini', 'gemini-1.5-flash']),
  ('pro', 2000, 60, 10, 5, ARRAY['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'gemini-1.5-pro', 'gemini-1.5-flash', 'llama-3.1-70b']),
  ('team', 10000, 300, 50, 20, ARRAY['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'claude-3-opus', 'gemini-1.5-pro', 'gemini-1.5-flash', 'llama-3.1-70b', 'llama-3.1-405b']),
  ('enterprise', -1, -1, -1, -1, ARRAY['gpt-4o', 'gpt-4o-mini', 'claude-3.5-sonnet', 'claude-3-opus', 'gemini-1.5-pro', 'gemini-1.5-flash', 'llama-3.1-70b', 'llama-3.1-405b'])
ON CONFLICT (plan) DO NOTHING;

-- Monthly usage summary view
CREATE OR REPLACE VIEW monthly_usage AS
SELECT
  user_id,
  COUNT(*) FILTER (WHERE type = 'ai_message') AS messages_used,
  COUNT(*) FILTER (WHERE type = 'voice_input') AS voice_minutes_used,
  SUM(tokens_used) AS total_tokens
FROM usage_records
WHERE created_at >= date_trunc('month', NOW())
GROUP BY user_id;
