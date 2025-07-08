#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Gemini Data Transformation Module for Outreach Mate

This module uses the Google Gemini API to analyze, clean, and format raw
scraped data into a consistent, structured format for AI consumption
and database storage.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import json
import logging
import time
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GeminiDataTransformer:
    """
    Gemini-powered data transformation for raw scraped data.
    Processes heterogeneous input into a standardized JSON structure.
    """
    
    def __init__(self, api_key: str, model: str = "gemini-pro"):
        """
        Initialize the Gemini Data Transformer.
        
        Args:
            api_key: Google Gemini API key
            model: Gemini model name to use
        """
        self.api_key = api_key
        self.model_name = model
        
        # Configure Gemini
        genai.configure(api_key=self.api_key)
        
        # Set up safety settings
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE
        }
        
        # Initialize the model
        self.model = genai.GenerativeModel(
            model_name=self.model_name,
            safety_settings=self.safety_settings,
            generation_config={
                "temperature": 0.2,
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 8192,
            }
        )
    
    async def process_scraped_data(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process raw scraped data into a standardized format using Gemini.
        
        Args:
            raw_data: Dictionary containing all raw scraped data
                Expected structure:
                {
                    "website_data": {...},  # From website crawler
                    "linkedin_data": {...},  # From LinkedIn company scraper
                    "apollo_data": {...},    # From Apollo.io API
                    "individual_profiles": [  # From LinkedIn profile scraper
                        {...},  # Profile 1
                        {...}   # Profile 2
                    ],
                    "web_search_data": [...]  # Optional additional web search results
                }
            
        Returns:
            Processed and structured data in standardized format
        """
        logger.info("Starting Gemini data transformation process")
        
        try:
            # Prepare the input for Gemini
            gemini_input = self._prepare_gemini_input(raw_data)
            
            # Build the prompt for Gemini
            prompt = self._build_transformation_prompt(gemini_input)
            
            # Generate response from Gemini
            response = await self._generate_response(prompt)
            
            # Parse and validate the response
            structured_data = await self._parse_and_validate_response(response)
            
            # Calculate data quality score
            quality_score = self._calculate_data_quality_score(structured_data)
            structured_data["data_quality_score"] = quality_score
            
            logger.info("Gemini data transformation completed successfully")
            logger.info(f"Data quality score: {quality_score}")
            
            return structured_data
            
        except Exception as e:
            logger.error(f"Error in Gemini data transformation: {str(e)}")
            raise
    
    def _prepare_gemini_input(self, raw_data: Dict[str, Any]) -> str:
        """Format raw data into a structured text input for Gemini"""
        sections = []
        
        # Website data section
        if raw_data.get("website_data"):
            sections.append(f"## WEBSITE DATA:\n{json.dumps(raw_data['website_data'], indent=2)}")
        
        # LinkedIn company data section
        if raw_data.get("linkedin_data"):
            sections.append(f"## LINKEDIN COMPANY DATA:\n{json.dumps(raw_data['linkedin_data'], indent=2)}")
        
        # Apollo.io data section
        if raw_data.get("apollo_data"):
            sections.append(f"## APOLLO.IO DATA:\n{json.dumps(raw_data['apollo_data'], indent=2)}")
        
        # Individual LinkedIn profiles section
        if raw_data.get("individual_profiles"):
            profiles_json = json.dumps(raw_data["individual_profiles"], indent=2)
            sections.append(f"## INDIVIDUAL LINKEDIN PROFILES:\n{profiles_json}")
        
        # Additional web search data section (if available)
        if raw_data.get("web_search_data"):
            sections.append(f"## WEB SEARCH DATA:\n{json.dumps(raw_data['web_search_data'], indent=2)}")
        
        # Combine all sections with clear separation
        return "\n\n".join(sections)
    
    def _build_transformation_prompt(self, input_text: str) -> str:
        """Build the complete prompt for Gemini"""
        prompt = f"""
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
            "id": "string (generate unique ID)",
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
                "headquarters": "string or null"
            }},
            "contacts": [
                {{
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
                    "scraped_online_contributions_summary": "string or null"
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
        - Set campaign_status to "Data Ready" if all required fields are populated
        
        RESPOND WITH ONLY THE JSON OBJECT - NO ADDITIONAL TEXT OR FORMATTING.
        """
        
        return prompt
    
    async def _generate_response(self, prompt: str) -> str:
        """Generate a response from Gemini API"""
        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            raise
    
    async def _parse_and_validate_response(self, response_text: str) -> Dict[str, Any]:
        """Parse and validate the JSON response from Gemini"""
        try:
            # Clean response text if needed (removing markdown code blocks, etc.)
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:].strip()
            if cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:].strip()
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3].strip()
            
            # Parse JSON
            structured_data = json.loads(cleaned_text)
            
            # Validate required fields
            self._validate_structured_data(structured_data)
            
            # Add processing metadata
            structured_data["enrichment_timestamp"] = int(time.time())
            if "campaign_status" not in structured_data:
                structured_data["campaign_status"] = "Data Ready"
            
            return structured_data
            
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {str(e)}")
            logger.error(f"Raw response: {response_text}")
            raise ValueError(f"Gemini did not return valid JSON: {str(e)}")
            
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            raise
    
    def _validate_structured_data(self, data: Dict[str, Any]) -> None:
        """Validate the structure of the transformed data"""
        # Required top-level keys
        required_keys = ["company", "contacts"]
        for key in required_keys:
            if key not in data:
                raise ValueError(f"Missing required field: {key}")
        
        # Validate company structure
        if not isinstance(data["company"], dict):
            raise ValueError("Company field must be a dictionary")
        
        company_required_fields = ["name", "website_url", "industry"]
        for field in company_required_fields:
            if field not in data["company"]:
                raise ValueError(f"Missing required company field: {field}")
        
        # Validate contacts structure
        if not isinstance(data["contacts"], list):
            raise ValueError("Contacts field must be a list")
            
        if len(data["contacts"]) == 0:
            raise ValueError("Contacts list cannot be empty")
            
        for contact in data["contacts"]:
            if not isinstance(contact, dict):
                raise ValueError("Each contact must be a dictionary")
                
            contact_required_fields = ["name", "email_primary"]
            for field in contact_required_fields:
                if field not in contact:
                    raise ValueError(f"Missing required contact field: {field}")
    
    def _calculate_data_quality_score(self, data: Dict[str, Any]) -> int:
        """Calculate a data quality score based on completeness and richness"""
        score = 0
        max_score = 100
        
        # Company data scoring (50 points)
        company = data.get("company", {})
        
        company_fields = [
            "name", "website_url", "linkedin_url", "industry", 
            "revenue_range", "employee_count_range", "technologies_used",
            "mission_vision_offerings_summary", "recent_company_activity_summary"
        ]
        
        company_field_weights = {
            "name": 5,
            "website_url": 5,
            "linkedin_url": 5,
            "industry": 5,
            "revenue_range": 3,
            "employee_count_range": 3,
            "technologies_used": 4,
            "mission_vision_offerings_summary": 10,
            "recent_company_activity_summary": 10,
            "contact_form_url": 2,
            "description": 2,
            "founded_year": 1,
            "headquarters": 1
        }
        
        company_score = 0
        max_company_score = sum(company_field_weights.values())
        
        for field, weight in company_field_weights.items():
            # Check if field exists and is not empty
            if field in company and company[field]:
                # For array fields, check if they have content
                if isinstance(company[field], list):
                    if len(company[field]) > 0:
                        company_score += weight
                # For text fields, check if they have meaningful content
                elif isinstance(company[field], str):
                    if len(company[field]) > 10:  # Arbitrary threshold for meaningful content
                        company_score += weight
                else:
                    company_score += weight
        
        # Normalize company score to 50 points
        normalized_company_score = (company_score / max_company_score) * 50
        
        # Contacts data scoring (50 points)
        contacts = data.get("contacts", [])
        contacts_score = 0
        max_contacts_score = 50
        
        if contacts:
            per_contact_max = max_contacts_score / min(len(contacts), 5)  # Cap at 5 contacts
            
            for i, contact in enumerate(contacts):
                if i >= 5:  # Only score up to 5 contacts
                    break
                    
                contact_field_weights = {
                    "name": 2,
                    "title": 2,
                    "email_primary": 3,
                    "phone_numbers": 2,
                    "social_profiles": 2,
                    "scraped_linkedin_profile_summary": 3,
                    "scraped_linkedin_recent_activity": 3,
                    "scraped_accomplishments_summary": 2,
                    "scraped_past_work_summary": 2,
                    "scraped_current_work_summary": 2,
                    "scraped_online_contributions_summary": 2
                }
                
                contact_score = 0
                max_individual_score = sum(contact_field_weights.values())
                
                for field, weight in contact_field_weights.items():
                    # Check if field exists and is not empty
                    if field in contact and contact[field]:
                        # For array and dict fields
                        if isinstance(contact[field], (list, dict)):
                            if isinstance(contact[field], list) and len(contact[field]) > 0:
                                contact_score += weight
                            elif isinstance(contact[field], dict) and len(contact[field]) > 0:
                                contact_score += weight
                        # For text fields
                        elif isinstance(contact[field], str):
                            if len(contact[field]) > 10:  # Arbitrary threshold for meaningful content
                                contact_score += weight
                        else:
                            contact_score += weight
                
                # Normalize individual contact score
                contacts_score += (contact_score / max_individual_score) * per_contact_max
        
        # Calculate final score
        final_score = normalized_company_score + contacts_score
        
        # Ensure the score is within bounds
        final_score = max(0, min(round(final_score), max_score))
        
        return final_score

# Example usage
if __name__ == "__main__":
    # Replace with your actual Gemini API key
    transformer = GeminiDataTransformer(api_key="your_gemini_api_key")
    
    # Example raw data (in real usage, this would come from web scraping and Apollo.io)
    sample_raw_data = {
        "website_data": {
            "scraped_url": "https://example.com",
            "scraped_website_text_snippet": "Example company provides leadership training..."
        },
        "linkedin_data": {
            "name": "Example Company",
            "industry": "Professional Training & Coaching"
        },
        "apollo_data": {
            "company": {
                "name": "Example Inc.",
                "domain": "example.com"
            },
            "contacts": [
                {
                    "name": "John Smith",
                    "title": "CEO"
                }
            ]
        }
    }
    
    import asyncio
    
    # Process the data
    result = asyncio.run(transformer.process_scraped_data(sample_raw_data))
    
    # Print the result
    print(json.dumps(result, indent=2))