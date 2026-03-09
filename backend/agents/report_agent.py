from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import json
import os

class ReportAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0,
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "Summarize these findings into a professional startup report for: {startup_idea}"
            "\n\nContext:\n{memory_context}"
            "\n\nOutput JSON with: 'executive_summary', 'market_analysis', 'competitor_landscape', 'strategy', 'recommendations'."
            "\nIMPORTANT: Every value in the JSON must be a plain STRING. Do not return nested objects or lists for any field."
        )

    async def generate_final_report(self, startup_idea: str) -> Dict[str, Any]:
        # Get top relevant memories
        memory_results = vector_memory.query_memory(query=f"summary {startup_idea}", n_results=6)
        context = "\n".join(memory_results['documents'][0])
        
        chain = self.prompt | self.llm
        response = await chain.ainvoke({
            "startup_idea": startup_idea,
            "memory_context": context
        })
        
        try:
            # Clean up markdown code blocks if present
            content = response.content.strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            return json.loads(content)
        except:
            # Fallback for parsing errors
            return {"error": "Failed to parse final report", "raw": response.content}

report_agent = ReportAgent()
