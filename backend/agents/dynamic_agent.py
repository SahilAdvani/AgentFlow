from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import os


class DynamicAgent:
    def __init__(self):
        self.parser = StrOutputParser()

        # Groq LLaMA 3.3 70B — fast reasoning
        self.groq_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            api_key=os.getenv("GROQ_API_KEY"),
        )

        # OpenAI GPT-4o-mini via GitHub Models — higher quality
        self.openai_llm = None
        openai_key = os.getenv("OPENAI_API_KEY")
        openai_base = os.getenv("OPENAI_BASE_URL")
        if openai_key:
            try:
                from langchain_openai import ChatOpenAI
                self.openai_llm = ChatOpenAI(
                    model="gpt-4o-mini",
                    temperature=0.3,
                    api_key=openai_key,
                    base_url=openai_base or "https://models.github.ai/inference",
                )
            except ImportError:
                print("[DynamicAgent] langchain-openai not installed, OpenAI model unavailable. Using Groq fallback.")

        # Tavily web search
        self.tavily_available = False
        tavily_key = os.getenv("TAVILY_API_KEY")
        if tavily_key:
            try:
                from langchain_tavily import TavilySearchResults
                self.tavily_search = TavilySearchResults(
                    max_results=5,
                    api_key=tavily_key,
                )
                self.tavily_available = True
            except ImportError:
                print("[DynamicAgent] langchain-community not installed, Tavily unavailable.")

    def _get_llm(self, model: str):
        """Return the LLM instance for the given model key."""
        if model == "openai" and self.openai_llm:
            return self.openai_llm
        # Default fallback is always Groq
        return self.groq_llm

    async def execute_task(self, role: str, instructions: str, context: str, model: str = "groq") -> str:
        """
        Execute a task using the specified model.
        
        model options:
            - "groq"   → Groq LLaMA 3.3 70B (fast reasoning)
            - "openai" → GPT-4o-mini via GitHub Models (high quality)
            - "tavily" → Web search first, then summarize with Groq
        """

        # --- Tavily: search the web, then summarize ---
        if model == "tavily" and self.tavily_available:
            query = f"{instructions} {context[:500]}" if context.strip() else instructions
            try:
                search_results = await self.tavily_search.ainvoke(query)
                # Format search results into readable text
                search_text = ""
                if isinstance(search_results, list):
                    for i, result in enumerate(search_results, 1):
                        url = result.get("url", "")
                        content = result.get("content", "")
                        search_text += f"\n[{i}] {url}\n{content}\n"
                else:
                    search_text = str(search_results)

                # Now summarize with Groq
                summary_prompt = ChatPromptTemplate.from_template(
                    "You are an AI agent with the role: {role}.\n\n"
                    "Your instructions are:\n{instructions}\n\n"
                    "Context from previous tasks:\n{context}\n\n"
                    "Web search results:\n{search_results}\n\n"
                    "Based on the search results and context, provide a comprehensive response following your instructions."
                )
                chain = summary_prompt | self.groq_llm | self.parser
                return await chain.ainvoke({
                    "role": role,
                    "instructions": instructions,
                    "context": context if context.strip() else "No prior context.",
                    "search_results": search_text,
                })
            except Exception as e:
                print(f"[DynamicAgent] Tavily search failed: {e}, falling back to Groq reasoning.")
                # Fall through to standard LLM call below

        # --- Standard LLM call (Groq or OpenAI) ---
        llm = self._get_llm(model)
        prompt = ChatPromptTemplate.from_template(
            "You are an AI agent with the role: {role}.\n\n"
            "Your instructions are:\n{instructions}\n\n"
            "Context from previous tasks:\n{context}\n\n"
            "Please provide your response based strictly on your instructions and the context above."
        )
        chain = prompt | llm | self.parser
        result = await chain.ainvoke({
            "role": role,
            "instructions": instructions,
            "context": context if context.strip() else "No prior context.",
        })
        return result


dynamic_agent = DynamicAgent()
