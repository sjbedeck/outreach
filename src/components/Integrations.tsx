import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ExternalLink, Settings, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { providerConfig } from '../config/providerConfig';
import LoadingSpinner from './LoadingSpinner';

interface ApiToken {
  id: string;
  provider_key: string;
  provider_name: string;
  status: string;
  created_at: string;
  last_used_at: string;
}

const Integrations = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  
  useEffect(() => {
    fetchApiTokens();
  }, []);
  
  const fetchApiTokens = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('api_tokens')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setApiTokens(data || []);
      
    } catch (error) {
      console.error('Error fetching API tokens:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getProviderDetails = (providerId: string) => {
    return providerConfig.find(provider => provider.id === providerId) || null;
  };
  
  const handleAddIntegration = () => {
    navigate('/integrations/catalog');
  };
  
  const handleOpenIntegration = (providerId: string) => {
    navigate(`/integrations/${providerId}`);
  };
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Integrations</h2>
        <button
          onClick={handleAddIntegration}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Integration</span>
        </button>
      </div>
      
      {apiTokens.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect your first integration to start automating your outreach workflows.
          </p>
          <button
            onClick={handleAddIntegration}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Integration Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {apiTokens.map(token => {
            const providerDetails = getProviderDetails(token.provider_key);
            
            return (
              <div 
                key={token.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenIntegration(token.provider_key)}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {providerDetails?.logoUrl ? (
                        <img 
                          src={providerDetails.logoUrl} 
                          alt={`${token.provider_name} logo`} 
                          className="w-12 h-12 rounded-lg object-contain"
                        />
                      ) : (
                        <div className={`w-12 h-12 ${providerDetails?.logoBackground || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-lg font-bold`}>
                          {token.provider_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{token.provider_name}</h3>
                        <div className="flex items-center mt-1">
                          <span className={`w-2 h-2 rounded-full mr-2 ${token.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span className="text-sm text-gray-500 capitalize">{token.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div>Last used: {new Date(token.last_used_at).toLocaleDateString()}</div>
                    <div className="flex items-center">
                      <span>3</span>
                      <Users className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenIntegration(token.provider_key);
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      <span>Manage</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // This would be a sync action in a real app
                        alert(`Syncing ${token.provider_name}...`);
                      }}
                      className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      <span>Sync</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add Integration Card */}
          <div 
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer p-6 flex flex-col items-center justify-center text-center h-[220px]"
            onClick={handleAddIntegration}
          >
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Integration</h3>
            <p className="text-sm text-gray-500">
              Connect a new service to expand your capabilities
            </p>
          </div>
        </div>
      )}
      
      {/* Quick Start Guide */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Integration Quick Start</h3>
            <p className="text-sm text-gray-600 mb-4">
              Integrations allow Outreach Mate to connect with other services to enhance your outreach capabilities. 
              Here's how to get started:
            </p>
            <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-2">
              <li>
                <strong>Add an integration</strong> from our catalog of supported services
              </li>
              <li>
                <strong>Configure the connection</strong> by providing your API credentials
              </li>
              <li>
                <strong>Create workflows</strong> that use the integration to automate your outreach
              </li>
            </ol>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <a 
                href="/documentation/integrations" 
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                <span>Learn more about Integrations</span>
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hidden component for the icon
const Users = ({ className = "" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
};

export default Integrations;