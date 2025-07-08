#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Data Acquisition Pipeline for Outreach Mate

This module orchestrates the entire data acquisition process:
1. Website scraping
2. Apollo.io enrichment
3. LinkedIn profile scraping
4. Gemini data transformation
5. Database storage

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import asyncio
import logging
import time
import os
import json
from typing import Dict, List, Optional, Any, Union, Tuple
import uuid
import aiohttp
import traceback
import sys

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our modules
from data_acquisition.website_crawler import WebsiteCrawler
from data_acquisition.linkedin_scraper import LinkedInScraper, LinkedInCredentials
from data_acquisition.apollo_integration import ApolloIntegration
from ai.gemini_transformer import GeminiDataTransformer

# Import database client
from storage.supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DataPipeline:
    """
    Orchestrates the complete data acquisition and transformation process.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the data pipeline.
        
        Args:
            config: Configuration dictionary with API keys and credentials
        """
        self.config = config
        self.website_crawler = WebsiteCrawler()
        
        # Initialize LinkedIn scraper if credentials are provided
        if config.get("linkedin_credentials"):
            self.linkedin_scraper = LinkedInScraper(
                credentials=LinkedInCredentials(
                    username=config["linkedin_credentials"]["username"],
                    password=config["linkedin_credentials"]["password"]
                ),
                headless=config.get("headless", True)
            )
        else:
            self.linkedin_scraper = None
            logger.warning("LinkedIn scraper not initialized due to missing credentials")
        
        # Initialize Apollo integration if API key is provided
        if config.get("apollo_api_key"):
            self.apollo_integration = ApolloIntegration(
                api_key=config["apollo_api_key"]
            )
        else:
            self.apollo_integration = None
            logger.warning("Apollo integration not initialized due to missing API key")
        
        # Initialize Gemini transformer if API key is provided
        if config.get("gemini_api_key"):
            self.gemini_transformer = GeminiDataTransformer(
                api_key=config["gemini_api_key"]
            )
        else:
            self.gemini_transformer = None
            logger.warning("Gemini transformer not initialized due to missing API key")
        
        # Initialize database client if connection string is provided
        if config.get("supabase_url") and config.get("supabase_key"):
            self.db_client = SupabaseClient(
                url=config["supabase_url"],
                key=config["supabase_key"]
            )
        else:
            self.db_client = None
            logger.warning("Database client not initialized due to missing connection info")
    
    async def process_company(self, user_id: str, company_name: str, website_url: Optional[str] = None,
                             linkedin_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a single company through the entire pipeline.
        
        Args:
            user_id: User ID for database records
            company_name: Company name
            website_url: Optional company website URL
            linkedin_url: Optional LinkedIn company URL
            
        Returns:
            Processed company data
        """
        start_time = time.time()
        logger.info(f"Starting data pipeline for company: {company_name}")
        
        # Generate a unique ID for this prospect
        prospect_id = str(uuid.uuid4())
        
        # Create initial database entry (if DB is available)
        if self.db_client:
            initial_data = {
                "id": prospect_id,
                "user_id": user_id,
                "company_name": company_name,
                "initial_website_url": website_url,
                "linkedin_company_url": linkedin_url,
                "campaign_status": "Processing"
            }
            
            await self.db_client.insert_company(initial_data)
            logger.info(f"Created initial database entry for company: {company_name}")
        
        # Container for all raw data
        raw_data = {
            "company_name": company_name,
            "website_url": website_url,
            "linkedin_url": linkedin_url
        }
        
        # Step 1: Website Crawling (if URL provided)
        if website_url:
            try:
                logger.info(f"Starting website crawling for: {website_url}")
                website_data = self.website_crawler.scrape_website(website_url)
                raw_data["website_data"] = website_data
                logger.info(f"Website crawling completed for: {website_url}")
                
                # Update database with website data
                if self.db_client:
                    await self.db_client.update_company(prospect_id, {
                        "scraped_website_text_snippet": website_data.get("scraped_website_text_snippet"),
                        "scraped_website_contact_form_url": website_data.get("contact_form_url")
                    })
                
            except Exception as e:
                logger.error(f"Error crawling website {website_url}: {str(e)}")
                raw_data["website_data"] = {"error": str(e)}
        
        # Step 2: Apollo.io Enrichment
        if self.apollo_integration:
            try:
                logger.info(f"Starting Apollo.io enrichment for: {company_name}")
                
                # Determine which parameter to use
                domain = website_url.replace('https://', '').replace('http://', '').split('/')[0] if website_url else None
                
                apollo_data = await self.apollo_integration.enrich_company_and_contacts(
                    domain=domain,
                    name=company_name if not domain else None,
                    max_contacts=5
                )
                
                raw_data["apollo_data"] = apollo_data
                logger.info(f"Apollo.io enrichment completed for: {company_name}")
                logger.info(f"Found {len(apollo_data.get('contacts', []))} contacts")
                
                # Update database with Apollo data
                if self.db_client:
                    # Extract key company data
                    company = apollo_data.get("company", {})
                    update_data = {
                        "industry": company.get("industry"),
                        "employee_count_range": company.get("estimated_num_employees"),
                        "revenue_range": company.get("estimated_annual_revenue"),
                        "technologies_used": company.get("technologies", [])
                    }
                    
                    await self.db_client.update_company(prospect_id, update_data)
                    
                    # Insert contacts
                    contacts = apollo_data.get("contacts", [])
                    for contact in contacts:
                        contact_data = {
                            "company_id": prospect_id,
                            "user_id": user_id,
                            "apollo_contact_id": contact.get("id"),
                            "name": contact.get("name"),
                            "title": contact.get("title"),
                            "email_primary": contact.get("email"),
                            "phone_numbers": contact.get("phone_numbers", []),
                            "linkedin_profile_url": contact.get("linkedin_url")
                        }
                        
                        await self.db_client.insert_contact(contact_data)
                
            except Exception as e:
                logger.error(f"Error enriching with Apollo.io for {company_name}: {str(e)}")
                raw_data["apollo_data"] = {"error": str(e)}
        
        # Step 3: LinkedIn Company Scraping (if URL provided)
        if self.linkedin_scraper and linkedin_url:
            try:
                logger.info(f"Starting LinkedIn company scraping for: {linkedin_url}")
                linkedin_data = await asyncio.to_thread(
                    self.linkedin_scraper.scrape_company, linkedin_url
                )
                
                if linkedin_data:
                    raw_data["linkedin_data"] = linkedin_data.__dict__
                    logger.info(f"LinkedIn company scraping completed for: {linkedin_url}")
                else:
                    logger.warning(f"No LinkedIn company data returned for: {linkedin_url}")
            
            except Exception as e:
                logger.error(f"Error scraping LinkedIn company {linkedin_url}: {str(e)}")
                raw_data["linkedin_data"] = {"error": str(e)}
        
        # Step 4: LinkedIn Individual Profile Scraping (for contacts from Apollo)
        if self.linkedin_scraper and "apollo_data" in raw_data:
            raw_data["individual_profiles"] = []
            
            contacts = raw_data.get("apollo_data", {}).get("contacts", [])
            for contact in contacts:
                linkedin_url = contact.get("linkedin_url")
                if not linkedin_url:
                    continue
                
                try:
                    logger.info(f"Starting LinkedIn profile scraping for: {linkedin_url}")
                    profile_data = await asyncio.to_thread(
                        self.linkedin_scraper.scrape_profile, linkedin_url
                    )
                    
                    if profile_data:
                        raw_data["individual_profiles"].append(profile_data.__dict__)
                        logger.info(f"LinkedIn profile scraping completed for: {linkedin_url}")
                        
                        # Find the corresponding contact ID in database
                        if self.db_client:
                            # Find contact by LinkedIn URL
                            db_contacts = await self.db_client.get_contacts_by_company(prospect_id)
                            
                            for db_contact in db_contacts:
                                if db_contact.get("linkedin_profile_url") == linkedin_url:
                                    contact_id = db_contact.get("id")
                                    
                                    # Update contact with LinkedIn data
                                    update_data = {
                                        "scraped_linkedin_profile_summary": profile_data.about,
                                        "scraped_current_work_summary": self._get_current_work_summary(profile_data),
                                        "scraped_past_work_summary": self._get_past_work_summary(profile_data),
                                        "scraped_linkedin_recent_activity": [
                                            a.content for a in profile_data.recent_activity
                                        ] if profile_data.recent_activity else [],
                                        "scraped_accomplishments_summary": self._get_accomplishments_summary(profile_data)
                                    }
                                    
                                    await self.db_client.update_contact(contact_id, update_data)
                                    break
                    else:
                        logger.warning(f"No LinkedIn profile data returned for: {linkedin_url}")
                
                except Exception as e:
                    logger.error(f"Error scraping LinkedIn profile {linkedin_url}: {str(e)}")
                    raw_data["individual_profiles"].append({"error": str(e), "url": linkedin_url})
        
        # Step 5: Gemini Data Transformation
        if self.gemini_transformer:
            try:
                logger.info(f"Starting Gemini data transformation for: {company_name}")
                
                # Process data with Gemini
                structured_data = await self.gemini_transformer.process_scraped_data(raw_data)
                
                logger.info(f"Gemini data transformation completed for: {company_name}")
                
                # Update database with transformed data
                if self.db_client:
                    # Extract and update company data
                    company_data = structured_data.get("company", {})
                    update_data = {
                        "company_name": company_data.get("name", company_name),
                        "industry": company_data.get("industry"),
                        "revenue_range": company_data.get("revenue_range"),
                        "employee_count_range": company_data.get("employee_count_range"),
                        "technologies_used": company_data.get("technologies_used"),
                        "mission_vision_offerings_summary": company_data.get("mission_vision_offerings_summary"),
                        "recent_company_activity_summary": company_data.get("recent_company_activity_summary"),
                        "campaign_status": "Data Ready",
                        "data_quality_score": structured_data.get("data_quality_score", 0)
                    }
                    
                    await self.db_client.update_company(prospect_id, update_data)
                    
                    # Update contacts data
                    contacts = structured_data.get("contacts", [])
                    db_contacts = await self.db_client.get_contacts_by_company(prospect_id)
                    
                    for transformed_contact in contacts:
                        # Try to match to an existing contact
                        matched = False
                        
                        for db_contact in db_contacts:
                            # Match by email or name
                            if (transformed_contact.get("email_primary") == db_contact.get("email_primary") or 
                                transformed_contact.get("name") == db_contact.get("name")):
                                
                                # Update the existing contact
                                contact_id = db_contact.get("id")
                                update_data = {
                                    "scraped_linkedin_profile_summary": transformed_contact.get("scraped_linkedin_profile_summary"),
                                    "scraped_linkedin_recent_activity": transformed_contact.get("scraped_linkedin_recent_activity"),
                                    "scraped_accomplishments_summary": transformed_contact.get("scraped_accomplishments_summary"),
                                    "scraped_past_work_summary": transformed_contact.get("scraped_past_work_summary"),
                                    "scraped_current_work_summary": transformed_contact.get("scraped_current_work_summary"),
                                    "scraped_online_contributions_summary": transformed_contact.get("scraped_online_contributions_summary"),
                                    "social_profiles": transformed_contact.get("social_profiles")
                                }
                                
                                await self.db_client.update_contact(contact_id, update_data)
                                matched = True
                                break
                        
                        # If no match found, insert as a new contact
                        if not matched:
                            transformed_contact["company_id"] = prospect_id
                            transformed_contact["user_id"] = user_id
                            await self.db_client.insert_contact(transformed_contact)
                
                return {
                    "success": True,
                    "prospect_id": prospect_id,
                    "company_name": company_name,
                    "data_quality_score": structured_data.get("data_quality_score", 0),
                    "contact_count": len(structured_data.get("contacts", [])),
                    "processing_time_seconds": round(time.time() - start_time, 2)
                }
            
            except Exception as e:
                logger.error(f"Error in Gemini transformation for {company_name}: {str(e)}")
                traceback.print_exc()
                
                # Update database with error status
                if self.db_client:
                    await self.db_client.update_company(prospect_id, {
                        "campaign_status": "Error"
                    })
                
                return {
                    "success": False,
                    "prospect_id": prospect_id,
                    "company_name": company_name,
                    "error": str(e),
                    "processing_time_seconds": round(time.time() - start_time, 2)
                }
        else:
            logger.warning("Gemini transformer not initialized, data transformation skipped")
            
            # Update database with partial data status
            if self.db_client:
                await self.db_client.update_company(prospect_id, {
                    "campaign_status": "Partial Data"
                })
            
            return {
                "success": True,
                "prospect_id": prospect_id,
                "company_name": company_name,
                "warning": "Gemini transformer not initialized, data transformation skipped",
                "processing_time_seconds": round(time.time() - start_time, 2)
            }
    
    async def process_companies_from_csv(self, user_id: str, csv_data: str) -> List[Dict[str, Any]]:
        """
        Process multiple companies from CSV data.
        
        Args:
            user_id: User ID for database records
            csv_data: CSV data with company information
            
        Returns:
            List of processing results
        """
        logger.info("Starting processing of companies from CSV")
        
        # Parse CSV data
        lines = csv_data.strip().split('\n')
        if not lines:
            return []
        
        # Check header
        header = lines[0].strip().split(',')
        required_columns = ['Company Name']
        optional_columns = ['Website URL', 'LinkedIn URL']
        
        # Validate header
        if not all(col in header for col in required_columns):
            logger.error(f"CSV missing required columns: {required_columns}")
            return [{"success": False, "error": f"CSV missing required columns: {required_columns}"}]
        
        # Find column indices
        name_idx = header.index('Company Name')
        website_idx = header.index('Website URL') if 'Website URL' in header else None
        linkedin_idx = header.index('LinkedIn URL') if 'LinkedIn URL' in header else None
        
        # Process each company
        results = []
        for i, line in enumerate(lines[1:]):  # Skip header
            try:
                values = line.strip().split(',')
                
                # Skip empty lines
                if not values or len(values) < len(header) or not values[name_idx].strip():
                    continue
                
                company_name = values[name_idx].strip()
                website_url = values[website_idx].strip() if website_idx is not None and len(values) > website_idx else None
                linkedin_url = values[linkedin_idx].strip() if linkedin_idx is not None and len(values) > linkedin_idx else None
                
                # Process the company
                result = await self.process_company(
                    user_id=user_id,
                    company_name=company_name,
                    website_url=website_url,
                    linkedin_url=linkedin_url
                )
                
                results.append(result)
                
            except Exception as e:
                logger.error(f"Error processing line {i+2}: {str(e)}")
                results.append({
                    "success": False,
                    "line": i+2,
                    "error": str(e)
                })
        
        logger.info(f"Completed processing {len(results)} companies from CSV")
        return results
    
    async def close(self) -> None:
        """Clean up resources"""
        if self.linkedin_scraper:
            self.linkedin_scraper.close()
    
    def _get_current_work_summary(self, profile_data: Any) -> str:
        """Extract current work summary from profile data"""
        if not profile_data.experience:
            return ""
            
        # Assume first experience item is current
        current_exp = profile_data.experience[0] if profile_data.experience else {}
        return f"{current_exp.get('role', '')} at {current_exp.get('company', '')}. {profile_data.about or ''}"
    
    def _get_past_work_summary(self, profile_data: Any) -> str:
        """Extract past work summary from profile data"""
        if not profile_data.experience or len(profile_data.experience) <= 1:
            return ""
            
        # Get past experience (skip the first/current one)
        past_exp = profile_data.experience[1:3]  # Get 2nd and 3rd experiences
        return "; ".join([f"{exp.get('role', '')} at {exp.get('company', '')}" for exp in past_exp])
    
    def _get_accomplishments_summary(self, profile_data: Any) -> str:
        """Extract accomplishments summary from profile data"""
        if not profile_data.accomplishments:
            return ""
            
        summary_parts = []
        for accomp in profile_data.accomplishments:
            category = accomp.get("category", "")
            items = accomp.get("items", [])
            if items:
                summary = f"{category}: {', '.join(items[:3])}"
                summary_parts.append(summary)
        
        return ". ".join(summary_parts)

# Example configuration
sample_config = {
    "apollo_api_key": "your_apollo_api_key",
    "gemini_api_key": "your_gemini_api_key",
    "linkedin_credentials": {
        "username": "your_linkedin_email",
        "password": "your_linkedin_password"
    },
    "supabase_url": "your_supabase_url",
    "supabase_key": "your_supabase_key",
    "headless": True
}

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run data acquisition pipeline')
    parser.add_argument('--config', required=True, help='Path to config JSON file')
    parser.add_argument('--csv', help='Path to CSV file with companies')
    parser.add_argument('--company', help='Single company name to process')
    parser.add_argument('--website', help='Company website URL')
    parser.add_argument('--linkedin', help='Company LinkedIn URL')
    parser.add_argument('--user-id', required=True, help='User ID for database records')
    
    args = parser.parse_args()
    
    async def main():
        # Load configuration
        with open(args.config, 'r') as f:
            config = json.load(f)
        
        # Initialize pipeline
        pipeline = DataPipeline(config)
        
        try:
            if args.csv:
                # Process companies from CSV file
                with open(args.csv, 'r') as f:
                    csv_data = f.read()
                
                results = await pipeline.process_companies_from_csv(args.user_id, csv_data)
                print(json.dumps(results, indent=2))
                
            elif args.company:
                # Process a single company
                result = await pipeline.process_company(
                    user_id=args.user_id,
                    company_name=args.company,
                    website_url=args.website,
                    linkedin_url=args.linkedin
                )
                
                print(json.dumps(result, indent=2))
                
            else:
                print("Either --csv or --company must be provided")
                
        finally:
            await pipeline.close()
    
    asyncio.run(main())