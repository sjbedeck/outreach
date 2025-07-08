import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface SocialProfiles {
  linkedin: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
  instagram: string | null;
  facebook: string | null;
  other_social_media_handles: string[];
}

export interface Contact {
  id: string;
  company_id: string;
  apollo_contact_id: string | null;
  name: string;
  title: string;
  email_primary: string;
  email_other_business: string | null;
  email_personal_staff: string | null;
  email_executive: string | null;
  phone_numbers: string[];
  linkedin_profile_url: string | null;
  scraped_linkedin_profile_summary: string | null;
  scraped_linkedin_recent_activity: string[];
  scraped_accomplishments_summary: string | null;
  scraped_past_work_summary: string | null;
  scraped_current_work_summary: string | null;
  scraped_online_contributions_summary: string | null;
  social_profiles: SocialProfiles | null;
  ai_individual_email_subject: string | null;
  ai_individual_email_body: string | null;
  touchpoint_status: string;
  last_touchpoint_sent_at: string | null;
  touchpoint_sequence_number: number;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  company_name: string;
  linkedin_company_url: string | null;
  initial_website_url: string | null;
  scraped_website_text_snippet: string | null;
  scraped_website_contact_form_url: string | null;
  industry: string | null;
  revenue_range: string | null;
  employee_count_range: string | null;
  technologies_used: string[];
  mission_vision_offerings_summary: string | null;
  recent_company_activity_summary: string | null;
  campaign_status: string;
  warmth_marker: string;
  initial_email_sent_at: string | null;
  ai_initial_company_email_subject: string | null;
  ai_initial_company_email_body: string | null;
  data_quality_score?: number;
  created_at: string;
  updated_at: string;
  contacts?: Contact[];
}

interface ProspectContextType {
  companies: Company[];
  loading: boolean;
  error: string | null;
  importCompanies: (csvData: string) => Promise<void>;
  updateCompanyStatus: (id: string, status: string) => Promise<void>;
  generateEmail: (companyId: string, type: 'company' | 'individual', contactId?: string) => Promise<void>;
  sendEmail: (companyId: string, type: 'company' | 'individual', contactId?: string) => Promise<void>;
  fetchCompany: (id: string) => Promise<Company | null>;
}

const ProspectContext = createContext<ProspectContextType | undefined>(undefined);

export const useProspects = () => {
  const context = useContext(ProspectContext);
  if (context === undefined) {
    throw new Error('useProspects must be used within a ProspectProvider');
  }
  return context;
};

interface ProspectProviderProps {
  children: ReactNode;
}

