-- Revenue optimization events table
-- Stores flagged users for email campaigns: trial nudges, upgrade prompts,
-- annual plan offers, churn prevention, and overage tracking.

CREATE TABLE IF NOT EXISTS revenue_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'trial_expiry_nudge',
    'usage_upgrade_prompt',
    'annual_plan_offer',
    'churn_prevention',
    'overage_warning'
  )),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying by user and event type
CREATE INDEX idx_revenue_events_user_id ON revenue_events(user_id);
CREATE INDEX idx_revenue_events_event_type ON revenue_events(event_type);
CREATE INDEX idx_revenue_events_created_at ON revenue_events(created_at DESC);

-- RLS: service role only, no user access
ALTER TABLE revenue_events ENABLE ROW LEVEL SECURITY;

-- Only the service role (bypasses RLS) can read/write.
-- No policies for authenticated users means they have zero access.
CREATE POLICY "Service role full access" ON revenue_events
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
