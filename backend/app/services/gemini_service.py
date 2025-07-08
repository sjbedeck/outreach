import google.generativeai as genai
import json
from typing import Dict, List, Any
import logging

logger = logging.getLogger(__name__)

class GeminiDataTransformer:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    async def process_scraped_data_with_gemini(self, raw_data: Dict) -> Dict:
        """
        Transform raw scraped data into structured format using Gemini AI
        """
        try:
            # Prepare input for Gemini
            input_text = self._prepare_input_text(raw_data)
            
            # Generate structured output
            response = self.model.generate_content(
                f"""
                CRITICAL DATA TRANSFORMATION TASK:
                
                Transform the following raw, heterogeneous data into a precise, structured JSON format suitable for database storage and AI email generation.
                
                INPUT DATA:
                {input_text}
                
                OUTPUT REQUIREMENTS:
                1. Produce a single JSON object with the exact schema below
                2. Clean and normalize all data fields
                3. Extract meaningful insights and summaries
                4. Handle missing data gracefully with null values
                5. Ensure all URLs are properly formatted
                6. Synthesize professional summaries from multiple data sources
                
                REQUIRED JSON SCHEMA:
                {{
                    "prospect_id": "string (generate unique ID)",
                    "company": {{
                        "name": "string",
                        "website_url": "string",
                        "linkedin_url": "string",
                        "industry": "string",
                        "revenue_range": "string",
                        "employee_count_range": "string",
                        "technologies_used": ["array of strings"],
                        "mission_vision_offerings_summary": "string (200-300 words)",
                        "recent_company_activity_summary": "string (100-200 words)",
                        "contact_form_url": "string or null",
                        "description": "string or null",
                        "founded_year": "number or null",
                        "headquarters": "string or null",
                        "apollo_id": "string or null"
                    }},
                    "contacts": [
                        {{
                            "contact_id": "string",
                            "name": "string",
                            "title": "string",
                            "email_primary": "string",
                            "email_other_business": ["array of strings"],
                            "email_personal_staff": ["array of strings"],
                            "email_executive": ["array of strings"],
                            "phone_numbers": ["array of strings"],
                            "social_profiles": {{
                                "linkedin": "string or null",
                                "twitter": "string or null",
                                "youtube": "string or null",
                                "tiktok": "string or null",
                                "instagram": "string or null",
                                "facebook": "string or null",
                                "other_social_media_handles": ["array of strings"]
                            }},
                            "scraped_linkedin_profile_summary": "string (100-150 words)",
                            "scraped_linkedin_recent_activity": ["array of strings"],
                            "scraped_accomplishments_summary": "string or null",
                            "scraped_past_work_summary": "string",
                            "scraped_current_work_summary": "string",
                            "scraped_online_contributions_summary": "string or null",
                            "seniority_level": "string or null",
                            "departments": ["array of strings"],
                            "apollo_id": "string or null"
                        }}
                    ],
                    "campaign_status": "string (Data Ready/Processing/Error)",
                    "data_quality_score": "number (0-100)",
                    "enrichment_timestamp": "number (unix timestamp)"
                }}
                
                IMPORTANT INSTRUCTIONS:
                - Use the Apollo.io data as the primary source for contact information
                - Enhance contact profiles with LinkedIn scraping data
                - Create comprehensive summaries that combine multiple data sources
                - Ensure all email addresses are properly formatted
                - Calculate data quality score based on completeness of information
                - Set campaign_status to "Data Ready" if all required fields are populated
                
                RESPOND WITH ONLY THE JSON OBJECT - NO ADDITIONAL TEXT OR FORMATTING.
                """
            )
            
            # Parse and validate response
            try:
                # Clean the response text
                response_text = response.text.strip()
                if response_text.startswith('```json'):
                    response_text = response_text[7:-3]
                elif response_text.startswith('```'):
                    response_text = response_text[3:-3]
                
                structured_data = json.loads(response_text)
                
                # Validate required fields
                if self._validate_structured_data(structured_data):
                    return structured_data
                else:
                    logger.error("Invalid structured data format from Gemini")
                    return {"error": "Invalid structured data format"}
                    
            except json.JSONDecodeError as e:
                logger.error(f"JSON decode error: {str(e)}")
                return {"error": f"JSON parsing failed: {str(e)}"}
                
        except Exception as e:
            logger.error(f"Gemini processing failed: {str(e)}")
            return {"error": f"Gemini processing failed: {str(e)}"}
    
    def _prepare_input_text(self, raw_data: Dict) -> str:
        """Prepare raw data for Gemini processing"""
        sections = []
        
        # Website scraping data
        if raw_data.get('website_data'):
            sections.append(f"WEBSITE DATA:\n{json.dumps(raw_data['website_data'], indent=2)}")
        
        # LinkedIn company data
        if raw_data.get('linkedin_data'):
            sections.append(f"LINKEDIN COMPANY DATA:\n{json.dumps(raw_data['linkedin_data'], indent=2)}")
        
        # Apollo.io enrichment data
        if raw_data.get('apollo_data'):
            sections.append(f"APOLLO.IO DATA:\n{json.dumps(raw_data['apollo_data'], indent=2)}")
        
        # Individual LinkedIn profiles
        if raw_data.get('individual_profiles'):
            sections.append(f"INDIVIDUAL LINKEDIN PROFILES:\n{json.dumps(raw_data['individual_profiles'], indent=2)}")
        
        # Additional web search data
        if raw_data.get('web_search_data'):
            sections.append(f"WEB SEARCH DATA:\n{json.dumps(raw_data['web_search_data'], indent=2)}")
        
        return "\n\n".join(sections)
    
    def _validate_structured_data(self, data: Dict) -> bool:
        """Validate the structured data format"""
        required_fields = ['prospect_id', 'company', 'contacts', 'campaign_status']
        
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return False
        
        # Validate company structure
        if not isinstance(data['company'], dict):
            logger.error("Company field must be a dictionary")
            return False
        
        # Validate contacts structure
        if not isinstance(data['contacts'], list):
            logger.error("Contacts field must be a list")
            return False
        
        # Validate company required fields
        company_required = ['name', 'website_url', 'linkedin_url', 'industry']
        for field in company_required:
            if field not in data['company']:
                logger.error(f"Missing required company field: {field}")
                return False
        
        # Validate contact structure
        for contact in data['contacts']:
            if not isinstance(contact, dict):
                logger.error("Each contact must be a dictionary")
                return False
            
            contact_required = ['contact_id', 'name', 'title', 'email_primary']
            for field in contact_required:
                if field not in contact:
                    logger.error(f"Missing required contact field: {field}")
                    return False
        
        return True
    
    def calculate_data_quality_score(self, data: Dict) -> int:
        """Calculate data quality score based on completeness"""
        score = 0
        max_score = 100
        
        # Company data scoring (50 points)
        company = data.get('company', {})
        company_fields = [
            'name', 'website_url', 'linkedin_url', 'industry', 
            'revenue_range', 'employee_count_range', 'mission_vision_offerings_summary'
        ]
        
        filled_company_fields = sum(1 for field in company_fields if company.get(field))
        score += (filled_company_fields / len(company_fields)) * 50
        
        # Contacts data scoring (40 points)
        contacts = data.get('contacts', [])
        if contacts:
            contact_score = 0
            for contact in contacts:
                contact_fields = [
                    'name', 'title', 'email_primary', 'linkedin_url',
                    'scraped_linkedin_profile_summary', 'scraped_current_work_summary'
                ]
                filled_contact_fields = sum(1 for field in contact_fields if contact.get(field))
                contact_score += (filled_contact_fields / len(contact_fields))
            
            score += (contact_score / len(contacts)) * 40
        
        # Technologies and additional data (10 points)
        if company.get('technologies_used'):
            score += 5
        if company.get('recent_company_activity_summary'):
            score += 5
        
        return min(int(score), max_score)