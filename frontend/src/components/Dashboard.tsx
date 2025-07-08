import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Search, MoreVertical, Mail, ExternalLink } from 'lucide-react';
import { useProspectStore } from '@/store/prospectStore';
import ProspectCard from './ProspectCard';
import ImportSection from './ImportSection';
import StatsOverview from './StatsOverview';

const Dashboard: React.FC = () => {
  const { 
    prospects, 
    loading, 
    filter, 
    setFilter, 
    fetchProspects, 
    importCompanies 
  } = useProspectStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    fetchProspects();
  }, []);

  const filteredProspects = prospects.filter(prospect => {
    const matchesSearch = prospect.company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prospect.company.industry.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || prospect.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleImport = async (data: string) => {
    try {
      await importCompanies(data);
      setShowImport(false);
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Outreach Mate</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button 
              onClick={() => setShowImport(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Import Companies</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Overview */}
          <StatsOverview />

          {/* Import Section */}
          {showImport && (
            <ImportSection 
              onImport={handleImport}
              onClose={() => setShowImport(false)}
            />
          )}

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Prospects</h3>
              <div className="flex space-x-2">
                {['all', 'processing', 'ready', 'contacted', 'replied'].map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === filterOption
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Prospects Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200 h-48 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : filteredProspects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProspects.map((prospect) => (
                  <ProspectCard key={prospect.id} prospect={prospect} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No prospects yet</h3>
                <p className="text-gray-500 mb-4">Get started by importing your first company list</p>
                <button 
                  onClick={() => setShowImport(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Import Companies
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;