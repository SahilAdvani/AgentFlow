import asyncio
import json
import traceback
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional

# We'll use the existing agents, but in a real-world scenario you might
# instantiate custom agents here that use a different LLM or config.
from agents.manager_agent import manager_agent
from agents.research_agent import research_agent
from agents.market_agent import market_agent
from agents.competitor_agent import competitor_agent
from agents.strategy_agent import strategy_agent
from agents.report_agent import report_agent
from services.pdf_service import pdf_service
from services.email_service import email_service
from memory.vector_memory import vector_memory

router = APIRouter()

class StartupRequest(BaseModel):
    idea: str
    email: Optional[str] = None
    user_id: Optional[str] = None
    nodes: Optional[list] = None
    edges: Optional[list] = None

# Sharing active_sessions with main.py isn't ideal for a large app,
# but for this scale we'll keep a local dictionary or import it.
# To avoid circular imports, let's keep a separate session dictionary
# for custom models, or we could refactor main.py to share it.
custom_active_sessions = {}

async def retry_with_backoff(fn, *args, max_retries=3, base_delay=2, **kwargs):
    """Retry an async function with exponential backoff on rate limit errors."""
    for attempt in range(max_retries):
        try:
            return await fn(*args, **kwargs)
        except Exception as e:
            error_msg = str(e).lower()
            if attempt < max_retries - 1 and ("rate" in error_msg or "too many" in error_msg or "429" in error_msg):
                delay = base_delay * (2 ** attempt)
                print(f"[CUSTOM RETRY] Rate limited. Waiting {delay}s before retry {attempt + 2}/{max_retries}...")
                await asyncio.sleep(delay)
            else:
                raise

async def run_custom_analysis(session_id: str, idea: str, email: Optional[str], user_id: Optional[str], nodes: Optional[list], edges: Optional[list]):
    queue = custom_active_sessions[session_id]["events"]
    
    try:
        # 1. Clear memory for fresh session
        vector_memory.clear_memory()
        
        await queue.put({"type": "agent_thinking", "agent_name": "System", "content": f"Initializing CUSTOM GRAPH EXECUTION for idea: {idea}"})
        await asyncio.sleep(1)

        if not nodes or len(nodes) == 0:
            await queue.put({"type": "error", "agent_name": "System", "content": "No nodes provided in custom graph."})
            return

        from agents.dynamic_agent import dynamic_agent

        # Build adjacency list and in-degree map for topological sort
        adj_list = {node["id"]: [] for node in nodes}
        in_degree = {node["id"]: 0 for node in nodes}
        
        if edges:
            for edge in edges:
                src = edge.get("source")
                tgt = edge.get("target")
                if src in adj_list and tgt in in_degree:
                    adj_list[src].append(tgt)
                    in_degree[tgt] += 1

        # Find nodes with 0 in-degree (usually "input" node)
        ready_queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        
        node_results = {} # Store results to pass as context
        
        # We will keep track of the last executed node's result as the 'final_report'
        final_report_content = "Graph execution completed without producing a result."
        
        while ready_queue:
            current_id = ready_queue.pop(0)
            
            # Find the actual node data
            current_node = next((n for n in nodes if n["id"] == current_id), None)
            if not current_node:
                continue
                
            role = current_node.get("data", {}).get("role", "Unknown Agent")
            instructions = current_node.get("data", {}).get("instructions", "")
            
            if current_id != "input":
                await queue.put({"type": "agent_thinking", "agent_name": current_id, "content": f"[{role}] Starting task execution..."})
                
                # Gather context from upstream nodes (all edges where target == current_id)
                # For simplicity, we just aggregate all available previous results.
                # In a strict DAG, you would only take results from predecessors.
                predecessors = [edge["source"] for edge in (edges or []) if edge["target"] == current_id]
                context_parts = []
                for p_id in predecessors:
                    if p_id in node_results:
                        p_role = next((n.get("data", {}).get("role") for n in nodes if n["id"] == p_id), p_id)
                        context_parts.append(f"--- Output from {p_role} ---\n{node_results[p_id]}")
                        
                context = "\n\n".join(context_parts)
                
                # Execute dynamically
                result = await retry_with_backoff(dynamic_agent.execute_task, role, instructions, context)
                node_results[current_id] = result
                final_report_content = result
                
                await queue.put({"type": "agent_result", "agent_name": current_id, "content": f"[{role}] Task complete.", "data": result})
                await asyncio.sleep(1)
            else:
                # Store the input idea as the result of the input node
                node_results[current_id] = instructions
            
            # Reduce in-degree for neighbors
            for neighbor in adj_list.get(current_id, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    ready_queue.append(neighbor)
        
        # For the final report display, we wrap the raw text into the format expected by Dashboard.
        final_report = {
            "executive_summary": final_report_content,
            "market_size": "N/A (Custom Pipeline)",
            "monetization": "N/A",
            "competitors": [],
            "go_to_market": [],
            "overall_score": 10
        }
        
        # 8. PDF Generation
        pdf_path = f"{session_id}_custom_report.pdf"
        try:
            pdf_service.generate_report(final_report, pdf_path)
            
            if email:
                await queue.put({"type": "agent_thinking", "agent_name": "System", "content": f"Sending report to {email}..."})
                email_service.send_report(email, pdf_path, idea)
                
            if user_id:
                await queue.put({"type": "agent_thinking", "agent_name": "System", "content": "Saving report to cloud storage..."})
                from supabase import create_client
                supabase_url = os.getenv("SUPABASE_URL")
                supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
                if supabase_url and supabase_key:
                    supabase = create_client(supabase_url, supabase_key)
                    pdf_url = None
                    storage_path = f"{user_id}/{session_id}_custom_report.pdf"
                    with open(pdf_path, "rb") as f:
                        supabase.storage.from_("reports").upload(
                            storage_path,
                            f.read(),
                            {"content-type": "application/pdf"}
                        )
                    pdf_url = f"{supabase_url}/storage/v1/object/reports/{storage_path}"
                    
                    if os.path.exists(pdf_path):
                        os.remove(pdf_path)
                    
                    supabase.table("reports_history").insert({
                        "user_id": user_id,
                        "idea": idea,
                        "report_json": final_report,
                        "pdf_url": pdf_url
                    }).execute()
        except Exception as e:
            print(f"Error handling post-processing: {e}")
        
        await queue.put({"type": "analysis_complete", "agent_name": "CustomReportAgent", "content": "Custom Analysis finished!", "data": final_report})
        
    except Exception as e:
        print(f"[CUSTOM SESSION {session_id}] ERROR: {str(e)}")
        traceback.print_exc()
        await queue.put({"type": "error", "agent_name": "System", "content": str(e)})


@router.post("/analyze/custom")
async def start_custom_analysis(request: StartupRequest):
    session_id = f"custom_session_{id(request)}"
    custom_active_sessions[session_id] = {
        "idea": request.idea,
        "email": request.email,
        "status": "active",
        "events": asyncio.Queue()
    }
    asyncio.create_task(run_custom_analysis(session_id, request.idea, request.email, request.user_id, request.nodes, request.edges))
    return {"session_id": session_id}

@router.get("/stream/custom/{session_id}")
async def stream_custom_events(session_id: str):
    if session_id not in custom_active_sessions:
        return {"error": "Session not found"}

    async def event_generator():
        queue = custom_active_sessions[session_id]["events"]
        while True:
            event = await queue.get()
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("type") == "analysis_complete":
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")
