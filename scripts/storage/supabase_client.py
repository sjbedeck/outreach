#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Supabase Client for Outreach Mate

This module provides a client for interacting with the Supabase database,
handling all database operations for the application.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import logging
import json
import time
from typing import Dict, List, Optional, Any, Union
import uuid
import asyncio
from supabase import create_client, Client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SupabaseClient:
    """
    Supabase client for database operations.
    Handles all interactions with the Supabase database.
    """
    
    def __init__(self, url: str, key: str):
        """
        Initialize the Supabase client.
        
        Args:
            url: Supabase project URL
            key: Supabase API key
        """
        self.url = url
        self.key = key
        self.client = create_client(url, key)
        
        logger.info("Supabase client initialized")
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user data from database"""
        try:
            response = self.client.table('users').select('*').eq('id', user_id).execute()
            data = response.data
            
            if data and len(data) > 0:
                return data[0]
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None
    
    async def get_company(self, company_id: str) -> Optional[Dict[str, Any]]:
        """Get company data from database"""
        try:
            response = self.client.table('companies').select('*').eq('id', company_id).execute()
            data = response.data
            
            if data and len(data) > 0:
                return data[0]
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error getting company: {str(e)}")
            return None
    
    async def get_contact(self, contact_id: str) -> Optional[Dict[str, Any]]:
        """Get contact data from database"""
        try:
            response = self.client.table('contacts').select('*').eq('id', contact_id).execute()
            data = response.data
            
            if data and len(data) > 0:
                return data[0]
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error getting contact: {str(e)}")
            return None
    
    async def get_contacts_by_company(self, company_id: str) -> List[Dict[str, Any]]:
        """Get all contacts for a company"""
        try:
            response = self.client.table('contacts').select('*').eq('company_id', company_id).execute()
            return response.data
                
        except Exception as e:
            logger.error(f"Error getting contacts for company: {str(e)}")
            return []
    
    async def get_campaign(self, campaign_id: str) -> Optional[Dict[str, Any]]:
        """Get campaign data from database"""
        try:
            response = self.client.table('campaigns').select('*').eq('id', campaign_id).execute()
            data = response.data
            
            if data and len(data) > 0:
                return data[0]
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error getting campaign: {str(e)}")
            return None
    
    async def get_campaign_prospects(self, campaign_id: str) -> List[Dict[str, Any]]:
        """Get all prospects for a campaign"""
        try:
            response = self.client.table('campaign_prospects').select('*').eq('campaign_id', campaign_id).execute()
            return response.data
                
        except Exception as e:
            logger.error(f"Error getting campaign prospects: {str(e)}")
            return []
    
    async def get_website_data(self, company_id: str) -> Optional[Dict[str, Any]]:
        """Get website data for a company (from raw_data table)"""
        # This is a placeholder - in a real implementation, you might store
        # the raw website data in a separate table
        try:
            company = await self.get_company(company_id)
            if not company:
                return None
            
            # In this simplified example, we'll just return relevant fields from the company
            return {
                "domain": company.get("initial_website_url", "").replace('https://', '').replace('http://', '').split('/')[0],
                "emails": ["info@" + company.get("initial_website_url", "").replace('https://', '').replace('http://', '').split('/')[0]],
                "scraped_website_text_snippet": company.get("scraped_website_text_snippet")
            }
                
        except Exception as e:
            logger.error(f"Error getting website data: {str(e)}")
            return None
    
    async def insert_company(self, data: Dict[str, Any]) -> Optional[str]:
        """Insert a new company record"""
        try:
            # Ensure ID is present
            if "id" not in data:
                data["id"] = str(uuid.uuid4())
            
            response = self.client.table('companies').insert(data).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Inserted company: {data.get('company_name')}")
                return data["id"]
            else:
                logger.warning("Company insert returned no data")
                return None
                
        except Exception as e:
            logger.error(f"Error inserting company: {str(e)}")
            return None
    
    async def update_company(self, company_id: str, data: Dict[str, Any]) -> bool:
        """Update a company record"""
        try:
            response = self.client.table('companies').update(data).eq('id', company_id).execute()
            
            success = response.data is not None and len(response.data) > 0
            logger.info(f"Updated company {company_id}: {success}")
            return success
                
        except Exception as e:
            logger.error(f"Error updating company: {str(e)}")
            return False
    
    async def insert_contact(self, data: Dict[str, Any]) -> Optional[str]:
        """Insert a new contact record"""
        try:
            # Ensure ID is present
            if "id" not in data:
                data["id"] = str(uuid.uuid4())
            
            response = self.client.table('contacts').insert(data).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Inserted contact: {data.get('name')}")
                return data["id"]
            else:
                logger.warning("Contact insert returned no data")
                return None
                
        except Exception as e:
            logger.error(f"Error inserting contact: {str(e)}")
            return None
    
    async def update_contact(self, contact_id: str, data: Dict[str, Any]) -> bool:
        """Update a contact record"""
        try:
            response = self.client.table('contacts').update(data).eq('id', contact_id).execute()
            
            success = response.data is not None and len(response.data) > 0
            logger.info(f"Updated contact {contact_id}: {success}")
            return success
                
        except Exception as e:
            logger.error(f"Error updating contact: {str(e)}")
            return False
    
    async def insert_email_log(self, data: Dict[str, Any]) -> Optional[str]:
        """Insert a new email log record"""
        try:
            # Ensure ID is present
            if "id" not in data:
                data["id"] = str(uuid.uuid4())
            
            response = self.client.table('email_logs').insert(data).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Inserted email log: {data.get('email_type')} to {data.get('recipient_email')}")
                return data["id"]
            else:
                logger.warning("Email log insert returned no data")
                return None
                
        except Exception as e:
            logger.error(f"Error inserting email log: {str(e)}")
            return None
    
    async def update_campaign(self, campaign_id: str, data: Dict[str, Any]) -> bool:
        """Update a campaign record"""
        try:
            response = self.client.table('campaigns').update(data).eq('id', campaign_id).execute()
            
            success = response.data is not None and len(response.data) > 0
            logger.info(f"Updated campaign {campaign_id}: {success}")
            return success
                
        except Exception as e:
            logger.error(f"Error updating campaign: {str(e)}")
            return False
    
    async def update_campaign_prospect(self, campaign_id: str, company_id: str, data: Dict[str, Any]) -> bool:
        """Update a campaign_prospects record"""
        try:
            response = self.client.table('campaign_prospects').update(data) \
                .eq('campaign_id', campaign_id) \
                .eq('company_id', company_id) \
                .execute()
            
            success = response.data is not None and len(response.data) > 0
            logger.info(f"Updated campaign_prospect for campaign {campaign_id}, company {company_id}: {success}")
            return success
                
        except Exception as e:
            logger.error(f"Error updating campaign_prospect: {str(e)}")
            return False
    
    async def get_companies_by_user(self, user_id: str, 
                                  status: Optional[str] = None, 
                                  limit: int = 20, 
                                  offset: int = 0) -> List[Dict[str, Any]]:
        """Get companies for a user with optional filtering"""
        try:
            query = self.client.table('companies').select('*').eq('user_id', user_id)
            
            if status:
                query = query.eq('campaign_status', status)
            
            response = query.order('created_at', desc=True).limit(limit).offset(offset).execute()
            return response.data
                
        except Exception as e:
            logger.error(f"Error getting companies for user: {str(e)}")
            return []
    
    async def get_campaigns_by_user(self, user_id: str, 
                                  status: Optional[str] = None,
                                  limit: int = 20,
                                  offset: int = 0) -> List[Dict[str, Any]]:
        """Get campaigns for a user with optional filtering"""
        try:
            query = self.client.table('campaigns').select('*').eq('user_id', user_id)
            
            if status:
                query = query.eq('status', status)
            
            response = query.order('created_at', desc=True).limit(limit).offset(offset).execute()
            return response.data
                
        except Exception as e:
            logger.error(f"Error getting campaigns for user: {str(e)}")
            return []
    
    async def get_email_logs_by_company(self, company_id: str, 
                                      limit: int = 20,
                                      offset: int = 0) -> List[Dict[str, Any]]:
        """Get email logs for a company"""
        try:
            response = self.client.table('email_logs').select('*') \
                .eq('company_id', company_id) \
                .order('sent_at', desc=True) \
                .limit(limit) \
                .offset(offset) \
                .execute()
                
            return response.data
                
        except Exception as e:
            logger.error(f"Error getting email logs for company: {str(e)}")
            return []
    
    async def get_email_logs_by_contact(self, contact_id: str,
                                      limit: int = 20,
                                      offset: int = 0) -> List[Dict[str, Any]]:
        """Get email logs for a contact"""
        try:
            response = self.client.table('email_logs').select('*') \
                .eq('contact_id', contact_id) \
                .order('sent_at', desc=True) \
                .limit(limit) \
                .offset(offset) \
                .execute()
                
            return response.data
                
        except Exception as e:
            logger.error(f"Error getting email logs for contact: {str(e)}")
            return []
    
    async def insert_campaign(self, data: Dict[str, Any]) -> Optional[str]:
        """Insert a new campaign record"""
        try:
            # Ensure ID is present
            if "id" not in data:
                data["id"] = str(uuid.uuid4())
            
            response = self.client.table('campaigns').insert(data).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Inserted campaign: {data.get('name')}")
                return data["id"]
            else:
                logger.warning("Campaign insert returned no data")
                return None
                
        except Exception as e:
            logger.error(f"Error inserting campaign: {str(e)}")
            return None
    
    async def add_companies_to_campaign(self, campaign_id: str, 
                                      company_ids: List[str]) -> Dict[str, Any]:
        """Add companies to a campaign"""
        try:
            records = []
            for company_id in company_ids:
                records.append({
                    "campaign_id": campaign_id,
                    "company_id": company_id,
                    "status": "pending"
                })
            
            if not records:
                return {"success": False, "message": "No companies to add"}
            
            response = self.client.table('campaign_prospects').insert(records).execute()
            
            success = response.data is not None and len(response.data) > 0
            return {
                "success": success,
                "added_count": len(response.data) if success else 0,
                "campaign_id": campaign_id
            }
                
        except Exception as e:
            logger.error(f"Error adding companies to campaign: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def get_api_tokens(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all API tokens for a user"""
        try:
            response = self.client.table('api_tokens').select('*').eq('user_id', user_id).execute()
            return response.data
                
        except Exception as e:
            logger.error(f"Error getting API tokens: {str(e)}")
            return []
    
    async def insert_api_token(self, data: Dict[str, Any]) -> Optional[str]:
        """Insert a new API token record"""
        try:
            # Ensure ID is present
            if "id" not in data:
                data["id"] = str(uuid.uuid4())
            
            response = self.client.table('api_tokens').insert(data).execute()
            
            if response.data and len(response.data) > 0:
                logger.info(f"Inserted API token: {data.get('provider_name')}")
                return data["id"]
            else:
                logger.warning("API token insert returned no data")
                return None
                
        except Exception as e:
            logger.error(f"Error inserting API token: {str(e)}")
            return None
    
    async def update_api_token(self, token_id: str, data: Dict[str, Any]) -> bool:
        """Update an API token record"""
        try:
            response = self.client.table('api_tokens').update(data).eq('id', token_id).execute()
            
            success = response.data is not None and len(response.data) > 0
            logger.info(f"Updated API token {token_id}: {success}")
            return success
                
        except Exception as e:
            logger.error(f"Error updating API token: {str(e)}")
            return False

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Supabase client')
    parser.add_argument('--url', required=True, help='Supabase URL')
    parser.add_argument('--key', required=True, help='Supabase API key')
    parser.add_argument('--action', choices=['test-connection', 'get-user', 'get-company'],
                       required=True, help='Action to perform')
    parser.add_argument('--id', help='ID for get operations')
    
    args = parser.parse_args()
    
    async def main():
        client = SupabaseClient(url=args.url, key=args.key)
        
        if args.action == 'test-connection':
            try:
                # Simple test query
                response = client.client.table('users').select('count', count='exact').execute()
                count = response.count
                print(f"Connection successful. User count: {count}")
            except Exception as e:
                print(f"Connection failed: {str(e)}")
                
        elif args.action == 'get-user':
            if not args.id:
                print("Error: --id required for get-user action")
                return
                
            user = await client.get_user(args.id)
            print(json.dumps(user, indent=2) if user else "User not found")
            
        elif args.action == 'get-company':
            if not args.id:
                print("Error: --id required for get-company action")
                return
                
            company = await client.get_company(args.id)
            print(json.dumps(company, indent=2) if company else "Company not found")
    
    asyncio.run(main())