-- Semantic Search Function for Agent Context Memory
-- This must exactly match the RPC endpoint `match_agent_memory` expected by VectorMemory

CREATE OR REPLACE FUNCTION match_agent_memory (
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
) RETURNS TABLE (
  id TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN query
  SELECT
    agent_memory.id,
    agent_memory.content,
    agent_memory.metadata,
    1 - (agent_memory.embedding <=> query_embedding) AS similarity
  FROM agent_memory
  ORDER BY agent_memory.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
