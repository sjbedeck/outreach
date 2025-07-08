#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Email Sender Module for Outreach Mate

This module handles sending emails through Gmail API and Microsoft Graph API,
supporting both company-level and individual-level outreach.

Author: Outreach Mate Team
Date: June 28, 2025
Version: 1.0.0
"""

import logging
import os
import time
import json
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import asyncio
from typing import Dict, List, Optional, Any, Union, Tuple

# Gmail API imports
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# Microsoft Graph imports
import msal
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmailSender:
    """
    Email sender for Outreach Mate.
    Supports sending via both Gmail and Outlook.
    """
    
    def __init__(self, credentials_store_path: str = "./credentials"):
        """
        Initialize the email sender.
        
        Args:
            credentials_store_path: Path to store credentials
        """
        self.credentials_store_path = credentials_store_path
        
        # Create credentials directory if it doesn't exist
        os.makedirs(self.credentials_store_path, exist_ok=True)
        
        # Initialize APIs
        self.gmail_service = None
        self.outlook_token = None
    
    async def setup_gmail(self, credentials_json: Union[str, Dict]) -> bool:
        """
        Setup Gmail API with provided credentials.
        
        Args:
            credentials_json: Path to credentials.json file or credentials dict
            
        Returns:
            True if setup successful, False otherwise
        """
        try:
            # Handle either file path or dict
            if isinstance(credentials_json, str):
                with open(credentials_json, 'r') as f:
                    creds_data = json.load(f)
            else:
                creds_data = credentials_json
            
            # Create credentials object
            creds = Credentials(
                token=creds_data.get('token'),
                refresh_token=creds_data.get('refresh_token'),
                token_uri=creds_data.get('token_uri'),
                client_id=creds_data.get('client_id'),
                client_secret=creds_data.get('client_secret'),
                scopes=creds_data.get('scopes', ['https://www.googleapis.com/auth/gmail.send'])
            )
            
            # Build Gmail API service
            self.gmail_service = build('gmail', 'v1', credentials=creds)
            
            logger.info("Gmail API setup successful")
            return True
            
        except Exception as e:
            logger.error(f"Error setting up Gmail API: {str(e)}")
            return False
    
    async def setup_outlook(self, credentials: Dict[str, str]) -> bool:
        """
        Setup Microsoft Graph API with provided credentials.
        
        Args:
            credentials: Dictionary with client_id, client_secret, tenant_id, and access_token
            
        Returns:
            True if setup successful, False otherwise
        """
        try:
            # Check if we have a valid access token
            if credentials.get('access_token'):
                self.outlook_token = credentials.get('access_token')
                
                # TODO: Add token validation logic
                
                logger.info("Microsoft Graph API setup successful (using provided token)")
                return True
                
            # Otherwise, try to get a new token
            client_id = credentials.get('client_id')
            client_secret = credentials.get('client_secret')
            tenant_id = credentials.get('tenant_id')
            refresh_token = credentials.get('refresh_token')
            
            if not all([client_id, client_secret, tenant_id, refresh_token]):
                logger.error("Missing required Outlook credentials")
                return False
                
            # Set up MSAL app
            app = msal.ConfidentialClientApplication(
                client_id=client_id,
                client_credential=client_secret,
                authority=f"https://login.microsoftonline.com/{tenant_id}"
            )
            
            # Try to get token from refresh token
            result = app.acquire_token_by_refresh_token(
                refresh_token=refresh_token,
                scopes=["https://graph.microsoft.com/.default"]
            )
            
            if "access_token" in result:
                self.outlook_token = result["access_token"]
                logger.info("Microsoft Graph API setup successful")
                return True
            else:
                logger.error(f"Error getting token: {result.get('error_description', 'Unknown error')}")
                return False
                
        except Exception as e:
            logger.error(f"Error setting up Microsoft Graph API: {str(e)}")
            return False
    
    async def send_email_gmail(self, to: str, subject: str, body: str, 
                              from_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Send email using Gmail API.
        
        Args:
            to: Recipient email
            subject: Email subject
            body: Email body (HTML)
            from_name: Optional sender name
            
        Returns:
            Dictionary with send result
        """
        if not self.gmail_service:
            return {"success": False, "error": "Gmail API not set up"}
            
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["To"] = to
            message["Subject"] = subject
            
            if from_name:
                # From header will still use authenticated user's email
                message["From"] = from_name
                
            # Attach plain text and HTML parts
            text_part = MIMEText(body, "plain")
            html_part = MIMEText(body, "html")
            message.attach(text_part)
            message.attach(html_part)
            
            # Encode the message
            encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
            
            # Create the message dict
            message_dict = {
                "raw": encoded_message
            }
            
            # Send the message
            sent_message = self.gmail_service.users().messages().send(
                userId="me", 
                body=message_dict
            ).execute()
            
            logger.info(f"Email sent via Gmail. Message ID: {sent_message['id']}")
            
            return {
                "success": True,
                "message_id": sent_message['id'],
                "provider": "gmail",
                "sent_at": time.time()
            }
            
        except HttpError as e:
            logger.error(f"Gmail API error: {str(e)}")
            return {
                "success": False,
                "error": f"Gmail API error: {str(e)}",
                "provider": "gmail"
            }
            
        except Exception as e:
            logger.error(f"Error sending email via Gmail: {str(e)}")
            return {
                "success": False,
                "error": f"Error sending email via Gmail: {str(e)}",
                "provider": "gmail"
            }
    
    async def send_email_outlook(self, to: str, subject: str, body: str,
                               from_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Send email using Microsoft Graph API.
        
        Args:
            to: Recipient email
            subject: Email subject
            body: Email body (HTML)
            from_name: Optional sender name
            
        Returns:
            Dictionary with send result
        """
        if not self.outlook_token:
            return {"success": False, "error": "Microsoft Graph API not set up"}
            
        try:
            # Prepare the email message
            message = {
                "message": {
                    "subject": subject,
                    "body": {
                        "contentType": "HTML",
                        "content": body
                    },
                    "toRecipients": [
                        {
                            "emailAddress": {
                                "address": to
                            }
                        }
                    ]
                }
            }
            
            # Add sender name if provided
            if from_name:
                message["message"]["from"] = {
                    "emailAddress": {
                        "name": from_name
                    }
                }
            
            # Send the message
            headers = {
                "Authorization": f"Bearer {self.outlook_token}",
                "Content-Type": "application/json"
            }
            
            response = requests.post(
                "https://graph.microsoft.com/v1.0/me/sendMail",
                headers=headers,
                json=message,
                timeout=30
            )
            
            if response.status_code == 202:  # 202 Accepted
                logger.info(f"Email sent via Outlook. Status: {response.status_code}")
                
                return {
                    "success": True,
                    "message_id": response.headers.get("request-id", "unknown"),
                    "provider": "outlook",
                    "sent_at": time.time()
                }
            else:
                error_detail = response.json() if response.text else {"error": "Unknown error"}
                logger.error(f"Microsoft Graph API error: {response.status_code} - {error_detail}")
                
                return {
                    "success": False,
                    "error": f"Microsoft Graph API error: {response.status_code}",
                    "error_detail": error_detail,
                    "provider": "outlook"
                }
                
        except Exception as e:
            logger.error(f"Error sending email via Outlook: {str(e)}")
            return {
                "success": False,
                "error": f"Error sending email via Outlook: {str(e)}",
                "provider": "outlook"
            }
    
    async def send_email(self, to: str, subject: str, body: str,
                        provider: str = "gmail", from_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Send email using the specified provider.
        
        Args:
            to: Recipient email
            subject: Email subject
            body: Email body
            provider: 'gmail' or 'outlook'
            from_name: Optional sender name
            
        Returns:
            Dictionary with send result
        """
        if provider.lower() == "gmail":
            return await self.send_email_gmail(to, subject, body, from_name)
        elif provider.lower() in ["outlook", "microsoft"]:
            return await self.send_email_outlook(to, subject, body, from_name)
        else:
            return {
                "success": False,
                "error": f"Unsupported email provider: {provider}"
            }

# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Send test email')
    parser.add_argument('--to', required=True, help='Recipient email address')
    parser.add_argument('--subject', default='Test Email from Outreach Mate', help='Email subject')
    parser.add_argument('--body', default='This is a test email from Outreach Mate.', help='Email body')
    parser.add_argument('--provider', choices=['gmail', 'outlook'], default='gmail', help='Email provider')
    parser.add_argument('--credentials', required=True, help='Path to credentials JSON file')
    
    args = parser.parse_args()
    
    async def main():
        sender = EmailSender()
        
        # Load credentials
        with open(args.credentials, 'r') as f:
            credentials = json.load(f)
        
        # Setup provider
        setup_success = False
        if args.provider == 'gmail':
            setup_success = await sender.setup_gmail(credentials)
        else:
            setup_success = await sender.setup_outlook(credentials)
        
        if not setup_success:
            print(f"Failed to set up {args.provider.capitalize()}")
            return
        
        # Send email
        result = await sender.send_email(
            to=args.to,
            subject=args.subject,
            body=args.body,
            provider=args.provider,
            from_name="Outreach Mate Test"
        )
        
        print(f"Send result: {result}")
    
    asyncio.run(main())