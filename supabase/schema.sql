-- Vyroo Database Schema
-- Run this in the Supabase SQL editor to set up the database

-- Users profile (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  credits INTEGER DEFAULT 1000,
  enabled_skills TEXT[] DEFAULT ARRAY['web-research', 'code-assistant', 'document-writer'],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- API keys stored server-side (never sent to client)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('claude', 'openai', 'gemini', 'together')),
  encrypted_key TEXT NOT NULL,
  model_preference TEXT,
  provider_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '💬',
  type TEXT DEFAULT 'intelligence' CHECK (type IN ('intelligence', 'website', 'research')),
  is_complete BOOLEAN DEFAULT false,
  auto_titled BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  has_report BOOLEAN DEFAULT false,
  report_title TEXT,
  report_summary TEXT,
  table_data JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Steps (task execution steps within a conversation)
CREATE TABLE IF NOT EXISTS public.steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  step_number INTEGER NOT NULL,
  label TEXT NOT NULL,
  detail TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'complete')),
  icon_name TEXT DEFAULT 'sparkles',
  logs JSONB DEFAULT '[]',
  sub_tasks JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User connectors (integrations)
CREATE TABLE IF NOT EXISTS public.user_connectors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  connector_id TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  account_info JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, connector_id)
);

-- Skills registry
CREATE TABLE IF NOT EXISTS public.skills (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('core', 'analysis', 'integration')),
  is_premium BOOLEAN DEFAULT false,
  required_plan TEXT DEFAULT 'free' CHECK (required_plan IN ('free', 'pro', 'enterprise')),
  tools JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default skills
INSERT INTO public.skills (id, name, description, icon_name, category, tools, sort_order) VALUES
  ('web-research', 'Web Research', 'Deep search and web browsing capabilities', 'search', 'core', '["web_search", "browse_url", "extract_content"]'::jsonb, 1),
  ('code-assistant', 'Code Assistant', 'Code generation, review, and debugging', 'code', 'core', '["generate_code", "review_code", "debug_code"]'::jsonb, 2),
  ('document-writer', 'Document Writer', 'Reports, summaries, and document analysis', 'file-text', 'core', '["write_report", "summarize", "analyze_doc"]'::jsonb, 3),
  ('image-analysis', 'Image Analysis', 'Vision capabilities for image understanding', 'eye', 'analysis', '["analyze_image", "describe_image"]'::jsonb, 4),
  ('data-analyst', 'Data Analyst', 'CSV, spreadsheet, and data analysis', 'trending-up', 'analysis', '["analyze_csv", "create_chart", "statistics"]'::jsonb, 5),
  ('connected-services', 'Connected Services', 'Use data from your connected services', 'link-2', 'integration', '["connector_query"]'::jsonb, 6)
ON CONFLICT (id) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_steps_conversation_id ON public.steps(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_connectors_user_id ON public.user_connectors(user_id);

-- Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.steps ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can manage own conversations"
  ON public.conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messages"
  ON public.messages FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own steps"
  ON public.steps FOR ALL
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own api keys"
  ON public.user_api_keys FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE public.user_connectors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own connectors"
  ON public.user_connectors FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Skills are viewable by authenticated users"
  ON public.skills FOR SELECT
  USING (auth.role() = 'authenticated');

-- Enable realtime for messages and conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
