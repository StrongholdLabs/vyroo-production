-- 008: Referral System
-- Tracks referral codes, sign-ups, and rewards

-- ─── Referrals table ───

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'rewarded')),
  reward_type TEXT NOT NULL DEFAULT 'free_month',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ─── Indexes ───

CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON public.referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON public.referrals(referrer_id);

-- ─── Row-Level Security ───

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referrals (as referrer or referred)
CREATE POLICY "Users can read own referrals"
  ON public.referrals
  FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Users can insert their own referrals (as referrer)
CREATE POLICY "Users can create own referrals"
  ON public.referrals
  FOR INSERT
  WITH CHECK (auth.uid() = referrer_id);

-- Users can update their own referrals (for marking completed/rewarded)
CREATE POLICY "Users can update own referrals"
  ON public.referrals
  FOR UPDATE
  USING (auth.uid() = referrer_id);

-- ─── Function to generate a unique referral code ───
-- Uses the first 8 characters of a UUID for a short, unique code

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE sql
VOLATILE
AS $$
  SELECT substring(replace(gen_random_uuid()::text, '-', '') FROM 1 FOR 8);
$$;
