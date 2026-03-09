from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import os

class StrategyAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0,
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "Propose a strategy for: {startup_idea}"
            "\n\nContext:\n{memory_context}"
            "\n\nInclude 'uvp', 'go_to_market', and 'key_risks'."
        )

    async def propose_strategy(self, startup_idea: str) -> str:
        memory_results = vector_memory.query_memory(query=f"analysis for {startup_idea}", n_results=4)
        context = "\n".join(memory_results['documents'][0])
        
        chain = self.prompt | self.llm
        response = await chain.ainvoke({
            "startup_idea": startup_idea,
            "memory_context": context
        })
        
        vector_memory.add_memory(response.content, agent_name="StrategyAgent", metadata={"type": "strategy_proposal"})
        return response.content

strategy_agent = StrategyAgent()
