import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  ExternalLink, 
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Linkedin,
  Phone
} from 'lucide-react';
import { Prospect } from '@/types/prospect';
import { useProspectStore } from '@/store/prospectStore';

interface ProspectCardProps {
  prospect: Prospect;
}

const ProspectCard: React.FC<ProspectCardProps> = ({ prospect }) => {
  const [expanded, setExpanded] = useState(false);
  const { generateEmail, sendEmail } = useProspectStore();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="w-4 h-4" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4" />;
      case 'contacted':
        return <Send className="w-4 h-4" />;
      case 'replied':
        return <Mail className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleGenerateEmail = async (type: 'company' | 'individual', contactId?: string) => {
    try {
      await generateEmail(prospect.id, type, contactId);
    } catch (error) {
      console.error('Email generation failed:', error);
    }
  };

  const handleSendEmail = async (type: 'company' | 'individual', contactId?: string) => {
    try {
      await sendEmail(prospect.id, type, contactId);
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{prospect.company.name}</h3>
              <p className="text-sm text-gray-500">{prospect.company.industry}</p>
            </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prospect.status)}`}>
            {getStatusIcon(prospect.status)}
            <span>{prospect.status.charAt(0).toUpperCase() + prospect.status.slice(1)}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>{prospect.contacts.length} contacts</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Employee Count:</span>
            <span className="font-medium">{prospect.company.employee_count_range}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Revenue Range:</span>
            <span className="font-medium">{prospect.company.revenue_range}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Data Quality:</span>
            <span className="font-medium">{prospect.data_quality_score}%</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          {prospect.company.website_url && (
            <a
              href={prospect.company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Website</span>
            </a>
          )}
          {prospect.company.linkedin_url && (
            <a
              href={prospect.company.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
            >
              <Linkedin className="w-4 h-4" />
              <span>LinkedIn</span>
            </a>
          )}
        </div>

        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => handleGenerateEmail('company')}
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            disabled={prospect.status === 'processing'}
          >
            {prospect.aiEmailDraft ? 'Regenerate Email' : 'Generate Email'}
          </button>
          {prospect.aiEmailDraft && (
            <button
              onClick={() => handleSendEmail('company')}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
            >
              Send Email
            </button>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
        >
          {expanded ? 'Show Less' : 'View Details'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-200 p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Company Overview</h4>
              <p className="text-sm text-gray-600">{prospect.company.mission_vision_offerings_summary}</p>
            </div>

            {prospect.company.recent_company_activity_summary && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                <p className="text-sm text-gray-600">{prospect.company.recent_company_activity_summary}</p>
              </div>
            )}

            {prospect.company.technologies_used && prospect.company.technologies_used.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Technologies Used</h4>
                <div className="flex flex-wrap gap-1">
                  {prospect.company.technologies_used.map((tech, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {prospect.aiEmailDraft && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Generated Email</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-sm text-gray-700 mb-2">
                    Subject: {prospect.aiEmailDraft.initial_company_subject}
                  </p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {prospect.aiEmailDraft.initial_company_body}
                  </p>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Key Contacts</h4>
              <div className="space-y-3">
                {prospect.contacts.map((contact, index) => (
                  <div key={contact.contact_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      <p className="text-sm text-gray-500">{contact.title}</p>
                      <p className="text-sm text-gray-500">{contact.email_primary}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleGenerateEmail('individual', contact.contact_id)}
                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        Generate
                      </button>
                      {prospect.contacts_email_drafts && prospect.contacts_email_drafts[contact.contact_id] && (
                        <button
                          onClick={() => handleSendEmail('individual', contact.contact_id)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                        >
                          Send
                        </button>
                      )}
                      {contact.social_profiles.linkedin && (
                        <a
                          href={contact.social_profiles.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {prospect.contacts_email_drafts && Object.keys(prospect.contacts_email_drafts).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Individual Email Drafts</h4>
                <div className="space-y-3">
                  {Object.entries(prospect.contacts_email_drafts).map(([contactId, draft]) => {
                    const contact = prospect.contacts.find(c => c.contact_id === contactId);
                    return (
                      <div key={contactId} className="bg-gray-50 rounded-lg p-4">
                        <p className="font-medium text-sm text-gray-700 mb-1">
                          To: {contact?.name} ({contact?.title})
                        </p>
                        <p className="font-medium text-sm text-gray-700 mb-2">
                          Subject: {draft.subject}
                        </p>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">
                          {draft.body}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProspectCard;