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
            return json.loads(response.content)
        except:
            # Fallback for parsing errors
            return {"error": "Failed to parse final report", "raw": response.content}

report_agent = ReportAgent()
