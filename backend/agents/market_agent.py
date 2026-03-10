from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import json
import re
import os

class MarketAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile", 
            temperature=0,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "You are a market research analyst. Analyze market size and trends for: {startup_idea}"
            "\n\nUse this context from prior research:\n{memory_context}"
            "\n\nYou MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences."
            "\n\nRequired JSON format:"
            "\n{{"
            "\n  \"market_size\": \"estimated total market value as a string e.g. '$2.5 Billion'\","
            "\n  \"tam\": 2500,"
            "\n  \"sam\": 800,"
            "\n  \"som\": 150,"
            "\n  \"growth_rate\": \"estimated annual growth rate e.g. '12.5% CAGR'\","
            "\n  \"trends\": [\"trend 1\", \"trend 2\", \"trend 3\", \"trend 4\"]"
            "\n}}"
        )

    def _parse_json(self, text: str) -> dict:
        """Robustly parse JSON from LLM output, stripping markdown fences."""
        # Strip markdown code fences if present
        cleaned = re.sub(r'```(?:json)?\s*', '', text).strip()
        cleaned = cleaned.rstrip('`').strip()
        return json.loads(cleaned)

    async def analyze_market(self, startup_idea: str) -> Dict[str, Any]:
        # 1. Query memory for relevant research
        memory_results = vector_memory.query_memory(query=f"market research {startup_idea}", n_results=4)
        context = "\n".join(memory_results['documents'][0]) if memory_results['documents'][0] else "No prior research available."
        
        # 2. Analyze with LLM
        chain = self.prompt | self.llm
        response = await chain.ainvoke({
            "startup_idea": startup_idea,
            "memory_context": context
        })
        
        # Store in memory
        vector_memory.add_memory(response.content, agent_name="MarketAgent", metadata={"type": "market_analysis"})
        
        try:
            return self._parse_json(response.content)
        except Exception as e:
            print(f"[MarketAgent] JSON parse error: {e}")
            print(f"[MarketAgent] Raw response: {response.content[:500]}")
            return {
                "market_size": "Data unavailable",
                "tam": 0, "sam": 0, "som": 0,
                "growth_rate": "Data unavailable",
                "trends": ["Unable to parse market trends"],
                "raw_analysis": response.content
            }

market_agent = MarketAgent()
