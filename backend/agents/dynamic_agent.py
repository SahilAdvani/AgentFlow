from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os

class DynamicAgent:
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile", 
            temperature=0.2, # Slight temperature for creativity while keeping focus
            api_key=os.getenv("GROQ_API_KEY")
        )
        self.parser = StrOutputParser()

    async def execute_task(self, role: str, instructions: str, context: str) -> str:
        prompt = ChatPromptTemplate.from_template(
            "You are an AI agent with the role: {role}.\n\n"
            "Your instructions are:\n{instructions}\n\n"
            "Context from previous tasks:\n{context}\n\n"
            "Please provide your response based strictly on your instructions and the context above."
        )
        chain = prompt | self.llm | self.parser
        result = await chain.ainvoke({
            "role": role, 
            "instructions": instructions, 
            "context": context if context.strip() else "No prior context."
        })
        return result

dynamic_agent = DynamicAgent()
