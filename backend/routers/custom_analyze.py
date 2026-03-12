import asyncio
import json
import traceback
import os
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional


from services.pdf_service import pdf_service
from services.email_service import email_service
from memory.vector_memory import vector_memory
from langchain_core.prompts import ChatPromptTemplate

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
        
        # Build a map of all node metadata for the frontend
        node_meta_list = []
        for n in nodes:
            nd = n.get("data", {})
            node_meta_list.append({
                "node_id": n["id"],
                "role": nd.get("role", "Unknown"),
                "model": nd.get("model", "groq"),
                "status": "pending",
            })
        await queue.put({"type": "graph_meta", "agent_name": "System", "content": "Custom graph metadata", "data": {"nodes": node_meta_list, "edges": edges or []}})
        await asyncio.sleep(0.3)

        while ready_queue:
            current_id = ready_queue.pop(0)
            
            current_node = next((n for n in nodes if n["id"] == current_id), None)
            if not current_node:
                continue
                
            role = current_node.get("data", {}).get("role", "Unknown Agent")
            instructions = current_node.get("data", {}).get("instructions", "")
            model = current_node.get("data", {}).get("model", "groq")
            
            if current_id != "input":
                # Emit "running" status
                await queue.put({
                    "type": "agent_thinking",
                    "agent_name": current_id,
                    "content": f"[{role}] Running with {model.upper()} model...",
                    "data": {"node_id": current_id, "role": role, "model": model, "status": "running"}
                })
                
                # Gather context from upstream nodes
                predecessors = [edge["source"] for edge in (edges or []) if edge["target"] == current_id]
                context_parts = []
                for p_id in predecessors:
                    if p_id in node_results:
                        p_role = next((n.get("data", {}).get("role") for n in nodes if n["id"] == p_id), p_id)
                        context_parts.append(f"--- Output from {p_role} ---\n{node_results[p_id]}")
                        
                context = "\n\n".join(context_parts)
                
                # Execute with the selected model
                try:
                    result = await retry_with_backoff(dynamic_agent.execute_task, role, instructions, context, model=model)
                    node_results[current_id] = result
                    final_report_content = result
                    
                    await queue.put({
                        "type": "agent_result",
                        "agent_name": current_id,
                        "content": f"[{role}] ✅ Complete ({model.upper()})",
                        "data": {"node_id": current_id, "role": role, "model": model, "status": "complete", "result": result}
                    })
                except Exception as node_err:
                    await queue.put({
                        "type": "agent_result",
                        "agent_name": current_id,
                        "content": f"[{role}] ❌ Failed ({model.upper()}): {str(node_err)[:100]}",
                        "data": {"node_id": current_id, "role": role, "model": model, "status": "error"}
                    })
                    node_results[current_id] = f"Error: {str(node_err)}"
                
                await asyncio.sleep(1)
            else:
                node_results[current_id] = instructions
                await queue.put({
                    "type": "agent_result",
                    "agent_name": current_id,
                    "content": f"[Input] Idea loaded: {instructions[:80]}...",
                    "data": {"node_id": current_id, "role": "Input", "model": "none", "status": "complete"}
                })
            
            # Reduce in-degree for neighbors
            for neighbor in adj_list.get(current_id, []):
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    ready_queue.append(neighbor)
        
        # 7. Structure the final report
        # We use a final LLM call to structure whatever the custom agents produced into 
        # the format expected by ReportViewer and PDFService.
        try:
            await queue.put({"type": "agent_thinking", "agent_name": "System", "content": "Structuring final report..."})
            
            struct_prompt = ChatPromptTemplate.from_template(
                "You are an expert tech analyst formatting a final report. "
                "Below is the combined output from various distinct custom AI agents that analyzed a startup idea.\n"
                "Your job is to read all of it and extract/synthesize the information into exactly THREE sections: \n"
                "1. Executive Summary: What the startup is doing and its top-level value proposition.\n"
                "2. Strategy: The business, go-to-market, or technical strategy outlined by the agents.\n"
                "3. Market Outlook: Any market size, trends, or competitor analysis found in the text.\n\n"
                "Raw Agent Output:\n{raw_text}\n\n"
                "Return ONLY a valid JSON object with the keys 'executive_summary', 'strategy', and 'market_analysis'. "
                "If a section lacks information, just say 'No specific data provided by the agents.' "
                "Do not include any markdown formatting like ```json, just the raw JSON."
            )
            # Use groq to structure it quickly
            llm = dynamic_agent.groq_llm
            chain = struct_prompt | llm | dynamic_agent.parser
            struct_result = await chain.ainvoke({"raw_text": final_report_content})
            
            # Clean up potential markdown formatting from LLM response
            clean_json = struct_result.replace("```json", "").replace("```", "").strip()
            parsed_data = json.loads(clean_json)
        except Exception as e:
            print(f"Error structuring custom report: {e}")
            parsed_data = {
                "executive_summary": final_report_content,
                "strategy": "Failed to parse strategy.",
                "market_analysis": "Failed to parse market analysis."
            }

        final_report = {
            "executive_summary": parsed_data.get("executive_summary", final_report_content),
            "strategy": parsed_data.get("strategy", "N/A"),
            "market_analysis": parsed_data.get("market_analysis", "N/A"),
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
