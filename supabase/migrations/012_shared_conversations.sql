-- Phase 12: Conversation sharing
-- Adds sharing support so users can share read-only conversation links

-- Add sharing columns to conversations
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS share_id TEXT UNIQUE;

-- Create index for fast share_id lookups
CREATE INDEX IF NOT EXISTS idx_conversations_share_id ON public.conversations (share_id) WHERE share_id IS NOT NULL;

-- Public access policy: anyone can read shared conversations by share_id
CREATE POLICY "Anyone can read shared conversations"
  ON public.conversations
  FOR SELECT
  USING (is_shared = true AND share_id IS NOT NULL);

-- Public access policy: anyone can read messages for shared conversations
CREATE POLICY "Anyone can read messages of shared conversations"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations
      WHERE conversations.id = messages.conversation_id
        AND conversations.is_shared = true
        AND conversations.share_id IS NOT NULL
    )
  );
