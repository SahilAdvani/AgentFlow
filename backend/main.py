import asyncio
import json
import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

from agents.manager_agent import manager_agent
from agents.research_agent import research_agent
from agents.market_agent import market_agent
from agents.competitor_agent import competitor_agent
from agents.strategy_agent import strategy_agent
from agents.report_agent import report_agent
from services.pdf_service import pdf_service
from services.email_service import email_service
from memory.vector_memory import vector_memory

# Import the new custom router
from routers import custom_analyze

app = FastAPI(title="AI Startup Research Command Center")

# Include the custom router
app.include_router(custom_analyze.router)


# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class StartupRequest(BaseModel):
    idea: str
    email: Optional[str] = None
    user_id: Optional[str] = None

active_sessions = {}

async def retry_with_backoff(fn, *args, max_retries=3, base_delay=2, **kwargs):
    """Retry an async function with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            return await fn(*args, **kwargs)
        except Exception as e:
            error_msg = str(e).lower()
            if attempt < max_retries - 1 and ("rate" in error_msg or "too many" in error_msg or "429" in error_msg):
                delay = base_delay * (2 ** attempt)
                print(f"[RETRY] Rate limited. Waiting {delay}s before retry {attempt + 2}/{max_retries}...")
                await asyncio.sleep(delay)
            else:
                raise

async def run_analysis(session_id: str, idea: str, email: Optional[str], user_id: Optional[str]):
    queue = active_sessions[session_id]["events"]
    
    try:
        # 1. Clear memory for fresh session
        vector_memory.clear_memory()
        
        # 2. Manager decomposing
        await queue.put({"type": "agent_thinking", "agent_name": "ManagerAgent", "content": f"Decomposing startup idea: {idea}"})
        tasks = await retry_with_backoff(manager_agent.decompose_task, idea)
        print(f"[SESSION {session_id}] Generated Tasks: {tasks}")
        await queue.put({"type": "agent_result", "agent_name": "ManagerAgent", "content": f"Identified {len(tasks)} research tasks.", "data": {"tasks": tasks}})
        
        # 3. Researching (Sequential with delays to avoid rate limits)
        for i, task_item in enumerate(tasks):
            # Handle if LLM returned objects instead of strings
            task_str = task_item if isinstance(task_item, str) else task_item.get("instruction", str(task_item))
            
            if not task_str or not task_str.strip():
                print(f"[SESSION {session_id}] Skipping empty task.")
                continue
            
            await queue.put({"type": "agent_thinking", "agent_name": "ResearchAgent", "content": f"Conducting research for task {i+1}: {task_str}"})
            summary = await retry_with_backoff(research_agent.conduct_research, task_str)
            await queue.put({"type": "agent_result", "agent_name": "ResearchAgent", "content": f"Summary for task {i+1} complete."})
            await asyncio.sleep(1)  # Cooldown between research tasks

        await asyncio.sleep(1.5)  # Cooldown before market analysis

        # 4. Market Analysis
        await queue.put({"type": "agent_thinking", "agent_name": "MarketAgent", "content": "Analyzing market size and trends..."})
        market_data = await retry_with_backoff(market_agent.analyze_market, idea)
        await queue.put({"type": "agent_result", "agent_name": "MarketAgent", "content": "Market analysis complete.", "data": market_data})

        await asyncio.sleep(1.5)  # Cooldown before competitor analysis

        # 5. Competitor Analysis
        await queue.put({"type": "agent_thinking", "agent_name": "CompetitorAgent", "content": "Analyzing competitor landscape..."})
        competitor_data = await retry_with_backoff(competitor_agent.analyze_competitors, idea)
        await queue.put({"type": "agent_result", "agent_name": "CompetitorAgent", "content": "Competitor analysis complete.", "data": competitor_data})

        await asyncio.sleep(1.5)  # Cooldown before strategy

        # 6. Strategy
        await queue.put({"type": "agent_thinking", "agent_name": "StrategyAgent", "content": "Synthesizing research into a strategy..."})
        strategy = await retry_with_backoff(strategy_agent.propose_strategy, idea)
        await queue.put({"type": "agent_result", "agent_name": "StrategyAgent", "content": "Strategy proposal complete."})

        await asyncio.sleep(1.5)  # Cooldown before final report

        # 7. Final Report
        await queue.put({"type": "agent_thinking", "agent_name": "ReportAgent", "content": "Generating final structured report..."})
        final_report = await retry_with_backoff(report_agent.generate_final_report, idea)
        
        # 8. PDF Generation
        pdf_path = f"{session_id}_report.pdf"
        pdf_service.generate_report(final_report, pdf_path)
        
        # 9. Email if provided
        if email:
            await queue.put({"type": "agent_thinking", "agent_name": "ReportAgent", "content": f"Sending report to {email}..."})
            email_service.send_report(email, pdf_path, idea)
            
        # 10. Upload PDF to Supabase Storage & Save to History
        if user_id:
            await queue.put({"type": "agent_thinking", "agent_name": "System", "content": "Saving report to cloud storage..."})
            try:
                from supabase import create_client
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                if supabase_url and supabase_key:
                    supabase = create_client(supabase_url, supabase_key)
                    
                    # Upload PDF to Supabase Storage bucket
                    pdf_url = None
                    try:
                        storage_path = f"{user_id}/{session_id}_report.pdf"
                        with open(pdf_path, "rb") as f:
                            supabase.storage.from_("reports").upload(
                                storage_path,
                                f.read(),
                                {"content-type": "application/pdf"}
                            )
                        pdf_url = f"{supabase_url}/storage/v1/object/reports/{storage_path}"
                    except Exception as storage_err:
                        print(f"PDF upload to storage failed (non-fatal): {storage_err}")
                        
                    # Clean up local PDF file
                    try:
                        if os.path.exists(pdf_path):
                            os.remove(pdf_path)
                    except Exception as clean_err:
                        print(f"Failed to clean local PDF: {clean_err}")
                    
                    # Save report metadata + PDF URL to history
                    supabase.table("reports_history").insert({
                        "user_id": user_id,
                        "idea": idea,
                        "report_json": final_report,
                        "pdf_url": pdf_url
                    }).execute()
            except Exception as e:
                print(f"Failed to save history: {e}")
        
        await queue.put({"type": "analysis_complete", "agent_name": "ReportAgent", "content": "Analysis finished!", "data": final_report})
        
    except Exception as e:
        error_msg = str(e)
        error_code = "GENERIC_ERROR"
        
        # Check for rate limits (Groq and OpenAI frequently use RateLimitError)
        # We try to detect them by class name or string matching if imports fail
        if "rate_limit_exceeded" in error_msg.lower() or "rate limit" in error_msg.lower():
            error_code = "RATE_LIMIT_EXCEEDED"
            error_msg = "Provider rate limit exceeded. Please try again later."

        print(f"[SESSION {session_id}] ERROR: {error_msg}")
        traceback.print_exc()
        await queue.put({
            "type": "error", 
            "agent_name": "System", 
            "content": error_msg,
            "error_code": error_code
        })

@app.post("/analyze")
async def start_analysis(request: StartupRequest):
    session_id = f"session_{id(request)}"
    active_sessions[session_id] = {
        "idea": request.idea,
        "email": request.email,
        "status": "active",
        "events": asyncio.Queue()
    }
    # Fire and forget the analysis task
    asyncio.create_task(run_analysis(session_id, request.idea, request.email, request.user_id))
    return {"session_id": session_id}

from fastapi.responses import FileResponse

@app.get("/download/{session_id}")
async def download_report(session_id: str):
    pdf_path = f"{session_id}_report.pdf"
    if os.path.exists(pdf_path):
        return FileResponse(pdf_path, filename="Startup_Analysis_Report.pdf")
    return {"error": "Report not found"}



@app.get("/stream/{session_id}")
async def stream_events(session_id: str):
    if session_id not in active_sessions:
        return {"error": "Session not found"}

    async def event_generator():
        queue = active_sessions[session_id]["events"]
        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("type") == "analysis_complete":
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
