-- Phase 2: Conversation persistence metadata
-- Adds auto-titling tracking, message count, and preview for sidebar

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS auto_titled BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS last_message_preview TEXT;
