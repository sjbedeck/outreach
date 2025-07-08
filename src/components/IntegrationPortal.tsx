import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, RefreshCw, Edit, Lock, Check, X, ExternalLink, ChevronRight, Plus } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import { providerConfig } from '../config/providerConfig';
import OAuthConfigModal from './OAuthConfigModal';

interface ApiToken {
  id: string;
  provider_key: string;
  provider_name: string;
  status: string;
  access_token?: string;
  refresh_token?: string;
  created_at: string;
  last_used_at: string;
}

interface Workflow {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

const IntegrationPortal = () => {
  const { integrationId } = useParams<{ integrationId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [apiToken, setApiToken] = useState<ApiToken | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    if (integrationId) {
      const providerData = providerConfig.find(p => p.id === integrationId);
      if (providerData) {
        setProvider(providerData);
      }
      fetchIntegrationData();
    }
  }, [integrationId]);

  const fetchIntegrationData = async () => {
    try {
      setLoading(true);
      
      // Fetch API token
      const { data: tokenData, error: tokenError } = await supabase
        .from('api_tokens')
        .select('*')
        .eq('provider_key', integrationId)
        .maybeSingle();
      
      if (tokenError) throw tokenError;
      setApiToken(tokenData);
      
      // Fetch workflows that use this integration
      const { data: workflowsData, error: workflowsError } = await supabase
        .from('workflows')
        .select('id, name, status, created_at')
        .order('created_at', { ascending: false });
        
      if (workflowsError) throw workflowsError;
      
      // Filter workflows that use this integration
      // Note: In a real app, you'd have a more specific query or junction table
      setWorkflows(workflowsData?.slice(0, 3) || []);
      
    } catch (error) {
      console.error('Error fetching integration data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = () => {
    navigate(`/workflows/new?integration=${integrationId}`);
  };

  const handleSaveOAuthConfig = async (config: any) => {
    try {
      // Save OAuth configuration
      if (apiToken) {
        // Update existing token
        const { error } = await supabase
          .from('api_tokens')
          .update({
            access_token: config.accessToken,
            refresh_token: config.refreshToken,
            expires_at: config.expiresAt,
            status: 'active',
            last_used_at: new Date().toISOString()
          })
          .eq('id', apiToken.id);
          
        if (error) throw error;
      } else {
        // Create new token
        const { error } = await supabase
          .from('api_tokens')
          .insert({
            provider_key: integrationId,
            provider_name: provider?.name || integrationId,
            access_token: config.accessToken,
            refresh_token: config.refreshToken,
            expires_at: config.expiresAt,
            status: 'active'
          });
          
        if (error) throw error;
      }
      
      // Refresh data
      await fetchIntegrationData();
      setShowOAuthModal(false);
      
    } catch (error) {
      console.error('Error saving OAuth config:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  if (loading) return <LoadingSpinner />;
  
  if (!provider) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Integration not found</h3>
        <p className="text-gray-500 mb-4">The integration you're looking for does not exist</p>
        <button 
          onClick={() => navigate('/integrations/catalog')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/integrations')}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <div className="flex items-center">
          {provider.logoUrl ? (
            <img 
              src={provider.logoUrl} 
              alt={`${provider.name} logo`} 
              className="w-10 h-10 rounded-lg object-contain mr-3"
            />
          ) : (
            <div className={`w-10 h-10 ${provider.logoBackground || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-lg font-bold mr-3`}>
              {provider.name.charAt(0)}
            </div>
          )}
          <h2 className="text-2xl font-bold text-gray-900">{provider.name}</h2>
        </div>
      </div>

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* App Configuration Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">App Configuration</h3>
          </div>
          
          <div className="p-6">
            {apiToken ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Connection Status</p>
                    <div className="flex items-center mt-1">
                      <span className={`w-2 h-2 rounded-full mr-2 ${apiToken.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-sm">{apiToken.status === 'active' ? 'Connected' : 'Disconnected'}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowOAuthModal(true)}
                    className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded-md text-gray-700 text-sm hover:bg-gray-200"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Last Used</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(apiToken.last_used_at).toLocaleDateString()} at {new Date(apiToken.last_used_at).toLocaleTimeString()}
                  </p>
                </div>
                
                {apiToken.access_token && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Access Token</p>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 bg-gray-100 px-3 py-1 rounded-md text-gray-600 text-sm overflow-hidden">
                        <span className="text-gray-400">••••••••••••••••••••••</span>
                      </div>
                      <button 
                        className="ml-2 text-gray-400 hover:text-gray-600"
                        title="Copy token"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                          <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Not Configured</h4>
                <p className="text-sm text-gray-500 mb-6">
                  Connect your {provider.name} account to start using this integration
                </p>
                <button
                  onClick={() => setShowOAuthModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Configure Connection
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Connect Portal Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Connect Portal</h3>
          </div>
          
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 ${apiToken ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'} rounded-full flex items-center justify-center mr-3`}>
                {apiToken ? <Check className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Authentication Status</h4>
                <p className="text-sm text-gray-500">
                  {apiToken ? 'Connected and ready to use' : 'Not authenticated'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mr-3">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Configuration Settings</h4>
                <p className="text-sm text-gray-500">
                  {apiToken ? 'Default settings applied' : 'Not available until connected'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mr-3">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Data Sync</h4>
                <p className="text-sm text-gray-500">
                  {apiToken ? 'Ready to sync data' : 'Not available until connected'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Workflows Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
          <button
            onClick={handleCreateWorkflow}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </button>
        </div>
        
        <div className="divide-y divide-gray-200">
          {workflows.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500">No workflows using this integration yet.</p>
              <button
                onClick={handleCreateWorkflow}
                className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Create Your First Workflow
              </button>
            </div>
          ) : (
            workflows.map(workflow => (
              <div key={workflow.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                    <div className="flex items-center mt-1">
                      <span className={`w-2 h-2 rounded-full mr-2 ${workflow.status === 'active' ? 'bg-green-500' : workflow.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'}`}></span>
                      <span className="text-sm text-gray-500 capitalize">{workflow.status}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Extensions Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Custom Triggers & Actions</h3>
        </div>
        
        <div className="p-6 text-center">
          {provider.actionKitSupport ? (
            <div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Action Kit Support Available</h4>
              <p className="text-sm text-gray-500 mb-6">
                This integration supports custom triggers and actions
              </p>
              <button
                onClick={() => navigate(`/action-kit?integration=${integrationId}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Configure in Action Kit
              </button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Action Kit Not Supported</h4>
              <p className="text-sm text-gray-500">
                This integration does not currently support custom triggers and actions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* OAuth Config Modal */}
      {showOAuthModal && (
        <OAuthConfigModal
          provider={provider}
          existingToken={apiToken}
          onSave={handleSaveOAuthConfig}
          onCancel={() => setShowOAuthModal(false)}
        />
      )}
    </div>
  );
};

export default IntegrationPortal;