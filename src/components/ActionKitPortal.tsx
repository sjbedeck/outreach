import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Send, Search, Check, BookOpen, Settings, FileText, ChevronRight, Lock, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import { providerConfig } from '../config/providerConfig';

interface Tool {
  id: string;
  name: string;
  enabled: boolean;
  provider: string;
  type: 'send' | 'search' | 'write' | 'read';
  config: any;
}

const ActionKitPortal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialIntegrationId = searchParams.get('integration');
  
  const [loading, setLoading] = useState(true);
  const [enabledTools, setEnabledTools] = useState<Tool[]>([]);
  const [availableIntegrations, setAvailableIntegrations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch API tokens to see which integrations are connected
      const { data: apiTokens, error: apiTokensError } = await supabase
        .from('api_tokens')
        .select('provider_key, provider_name, status')
        .eq('status', 'active');
      
      if (apiTokensError) throw apiTokensError;
      
      // Map to available integrations
      const availableIntegrations = apiTokens?.map(token => {
        const providerDetails = providerConfig.find(p => p.id === token.provider_key) || null;
        return {
          id: token.provider_key,
          name: token.provider_name,
          logoUrl: providerDetails?.logoUrl,
          logoBackground: providerDetails?.logoBackground
        };
      }) || [];
      
      setAvailableIntegrations(availableIntegrations);
      
      // Fetch enabled tools
      // This would normally come from the database, but we'll mock it for now
      const mockTools: Tool[] = [
        {
          id: 'gmail-send',
          name: 'Send Email',
          enabled: true,
          provider: 'gmail',
          type: 'send',
          config: { useTemplate: true }
        },
        {
          id: 'openai-write',
          name: 'Generate Content',
          enabled: true,
          provider: 'openai',
          type: 'write',
          config: { model: 'gpt-4', temperature: 0.7 }
        }
      ];
      
      setEnabledTools(mockTools);
      
      // If an integration was specified, ensure it's enabled
      if (initialIntegrationId) {
        const integration = availableIntegrations.find(i => i.id === initialIntegrationId);
        if (integration && !mockTools.some(t => t.provider === initialIntegrationId)) {
          // Add a default tool for this integration
          const newTool: Tool = {
            id: `${initialIntegrationId}-default`,
            name: `Use ${integration.name}`,
            enabled: true,
            provider: initialIntegrationId,
            type: 'send',
            config: {}
          };
          setEnabledTools([...mockTools, newTool]);
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleTool = (toolId: string) => {
    setEnabledTools(tools => 
      tools.map(tool => 
        tool.id === toolId ? { ...tool, enabled: !tool.enabled } : tool
      )
    );
  };
  
  const configureIntegration = (integration: any) => {
    navigate(`/integrations/${integration.id}`);
  };
  
  const filteredIntegrations = availableIntegrations.filter(integration =>
    integration.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Action Kit</h2>
      </div>
      
      <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left Panel: Chat Interface */}
        <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">AI Assistant Setup</h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure your AI assistant to use your connected integrations
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <h4 className="font-medium text-blue-700 flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>Getting Started</span>
              </h4>
              <p className="mt-1 text-blue-600">
                Select the tools and integrations you want your AI assistant to use. 
                This will allow it to take actions on your behalf based on conversations.
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="flex items-center mb-3">
                <FileText className="w-4 h-4 text-gray-600 mr-1" />
                <h4 className="font-medium text-gray-700">Default Instructions</h4>
              </div>
              <p className="text-sm text-gray-600">
                I want you to help manage my outreach campaigns by using the tools I've enabled.
                You can send emails, search for contacts, and generate content for me.
                Always ask for confirmation before sending emails or making changes.
              </p>
              <button className="mt-2 text-blue-600 hover:text-blue-800 text-sm">
                Edit Instructions
              </button>
            </div>
          </div>
          
          <div className="mt-auto p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">Assistant Status</h4>
              <div className="relative inline-block w-10 align-middle select-none">
                <input 
                  type="checkbox" 
                  name="toggle" 
                  id="toggle" 
                  className="sr-only"
                  defaultChecked={true} 
                />
                <label 
                  htmlFor="toggle" 
                  className="block overflow-hidden h-6 rounded-full bg-gray-200 cursor-pointer"
                >
                  <span className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-0" />
                  <span className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform translate-x-4" />
                </label>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Your AI assistant is active and can use the enabled tools
            </p>
          </div>
        </div>
        
        {/* Right Panel: Integrations List */}
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Available Tools</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            {availableIntegrations.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No integrations available</h4>
                <p className="text-gray-500 mb-4">
                  Connect your first integration to start using Action Kit
                </p>
                <button 
                  onClick={() => navigate('/integrations/catalog')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Integrations
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredIntegrations.map(integration => {
                  // Find tools for this integration
                  const integrationTools = enabledTools.filter(tool => tool.provider === integration.id);
                  
                  return (
                    <div key={integration.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          {integration.logoUrl ? (
                            <img 
                              src={integration.logoUrl} 
                              alt={`${integration.name} logo`} 
                              className="w-10 h-10 rounded-lg object-contain mr-3"
                            />
                          ) : (
                            <div className={`w-10 h-10 ${integration.logoBackground || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-lg font-bold mr-3`}>
                              {integration.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{integration.name}</h4>
                            <div className="flex items-center mt-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                              <span className="text-xs text-gray-500">Connected</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => configureIntegration(integration)}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Tools */}
                      <div className="space-y-3 pl-12">
                        {integrationTools.length > 0 ? (
                          integrationTools.map(tool => (
                            <div key={tool.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={tool.id}
                                  checked={tool.enabled}
                                  onChange={() => toggleTool(tool.id)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor={tool.id} className="flex items-center text-sm text-gray-900">
                                  <span className={`mr-2 ${
                                    tool.type === 'send' ? 'text-green-600' :
                                    tool.type === 'search' ? 'text-blue-600' :
                                    tool.type === 'write' ? 'text-purple-600' : 'text-gray-600'
                                  }`}>
                                    {tool.type === 'send' ? (
                                      <Send size={16} />
                                    ) : tool.type === 'search' ? (
                                      <Search size={16} />
                                    ) : tool.type === 'write' ? (
                                      <FileText size={16} />
                                    ) : (
                                      <BookOpen size={16} />
                                    )}
                                  </span>
                                  {tool.name}
                                </label>
                              </div>
                              <button
                                onClick={() => {
                                  // Configure tool
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Settings size={14} />
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-between py-1 px-2 bg-gray-50 rounded">
                            <span className="text-sm text-gray-500">No tools configured</span>
                            <button
                              onClick={() => {
                                // Add default tool
                                const newTool: Tool = {
                                  id: `${integration.id}-default`,
                                  name: `Use ${integration.name}`,
                                  enabled: true,
                                  provider: integration.id,
                                  type: 'send',
                                  config: {}
                                };
                                setEnabledTools([...enabledTools, newTool]);
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              Add Tool
                            </button>
                          </div>
                        )}
                        
                        <div className="text-right">
                          <button
                            className="text-xs text-blue-600 hover:text-blue-800 inline-flex items-center"
                            onClick={() => {
                              // Add new tool for this integration
                              const newTool: Tool = {
                                id: `${integration.id}-${Date.now()}`,
                                name: `New ${integration.name} Tool`,
                                enabled: true,
                                provider: integration.id,
                                type: 'send',
                                config: {}
                              };
                              setEnabledTools([...enabledTools, newTool]);
                            }}
                          >
                            <span>Add Tool</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div className="p-6">
                  <button
                    onClick={() => navigate('/integrations/catalog')}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <span>Add More Integrations</span>
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionKitPortal;