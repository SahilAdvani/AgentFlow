from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from memory.vector_memory import vector_memory
from typing import List, Dict, Any
import os

class ResearchAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile", 
            temperature=0.3,
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.prompt = ChatPromptTemplate.from_template(
            "You are an elite startup research analyst. Your job is to provide deep, data-driven research.\n\n"
            "Research Task: {task}\n\n"
            "Provide a comprehensive research summary covering:\n"
            "1. Key industry statistics and market data\n"
            "2. Current trends and growth drivers\n"
            "3. Challenges and risks in this space\n"
            "4. Relevant real-world examples or case studies\n"
            "5. Target audience insights\n\n"
            "Be specific with numbers, percentages, and concrete facts. "
            "Write 3-5 detailed paragraphs."
        )

    async def conduct_research(self, task: str) -> str:
        # 1. Generate research using Groq LLM
        chain = self.prompt | self.llm
        summary = await chain.ainvoke({"task": task})
        
        # 2. Store in shared vector memory
        content = summary.content
        vector_memory.add_memory(content, agent_name="ResearchAgent", metadata={"task": task})
        
        return content

research_agent = ResearchAgent()

