import React, { useCallback, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  Connection,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

interface AgentNodeData {
    role: string;
    label: string;
    instructions: string;
    isExecuting?: boolean;
}

const initialNodes: Node<AgentNodeData>[] = [
  {
    id: 'input',
    type: 'input',
    position: { x: 250, y: 50 },
    data: { role: 'Input', label: 'Input Idea', instructions: 'A platform for AI-powered personalized study plans for college students', isExecuting: false },
    style: { background: '#1e293b', color: 'white', border: '1px solid #3b82f6', borderRadius: '8px' }
  },
  {
    id: 'agent-1',
    position: { x: 250, y: 150 },
    data: { role: 'Manager Agent', label: 'Manager Agent', instructions: 'Decompose the task', isExecuting: false },
    style: { background: '#1e293b', color: 'white', border: '1px solid #4ade80', borderRadius: '8px' }
  },
];

const initialEdges: Edge[] = [
    { id: 'e-in-1', source: 'input', target: 'agent-1', animated: true }
];

export default function CustomAgentBuilder({ onLaunch }: { onLaunch: (nodes: Node[], edges: Edge[]) => void }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
  };

  const addAgentNode = () => {
      const newNodeId = `agent-${nodes.length + 1}`;
      const newNode: Node<AgentNodeData> = {
          id: newNodeId,
          position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
          data: { role: 'New Agent', label: 'New Agent', instructions: 'Describe task here...' },
          style: { background: '#1e293b', color: 'white', border: '1px solid #8b5cf6', borderRadius: '8px', padding: '10px' }
      };
      setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="flex h-[600px] w-full rounded-xl overflow-hidden border border-white/10 glass">
        {/* Main Canvas */}
        <div className="flex-1 h-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                fitView
            >
                <Controls className="bg-slate-800 border-none fill-white" />
                <MiniMap style={{ backgroundColor: '#0f172a' }} nodeColor="#3b82f6" maskColor="rgba(0,0,0,0.5)" />
                <Background color="#334155" gap={16} />
                
                <Panel position="top-left" className="space-x-4">
                    <button 
                        onClick={addAgentNode}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700 shadow-lg"
                    >
                        + Add Agent
                    </button>
                    <button 
                        onClick={() => onLaunch(nodes, edges)}
                        className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all"
                    >
                        Launch Graph
                    </button>
                </Panel>
            </ReactFlow>
        </div>

        {/* Sidebar Configuration */}
        <div className="w-80 border-l border-white/10 bg-[#0b0e14]/90 p-6 flex flex-col">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Node Configuration</h3>
            
            {selectedNode ? (
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Node ID</label>
                        <div className="text-sm text-slate-300 font-mono bg-slate-900/50 p-2 rounded border border-slate-800">
                            {selectedNode.id}
                        </div>
                    </div>
                    
                    {selectedNode.id !== 'input' && (
                        <div>
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Agent Role</label>
                            <input 
                                type="text"
                                value={selectedNode.data.role}
                                onChange={(e) => {
                                    setNodes(nds => nds.map(n => 
                                        n.id === selectedNode.id ? { ...n, data: { ...n.data, role: e.target.value, label: e.target.value } } : n
                                    ));
                                    setSelectedNode(prev => prev ? {...prev, data: { ...prev.data, role: e.target.value, label: e.target.value }} : null);
                                }}
                                className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-2.5 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                            {selectedNode.id === 'input' ? 'Startup Idea / Goal' : 'System Instructions'}
                        </label>
                        <textarea 
                            rows={selectedNode.id === 'input' ? 8 : 5}
                            value={selectedNode.data.instructions}
                            onChange={(e) => {
                                setNodes(nds => nds.map(n => 
                                    n.id === selectedNode.id ? { ...n, data: { ...n.data, instructions: e.target.value } } : n
                                ));
                                setSelectedNode(prev => prev ? {...prev, data: { ...prev.data, instructions: e.target.value }} : null);
                            }}
                            placeholder={selectedNode.id === 'input' ? "e.g. A platform for..." : "e.g. You are an expert market analyst... Do XYZ..."}
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-slate-500 block">Select a node to configure its parameters.</p>
                </div>
            )}
        </div>
    </div>
  );
}
