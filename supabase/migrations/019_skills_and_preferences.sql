-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  occupation TEXT,
  bio TEXT,
  custom_instructions TEXT,
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'dark',
  product_updates BOOLEAN DEFAULT true,
  email_on_task BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own preferences" ON user_preferences FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fix skills table (may already exist from partial run — add ALL missing columns)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS system_prompt TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- RLS for skills
DROP POLICY IF EXISTS "Authors can insert skills" ON skills;
DROP POLICY IF EXISTS "Authors can update skills" ON skills;
DROP POLICY IF EXISTS "Authors can delete skills" ON skills;
CREATE POLICY "Authors can insert skills" ON skills FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update skills" ON skills FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete skills" ON skills FOR DELETE USING (auth.uid() = author_id);

-- User skills
CREATE TABLE IF NOT EXISTS user_skills (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, skill_id)
);
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users manage own user_skills" ON user_skills FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Drop restrictive category check constraint (Lovable created it with limited values)
ALTER TABLE skills DROP CONSTRAINT IF EXISTS skills_category_check;

-- Seed official skills (icon_name is NOT NULL in existing schema)
INSERT INTO skills (id, name, description, category, system_prompt, tools, is_official, icon, icon_name) VALUES
('stock-analysis', 'Stock Analysis', 'Analyze stocks using financial market data.', 'analysis',
 'You are a financial analyst. Use web_search for real-time stock data. Cite specific numbers. End with write_report.',
 '["web_search", "browse_url", "execute_code", "write_report"]', true, 'TrendingUp', 'TrendingUp'),
('similarweb-analytics', 'SimilarWeb Analytics', 'Analyze website traffic and competitive data.', 'analysis',
 'You are a web analytics expert. Focus on monthly visits, bounce rate, traffic sources. End with write_report.',
 '["web_search", "browse_url", "write_report"]', true, 'Globe', 'Globe'),
('market-research', 'Market Research', 'Deep market research with competitor analysis and sizing.', 'research',
 'You are a McKinsey market research analyst. TAM/SAM/SOM, competitor landscape, growth drivers. End with write_report.',
 '["web_search", "browse_url", "write_report", "execute_code"]', true, 'Search', 'Search'),
('pitch-deck', 'Pitch Deck Creator', 'Investor-ready pitch decks with data.', 'creative',
 'Create data-driven pitch decks: problem, solution, market, traction, financials. Search for data, then generate_presentation.',
 '["web_search", "browse_url", "generate_presentation"]', true, 'Presentation', 'Presentation'),
('data-analyst', 'Data Analyst', 'Statistical analysis and visualizations.', 'data',
 'Analyze data: analyze_csv, execute_code for stats, create_chart, write_report for insights.',
 '["analyze_csv", "execute_code", "create_chart", "write_report"]', true, 'BarChart3', 'BarChart3'),
('code-reviewer', 'Code Reviewer', 'Professional code review with security analysis.', 'code',
 'Senior staff engineer code review. Focus on security, performance, quality, error handling.',
 '["review_code", "generate_code"]', true, 'Code', 'Code'),
('skill-creator', 'Skill Creator', 'Create custom skills for Vyroo.', 'general',
 'Help users create custom skills. A skill has: name, description, category, system_prompt, tools. Output as JSON.',
 '["generate_code"]', true, 'Puzzle', 'Puzzle'),
('video-generator', 'Video Generator', 'AI video production workflow.', 'creative',
 'Video production specialist. Help plan: scripts, shot lists, storyboards.',
 '["generate_code", "write_report"]', true, 'Video', 'Video')
ON CONFLICT (id) DO NOTHING;
