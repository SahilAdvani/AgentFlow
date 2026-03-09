from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from typing import List, Dict, Any
import os

class ManagerAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4o", 
            temperature=0,
            base_url=os.getenv("OPENAI_BASE_URL")
        )
        self.parser = JsonOutputParser()
        self.prompt = ChatPromptTemplate.from_template(
            "Break this startup idea into 4 specific research tasks (Research, Market, Competitor, Strategy)."
            "\nIdea: {idea}"
            "\n\nReturn JSON: {{'tasks': ['task1', 'task2', ...]}}"
        )

    async def decompose_task(self, idea: str) -> List[str]:
        chain = self.prompt | self.llm | self.parser
        result = await chain.ainvoke({"idea": idea})
        return result.get("tasks", [])

manager_agent = ManagerAgent()
