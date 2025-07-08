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
  contact_id: string;
  name: string;
  title: string;
  email_primary: string;
  email_other_business: string[];
  email_personal_staff: string[];
  email_executive: string[];
  phone_numbers: string[];
  social_profiles: SocialProfiles;
  scraped_linkedin_profile_summary: string;
  scraped_linkedin_recent_activity: string[];
  scraped_accomplishments_summary: string;
  scraped_past_work_summary: string;
  scraped_current_work_summary: string;
  scraped_online_contributions_summary: string;
  seniority_level?: string;
  departments?: string[];
  apollo_id?: string;
}

export interface Company {
  name: string;
  website_url: string;
  linkedin_url: string;
  industry: string;
  revenue_range: string;
  employee_count_range: string;
  technologies_used: string[];
  mission_vision_offerings_summary: string;
  recent_company_activity_summary: string;
  contact_form_url: string;
  description?: string;
  founded_year?: number;
  headquarters?: string;
  apollo_id?: string;
}

export interface AIEmailDraft {
  initial_company_subject: string;
  initial_company_body: string;
  personalization_elements?: string[];
}

export interface ContactEmailDraft {
  subject: string;
  body: string;
  personalization_elements?: string[];
}

export interface Prospect {
  id: string;
  status: 'processing' | 'ready' | 'contacted' | 'replied' | 'error';
  company: Company;
  contacts: Contact[];
  campaign_status: string;
  aiEmailDraft: AIEmailDraft | null;
  contacts_email_drafts: Record<string, ContactEmailDraft>;
  data_quality_score: number;
  enrichment_timestamp?: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignConfig {
  sender_type: 'gmail' | 'outlook';
  credentials: any;
  sequence_config?: any;
  targeting_rules?: any;
}

export interface EmailSendResult {
  success: boolean;
  message_id?: string;
  error?: string;
  timestamp: number;
}

export interface SequenceResult {
  prospect_id: string;
  sequence_status: 'running' | 'completed' | 'failed';
  emails_sent: Array<{
    type: 'company_outreach' | 'individual_touchpoint';
    timestamp: number;
    result: EmailSendResult;
  }>;
  errors: string[];
}