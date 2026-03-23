-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to messages for RAG search
ALTER TABLE messages ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS messages_embedding_idx ON messages
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Function to search similar messages across conversations
CREATE OR REPLACE FUNCTION search_similar_messages(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  content text,
  role text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.conversation_id,
    m.content,
    m.role,
    m.metadata,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM messages m
  JOIN conversations c ON c.id = m.conversation_id
  WHERE
    m.embedding IS NOT NULL
    AND (p_user_id IS NULL OR c.user_id = p_user_id)
    AND 1 - (m.embedding <=> query_embedding) > match_threshold
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
