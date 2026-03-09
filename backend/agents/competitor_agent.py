from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import json
import os

class CompetitorAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0,
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "Identify competitors for: {startup_idea}"
            "\n\nContext:\n{memory_context}"
            "\n\nReturn JSON: {{'competitors': [{{'name': '...', 'strengths': '...', 'weaknesses': '...'}}]}}"
        )

    async def analyze_competitors(self, startup_idea: str) -> Dict[str, Any]:
        memory_results = vector_memory.query_memory(query=f"competitors for {startup_idea}", n_results=4)
        context = "\n".join(memory_results['documents'][0])
        
        chain = self.prompt | self.llm
        response = await chain.ainvoke({
            "startup_idea": startup_idea,
            "memory_context": context
        })
        
        vector_memory.add_memory(response.content, agent_name="CompetitorAgent", metadata={"type": "competitor_analysis"})
        
        try:
            return json.loads(response.content)
        except:
            return {"raw_analysis": response.content}

competitor_agent = CompetitorAgent()
