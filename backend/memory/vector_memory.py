import chromadb
from chromadb.utils import embedding_functions
import os
from datetime import datetime

class VectorMemory:
    def __init__(self, collection_name: str = "agent_memory"):
        self.persist_directory = os.path.join(os.getcwd(), "chroma_db")
        self.client = chromadb.PersistentClient(path=self.persist_directory)
        self.openai_ef = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-3-small"
        )
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.openai_ef
        )

    def add_memory(self, content: str, agent_name: str, metadata: dict = None):
        """Add a memory entry from an agent."""
        if metadata is None:
            metadata = {}
        
        metadata.update({
            "agent": agent_name,
            "timestamp": datetime.now().isoformat()
        })
        
        memory_id = f"{agent_name}_{datetime.now().timestamp()}"
        
        self.collection.add(
            documents=[content],
            metadatas=[metadata],
            ids=[memory_id]
        )
        return memory_id

    def query_memory(self, query: str, n_results: int = 5):
        """Query memory for relevant entries."""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results

    def clear_memory(self):
        """Clear all memory for a new analysis session."""
        self.client.delete_collection(self.collection.name)
        self.collection = self.client.get_or_create_collection(
            name=self.collection.name,
            embedding_function=self.openai_ef
        )

vector_memory = VectorMemory()
