from pydantic import BaseModel, EmailStr, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class ProspectStatus(str, Enum):
    PROCESSING = "processing"
    READY = "ready"
    CONTACTED = "contacted"
    REPLIED = "replied"
    ERROR = "error"

class SocialProfiles(BaseModel):
    linkedin: Optional[str] = None
    twitter: Optional[str] = None
    youtube: Optional[str] = None
    tiktok: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    other_social_media_handles: List[str] = []

class ContactBase(BaseModel):
    contact_id: str
    name: str
    title: str
    email_primary: str
    email_other_business: List[str] = []
    email_personal_staff: List[str] = []
    email_executive: List[str] = []
    phone_numbers: List[str] = []
    social_profiles: SocialProfiles
    scraped_linkedin_profile_summary: str
    scraped_linkedin_recent_activity: List[str] = []
    scraped_accomplishments_summary: Optional[str] = None
    scraped_past_work_summary: str
    scraped_current_work_summary: str
    scraped_online_contributions_summary: Optional[str] = None
    seniority_level: Optional[str] = None
    departments: List[str] = []
    apollo_id: Optional[str] = None

class CompanyBase(BaseModel):
    name: str
    website_url: str
    linkedin_url: str
    industry: str
    revenue_range: str
    employee_count_range: str
    technologies_used: List[str] = []
    mission_vision_offerings_summary: str
    recent_company_activity_summary: str
    contact_form_url: str
    description: Optional[str] = None
    founded_year: Optional[int] = None
    headquarters: Optional[str] = None
    apollo_id: Optional[str] = None

class AIEmailDraft(BaseModel):
    initial_company_subject: str
    initial_company_body: str
    personalization_elements: List[str] = []

class ContactEmailDraft(BaseModel):
    subject: str
    body: str
    personalization_elements: List[str] = []

class ProspectBase(BaseModel):
    id: str
    status: ProspectStatus
    company: CompanyBase
    contacts: List[ContactBase]
    campaign_status: str
    aiEmailDraft: Optional[AIEmailDraft] = None
    contacts_email_drafts: Dict[str, ContactEmailDraft] = {}
    data_quality_score: int
    enrichment_timestamp: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class ProspectCreate(BaseModel):
    csv_data: str

class ProspectUpdate(BaseModel):
    status: Optional[ProspectStatus] = None
    campaign_status: Optional[str] = None

class EmailGenerationRequest(BaseModel):
    type: str  # 'company' or 'individual'
    contact_id: Optional[str] = None

class EmailSendRequest(BaseModel):
    type: str  # 'company' or 'individual'
    contact_id: Optional[str] = None
    sender_type: str  # 'gmail' or 'outlook'

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    company_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    company_name: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class ApiKeyUpdate(BaseModel):
    openai_key: Optional[str] = None
    apollo_key: Optional[str] = None
    gemini_key: Optional[str] = None

class EmailSettings(BaseModel):
    default_sender: str
    signature: str
    track_opens: bool
    track_clicks: bool

class CampaignCreate(BaseModel):
    name: str
    description: Optional[str] = None
    prospect_ids: List[str]
    sequence_config: Dict[str, Any]
    sender_config: Dict[str, Any]

class CampaignResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    performance_metrics: Dict[str, Any]