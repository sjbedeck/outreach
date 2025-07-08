import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';

// Import provider configuration
import { providerConfig } from '../config/providerConfig';

interface IntegrationCategory {
  id: string;
  name: string;
  count: number;
}

const IntegrationCatalog = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<IntegrationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIntegrationDrawer, setShowIntegrationDrawer] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);

  useEffect(() => {
    loadCategories();
    setLoading(false);
  }, []);

  const loadCategories = () => {
    // Count integrations by category
    const categoryMap = new Map<string, number>();
    
    providerConfig.forEach(provider => {
      provider.categories.forEach(category => {
        const count = categoryMap.get(category) || 0;
        categoryMap.set(category, count + 1);
      });
    });
    
    // Convert to array
    const categories = Array.from(categoryMap.entries()).map(([id, count]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      count
    }));
    
    // Sort alphabetically
    categories.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add "All" option
    categories.unshift({
      id: 'all',
      name: 'All Integrations',
      count: providerConfig.length
    });
    
    setCategories(categories);
  };

  const handleOpenIntegrationDrawer = (integration: any) => {
    setSelectedIntegration(integration);
    setShowIntegrationDrawer(true);
  };

  const handleCloseIntegrationDrawer = () => {
    setShowIntegrationDrawer(false);
    setTimeout(() => {
      setSelectedIntegration(null);
    }, 300);
  };

  const handleConnect = async () => {
    // In a real implementation, this would trigger the OAuth flow
    // For demonstration, we'll just navigate to the integration portal
    handleCloseIntegrationDrawer();
    
    // Navigate to the integration portal
    if (selectedIntegration) {
      navigate(`/integrations/${selectedIntegration.id}`);
    }
  };

  const filteredIntegrations = providerConfig.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || integration.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Integration Catalog</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Build Custom Integration</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search integrations..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-48">
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50">
            <Filter size={18} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredIntegrations.map(integration => (
          <div 
            key={integration.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleOpenIntegrationDrawer(integration)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {integration.logoUrl ? (
                    <img 
                      src={integration.logoUrl} 
                      alt={`${integration.name} logo`} 
                      className="w-12 h-12 rounded-lg object-contain"
                    />
                  ) : (
                    <div className={`w-12 h-12 ${integration.logoBackground || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-lg font-bold`}>
                      {integration.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-xs text-gray-500">By {integration.developer}</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {integration.description}
              </p>
              
              <div className="flex flex-wrap gap-2">
                {integration.categories.slice(0, 3).map((category, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {category}
                  </span>
                ))}
                {integration.categories.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    +{integration.categories.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Detail Drawer */}
      {showIntegrationDrawer && selectedIntegration && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-50 transition-opacity"
          onClick={handleCloseIntegrationDrawer}
        >
          <div 
            className={`absolute top-0 right-0 w-full sm:w-[480px] h-full bg-white shadow-xl transition-transform transform ${showIntegrationDrawer ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Integration Details</h3>
                <button
                  onClick={handleCloseIntegrationDrawer}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-grow overflow-y-auto">
                <div className="flex items-center space-x-4 mb-6">
                  {selectedIntegration.logoUrl ? (
                    <img 
                      src={selectedIntegration.logoUrl} 
                      alt={`${selectedIntegration.name} logo`} 
                      className="w-16 h-16 rounded-lg object-contain"
                    />
                  ) : (
                    <div className={`w-16 h-16 ${selectedIntegration.logoBackground || 'bg-blue-500'} rounded-lg flex items-center justify-center text-white text-2xl font-bold`}>
                      {selectedIntegration.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedIntegration.name}</h2>
                    <p className="text-sm text-gray-500">By {selectedIntegration.developer}</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600 text-sm">
                    {selectedIntegration.description}
                  </p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedIntegration.categories.map((category: string, index: number) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Features</h4>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    {selectedIntegration.features?.map((feature: string, index: number) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Action Kit Support</h4>
                  <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${selectedIntegration.actionKitSupport ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {selectedIntegration.actionKitSupport ? 'Supported' : 'Not Supported'}
                  </div>
                </div>
                
                {selectedIntegration.documentation && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Documentation</h4>
                    <a 
                      href={selectedIntegration.documentation} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm inline-block"
                    >
                      View Documentation
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleConnect}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default IntegrationCatalog;