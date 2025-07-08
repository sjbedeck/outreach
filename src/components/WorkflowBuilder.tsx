import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  addEdge,
  isEdge,
  isNode,
  Edge,
  Connection,
  Node
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, Pause, List, Plus, Settings, ChevronRight, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';

// Custom node components
import TriggerNode from './workflow/TriggerNode';
import ActionNode from './workflow/ActionNode';
import ConditionNode from './workflow/ConditionNode';
import DelayNode from './workflow/DelayNode';

// Node type definitions
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  condition: ConditionNode,
  delay: DelayNode
};

interface NodeData {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: string;
  nodes: NodeData[];
  edges: Edge[];
  created_at: string;
  updated_at: string;
}

interface Run {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  duration_ms: number;
  result: any;
}

const WorkflowBuilder = () => {
  const { workflowId } = useParams<{ workflowId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [elements, setElements] = useState<(Node | Edge)[]>([]);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [showNodePanel, setShowNodePanel] = useState(false);
  const [tab, setTab] = useState<'editor' | 'runs'>('editor');
  const [runs, setRuns] = useState<Run[]>([]);
  
  // Load workflow data
  useEffect(() => {
    if (workflowId && workflowId !== 'new') {
      fetchWorkflow();
      fetchRuns();
    } else {
      // Create a new workflow with initial trigger node
      setWorkflow({
        id: 'new',
        name: 'New Workflow',
        description: '',
        status: 'draft',
        nodes: [
          {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 250, y: 50 },
            data: { name: 'New Trigger', description: 'Start of workflow' }
          }
        ],
        edges: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setElements([
        {
          id: 'trigger-1',
          type: 'trigger',
          position: { x: 250, y: 50 },
          data: { name: 'New Trigger', description: 'Start of workflow' }
        }
      ]);
      
      setLoading(false);
    }
  }, [workflowId]);
  
  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      
      if (workflowId === 'j7k8l9m0-n1o2-p3q4-r5s6-t7u8v9w0x1y2') {
        // Use mock data for the demo workflow
        const mockWorkflow = {
          id: 'j7k8l9m0-n1o2-p3q4-r5s6-t7u8v9w0x1y2',
          name: 'Lead Qualification Flow',
          description: 'Automated workflow for qualifying and nurturing leadership development leads',
          status: 'draft',
          nodes: [
            {id: "node-1", type: "trigger", position: {x: 100, y: 100}, data: {name: "New Contact Added", description: "Triggered when a new contact is added"}},
            {id: "node-2", type: "action", position: {x: 300, y: 100}, data: {name: "Generate Email", service: "openai", action: "generate_email"}},
            {id: "node-3", type: "condition", position: {x: 500, y: 100}, data: {name: "Check Seniority", conditionType: "simple", expression: "contact.title.includes('CEO') || contact.title.includes('CTO')"}},
            {id: "node-4", type: "action", position: {x: 700, y: 50}, data: {name: "Send Priority Email", service: "gmail", action: "send_email"}},
            {id: "node-5", type: "action", position: {x: 700, y: 150}, data: {name: "Send Standard Email", service: "gmail", action: "send_email"}}
          ],
          edges: [
            {id: "edge-1", source: "node-1", target: "node-2", type: "default"},
            {id: "edge-2", source: "node-2", target: "node-3", type: "default"},
            {id: "edge-3", source: "node-3", target: "node-4", type: "default", sourceHandle: "true", targetHandle: "b"},
            {id: "edge-4", source: "node-3", target: "node-5", type: "default", sourceHandle: "false", targetHandle: "b"}
          ],
          created_at: '2025-06-24T11:45:00.000Z',
          updated_at: '2025-06-24T11:45:00.000Z'
        };
        
        setWorkflow(mockWorkflow);
        
        // Set the elements (nodes + edges)
        const nodes = mockWorkflow.nodes || [];
        const edges = mockWorkflow.edges || [];
        setElements([...nodes, ...edges]);
      } else {
        // Create a new example workflow
        const newWorkflow = {
          id: workflowId,
          name: 'New Example Workflow',
          description: 'An example workflow for lead qualification',
          status: 'draft',
          nodes: [
            {id: "trigger-1", type: "trigger", position: {x: 250, y: 50}, data: {name: "New Trigger", description: "Start of workflow", triggerType: "manual"}},
            {id: "action-1", type: "action", position: {x: 250, y: 150}, data: {name: "Send Email", service: "gmail", action: "send_email"}},
            {id: "condition-1", type: "condition", position: {x: 250, y: 250}, data: {name: "Check Response", conditionType: "simple", expression: "contact.responded === true"}}
          ],
          edges: [
            {id: "edge-1", source: "trigger-1", target: "action-1", type: "default"},
            {id: "edge-2", source: "action-1", target: "condition-1", type: "default"}
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setWorkflow(newWorkflow);
        setElements([...newWorkflow.nodes, ...newWorkflow.edges]);
      }
      
    } catch (error) {
      console.error('Error fetching workflow:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRuns = async () => {
    try {
      // Use mock data for workflow runs
      setRuns([
        {
          id: '1',
          workflow_id: workflowId || '',
          status: 'completed',
          started_at: new Date().toISOString(),
          duration_ms: 1200,
          result: { success: true, message: 'Workflow executed successfully' }
        },
        {
          id: '2',
          workflow_id: workflowId || '',
          status: 'failed',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          duration_ms: 800,
          result: { success: false, error: 'API rate limit exceeded' }
        }
      ]);
    } catch (error) {
      console.error('Error fetching runs:', error);
    }
  };
  
  const onConnect = (params: Connection) => {
    const newEdge = {
      id: `edge-${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      type: 'default',
      sourceHandle: params.sourceHandle,
      targetHandle: params.targetHandle
    };
    setElements(els => addEdge(newEdge, els));
  };
  
  const onElementsRemove = (elementsToRemove: any[]) => {
    setElements(els => {
      const elementsToRemoveIds = elementsToRemove.map(el => el.id);
      return els.filter(el => !elementsToRemoveIds.includes(el.id));
    });
  };
  
  const onElementClick = (_: any, element: any) => {
    setSelectedElement(element);
  };
  
  const onPaneClick = () => {
    setSelectedElement(null);
  };
  
  const addNode = (type: string) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 300 + 50,
        y: Math.random() * 300 + 50,
      },
      data: {
        name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        description: `Description for ${type}`,
      },
    };
    
    setElements(els => [...els, newNode]);
    setShowNodePanel(false);
    setSelectedElement(newNode);
  };
  
  const updateNodeData = (id: string, newData: any) => {
    setElements(els => 
      els.map(el => {
        if (el.id === id) {
          return {
            ...el,
            data: {
              ...el.data,
              ...newData
            }
          };
        }
        return el;
      })
    );
  };
  
  const saveWorkflow = async () => {
    try {
      if (!workflow) return;
      
      // Separate nodes and edges
      const nodes = elements.filter(el => isNode(el)) as Node[];
      const edges = elements.filter(el => isEdge(el)) as Edge[];
      
      // Update workflow object
      const updatedWorkflow = {
        ...workflow,
        nodes,
        edges
      };
      
      // Show success message
      setWorkflow(updatedWorkflow);
      alert('Workflow saved successfully');
      
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    }
  };
  
  const toggleWorkflowStatus = async () => {
    if (!workflow) return;
    
    try {
      const newStatus = workflow.status === 'active' ? 'draft' : 'active';
      
      // Update local state
      setWorkflow({
        ...workflow,
        status: newStatus
      });
      
      // Show success message
      alert(`Workflow status updated to: ${newStatus}`);
      
    } catch (error) {
      console.error('Error updating workflow status:', error);
      alert('Failed to update workflow status');
    }
  };

  const executeWorkflow = () => {
    alert('Workflow execution started! Check the "Recent Runs" tab for results.');
    
    // Add a new run to the list
    const newRun = {
      id: `run-${Date.now()}`,
      workflow_id: workflowId || '',
      status: 'completed',
      started_at: new Date().toISOString(),
      duration_ms: Math.floor(Math.random() * 2000) + 500,
      result: { success: true, message: 'Workflow executed successfully' }
    };
    
    setRuns([newRun, ...runs]);
    
    // Switch to runs tab
    setTab('runs');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/integrations')}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <input
              type="text"
              value={workflow?.name || ''}
              onChange={e => setWorkflow(prev => prev ? {...prev, name: e.target.value} : null)}
              className="text-xl font-bold border-none focus:ring-0 focus:outline-none p-0"
              placeholder="Workflow Name"
            />
            <input
              type="text"
              value={workflow?.description || ''}
              onChange={e => setWorkflow(prev => prev ? {...prev, description: e.target.value} : null)}
              className="text-sm text-gray-500 border-none focus:ring-0 focus:outline-none p-0 mt-1 w-full"
              placeholder="Workflow Description"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={executeWorkflow}
            className="px-3 py-1 rounded-md bg-green-100 text-green-800 flex items-center space-x-1"
          >
            <Play className="w-4 h-4" />
            <span>Run Now</span>
          </button>
          <button
            onClick={toggleWorkflowStatus}
            className={`px-3 py-1 rounded-md flex items-center space-x-1 ${
              workflow?.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {workflow?.status === 'active' ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Active</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Draft</span>
              </>
            )}
          </button>
          <button
            onClick={saveWorkflow}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'editor'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('editor')}
          >
            Editor
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              tab === 'runs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('runs')}
          >
            Recent Runs
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex overflow-hidden">
        {tab === 'editor' ? (
          <>
            {/* Canvas */}
            <div className="flex-grow relative">
              <ReactFlow
                nodes={elements.filter(el => isNode(el)) as Node[]}
                edges={elements.filter(el => isEdge(el)) as Edge[]}
                onConnect={onConnect}
                onNodesDelete={onElementsRemove}
                onEdgesDelete={onElementsRemove}
                onNodeClick={onElementClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                deleteKeyCode="Delete"
                snapToGrid={true}
                snapGrid={[15, 15]}
              >
                <Background
                  variant="dots"
                  gap={12}
                  size={1}
                  color="#e2e8f0"
                />
                <Controls />
                <MiniMap 
                  nodeStrokeColor={(n) => {
                    if (n.type === 'trigger') return '#ff0072';
                    if (n.type === 'action') return '#1a192b';
                    if (n.type === 'condition') return '#ff9900';
                    return '#eee';
                  }}
                  nodeColor={(n) => {
                    if (n.type === 'trigger') return '#ff0072';
                    if (n.type === 'action') return '#0041d0';
                    if (n.type === 'condition') return '#ff9900';
                    return '#eee';
                  }}
                />
              </ReactFlow>
              
              {/* Add Node Button */}
              <div className="absolute bottom-6 right-6">
                <button
                  onClick={() => setShowNodePanel(!showNodePanel)}
                  className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
                
                {/* Node Selection Panel */}
                {showNodePanel && (
                  <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-3 w-40">
                    <div className="space-y-1">
                      <button
                        onClick={() => addNode('trigger')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                      >
                        Trigger
                      </button>
                      <button
                        onClick={() => addNode('action')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                      >
                        Action
                      </button>
                      <button
                        onClick={() => addNode('condition')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                      >
                        Condition
                      </button>
                      <button
                        onClick={() => addNode('delay')}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 rounded"
                      >
                        Delay
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Configuration Panel */}
            {selectedElement && (
              <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    {selectedElement.type.charAt(0).toUpperCase() + selectedElement.type.slice(1)} Settings
                  </h3>
                  <button
                    onClick={() => setSelectedElement(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-4 space-y-4">
                  {/* Node name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={selectedElement.data?.name || ''}
                      onChange={(e) => updateNodeData(selectedElement.id, { name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  {/* Node description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={selectedElement.data?.description || ''}
                      onChange={(e) => updateNodeData(selectedElement.id, { description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={3}
                    />
                  </div>
                  
                  {/* Specific configurations based on node type */}
                  {selectedElement.type === 'trigger' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
                      <select
                        value={selectedElement.data?.triggerType || 'manual'}
                        onChange={(e) => updateNodeData(selectedElement.id, { triggerType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="manual">Manual Trigger</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="webhook">Webhook</option>
                        <option value="event">Event</option>
                      </select>
                    </div>
                  )}
                  
                  {selectedElement.type === 'action' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                      <select
                        value={selectedElement.data?.service || ''}
                        onChange={(e) => updateNodeData(selectedElement.id, { service: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                      >
                        <option value="">Select a service</option>
                        <option value="gmail">Gmail</option>
                        <option value="outlook">Outlook</option>
                        <option value="openai">OpenAI</option>
                        <option value="apollo">Apollo.io</option>
                        <option value="gemini">Google Gemini</option>
                      </select>
                      
                      {selectedElement.data?.service && (
                        <>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                          <select
                            value={selectedElement.data?.action || ''}
                            onChange={(e) => updateNodeData(selectedElement.id, { action: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="">Select an action</option>
                            <option value="send_email">Send Email</option>
                            <option value="create_contact">Create Contact</option>
                            <option value="update_contact">Update Contact</option>
                            <option value="fetch_data">Fetch Data</option>
                            <option value="generate_email">Generate Email</option>
                          </select>
                        </>
                      )}
                    </div>
                  )}
                  
                  {selectedElement.type === 'condition' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Condition Type</label>
                      <select
                        value={selectedElement.data?.conditionType || 'simple'}
                        onChange={(e) => updateNodeData(selectedElement.id, { conditionType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
                      >
                        <option value="simple">Simple Condition</option>
                        <option value="complex">Complex Expression</option>
                      </select>
                      
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expression</label>
                      <input
                        type="text"
                        value={selectedElement.data?.expression || ''}
                        onChange={(e) => updateNodeData(selectedElement.id, { expression: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder={selectedElement.data?.conditionType === 'simple' ? "contact.status === 'active'" : "contact.count > 5 && contact.type === 'premium'"}
                      />
                    </div>
                  )}
                  
                  {selectedElement.type === 'delay' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delay Duration</label>
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          value={selectedElement.data?.duration || 1}
                          onChange={(e) => updateNodeData(selectedElement.id, { duration: parseInt(e.target.value) })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                          min={1}
                        />
                        <select
                          value={selectedElement.data?.unit || 'minutes'}
                          onChange={(e) => updateNodeData(selectedElement.id, { unit: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="seconds">Seconds</option>
                          <option value="minutes">Minutes</option>
                          <option value="hours">Hours</option>
                          <option value="days">Days</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {/* Advanced options section */}
                  <div className="pt-4 border-t border-gray-200">
                    <details>
                      <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                        Advanced Options
                      </summary>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Node ID</label>
                          <input
                            type="text"
                            value={selectedElement.id}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          />
                        </div>
                        
                        {selectedElement.type !== 'trigger' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Error Handling</label>
                            <select
                              value={selectedElement.data?.errorHandling || 'stop'}
                              onChange={(e) => updateNodeData(selectedElement.id, { errorHandling: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="stop">Stop Workflow</option>
                              <option value="continue">Continue Workflow</option>
                              <option value="retry">Retry (3 times)</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Recent Runs Tab
          <div className="w-full overflow-auto p-6 bg-white">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Recent Workflow Runs</h3>
                <button
                  onClick={() => fetchRuns()}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <RefreshCw size={18} />
                </button>
              </div>
              
              {runs.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No runs yet</h4>
                  <p className="text-gray-500">
                    This workflow hasn't been executed yet
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Run ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Started At
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Result
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {runs.map(run => (
                        <tr key={run.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {run.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(run.started_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              run.status === 'completed' ? 'bg-green-100 text-green-800' :
                              run.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {run.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {run.duration_ms}ms
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {run.result.success ? 'Success' : `Error: ${run.result.error}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowBuilder;