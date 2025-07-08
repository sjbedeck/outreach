#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Email Generator Module for Outreach Mate

This module uses OpenAI's ChatGPT API to generate hyper-personalized
email subjects and bodies for both company-level and individual-level outreach.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

from openai import AsyncOpenAI
import logging
import json
import time
import re
from typing import Dict, List, Optional, Any, Union, Tuple
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmailGenerator:
    """
    OpenAI-powered email generator for hyper-personalized outreach.
    Generates both company-level and individual-level emails.
    """
    
    def __init__(self, api_key: str, model: str = "gpt-4"):
        """
        Initialize the Email Generator.
        
        Args:
            api_key: OpenAI API key
            model: OpenAI model to use
        """
        self.api_key = api_key
        self.model = model
        self.client = AsyncOpenAI(api_key=self.api_key)
    
    async def generate_company_email(self, company_data: Dict[str, Any], 
                                    user_info: Dict[str, str],
                                    template_id: Optional[str] = None) -> Dict[str, str]:
        """
        Generate a personalized email for initial company outreach.
        
        Args:
            company_data: Structured company data
            user_info: Information about the sender
            template_id: Optional template ID to use
            
        Returns:
            Dictionary containing email subject and body
        """
        logger.info(f"Generating company outreach email for: {company_data.get('name', 'Unknown Company')}")
        
        # Extract relevant information for personalization
        company_name = company_data.get("name", "")
        industry = company_data.get("industry", "")
        website = company_data.get("website_url", "")
        mission = company_data.get("mission_vision_offerings_summary", "")
        recent_activity = company_data.get("recent_company_activity_summary", "")
        technologies = company_data.get("technologies_used", [])
        
        # Build the prompt
        prompt = self._build_company_email_prompt(
            company_name=company_name,
            industry=industry,
            website=website,
            mission=mission,
            recent_activity=recent_activity,
            technologies=technologies,
            user_info=user_info
        )
        
        # Generate response
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse the response
            response_text = response.choices[0].message.content
            email_data = self._parse_email_response(response_text)
            
            logger.info(f"Successfully generated company email for {company_name}")
            return email_data
            
        except Exception as e:
            logger.error(f"Error generating company email: {str(e)}")
            return {
                "subject": f"Error generating email for {company_name}",
                "body": "Error: Unable to generate personalized email. Please try again later.",
                "error": str(e)
            }
    
    async def generate_individual_email(self, contact_data: Dict[str, Any], 
                                      company_data: Dict[str, Any],
                                      user_info: Dict[str, str],
                                      template_id: Optional[str] = None) -> Dict[str, str]:
        """
        Generate a hyper-personalized email for individual contact outreach.
        
        Args:
            contact_data: Structured contact data
            company_data: Structured company data (for context)
            user_info: Information about the sender
            template_id: Optional template ID to use
            
        Returns:
            Dictionary containing email subject and body
        """
        logger.info(f"Generating individual outreach email for: {contact_data.get('name', 'Unknown Contact')}")
        
        # Extract relevant information for personalization
        contact_name = contact_data.get("name", "")
        contact_first_name = contact_name.split()[0] if contact_name else ""
        title = contact_data.get("title", "")
        company_name = company_data.get("name", "")
        
        # Deeper personalization elements
        linkedin_summary = contact_data.get("scraped_linkedin_profile_summary", "")
        recent_activity = contact_data.get("scraped_linkedin_recent_activity", [])
        accomplishments = contact_data.get("scraped_accomplishments_summary", "")
        current_work = contact_data.get("scraped_current_work_summary", "")
        past_work = contact_data.get("scraped_past_work_summary", "")
        contributions = contact_data.get("scraped_online_contributions_summary", "")
        
        # Build the prompt
        prompt = self._build_individual_email_prompt(
            contact_name=contact_name,
            contact_first_name=contact_first_name,
            title=title,
            company_name=company_name,
            linkedin_summary=linkedin_summary,
            recent_activity=recent_activity,
            accomplishments=accomplishments,
            current_work=current_work,
            past_work=past_work,
            contributions=contributions,
            user_info=user_info
        )
        
        # Generate response
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=1000
            )
            
            # Parse the response
            response_text = response.choices[0].message.content
            email_data = self._parse_email_response(response_text)
            
            logger.info(f"Successfully generated individual email for {contact_name}")
            return email_data
            
        except Exception as e:
            logger.error(f"Error generating individual email: {str(e)}")
            return {
                "subject": f"Error generating email for {contact_name}",
                "body": "Error: Unable to generate personalized email. Please try again later.",
                "error": str(e)
            }
    
    def _build_company_email_prompt(self, company_name: str, industry: str, 
                                   website: str, mission: str, recent_activity: str,
                                   technologies: List[str], user_info: Dict[str, str]) -> str:
        """Build prompt for company email generation"""
        return f"""
        Generate a highly personalized, professional email for initial company outreach.
        
        COMPANY INFORMATION:
        - Name: {company_name}
        - Industry: {industry}
        - Website: {website}
        - Mission/Vision: {mission}
        - Recent Activity: {recent_activity}
        - Technologies: {', '.join(technologies)}
        
        SENDER INFORMATION:
        - Name: {user_info.get('name', 'Your Name')}
        - Company: {user_info.get('company', 'Your Company')}
        - Role: {user_info.get('role', 'Your Role')}
        - Offering: {user_info.get('offering', 'Your Offering')}
        
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
        
        RESPOND IN JSON FORMAT:
        {{
            "subject": "email subject line",
            "body": "email body text"
        }}
        """
    
    def _build_individual_email_prompt(self, contact_name: str, contact_first_name: str,
                                     title: str, company_name: str, linkedin_summary: str,
                                     recent_activity: List[str], accomplishments: str,
                                     current_work: str, past_work: str, contributions: str,
                                     user_info: Dict[str, str]) -> str:
        """Build prompt for individual email generation"""
        # Prepare recent activity as a string
        activity_text = "\n".join([f"- {activity}" for activity in recent_activity])
        
        return f"""
        Generate a highly personalized email for individual outreach based on LinkedIn activity and professional background.
        
        CONTACT INFORMATION:
        - Name: {contact_name}
        - First Name: {contact_first_name}
        - Title: {title}
        - Company: {company_name}
        - LinkedIn Summary: {linkedin_summary}
        
        RECENT ACTIVITY:
        {activity_text}
        
        PROFESSIONAL BACKGROUND:
        - Accomplishments: {accomplishments}
        - Current Work: {current_work}
        - Past Work: {past_work}
        - Online Contributions: {contributions}
        
        SENDER INFORMATION:
        - Name: {user_info.get('name', 'Your Name')}
        - Company: {user_info.get('company', 'Your Company')}
        - Role: {user_info.get('role', 'Your Role')}
        - Offering: {user_info.get('offering', 'Your Offering')}
        
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
        
        RESPOND IN JSON FORMAT:
        {{
            "subject": "email subject line",
            "body": "email body text"
        }}
        """
    
    def _parse_email_response(self, response_text: str) -> Dict[str, str]:
        """Parse the JSON response from ChatGPT"""
        try:
            # Try to parse as JSON directly
            cleaned_text = response_text.strip()
            
            # Handle markdown code blocks if present
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:].strip()
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:].strip()
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3].strip()
            
            email_data = json.loads(cleaned_text)
            
            # Ensure required fields are present
            if "subject" not in email_data or "body" not in email_data:
                raise ValueError("Response missing required fields (subject or body)")
                
            return {
                "subject": email_data["subject"],
                "body": email_data["body"]
            }
            
        except json.JSONDecodeError:
            # Fallback: try to extract subject and body using regex
            subject_match = re.search(r'["\']?subject["\']?\s*:\s*["\'](.+?)["\']', response_text, re.DOTALL)
            body_match = re.search(r'["\']?body["\']?\s*:\s*["\'](.+?)["\']', response_text, re.DOTALL)
            
            subject = subject_match.group(1) if subject_match else "No subject generated"
            body = body_match.group(1) if body_match else "No body generated"
            
            return {
                "subject": subject,
                "body": body,
                "parsing_warning": "Had to use fallback parsing method"
            }
        except Exception as e:
            logger.error(f"Error parsing email response: {str(e)}")
            return {
                "subject": "Error generating email",
                "body": "An error occurred while generating the email.",
                "error": str(e)
            }

