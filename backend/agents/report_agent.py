from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import json
import re
import os

class ReportAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile", 
            temperature=0,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "You are a senior business consultant. Synthesize these findings into a comprehensive startup report for: {startup_idea}"
            "\n\nAll research context:\n{memory_context}"
            "\n\nYou MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences."
            "\nIMPORTANT: Every value in the JSON must be a plain STRING. Do not return nested objects or lists for any field."
            "\n\nRequired JSON format:"
            "\n{{"
            "\n  \"executive_summary\": \"2-3 paragraph executive summary of the opportunity\","
            "\n  \"market_analysis\": \"detailed market analysis with data points\","
            "\n  \"competitor_landscape\": \"analysis of key competitors and positioning\","
            "\n  \"strategy\": \"go-to-market strategy and unique value proposition\","
            "\n  \"recommendations\": \"3-5 key actionable recommendations\""
            "\n}}"
        )

    def _parse_json(self, text: str) -> dict:
        """Robustly parse JSON from LLM output, stripping markdown fences."""
        cleaned = re.sub(r'```(?:json)?\s*', '', text).strip()
        cleaned = cleaned.rstrip('`').strip()
        return json.loads(cleaned)

    async def generate_final_report(self, startup_idea: str) -> Dict[str, Any]:
        # Get top relevant memories
        memory_results = vector_memory.query_memory(query=f"summary {startup_idea}", n_results=6)
        context = "\n".join(memory_results['documents'][0]) if memory_results['documents'][0] else "No research data available."
        
        chain = self.prompt | self.llm
        response = await chain.ainvoke({
            "startup_idea": startup_idea,
            "memory_context": context
        })
        
        try:
            return self._parse_json(response.content)
        except Exception as e:
            print(f"[ReportAgent] JSON parse error: {e}")
            print(f"[ReportAgent] Raw response: {response.content[:500]}")
            # Return structured fallback with the raw content
            return {
                "executive_summary": response.content[:500] if response.content else "Report generation failed.",
                "market_analysis": "See executive summary for details.",
                "competitor_landscape": "See executive summary for details.",
                "strategy": "See executive summary for details.",
                "recommendations": "Please re-run the analysis."
            }

report_agent = ReportAgent()
