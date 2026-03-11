import os
from typing import List, Dict, Any
from tavily import TavilyClient
from dotenv import load_dotenv

load_dotenv()

# Domains that rate-limit scrapers aggressively — block them entirely
EXCLUDED_DOMAINS = [
    "github.com",
    "raw.githubusercontent.com",
    "gist.github.com",
    "stackoverflow.com",
    "reddit.com",
    "twitter.com",
    "x.com",
    "linkedin.com",
]

def _is_blocked_url(url: str) -> bool:
    """Secondary safety net: check if a URL belongs to a blocked domain."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in EXCLUDED_DOMAINS)

class TavilyService:
    def __init__(self):
        api_key = os.getenv("TAVILY_API_KEY")
        if not api_key:
            raise ValueError("TAVILY_API_KEY not found in environment variables")
        self.client = TavilyClient(api_key=api_key)

    async def search(self, query: str, max_results: int = 5) -> List[Dict[str, Any]]:
        """Perform a search using Tavily with blocked domains filtered out."""
        import asyncio
        try:
            raw = await asyncio.to_thread(
                self.client.search,
                query=query,
                max_results=max_results + 3,  # fetch extra to compensate for filtered results
                search_depth="advanced",
                exclude_domains=EXCLUDED_DOMAINS
            )
            # Secondary filter: strip any blocked URLs that slipped through
            if isinstance(raw, dict) and "results" in raw:
                raw["results"] = [
                    r for r in raw["results"]
                    if not _is_blocked_url(r.get("url", ""))
                ][:max_results]
            return raw
        except Exception as e:
            print(f"Tavily search error (non-fatal): {e}")
            return {"results": []}

    async def get_search_context(self, query: str, max_results: int = 5) -> str:
        """Build search context manually from filtered search results."""
        if not query or not query.strip():
            return "No research results found for an empty query."
        try:
            raw = await self.search(query=query, max_results=max_results)
            results = []
            if isinstance(raw, dict) and "results" in raw:
                results = raw["results"]
            elif isinstance(raw, list):
                results = raw

            if not results:
                return f"No web results found for: {query}"

            # Build a clean context string from the filtered results
            context_parts = []
            for r in results:
                title = r.get("title", "")
                content = r.get("content", "")
                url = r.get("url", "")
                if content:
                    context_parts.append(f"[{title}]({url})\n{content}")

            return "\n\n".join(context_parts) if context_parts else f"No relevant results for: {query}"

        except Exception as e:
            print(f"Tavily get_search_context error (non-fatal): {e}")
            return f"Search temporarily unavailable. Proceeding with base knowledge for: {query}"

    async def extract(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Extract content from specific URLs (excluding blocked domains)."""
        safe_urls = [u for u in urls if not _is_blocked_url(u)]
        if not safe_urls:
            return []
        return self.client.search(query="", urls=safe_urls, include_raw_content=True)

tavily_service = TavilyService()
