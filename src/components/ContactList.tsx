import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { 
  User, Search, Plus, Filter, Tag, Mail, 
  Trash2, MoreHorizontal, Check, Phone, Edit, 
  Linkedin, Twitter, ExternalLink, XCircle 
} from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  status_id: string;
  tags: string[];
  profile_image: string;
  linkedin: string;
  twitter: string;
  last_interaction: string;
  created_at: string;
}

interface ContactStatus {
  id: string;
  name: string;
  color: string;
}

interface ContactList {
  id: string;
  name: string;
  description: string;
  is_default: boolean;
}

const ContactList: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [listFilter, setListFilter] = useState<string>('all');
  const [statuses, setStatuses] = useState<ContactStatus[]>([]);
  const [lists, setLists] = useState<ContactList[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);
  
  useEffect(() => {
    if (contacts.length > 0) {
      applyFilters();
    }
  }, [contacts, searchQuery, statusFilter, listFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock contact data for development
      const mockContacts = [
        {
          id: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
          name: 'Rasanath',
          email: 'rasanath@upbuild.com',
          phone: '+1-555-111-2222',
          company: 'Upbuild',
          title: 'CEO',
          status_id: 'new-status-id',
          tags: ['Leadership', 'VIP'],
          profile_image: null,
          last_interaction: '2025-06-28T09:15:00.000Z',
          created_at: '2025-06-28T09:15:00.000Z',
          linkedin: 'https://www.linkedin.com/in/rasanath',
          twitter: 'https://twitter.com/rasanath_tweets'
        },
        {
          id: 'd1e2f3a4-b5c6-7d8e-9f0a-1b2c3d4e5f6a',
          name: 'Hari',
          email: 'hari@upbuild.com',
          phone: '+1-555-333-4444',
          company: 'Upbuild',
          title: 'Head of Programs',
          status_id: 'contacted-status-id',
          tags: ['Program Development'],
          profile_image: null,
          last_interaction: '2025-06-30T14:05:00.000Z',
          created_at: '2025-06-28T09:15:00.000Z',
          linkedin: 'https://www.linkedin.com/in/hari-programs'
        },
        {
          id: 'e2f3g4h5-i6j7-k8l9-m0n1-o2p3q4r5s6t7',
          name: 'Sarah Johnson',
          email: 'sarah@techcorp.com',
          phone: '+1-555-777-8888',
          company: 'TechCorp',
          title: 'CTO',
          status_id: 'qualified-status-id',
          tags: ['Technical Decision Maker'],
          profile_image: null,
          last_interaction: null,
          created_at: '2025-06-27T14:22:00.000Z',
          linkedin: 'https://www.linkedin.com/in/sarahjohnson'
        }
      ];

      // Mock statuses
      const mockStatuses = [
        { id: 'new-status-id', name: 'New', color: '#3B82F6' },
        { id: 'contacted-status-id', name: 'Contacted', color: '#10B981' },
        { id: 'replied-status-id', name: 'Replied', color: '#6366F1' },
        { id: 'qualified-status-id', name: 'Qualified', color: '#F59E0B' },
        { id: 'converted-status-id', name: 'Converted', color: '#EC4899' }
      ];

      // Mock lists
      const mockLists = [
        { id: 'list-1', name: 'All Contacts', description: 'Default list containing all contacts', is_default: true },
        { id: 'list-2', name: 'Leadership Contacts', description: 'Contacts in leadership positions', is_default: false },
        { id: 'list-3', name: 'Technical Contacts', description: 'Contacts with technical roles', is_default: false }
      ];

      setContacts(mockContacts);
      setFilteredContacts(mockContacts);
      setStatuses(mockStatuses);
      setLists(mockLists);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch contacts. Please try again later.');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...contacts];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(contact => 
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.company?.toLowerCase().includes(query) ||
        contact.title?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(contact => contact.status_id === statusFilter);
    }
    
    // Apply list filter (this would require a junction table query in real implementation)
    if (listFilter !== 'all') {
      // In a real implementation, this would filter based on list membership
    }
    
    setFilteredContacts(result);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
  };

  const handleListFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setListFilter(e.target.value);
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetails(true);
  };

  const closeContactDetails = () => {
    setShowContactDetails(false);
    setSelectedContact(null);
  };

  const getStatusColor = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.color : '#9CA3AF'; // Default gray color
  };

  const getStatusName = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.name : 'No Status';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSendEmail = (contactName: string) => {
    // Simulate sending email
    setTimeout(() => {
      alert(`Email successfully sent to ${contactName}! 🚀 Check your sent items folder.`);
    }, 1500);
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Contacts</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus size={16} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search contacts..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          
          <div className="w-48">
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={statusFilter}
              onChange={handleStatusFilterChange}
            >
              <option value="all">All Statuses</option>
              {statuses.map(status => (
                <option key={status.id} value={status.id}>{status.name}</option>
              ))}
            </select>
          </div>
          
          <div className="w-48">
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={listFilter}
              onChange={handleListFilterChange}
            >
              <option value="all">All Lists</option>
              {lists.map(list => (
                <option key={list.id} value={list.id}>{list.name}</option>
              ))}
            </select>
          </div>
          
          <button className="flex items-center gap-1 px-3 py-2 border rounded-lg hover:bg-gray-50">
            <Filter size={18} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Contact List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company & Title
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Interaction
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <User className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-lg font-medium">No contacts found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleContactClick(contact)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {contact.profile_image ? (
                          <img src={contact.profile_image} alt={contact.name} className="h-10 w-10 rounded-full" />
                        ) : (
                          <span className="text-gray-500 font-medium">
                            {contact.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{contact.name || 'Unnamed Contact'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.email || 'No email'}</div>
                    <div className="text-sm text-gray-500">{contact.phone || 'No phone'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{contact.company || 'No company'}</div>
                    <div className="text-sm text-gray-500">{contact.title || 'No title'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full"
                      style={{ 
                        backgroundColor: `${getStatusColor(contact.status_id)}20`, 
                        color: getStatusColor(contact.status_id)
                      }}
                    >
                      {getStatusName(contact.status_id)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(contact.last_interaction)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendEmail(contact.name);
                        }}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Mail size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Edit action
                        }}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Delete action
                        }}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 flex items-center justify-between border-t">
        <div className="text-sm text-gray-500">
          Showing {filteredContacts.length} of {contacts.length} contacts
        </div>
        <div className="flex items-center space-x-2">
          <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">Previous</button>
          <button className="px-3 py-1 border rounded bg-blue-600 text-white text-sm">1</button>
          <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">2</button>
          <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">3</button>
          <button className="px-3 py-1 border rounded hover:bg-gray-50 text-sm">Next</button>
        </div>
      </div>

      {/* Contact Detail Slide-over */}
      {showContactDetails && selectedContact && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeContactDetails}></div>
            
            <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  <div className="px-6 pt-6 pb-4 border-b">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-semibold">Contact Details</h2>
                      <button 
                        className="ml-3 h-7 flex items-center justify-center"
                        onClick={closeContactDetails}
                      >
                        <XCircle size={20} className="text-gray-400 hover:text-gray-500" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex items-center mb-6">
                      <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        {selectedContact.profile_image ? (
                          <img src={selectedContact.profile_image} alt={selectedContact.name} className="h-16 w-16 rounded-full" />
                        ) : (
                          <span className="text-gray-500 text-xl font-medium">
                            {selectedContact.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-semibold">{selectedContact.name}</h3>
                        <p className="text-gray-500">{selectedContact.title} {selectedContact.company ? `at ${selectedContact.company}` : ''}</p>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex justify-between mb-3">
                        <span className="font-medium">Status</span>
                        <select 
                          className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={selectedContact.status_id}
                        >
                          {statuses.map(status => (
                            <option key={status.id} value={status.id}>{status.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex justify-between mb-3">
                        <span className="font-medium">Last Interaction</span>
                        <span className="text-gray-700">{formatDate(selectedContact.last_interaction)}</span>
                      </div>
                      
                      <div className="flex justify-between mb-3">
                        <span className="font-medium">Added On</span>
                        <span className="text-gray-700">{formatDate(selectedContact.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Contact Information</h4>
                      
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-gray-400 mr-2" />
                          <span>{selectedContact.email || 'No email address'}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Phone className="w-5 h-5 text-gray-400 mr-2" />
                          <span>{selectedContact.phone || 'No phone number'}</span>
                        </div>
                        
                        {selectedContact.linkedin && (
                          <div className="flex items-center">
                            <Linkedin className="w-5 h-5 text-gray-400 mr-2" />
                            <a 
                              href={selectedContact.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              LinkedIn Profile
                              <ExternalLink size={14} className="ml-1" />
                            </a>
                          </div>
                        )}
                        
                        {selectedContact.twitter && (
                          <div className="flex items-center">
                            <Twitter className="w-5 h-5 text-gray-400 mr-2" />
                            <a 
                              href={selectedContact.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              Twitter Profile
                              <ExternalLink size={14} className="ml-1" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {(selectedContact.tags && selectedContact.tags.length > 0) ? (
                          selectedContact.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No tags</span>
                        )}
                        <button className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200">
                          <Plus size={14} className="mr-1" />
                          Add Tag
                        </button>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Notes</h4>
                        <button className="text-sm text-blue-600 hover:text-blue-800">
                          <Plus size={16} className="inline mr-1" />
                          Add Note
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg text-gray-500 text-sm">
                        No notes added yet
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t space-y-3">
                    <button 
                      className="w-full bg-blue-600 text-white py-2 rounded-md flex items-center justify-center gap-2 hover:bg-blue-700"
                      onClick={() => handleSendEmail(selectedContact.name)}
                    >
                      <Mail size={18} />
                      Send Email
                    </button>
                    
                    <div className="flex gap-3">
                      <button className="flex-1 py-2 border border-gray-300 rounded-md text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50">
                        <Edit size={18} />
                        Edit
                      </button>
                      <button className="flex-1 py-2 border border-gray-300 rounded-md text-red-600 flex items-center justify-center gap-2 hover:bg-red-50">
                        <Trash2 size={18} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactList;