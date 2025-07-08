import openai
from typing import Dict, List, Optional
import json
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class EmailGenerationService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    
    async def generate_email_content(self, prospect_data: Dict, email_type: str, contact_id: str = None) -> Dict:
        """
        Generate personalized email content using OpenAI
        """
        try:
            if email_type == "company":
                return await self._generate_company_email(prospect_data)
            elif email_type == "individual":
                return await self._generate_individual_email(prospect_data, contact_id)
            else:
                return {"error": "Invalid email type"}
                
        except Exception as e:
            logger.error(f"Email generation failed: {str(e)}")
            return {"error": f"Email generation failed: {str(e)}"}
    
    async def _generate_company_email(self, prospect_data: Dict) -> Dict:
        """Generate initial company outreach email"""
        company = prospect_data.get('company', {})
        
        prompt = f"""
        Generate a highly personalized, professional email for initial company outreach.
        
        COMPANY INFORMATION:
        - Name: {company.get('name')}
        - Industry: {company.get('industry')}
        - Website: {company.get('website_url')}
        - Employee Range: {company.get('employee_count_range')}
        - Revenue Range: {company.get('revenue_range')}
        - Mission/Vision: {company.get('mission_vision_offerings_summary')}
        - Recent Activity: {company.get('recent_company_activity_summary')}
        - Technologies: {', '.join(company.get('technologies_used', []))}
        
        EMAIL REQUIREMENTS:
        1. Subject line: Compelling, personalized, under 60 characters
        2. Body: 150-200 words, professional tone, value-focused
        3. Include specific reference to their mission/offerings
        4. Mention relevant recent activity or technologies if available
        5. Clear value proposition
        6. Professional call-to-action
        7. Warm, respectful closing
        
        TONE: Professional, respectful, value-oriented, not salesy
        GOAL: Schedule a brief conversation to discuss potential collaboration
        
        PERSONALIZATION REQUIREMENTS:
        - Reference specific aspects of their business model or mission
        - Mention their industry context
        - Show understanding of their challenges or opportunities
        - Connect your offering to their specific needs
        
        RESPOND WITH JSON FORMAT:
        {{
            "subject": "email subject line",
            "body": "email body text",
            "personalization_elements": ["list of specific personalizations used"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=800
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"OpenAI API error in company email generation: {str(e)}")
            return {"error": f"OpenAI API error: {str(e)}"}
    
    async def _generate_individual_email(self, prospect_data: Dict, contact_id: str) -> Dict:
        """Generate personalized individual touchpoint email"""
        # Find the specific contact
        contact = None
        for c in prospect_data.get('contacts', []):
            if c.get('contact_id') == contact_id:
                contact = c
                break
        
        if not contact:
            return {"error": "Contact not found"}
        
        company = prospect_data.get('company', {})
        
        prompt = f"""
        Generate a highly personalized email for individual outreach based on LinkedIn activity and professional background.
        
        CONTACT INFORMATION:
        - Name: {contact.get('name')}
        - Title: {contact.get('title')}
        - Company: {company.get('name')}
        - Industry: {company.get('industry')}
        - LinkedIn Profile: {contact.get('social_profiles', {}).get('linkedin')}
        - LinkedIn Summary: {contact.get('scraped_linkedin_profile_summary')}
        - Recent Activity: {', '.join(contact.get('scraped_linkedin_recent_activity', []))}
        - Accomplishments: {contact.get('scraped_accomplishments_summary')}
        - Current Role: {contact.get('scraped_current_work_summary')}
        - Past Work: {contact.get('scraped_past_work_summary')}
        - Online Contributions: {contact.get('scraped_online_contributions_summary')}
        - Seniority Level: {contact.get('seniority_level')}
        - Departments: {', '.join(contact.get('departments', []))}
        
        EMAIL REQUIREMENTS:
        1. Subject line: Highly personalized, reference specific activity/accomplishment
        2. Body: 120-180 words, conversational yet professional
        3. Reference specific recent LinkedIn activity or accomplishment
        4. Show genuine interest in their work or expertise
        5. Connect their expertise to potential collaboration opportunity
        6. Soft call-to-action for brief conversation
        7. Warm, respectful closing
        
        TONE: Conversational, respectful, colleague-to-colleague, genuine interest
        GOAL: Build relationship and explore mutual professional interests
        
        PERSONALIZATION REQUIREMENTS:
        - Reference their specific recent LinkedIn posts or activities
        - Mention their accomplishments or expertise areas
        - Show understanding of their current role and responsibilities
        - Connect their work to broader industry trends or opportunities
        - Demonstrate genuine professional interest, not just sales pitch
        
        RESPOND WITH JSON FORMAT:
        {{
            "subject": "email subject line",
            "body": "email body text",
            "personalization_elements": ["list of specific personalizations used"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8,
                max_tokens=600
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"OpenAI API error in individual email generation: {str(e)}")
            return {"error": f"OpenAI API error: {str(e)}"}
    
    async def generate_follow_up_email(self, prospect_data: Dict, contact_id: str, previous_emails: List[Dict]) -> Dict:
        """Generate follow-up email based on previous interactions"""
        contact = None
        for c in prospect_data.get('contacts', []):
            if c.get('contact_id') == contact_id:
                contact = c
                break
        
        if not contact:
            return {"error": "Contact not found"}
        
        company = prospect_data.get('company', {})
        
        prompt = f"""
        Generate a thoughtful follow-up email based on previous communication.
        
        CONTACT INFORMATION:
        - Name: {contact.get('name')}
        - Title: {contact.get('title')}
        - Company: {company.get('name')}
        - Recent Activity: {', '.join(contact.get('scraped_linkedin_recent_activity', []))}
        
        PREVIOUS EMAILS:
        {json.dumps(previous_emails, indent=2)}
        
        FOLLOW-UP REQUIREMENTS:
        1. Reference previous email sent
        2. Add new value or insight
        3. Soft, non-pushy approach
        4. Respectful of their time
        5. Clear but gentle call-to-action
        
        TONE: Professional, respectful, patient, value-focused
        
        RESPOND WITH JSON FORMAT:
        {{
            "subject": "follow-up email subject line",
            "body": "follow-up email body text",
            "personalization_elements": ["list of specific personalizations used"]
        }}
        """
        
        try:
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=600
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            logger.error(f"OpenAI API error in follow-up email generation: {str(e)}")
            return {"error": f"OpenAI API error: {str(e)}"}