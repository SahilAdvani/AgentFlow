from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import json
import os

class MarketAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0,
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "Analyze market size/trends for: {startup_idea}"
            "\n\nContext:\n{memory_context}"
            "\n\nReturn JSON: {{'market_size': '...', 'trends': ['...'], 'growth_rate': '...'}}"
        )

    async def analyze_market(self, startup_idea: str) -> Dict[str, Any]:
        # 1. Query memory for relevant research
        memory_results = vector_memory.query_memory(query=f"market research {startup_idea}", n_results=4)
        context = "\n".join(memory_results['documents'][0])
        
        # 2. Analyze with LLM
        chain = self.prompt | self.llm
        response = await chain.ainvoke({
            "startup_idea": startup_idea,
            "memory_context": context
        })
        
        # Store in memory
        vector_memory.add_memory(response.content, agent_name="MarketAgent", metadata={"type": "market_analysis"})
        
        try:
            return json.loads(response.content)
        except:
            return {"raw_analysis": response.content}

market_agent = MarketAgent()
