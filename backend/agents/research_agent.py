from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from services.tavily_service import tavily_service
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import os

class ResearchAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0,
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "Summarize the following research for task: {task}"
            "\n\nResults:\n{search_results}"
        )

    async def conduct_research(self, task: str) -> str:
        # 1. Search Tavily
        search_context = await tavily_service.get_search_context(query=task)
        
        # 2. Summarize with LLM
        chain = self.prompt | self.llm
        summary = await chain.ainvoke({
            "task": task,
            "search_results": search_context
        })
        
        # 3. Store in memory
        content = summary.content
        vector_memory.add_memory(content, agent_name="ResearchAgent", metadata={"task": task})
        
        return content

research_agent = ResearchAgent()
