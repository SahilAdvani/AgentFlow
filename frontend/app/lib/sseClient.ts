export type AgentEvent = {
    type: 'agent_thinking' | 'agent_result' | 'tool_call' | 'error' | 'analysis_complete';
    agent_name: string;
    content: string;
    error_code?: string;
    data?: any;
};

export function createSSEClient(endpoint: string, onEvent: (event: AgentEvent) => void) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const eventSource = new EventSource(`${baseUrl}${endpoint}`);

    eventSource.onmessage = (event) => {
        const data: AgentEvent = JSON.parse(event.data);
        onEvent(data);
    };

    eventSource.onerror = (err) => {
        console.error("SSE Error:", err);
        eventSource.close();
    };

    return () => eventSource.close();
}
