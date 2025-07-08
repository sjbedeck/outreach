import React, { useState, useEffect } from 'react';
import { Mail, Plus, Search, Filter, MoreVertical, Edit, Trash2, Copy, Check, X } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface EmailTemplate {
  id: string;
  name: string;
  description: string;
  type: 'company_outreach' | 'individual_touchpoint';
  subject: string;
  body: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would fetch from your API
      // For now, we'll simulate with mock data
      const mockTemplates = [
        {
          id: 'k8l9m0n1-o2p3-q4r5-s6t7-u8v9w0x1y2z3',
          name: 'Leadership Development Outreach',
          description: 'Initial outreach template for leadership development companies',
          type: 'company_outreach' as const,
          subject: 'Partnership Opportunity: {{company_name}} + Breathwork for Leadership',
          body: 'Hi {{company_name}} Team,\n\nI\'ve been following your work in the leadership development space and particularly appreciate your focus on {{mission_vision_offerings_summary}}.\n\nAt [Our Company], we specialize in integrating breathwork and somatic practices into leadership development, which could nicely complement your approach to {{industry}} training.\n\nWould you be open to a brief conversation about potential synergies between our methodologies? I believe there could be interesting possibilities for collaboration.\n\nLooking forward to connecting,\n{{user_name}}',
          is_ai_generated: false,
          created_at: '2025-06-24T09:30:00.000Z',
          updated_at: '2025-06-24T09:30:00.000Z'
        },
        {
          id: 'l9m0n1o2-p3q4-r5s6-t7u8-v9w0x1y2z3a4',
          name: 'Executive LinkedIn Touchpoint',
          description: 'Personalized outreach based on LinkedIn activity',
          type: 'individual_touchpoint' as const,
          subject: '{{contact_name}}: Your thoughts on {{recent_activity_topic}}',
          body: 'Hi {{contact_name}},\n\nI noticed your recent LinkedIn post about {{recent_activity_topic}} and found your perspective on {{activity_insight}} particularly insightful.\n\nThis resonates with some research we\'ve been doing on {{related_topic}} and its impact on leadership effectiveness.\n\nGiven your role as {{contact_title}} at {{company_name}}, I\'d be interested in briefly sharing some findings that might complement your approach. Would you have 15 minutes for a conversation next week?\n\nBest regards,\n{{user_name}}',
          is_ai_generated: false,
          created_at: '2025-06-24T10:15:00.000Z',
          updated_at: '2025-06-24T10:15:00.000Z'
        },
        {
          id: 'm0n1o2p3-q4r5-s6t7-u8v9-w0x1y2z3a4b5',
          name: 'AI-Generated Follow-Up',
          description: 'AI-optimized follow-up email for non-responders',
          type: 'individual_touchpoint' as const,
          subject: 'Quick follow-up: {{previous_topic}}',
          body: 'Hi {{contact_name}},\n\nI wanted to follow up on my previous email about {{previous_topic}}. I understand how busy things can get, so I thought I\'d check in to see if you had a chance to consider the idea.\n\nThe reason I\'m reaching out again is that we've recently had some compelling results with {{relevant_company}} that I thought might be of interest given your work in {{industry}}.\n\nWould you be open to a brief conversation next week?\n\nBest regards,\n{{user_name}}',
          is_ai_generated: true,
          created_at: '2025-06-25T15:30:00.000Z',
          updated_at: '2025-06-25T15:30:00.000Z'
        }
      ];
      
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error fetching email templates:', error);
      setErrorMessage('Failed to load email templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = typeFilter === 'all' || template.type === typeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleCreateTemplate = () => {
    setSelectedTemplate({
      id: '',
      name: '',
      description: '',
      type: 'company_outreach',
      subject: '',
      body: '',
      is_ai_generated: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setShowEditor(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate({...template});
    setShowEditor(true);
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      if (window.confirm('Are you sure you want to delete this template?')) {
        // In a real app, this would call your API
        setTemplates(templates.filter(t => t.id !== id));
        setSuccessMessage('Template deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setErrorMessage('Failed to delete template');
      
      // Clear error message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const handleDuplicateTemplate = (template: EmailTemplate) => {
    setSelectedTemplate({
      ...template,
      id: '',
      name: `${template.name} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setShowEditor(true);
  };
  
  const handleSaveTemplate = async () => {
    try {
      if (!selectedTemplate) return;
      
      // Validate required fields
      if (!selectedTemplate.name || !selectedTemplate.type || !selectedTemplate.subject || !selectedTemplate.body) {
        setErrorMessage('Please fill all required fields');
        return;
      }
      
      // In a real app, this would call your API
      if (selectedTemplate.id) {
        // Update existing template
        setTemplates(prev => prev.map(t => 
          t.id === selectedTemplate.id ? {...selectedTemplate, updated_at: new Date().toISOString()} : t
        ));
        setSuccessMessage('Template updated successfully');
      } else {
        // Create new template
        const newTemplate = {
          ...selectedTemplate,
          id: `template-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setTemplates(prev => [...prev, newTemplate]);
        setSuccessMessage('Template created successfully');
      }
      
      setShowEditor(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error saving template:', error);
      setErrorMessage('Failed to save template');
      
      // Clear error message after 3 seconds
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Email Templates</h2>
        <button
          onClick={handleCreateTemplate}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Template</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded flex justify-between items-center">
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded flex justify-between items-center">
          <div className="flex items-center">
            <X className="w-5 h-5 mr-2" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-700">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search templates..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="w-48">
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="company_outreach">Company Outreach</option>
              <option value="individual_touchpoint">Individual Touchpoint</option>
            </select>
          </div>
          
          <button className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50">
            <Filter size={18} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Templates ({filteredTemplates.length})</h3>
        </div>
        
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">Create your first email template to get started</p>
            <button 
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Template
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map(template => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{template.name}</div>
                      <div className="text-sm text-gray-500">{template.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        template.type === 'company_outreach' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {template.type === 'company_outreach' ? 'Company' : 'Individual'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{template.subject}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(template.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {template.is_ai_generated ? 'Yes' : 'No'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditTemplate(template)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDuplicateTemplate(template)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <Copy size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedTemplate?.id ? 'Edit Template' : 'Create New Template'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={selectedTemplate?.name || ''}
                    onChange={e => setSelectedTemplate(prev => prev ? {...prev, name: e.target.value} : null)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={selectedTemplate?.description || ''}
                    onChange={e => setSelectedTemplate(prev => prev ? {...prev, description: e.target.value} : null)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={selectedTemplate?.type || 'company_outreach'}
                    onChange={e => setSelectedTemplate(prev => prev ? {...prev, type: e.target.value as 'company_outreach' | 'individual_touchpoint'} : null)}
                  >
                    <option value="company_outreach">Company Outreach</option>
                    <option value="individual_touchpoint">Individual Touchpoint</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={selectedTemplate?.subject || ''}
                    onChange={e => setSelectedTemplate(prev => prev ? {...prev, subject: e.target.value} : null)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
                  <textarea 
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    value={selectedTemplate?.body || ''}
                    onChange={e => setSelectedTemplate(prev => prev ? {...prev, body: e.target.value} : null)}
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowEditor(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {selectedTemplate?.id ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;