#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Email Orchestration Module for Outreach Mate

This module handles the multi-touchpoint email strategy,
coordinating between AI generation and email sending.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import asyncio
import logging
import time
import json
from typing import Dict, List, Optional, Any, Union, Tuple
import uuid
import sys
import os
from datetime import datetime, timedelta

# Add the parent directory to the path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import our modules
from ai.email_generator import EmailGenerator
from ai.email_sender import EmailSender
from storage.supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmailOrchestrator:
    """
    Orchestrates the multi-touchpoint email strategy, coordinating
    between email generation and sending.
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the email orchestrator.
        
        Args:
            config: Configuration dictionary with API keys and credentials
        """
        self.config = config
        
        # Initialize Email Generator if OpenAI API key is provided
        if config.get("openai_api_key"):
            self.email_generator = EmailGenerator(
                api_key=config["openai_api_key"],
                model=config.get("openai_model", "gpt-4")
            )
        else:
            self.email_generator = None
            logger.warning("Email generator not initialized due to missing OpenAI API key")
        
        # Initialize Email Sender
        self.email_sender = EmailSender(
            credentials_store_path=config.get("credentials_store_path", "./credentials")
        )
        
        # Initialize database client if connection string is provided
        if config.get("supabase_url") and config.get("supabase_key"):
            self.db_client = SupabaseClient(
                url=config["supabase_url"],
                key=config["supabase_key"]
            )
        else:
            self.db_client = None
            logger.warning("Database client not initialized due to missing connection info")
        
        # Setup state
        self.gmail_setup = False
        self.outlook_setup = False
    
    async def setup_email_providers(self, gmail_credentials: Optional[Dict] = None, 
                                  outlook_credentials: Optional[Dict] = None) -> Dict[str, bool]:
        """
        Set up email providers for sending.
        
        Args:
            gmail_credentials: Gmail API credentials
            outlook_credentials: Microsoft Graph API credentials
            
        Returns:
            Dictionary with setup status for each provider
        """
        result = {
            "gmail": False,
            "outlook": False
        }
        
        # Setup Gmail
        if gmail_credentials:
            self.gmail_setup = await self.email_sender.setup_gmail(gmail_credentials)
            result["gmail"] = self.gmail_setup
            logger.info(f"Gmail setup {'successful' if self.gmail_setup else 'failed'}")
        
        # Setup Outlook
        if outlook_credentials:
            self.outlook_setup = await self.email_sender.setup_outlook(outlook_credentials)
            result["outlook"] = self.outlook_setup
            logger.info(f"Outlook setup {'successful' if self.outlook_setup else 'failed'}")
        
        return result
    
    async def generate_company_email(self, company_id: str, user_id: str) -> Dict[str, Any]:
        """
        Generate an email for company outreach.
        
        Args:
            company_id: Company ID in the database
            user_id: User ID for database records
            
        Returns:
            Result of email generation
        """
        if not self.email_generator:
            return {"success": False, "error": "Email generator not initialized"}
            
        if not self.db_client:
            return {"success": False, "error": "Database client not initialized"}
        
        try:
            # Get company data from database
            company_data = await self.db_client.get_company(company_id)
            if not company_data:
                return {"success": False, "error": "Company not found"}
            
            # Get user data for personalization
            user_data = await self.db_client.get_user(user_id)
            if not user_data:
                return {"success": False, "error": "User not found"}
            
            # Prepare user info for email generation
            user_info = {
                "name": user_data.get("display_name", ""),
                "company": user_data.get("company_name", ""),
                "role": user_data.get("job_title", ""),
                "offering": self.config.get("offering_description", "Our services")
            }
            
            # Generate the email
            email_data = await self.email_generator.generate_company_email(
                company_data=company_data,
                user_info=user_info
            )
            
            # Update the database with generated email
            if "error" not in email_data:
                await self.db_client.update_company(company_id, {
                    "ai_initial_company_email_subject": email_data.get("subject"),
                    "ai_initial_company_email_body": email_data.get("body")
                })
            
            return {
                "success": "error" not in email_data,
                "company_id": company_id,
                "email_data": email_data
            }
            
        except Exception as e:
            logger.error(f"Error generating company email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def generate_individual_email(self, contact_id: str, user_id: str) -> Dict[str, Any]:
        """
        Generate an email for individual contact outreach.
        
        Args:
            contact_id: Contact ID in the database
            user_id: User ID for database records
            
        Returns:
            Result of email generation
        """
        if not self.email_generator:
            return {"success": False, "error": "Email generator not initialized"}
            
        if not self.db_client:
            return {"success": False, "error": "Database client not initialized"}
        
        try:
            # Get contact data from database
            contact_data = await self.db_client.get_contact(contact_id)
            if not contact_data:
                return {"success": False, "error": "Contact not found"}
            
            # Get company data for context
            company_id = contact_data.get("company_id")
            company_data = await self.db_client.get_company(company_id) if company_id else {}
            
            # Get user data for personalization
            user_data = await self.db_client.get_user(user_id)
            if not user_data:
                return {"success": False, "error": "User not found"}
            
            # Prepare user info for email generation
            user_info = {
                "name": user_data.get("display_name", ""),
                "company": user_data.get("company_name", ""),
                "role": user_data.get("job_title", ""),
                "offering": self.config.get("offering_description", "Our services")
            }
            
            # Generate the email
            email_data = await self.email_generator.generate_individual_email(
                contact_data=contact_data,
                company_data=company_data,
                user_info=user_info
            )
            
            # Update the database with generated email
            if "error" not in email_data:
                await self.db_client.update_contact(contact_id, {
                    "ai_individual_email_subject": email_data.get("subject"),
                    "ai_individual_email_body": email_data.get("body")
                })
            
            return {
                "success": "error" not in email_data,
                "contact_id": contact_id,
                "email_data": email_data
            }
            
        except Exception as e:
            logger.error(f"Error generating individual email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def send_company_email(self, company_id: str, user_id: str, 
                               provider: str = "gmail") -> Dict[str, Any]:
        """
        Send a company outreach email.
        
        Args:
            company_id: Company ID in the database
            user_id: User ID for database records
            provider: Email provider ('gmail' or 'outlook')
            
        Returns:
            Result of email sending
        """
        if not self.db_client:
            return {"success": False, "error": "Database client not initialized"}
        
        # Check if provider is set up
        if provider.lower() == "gmail" and not self.gmail_setup:
            return {"success": False, "error": "Gmail not set up"}
        if provider.lower() in ["outlook", "microsoft"] and not self.outlook_setup:
            return {"success": False, "error": "Outlook not set up"}
        
        try:
            # Get company data from database
            company_data = await self.db_client.get_company(company_id)
            if not company_data:
                return {"success": False, "error": "Company not found"}
            
            # Get email content
            subject = company_data.get("ai_initial_company_email_subject")
            body = company_data.get("ai_initial_company_email_body")
            
            if not subject or not body:
                return {"success": False, "error": "Email not generated yet"}
            
            # Get recipient email
            # First try contact form URL
            recipient_email = None
            contact_form_url = company_data.get("scraped_website_contact_form_url")
            
            if not contact_form_url:
                # If no contact form, try to find a general contact email
                website_data = await self.db_client.get_website_data(company_id)
                if website_data and website_data.get("emails"):
                    recipient_email = website_data["emails"][0]  # Use first email
                else:
                    # If still no email, use a fallback like info@domain
                    domain = company_data.get("initial_website_url", "")
                    if domain:
                        domain = domain.replace('https://', '').replace('http://', '').split('/')[0]
                        recipient_email = f"info@{domain}"
            else:
                # TODO: In a real implementation, we might need to extract email from contact form
                # For now, we'll use a dummy email for demonstration
                domain = company_data.get("initial_website_url", "")
                if domain:
                    domain = domain.replace('https://', '').replace('http://', '').split('/')[0]
                    recipient_email = f"contact@{domain}"
            
            if not recipient_email:
                return {"success": False, "error": "No recipient email found"}
            
            # Get user data for personalization
            user_data = await self.db_client.get_user(user_id)
            from_name = user_data.get("display_name") if user_data else None
            
            # Send the email
            result = await self.email_sender.send_email(
                to=recipient_email,
                subject=subject,
                body=body,
                provider=provider,
                from_name=from_name
            )
            
            # Update database with send result
            if result.get("success"):
                # Update company record
                await self.db_client.update_company(company_id, {
                    "initial_email_sent_at": datetime.now().isoformat(),
                    "campaign_status": "Contacted"
                })
                
                # Log the email
                email_log = {
                    "user_id": user_id,
                    "company_id": company_id,
                    "email_type": "company_outreach",
                    "recipient_email": recipient_email,
                    "subject": subject,
                    "body": body,
                    "provider": provider,
                    "message_id": result.get("message_id"),
                    "status": "sent"
                }
                
                await self.db_client.insert_email_log(email_log)
            
            return {
                "success": result.get("success", False),
                "company_id": company_id,
                "recipient": recipient_email,
                "provider": provider,
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Error sending company email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def send_individual_email(self, contact_id: str, user_id: str,
                                  provider: str = "gmail") -> Dict[str, Any]:
        """
        Send an individual touchpoint email.
        
        Args:
            contact_id: Contact ID in the database
            user_id: User ID for database records
            provider: Email provider ('gmail' or 'outlook')
            
        Returns:
            Result of email sending
        """
        if not self.db_client:
            return {"success": False, "error": "Database client not initialized"}
        
        # Check if provider is set up
        if provider.lower() == "gmail" and not self.gmail_setup:
            return {"success": False, "error": "Gmail not set up"}
        if provider.lower() in ["outlook", "microsoft"] and not self.outlook_setup:
            return {"success": False, "error": "Outlook not set up"}
        
        try:
            # Get contact data from database
            contact_data = await self.db_client.get_contact(contact_id)
            if not contact_data:
                return {"success": False, "error": "Contact not found"}
            
            # Get email content
            subject = contact_data.get("ai_individual_email_subject")
            body = contact_data.get("ai_individual_email_body")
            
            if not subject or not body:
                return {"success": False, "error": "Email not generated yet"}
            
            # Get recipient email
            recipient_email = contact_data.get("email_primary")
            if not recipient_email:
                return {"success": False, "error": "No recipient email found"}
            
            # Get company data for context and database updates
            company_id = contact_data.get("company_id")
            
            # Get user data for personalization
            user_data = await self.db_client.get_user(user_id)
            from_name = user_data.get("display_name") if user_data else None
            
            # Send the email
            result = await self.email_sender.send_email(
                to=recipient_email,
                subject=subject,
                body=body,
                provider=provider,
                from_name=from_name
            )
            
            # Update database with send result
            if result.get("success"):
                # Update contact record
                await self.db_client.update_contact(contact_id, {
                    "last_touchpoint_sent_at": datetime.now().isoformat(),
                    "touchpoint_status": "Contacted",
                    "touchpoint_sequence_number": contact_data.get("touchpoint_sequence_number", 0) + 1
                })
                
                # Log the email
                email_log = {
                    "user_id": user_id,
                    "company_id": company_id,
                    "contact_id": contact_id,
                    "email_type": "individual_touchpoint",
                    "recipient_email": recipient_email,
                    "subject": subject,
                    "body": body,
                    "provider": provider,
                    "message_id": result.get("message_id"),
                    "status": "sent"
                }
                
                await self.db_client.insert_email_log(email_log)
            
            return {
                "success": result.get("success", False),
                "contact_id": contact_id,
                "recipient": recipient_email,
                "provider": provider,
                "result": result
            }
            
        except Exception as e:
            logger.error(f"Error sending individual email: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def execute_campaign_sequence(self, campaign_id: str, user_id: str) -> Dict[str, Any]:
        """
        Execute a campaign sequence with multiple touchpoints.
        
        Args:
            campaign_id: Campaign ID in the database
            user_id: User ID for database records
            
        Returns:
            Result of campaign execution
        """
        if not self.db_client:
            return {"success": False, "error": "Database client not initialized"}
        
        try:
            # Get campaign data
            campaign_data = await self.db_client.get_campaign(campaign_id)
            if not campaign_data:
                return {"success": False, "error": "Campaign not found"}
            
            # Get campaign prospects
            prospects = await self.db_client.get_campaign_prospects(campaign_id)
            if not prospects:
                return {"success": False, "error": "No prospects in campaign"}
            
            # Get sequence configuration
            sequence_config = campaign_data.get("sequence_config", {})
            steps = sequence_config.get("steps", [])
            if not steps:
                return {"success": False, "error": "No steps in sequence configuration"}
            
            # Get provider preference
            sender_preferences = sequence_config.get("sender_preferences", {})
            default_provider = sender_preferences.get("default", "gmail")
            
            # Execute each step for each prospect
            results = []
            for prospect in prospects:
                company_id = prospect.get("company_id")
                company = await self.db_client.get_company(company_id)
                if not company:
                    results.append({
                        "company_id": company_id,
                        "success": False,
                        "error": "Company not found"
                    })
                    continue
                
                # Get contacts for this company
                contacts = await self.db_client.get_contacts_by_company(company_id)
                
                # Process each step
                step_results = []
                for step in steps:
                    step_type = step.get("type")
                    day_offset = step.get("day", 0)
                    
                    # Calculate scheduled time (for reporting only in this example)
                    scheduled_time = datetime.now() + timedelta(days=day_offset)
                    
                    if step_type == "company_email":
                        # Company outreach
                        if day_offset == 0:  # Only execute immediately if day offset is 0
                            # Generate email if not already generated
                            if not company.get("ai_initial_company_email_subject"):
                                generate_result = await self.generate_company_email(company_id, user_id)
                                if not generate_result.get("success"):
                                    step_results.append({
                                        "step": step,
                                        "scheduled_time": scheduled_time.isoformat(),
                                        "status": "generation_failed",
                                        "result": generate_result
                                    })
                                    continue
                            
                            # Send the email
                            send_result = await self.send_company_email(
                                company_id=company_id,
                                user_id=user_id,
                                provider=default_provider
                            )
                            
                            step_results.append({
                                "step": step,
                                "scheduled_time": scheduled_time.isoformat(),
                                "status": "executed" if send_result.get("success") else "failed",
                                "result": send_result
                            })
                        else:
                            # Schedule for future execution
                            step_results.append({
                                "step": step,
                                "scheduled_time": scheduled_time.isoformat(),
                                "status": "scheduled"
                            })
                    
                    elif step_type == "individual_email":
                        # Individual touchpoint
                        contact_index = step.get("contact_index", 0)
                        
                        if contact_index < len(contacts):
                            contact = contacts[contact_index]
                            contact_id = contact.get("id")
                            
                            if day_offset == 0:  # Only execute immediately if day offset is 0
                                # Generate email if not already generated
                                if not contact.get("ai_individual_email_subject"):
                                    generate_result = await self.generate_individual_email(contact_id, user_id)
                                    if not generate_result.get("success"):
                                        step_results.append({
                                            "step": step,
                                            "scheduled_time": scheduled_time.isoformat(),
                                            "status": "generation_failed",
                                            "result": generate_result
                                        })
                                        continue
                                
                                # Send the email
                                send_result = await self.send_individual_email(
                                    contact_id=contact_id,
                                    user_id=user_id,
                                    provider=default_provider
                                )
                                
                                step_results.append({
                                    "step": step,
                                    "scheduled_time": scheduled_time.isoformat(),
                                    "status": "executed" if send_result.get("success") else "failed",
                                    "result": send_result
                                })
                            else:
                                # Schedule for future execution
                                step_results.append({
                                    "step": step,
                                    "scheduled_time": scheduled_time.isoformat(),
                                    "status": "scheduled"
                                })
                        else:
                            step_results.append({
                                "step": step,
                                "scheduled_time": scheduled_time.isoformat(),
                                "status": "skipped",
                                "reason": "Contact index out of range"
                            })
                
                # Add results for this prospect
                results.append({
                    "company_id": company_id,
                    "company_name": company.get("company_name"),
                    "success": True,
                    "steps": step_results
                })
                
                # Update campaign progress in database
                # In a real implementation, we would track which steps have been executed
                await self.db_client.update_campaign_prospect(
                    campaign_id=campaign_id,
                    company_id=company_id,
                    data={"status": "in_progress"}
                )
            
            # Update campaign status
            await self.db_client.update_campaign(
                campaign_id=campaign_id,
                data={"status": "active"}
            )
            
            return {
                "success": True,
                "campaign_id": campaign_id,
                "results": results
            }
            
        except Exception as e:
            logger.error(f"Error executing campaign sequence: {str(e)}")
            return {"success": False, "error": str(e)}

# Example configuration
sample_config = {
    "openai_api_key": "your_openai_api_key",
    "openai_model": "gpt-4",
    "supabase_url": "your_supabase_url",
    "supabase_key": "your_supabase_key",
    "offering_description": "AI-powered business automation solutions"
}

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Run email orchestration')
    parser.add_argument('--config', required=True, help='Path to config JSON file')
    parser.add_argument('--action', choices=['generate-company', 'generate-individual', 
                                            'send-company', 'send-individual', 
                                            'execute-campaign'], required=True,
                       help='Action to perform')
    parser.add_argument('--user-id', required=True, help='User ID for database records')
    parser.add_argument('--company-id', help='Company ID for company actions')
    parser.add_argument('--contact-id', help='Contact ID for individual actions')
    parser.add_argument('--campaign-id', help='Campaign ID for campaign execution')
    parser.add_argument('--provider', choices=['gmail', 'outlook'], default='gmail', 
                       help='Email provider for sending')
    parser.add_argument('--gmail-credentials', help='Path to Gmail credentials JSON file')
    parser.add_argument('--outlook-credentials', help='Path to Outlook credentials JSON file')
    
    args = parser.parse_args()
    
    async def main():
        # Load configuration
        with open(args.config, 'r') as f:
            config = json.load(f)
        
        # Initialize orchestrator
        orchestrator = EmailOrchestrator(config)
        
        # Set up email providers if credentials provided
        if args.gmail_credentials:
            with open(args.gmail_credentials, 'r') as f:
                gmail_creds = json.load(f)
            
        if args.outlook_credentials:
            with open(args.outlook_credentials, 'r') as f:
                outlook_creds = json.load(f)
            
        if args.gmail_credentials or args.outlook_credentials:
            setup_result = await orchestrator.setup_email_providers(
                gmail_credentials=gmail_creds if args.gmail_credentials else None,
                outlook_credentials=outlook_creds if args.outlook_credentials else None
            )
            print(f"Email provider setup: {setup_result}")
        
        # Perform the requested action
        if args.action == 'generate-company':
            if not args.company_id:
                print("Error: --company-id required for generate-company action")
                return
                
            result = await orchestrator.generate_company_email(args.company_id, args.user_id)
            print(json.dumps(result, indent=2))
            
        elif args.action == 'generate-individual':
            if not args.contact_id:
                print("Error: --contact-id required for generate-individual action")
                return
                
            result = await orchestrator.generate_individual_email(args.contact_id, args.user_id)
            print(json.dumps(result, indent=2))
            
        elif args.action == 'send-company':
            if not args.company_id:
                print("Error: --company-id required for send-company action")
                return
                
            result = await orchestrator.send_company_email(
                args.company_id, args.user_id, args.provider
            )
            print(json.dumps(result, indent=2))
            
        elif args.action == 'send-individual':
            if not args.contact_id:
                print("Error: --contact-id required for send-individual action")
                return
                
            result = await orchestrator.send_individual_email(
                args.contact_id, args.user_id, args.provider
            )
            print(json.dumps(result, indent=2))
            
        elif args.action == 'execute-campaign':
            if not args.campaign_id:
                print("Error: --campaign-id required for execute-campaign action")
                return
                
            result = await orchestrator.execute_campaign_sequence(args.campaign_id, args.user_id)
            print(json.dumps(result, indent=2))
    
    asyncio.run(main())