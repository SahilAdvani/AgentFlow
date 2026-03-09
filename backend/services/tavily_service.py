import os
from typing import List, Dict, Any
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

class TavilyService:
    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise ValueError("TAVILY_API_KEY not found in environment variables")
        self.client = TavilyClient(api_key=api_key)

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Perform a search using Tavily."""
        import asyncio
        return await asyncio.to_thread(self.client.search, query=query, max_results=max_results, search_depth="advanced")

    async def get_search_context(self, query: str, max_results: int = 5) -> str:
        """Get summarized search context for a query."""
        import asyncio
        if not query or not query.strip():
            return "No research results found for an empty query."
        return await asyncio.to_thread(self.client.get_search_context, query=query, max_results=max_results)

    async def extract(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Extract content from specific URLs."""
        # Note: Tavily Python SDK might have specific methods for extraction
        # If not directly available, we can use their search with include_raw_content
        return self.client.search(query="", urls=urls, include_raw_content=True)

tavily_service = TavilyService()
