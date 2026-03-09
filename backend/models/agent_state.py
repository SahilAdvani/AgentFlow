from typing import List, Dict, Any, TypedDict, Annotated
from pydantic import BaseModel, Field

class AgentEvent(BaseModel):
    type: str  # agent_thinking, agent_result, tool_call, error
    agent_name: str
    content: str
    data: Optional[Dict[str, Any]] = None

class AgentState(TypedDict):
    startup_idea: str
    tasks: List[str]
    current_task_index: int
    research_data: Dict[str, Any]
    market_data: Dict[str, Any]
    competitor_data: Dict[str, Any]
    strategy_data: Dict[str, Any]
    report: Dict[str, Any]
    messages: List[Dict[str, str]]
    interrupt_signal: bool
    user_feedback: Optional[str]
    status: str # active, paused, completed
