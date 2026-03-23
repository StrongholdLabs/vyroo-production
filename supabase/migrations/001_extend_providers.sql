-- Extend provider check constraint to support more providers
ALTER TABLE public.user_api_keys DROP CONSTRAINT IF EXISTS user_api_keys_provider_check;
ALTER TABLE public.user_api_keys ADD CONSTRAINT user_api_keys_provider_check
  CHECK (provider IN ('claude', 'openai', 'gemini', 'together'));

-- Add optional provider config
ALTER TABLE public.user_api_keys ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}';