# Example usage
if __name__ == "__main__":
    # Replace with your actual OpenAI API key
    generator = EmailGenerator(api_key="your_openai_api_key")
    
    # Example company data
    company_data = {
        "name": "TechSolutions Inc",
        "industry": "Software Development",
        "website_url": "https://techsolutions.example.com",
        "mission_vision_offerings_summary": "TechSolutions provides cutting-edge software solutions to streamline business processes.",
        "technologies_used": ["React", "Node.js", "AWS"]
    }
    
    # Example contact data
    contact_data = {
        "name": "Jane Smith",
        "title": "CTO",
        "scraped_linkedin_profile_summary": "Experienced CTO with 15 years in software development.",
        "scraped_linkedin_recent_activity": [
            "Shared article on microservices architecture",
            "Posted about cloud migration challenges"
        ],
        "scraped_current_work_summary": "Leading technology strategy at TechSolutions"
    }
    
    # Sender info
    user_info = {
        "name": "Alex Johnson",
        "company": "AI Solutions Ltd",
        "role": "Head of Partnerships",
        "offering": "AI-powered process automation solutions"
    }
    
    async def test():
        # Generate company email
        company_email = await generator.generate_company_email(company_data, user_info)
        print("COMPANY EMAIL:")
        print(json.dumps(company_email, indent=2))
        
        # Generate individual email
        individual_email = await generator.generate_individual_email(
            contact_data, company_data, user_info
        )
        print("\nINDIVIDUAL EMAIL:")
        print(json.dumps(individual_email, indent=2))
    
    asyncio.run(test())