export const ProspectProvider: React.FC<ProspectProviderProps> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchCompanies();
  }, []);
  
  const fetchCompanies = async () => {
    try {
      setLoading(false);
      setError(null);
      
      // Mock data
      const mockCompanies = [
        {
          id: 'b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e',
          status: 'ready',
          company: {
            name: 'Upbuild',
            website_url: 'https://www.upbuild.com',
            linkedin_url: 'https://linkedin.com/company/upbuild',
            industry: 'Leadership Coaching',
            revenue_range: '$1M-10M',
            employee_count_range: '10-50',
            technologies_used: ['HubSpot', 'Salesforce'],
            mission_vision_offerings_summary: 'Leadership coaching and development',
            recent_company_activity_summary: 'Recent focus on team building',
            contact_form_url: 'https://upbuild.com/contact'
          },
          contacts: [
            {
              contact_id: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
              name: 'Rasanath',
              title: 'CEO',
              email_primary: 'rasanath@upbuild.com',
              email_other_business: [],
              email_personal_staff: [],
              email_executive: [],
              phone_numbers: [],
              social_profiles: {
                linkedin: 'https://linkedin.com/in/rasanath',
                twitter: null,
                youtube: null,
                tiktok: null,
                instagram: null,
                facebook: null,
                other_social_media_handles: []
              },
              scraped_linkedin_profile_summary: 'Experienced CEO in leadership coaching',
              scraped_linkedin_recent_activity: ['Posted about team building'],
              scraped_accomplishments_summary: 'Built successful coaching practice',
              scraped_past_work_summary: 'Previous experience in consulting',
              scraped_current_work_summary: 'Leading Upbuild as CEO',
              scraped_online_contributions_summary: 'Regular LinkedIn contributor'
            }
          ],
          campaign_status: 'Ready',
          aiEmailDraft: null,
          contacts_email_drafts: {},
        }
      ];
      
      setCompanies(mockCompanies);
    } catch (err: any) {
      console.error('Error fetching companies:', err);
      setError(err.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyStatus = async (id: string, status: string) => {
    try {
      setError(null);
      
      // Update local state
      setCompanies(prev => 
        prev.map(company => 
          company.id === id ? { ...company, campaign_status: status } : company
        )
      );
      
      // Show success message
      alert(`Company status updated to ${status}`);
      
    } catch (err: any) {
      console.error('Error updating company status:', err);
      setError(err.message || 'Failed to update company status');
    }
  };

  const importCompanies = async (csvData: string) => {
    try {
      console.log('Importing CSV data:', csvData);
      setLoading(true);
      setError(null);
      
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const companyNameIndex = headers.findIndex(h => h.toLowerCase().includes('company') || h.toLowerCase().includes('name'));
      const websiteIndex = headers.findIndex(h => h.toLowerCase().includes('website') || h.toLowerCase().includes('url'));
      const linkedinIndex = headers.findIndex(h => h.toLowerCase().includes('linkedin'));
      
      const newProspects = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');
        if (cols.length <= 1) continue;
        
        const companyName = cols[companyNameIndex]?.trim() || 'Unknown Company';
        const websiteUrl = websiteIndex > -1 ? cols[websiteIndex]?.trim() || '' : '';
        const linkedinUrl = linkedinIndex > -1 ? cols[linkedinIndex]?.trim() || '' : '';
        
        newProspects.push({
          id: `import-${Date.now()}-${i}`,
          status: 'processing',
          company: {
            name: companyName,
            website_url: websiteUrl,
            linkedin_url: linkedinUrl,
            industry: 'Unknown',
            revenue_range: 'Unknown',
            employee_count_range: 'Unknown',
            technologies_used: [],
            mission_vision_offerings_summary: '',
            recent_company_activity_summary: '',
            contact_form_url: ''
          },
          contacts: [],
          campaign_status: 'Processing',
          aiEmailDraft: null,
          contacts_email_drafts: {},
        });
      }
      
      // Add new companies to state
      setCompanies(prev => [...prev, ...newProspects]);
      
      // Simulate processing
      setTimeout(() => {
        setCompanies(prev => 
          prev.map(p => {
            if (p.status === 'processing') {
              return {
                ...p,
                status: 'ready',
                campaign_status: 'Data Ready'
              };
            }
            return p;
          })
        );
      }, 2000);
      
      return true;
      
    } catch (err: any) {
      console.error('Import failed:', err);
      setError(err.message || 'Failed to import companies');
      alert(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateEmail = async (companyId: string, type: 'company' | 'individual', contactId?: string) => {
    try {
      setError(null);
      console.log(`Generating email for ${type}, company ${companyId}${contactId ? `, contact ${contactId}` : ''}`);
      
      // For demo, we'll just update the company's aiEmailDraft
      setCompanies(prev => prev.map(company => {
        if (company.id === companyId) {
          if (type === 'company') {
            return {
              ...company,
              aiEmailDraft: {
                initial_company_subject: `Partnership Opportunity: ${company.company.name}`,
                initial_company_body: `Hi ${company.company.name} Team,\n\nI've been following your work in the ${company.company.industry || 'industry'} space and I'm impressed by ${company.company.mission_vision_offerings_summary || 'your offerings'}.\n\nI'd love to discuss how we might collaborate on [YOUR VALUE PROPOSITION].\n\nWould you be open to a brief conversation next week?\n\nBest regards,\nYour Name`
              }
            };
          } else if (type === 'individual' && contactId) {
            const contact = company.contacts.find(c => c.contact_id === contactId);
            if (contact) {
              return {
                ...company,
                contacts_email_drafts: {
                  ...company.contacts_email_drafts,
                  [contactId]: {
                    subject: `Your work at ${company.company.name}`,
                    body: `Hi ${contact.name},\n\nI came across your profile and I'm impressed by your work as ${contact.title} at ${company.company.name}.\n\nI'd love to connect and discuss how [YOUR VALUE PROPOSITION] might align with your goals.\n\nWould you have 15 minutes for a brief call next week?\n\nBest,\nYour Name`
                  }
                }
              };
            }
          }
        }
        return company;
      }));

      // Show success alert
      alert('Email generated successfully!');
      return true;
    } catch (err: any) {
      console.error('Error generating email:', err);
      setError(err.message || 'Failed to generate email');
      alert(`Failed to generate email: ${err.message}`);
    }
  };

  const sendEmail = async (companyId: string, type: 'company' | 'individual', contactId?: string) => {
    try {
      setError(null);
      console.log(`Sending email for ${type}, company ${companyId}${contactId ? `, contact ${contactId}` : ''}`);
      
      // For demo purposes, we'll just update the status
      setCompanies(prev => 
        prev.map(company => {
          if (company.id === companyId) {
            return {
              ...company,
              status: 'sent'
            }
          }
          return company;
        })
      );
      
      // Show success alert
      alert('Email sent successfully!');
      return true;
      
    } catch (err: any) {
      console.error('Error sending email:', err);
      setError(err.message || 'Failed to send email');
      alert(`Failed to send email: ${err.message}`);
    }
  };

  const fetchCompany = async (id: string): Promise<Company | null> => {
    try {
      // Look for the company in our local state
      const existingCompany = companies.find(c => c.id === id);
      
      return existingCompany || null;
      
    } catch (err: any) {
      console.error('Error fetching company:', err);
      return null;
    }
  };

  return (
    <ProspectContext.Provider value={{
      companies, 
      loading, 
      error,
      importCompanies,
      updateCompanyStatus,
      generateEmail,
      sendEmail,
      fetchCompany
    }}>
      {children}
    </ProspectContext.Provider>
  );
};