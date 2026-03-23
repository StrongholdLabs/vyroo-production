-- Workspace files: persistent storage for generated documents, slides, code
CREATE TABLE IF NOT EXISTS workspace_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,

  -- File metadata
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'document', -- document, presentation, code, data, image
  format TEXT NOT NULL DEFAULT 'markdown', -- markdown, html, json, pptx, csv, python, javascript

  -- Content
  content TEXT, -- Full content (markdown, code, etc.)
  metadata JSONB DEFAULT '{}', -- Extra data (slides array, table data, etc.)

  -- Size and versioning
  size_bytes INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,

  -- Organization
  project_id UUID, -- Future: group files by project
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast user file listing
CREATE INDEX IF NOT EXISTS workspace_files_user_idx ON workspace_files(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS workspace_files_conv_idx ON workspace_files(conversation_id);

-- RLS: users can only see their own files
ALTER TABLE workspace_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" ON workspace_files
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own files" ON workspace_files
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own files" ON workspace_files
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" ON workspace_files
  FOR DELETE USING (auth.uid() = user_id);
