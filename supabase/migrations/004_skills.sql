-- Add enabled_skills to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS enabled_skills TEXT[] DEFAULT ARRAY['web-research', 'code-assistant', 'document-writer'];

-- Skills registry table
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

-- RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Skills are readable by all authenticated users
CREATE POLICY "Skills are viewable by authenticated users"
  ON public.skills FOR SELECT
  USING (auth.role() = 'authenticated');

-- Seed default skills
INSERT INTO public.skills (id, name, description, icon_name, category, tools, sort_order) VALUES
  ('web-research', 'Web Research', 'Deep search and web browsing capabilities for finding information', 'search', 'core', '["web_search", "browse_url", "extract_content"]'::jsonb, 1),
  ('code-assistant', 'Code Assistant', 'Code generation, review, debugging, and refactoring', 'code', 'core', '["generate_code", "review_code", "debug_code"]'::jsonb, 2),
  ('document-writer', 'Document Writer', 'Create reports, summaries, and analyze documents', 'file-text', 'core', '["write_report", "summarize", "analyze_doc"]'::jsonb, 3),
  ('image-analysis', 'Image Analysis', 'Vision capabilities for understanding and describing images', 'eye', 'analysis', '["analyze_image", "describe_image"]'::jsonb, 4),
  ('data-analyst', 'Data Analyst', 'Analyze CSV files, spreadsheets, and create data visualizations', 'trending-up', 'analysis', '["analyze_csv", "create_chart", "statistics"]'::jsonb, 5),
  ('connected-services', 'Connected Services', 'Use data from your connected integrations and services', 'link-2', 'integration', '["connector_query"]'::jsonb, 6)
ON CONFLICT (id) DO NOTHING;
