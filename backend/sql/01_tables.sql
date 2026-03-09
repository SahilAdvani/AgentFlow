-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the internal Agent Memory table (for Collaborative RAG Context)
CREATE TABLE IF NOT EXISTS agent_memory (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB,
  embedding VECTOR(1536) -- Matches OpenAI text-embedding-3-small dimension
);

-- 3. Create the Persistent History table (for User Generated Reports)
CREATE TABLE IF NOT EXISTS reports_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  idea TEXT NOT NULL,
  report_json JSONB NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
