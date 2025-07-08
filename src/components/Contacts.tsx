import React, { useState } from 'react';
import { Search, Filter, Download, Mail, Linkedin, Phone } from 'lucide-react';

const Contacts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const contacts = [
    {
      id: 1,
      name: 'John Smith',
      title: 'CEO',
      company: 'Tech Corp',
      email: 'john@techcorp.com',
      linkedin: 'https://linkedin.com/in/johnsmith',
      phone: '+1 (555) 123-4567',
      status: 'contacted',
      lastContact: '2024-01-15',
      warmth: 'warm'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      title: 'Marketing Director',
      company: 'Growth Co',
      email: 'sarah@growthco.com',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      phone: '+1 (555) 987-6543',
      status: 'replied',
      lastContact: '2024-01-18',
      warmth: 'hot'
    },
    {
      id: 3,
      name: 'Michael Chen',
      title: 'CTO',
      company: 'Innovation Labs',
      email: 'michael@innovationlabs.com',
      linkedin: 'https://linkedin.com/in/michaelchen',
      phone: '+1 (555) 456-7890',
      status: 'new',
      lastContact: null,
      warmth: 'cold'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-gray-100 text-gray-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarmthColor = (warmth: string) => {
    switch (warmth) {
      case 'hot':
        return 'bg-red-100 text-red-800';
      case 'warm':
        return 'bg-yellow-100 text-yellow-800';
      case 'cold':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || contact.status === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  const handleSendEmail = (contactName) => {
    // Simulating sending an email
    setTimeout(() => {
      alert(`Email successfully sent to ${contactName}! 🚀 Check your sent items folder.`);
    }, 1500);
  };
  
  const handleSendEmail = (contact: any) => {
    alert(`Email sent successfully to ${contact.name} at ${contact.email}!`);
  };
  
  const handleEditContact = (contact: any) => {
    alert(`Editing contact ${contact.name}`);
  };
  
  const handleDeleteContact = (contact: any) => {
    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      alert(`Contact ${contact.name} deleted successfully!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">Contacts</h2>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Export Contacts</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Contacts</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="replied">Replied</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">1,234</p>
            <p className="text-sm text-gray-500">Total Contacts</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">456</p>
            <p className="text-sm text-gray-500">Contacted</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">123</p>
            <p className="text-sm text-gray-500">Replied</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">18.5%</p>
            <p className="text-sm text-gray-500">Response Rate</p>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Contacts ({filteredContacts.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warmth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {contact.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                        <div className="text-sm text-gray-500">{contact.title}</div>
                        <div className="text-sm text-gray-500">{contact.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {contact.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contact.status)}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getWarmthColor(contact.warmth)}`}>
                      {contact.warmth}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contact.lastContact ? new Date(contact.lastContact).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-blue-600 hover:text-blue-900"
                        onClick={() => handleSendEmail(contact)}
                        onClick={() => handleSendEmail(contact.name)}
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900">
                        <Linkedin className="w-4 h-4" />
                      </a>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Phone className="w-4 h-4" />
                        onClick={() => handleEditContact(contact)}
                      </button>
                    </div>
                  </td>
                        onClick={() => handleDeleteContact(contact)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Contacts;