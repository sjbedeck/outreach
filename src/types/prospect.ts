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
  name: string;
  title: string;
  email_primary: string;
  phone_numbers: string[];
  linkedin_profile_url: string | null;
  touchpoint_status: string;
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
}

export interface AIEmailDraft {
  initial_company_subject: string;
  initial_company_body: string;
}

export interface ContactEmailDraft {
  subject: string;
  body: string;
}

export interface Prospect {
  id: string;
  campaign_status: string;
  company: Company;
  contacts: Contact[];
  aiEmailDraft?: AIEmailDraft | null;
  contacts_email_drafts?: Record<string, ContactEmailDraft>;
}