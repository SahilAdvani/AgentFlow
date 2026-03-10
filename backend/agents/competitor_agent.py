from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import json
import re
import os

class CompetitorAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile", 
            temperature=0,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "You are a competitive intelligence analyst. Identify competitors for: {startup_idea}"
            "\n\nUse this context from prior research:\n{memory_context}"
            "\n\nYou MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences."
            "\n\nRequired JSON format:"
            "\n{{"
            "\n  \"competitors\": ["
            "\n    {{\"name\": \"Company A\", \"strengths\": \"what they do well\", \"weaknesses\": \"where they fall short\"}},"
            "\n    {{\"name\": \"Company B\", \"strengths\": \"...\", \"weaknesses\": \"...\"}}"
            "\n  ]"
            "\n}}"
        )

    def _parse_json(self, text: str) -> dict:
        """Robustly parse JSON from LLM output, stripping markdown fences."""
        cleaned = re.sub(r'```(?:json)?\s*', '', text).strip()
        cleaned = cleaned.rstrip('`').strip()
        return json.loads(cleaned)

    async def analyze_competitors(self, startup_idea: str) -> Dict[str, Any]:
        memory_results = vector_memory.query_memory(query=f"competitors for {startup_idea}", n_results=4)
        context = "\n".join(memory_results['documents'][0]) if memory_results['documents'][0] else "No prior research available."
        
        chain = self.prompt | self.llm
        response = await chain.ainvoke({
            "startup_idea": startup_idea,
            "memory_context": context
        })
        
        vector_memory.add_memory(response.content, agent_name="CompetitorAgent", metadata={"type": "competitor_analysis"})
        
        try:
            return self._parse_json(response.content)
        except Exception as e:
            print(f"[CompetitorAgent] JSON parse error: {e}")
            return {"competitors": [], "raw_analysis": response.content}

competitor_agent = CompetitorAgent()
