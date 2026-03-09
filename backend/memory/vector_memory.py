import os
from datetime import datetime
from supabase import create_client, Client
from openai import OpenAI

class VectorMemory:
    def __init__(self, collection_name: str = "agent_memory"):
        # We keep collection_name parameter for compatibility, 
        # though Supabase uses tables instead of collections.
        
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            print("WARNING: SUPABASE_URL or SUPABASE_KEY not found in environment. Shared memory will fail.")
        else:
            self.supabase: Client = create_client(supabase_url, supabase_key)
            
        self.openai_client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        )
        self.embedding_model = "text-embedding-3-small"
        self.table_name = collection_name # Default is "agent_memory", matches our SQL

    def add_memory(self, content: str, agent_name: str, metadata: dict = None):
        """Add a memory entry from an agent."""
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "agent": agent_name,
            "timestamp": datetime.now().isoformat()
        })
        
        memory_id = f"{agent_name}_{datetime.now().timestamp()}"
        
        # 1. Generate Embedding
        response = self.openai_client.embeddings.create(
            input=content,
            model=self.embedding_model
        )
        embedding = response.data[0].embedding
        
        # 2. Insert into Supabase
        try:
            self.supabase.table(self.table_name).insert({
                "id": memory_id,
                "content": content,
                "metadata": metadata,
                "embedding": embedding
            }).execute()
        except Exception as e:
            print(f"Error inserting memory to Supabase: {e}")
            
        return memory_id

    def query_memory(self, query: str, n_results: int = 5):
        """Query memory for relevant entries. Mirrors ChromaDB output format."""
        
        # 1. Generate Embedding for the query
        response = self.openai_client.embeddings.create(
            input=query,
            model=self.embedding_model
        )
        query_embedding = response.data[0].embedding
        
        # 2. Call the match_agent_memory RPC
        try:
            result = self.supabase.rpc(
                "match_agent_memory",
                {
                    "query_embedding": query_embedding,
                    "match_count": n_results
                }
            ).execute()
            
            records = result.data
            
            # 3. Format strictly to match ChromaDB's {'documents': [[...]]}
            documents = [[record["content"] for record in records]]
            metadatas = [[record["metadata"] for record in records]]
            ids = [[record["id"] for record in records]]
            distances = [[record["similarity"] for record in records]]
            
            return {
                "ids": ids,
                "distances": distances,
                "metadatas": metadatas,
                "documents": documents
            }
            
        except Exception as e:
            print(f"Error querying memory from Supabase: {e}")
            return {"documents": [[]], "metadatas": [[]], "ids": [[]], "distances": [[]]}

    def clear_memory(self):
        """Clear all memory for a new analysis session."""
        try:
            # Delete all rows where id is not null (effectively truncates the table)
            self.supabase.table(self.table_name).delete().neq("id", "0").execute()
        except Exception as e:
            print(f"Error clearing memory in Supabase: {e}")

vector_memory = VectorMemory()
